import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { usePlayers } from '../../hooks/usePlayers';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Users, Edit, CheckCircle, AlertCircle } from 'lucide-react';
import { LineupForm } from './LineupForm';
import type { Id } from '../../../convex/_generated/dataModel';

interface Game {
  _id: Id<"games">;
  homeTeamId?: Id<"teams">;
  homeTeamName?: string;
  awayTeamId?: Id<"teams">;
  awayTeamName?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'suspended' | 'cancelled';
}

interface LineupManagerProps {
  game: Game;
  onLineupsReady: () => void;
}

export function LineupManager({ game, onLineupsReady }: LineupManagerProps) {
  const [editingHomeLineup, setEditingHomeLineup] = useState(false);
  
  // Call useQuery directly instead of through getGameLineup function
  const homeLineup = useQuery(
    api.lineups.getGameLineup, 
    game.homeTeamId ? { gameId: game._id, teamId: game.homeTeamId } : "skip"
  );
  
  const { players } = usePlayers(game.homeTeamId);

  // Early return if game data is incomplete
  if (!game.homeTeamId || !game.homeTeamName) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Game Lineup Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Game data is incomplete. Please check the game configuration.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show loading state while players are being fetched
  if (players === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Game Lineup Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Loading players...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Players are already filtered by team from the hook
  const homeTeamPlayers = players || [];

  const handleLineupSaved = () => {
    setEditingHomeLineup(false);
    // Check if home team lineup is complete and call onLineupsReady
    if (homeLineup?.lineup?.battingOrder && homeLineup.lineup.battingOrder.length > 0) {
      onLineupsReady();
    }
  };

  const getLineupStatus = (lineup: any) => {
    if (!lineup) {
      return { status: 'missing', icon: AlertCircle, text: 'No lineup set', color: 'text-red-600' };
    }
    if (lineup.battingOrder.length === 0) {
      return { status: 'empty', icon: AlertCircle, text: 'Empty lineup', color: 'text-yellow-600' };
    }
    return { status: 'ready', icon: CheckCircle, text: `${lineup.battingOrder.length} players`, color: 'text-green-600' };
  };

  if (editingHomeLineup) {
    return (
      <LineupForm
        gameId={game._id}
        teamId={game.homeTeamId}
        teamName={game.homeTeamName || 'Home Team'}
        isHomeTeam={true}
        players={homeTeamPlayers}
        onSaveComplete={handleLineupSaved}
        onCancel={() => setEditingHomeLineup(false)}
      />
    );
  }

  const homeStatus = getLineupStatus(homeLineup?.lineup);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Game Lineups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Home Team Lineup */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="default">Home</Badge>
                <div>
                  <h3 className="font-medium">{game.homeTeamName}</h3>
                  <div className="flex items-center gap-2">
                    <homeStatus.icon className={`h-4 w-4 ${homeStatus.color}`} />
                    <span className={`text-sm ${homeStatus.color}`}>
                      {homeStatus.text}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setEditingHomeLineup(true)}
                size="sm"
                variant="outline"
                disabled={game.status !== 'scheduled'}
              >
                <Edit className="h-4 w-4 mr-1" />
                {homeLineup?.lineup ? 'Edit Lineup' : 'Set Lineup'}
              </Button>
            </div>

            {/* Away Team - External Only */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Away</Badge>
                <div>
                  <h3 className="font-medium">{game.awayTeamName || 'Away Team'}</h3>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">
                      External team
                    </span>
                  </div>
                </div>
              </div>
              <Badge variant="outline">External</Badge>
            </div>

            {game.status === 'scheduled' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  📋 Lineup Setup Required
                </h4>
                <p className="text-sm text-blue-700">
                  Set your team's lineup before starting the game. The away team lineup will be managed during the game.
                </p>
                {homeStatus.status === 'ready' && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-700 font-medium">
                      ✅ Your lineup is ready! You can start the game.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Home Team Lineup Preview */}
            {homeLineup?.lineup && homeLineup.lineup.battingOrder.length > 0 && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-medium mb-3">{game.homeTeamName} Batting Order</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {homeLineup.lineup.battingOrder.map((spot, index) => {
                    const player = homeLineup.players?.find(p => p?._id === spot.playerId);
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                          {spot.battingPosition}
                        </Badge>
                        <span className="flex-1">
                          {player ? `${player.firstName} ${player.lastNameInitial}.` : 'Unknown'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {spot.fieldPosition}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}