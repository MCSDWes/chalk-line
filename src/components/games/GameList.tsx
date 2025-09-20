import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

interface Game {
  _id: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  gameDate: string;
  gameTime?: string;
  field?: string;
  season: string;
  gameType: 'regular' | 'playoff' | 'championship' | 'scrimmage' | 'tournament';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  homeScore?: number;
  awayScore?: number;
  currentInning?: number;
  inningHalf?: 'top' | 'bottom';
  createdAt: string;
}

interface GameListProps {
  games: Game[];
  onStartGame: (gameId: string) => void;
  onViewGame: (gameId: string) => void;
  onDeleteGame: (gameId: string) => void;
  isLoading?: boolean;
}

export function GameList({ 
  games, 
  onStartGame, 
  onViewGame, 
  onDeleteGame, 
  isLoading = false 
}: GameListProps) {
  const [selectedSeason, setSelectedSeason] = useState<string>('all');

  // Get unique seasons from games
  const seasons = Array.from(new Set(games.map(game => game.season))).sort().reverse();

  // Filter games by selected season
  const filteredGames = selectedSeason === 'all' 
    ? games 
    : games.filter(game => game.season === selectedSeason);

  // Sort games by date (most recent first)
  const sortedGames = [...filteredGames].sort((a, b) => 
    new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const getStatusBadge = (status: Game['status']) => {
    const variants = {
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const labels = {
      scheduled: 'Scheduled',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getGameTypeLabel = (gameType: Game['gameType']) => {
    const labels = {
      regular: 'Regular',
      playoff: 'Playoff',
      championship: 'Championship',
      scrimmage: 'Scrimmage',
      tournament: 'Tournament'
    };
    return labels[gameType];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading games...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Season Filter */}
      {seasons.length > 1 && (
        <div className="flex items-center space-x-2">
          <label htmlFor="seasonFilter" className="text-sm font-medium">
            Filter by season:
          </label>
          <select
            id="seasonFilter"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Seasons</option>
            {seasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>
      )}

      {/* Games List */}
      {sortedGames.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              {selectedSeason === 'all' 
                ? 'No games found. Create your first game!' 
                : `No games found for ${selectedSeason} season.`
              }
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedGames.map((game) => (
            <Card key={game._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {game.homeTeamName} vs {game.awayTeamName}
                      </h3>
                      {getStatusBadge(game.status)}
                      <Badge variant="outline" className="text-xs">
                        {getGameTypeLabel(game.gameType)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <strong>Date:</strong> {formatDate(game.gameDate)}
                      </div>
                      {game.gameTime && (
                        <div>
                          <strong>Time:</strong> {formatTime(game.gameTime)}
                        </div>
                      )}
                      {game.field && (
                        <div>
                          <strong>Field:</strong> {game.field}
                        </div>
                      )}
                      <div>
                        <strong>Season:</strong> {game.season}
                      </div>
                    </div>

                    {/* Score Display */}
                    {(game.status === 'in_progress' || game.status === 'completed') && (
                      <div className="mt-2 p-2 bg-gray-50 rounded border">
                        <div className="text-sm font-medium">
                          Score: {game.homeTeamName} {game.homeScore ?? 0} - {game.awayScore ?? 0} {game.awayTeamName}
                        </div>
                        {game.status === 'in_progress' && game.currentInning && (
                          <div className="text-xs text-gray-600">
                            {game.inningHalf === 'top' ? 'Top' : 'Bottom'} of inning {game.currentInning}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 ml-4">
                    {game.status === 'scheduled' && (
                      <Button
                        onClick={() => onStartGame(game._id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Start Game
                      </Button>
                    )}
                    
                    {game.status === 'in_progress' && (
                      <Button
                        onClick={() => onViewGame(game._id)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Continue
                      </Button>
                    )}
                    
                    {game.status === 'completed' && (
                      <Button
                        onClick={() => onViewGame(game._id)}
                        size="sm"
                        variant="outline"
                      >
                        View Details
                      </Button>
                    )}

                    {game.status === 'scheduled' && (
                      <Button
                        onClick={() => onDeleteGame(game._id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}