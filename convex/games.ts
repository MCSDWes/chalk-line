import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Game Management API Functions with Clerk Authentication
 * 
 * These functions implement game management with:
 * - Clerk user authentication via ctx.auth.getUserIdentity()
 * - Game lifecycle management (create, start, score, complete)
 * - Real-time scoring and statistics tracking
 * - Privacy-compliant data handling
 */

/**
 * Get all games for the authenticated user
 */
export const getUserGames = query({
  args: {
    season: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("suspended"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    let query = ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("userId"), userId));

    if (args.season) {
      query = query.filter((q) => q.eq(q.field("season"), args.season));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.order("desc").collect();
  },
});

/**
 * Get a specific game with full details
 */
export const getGame = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.userId !== userId) {
      throw new Error("Not authorized to view this game");
    }

    // Get related data
    const homeTeam = await ctx.db.get(game.homeTeamId);
    const awayTeam = game.awayTeamId ? await ctx.db.get(game.awayTeamId) : null;
    
    const innings = await ctx.db
      .query("innings")
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .order("asc")
      .collect();

    const gameState = await ctx.db
      .query("gameState")
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .first();

    return {
      game,
      homeTeam,
      awayTeam,
      innings,
      gameState,
    };
  },
});

/**
 * Create a new game
 */
export const createGame = mutation({
  args: {
    homeTeamId: v.id("teams"),
    awayTeamId: v.optional(v.id("teams")),
    awayTeamName: v.optional(v.string()),
    gameDate: v.string(),
    gameTime: v.optional(v.string()),
    field: v.optional(v.string()),
    season: v.string(),
    gameType: v.union(
      v.literal("regular"),
      v.literal("playoff"),
      v.literal("championship"),
      v.literal("scrimmage"),
      v.literal("tournament")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Validate home team ownership
    const homeTeam = await ctx.db.get(args.homeTeamId);
    if (!homeTeam) {
      throw new Error("Home team not found");
    }
    if (homeTeam.userId !== userId) {
      throw new Error("Not authorized to create game for this team");
    }

    // Validate away team if provided
    if (args.awayTeamId) {
      const awayTeam = await ctx.db.get(args.awayTeamId);
      if (!awayTeam) {
        throw new Error("Away team not found");
      }
      // Away team can belong to different user (opponent)
    }

    // Validate that either awayTeamId or awayTeamName is provided
    if (!args.awayTeamId && !args.awayTeamName) {
      throw new Error("Either away team or away team name must be provided");
    }

    // Validate game date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(args.gameDate)) {
      throw new Error("Game date must be in YYYY-MM-DD format");
    }

    // Create the game
    const gameId = await ctx.db.insert("games", {
      userId,
      homeTeamId: args.homeTeamId,
      homeTeamName: homeTeam.name, // Add the home team name
      awayTeamId: args.awayTeamId || undefined,
      awayTeamName: args.awayTeamName,
      gameDate: args.gameDate,
      gameTime: args.gameTime,
      field: args.field,
      season: args.season,
      gameType: args.gameType,
      status: "scheduled",
    });

    return gameId;
  },
});

/**
 * Start a game (initialize game state)
 */
