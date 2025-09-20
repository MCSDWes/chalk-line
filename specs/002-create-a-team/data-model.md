# Data Model: Team and Player Management System

**Phase**: 1 - Design & Contracts  
**Date**: 2025-09-19  
**Status**: Complete

## Entity Definitions

### User
**Purpose**: Represents a coach or manager who creates and manages teams

**Attributes**:
- `id: string` - Clerk user ID (primary key)
- `email: string` - User email from Clerk authentication
- `name?: string` - Optional display name from Clerk profile
- `createdAt: Date` - Account creation timestamp
- `updatedAt: Date` - Last profile update timestamp

**Validation Rules**:
- `id` must be valid Clerk user ID format
- `email` must be valid email format
- All timestamps must be valid dates

**Relationships**:
- One-to-many with Team (user can manage multiple teams)

### Team
**Purpose**: Represents a baseball team for a specific season

**Attributes**:
- `id: string` - UUID primary key
- `userId: string` - Foreign key to User (team owner)
- `name: string` - Team name (e.g., "Eagles", "Red Sox")
- `season: string` - Season identifier (e.g., "2025 Spring", "Fall 2024")
- `createdAt: Date` - Team creation timestamp
- `updatedAt: Date` - Last team modification timestamp

**Validation Rules**:
- `name` must be 1-50 characters, alphanumeric and spaces
- `season` must be 1-20 characters
- Combination of `userId + name + season` must be unique
- `userId` must reference existing User

**Relationships**:
- Many-to-one with User (belongs to one user)
- One-to-many with PlayerTeamRoster (has multiple player assignments)

### Player
**Purpose**: Represents an individual baseball player (global entity, can play for multiple teams)

**Attributes**:
- `id: string` - UUID primary key
- `firstName: string` - Player's first name
- `lastNameInitial: string` - Player's last name initial (single letter)
- `createdAt: Date` - Player record creation timestamp
- `updatedAt: Date` - Last player information update

**Validation Rules**:
- `firstName` must be 1-50 characters, letters, spaces, hyphens, apostrophes only
- `lastNameInitial` must be exactly 1 character, letter only (A-Z)
- All timestamps must be valid dates
- **Privacy Compliance**: Only first name and last initial stored to protect minor privacy

**Relationships**:
- One-to-many with PlayerTeamRoster (can be on multiple teams)

### PlayerTeamRoster
**Purpose**: Junction entity linking players to teams with team-specific information

**Attributes**:
- `id: string` - UUID primary key
- `playerId: string` - Foreign key to Player
- `teamId: string` - Foreign key to Team
- `jerseyNumber: number` - Player's jersey number on this team
- `primaryPosition: Position` - Player's primary position on this team
- `secondaryPositions: Position[]` - Additional positions player can play
- `isActive: boolean` - Whether player is currently active on roster
- `joinedAt: Date` - When player joined this team
- `leftAt?: Date` - When player left team (if inactive)
- `createdAt: Date` - Record creation timestamp
- `updatedAt: Date` - Last roster record update

**Validation Rules**:
- `playerId` must reference existing Player
- `teamId` must reference existing Team
- `jerseyNumber` must be 1-99 for baseball
- `jerseyNumber` must be unique within team scope (`teamId + jerseyNumber` unique)
- `primaryPosition` must be valid baseball position
- `secondaryPositions` must contain valid baseball positions only
- `joinedAt` must be valid date
- `leftAt` must be after `joinedAt` if provided

**Relationships**:
- Many-to-one with Player (roster entry belongs to one player)
- Many-to-one with Team (roster entry belongs to one team)

## Enumerated Types

### Position
**Valid Values**:
- `P` - Pitcher
- `C` - Catcher
- `1B` - First Base
- `2B` - Second Base
- `3B` - Third Base
- `SS` - Shortstop
- `LF` - Left Field
- `CF` - Center Field
- `RF` - Right Field
- `DH` - Designated Hitter

## Database Schema (TypeScript/Zod)

```typescript
import { z } from 'zod';

// Enums
export const PositionSchema = z.enum(['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']);
export type Position = z.infer<typeof PositionSchema>;

// User Schema (managed by Clerk, referenced only)
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Team Schema
export const TeamSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s]+$/),
  season: z.string().min(1).max(20),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Player Schema
export const PlayerSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1).max(50).regex(/^[a-zA-Z\s\-']+$/),
  lastNameInitial: z.string().length(1).regex(/^[A-Z]$/),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// PlayerTeamRoster Schema
export const PlayerTeamRosterSchema = z.object({
  id: z.string().uuid(),
  playerId: z.string().uuid(),
  teamId: z.string().uuid(),
  jerseyNumber: z.number().int().min(1).max(99),
  primaryPosition: PositionSchema,
  secondaryPositions: z.array(PositionSchema),
  isActive: z.boolean(),
  joinedAt: z.date(),
  leftAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type PlayerTeamRoster = z.infer<typeof PlayerTeamRosterSchema>;
```

## Data Relationships

### Entity Relationship Diagram
```
User (1) ----< Team (M)
              |
              |
              v
Player (M) >--< PlayerTeamRoster (M) >-- Team (1)
```

### Key Constraints
1. **Unique Jersey Numbers**: Each team can have only one player with a given jersey number
2. **Team Ownership**: Only team owner (User) can modify team roster
3. **Player Persistence**: Players exist independently and can join multiple teams
4. **Active Status**: Players can be marked inactive but remain in historical records

## Query Patterns

### Common Queries
1. **Get User's Teams**: `Teams.filter(team => team.userId === userId)`
2. **Get Team Roster**: `PlayerTeamRoster.filter(roster => roster.teamId === teamId && roster.isActive === true)`
3. **Get Player's Teams**: `PlayerTeamRoster.filter(roster => roster.playerId === playerId && roster.isActive === true)`
4. **Check Jersey Availability**: `PlayerTeamRoster.find(roster => roster.teamId === teamId && roster.jerseyNumber === number && roster.isActive === true)`
5. **Get Player by Position**: `PlayerTeamRoster.filter(roster => roster.teamId === teamId && (roster.primaryPosition === position || roster.secondaryPositions.includes(position)))`
6. **Search Players by Name**: `Players.filter(player => player.firstName.toLowerCase().includes(searchTerm) || player.lastNameInitial.toLowerCase() === searchTerm)`

### Performance Considerations
- Index on `teamId` for roster queries
- Index on `playerId` for player team lookups
- Index on `userId` for user team queries
- Compound index on `teamId + jerseyNumber` for uniqueness checking
- Compound index on `teamId + isActive` for active roster queries

## Data Migration Strategy

### Initial Setup
1. Create User records from Clerk authentication
2. Seed Position enum values
3. Set up unique constraints and indexes

### Future Migrations
- Add new Position types if baseball rules change
- Add statistics tables (linked to PlayerTeamRoster)
- Add season management features
- Add team-level configuration options

---

**Data Model Status**: ✅ Complete - Ready for contract generation  
**Next Step**: Generate API contracts from this data model