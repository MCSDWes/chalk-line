import { useState } from 'react';
import { useGames } from '../../hooks/useGames';
import { useLineups } from '../../hooks/useLineups';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ArrowLeft, Play, Square, Calculator, BarChart3, Target, ClipboardList, BookOpen, Users, FileText } from 'lucide-react';
import { ScorekeeperInterface } from './ScorekeeperInterface';
import ModernBaseballDiamond from './ModernBaseballDiamond.tsx';
import { InningScoreboard } from './InningScoreboard';
import { ScoringNotation } from './ScoringNotation';
import { PlayerStatsTracker } from './PlayerStatsTracker';
import { GameSummary } from './GameSummary';
import type { Id } from '../../../convex/_generated/dataModel';

interface LiveGameProps {
  gameId: Id<"games">;
  onBackToList: () => void;
}

export function LiveGame({ gameId, onBackToList }: LiveGameProps) {
  const { gameById, gameState, nextInning, completeGame, updatePitchCount, advanceInning } = useGames();
  const { getGameLineup } = useLineups();
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'scorekeeper' | 'atbat' | 'inning' | 'notation' | 'stats' | 'summary'>('overview'); // Enhanced view mode
  const [showInningDialog, setShowInningDialog] = useState(false);

  // Get game data and state
  const gameData = gameById(gameId);
  const currentGameState = gameState(gameId);

  // Get lineup and player data - always call hooks with safe default values
  const homeTeamId = gameData?.homeTeam?._id || ("" as any); // Provide a fallback that won't match
  const homeLineup = getGameLineup(gameId, homeTeamId);

  // Helper function to build lineup with proper player information
  const buildLineupDisplay = () => {
    if (!currentGameState?.gameState) return [];

    // For now, assume home team is batting (we can enhance this later with inning tracking)
    const isHomeTeamBatting = true;

    if (isHomeTeamBatting && gameData?.homeTeam && homeLineup?.lineup && homeLineup?.players) {
      // Home team batting - use home lineup
      return homeLineup.lineup.battingOrder.map((lineupSpot) => {
        const player = homeLineup.players?.find(p => p && p._id === lineupSpot.playerId);
        return {
          name: player ? `${player.firstName} ${player.lastName}` : 'Unknown Player',
          position: lineupSpot.fieldPosition,
          jerseyNumber: player?.jerseyNumber || 0,
          battingPosition: lineupSpot.battingPosition
        };
      }).sort((a, b) => a.battingPosition - b.battingPosition);
    } else if (currentGameState.gameState.awayTeamPlayers) {
      // Away team batting - use external team lineup
      return currentGameState.gameState.awayTeamPlayers.map((player, idx) => ({
        name: player.playerName,
        position: player.fieldPosition || 'P',
        jerseyNumber: player.jerseyNumber || (idx + 1),
        battingPosition: player.battingPosition || (idx + 1)
      })).sort((a, b) => a.battingPosition - b.battingPosition);
    }

    return [];
  };

  // Helper function to get current batter name
  const getCurrentBatterName = () => {
    const lineup = buildLineupDisplay();
    const currentIndex = currentGameState?.gameState?.currentBatterIndex || 0;
    return lineup[currentIndex]?.name || 'Unknown Batter';
  };

  // Helper function to get base runner names
  const getBaseRunnerNames = () => {
    const runners = currentGameState?.gameState?.baseRunners || {};
    const lineup = buildLineupDisplay();
    
    return {
      first: runners.first ? (lineup.find(p => p.name.includes(runners.first?.toString() || ''))?.name || runners.first.toString()) : undefined,
      second: runners.second ? (lineup.find(p => p.name.includes(runners.second?.toString() || ''))?.name || runners.second.toString()) : undefined,
      third: runners.third ? (lineup.find(p => p.name.includes(runners.third?.toString() || ''))?.name || runners.third.toString()) : undefined
    };
  };

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

  // Debug logging
  console.log('LiveGame rendered:', { viewMode, gameStatus: game.status });

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

  // Modern Diamond handlers
  // Helper function to advance to the next batter
  const getNextBatterIndex = () => {
    const lineup = buildLineupDisplay();
    const currentIndex = currentGameState?.gameState?.currentBatterIndex || 0;
    return (currentIndex + 1) % lineup.length; // Cycle through the lineup
  };

  const handleBall = async () => {
    const currentBalls = currentGameState?.gameState?.balls || 0;
    const newBalls = currentBalls + 1;
    
    if (newBalls >= 4) {
      // Walk - advance to next batter and reset count
      await updatePitchCount({
        gameId,
        balls: 0,
        strikes: 0,
        outs: currentGameState?.gameState?.outs || 0,
        currentBatterIndex: getNextBatterIndex()
      });
      
      // TODO: Move batter to first base (need backend integration for runner advancement)
      console.log('Walk - batter advances to first base, next batter up');
    } else {
      // Regular ball
      await updatePitchCount({
        gameId,
        balls: newBalls,
        strikes: currentGameState?.gameState?.strikes || 0,
        outs: currentGameState?.gameState?.outs || 0
      });
    }
  };

  const handleStrike = async () => {
    const currentStrikes = currentGameState?.gameState?.strikes || 0;
    const newStrikes = currentStrikes + 1;
    
    if (newStrikes >= 3) {
      // Strikeout - advance to next batter, reset count, increment outs
      await updatePitchCount({
        gameId,
        balls: 0,
        strikes: 0,
        outs: (currentGameState?.gameState?.outs || 0) + 1,
        currentBatterIndex: getNextBatterIndex()
      });
      
      console.log('Strikeout - batter out, next batter up');
    } else {
      // Regular strike
      await updatePitchCount({
        gameId,
        balls: currentGameState?.gameState?.balls || 0,
        strikes: newStrikes,
        outs: currentGameState?.gameState?.outs || 0
      });
    }
  };

  const handleFoul = async () => {
    const currentStrikes = currentGameState?.gameState?.strikes || 0;
    if (currentStrikes < 2) {
      await updatePitchCount({
        gameId,
        balls: currentGameState?.gameState?.balls || 0,
        strikes: currentStrikes + 1,
        outs: currentGameState?.gameState?.outs || 0
      });
    }
  };

  const handleHit = async (type: '1B' | '2B' | '3B' | 'HR') => {
    // Reset count, advance to next batter, and advance runners based on hit type
    await updatePitchCount({
      gameId,
      balls: 0,
      strikes: 0,
      outs: currentGameState?.gameState?.outs || 0,
      currentBatterIndex: getNextBatterIndex()
    });

    // Simple runner advancement logic
    const currentRunners = currentGameState?.gameState?.baseRunners || {};
    const newRunners: { first?: string; second?: string; third?: string } = {};
    
    const currentBatterId = currentGameState?.gameState?.battingOrder?.[currentGameState?.gameState?.currentBatterIndex || 0];

    switch (type) {
      case '1B':
        if (currentBatterId) newRunners.first = currentBatterId.toString();
        if (currentRunners.first) newRunners.second = currentRunners.first.toString();
        if (currentRunners.second) newRunners.third = currentRunners.second.toString();
        break;
      case '2B':
        if (currentBatterId) newRunners.second = currentBatterId.toString();
        if (currentRunners.first) newRunners.third = currentRunners.first.toString();
        break;
      case '3B':
        if (currentBatterId) newRunners.third = currentBatterId.toString();
        break;
      case 'HR':
        // Clear all bases
        break;
    }

    // Note: This is a simplified version for the modern diamond component
    // In a real app, we'd need to convert back to player IDs for the backend
    console.log('Hit recorded:', type, 'New runners:', newRunners);
  };

  const handleOut = async (_type: string) => {
    const newOuts = (currentGameState?.gameState?.outs || 0) + 1;
    
    await updatePitchCount({
      gameId,
      balls: 0,
      strikes: 0,
      outs: newOuts,
      currentBatterIndex: getNextBatterIndex()
    });

    // Check if 3 outs reached - show inning change dialog
    if (newOuts >= 3) {
      setShowInningDialog(true);
    }
  };

  const handleError = async (_position: number) => {
    // For errors, put batter on first base
    const currentBatterId = currentGameState?.gameState?.battingOrder?.[currentGameState?.gameState?.currentBatterIndex || 0];
    
    if (currentBatterId) {
      console.log('Error recorded, batter advances to first');
      // Note: This would need proper backend integration to convert player ID
    }
  };

  const handleRunnerMove = async (from: 'first' | 'second' | 'third', to: 'second' | 'third' | 'home' | null) => {
    if (to === 'home') {
      // Runner scores, remove from base
      console.log(`Runner from ${from} scores!`);
    } else if (to) {
      // Move runner to new base
      console.log(`Runner moves from ${from} to ${to}`);
    }
    
    // Note: This would need proper backend integration to handle player ID conversions
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
        <div className="flex items-center gap-2 p-2 border-2 border-blue-300 rounded-lg bg-blue-50">
          <span className="text-sm font-medium text-blue-700">View:</span>
          <Button
            onClick={() => setViewMode('overview')}
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1"
          >
            <BarChart3 className="h-4 w-4" />
            Overview
          </Button>
          <Button
            onClick={() => setViewMode('atbat')}
            variant={viewMode === 'atbat' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1"
          >
            <Target className="h-4 w-4" />
            At-Bat
          </Button>
          <Button
            onClick={() => setViewMode('inning')}
            variant={viewMode === 'inning' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1"
          >
            <ClipboardList className="h-4 w-4" />
            Innings
          </Button>
          <Button
            onClick={() => setViewMode('stats')}
            variant={viewMode === 'stats' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1"
          >
            <Users className="h-4 w-4" />
            Stats
          </Button>
          <Button
            onClick={() => setViewMode('summary')}
            variant={viewMode === 'summary' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1"
          >
            <FileText className="h-4 w-4" />
            Summary
          </Button>
          <Button
            onClick={() => setViewMode('notation')}
            variant={viewMode === 'notation' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1"
          >
            <BookOpen className="h-4 w-4" />
            Notation
          </Button>
          <Button
            onClick={() => setViewMode('scorekeeper')}
            variant={viewMode === 'scorekeeper' ? 'default' : 'outline'}
            size="sm"
            className="flex items-center gap-1"
          >
            <Calculator className="h-4 w-4" />
            Scorekeeper
          </Button>
        </div>
        <Badge className={`${getStatusBadgeColor(game.status)} text-white`}>
          {getStatusText(game.status)}
        </Badge>
      </div>

      {/* Conditional View Rendering */}
      {viewMode === 'overview' ? (
        <>
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
        </>
      ) : viewMode === 'atbat' ? (
        <ModernBaseballDiamond
          baseRunners={getBaseRunnerNames()}
          currentBatter={getCurrentBatterName()}
          balls={currentGameState?.gameState?.balls || 0}
          strikes={currentGameState?.gameState?.strikes || 0}
          outs={currentGameState?.gameState?.outs || 0}
          lineup={buildLineupDisplay()}
          currentBatterIndex={currentGameState?.gameState?.currentBatterIndex || 0}
          onBall={handleBall}
          onStrike={handleStrike}
          onFoul={handleFoul}
          onHit={handleHit}
          onOut={handleOut}
          onError={handleError}
          onRunnerMove={handleRunnerMove}
        />
      ) : viewMode === 'inning' ? (
        <InningScoreboard
          homeTeamName={homeTeam?.name || 'Home'}
          awayTeamName={game.awayTeamName || awayTeam?.name || 'Away'}
          currentInning={game.currentInning || 1}
          isTopInning={game.currentHalf === 'top'}
          homeScore={game.homeScore || 0}
          awayScore={game.awayScore || 0}
          inningScores={{
            home: currentGameState?.innings?.map(inning => inning.homeRuns || 0) || [],
            away: currentGameState?.innings?.map(inning => inning.awayRuns || 0) || []
          }}
          onInningComplete={(runs) => {
            console.log('Inning completed with', runs, 'runs');
            // TODO: Add backend integration for inning completion
          }}
          onNextInning={handleNextInning}
          onSwitchHalf={handleNextInning}
        />
      ) : viewMode === 'stats' ? (
        <PlayerStatsTracker
          homeTeamName={homeTeam?.name || 'Home'}
          awayTeamName={game.awayTeamName || awayTeam?.name || 'Away'}
          homeTeamPlayers={[]} // TODO: Implement player stats from backend
          awayTeamPlayers={[]} // TODO: Implement player stats from backend
          onUpdateStats={(playerId, statCategory, increment) => {
            console.log('Update stats:', playerId, statCategory, increment);
            // TODO: Add backend integration for stats updates
          }}
        />
      ) : viewMode === 'summary' ? (
        <GameSummary
          gameId={gameId}
          homeTeamName={homeTeam?.name || 'Home'}
          awayTeamName={game.awayTeamName || awayTeam?.name || 'Away'}
          gameDate={game.gameDate}
          gameTime={game.gameTime}
          field={game.field}
          homeScore={game.homeScore || 0}
          awayScore={game.awayScore || 0}
          currentInning={game.currentInning || 1}
          gameStatus={game.status}
          innings={(currentGameState?.innings || []).map(inning => ({
            inningNumber: inning.inningNumber,
            homeRuns: inning.homeRuns,
            awayRuns: inning.awayRuns,
            homeHits: inning.homeHits || 0,
            awayHits: inning.awayHits || 0,
            homeErrors: inning.homeErrors || 0,
            awayErrors: inning.awayErrors || 0
          }))}
          playByPlay={[]} // TODO: Implement play-by-play from backend
          playerStats={{
            home: [], // TODO: Implement player stats from backend
            away: []  // TODO: Implement player stats from backend
          }}
        />
      ) : viewMode === 'notation' ? (
        <ScoringNotation
          onScorePlay={(notation, description) => {
            console.log('Play scored:', notation, description);
            // TODO: Add backend integration for play scoring
          }}
        />
      ) : (
        <ScorekeeperInterface
          gameId={gameId}
          homeTeamName={homeTeam?.name || 'Home'}
          awayTeamName={game.awayTeamName || awayTeam?.name || 'Away'}
          currentInning={game.currentInning || 1}
          innings={currentGameState?.innings || []}
          onRefresh={() => {
            // Force re-fetch of game data
            window.location.reload();
          }}
        />
      )}

      {/* Inning Change Dialog */}
      <Dialog open={showInningDialog} onOpenChange={setShowInningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End of Inning</DialogTitle>
            <DialogDescription>
              Three outs! Ready to advance to the next half-inning? 
              {currentGameState?.gameState?.isTopInning 
                ? ` The home team (${gameData?.game?.homeTeamName || gameData?.homeTeam?.name || 'Home'}) will bat next.`
                : ` The away team (${gameData?.game?.awayTeamName || 'Away'}) will bat next.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowInningDialog(false)}
            >
              Stay in Current Inning
            </Button>
            <Button 
              onClick={async () => {
                await advanceInning({ gameId });
                setShowInningDialog(false);
              }}
            >
              Continue to Next Half-Inning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}