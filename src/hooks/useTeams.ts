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

  const deletedTeams = useQuery(
    api.teams.getDeletedTeams,
    userId ? { userId } : "skip"
  );

  const archivedTeams = useQuery(
    api.teams.getArchivedTeams,
    userId ? { userId } : "skip"
  );

  const createTeamMutation = useMutation(api.teams.createTeam);
  const updateTeamMutation = useMutation(api.teams.updateTeam);
  const deleteTeamMutation = useMutation(api.teams.deleteTeam);
  const restoreTeamMutation = useMutation(api.teams.restoreTeam);
  const archiveTeamMutation = useMutation(api.teams.archiveTeam);

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

  const restoreTeam = async (teamId: Id<"teams">) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await restoreTeamMutation({
      teamId,
      userId,
    });
  };

  const archiveTeam = async (teamId: Id<"teams">, reason: string) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await archiveTeamMutation({
      teamId,
      userId,
      reason,
    });
  };

  const exportTeamData = (teamId: Id<"teams">) => {
    if (!userId) {
      return null;
    }
    
    // Return the query function that can be called by components
    return useQuery(api.teams.exportTeamData, { teamId, userId });
  };

  return {
    teams,
    deletedTeams,
    archivedTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    restoreTeam,
    archiveTeam,
    exportTeamData,
    isLoading: teams === undefined && userId !== undefined,
  };
}