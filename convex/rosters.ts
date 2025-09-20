import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// T019: Create a new roster
export const createRoster = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    gameDate: v.string(),
    playerIds: v.array(v.id("players")),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Validate team ownership
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }
    if (team.userId !== identity.subject) {
      throw new Error("Not authorized to access this team");
    }

    // Validate roster name
    if (!args.name || args.name.trim().length === 0) {
      throw new Error("Roster name is required");
    }
    if (args.name.length > 100) {
      throw new Error("Roster name must be 100 characters or less");
    }

    // Validate game date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.gameDate)) {
      throw new Error("Game date must be in YYYY-MM-DD format");
    }

    // Validate player count limits
    if (args.playerIds.length < 9) {
      throw new Error("Roster must have at least 9 players");
    }
    if (args.playerIds.length > 30) {
      throw new Error("Roster cannot exceed 30 players");
    }

    // Check for duplicate roster name on same game date
    const existingRoster = await ctx.db
      .query("rosters")
      .withIndex("by_team_date", (q) => 
        q.eq("teamId", args.teamId).eq("gameDate", args.gameDate)
      )
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();

    if (existingRoster) {
      throw new Error("Roster with this name already exists for this game date");
    }

    // Validate all players belong to the team
    for (const playerId of args.playerIds) {
      const player = await ctx.db.get(playerId);
      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }
      if (player.teamId !== args.teamId) {
        throw new Error("One or more players do not belong to this team");
      }
    }

    // Check for duplicate player IDs in roster
    const uniquePlayerIds = new Set(args.playerIds);
    if (uniquePlayerIds.size !== args.playerIds.length) {
      throw new Error("Duplicate players are not allowed in a roster");
    }

    // Create the roster
    const rosterId = await ctx.db.insert("rosters", {
      teamId: args.teamId,
      name: args.name.trim(),
      gameDate: args.gameDate,
      playerIds: args.playerIds,
      isActive: args.isActive,
    });

    return await ctx.db.get(rosterId);
  },
});

// T020: Get all rosters for a team with optional filtering
export const getTeamRosters = query({
  args: {
    teamId: v.id("teams"),
    gameDate: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Validate team ownership
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }
    if (team.userId !== identity.subject) {
      throw new Error("Not authorized to access this team");
    }

    let query = ctx.db.query("rosters").withIndex("by_team", (q) => 
      q.eq("teamId", args.teamId)
    );

    // Apply filters
    if (args.gameDate !== undefined) {
      query = query.filter((q) => q.eq(q.field("gameDate"), args.gameDate));
    }
    if (args.isActive !== undefined) {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    const rosters = await query.collect();
    
    // Sort by game date (newest first) and creation time
    return rosters.sort((a, b) => {
      const dateCompare = b.gameDate.localeCompare(a.gameDate);
      return dateCompare !== 0 ? dateCompare : b._creationTime - a._creationTime;
    });
  },
});

