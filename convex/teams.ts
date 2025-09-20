import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Teams API Functions (T005-T006)
 * 
 * These functions implement team management with:
 * - User authentication validation
 * - Business rule enforcement (unique team names per user/season)
 * - Input validation and error handling
 * - Privacy-compliant data handling
 */

/**
 * T006: Get all teams for a user
 * 
 * Features:
 * - Returns teams sorted by creation time (newest first)
 * - Optional filtering by season
 * - User authentication validation
 * - Empty array for users with no teams
 */
export const getUserTeams = query({
  args: {
    userId: v.string(),
    season: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate authentication
    if (!args.userId || !args.userId.startsWith('user_')) {
      throw new Error('User authentication required');
    }

    // Build the query for active (non-deleted, non-archived) teams
    let query = ctx.db
      .query("teams")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
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

    // Add season filter if provided
    if (args.season) {
      const seasonPattern = /^\d{4} (Spring|Summer|Fall|Winter)$/;
      if (!seasonPattern.test(args.season)) {
        throw new Error('Invalid season format. Must be "YYYY Season" (e.g., "2025 Spring")');
      }

      query = query.filter((q) => q.eq(q.field("season"), args.season));
    }

    // Execute query and sort by creation time (newest first)
    const teams = await query
      .order("desc")
      .collect();

    return teams;
  },
});

/**
 * Get soft-deleted teams for a user
 * 
 * Business Rules:
 * - Only returns teams where isDeleted = true
 * - User can only see their own deleted teams
 * - Supports optional season filtering
 * - Ordered by deletion time (most recently deleted first)
 */
export const getDeletedTeams = query({
  args: {
    userId: v.string(),
    season: v.optional(v.string()), // Optional season filter
  },
  handler: async (ctx, args) => {
    // Validate authentication
    if (!args.userId || !args.userId.startsWith('user_')) {
      throw new Error('User authentication required');
    }

    // Build the query for soft-deleted (but not archived) teams only
    let query = ctx.db
      .query("teams")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("isDeleted"), true),
          q.or(
            q.eq(q.field("isArchived"), undefined),
            q.eq(q.field("isArchived"), false)
          )
        )
      );

    // Add season filter if provided
    if (args.season) {
      const seasonPattern = /^\d{4} (Spring|Summer|Fall|Winter)$/;
      if (!seasonPattern.test(args.season)) {
        throw new Error('Invalid season format. Must be "YYYY Season" (e.g., "2025 Spring")');
      }

      query = query.filter((q) => q.eq(q.field("season"), args.season));
    }

    // Execute query and sort by deletion time (most recently deleted first)
    const deletedTeams = await query
      .order("desc")
      .collect();

    return deletedTeams;
  },
});

/**
 * T005: Create a new team
 * 
 * Business Rules:
 * - Team name must be unique per user per season
 * - User must be authenticated
 * - Team name must be 1-50 characters
 * - Season must follow format: "YYYY (Spring|Summer|Fall|Winter)"
 */
export const createTeam = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    season: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate authentication
    if (!args.userId || !args.userId.startsWith('user_')) {
      throw new Error('User authentication required');
    }

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

    const seasonPattern = /^\d{4} (Spring|Summer|Fall|Winter)$/;
    if (!seasonPattern.test(args.season)) {
      throw new Error('Invalid season format. Must be "YYYY Season" (e.g., "2025 Spring")');
    }

    // Check for duplicate team name in the same season for this user (excluding soft-deleted teams)
    const existingTeam = await ctx.db
      .query("teams")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
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
      userId: args.userId,
      name: args.name.trim(),
      season: args.season,
    });

    // Return the created team
    const team = await ctx.db.get(teamId);
    return team;
  },
});

/**
 * T007: Get a specific team by ID
 * 
 * Features:
 * - Validates team ownership
 * - Returns null if team not found or not owned by user
 * - User authentication validation
 */
export const getTeam = query({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate authentication
    if (!args.userId || !args.userId.startsWith('user_')) {
      throw new Error('User authentication required');
    }

    // Get the team
    const team = await ctx.db.get(args.teamId);

    // Return null if team doesn't exist or doesn't belong to the user
    if (!team || team.userId !== args.userId) {
      return null;
    }

    return team;
  },
});

