import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useGames } from '../../hooks/useGames';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Target, User, BarChart3 } from 'lucide-react';
import { BaseballDiamond } from './BaseballDiamond';
import type { Id } from '../../../convex/_generated/dataModel';

interface AtBatTrackerProps {
  gameId: Id<"games">;
}

interface PitchOutcome {
  type: 'ball' | 'strike' | 'foul' | 'hit' | 'out';
  description?: string;
}

export function AtBatTracker({ gameId }: AtBatTrackerProps) {
  const { gameState, updatePitchCount, updateBaseRunners } = useGames();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get current game state
  const currentGameState = gameState(gameId);
  const gameData = useQuery(api.games.getGame, { gameId });

  if (!currentGameState || !gameData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading at-bat data...</div>
      </div>
    );
  }

  const { gameState: state } = currentGameState;

  if (!state) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Game state not initialized...</div>
      </div>
    );
  }

  // Get current batter info
  const currentBatterIndex = state.currentBatterIndex || 0;
  const battingOrder = state.battingOrder || [];
  const currentBatterId = battingOrder[currentBatterIndex];

  const balls = state.balls || 0;
  const strikes = state.strikes || 0;
  const outs = state.outs || 0;

  const handlePitchOutcome = async (outcome: PitchOutcome) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      let newBalls = balls;
      let newStrikes = strikes;
      let newOuts = outs;
      let advanceBatter = false;

      switch (outcome.type) {
        case 'ball':
          newBalls++;
          if (newBalls >= 4) {
            // Walk - advance batter, reset count, place runner on first
            advanceBatter = true;
            newBalls = 0;
            newStrikes = 0;
            
            // Add runner to first base (simulate current batter)
            const currentBaseRunners = state.baseRunners || { first: undefined, second: undefined, third: undefined };
            const newBaseRunners = { ...currentBaseRunners };
            
            // Move existing runners if bases are occupied
            if (currentBaseRunners.first) {
              if (currentBaseRunners.second) {
                if (currentBaseRunners.third) {
                  // Bases loaded - runner scores
                } else {
                  newBaseRunners.third = currentBaseRunners.second;
                }
              } else {
                newBaseRunners.second = currentBaseRunners.first;
              }
            }
            newBaseRunners.first = currentBatterId; // Current batter goes to first
            
            // Update base runners
            await updateBaseRunners({
              gameId,
              baseRunners: newBaseRunners
            });
          }
          break;

        case 'strike':
          newStrikes++;
          if (newStrikes >= 3) {
            // Strikeout - advance batter, add out, reset count
            newOuts++;
            advanceBatter = true;
            newBalls = 0;
            newStrikes = 0;
          }
          break;

        case 'foul':
          // Foul ball - add strike unless already 2 strikes
          if (newStrikes < 2) {
            newStrikes++;
          }
          break;

        case 'hit':
        case 'out':
          // Ball in play - advance batter, reset count
          if (outcome.type === 'out') {
            newOuts++;
          } else {
            // Hit - place runner on first base
            const currentBaseRunners = state.baseRunners || { first: undefined, second: undefined, third: undefined };
            const newBaseRunners = { ...currentBaseRunners };
            
            // Simple single logic - current batter goes to first, others advance one base
            if (currentBaseRunners.third) {
              // Runner on third scores
            }
            if (currentBaseRunners.second) {
              newBaseRunners.third = currentBaseRunners.second;
            }
            if (currentBaseRunners.first) {
              newBaseRunners.second = currentBaseRunners.first;
            }
            newBaseRunners.first = currentBatterId; // Current batter goes to first
            
            // Update base runners
            await updateBaseRunners({
              gameId,
              baseRunners: newBaseRunners
            });
          }
          advanceBatter = true;
          newBalls = 0;
          newStrikes = 0;
          break;
      }

      // Check for inning change (3 outs)
      if (newOuts >= 3) {
        // Handle inning change logic here
        newOuts = 0;
        // TODO: Implement inning advancement
      }

      // Update game state
      await updatePitchCount({
        gameId,
        balls: newBalls,
        strikes: newStrikes,
        outs: newOuts,
        currentBatterIndex: advanceBatter 
          ? (currentBatterIndex + 1) % battingOrder.length 
          : currentBatterIndex
      });

    } catch (error) {
      console.error('Failed to update at-bat:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBaseRunnerMove = async (from: string, to: string) => {
    if (!state) return;

    try {
      const currentBaseRunners = state.baseRunners || { first: undefined, second: undefined, third: undefined };
      const newBaseRunners = { ...currentBaseRunners };

      // Simple base runner movement logic
      if (from === "1st" && currentBaseRunners.first) {
        newBaseRunners.first = undefined;
        if (to === "2nd") newBaseRunners.second = currentBaseRunners.first;
        else if (to === "3rd") newBaseRunners.third = currentBaseRunners.first;
      } else if (from === "2nd" && currentBaseRunners.second) {
        newBaseRunners.second = undefined;
        if (to === "1st") newBaseRunners.first = currentBaseRunners.second;
        else if (to === "3rd") newBaseRunners.third = currentBaseRunners.second;
      } else if (from === "3rd" && currentBaseRunners.third) {
        newBaseRunners.third = undefined;
        if (to === "1st") newBaseRunners.first = currentBaseRunners.third;
        else if (to === "2nd") newBaseRunners.second = currentBaseRunners.third;
      }

      await updateBaseRunners({
        gameId,
        baseRunners: newBaseRunners
      });

    } catch (error) {
      console.error('Failed to move base runner:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Status Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              At-Bat Tracker
            </span>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="outline" className="px-3 py-1">
                Inning: {currentGameState.innings?.length || 1}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {outs} Outs
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Current Count Display */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{balls}</div>
              <div className="text-sm text-gray-600">Balls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{strikes}</div>
              <div className="text-sm text-gray-600">Strikes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{outs}</div>
              <div className="text-sm text-gray-600">Outs</div>
            </div>
          </div>

          {/* Current Batter Info */}
          {currentBatterId && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium">
                    At Bat: Batter #{currentBatterIndex + 1}
                  </div>
                  <div className="text-sm text-gray-600">
                    Batting: Position {currentBatterIndex + 1} of {battingOrder.length}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pitch Outcome Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button
              onClick={() => handlePitchOutcome({ type: 'ball' })}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              Ball
            </Button>
            <Button
              onClick={() => handlePitchOutcome({ type: 'strike' })}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              Strike
            </Button>
            <Button
              onClick={() => handlePitchOutcome({ type: 'foul' })}
              disabled={isProcessing}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              size="lg"
            >
              Foul
            </Button>
            <Button
              onClick={() => handlePitchOutcome({ type: 'out' })}
              disabled={isProcessing}
              className="bg-gray-600 hover:bg-gray-700 text-white"
              size="lg"
            >
              Out
            </Button>
            <Button
              onClick={() => handlePitchOutcome({ type: 'hit' })}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              In Play
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Pitch Count
              </span>
              <span className="font-medium">
                {balls + strikes} pitches this at-bat
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Count Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Count Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Balls */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-sm font-medium">Balls:</span>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 ${
                      i < balls 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Strikes */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-sm font-medium">Strikes:</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 ${
                      i < strikes 
                        ? 'bg-red-500 border-red-500' 
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Outs */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-sm font-medium">Outs:</span>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 ${
                      i < outs 
                        ? 'bg-orange-500 border-orange-500' 
                        : 'bg-gray-100 border-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Baseball Diamond */}
      <BaseballDiamond 
        gameId={gameId}
        onBaseRunnerMove={handleBaseRunnerMove}
      />
    </div>
  );
}