// T021: Update an existing roster
export const updateRoster = mutation({
  args: {
    rosterId: v.id("rosters"),
    updates: v.object({
      name: v.optional(v.string()),
      playerIds: v.optional(v.array(v.id("players"))),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Get the roster
    const roster = await ctx.db.get(args.rosterId);
    if (!roster) {
      throw new Error("Roster not found");
    }

    // Validate team ownership
    const team = await ctx.db.get(roster.teamId);
    if (!team || team.userId !== identity.subject) {
      throw new Error("Not authorized to modify this roster");
    }

    // Validate updates
    const updates: any = {};

    if (args.updates.name !== undefined) {
      if (!args.updates.name || args.updates.name.trim().length === 0) {
        throw new Error("Roster name is required");
      }
      if (args.updates.name.length > 100) {
        throw new Error("Roster name must be 100 characters or less");
      }

      // Check for duplicate name on same game date (if different from current)
      const trimmedName = args.updates.name.trim();
      if (trimmedName !== roster.name) {
        const existingRoster = await ctx.db
          .query("rosters")
          .withIndex("by_team_date", (q) => 
            q.eq("teamId", roster.teamId).eq("gameDate", roster.gameDate)
          )
          .filter((q) => q.eq(q.field("name"), trimmedName))
          .first();

        if (existingRoster) {
          throw new Error("Roster with this name already exists for this game date");
        }
      }

      updates.name = trimmedName;
    }

    if (args.updates.playerIds !== undefined) {
      // Validate player count limits
      if (args.updates.playerIds.length < 9) {
        throw new Error("Roster must have at least 9 players");
      }
      if (args.updates.playerIds.length > 30) {
        throw new Error("Roster cannot exceed 30 players");
      }

      // Validate all players belong to the team
      for (const playerId of args.updates.playerIds) {
        const player = await ctx.db.get(playerId);
        if (!player) {
          throw new Error(`Player ${playerId} not found`);
        }
        if (player.teamId !== roster.teamId) {
          throw new Error("One or more players do not belong to this team");
        }
      }

      // Check for duplicate player IDs
      const uniquePlayerIds = new Set(args.updates.playerIds);
      if (uniquePlayerIds.size !== args.updates.playerIds.length) {
        throw new Error("Duplicate players are not allowed in a roster");
      }

      updates.playerIds = args.updates.playerIds;
    }

    if (args.updates.isActive !== undefined) {
      updates.isActive = args.updates.isActive;
    }

    // Update the roster
    await ctx.db.patch(args.rosterId, updates);
    return await ctx.db.get(args.rosterId);
  },
});

// T022: Delete a roster
export const deleteRoster = mutation({
  args: {
    rosterId: v.id("rosters"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Get the roster
    const roster = await ctx.db.get(args.rosterId);
    if (!roster) {
      throw new Error("Roster not found");
    }

    // Validate team ownership
    const team = await ctx.db.get(roster.teamId);
    if (!team || team.userId !== identity.subject) {
      throw new Error("Not authorized to delete this roster");
    }

    // Business rule: Could add check for games using this roster in the future
    // For now, allow deletion

    // Delete the roster
    await ctx.db.delete(args.rosterId);

    return {
      success: true,
      rosterId: args.rosterId,
      message: "Roster deleted successfully",
    };
  },
});

// T023: Get roster with player details (privacy-compliant)
export const getRosterPlayers = query({
  args: {
    rosterId: v.id("rosters"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Get the roster
    const roster = await ctx.db.get(args.rosterId);
    if (!roster) {
      throw new Error("Roster not found");
    }

    // Validate team ownership
    const team = await ctx.db.get(roster.teamId);
    if (!team || team.userId !== identity.subject) {
      throw new Error("Not authorized to access this roster");
    }

    // Get player details with privacy compliance
    const players = [];
    for (const playerId of roster.playerIds) {
      const player = await ctx.db.get(playerId);
      if (player) {
        // Privacy-compliant player data
        const playerData: any = {
          _id: player._id,
          firstName: player.firstName,
          lastNameInitial: player.lastNameInitial,
          isMinor: player.isMinor,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
        };

        // Only include full last name for adults
        if (!player.isMinor && player.lastName) {
          playerData.lastName = player.lastName;
        }

        players.push(playerData);
      }
    }

    return {
      roster: {
        _id: roster._id,
        name: roster.name,
        gameDate: roster.gameDate,
        isActive: roster.isActive,
      },
      players,
    };
  },
});

// T024: Add a player to a roster
export const addPlayerToRoster = mutation({
  args: {
    rosterId: v.id("rosters"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Get the roster
    const roster = await ctx.db.get(args.rosterId);
    if (!roster) {
      throw new Error("Roster not found");
    }

    // Validate team ownership
    const team = await ctx.db.get(roster.teamId);
    if (!team || team.userId !== identity.subject) {
      throw new Error("Not authorized to modify this roster");
    }

    // Get the player
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Validate player belongs to the team
    if (player.teamId !== roster.teamId) {
      throw new Error("Player does not belong to this team");
    }

    // Check if player is already on roster
    if (roster.playerIds.includes(args.playerId)) {
      throw new Error("Player is already on this roster");
    }

    // Check roster size limit
    if (roster.playerIds.length >= 30) {
      throw new Error("Roster has reached maximum player limit");
    }

    // Add player to roster
    const updatedPlayerIds = [...roster.playerIds, args.playerId];
    await ctx.db.patch(args.rosterId, { playerIds: updatedPlayerIds });

    return await ctx.db.get(args.rosterId);
  },
});

// T025: Remove a player from a roster
export const removePlayerFromRoster = mutation({
  args: {
    rosterId: v.id("rosters"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    // Get the roster
    const roster = await ctx.db.get(args.rosterId);
    if (!roster) {
      throw new Error("Roster not found");
    }

    // Validate team ownership
    const team = await ctx.db.get(roster.teamId);
    if (!team || team.userId !== identity.subject) {
      throw new Error("Not authorized to modify this roster");
    }

    // Check if player is on roster
    if (!roster.playerIds.includes(args.playerId)) {
      throw new Error("Player is not on this roster");
    }

    // Check minimum roster size
    if (roster.playerIds.length <= 9) {
      throw new Error("Cannot remove player: roster must have at least 9 players");
    }

    // Remove player from roster
    const updatedPlayerIds = roster.playerIds.filter(id => id !== args.playerId);
    await ctx.db.patch(args.rosterId, { playerIds: updatedPlayerIds });

    return {
      success: true,
      rosterId: args.rosterId,
      playerId: args.playerId,
      message: "Player removed from roster successfully",
    };
  },
});