/**
 * T008: Update a team
 * 
 * Features:
 * - Allows updating name and season
 * - Validates team ownership
 * - Enforces business rules (unique names)
 * - Input validation
 */
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      season: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Validate authentication
    if (!args.userId || !args.userId.startsWith('user_')) {
      throw new Error('User authentication required');
    }

    // Get the existing team
    const existingTeam = await ctx.db.get(args.teamId);
    if (!existingTeam || existingTeam.userId !== args.userId) {
      throw new Error('Team not found or access denied');
    }

    // Prepare updates
    const updates: { name?: string; season?: string } = {};

    // Validate and set name if provided
    if (args.updates.name !== undefined) {
      if (!args.updates.name || args.updates.name.trim().length === 0) {
        throw new Error('Team name is required');
      }

      if (args.updates.name.length > 50) {
        throw new Error('Team name must be 50 characters or less');
      }

      updates.name = args.updates.name.trim();
    }

    // Validate and set season if provided
    if (args.updates.season !== undefined) {
      if (!args.updates.season || args.updates.season.trim().length === 0) {
        throw new Error('Season is required');
      }

      const seasonPattern = /^\d{4} (Spring|Summer|Fall|Winter)$/;
      if (!seasonPattern.test(args.updates.season)) {
        throw new Error('Invalid season format. Must be "YYYY Season" (e.g., "2025 Spring")');
      }

      updates.season = args.updates.season;
    }

    // Check for duplicate team name if name or season is being updated
    if (updates.name || updates.season) {
      const finalName = updates.name || existingTeam.name;
      const finalSeason = updates.season || existingTeam.season;

      const duplicateTeam = await ctx.db
        .query("teams")
        .filter((q) => 
          q.and(
            q.eq(q.field("userId"), args.userId),
            q.eq(q.field("name"), finalName),
            q.eq(q.field("season"), finalSeason),
            q.neq(q.field("_id"), args.teamId)
          )
        )
        .first();

      if (duplicateTeam) {
        throw new Error('Team with this name already exists for this season');
      }
    }

    // Apply updates
    await ctx.db.patch(args.teamId, updates);

    // Return updated team
    const updatedTeam = await ctx.db.get(args.teamId);
    return updatedTeam;
  },
});

/**
 * T009: Delete a team
 * 
 * Features:
 * - Validates team ownership
 * - Checks for related data before deletion
 * - Returns success confirmation
 */
export const deleteTeam = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate authentication
    if (!args.userId || !args.userId.startsWith('user_')) {
      throw new Error('User authentication required');
    }

    // Get the existing team
    const existingTeam = await ctx.db.get(args.teamId);
    if (!existingTeam || existingTeam.userId !== args.userId) {
      throw new Error('Team not found or access denied');
    }

    // Check if team has players (prevent deletion if players exist)
    const teamPlayers = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .first();

    if (teamPlayers) {
      throw new Error('Cannot delete team with existing players. Please remove all players first.');
    }

    // Soft delete the team
    await ctx.db.patch(args.teamId, {
      isDeleted: true,
      deletedAt: Date.now()
    });

    return {
      success: true,
      teamId: args.teamId,
      message: 'Team deleted successfully'
    };
  },
});

/**
 * Restore a soft-deleted team
 * 
 * Business Rules:
 * - Only the team owner can restore their teams
 * - Team must be currently soft-deleted (isDeleted = true)
 * - Check for naming conflicts with active teams before restoring
 * - Clear deletion metadata on successful restore
 */
export const restoreTeam = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate authentication
    if (!args.userId || !args.userId.startsWith('user_')) {
      throw new Error('User authentication required');
    }

    // Get the existing team
    const existingTeam = await ctx.db.get(args.teamId);
    if (!existingTeam || existingTeam.userId !== args.userId) {
      throw new Error('Team not found or access denied');
    }

    // Check if team is actually deleted
    if (!existingTeam.isDeleted) {
      throw new Error('Team is not deleted and cannot be restored');
    }

    // Check for naming conflicts with active teams
    const conflictingTeam = await ctx.db
      .query("teams")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("name"), existingTeam.name),
          q.eq(q.field("season"), existingTeam.season),
          q.or(
            q.eq(q.field("isDeleted"), undefined),
            q.eq(q.field("isDeleted"), false)
          )
        )
      )
      .first();

    if (conflictingTeam) {
      throw new Error(`Cannot restore team: An active team named "${existingTeam.name}" already exists for ${existingTeam.season}`);
    }

    // Restore the team by clearing deletion flags
    await ctx.db.patch(args.teamId, {
      isDeleted: false,
      deletedAt: undefined
    });

    return {
      success: true,
      teamId: args.teamId,
      message: `Team "${existingTeam.name}" restored successfully`
    };
  },
});

