import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Lineup Management API Functions with Clerk Authentication
 * 
 * These functions implement game-specific lineup management with:
 * - Clerk user authentication via ctx.auth.getUserIdentity()
 * - Game-specific batting orders and field positions
 * - Substitution tracking during games
 * - Privacy-compliant data handling
 */

/**
 * Get lineup for a specific game and team
 */
export const getGameLineup = query({
  args: {
    gameId: v.id("games"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Validate game ownership
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.userId !== userId) {
      throw new Error("Not authorized to view this game");
    }

    // Validate team ownership
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }
    if (team.userId !== userId) {
      throw new Error("Not authorized to view this team");
    }

    const lineup = await ctx.db
      .query("lineups")
      .filter((q) => 
        q.and(
          q.eq(q.field("gameId"), args.gameId),
          q.eq(q.field("teamId"), args.teamId)
        )
      )
      .first();

    if (!lineup) {
      return null;
    }

    // Get player details for the lineup
    const playerIds = lineup.battingOrder.map(spot => spot.playerId);
    const players = await Promise.all(
      playerIds.map(id => ctx.db.get(id))
    );

    const substituteIds = lineup.substitutes?.map(sub => sub.playerId) || [];
    const substitutes = await Promise.all(
      substituteIds.map(id => ctx.db.get(id))
    );

    return {
      lineup,
      players: players.filter(Boolean),
      substitutes: substitutes.filter(Boolean),
    };
  },
});

/**
 * Create or update a lineup for a specific game
 */
export const setGameLineup = mutation({
  args: {
    gameId: v.id("games"),
    teamId: v.id("teams"),
    isHomeTeam: v.boolean(),
    battingOrder: v.array(v.object({
      playerId: v.id("players"),
      battingPosition: v.number(),
      fieldPosition: v.union(
        v.literal("P"), v.literal("C"), v.literal("1B"), v.literal("2B"), 
        v.literal("3B"), v.literal("SS"), v.literal("LF"), v.literal("CF"), 
        v.literal("RF"), v.literal("DH")
      ),
    })),
    substitutes: v.optional(v.array(v.object({
      playerId: v.id("players"),
      availablePositions: v.array(v.union(
        v.literal("P"), v.literal("C"), v.literal("1B"), v.literal("2B"), 
        v.literal("3B"), v.literal("SS"), v.literal("LF"), v.literal("CF"), 
        v.literal("RF"), v.literal("DH")
      )),
    }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Validate game ownership
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.userId !== userId) {
      throw new Error("Not authorized to modify this game");
    }

    // Validate team ownership
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }
    if (team.userId !== userId) {
      throw new Error("Not authorized to modify this team");
    }

    // Validate that game hasn't started yet
    if (game.status !== "scheduled") {
      throw new Error("Cannot modify lineup after game has started");
    }

    // Validate batting order
    if (args.battingOrder.length === 0) {
      throw new Error("Batting order cannot be empty");
    }

    // Check for duplicate batting positions
    const positions = args.battingOrder.map(spot => spot.battingPosition);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      throw new Error("Duplicate batting positions not allowed");
    }

    // Check for duplicate field positions (except DH)
    const fieldPositions = args.battingOrder
      .map(spot => spot.fieldPosition)
      .filter(pos => pos !== "DH");
    const uniqueFieldPositions = new Set(fieldPositions);
    if (fieldPositions.length !== uniqueFieldPositions.size) {
      throw new Error("Duplicate field positions not allowed (except DH)");
    }

    // Validate all players belong to the team
    const playerIds = args.battingOrder.map(spot => spot.playerId);
    const substituteIds = args.substitutes?.map(sub => sub.playerId) || [];
    const allPlayerIds = [...playerIds, ...substituteIds];

    for (const playerId of allPlayerIds) {
      const player = await ctx.db.get(playerId);
      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }
      if (player.teamId !== args.teamId) {
        throw new Error(`Player ${playerId} does not belong to this team`);
      }
    }

    // Check if lineup already exists
    const existingLineup = await ctx.db
      .query("lineups")
      .filter((q) => 
        q.and(
          q.eq(q.field("gameId"), args.gameId),
          q.eq(q.field("teamId"), args.teamId)
        )
      )
      .first();

    const lineupData = {
      gameId: args.gameId,
      teamId: args.teamId,
      isHomeTeam: args.isHomeTeam,
      battingOrder: args.battingOrder,
      substitutes: args.substitutes || [],
      createdAt: Date.now(),
      isActive: true,
    };

    if (existingLineup) {
      // Update existing lineup
      return await ctx.db.patch(existingLineup._id, lineupData);
    } else {
      // Create new lineup
      return await ctx.db.insert("lineups", lineupData);
    }
  },
});

/**
 * Get all players available for lineup creation
 */
export const getTeamPlayersForLineup = query({
  args: {
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Validate team ownership
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }
    if (team.userId !== userId) {
      throw new Error("Not authorized to view this team");
    }

    return await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("teamId"), args.teamId))
      .collect();
  },
});

/**
 * Delete a lineup (only before game starts)
 */
export const deleteLineup = mutation({
  args: {
    lineupId: v.id("lineups"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    const lineup = await ctx.db.get(args.lineupId);
    if (!lineup) {
      throw new Error("Lineup not found");
    }

    // Validate game ownership
    const game = await ctx.db.get(lineup.gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.userId !== userId) {
      throw new Error("Not authorized to delete this lineup");
    }

    // Validate that game hasn't started yet
    if (game.status !== "scheduled") {
      throw new Error("Cannot delete lineup after game has started");
    }

    await ctx.db.delete(args.lineupId);
  },
});