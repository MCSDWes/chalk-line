import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all teams for the authenticated user
export const getUserTeams = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("teams")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Create a new team
export const createTeam = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    season: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if team already exists for this user
    const existing = await ctx.db
      .query("teams")
      .withIndex("by_user_name_season", (q) => 
        q.eq("userId", args.userId).eq("name", args.name).eq("season", args.season)
      )
      .first();

    if (existing) {
      throw new Error("Team with this name already exists for this season");
    }

    return await ctx.db.insert("teams", {
      userId: args.userId,
      name: args.name,
      season: args.season,
    });
  },
});