import React from 'react';
import { Calendar, RotateCcw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useTeams } from '../../hooks/useTeams';
import { Id } from '../../../convex/_generated/dataModel';

interface DeletedTeam {
  _id: Id<"teams">;
  name: string;
  season: string;
  deletedAt?: number;
  _creationTime: number;
}

export function DeletedTeamsList() {
  const { deletedTeams, restoreTeam } = useTeams();

  const handleRestoreTeam = async (teamId: Id<"teams">, teamName: string) => {
    try {
      await restoreTeam(teamId);
      console.log(`Team "${teamName}" restored successfully`);
    } catch (error) {
      console.error('Failed to restore team:', error);
      alert(`Failed to restore team: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDeletedDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!deletedTeams || deletedTeams.length === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Deleted Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No deleted teams found.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Deleted Teams ({deletedTeams.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Teams you've deleted. You can restore them or they'll be permanently removed after 30 days.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {deletedTeams.map((team: DeletedTeam) => (
            <Card key={team._id} className="border-dashed border-muted-foreground/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-muted-foreground">{team.name}</h3>
                    <Badge variant="outline" className="text-xs mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {team.season}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  <div>Created: {formatDate(team._creationTime)}</div>
                  <div>Deleted: {formatDeletedDate(team.deletedAt)}</div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestoreTeam(team._id, team.name)}
                    className="flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete Forever
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}