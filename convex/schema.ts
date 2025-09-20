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
  })
    .index("by_user", ["userId"])
    .index("by_user_name_season", ["userId", "name", "season"]), // Unique constraint

  // Players - global entities with privacy-compliant names
  players: defineTable({
    firstName: v.string(),        // First name only (privacy compliance)
    lastNameInitial: v.string(),  // Single letter last name initial (A-Z)
  })
    .index("by_firstName", ["firstName"])
    .index("by_firstName_initial", ["firstName", "lastNameInitial"]),

  // PlayerTeamRoster - junction table linking players to teams
  playerTeamRoster: defineTable({
    playerId: v.id("players"),
    teamId: v.id("teams"),
    jerseyNumber: v.number(),              // Unique within team (1-99)
    primaryPosition: Position,
    secondaryPositions: v.array(Position), // Additional positions player can play
    isActive: v.boolean(),                 // Current roster status
    joinedAt: v.number(),                  // Timestamp when player joined team
    leftAt: v.optional(v.number()),        // Timestamp when player left team
  })
    .index("by_team", ["teamId"])
    .index("by_player", ["playerId"])
    .index("by_team_active", ["teamId", "isActive"])
    .index("by_team_jersey", ["teamId", "jerseyNumber", "isActive"]), // Jersey uniqueness
});