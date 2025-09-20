import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useTeams() {
  const teams = useQuery(api.teams.getUserTeams, {});
  const deletedTeams = useQuery(api.teams.getDeletedTeams, {});
  const archivedTeams = useQuery(api.teams.getArchivedTeams, {});
  
  const createTeam = useMutation(api.teams.createTeam);
  const updateTeam = useMutation(api.teams.updateTeam);
  const deleteTeam = useMutation(api.teams.deleteTeam);
  const restoreTeam = useMutation(api.teams.restoreTeam);
  const archiveTeam = useMutation(api.teams.archiveTeam);

  return {
    teams,
    deletedTeams,
    archivedTeams,
    createTeam: (name: string, season: string) => createTeam({ name, season }),
    updateTeam: (teamId: Id<"teams">, updates: { name?: string; season?: string }) => updateTeam({ teamId, updates }),
    deleteTeam: (teamId: Id<"teams">) => deleteTeam({ teamId }),
    restoreTeam: (teamId: Id<"teams">) => restoreTeam({ teamId }),
    archiveTeam: (teamId: Id<"teams">, reason: string) => archiveTeam({ teamId, reason }),
    isLoading: teams === undefined,
  };
}