export const startGame = mutation({
  args: {
    gameId: v.id("games"),
    awayTeamLineup: v.optional(v.array(v.object({
      playerName: v.string(),
      battingPosition: v.number(),
      fieldPosition: v.string(),
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
      throw new Error("Not authorized to start this game");
    }

    if (game.status !== "scheduled") {
      throw new Error("Game is not in scheduled status");
    }

    // Get the lineup for the home team
    const homeLineup = await ctx.db
      .query("lineups")
      .withIndex("by_game_team", (q) =>
        q.eq("gameId", args.gameId).eq("teamId", game.homeTeamId!)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!homeLineup || !homeLineup.battingOrder || homeLineup.battingOrder.length === 0) {
      throw new Error("Home team lineup must be set before starting the game");
    }

    // Extract batting order from lineup
    const homeBattingOrder = homeLineup.battingOrder.map(spot => spot.playerId);

    // Validate that all players belong to the home team
    for (const playerId of homeBattingOrder) {
      const player = await ctx.db.get(playerId);
      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }
      if (player.teamId !== game.homeTeamId) {
        throw new Error(`Player ${playerId} does not belong to home team`);
      }
    }

    // Update game status
    await ctx.db.patch(args.gameId, {
      status: "in_progress",
      currentInning: 1,
      currentHalf: "top",
      homeScore: 0,
      awayScore: 0,
      startedAt: Date.now(),
    });

    // Prepare away team batting order
    let awayBattingOrder: string[] | undefined = undefined;
    
    if (args.awayTeamLineup && args.awayTeamLineup.length > 0) {
      // For external teams, we store player names instead of IDs
      awayBattingOrder = args.awayTeamLineup
        .sort((a, b) => a.battingPosition - b.battingPosition)
        .map(player => player.playerName);
    }

    // Initialize game state
    await ctx.db.insert("gameState", {
      gameId: args.gameId,
      battingOrder: homeBattingOrder,
      awayBattingOrder: awayBattingOrder,
      currentBatterIndex: 0,
      baseRunners: {
        first: undefined,
        second: undefined,
        third: undefined,
      },
      outs: 0,
      balls: 0,
      strikes: 0,
      lastUpdated: Date.now(),
    });

    // Initialize first inning
    await ctx.db.insert("innings", {
      gameId: args.gameId,
      inningNumber: 1,
      homeRuns: 0,
      awayRuns: 0,
      homeHits: 0,
      awayHits: 0,
      homeErrors: 0,
      awayErrors: 0,
      isComplete: false,
    });

    return args.gameId;
  },
});

/**
 * Record an at-bat result
 */
export const recordAtBat = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    result: v.union(
      v.literal("single"),
      v.literal("double"),
      v.literal("triple"),
      v.literal("home_run"),
      v.literal("walk"),
      v.literal("strikeout"),
      v.literal("groundout"),
      v.literal("flyout"),
      v.literal("foul_out"),
      v.literal("hit_by_pitch"),
      v.literal("sacrifice_fly"),
      v.literal("sacrifice_bunt"),
      v.literal("fielders_choice"),
      v.literal("error"),
      v.literal("interference")
    ),
    rbis: v.optional(v.number()),
    runsScored: v.optional(v.number()),
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
      throw new Error("Not authorized to record at-bat for this game");
    }

    if (game.status !== "in_progress") {
      throw new Error("Game is not in progress");
    }

    // Get current game state
    const gameState = await ctx.db
      .query("gameState")
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .first();

    if (!gameState) {
      throw new Error("Game state not found");
    }

    // Determine if this is home or away team batting
    const isHomeTeam = game.currentHalf === "bottom";
    const battingOrder = isHomeTeam ? gameState.battingOrder : gameState.awayBattingOrder;
    
    if (!battingOrder) {
      throw new Error("Batting order not set for current team");
    }

    // Record the at-bat
    const atBatId = await ctx.db.insert("atBats", {
      gameId: args.gameId,
      playerId: args.playerId,
      inningNumber: game.currentInning || 1,
      battingOrder: gameState.currentBatterIndex + 1,
      isHomeTeam,
      result: args.result,
      rbis: args.rbis || 0,
      runsScored: args.runsScored || 0,
      timestamp: Date.now(),
    });

    // Update game state based on at-bat result
    // (This would include complex baseball logic for base runners, outs, etc.)
    // For now, we'll implement basic logic

    let newOuts = gameState.outs;
    const newBaseRunners = { ...gameState.baseRunners };

    // Simple out counting logic
    if (["strikeout", "groundout", "flyout", "foul_out"].includes(args.result)) {
      newOuts += 1;
    }

    // Update base runners for hits
    if (["single", "double", "triple", "home_run"].includes(args.result)) {
      // Basic base running logic (simplified)
      if (args.result === "single") {
        newBaseRunners.first = args.playerId;
      } else if (args.result === "double") {
        newBaseRunners.second = args.playerId;
        newBaseRunners.first = undefined;
      } else if (args.result === "triple") {
        newBaseRunners.third = args.playerId;
        newBaseRunners.first = undefined;
        newBaseRunners.second = undefined;
      } else if (args.result === "home_run") {
        newBaseRunners.first = undefined;
        newBaseRunners.second = undefined;
        newBaseRunners.third = undefined;
      }
    }

    // Check for inning change (3 outs)
    let newInning = game.currentInning || 1;
    let newHalf = game.currentHalf || "top";
    let newBatterIndex = gameState.currentBatterIndex;

    if (newOuts >= 3) {
      if (newHalf === "top") {
        newHalf = "bottom";
      } else {
        newHalf = "top";
        newInning += 1;
      }
      newOuts = 0;
      newBatterIndex = 0;
      
      // Clear base runners
      newBaseRunners.first = undefined;
      newBaseRunners.second = undefined;
      newBaseRunners.third = undefined;
    } else {
      // Advance to next batter
      newBatterIndex = (newBatterIndex + 1) % battingOrder.length;
    }

    // Update game state
    await ctx.db.patch(gameState._id, {
      currentBatterIndex: newBatterIndex,
      baseRunners: newBaseRunners,
      outs: newOuts,
      balls: 0, // Reset count
      strikes: 0,
      lastUpdated: Date.now(),
    });

    // Update game current inning/half
    await ctx.db.patch(args.gameId, {
      currentInning: newInning,
      currentHalf: newHalf,
    });

    return atBatId;
  },
});

