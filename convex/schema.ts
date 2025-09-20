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
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isDeleted"]) // Active teams only
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

  // Rosters - game-specific player groupings
  rosters: defineTable({
    teamId: v.id("teams"),
    name: v.string(),                 // Roster name (e.g., "Starting Lineup")
    gameDate: v.string(),             // Game date (YYYY-MM-DD format)
    playerIds: v.array(v.id("players")), // Array of player IDs
    isActive: v.boolean(),            // Current active status
  })
    .index("by_team", ["teamId"])
    .index("by_team_date", ["teamId", "gameDate"])
    .index("by_team_active", ["teamId", "isActive"]),
});