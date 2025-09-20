import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export interface CreateGameParams {
  homeTeamId: Id<"teams">;
  awayTeamName: string;
  gameDate: string;
  gameTime?: string;
  field?: string;
  season: string;
  gameType: 'regular' | 'playoff' | 'championship' | 'scrimmage' | 'tournament';
}

export interface StartGameParams {
  gameId: Id<"games">;
  awayTeamLineup?: Array<{
    playerName: string;
    battingPosition: number;
    fieldPosition: string;
  }>;
}

export interface UpdateInningScoreParams {
  gameId: Id<"games">;
  inningNumber: number;
  isHomeTeam: boolean;
  runs: number;
  hits?: number;
  errors?: number;
}

export interface NextInningParams {
  gameId: Id<"games">;
}

export interface UpdateScoreParams {
  gameId: Id<"games">;
  homeScore: number;
  awayScore: number;
}

export interface AdvanceInningParams {
  gameId: Id<"games">;
}

export interface CompleteGameParams {
  gameId: Id<"games">;
}

export interface RecordAtBatParams {
  gameId: Id<"games">;
  playerId: Id<"players">;
  result: 'single' | 'double' | 'triple' | 'home_run' | 'walk' | 'strikeout' | 'groundout' | 'flyout' | 'foul_out' | 'hit_by_pitch' | 'sacrifice_fly' | 'sacrifice_bunt' | 'fielders_choice' | 'error' | 'interference';
  rbis?: number;
  runsScored?: number;
}

export function useGames() {
  // Queries
  const games = useQuery(api.games.getUserGames, {});
  const gameById = (gameId: Id<"games">) => useQuery(api.games.getGame, { gameId });
  const gameStats = (gameId: Id<"games">) => useQuery(api.games.getGameStats, { gameId });
  const gameState = (gameId: Id<"games">) => useQuery(api.games.getGameState, { gameId });

  // Mutations
  const createGameMutation = useMutation(api.games.createGame);
  const startGameMutation = useMutation(api.games.startGame);
  const completeGameMutation = useMutation(api.games.completeGame);
  const recordAtBatMutation = useMutation(api.games.recordAtBat);
  const updateInningScoreMutation = useMutation(api.games.updateInningScore);
  const nextInningMutation = useMutation(api.games.nextInning);
  const migrateGamesMutation = useMutation(api.games.migrateGamesWithHomeTeamName);

  // Wrapper functions
  const createGame = async (params: CreateGameParams) => {
    return await createGameMutation(params);
  };

  const startGame = async (params: StartGameParams) => {
    return await startGameMutation(params);
  };

  const completeGame = async (params: CompleteGameParams) => {
    return await completeGameMutation(params);
  };

  const recordAtBat = async (params: RecordAtBatParams) => {
    return await recordAtBatMutation(params);
  };

  const updateInningScore = async (params: UpdateInningScoreParams) => {
    return await updateInningScoreMutation(params);
  };

  const nextInning = async (params: NextInningParams) => {
    return await nextInningMutation(params);
  };

  const migrateGamesWithHomeTeamName = async () => {
    return await migrateGamesMutation({});
  };

  return {
    // Data
    games,
    gameById,
    gameStats,
    gameState,
    
    // Actions
    createGame,
    startGame,
    completeGame,
    recordAtBat,
    updateInningScore,
    nextInning,
    migrateGamesWithHomeTeamName,
  };
}