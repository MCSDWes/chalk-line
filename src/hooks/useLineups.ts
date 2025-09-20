import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export interface LineupSpot {
  playerId: Id<"players">;
  battingPosition: number;
  fieldPosition: 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';
}

export interface SubstitutePlayer {
  playerId: Id<"players">;
  availablePositions: ('P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH')[];
}

export interface SetLineupParams {
  gameId: Id<"games">;
  teamId: Id<"teams">;
  isHomeTeam: boolean;
  battingOrder: LineupSpot[];
  substitutes?: SubstitutePlayer[];
}

export function useLineups() {
  // Queries
  const getGameLineup = (gameId: Id<"games">, teamId: Id<"teams">) => 
    useQuery(api.lineups.getGameLineup, { gameId, teamId });
  
  const getTeamPlayersForLineup = (teamId: Id<"teams">) => 
    useQuery(api.lineups.getTeamPlayersForLineup, { teamId });

  // Mutations
  const setLineupMutation = useMutation(api.lineups.setGameLineup);
  const deleteLineupMutation = useMutation(api.lineups.deleteLineup);

  // Wrapper functions
  const setLineup = async (params: SetLineupParams) => {
    return await setLineupMutation(params);
  };

  const deleteLineup = async (lineupId: Id<"lineups">) => {
    return await deleteLineupMutation({ lineupId });
  };

  return {
    // Data
    getGameLineup,
    getTeamPlayersForLineup,
    
    // Actions
    setLineup,
    deleteLineup,
  };
}