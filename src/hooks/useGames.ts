import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export interface CreateGameParams {
  homeTeamId?: Id<"teams">;
  awayTeamId?: Id<"teams">;
  homeTeamName?: string;
  awayTeamName?: string;
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
    jerseyNumber?: number;
    battingPosition: number;
    fieldPosition: string;
  }>;
}

export interface UpdateExternalTeamLineupParams {
  gameId: Id<"games">;
  externalTeamLineup: Array<{
    playerName: string;
    jerseyNumber?: number;
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

export interface EnsureInningExistsParams {
  gameId: Id<"games">;
  inningNumber: number;
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
  const ensureInningExistsMutation = useMutation(api.games.ensureInningExists);
  const migrateGamesMutation = useMutation(api.games.migrateGamesWithHomeTeamName);
  const updateExternalTeamLineupMutation = useMutation(api.games.updateExternalTeamLineup);
  const updatePitchCountMutation = useMutation(api.games.updatePitchCount);
  const updateBaseRunnersMutation = useMutation(api.games.updateBaseRunners);
  const advanceInningMutation = useMutation(api.games.advanceInning);

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

  const ensureInningExists = async (params: EnsureInningExistsParams) => {
    return await ensureInningExistsMutation(params);
  };

  const migrateGamesWithHomeTeamName = async () => {
    return await migrateGamesMutation({});
  };

  const updateExternalTeamLineup = async (params: UpdateExternalTeamLineupParams) => {
    return await updateExternalTeamLineupMutation(params);
  };

  const updatePitchCount = async (params: {
    gameId: Id<"games">;
    balls: number;
    strikes: number;
    outs: number;
    currentBatterIndex?: number;
  }) => {
    return await updatePitchCountMutation(params);
  };

  const updateBaseRunners = async (params: {
    gameId: Id<"games">;
    baseRunners: {
      first?: Id<"players">;
      second?: Id<"players">;
      third?: Id<"players">;
    };
  }) => {
    return await updateBaseRunnersMutation(params);
  };

  const advanceInning = async (params: { gameId: Id<"games"> }) => {
    return await advanceInningMutation(params);
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
    ensureInningExists,
    migrateGamesWithHomeTeamName,
    updateExternalTeamLineup,
    updatePitchCount,
    updateBaseRunners,
    advanceInning,
  };
}