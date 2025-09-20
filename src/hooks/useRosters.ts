import { useMutation, useQuery } from "convex/react";
import { useAuth } from "./useAuth";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface CreateRosterData {
  name: string;
  gameDate: string;
  playerIds: Id<"players">[];
  isActive: boolean;
}

export interface UpdateRosterData {
  name?: string;
  playerIds?: Id<"players">[];
  isActive?: boolean;
}

export interface RosterFilters {
  gameDate?: string;
  isActive?: boolean;
}

export function useRosters(teamId?: Id<"teams">, filters?: RosterFilters) {
  const { user } = useAuth();
  const userId = user?.id;

  // Query rosters for a team
  const rosters = useQuery(
    api.rosters.getTeamRosters,
    userId && teamId ? { 
      teamId, 
      gameDate: filters?.gameDate,
      isActive: filters?.isActive 
    } : "skip"
  );

  // Mutations
  const createRosterMutation = useMutation(api.rosters.createRoster);
  const updateRosterMutation = useMutation(api.rosters.updateRoster);
  const deleteRosterMutation = useMutation(api.rosters.deleteRoster);
  const addPlayerToRosterMutation = useMutation(api.rosters.addPlayerToRoster);
  const removePlayerFromRosterMutation = useMutation(api.rosters.removePlayerFromRoster);

  const createRoster = async (rosterData: CreateRosterData) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    if (!teamId) {
      throw new Error("Team must be selected");
    }
    
    return await createRosterMutation({
      teamId,
      ...rosterData,
    });
  };

  const updateRoster = async (rosterId: Id<"rosters">, updates: UpdateRosterData) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await updateRosterMutation({
      rosterId,
      updates,
    });
  };

  const deleteRoster = async (rosterId: Id<"rosters">) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await deleteRosterMutation({
      rosterId,
    });
  };

  const addPlayerToRoster = async (rosterId: Id<"rosters">, playerId: Id<"players">) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await addPlayerToRosterMutation({
      rosterId,
      playerId,
    });
  };

  const removePlayerFromRoster = async (rosterId: Id<"rosters">, playerId: Id<"players">) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await removePlayerFromRosterMutation({
      rosterId,
      playerId,
    });
  };

  return {
    rosters,
    createRoster,
    updateRoster,
    deleteRoster,
    addPlayerToRoster,
    removePlayerFromRoster,
    isLoading: rosters === undefined && userId !== undefined && teamId !== undefined,
  };
}

// Hook for getting roster details with player information
export function useRosterPlayers(rosterId?: Id<"rosters">) {
  const { user } = useAuth();
  const userId = user?.id;

  const rosterPlayers = useQuery(
    api.rosters.getRosterPlayers,
    userId && rosterId ? { rosterId } : "skip"
  );

  return {
    rosterPlayers,
    isLoading: rosterPlayers === undefined && userId !== undefined && rosterId !== undefined,
  };
}

// Baseball positions for roster management
export const BATTING_ORDER_POSITIONS = [
  { value: 1, label: '1st - Lead-off' },
  { value: 2, label: '2nd - Contact Hitter' },
  { value: 3, label: '3rd - Best Hitter' },
  { value: 4, label: '4th - Cleanup' },
  { value: 5, label: '5th - Power Hitter' },
  { value: 6, label: '6th - RBI Opportunity' },
  { value: 7, label: '7th - Speed/Contact' },
  { value: 8, label: '8th - Pitcher (NL)' },
  { value: 9, label: '9th - Second Lead-off' },
];

export const FIELD_POSITIONS = [
  { value: 'pitcher', label: 'Pitcher (P)', number: 1 },
  { value: 'catcher', label: 'Catcher (C)', number: 2 },
  { value: 'first-base', label: 'First Base (1B)', number: 3 },
  { value: 'second-base', label: 'Second Base (2B)', number: 4 },
  { value: 'third-base', label: 'Third Base (3B)', number: 5 },
  { value: 'shortstop', label: 'Shortstop (SS)', number: 6 },
  { value: 'left-field', label: 'Left Field (LF)', number: 7 },
  { value: 'center-field', label: 'Center Field (CF)', number: 8 },
  { value: 'right-field', label: 'Right Field (RF)', number: 9 },
  { value: 'designated-hitter', label: 'Designated Hitter (DH)', number: 10 },
];