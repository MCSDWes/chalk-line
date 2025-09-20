import { v } from "convex/values";
import { query } from "./_generated/server";

// Test query to verify schema deployment
export const getTeamsCount = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();
    return {
      count: teams.length,
      message: "Schema is working correctly!",
      timestamp: new Date().toISOString()
    };
  },
});

// Test query for players with privacy compliance
export const getPlayersCount = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db.query("players").collect();
    return {
      count: players.length,
      message: "Privacy-compliant player schema is working!",
      playersPreview: players.slice(0, 3).map(p => ({
        id: p._id,
        displayName: `${p.firstName} ${p.lastNameInitial}.`,
        privacyCompliant: true
      })),
      timestamp: new Date().toISOString()
    };
  },
});