import { useState } from "react";
import { Plus, Users, Calendar, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTeams } from "@/hooks/useTeams";
import { TeamForm } from "./TeamForm";
import { TeamDetailView } from "./TeamDetailView";
import { Id } from "../../../convex/_generated/dataModel";

interface Team {
  _id: Id<"teams">;
  _creationTime: number;
  userId: string;
  name: string;
  season: string;
}

interface TeamListProps {
  selectedTeam?: Team | null;
  onTeamSelect?: (team: Team | null) => void;
}

export function TeamList({ selectedTeam, onTeamSelect }: TeamListProps) {
  const { teams, deleteTeam, isLoading } = useTeams();
  const [deletingTeam, setDeletingTeam] = useState<Id<"teams"> | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Use internal state if no external state is provided (for backwards compatibility)
  const [internalSelectedTeam, setInternalSelectedTeam] = useState<Team | null>(null);
  const currentSelectedTeam = selectedTeam !== undefined ? selectedTeam : internalSelectedTeam;
  const setSelectedTeam = onTeamSelect || setInternalSelectedTeam;

  const handleDeleteTeam = async (team: Team) => {
    try {
      setDeleteError(null);
      setDeletingTeam(team._id);
      await deleteTeam(team._id);
      setDeletingTeam(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete team");
      setDeletingTeam(null);
    }
  };

  // If a team is selected, show the detail view
  if (currentSelectedTeam) {
    return (
      <TeamDetailView 
        team={currentSelectedTeam} 
        onBack={() => setSelectedTeam(null)} 
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
        <p className="text-gray-600 mb-6">
          Get started by creating your first team. You can manage players and rosters once you have a team set up.
        </p>
        <TeamForm 
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Team
            </Button>
          } 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Teams</h1>
          <p className="text-gray-600">Manage your baseball teams and track their progress.</p>
        </div>
        <TeamForm 
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Team
            </Button>
          } 
        />
      </div>

      {deleteError && (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <CardDescription className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    {team.season}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-1">
                  <TeamForm 
                    team={team}
                    trigger={
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                    }
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Team</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete "{team.name}"? This action cannot be undone and will also delete all players and rosters associated with this team.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">Cancel</Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleDeleteTeam(team)}
                          disabled={deletingTeam === team._id}
                        >
                          {deletingTeam === team._id ? "Deleting..." : "Delete Team"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  Created {new Date(team._creationTime).toLocaleDateString()}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedTeam(team)}
                >
                  <Users className="mr-1 h-3 w-3" />
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}