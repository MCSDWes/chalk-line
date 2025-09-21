import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Baseball position enum
export const Position = v.union(
  v.literal("P"),    // Pitcher
  v.literal("C"),    // Catcher
  v.literal("1B"),   // First Base
  v.literal("2B"),   // Second Base
  v.literal("3B"),   // Third Base
  v.literal("SS"),   // Shortstop
  v.literal("LF"),   // Left Field
  v.literal("CF"),   // Center Field
  v.literal("RF"),   // Right Field
  v.literal("DH")    // Designated Hitter
);

export default defineSchema({
  // Teams - belongs to a user (coach/manager)
  teams: defineTable({
    userId: v.string(), // Clerk user ID
    name: v.string(),   // Team name (e.g., "Eagles")
    season: v.string(), // Season identifier (e.g., "2025 Spring")
    isDeleted: v.optional(v.boolean()), // Soft delete flag
    deletedAt: v.optional(v.number()),  // Deletion timestamp
    isArchived: v.optional(v.boolean()), // Archival flag (preserves data)
    archivedAt: v.optional(v.number()),  // Archival timestamp
    archivalReason: v.optional(v.string()), // Why archived (season ended, etc.)
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isDeleted"]) // Active teams only
    .index("by_user_archived", ["userId", "isArchived"]) // Archived teams
    .index("by_user_name_season", ["userId", "name", "season"]), // Unique constraint

  // Players - privacy-compliant player entities
  players: defineTable({
    teamId: v.id("teams"),            // Team the player belongs to
    firstName: v.string(),            // First name only (privacy compliance)
    lastNameInitial: v.string(),      // Single letter last name initial (A-Z)
    lastName: v.optional(v.string()),  // Full last name for adults only
    isMinor: v.boolean(),             // COPPA compliance flag
    position: v.string(),             // Player position (pitcher, catcher, etc.)
    jerseyNumber: v.optional(v.number()), // Jersey number (0-99, null for coaches)
  })
    .index("by_team", ["teamId"])
    .index("by_team_jersey", ["teamId", "jerseyNumber"]) // Jersey uniqueness
    .index("by_firstName_initial", ["firstName", "lastNameInitial"]),

  // Lineups - game-specific batting orders and field positions
  lineups: defineTable({
    gameId: v.id("games"),            // Game this lineup is for
    teamId: v.id("teams"),            // Team this lineup belongs to
    isHomeTeam: v.boolean(),          // Whether this is home or away team lineup
    battingOrder: v.array(v.object({
      playerId: v.id("players"),      // Player in this batting position
      battingPosition: v.number(),    // Batting order position (1-9+)
      fieldPosition: Position,        // Field position (P, C, 1B, etc.)
    })),
    substitutes: v.optional(v.array(v.object({
      playerId: v.id("players"),      // Substitute player
      availablePositions: v.array(Position), // Positions they can play
    }))),
    createdAt: v.number(),            // When lineup was created
    isActive: v.boolean(),            // Whether this lineup is currently active
  })
    .index("by_game", ["gameId"])
    .index("by_game_team", ["gameId", "teamId"])
    .index("by_team", ["teamId"]),

  // Games - individual baseball games
  games: defineTable({
    userId: v.string(),               // Clerk user ID (game creator/scorekeeper)
    homeTeamId: v.optional(v.id("teams")), // Home team (optional for external home teams)
    homeTeamName: v.optional(v.string()), // Home team name (for UI display)
    awayTeamId: v.optional(v.id("teams")), // Away team (optional for external teams)
    awayTeamName: v.optional(v.string()), // Name for external teams
    gameDate: v.string(),             // Game date (YYYY-MM-DD)
    gameTime: v.optional(v.string()), // Game time (HH:MM)
    field: v.optional(v.string()),    // Field/venue name
    season: v.string(),               // Season identifier
    gameType: v.union(
      v.literal("regular"),           // Regular season
      v.literal("playoff"),           // Playoff game
      v.literal("championship"),      // Championship game
      v.literal("scrimmage"),         // Practice game
      v.literal("tournament")         // Tournament game
    ),
    status: v.union(
      v.literal("scheduled"),         // Game scheduled but not started
      v.literal("in_progress"),       // Game currently being played
      v.literal("completed"),         // Game finished
      v.literal("suspended"),         // Game temporarily stopped
      v.literal("cancelled")          // Game cancelled
    ),
    currentInning: v.optional(v.number()), // Current inning (1-9+)
    currentHalf: v.optional(v.union(
      v.literal("top"),               // Top of inning (away team batting)
      v.literal("bottom")             // Bottom of inning (home team batting)
    )),
    homeScore: v.optional(v.number()), // Current home team score
    awayScore: v.optional(v.number()), // Current away team score
    startedAt: v.optional(v.number()), // Game start timestamp
    completedAt: v.optional(v.number()), // Game completion timestamp
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "gameDate"])
    .index("by_home_team", ["homeTeamId"])
    .index("by_season", ["season"])
    .index("by_status", ["status"]),

  // Innings - track scoring by inning
  innings: defineTable({
    gameId: v.id("games"),
    inningNumber: v.number(),         // Inning number (1-9+)
    homeRuns: v.number(),             // Runs scored by home team this inning
    awayRuns: v.number(),             // Runs scored by away team this inning
    homeHits: v.optional(v.number()), // Hits by home team this inning
    awayHits: v.optional(v.number()), // Hits by away team this inning
    homeErrors: v.optional(v.number()), // Errors by home team this inning
    awayErrors: v.optional(v.number()), // Errors by away team this inning
    isComplete: v.boolean(),          // Whether inning is finished
  })
    .index("by_game", ["gameId"])
    .index("by_game_inning", ["gameId", "inningNumber"]),

  // At-Bats - individual batting events
  atBats: defineTable({
    gameId: v.id("games"),
    playerId: v.id("players"),
    inningNumber: v.number(),
    battingOrder: v.number(),         // Position in batting order (1-9+)
    isHomeTeam: v.boolean(),          // Whether batter is on home team
    result: v.union(
      v.literal("single"),            // Base hit - single
      v.literal("double"),            // Base hit - double
      v.literal("triple"),            // Base hit - triple
      v.literal("home_run"),          // Home run
      v.literal("walk"),              // Base on balls (walk)
      v.literal("strikeout"),         // Strikeout
      v.literal("groundout"),         // Ground ball out
      v.literal("flyout"),            // Fly ball out
      v.literal("foul_out"),          // Foul ball out
      v.literal("hit_by_pitch"),      // Hit by pitch
      v.literal("sacrifice_fly"),     // Sacrifice fly
      v.literal("sacrifice_bunt"),    // Sacrifice bunt
      v.literal("fielders_choice"),   // Fielder's choice
      v.literal("error"),             // Reached on error
      v.literal("interference")       // Catcher/umpire interference
    ),
    rbis: v.number(),                 // Runs batted in
    runsScored: v.number(),           // Runs scored by this batter
    pitchCount: v.optional(v.number()), // Total pitches faced
    strikes: v.optional(v.number()),   // Strikes in at-bat
    balls: v.optional(v.number()),     // Balls in at-bat
    timestamp: v.number(),            // When at-bat occurred
  })
    .index("by_game", ["gameId"])
    .index("by_game_inning", ["gameId", "inningNumber"])
    .index("by_player", ["playerId"])
    .index("by_game_player", ["gameId", "playerId"]),

  // Game State - track current game progress
  gameState: defineTable({
    gameId: v.id("games"),
    currentBatter: v.optional(v.id("players")), // Current batter
    battingOrder: v.array(v.id("players")), // Home team batting order
    awayBattingOrder: v.optional(v.array(v.string())), // Away team batting order (player names for external teams)
    awayTeamPlayers: v.optional(v.array(v.object({ // External team player details
      playerName: v.string(),
      jerseyNumber: v.optional(v.number()),
      battingPosition: v.number(),
      fieldPosition: v.string(),
    }))),
    currentBatterIndex: v.number(),    // Index in batting order
    currentInning: v.number(),         // Current inning (1, 2, 3, etc.)
    isTopInning: v.boolean(),          // true = top of inning (away team batting), false = bottom (home team batting)
    homeTeamBatting: v.boolean(),      // Which team is currently batting
    baseRunners: v.object({           // Current base runners
      first: v.optional(v.id("players")),
      second: v.optional(v.id("players")),
      third: v.optional(v.id("players"))
    }),
    outs: v.number(),                 // Current outs in inning (0-3)
    balls: v.number(),                // Current ball count (0-4)
    strikes: v.number(),              // Current strike count (0-3)
    lastUpdated: v.number(),          // Last update timestamp
  })
    .index("by_game", ["gameId"]),
});