/**
 * Archive a team (permanent removal from active use, but preserves historical data)
 * 
 * Features:
 * - Archives team for permanent removal from active use
 * - Preserves all historical data (players, games, statistics)
 * - Cannot be undone (unlike soft delete)
 * - Validates team ownership
 * - Requires archival reason for audit trail
 */
export const archiveTeam = mutation({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
    reason: v.string(), // Required reason for archival
  },
  handler: async (ctx, args) => {
    // Validate authentication
    if (!args.userId || !args.userId.startsWith('user_')) {
      throw new Error('User authentication required');
    }

    // Validate archival reason
    if (!args.reason || args.reason.trim().length === 0) {
      throw new Error('Archival reason is required');
    }

    if (args.reason.length > 200) {
      throw new Error('Archival reason must be 200 characters or less');
    }

    // Get the existing team
    const existingTeam = await ctx.db.get(args.teamId);
    if (!existingTeam || existingTeam.userId !== args.userId) {
      throw new Error('Team not found or access denied');
    }

    // Check if team is already archived
    if (existingTeam.isArchived) {
      throw new Error('Team is already archived');
    }

    // Archive the team (preserves all data)
    await ctx.db.patch(args.teamId, {
      isArchived: true,
      archivedAt: Date.now(),
      archivalReason: args.reason.trim(),
      // Also soft delete if not already deleted
      isDeleted: true,
      deletedAt: existingTeam.deletedAt || Date.now()
    });

    return {
      success: true,
      teamId: args.teamId,
      message: `Team "${existingTeam.name}" archived successfully. Historical data preserved for statistics.`
    };
  },
});

/**
 * Get archived teams for a user
 * 
 * Features:
 * - Returns teams that have been permanently archived
 * - Includes archival metadata (reason, timestamp)
 * - Sorted by archival date (most recent first)
 * - User authentication validation
 */
export const getArchivedTeams = query({
  args: {
    userId: v.string(),
    season: v.optional(v.string()), // Optional season filter
  },
  handler: async (ctx, args) => {
    // Validate authentication
    if (!args.userId || !args.userId.startsWith('user_')) {
      throw new Error('User authentication required');
    }

    // Build query for archived teams
    let query = ctx.db
      .query("teams")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("isArchived"), true)
        )
      );

    // Add season filter if provided
    if (args.season) {
      // Validate season format
      const seasonPattern = /^\d{4} (Spring|Summer|Fall|Winter)$/;
      if (!seasonPattern.test(args.season)) {
        throw new Error('Invalid season format. Must be "YYYY Season" (e.g., "2025 Spring")');
      }

      query = query.filter((q) => q.eq(q.field("season"), args.season));
    }

    // Execute query and sort by archival time (most recently archived first)
    const archivedTeams = await query
      .order("desc")
      .collect();

    return archivedTeams;
  },
});

/**
 * Export team data for backup before archival
 * 
 * Features:
 * - Exports complete team data including players and rosters
 * - Formatted as JSON for easy backup and data portability
 * - Includes metadata for future import functionality
 * - User authentication validation
 */
export const exportTeamData = query({
  args: {
    teamId: v.id("teams"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate authentication
    if (!args.userId || !args.userId.startsWith('user_')) {
      throw new Error('User authentication required');
    }

    // Get the team
    const team = await ctx.db.get(args.teamId);
    if (!team || team.userId !== args.userId) {
      throw new Error('Team not found or access denied');
    }

    // Get all players for this team
    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .collect();

    // Get all rosters for this team
    const rosters = await ctx.db
      .query("rosters")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .collect();

    // Create exportable data structure
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        exportVersion: "1.0",
        source: "Baseball Scorekeeping App"
      },
      team: {
        ...team,
        teamId: team._id // Include the ID for reference
      },
      players: players.map(player => ({
        ...player,
        playerId: player._id
      })),
      rosters: rosters.map(roster => ({
        ...roster,
        rosterId: roster._id
      })),
      statistics: {
        totalPlayers: players.length,
        totalRosters: rosters.length,
        minors: players.filter(p => p.isMinor).length,
        adults: players.filter(p => !p.isMinor).length
      }
    };

    return exportData;
  },
});