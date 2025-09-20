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

    // Build the query
    let query = ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("userId"), args.userId));

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

    // Check for duplicate team name in the same season for this user
    const existingTeam = await ctx.db
      .query("teams")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("name"), args.name.trim()),
          q.eq(q.field("season"), args.season)
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

    // Delete the team
    await ctx.db.delete(args.teamId);

    return {
      success: true,
      teamId: args.teamId,
      message: 'Team deleted successfully'
    };
  },
});