/**
 * Complete a game
 */
export const completeGame = mutation({
  args: {
    gameId: v.id("games"),
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
      throw new Error("Not authorized to complete this game");
    }

    if (game.status !== "in_progress") {
      throw new Error("Game is not in progress");
    }

    // Mark game as completed
    await ctx.db.patch(args.gameId, {
      status: "completed",
      completedAt: Date.now(),
    });

    return args.gameId;
  },
});

/**
 * Get game statistics
 */
export const getGameStats = query({
  args: {
    gameId: v.id("games"),
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

    // Get all at-bats for the game
    const atBats = await ctx.db
      .query("atBats")
      .filter((q) => q.eq(q.field("gameId"), args.gameId))
      .collect();

    // Calculate statistics
    const homeAtBats = atBats.filter(ab => ab.isHomeTeam);
    const awayAtBats = atBats.filter(ab => !ab.isHomeTeam);

    const homeHits = homeAtBats.filter(ab => 
      ["single", "double", "triple", "home_run"].includes(ab.result)
    ).length;
    
    const awayHits = awayAtBats.filter(ab => 
      ["single", "double", "triple", "home_run"].includes(ab.result)
    ).length;

    const homeRuns = homeAtBats.reduce((sum, ab) => sum + ab.runsScored, 0);
    const awayRuns = awayAtBats.reduce((sum, ab) => sum + ab.runsScored, 0);

    const homeRBIs = homeAtBats.reduce((sum, ab) => sum + ab.rbis, 0);
    const awayRBIs = awayAtBats.reduce((sum, ab) => sum + ab.rbis, 0);

    return {
      homeStats: {
        hits: homeHits,
        runs: homeRuns,
        rbis: homeRBIs,
        atBats: homeAtBats.length,
      },
      awayStats: {
        hits: awayHits,
        runs: awayRuns,
        rbis: awayRBIs,
        atBats: awayAtBats.length,
      },
      totalAtBats: atBats.length,
    };
  },
});

/**
 * Get current game state including inning, score, and batting info
 */
export const getGameState = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const gameState = await ctx.db
      .query("gameState")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .first();

    const innings = await ctx.db
      .query("innings")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .order("asc")
      .collect();

    return {
      game,
      gameState,
      innings,
    };
  },
});

/**
 * Update current inning score
 */
