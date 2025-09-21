import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { usePlayers } from '../../hooks/usePlayers';
import { useGames } from '../../hooks/useGames';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Users, Edit, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { LineupForm } from './LineupForm';
import { ExternalTeamLineupForm } from './ExternalTeamLineupForm';
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
  const [editingUserLineup, setEditingUserLineup] = useState(false);
  const [editingExternalLineup, setEditingExternalLineup] = useState(false);
  
  // Determine which team belongs to the user (could be home or away)
  const userTeamId = game.homeTeamId || game.awayTeamId;
  const userTeamName = game.homeTeamId ? game.homeTeamName : game.awayTeamName;
  const isHomeTeam = !!game.homeTeamId;
  const opponentTeamName = isHomeTeam ? game.awayTeamName : game.homeTeamName;
  
  // Get user's team lineup
  const userLineup = useQuery(
    api.lineups.getGameLineup, 
    userTeamId ? { gameId: game._id, teamId: userTeamId } : "skip"
  );
  
  // Get game state for external team lineup
  const gameState = useQuery(api.games.getGameState, { gameId: game._id });
  const { updateExternalTeamLineup } = useGames();

  const { players } = usePlayers(userTeamId);
  const { startGame } = useGames();

  // Calculate lineup statistics
  const userLineupStats = userLineup ? {
    players: userLineup.players.length,
    complete: userLineup.players.length >= 9
  } : { players: 0, complete: false };

  const externalLineupStats = gameState?.gameState?.awayTeamPlayers ? {
    players: gameState.gameState.awayTeamPlayers.length,
    complete: gameState.gameState.awayTeamPlayers.length >= 9
  } : { players: 0, complete: false };

  const isGameReady = userLineupStats.complete && externalLineupStats.complete;

  const handleStartGame = async () => {
    if (!isGameReady) return;
    
    try {
      await startGame({
        gameId: game._id
      });
      onLineupsReady(); // Notify parent that game is starting
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  // Early return if game data is incomplete
  if (!userTeamId || !userTeamName) {
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

  const handleLineupSaved = () => {
    setEditingUserLineup(false);
    // Check if user team lineup is complete and call onLineupsReady
    if (userLineup?.lineup?.battingOrder && userLineup.lineup.battingOrder.length > 0) {
      onLineupsReady();
    }
  };

  const handleExternalLineupSaved = async (lineup: Array<{
    playerName: string;
    jerseyNumber?: number;
    battingPosition: number;
    fieldPosition: string;
  }>) => {
    try {
      await updateExternalTeamLineup({
        gameId: game._id,
        externalTeamLineup: lineup
      });
      setEditingExternalLineup(false);
    } catch (error) {
      console.error('Failed to save external lineup:', error);
      // TODO: Show error message to user
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

  const getExternalLineupStatus = (externalPlayers: any[]) => {
    if (!externalPlayers || externalPlayers.length === 0) {
      return { status: 'missing', icon: AlertCircle, text: 'No lineup set', color: 'text-red-600' };
    }
    return { status: 'ready', icon: CheckCircle, text: `${externalPlayers.length} players`, color: 'text-green-600' };
  };

  if (editingUserLineup) {
    return (
      <LineupForm
        gameId={game._id}
        teamId={userTeamId}
        teamName={userTeamName}
        isHomeTeam={isHomeTeam}
        players={players || []}
        onSaveComplete={handleLineupSaved}
        onCancel={() => setEditingUserLineup(false)}
      />
    );
  }

  if (editingExternalLineup && opponentTeamName) {
    return (
      <ExternalTeamLineupForm
        awayTeamName={opponentTeamName}
        existingLineup={gameState?.gameState?.awayTeamPlayers || []}
        onSubmit={handleExternalLineupSaved}
        onCancel={() => setEditingExternalLineup(false)}
        mode="edit"
      />
    );
  }

  const userStatus = getLineupStatus(userLineup?.lineup);
  const externalStatus = getExternalLineupStatus(gameState?.gameState?.awayTeamPlayers || []);

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
            {/* Your Team Lineup */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="default">{isHomeTeam ? 'Home' : 'Away'}</Badge>
                <div>
                  <h3 className="font-medium">{userTeamName} (Your Team)</h3>
                  <div className="flex items-center gap-2">
                    <userStatus.icon className={`h-4 w-4 ${userStatus.color}`} />
                    <span className={`text-sm ${userStatus.color}`}>
                      {userStatus.text}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setEditingUserLineup(true)}
                size="sm"
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-1" />
                {userLineup?.lineup ? 'Edit Lineup' : 'Set Lineup'}
              </Button>
            </div>

            {/* Opponent Team */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{isHomeTeam ? 'Away' : 'Home'}</Badge>
                <div>
                  <h3 className="font-medium">{opponentTeamName}</h3>
                  <div className="flex items-center gap-2">
                    <externalStatus.icon className={`h-4 w-4 ${externalStatus.color}`} />
                    <span className={`text-sm ${externalStatus.color}`}>
                      {externalStatus.text}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setEditingExternalLineup(true)}
                size="sm"
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-1" />
                {gameState?.gameState?.awayTeamPlayers?.length ? 'Edit Lineup' : 'Set Lineup'}
              </Button>
            </div>

            {game.status === 'scheduled' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  📋 Lineup Setup Required
                </h4>
                <p className="text-sm text-blue-700">
                  Set your team's lineup before starting the game. The opposing team lineup will be managed during the game.
                </p>
                {userStatus.status === 'ready' && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-700 font-medium">
                      ✅ Your lineup is ready! You can start the game.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Your Team Lineup Preview */}
            {userLineup?.lineup && userLineup.lineup.battingOrder.length > 0 && (
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-medium mb-3">{userTeamName} Batting Order</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {userLineup.lineup.battingOrder.map((spot, index) => {
                    const player = userLineup.players?.find(p => p?._id === spot.playerId);
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

            {/* External Team Lineup Preview */}
            {gameState?.gameState?.awayTeamPlayers && gameState.gameState.awayTeamPlayers.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium mb-3">{opponentTeamName} Batting Order</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {gameState.gameState.awayTeamPlayers.map((player, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {player.battingPosition}
                      </Badge>
                      <span className="flex-1">
                        {player.playerName}
                        {player.jerseyNumber && (
                          <span className="text-muted-foreground ml-1">#{player.jerseyNumber}</span>
                        )}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {player.fieldPosition}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Start Game Button */}
            {isGameReady && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-800 mb-1">Ready to Start Game!</h4>
                      <p className="text-sm text-green-700">
                        Both lineups are complete. You can now start the game.
                      </p>
                    </div>
                    <Button 
                      onClick={handleStartGame}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="lg"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Game
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}