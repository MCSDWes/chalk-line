import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Teams API Functions with Clerk Authentication
 * 
 * These functions implement team management with:
 * - Clerk user authentication via ctx.auth.getUserIdentity()
 * - Business rule enforcement (unique team names per user/season)
 * - Input validation and error handling
 * - Privacy-compliant data handling
 */

/**
 * Get all teams for the authenticated user
 */
export const getUserTeams = query({
  args: {
    season: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    let query = ctx.db
      .query("teams")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.or(
            q.eq(q.field("isDeleted"), undefined),
            q.eq(q.field("isDeleted"), false)
          ),
          q.or(
            q.eq(q.field("isArchived"), undefined),
            q.eq(q.field("isArchived"), false)
          )
        )
      );

    if (args.season) {
      query = query.filter((q) => q.eq(q.field("season"), args.season));
    }

    return await query.order("desc").collect();
  },
});

/**
 * Get deleted teams for the authenticated user
 */
export const getDeletedTeams = query({
  args: {
    season: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    let query = ctx.db
      .query("teams")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("isDeleted"), true)
        )
      );

    if (args.season) {
      query = query.filter((q) => q.eq(q.field("season"), args.season));
    }

    return await query.order("desc").collect();
  },
});

/**
 * Create a new team
 */
export const createTeam = mutation({
  args: {
    name: v.string(),
    season: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Validate team name
    if (!args.name || args.name.trim().length === 0) {
      throw new Error('Team name is required');
    }

    if (args.name.length > 50) {
      throw new Error('Team name must be 50 characters or less');
    }

    // Validate season format
    if (!args.season || args.season.trim().length === 0) {
      throw new Error('Season is required');
    }

    // Check for duplicate team names
    const existingTeam = await ctx.db
      .query("teams")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("name"), args.name.trim()),
          q.eq(q.field("season"), args.season),
          q.or(
            q.eq(q.field("isDeleted"), undefined),
            q.eq(q.field("isDeleted"), false)
          )
        )
      )
      .first();

    if (existingTeam) {
      throw new Error('Team with this name already exists for this season');
    }

    // Create the team
    const teamId = await ctx.db.insert("teams", {
      userId: userId,
      name: args.name.trim(),
      season: args.season,
    });

    return teamId;
  },
});

/**
 * Update an existing team
 */
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    updates: v.object({
      name: v.optional(v.string()),
      season: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Get the team and verify ownership
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    if (team.userId !== userId) {
      throw new Error('Not authorized to update this team');
    }

    if (team.isDeleted) {
      throw new Error('Cannot update deleted team');
    }

    // Validate updates
    const updates: any = {};

    if (args.updates.name !== undefined) {
      if (!args.updates.name || args.updates.name.trim().length === 0) {
        throw new Error('Team name cannot be empty');
      }
      if (args.updates.name.length > 50) {
        throw new Error('Team name must be 50 characters or less');
      }
      updates.name = args.updates.name.trim();
    }

    if (args.updates.season !== undefined) {
      if (!args.updates.season || args.updates.season.trim().length === 0) {
        throw new Error('Season cannot be empty');
      }
      updates.season = args.updates.season;
    }

    // Check for duplicate if name or season is being updated
    if (updates.name || updates.season) {
      const checkName = updates.name || team.name;
      const checkSeason = updates.season || team.season;

      const existingTeam = await ctx.db
        .query("teams")
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), userId),
            q.eq(q.field("name"), checkName),
            q.eq(q.field("season"), checkSeason),
            q.neq(q.field("_id"), args.teamId),
            q.or(
              q.eq(q.field("isDeleted"), undefined),
              q.eq(q.field("isDeleted"), false)
            )
          )
        )
        .first();

      if (existingTeam) {
        throw new Error('Team with this name already exists for this season');
      }
    }

    // Apply updates
    await ctx.db.patch(args.teamId, updates);
    
    return args.teamId;
  },
});

/**
 * Soft delete a team
 */
export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Get the team and verify ownership
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    if (team.userId !== userId) {
      throw new Error('Not authorized to delete this team');
    }

    if (team.isDeleted) {
      throw new Error('Team is already deleted');
    }

    // Soft delete
    await ctx.db.patch(args.teamId, {
      isDeleted: true,
      deletedAt: Date.now(),
    });

    return args.teamId;
  },
});

/**
 * Restore a deleted team
 */
export const restoreTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Get the team and verify ownership
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    if (team.userId !== userId) {
      throw new Error('Not authorized to restore this team');
    }

    if (!team.isDeleted) {
      throw new Error('Team is not deleted');
    }

    // Check for name conflicts before restoring
    const existingTeam = await ctx.db
      .query("teams")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("name"), team.name),
          q.eq(q.field("season"), team.season),
          q.neq(q.field("_id"), args.teamId),
          q.or(
            q.eq(q.field("isDeleted"), undefined),
            q.eq(q.field("isDeleted"), false)
          )
        )
      )
      .first();

    if (existingTeam) {
      throw new Error('Cannot restore: team with this name already exists for this season');
    }

    // Restore the team
    await ctx.db.patch(args.teamId, {
      isDeleted: false,
      deletedAt: undefined,
    });

    return args.teamId;
  },
});

/**
 * Archive a team
 */
export const archiveTeam = mutation({
  args: {
    teamId: v.id("teams"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Get the team and verify ownership
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    if (team.userId !== userId) {
      throw new Error('Not authorized to archive this team');
    }

    if (team.isDeleted) {
      throw new Error('Cannot archive deleted team');
    }

    if (team.isArchived) {
      throw new Error('Team is already archived');
    }

    // Archive the team
    await ctx.db.patch(args.teamId, {
      isArchived: true,
      archivedAt: Date.now(),
      archivalReason: args.reason,
    });

    return args.teamId;
  },
});

/**
 * Get archived teams for the authenticated user
 */
export const getArchivedTeams = query({
  args: {
    season: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    let query = ctx.db
      .query("teams")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), userId),
          q.eq(q.field("isArchived"), true)
        )
      );

    if (args.season) {
      query = query.filter((q) => q.eq(q.field("season"), args.season));
    }

    return await query.order("desc").collect();
  },
});

/**
 * Export team data for the authenticated user
 */
export const exportTeamData = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Get the team and verify ownership
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    if (team.userId !== userId) {
      throw new Error('Not authorized to export this team');
    }

    // Get related data (players, rosters, etc.)
    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .collect();

    const lineups = await ctx.db
      .query("lineups")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .collect();

    return {
      metadata: {
        exportDate: new Date().toISOString(),
        exportVersion: "1.0",
        source: "ChalkLine Baseball App",
      },
      team: {
        teamId: args.teamId,
        ...team,
      },
      players,
      lineups,
      statistics: {
        totalPlayers: players.length,
        totalLineups: lineups.length,
      },
    };
  },
});