import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Simple userId for now - in production this would come from auth
const TEMP_USER_ID = "user_temp_123";

export function useTeams() {
  const teams = useQuery(api.teams.getUserTeams, { userId: TEMP_USER_ID });
  const deletedTeams = useQuery(api.teams.getDeletedTeams, { userId: TEMP_USER_ID });
  const archivedTeams = useQuery(api.teams.getArchivedTeams, { userId: TEMP_USER_ID });
  const createTeam = useMutation(api.teams.createTeam);
  const updateTeam = useMutation(api.teams.updateTeam);
  const deleteTeam = useMutation(api.teams.deleteTeam);
  const restoreTeam = useMutation(api.teams.restoreTeam);
  const archiveTeam = useMutation(api.teams.archiveTeam);

  return {
    teams,
    deletedTeams,
    archivedTeams,
    createTeam: (name: string, season: string) => createTeam({ userId: TEMP_USER_ID, name, season }),
    updateTeam: (teamId: Id<"teams">, updates: { name?: string; season?: string }) => updateTeam({ userId: TEMP_USER_ID, teamId, updates }),
    deleteTeam: (teamId: Id<"teams">) => deleteTeam({ userId: TEMP_USER_ID, teamId }),
    restoreTeam: (teamId: Id<"teams">) => restoreTeam({ userId: TEMP_USER_ID, teamId }),
    archiveTeam: (teamId: Id<"teams">, reason: string) => archiveTeam({ userId: TEMP_USER_ID, teamId, reason }),
  };
}