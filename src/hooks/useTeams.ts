import { useMutation, useQuery } from "convex/react";
import { useAuth } from "./useAuth";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useTeams() {
  const { user } = useAuth();
  const userId = user?.id;

  const teams = useQuery(
    api.teams.getUserTeams,
    userId ? { userId } : "skip"
  );

  const createTeamMutation = useMutation(api.teams.createTeam);
  const updateTeamMutation = useMutation(api.teams.updateTeam);
  const deleteTeamMutation = useMutation(api.teams.deleteTeam);

  const createTeam = async (name: string, season: string) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await createTeamMutation({
      userId,
      name,
      season,
    });
  };

  const updateTeam = async (teamId: Id<"teams">, updates: { name?: string; season?: string }) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await updateTeamMutation({
      teamId,
      userId,
      updates,
    });
  };

  const deleteTeam = async (teamId: Id<"teams">) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await deleteTeamMutation({
      teamId,
      userId,
    });
  };

  return {
    teams,
    createTeam,
    updateTeam,
    deleteTeam,
    isLoading: teams === undefined && userId !== undefined,
  };
}