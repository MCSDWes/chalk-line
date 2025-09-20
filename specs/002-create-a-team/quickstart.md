# Quickstart Guide: Team and Player Management Implementation

**Phase**: 1 - Design & Contracts  
**Date**: 2025-09-19  
**Status**: Complete

## Overview

This quickstart guide provides step-by-step instructions for implementing the team and player management system. Follow this guide to set up the foundation for the Baseball Scorekeeping App.

## Prerequisites

Before starting implementation, ensure you have:

✅ **Project Setup**:
- React + TypeScript project initialized with Vite
- TailwindCSS configured
- Shadcn/ui components installed

✅ **Dependencies Installed**:
```powershell
npm install @tanstack/react-router @tanstack/react-query
npm install convex @clerk/clerk-react
npm install zod react-hook-form @hookform/resolvers
npm install date-fns lucide-react
```

✅ **Services Configured**:
- Clerk authentication project created
- Convex project initialized
- Environment variables set

## Implementation Phases

### Phase 1: Database Schema (Convex)

#### 1.1 Create Schema Files

**File**: `convex/schema.ts`
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const Position = v.union(
  v.literal("P"), v.literal("C"), v.literal("1B"), v.literal("2B"),
  v.literal("3B"), v.literal("SS"), v.literal("LF"), v.literal("CF"),
  v.literal("RF"), v.literal("DH")
);

export default defineSchema({
  teams: defineTable({
    userId: v.string(), // Clerk user ID
    name: v.string(),
    season: v.string(),
  })
  .index("by_user", ["userId"])
  .index("by_user_name_season", ["userId", "name", "season"]),

  players: defineTable({
    firstName: v.string(),
    lastNameInitial: v.string(),
  })
  .index("by_firstName", ["firstName"])
  .index("by_firstName_initial", ["firstName", "lastNameInitial"]),

  playerTeamRoster: defineTable({
    playerId: v.id("players"),
    teamId: v.id("teams"),
    jerseyNumber: v.number(),
    primaryPosition: Position,
    secondaryPositions: v.array(Position),
    isActive: v.boolean(),
    joinedAt: v.number(), // timestamp
    leftAt: v.optional(v.number()), // timestamp
  })
  .index("by_team", ["teamId"])
  .index("by_player", ["playerId"])
  .index("by_team_active", ["teamId", "isActive"])
  .index("by_team_jersey", ["teamId", "jerseyNumber", "isActive"]),
});
```

#### 1.2 Deploy Schema
```powershell
npx convex deploy
```

### Phase 2: API Layer (Convex Functions)

#### 2.1 Team Management Functions

**File**: `convex/teams.ts`
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create team
export const createTeam = mutation({
  args: {
    name: v.string(),
    season: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Check for duplicate team
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_user_name_season", (q) =>
        q.eq("userId", identity.subject)
         .eq("name", args.name)
         .eq("season", args.season)
      )
      .first();

    if (existingTeam) {
      throw new Error("Team with this name already exists for this season");
    }

    return await ctx.db.insert("teams", {
      userId: identity.subject,
      name: args.name,
      season: args.season,
    });
  },
});

// Get user's teams
export const getUserTeams = query({
  args: {
    season: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let query = ctx.db
      .query("teams")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject));

    const teams = await query.collect();

    // Filter by season if provided
    const filteredTeams = args.season 
      ? teams.filter(team => team.season === args.season)
      : teams;

    // Add player count for each team
    const teamsWithCounts = await Promise.all(
      filteredTeams.map(async (team) => {
        const activeRoster = await ctx.db
          .query("playerTeamRoster")
          .withIndex("by_team_active", (q) =>
            q.eq("teamId", team._id).eq("isActive", true)
          )
          .collect();

        return {
          ...team,
          playerCount: activeRoster.length,
        };
      })
    );

    return teamsWithCounts;
  },
});

// Get team with roster
export const getTeamWithRoster = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const team = await ctx.db.get(args.teamId);
    if (!team || team.userId !== identity.subject) {
      throw new Error("Team not found");
    }

    const roster = await ctx.db
      .query("playerTeamRoster")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

        const rosterWithPlayers = await Promise.all(
          roster.map(async (rosterEntry) => {
            const player = await ctx.db.get(rosterEntry.playerId);
            return {
              ...rosterEntry,
              player: {
                ...player,
                displayName: `${player?.firstName} ${player?.lastNameInitial}.`,
              },
            };
          })
        );    return {
      ...team,
      roster: rosterWithPlayers,
    };
  },
});
```

#### 2.2 Player Management Functions