export const updateInningScore = mutation({
  args: {
    gameId: v.id("games"),
    inningNumber: v.number(),
    isHomeTeam: v.boolean(),
    runs: v.number(),
    hits: v.optional(v.number()),
    errors: v.optional(v.number()),
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
      throw new Error("Not authorized to update this game");
    }

    // Find the inning record
    const inning = await ctx.db
      .query("innings")
      .withIndex("by_game_inning", (q) =>
        q.eq("gameId", args.gameId).eq("inningNumber", args.inningNumber)
      )
      .first();

    if (!inning) {
      throw new Error("Inning not found");
    }

    // Update the appropriate team's stats
    const updateData: any = {};
    if (args.isHomeTeam) {
      updateData.homeRuns = args.runs;
      if (args.hits !== undefined) updateData.homeHits = args.hits;
      if (args.errors !== undefined) updateData.homeErrors = args.errors;
    } else {
      updateData.awayRuns = args.runs;
      if (args.hits !== undefined) updateData.awayHits = args.hits;
      if (args.errors !== undefined) updateData.awayErrors = args.errors;
    }

    await ctx.db.patch(inning._id, updateData);

    // Update total game score
    const allInnings = await ctx.db
      .query("innings")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    const homeScore = allInnings.reduce((sum, inn) => sum + (inn.homeRuns || 0), 0);
    const awayScore = allInnings.reduce((sum, inn) => sum + (inn.awayRuns || 0), 0);

    await ctx.db.patch(args.gameId, {
      homeScore,
      awayScore,
    });

    return { homeScore, awayScore };
  },
});

/**
 * Advance to next inning
 */
export const nextInning = mutation({
  args: {
    gameId: v.id("games"),
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
      throw new Error("Not authorized to update this game");
    }

    if (game.status !== "in_progress") {
      throw new Error("Game is not in progress");
    }

    let newInning = game.currentInning || 1;
    let newHalf = game.currentHalf || "top";

    // Advance the inning
    if (newHalf === "top") {
      newHalf = "bottom";
    } else {
      newHalf = "top";
      newInning += 1;
    }

    // Update game state
    await ctx.db.patch(args.gameId, {
      currentInning: newInning,
      currentHalf: newHalf,
    });

    // Create new inning record if needed
    if (newHalf === "top") {
      const existingInning = await ctx.db
        .query("innings")
        .withIndex("by_game_inning", (q) =>
          q.eq("gameId", args.gameId).eq("inningNumber", newInning)
        )
        .first();

      if (!existingInning) {
        await ctx.db.insert("innings", {
          gameId: args.gameId,
          inningNumber: newInning,
          homeRuns: 0,
          awayRuns: 0,
          homeHits: 0,
          awayHits: 0,
          homeErrors: 0,
          awayErrors: 0,
          isComplete: false,
        });
      }
    }

    // Reset game state for new half inning
    const gameState = await ctx.db
      .query("gameState")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .first();

    if (gameState) {
      await ctx.db.patch(gameState._id, {
        currentBatterIndex: 0,
        baseRunners: {
          first: undefined,
          second: undefined,
          third: undefined,
        },
        outs: 0,
        balls: 0,
        strikes: 0,
        lastUpdated: Date.now(),
      });
    }

    return { currentInning: newInning, currentHalf: newHalf };
  },
});

/**
 * Migration function to populate missing homeTeamName fields
 * This fixes games created before the homeTeamName field was added to the schema
 */
export const migrateGamesWithHomeTeamName = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }
    const userId = identity.subject;

    // Find all games for this user that are missing homeTeamName
    const games = await ctx.db
      .query("games")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    let updatedCount = 0;
    
    for (const game of games) {
      // Check if homeTeamName is missing or empty
      if (!game.homeTeamName) {
        // Get the home team data
        const homeTeam = await ctx.db.get(game.homeTeamId);
        if (homeTeam) {
          // Update the game with the home team name
          await ctx.db.patch(game._id, {
            homeTeamName: homeTeam.name,
          });
          updatedCount++;
        }
      }
    }

    return { message: `Updated ${updatedCount} games with home team names` };
  },
});