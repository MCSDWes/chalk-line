import { useMutation, useQuery } from "convex/react";
import { useAuth } from "./useAuth";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface CreatePlayerData {
  firstName: string;
  lastNameInitial: string;
  lastName?: string;
  isMinor: boolean;
  position: string;
  jerseyNumber?: number;
}

export interface UpdatePlayerData {
  firstName?: string;
  position?: string;
  jerseyNumber?: number;
}

export function usePlayers(teamId?: Id<"teams">) {
  const { user } = useAuth();
  const userId = user?.id;

  const players = useQuery(
    api.players.getTeamPlayers,
    userId && teamId ? { userId, teamId } : "skip"
  );

  const createPlayerMutation = useMutation(api.players.createPlayer);
  const updatePlayerMutation = useMutation(api.players.updatePlayer);
  const removePlayerMutation = useMutation(api.players.removePlayer);

  const createPlayer = async (playerData: CreatePlayerData) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    if (!teamId) {
      throw new Error("Team must be selected");
    }
    
    return await createPlayerMutation({
      teamId,
      userId,
      ...playerData,
    });
  };

  const updatePlayer = async (playerId: Id<"players">, updates: UpdatePlayerData) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await updatePlayerMutation({
      playerId,
      userId,
      updates,
    });
  };

  const removePlayer = async (playerId: Id<"players">) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await removePlayerMutation({
      playerId,
      userId,
    });
  };

  return {
    players,
    createPlayer,
    updatePlayer,
    removePlayer,
    isLoading: players === undefined && userId !== undefined && teamId !== undefined,
  };
}

// Valid baseball positions for form validation
export const VALID_POSITIONS = [
  { value: 'pitcher', label: 'Pitcher (P)' },
  { value: 'catcher', label: 'Catcher (C)' },
  { value: 'first-base', label: 'First Base (1B)' },
  { value: 'second-base', label: 'Second Base (2B)' },
  { value: 'third-base', label: 'Third Base (3B)' },
  { value: 'shortstop', label: 'Shortstop (SS)' },
  { value: 'left-field', label: 'Left Field (LF)' },
  { value: 'center-field', label: 'Center Field (CF)' },
  { value: 'right-field', label: 'Right Field (RF)' },
  { value: 'designated-hitter', label: 'Designated Hitter (DH)' },
  { value: 'coach', label: 'Coach' },
  { value: 'manager', label: 'Manager' },
];