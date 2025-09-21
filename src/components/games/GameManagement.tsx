import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTeams } from '../../hooks/useTeams';
import { useGames } from '../../hooks/useGames';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Play, CheckCircle } from 'lucide-react';
import { GameForm } from './GameForm';
import { GameList } from './GameList';
import { LiveGame } from './LiveGame';
import { LineupManager } from './LineupManager.tsx';
import { ExternalTeamLineupForm } from './ExternalTeamLineupForm';

export function GameManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'lineup' | 'external-lineup' | 'live'>('list');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const { teams, isLoading: teamsLoading } = useTeams();
  const { games, startGame, migrateGamesWithHomeTeamName } = useGames();

  if (teamsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading teams...</div>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Game Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You need to create a team before you can manage games.
          </p>
          <p className="text-sm text-muted-foreground">
            Go to the Teams section to create your first team.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleGameCreated = () => {
    setActiveTab('list');
  };

  const handleSetupLineups = async (gameId: string) => {
    setSelectedGameId(gameId);
    
    // Check if lineups are ready before deciding the action
    const game = games?.find(g => g._id === gameId);
    if (!game) return;
    
    // Go to lineup setup phase
    setActiveTab('lineup');
  };

  const handleLineupsReady = async () => {
    if (!selectedGameId) return;
    
    // Go to external team lineup entry before starting the game
    setActiveTab('external-lineup');
  };

  const handleExternalLineupSubmit = async (externalLineup: Array<{
    playerName: string;
    battingPosition: number;
    fieldPosition: string;
  }>) => {
    if (!selectedGameId) return;
    
    try {
      // Now actually start the game with the external team lineup
      await startGame({
        gameId: selectedGameId as any,
        awayTeamLineup: externalLineup,
      });
      setActiveTab('live');
    } catch (error) {
      console.error('Failed to start game:', error);
      // TODO: Show error message to user
    }
  };

  const handleExternalLineupCancel = () => {
    // Go back to lineup management
    setActiveTab('lineup');
  };

  const handleViewGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setActiveTab('live');
  };

  const handleDeleteGame = async (gameId: string) => {
    // TODO: Implement delete functionality in backend
    console.log('Delete game:', gameId);
  };

  const handleStartGameFromList = async (gameId: string) => {
    try {
      await startGame({
        gameId: gameId as any
      });
      
      setSelectedGameId(gameId);
      setActiveTab('live');
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleBackToList = () => {
    setSelectedGameId(null);
    setActiveTab('list');
  };

  const handleMigrateGames = async () => {
    try {
      const result = await migrateGamesWithHomeTeamName();
      console.log('Migration result:', result);
      alert(`Migration completed: ${result.message}`);
    } catch (error) {
      console.error('Migration failed:', error);
      alert('Migration failed. Check console for details.');
    }
  };

  // Get current game data - use "skip" when no game is selected to avoid calling with invalid ID
  const currentGameData = useQuery(
    api.games.getGame, 
    selectedGameId ? { gameId: selectedGameId as any } : "skip"
  );
  const currentGame = currentGameData?.game;

  // Get lineups for current game to check readiness
  const userTeamId = currentGame?.homeTeamId || currentGame?.awayTeamId;
  const userLineup = useQuery(
    api.lineups.getGameLineup,
    selectedGameId && userTeamId ? { gameId: selectedGameId as any, teamId: userTeamId } : "skip"
  );

  // Check if both lineups are ready
  const isGameReady = () => {
    if (!currentGameData?.gameState || !userLineup) return false;
    
    const userLineupReady = userLineup.players && userLineup.players.length >= 9;
    const externalLineupReady = currentGameData.gameState.awayTeamPlayers && 
                                currentGameData.gameState.awayTeamPlayers.length >= 9;
    
    return userLineupReady && externalLineupReady;
  };

  const handleStartGameDirect = async () => {
    if (!selectedGameId || !currentGameData?.gameState?.awayTeamPlayers) return;
    
    try {
      await startGame({
        gameId: selectedGameId as any,
        awayTeamLineup: currentGameData.gameState.awayTeamPlayers,
      });
      setActiveTab('live');
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Game Management</h1>
        <div className="flex space-x-2">
          <Button
            variant={activeTab === 'list' ? 'default' : 'outline'}
            onClick={() => setActiveTab('list')}
          >
            Games
          </Button>
          <Button
            variant={activeTab === 'create' ? 'default' : 'outline'}
            onClick={() => setActiveTab('create')}
          >
            Create Game
          </Button>
          <Button
            variant="outline"
            onClick={handleMigrateGames}
            className="text-xs"
          >
            Fix Games
          </Button>
        </div>
      </div>

      {activeTab === 'list' && (
        <GameList
          games={games || []}
          onStartGame={handleStartGameFromList}
          onSetupLineups={handleSetupLineups}
          onViewGame={handleViewGame}
          onDeleteGame={handleDeleteGame}
          isLoading={!games}
        />
      )}

      {activeTab === 'create' && (
        <GameForm
          teams={teams}
          onGameCreated={handleGameCreated}
          onCancel={() => setActiveTab('list')}
        />
      )}

      {activeTab === 'lineup' && selectedGameId && currentGame && (
        <div className="space-y-4">
          {isGameReady() && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-medium">Both lineups are ready!</span>
                  </div>
                  <Button 
                    onClick={handleStartGameDirect}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <LineupManager
            game={currentGame}
            onLineupsReady={handleLineupsReady}
          />
        </div>
      )}

      {activeTab === 'external-lineup' && selectedGameId && currentGame && (
        <ExternalTeamLineupForm
          awayTeamName={
            // If user is home team, opponent is away team
            currentGame.homeTeamId 
              ? (currentGame.awayTeamName || 'Away Team')
              : (currentGame.homeTeamName || 'Home Team')
          }
          onSubmit={handleExternalLineupSubmit}
          onCancel={handleExternalLineupCancel}
        />
      )}

      {activeTab === 'live' && selectedGameId && (
        <LiveGame
          gameId={selectedGameId as any}
          onBackToList={handleBackToList}
        />
      )}
    </div>
  );
}