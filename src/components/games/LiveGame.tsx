import { useState } from 'react';
import { useGames } from '../../hooks/useGames';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowLeft, Play, Square } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface LiveGameProps {
  gameId: Id<"games">;
  onBackToList: () => void;
}

export function LiveGame({ gameId, onBackToList }: LiveGameProps) {
  const { gameById, gameState, nextInning, completeGame } = useGames();
  const [isUpdating, setIsUpdating] = useState(false);

  // Get game data and state
  const gameData = gameById(gameId);
  const currentGameState = gameState(gameId);

  if (!gameData || !currentGameState) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-500">Loading game data...</p>
        </div>
      </div>
    );
  }

  const { game, homeTeam, awayTeam } = gameData;

  const handleNextInning = async () => {
    setIsUpdating(true);
    try {
      await nextInning({ gameId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteGame = async () => {
    setIsUpdating(true);
    try {
      await completeGame({ gameId });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'suspended': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return 'Live Game';
      case 'completed': return 'Final';
      case 'suspended': return 'Suspended';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Game Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBackToList} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {homeTeam?.name || 'Home'} vs {game.awayTeamName || awayTeam?.name || 'Away'}
          </h1>
          <p className="text-gray-600">
            {formatDate(game.gameDate)}
            {game.gameTime && ` at ${formatTime(game.gameTime)}`}
            {game.field && ` - ${game.field}`}
          </p>
        </div>
        <Badge className={`${getStatusBadgeColor(game.status)} text-white`}>
          {getStatusText(game.status)}
        </Badge>
      </div>

      {/* Current Inning & Score Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {game.currentHalf === 'top' ? 'Top' : 'Bottom'} of Inning {game.currentInning || 1}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            {/* Home Team Score */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{homeTeam?.name || 'Home'}</h3>
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {game.homeScore || 0}
              </div>
              <Badge variant="outline">Home</Badge>
            </div>

            {/* Away Team Score */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{game.awayTeamName || awayTeam?.name || 'Away'}</h3>
              <div className="text-6xl font-bold text-red-600 mb-2">
                {game.awayScore || 0}
              </div>
              <Badge variant="outline">Away</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inning by Inning Scoreboard */}
      <Card>
        <CardHeader>
          <CardTitle>Inning by Inning</CardTitle>
        </CardHeader>
        <CardContent>
          {currentGameState?.innings && currentGameState.innings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Team</th>
                    {currentGameState.innings.map((inning) => (
                      <th key={inning.inningNumber} className="text-center py-2 min-w-[40px]">
                        {inning.inningNumber}
                      </th>
                    ))}
                    <th className="text-center py-2 font-bold">R</th>
                    <th className="text-center py-2 font-bold">H</th>
                    <th className="text-center py-2 font-bold">E</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">{game.awayTeamName || awayTeam?.name || 'Away'}</td>
                    {currentGameState.innings.map((inning) => (
                      <td key={`away-${inning.inningNumber}`} className="text-center py-2">
                        {inning.awayRuns || 0}
                      </td>
                    ))}
                    <td className="text-center py-2 font-bold">{game.awayScore || 0}</td>
                    <td className="text-center py-2">
                      {currentGameState.innings.reduce((sum, inn) => sum + (inn.awayHits || 0), 0)}
                    </td>
                    <td className="text-center py-2">
                      {currentGameState.innings.reduce((sum, inn) => sum + (inn.awayErrors || 0), 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">{homeTeam?.name || 'Home'}</td>
                    {currentGameState.innings.map((inning) => (
                      <td key={`home-${inning.inningNumber}`} className="text-center py-2">
                        {inning.homeRuns || 0}
                      </td>
                    ))}
                    <td className="text-center py-2 font-bold">{game.homeScore || 0}</td>
                    <td className="text-center py-2">
                      {currentGameState.innings.reduce((sum, inn) => sum + (inn.homeHits || 0), 0)}
                    </td>
                    <td className="text-center py-2">
                      {currentGameState.innings.reduce((sum, inn) => sum + (inn.homeErrors || 0), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">No innings recorded yet</p>
          )}
        </CardContent>
      </Card>

      {/* Game Controls */}
      {game.status === 'in_progress' && (
        <Card>
          <CardHeader>
            <CardTitle>Game Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleNextInning}
                disabled={isUpdating}
                variant="outline"
                className="flex items-center justify-center"
              >
                <Play className="h-4 w-4 mr-2" />
                {isUpdating ? 'Updating...' : 'Next Half Inning'}
              </Button>
              
              <Button
                onClick={handleCompleteGame}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
              >
                <Square className="h-4 w-4 mr-2" />
                {isUpdating ? 'Completing...' : 'Complete Game'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Info */}
      <Card>
        <CardHeader>
          <CardTitle>Game Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Game Type:</strong> {game.gameType}
            </div>
            <div>
              <strong>Season:</strong> {game.season}
            </div>
            {game.field && (
              <div>
                <strong>Field:</strong> {game.field}
              </div>
            )}
            <div>
              <strong>Status:</strong> {getStatusText(game.status)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 space-y-2">
            <p>🏃 At-bat tracking and base running</p>
            <p>⚾ Pitch counts and strike zones</p>
            <p>📊 Real-time player statistics</p>
            <p>📱 Mobile-optimized scorekeeping</p>
            <p className="text-xs mt-4">These features will be available in upcoming updates!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}