**File**: `convex/players.ts`
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create player
export const createPlayer = mutation({
  args: {
    firstName: v.string(),
    lastNameInitial: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Check for duplicate player name combination
    const existingPlayer = await ctx.db
      .query("players")
      .withIndex("by_firstName_initial", (q) => 
        q.eq("firstName", args.firstName).eq("lastNameInitial", args.lastNameInitial))
      .first();

    if (existingPlayer) {
      throw new Error("Player with this name already exists");
    }

    return await ctx.db.insert("players", {
      firstName: args.firstName,
      lastNameInitial: args.lastNameInitial,
    });
  },
});

// Search players
export const searchPlayers = query({
  args: {
    firstName: v.optional(v.string()),
    lastNameInitial: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let players = await ctx.db.query("players").collect();

    // Filter by firstName if provided
    if (args.firstName) {
      const searchTerm = args.firstName.toLowerCase();
      players = players.filter(player => 
        player.firstName.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by lastNameInitial if provided
    if (args.lastNameInitial) {
      const initial = args.lastNameInitial.toUpperCase();
      players = players.filter(player => 
        player.lastNameInitial === initial
      );
    }

    // Add current teams for each player and create display name
    const playersWithTeams = await Promise.all(
      players.map(async (player) => {
        const activeRosters = await ctx.db
          .query("playerTeamRoster")
          .withIndex("by_player", (q) => q.eq("playerId", player._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect();

        const currentTeams = await Promise.all(
          activeRosters.map(async (roster) => {
            const team = await ctx.db.get(roster.teamId);
            return {
              teamId: roster.teamId,
              teamName: team?.name || "Unknown",
              season: team?.season || "Unknown",
              jerseyNumber: roster.jerseyNumber,
            };
          })
        );

        return {
          ...player,
          displayName: `${player.firstName} ${player.lastNameInitial}.`,
          currentTeams,
        };
      })
    );

    return playersWithTeams;
  },
});
```

#### 2.3 Roster Management Functions

**File**: `convex/roster.ts`
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Position } from "./schema";

// Add player to team
export const addPlayerToTeam = mutation({
  args: {
    teamId: v.id("teams"),
    playerId: v.id("players"),
    jerseyNumber: v.number(),
    primaryPosition: Position,
    secondaryPositions: v.optional(v.array(Position)),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify team ownership
    const team = await ctx.db.get(args.teamId);
    if (!team || team.userId !== identity.subject) {
      throw new Error("Team not found");
    }

    // Check if jersey number is available
    const existingJersey = await ctx.db
      .query("playerTeamRoster")
      .withIndex("by_team_jersey", (q) =>
        q.eq("teamId", args.teamId)
         .eq("jerseyNumber", args.jerseyNumber)
         .eq("isActive", true)
      )
      .first();

    if (existingJersey) {
      throw new Error("Jersey number already taken");
    }

    // Check if player is already on team
    const existingRoster = await ctx.db
      .query("playerTeamRoster")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.and(
        q.eq(q.field("playerId"), args.playerId),
        q.eq(q.field("isActive"), true)
      ))
      .first();

    if (existingRoster) {
      throw new Error("Player is already on this team");
    }

    return await ctx.db.insert("playerTeamRoster", {
      teamId: args.teamId,
      playerId: args.playerId,
      jerseyNumber: args.jerseyNumber,
      primaryPosition: args.primaryPosition,
      secondaryPositions: args.secondaryPositions || [],
      isActive: true,
      joinedAt: Date.now(),
    });
  },
});

// Remove player from team
export const removePlayerFromTeam = mutation({
  args: {
    teamId: v.id("teams"),
    rosterId: v.id("playerTeamRoster"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify team ownership
    const team = await ctx.db.get(args.teamId);
    if (!team || team.userId !== identity.subject) {
      throw new Error("Team not found");
    }

    // Get roster entry
    const rosterEntry = await ctx.db.get(args.rosterId);
    if (!rosterEntry || rosterEntry.teamId !== args.teamId) {
      throw new Error("Roster entry not found");
    }

    // Mark as inactive
    await ctx.db.patch(args.rosterId, {
      isActive: false,
      leftAt: Date.now(),
    });

    return { success: true };
  },
});
```

### Phase 3: Frontend Components

#### 3.1 Data Types and Validation

**File**: `src/types/team.ts`
```typescript
import { z } from "zod";

export const PositionSchema = z.enum(['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']);
export type Position = z.infer<typeof PositionSchema>;

export const CreateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(50, "Team name too long"),
  season: z.string().min(1, "Season is required").max(20, "Season too long"),
});

export const CreatePlayerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastNameInitial: z.string().length(1, "Last name initial must be one letter").regex(/^[A-Z]$/, "Must be uppercase letter"),
});

export const AddPlayerToTeamSchema = z.object({
  playerId: z.string(),
  jerseyNumber: z.number().min(1).max(99),
  primaryPosition: PositionSchema,
  secondaryPositions: z.array(PositionSchema).optional(),
});

export type CreateTeamForm = z.infer<typeof CreateTeamSchema>;
export type CreatePlayerForm = z.infer<typeof CreatePlayerSchema>;
export type AddPlayerToTeamForm = z.infer<typeof AddPlayerToTeamSchema>;
```

#### 3.2 Team List Component

**File**: `src/components/teams/TeamList.tsx`
```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Users } from "lucide-react";

export function TeamList() {
  const teams = useQuery(api.teams.getUserTeams);

  if (teams === undefined) {
    return <div>Loading teams...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Teams</h2>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team._id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {team.name}
                <Users className="w-5 h-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{team.season}</p>
              <p className="text-sm">
                {team.playerCount} {team.playerCount === 1 ? 'player' : 'players'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

#### 3.3 Create Team Form

**File**: `src/components/teams/CreateTeamForm.tsx`
```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CreateTeamSchema, CreateTeamForm } from "../../types/team";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface CreateTeamFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamForm({ open, onOpenChange }: CreateTeamFormProps) {
  const createTeam = useMutation(api.teams.createTeam);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateTeamForm>({
    resolver: zodResolver(CreateTeamSchema),
    defaultValues: {
      name: "",
      season: "",
    },
  });

  const onSubmit = async (data: CreateTeamForm) => {
    try {
      setIsSubmitting(true);
      await createTeam(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create team:", error);
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Eagles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="season"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Season</FormLabel>
                  <FormControl>
                    <Input placeholder="2025 Spring" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

#### 3.4 Create Player Form

**File**: `src/components/players/CreatePlayerForm.tsx`
```typescript
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { CreatePlayerSchema, CreatePlayerForm } from "../../types/team";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface CreatePlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlayerForm({ open, onOpenChange }: CreatePlayerFormProps) {
  const createPlayer = useMutation(api.players.createPlayer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePlayerForm>({
    resolver: zodResolver(CreatePlayerSchema),
    defaultValues: {
      firstName: "",
      lastNameInitial: "",
    },
  });

  const onSubmit = async (data: CreatePlayerForm) => {
    try {
      setIsSubmitting(true);
      await createPlayer(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create player:", error);
      // Handle error (show toast, etc.)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Player</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastNameInitial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name Initial</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="D" 
                      maxLength={1}
                      className="w-16"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Privacy protection: Only first name and last initial stored
                  </p>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Player"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Phase 4: Routing and Integration

#### 4.1 Add Routes

**File**: `src/routes/teams.tsx`
```typescript
import { createFileRoute } from '@tanstack/react-router';
import { TeamList } from '../components/teams/TeamList';

export const Route = createFileRoute('/teams')({
  component: TeamsPage,
});

function TeamsPage() {
  return (
    <div className="container mx-auto py-6">
      <TeamList />
    </div>
  );
}
```

#### 4.2 Add Navigation

Update your main navigation to include a link to the teams page:

```typescript
<Link to="/teams" className="nav-link">
  Teams
</Link>
```

## Testing Strategy

### Unit Tests
- Test form validation with invalid data
- Test API functions with mock Convex context
- Test component rendering with mock data

### Integration Tests
- Test complete team creation flow
- Test player roster management flow
- Test authentication integration

### Manual Testing Checklist

#### Team Management
- [ ] Create team with valid data
- [ ] Create team with duplicate name/season (should fail)
- [ ] View team list
- [ ] View team details with roster

#### Player Management
- [ ] Create new player
- [ ] Search existing players
- [ ] Add player to team with valid jersey number
- [ ] Add player with taken jersey number (should fail)
- [ ] Remove player from team

#### Authentication
- [ ] All functions require authentication
- [ ] Users can only access their own teams
- [ ] Proper error handling for unauthorized access

## Deployment Checklist

### Pre-deployment
- [ ] All TypeScript errors resolved
- [ ] Database schema deployed to Convex
- [ ] Environment variables configured
- [ ] Clerk authentication configured

### Post-deployment
- [ ] Test authentication flow
- [ ] Verify database operations
- [ ] Test responsive design on tablet
- [ ] Validate offline functionality (if implemented)

## Next Steps

After completing this implementation:

1. **Run Phase 2**: Execute `/tasks` command to generate actionable development tasks
2. **Add Statistics**: Extend data model for game statistics
3. **Implement Games**: Add game scheduling and scorekeeping
4. **Offline Sync**: Implement TanStack Query with offline persistence
5. **PWA Features**: Add service worker for offline functionality

---

**Quickstart Status**: ✅ Complete - Ready for development  
**Next Phase**: Execute `/tasks` command for actionable implementation tasks