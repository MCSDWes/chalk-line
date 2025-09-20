import { useMutation, useQuery } from "convex/react";
import { useAuth } from "./useAuth";
import { api } from "../../convex/_generated/api";

export function useTeams() {
  const { user } = useAuth();
  const userId = user?.id;

  const teams = useQuery(
    api.teams.getUserTeams,
    userId ? { userId } : "skip"
  );

  const createTeam = useMutation(api.teams.createTeam);

  const createNewTeam = async (name: string, season: string) => {
    if (!userId) {
      throw new Error("User must be authenticated");
    }
    
    return await createTeam({
      userId,
      name,
      season,
    });
  };

  return {
    teams,
    createTeam: createNewTeam,
    isLoading: teams === undefined && userId !== undefined,
  };
}