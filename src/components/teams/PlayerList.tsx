import React, { useState } from 'react';
import { Edit, Trash2, Users, Shield, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { usePlayers, VALID_POSITIONS } from '../../hooks/usePlayers';
import { Id } from '../../../convex/_generated/dataModel';

interface Player {
  _id: Id<"players">;
  firstName: string;
  lastNameInitial: string;
  lastName?: string;
  isMinor: boolean;
  position: string;
  jerseyNumber?: number;
  _creationTime: number;
}

interface PlayerListProps {
  teamId: Id<"teams">;
  onEditPlayer?: (player: Player) => void;
}

export function PlayerList({ teamId, onEditPlayer }: PlayerListProps) {
  const { players, removePlayer } = usePlayers(teamId);
  const [removingPlayerId, setRemovingPlayerId] = useState<Id<"players"> | null>(null);

  const handleRemovePlayer = async (playerId: Id<"players">, playerName: string) => {
    if (!confirm(`Are you sure you want to remove ${playerName} from the team?`)) {
      return;
    }

    try {
      setRemovingPlayerId(playerId);
      await removePlayer(playerId);
    } catch (error) {
      console.error('Failed to remove player:', error);
      alert(`Failed to remove player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setRemovingPlayerId(null);
    }
  };

  const getDisplayName = (player: Player): string => {
    if (player.isMinor) {
      // Minors: Only show "FirstName L." format
      return `${player.firstName} ${player.lastNameInitial}.`;
    } else {
      // Adults: Show full name if available, otherwise use initial
      if (player.lastName && player.lastName.trim()) {
        return `${player.firstName} ${player.lastName}`;
      } else {
        return `${player.firstName} ${player.lastNameInitial}.`;
      }
    }
  };

  const getPositionLabel = (position: string): string => {
    const positionInfo = VALID_POSITIONS.find(p => p.value === position);
    return positionInfo ? positionInfo.label : position;
  };

  const formatJoinDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!players) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading players...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (players.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Players
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Players Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your team by adding your first player.
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
          Team Players ({players.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Privacy-compliant player management with COPPA compliance
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {players.map((player: Player) => (
            <div
              key={player._id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Jersey Number */}
                {player.jerseyNumber !== undefined && player.jerseyNumber !== null ? (
                  <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full font-bold text-sm">
                    {player.jerseyNumber}
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-10 h-10 bg-muted text-muted-foreground rounded-full">
                    <User className="h-5 w-5" />
                  </div>
                )}

                {/* Player Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{getDisplayName(player)}</span>
                    {player.isMinor && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Minor
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{getPositionLabel(player.position)}</span>
                    <span>•</span>
                    <span>Joined {formatJoinDate(player._creationTime)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditPlayer?.(player)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemovePlayer(player._id, getDisplayName(player))}
                  disabled={removingPlayerId === player._id}
                  className="flex items-center gap-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-3 w-3" />
                  {removingPlayerId === player._id ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Player Statistics */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{players.length}</div>
              <div className="text-xs text-muted-foreground">Total Players</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {players.filter(p => p.isMinor).length}
              </div>
              <div className="text-xs text-muted-foreground">Minors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {players.filter(p => !p.isMinor).length}
              </div>
              <div className="text-xs text-muted-foreground">Adults</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {players.filter(p => p.jerseyNumber !== undefined && p.jerseyNumber !== null).length}
              </div>
              <div className="text-xs text-muted-foreground">With Jersey #</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}