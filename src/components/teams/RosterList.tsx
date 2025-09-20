import { useState } from 'react';
import { Edit, Trash2, Users, Calendar, Eye, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useRosters } from '../../hooks/useRosters';
import { Id } from '../../../convex/_generated/dataModel';

interface Roster {
  _id: Id<"rosters">;
  teamId: Id<"teams">;
  name: string;
  gameDate: string;
  playerIds: Id<"players">[];
  isActive: boolean;
  _creationTime: number;
}

interface RosterListProps {
  teamId: Id<"teams">;
  onEditRoster?: (roster: Roster) => void;
  onViewRoster?: (roster: Roster) => void;
}

export function RosterList({ teamId, onEditRoster, onViewRoster }: RosterListProps) {
  const { rosters, deleteRoster, updateRoster } = useRosters(teamId);
  const [deletingRosterId, setDeletingRosterId] = useState<Id<"rosters"> | null>(null);
  const [togglingRosterId, setTogglingRosterId] = useState<Id<"rosters"> | null>(null);

  const handleDeleteRoster = async (roster: Roster) => {
    if (!confirm(`Are you sure you want to delete "${roster.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingRosterId(roster._id);
      await deleteRoster(roster._id);
    } catch (error) {
      console.error('Failed to delete roster:', error);
      alert(`Failed to delete roster: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingRosterId(null);
    }
  };

  const handleToggleActiveStatus = async (roster: Roster) => {
    try {
      setTogglingRosterId(roster._id);
      await updateRoster(roster._id, { isActive: !roster.isActive });
    } catch (error) {
      console.error('Failed to toggle roster status:', error);
      alert(`Failed to toggle roster status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTogglingRosterId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatCreatedDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPlayerCountBadgeColor = (count: number) => {
    if (count < 9) return 'destructive';
    if (count >= 9 && count <= 15) return 'default';
    return 'secondary';
  };

  if (!rosters) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Rosters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading rosters...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (rosters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Rosters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rosters Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first roster to manage lineups and track players for games.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Rosters ({rosters.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rosters.map((roster) => (
            <div
              key={roster._id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Roster Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{roster.name}</h3>
                    <Badge variant={roster.isActive ? "default" : "secondary"}>
                      {roster.isActive ? (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3 mr-1" />
                          Draft
                        </>
                      )}
                    </Badge>
                    <Badge 
                      variant={getPlayerCountBadgeColor(roster.playerIds.length)}
                      className="flex items-center gap-1"
                    >
                      <Users className="h-3 w-3" />
                      {roster.playerIds.length} players
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(roster.gameDate)}
                    </span>
                    <span>•</span>
                    <span>Created {formatCreatedDate(roster._creationTime)}</span>
                  </div>

                  {/* Player Count Warning */}
                  {roster.playerIds.length < 9 && (
                    <div className="mt-2">
                      <Badge variant="destructive" className="text-xs">
                        ⚠️ Need {9 - roster.playerIds.length} more players for valid lineup
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewRoster?.(roster)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditRoster?.(roster)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActiveStatus(roster)}
                    disabled={togglingRosterId === roster._id}
                    className="flex items-center gap-1"
                  >
                    {roster.isActive ? (
                      <>
                        <Pause className="h-3 w-3" />
                        {togglingRosterId === roster._id ? 'Deactivating...' : 'Deactivate'}
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        {togglingRosterId === roster._id ? 'Activating...' : 'Activate'}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRoster(roster)}
                    disabled={deletingRosterId === roster._id}
                    className="flex items-center gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                    {deletingRosterId === roster._id ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Roster Statistics */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{rosters.length}</div>
              <div className="text-xs text-muted-foreground">Total Rosters</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {rosters.filter(r => r.isActive).length}
              </div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {rosters.filter(r => !r.isActive).length}
              </div>
              <div className="text-xs text-muted-foreground">Drafts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {rosters.filter(r => r.playerIds.length >= 9).length}
              </div>
              <div className="text-xs text-muted-foreground">Game Ready</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}