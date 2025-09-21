import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { User, Users } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface BaseballDiamondProps {
  gameId: Id<"games">;
  onBaseRunnerMove?: (from: string, to: string) => void;
}

export function BaseballDiamond({ gameId, onBaseRunnerMove }: BaseballDiamondProps) {
  const [selectedBase, setSelectedBase] = useState<string | null>(null);

  // Get current game state
  const gameData = useQuery(api.games.getGame, { gameId });
  const gameState = gameData?.gameState;

  if (!gameState) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading field data...</div>
      </div>
    );
  }

  // Get base runners from game state
  const baseRunners = {
    first: gameState.baseRunners?.first,
    second: gameState.baseRunners?.second,
    third: gameState.baseRunners?.third
  };

  // Get current batter info
  const currentBatterIndex = gameState.currentBatterIndex || 0;
  const battingOrder = gameState.battingOrder || [];
  const currentBatterId = battingOrder[currentBatterIndex];

  const handleBaseClick = (baseName: string) => {
    if (selectedBase && selectedBase !== baseName && onBaseRunnerMove) {
      onBaseRunnerMove(selectedBase, baseName);
      setSelectedBase(null);
    } else {
      setSelectedBase(selectedBase === baseName ? null : baseName);
    }
  };

  const BaseMarker = ({ 
    baseName, 
    runner, 
    position,
    size = "w-16 h-16"
  }: { 
    baseName: string; 
    runner?: string;
    position: string;
    size?: string;
  }) => {
    const isSelected = selectedBase === baseName;
    const hasRunner = !!runner;

    return (
      <div className={`absolute ${position}`}>
        <Button
          variant="outline"
          onClick={() => handleBaseClick(baseName)}
          className={`${size} rounded-lg border-2 flex flex-col items-center justify-center p-1 transition-all ${
            isSelected 
              ? 'border-blue-500 bg-blue-100 shadow-lg' 
              : hasRunner 
                ? 'border-green-500 bg-green-100' 
                : 'border-gray-400 bg-white hover:bg-gray-50'
          }`}
        >
          {hasRunner ? (
            <div className="text-center">
              <User className="w-4 h-4 mx-auto mb-1" />
              <div className="text-xs font-medium leading-tight">{runner}</div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-4 h-4 bg-gray-300 rounded-full mx-auto mb-1"></div>
              <div className="text-xs text-gray-500">{baseName}</div>
            </div>
          )}
        </Button>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Baseball Diamond
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {gameState.outs || 0} Outs
            </Badge>
            <Badge variant="outline">
              Inning {gameData?.game?.currentInning || 1}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Baseball Diamond Container */}
        <div className="relative w-full max-w-md mx-auto aspect-square bg-gradient-to-br from-green-400 to-green-600 rounded-lg overflow-hidden shadow-lg">
          
          {/* Infield Diamond */}
          <div className="absolute inset-4">
            {/* Diamond Shape Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-700 transform rotate-45 rounded-lg"></div>
            
            {/* Grass areas */}
            <div className="absolute top-0 left-1/2 w-0 h-0 border-l-8 border-r-8 border-b-16 border-transparent border-b-green-500 transform -translate-x-1/2"></div>
          </div>

          {/* Home Plate */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="w-6 h-6 bg-white border-2 border-gray-800 transform rotate-45 flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
            </div>
            {currentBatterId && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center">
                <Badge className="text-xs bg-blue-600 text-white">
                  At Bat #{currentBatterIndex + 1}
                </Badge>
              </div>
            )}
          </div>

          {/* First Base */}
          <BaseMarker
            baseName="1st"
            runner={baseRunners.first ? "Runner" : undefined}
            position="bottom-4 right-4"
          />

          {/* Second Base */}
          <BaseMarker
            baseName="2nd"
            runner={baseRunners.second ? "Runner" : undefined}
            position="top-4 right-1/2 transform translate-x-1/2"
          />

          {/* Third Base */}
          <BaseMarker
            baseName="3rd"
            runner={baseRunners.third ? "Runner" : undefined}
            position="bottom-4 left-4"
          />

          {/* Pitcher's Mound */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 bg-amber-800 rounded-full border-2 border-amber-900 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Foul Lines */}
          <div className="absolute bottom-4 left-1/2 w-px h-full bg-white transform -translate-x-1/2 rotate-45 origin-bottom"></div>
          <div className="absolute bottom-4 left-1/2 w-px h-full bg-white transform -translate-x-1/2 -rotate-45 origin-bottom"></div>

          {/* Outfield Positions Indicators */}
          <div className="absolute top-2 left-8">
            <div className="w-3 h-3 bg-blue-500 rounded-full" title="Left Field"></div>
          </div>
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" title="Center Field"></div>
          </div>
          <div className="absolute top-2 right-8">
            <div className="w-3 h-3 bg-blue-500 rounded-full" title="Right Field"></div>
          </div>
        </div>

        {/* Base Running Instructions */}
        {selectedBase && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{selectedBase} Base selected.</strong> Click another base to move the runner, or click the same base to deselect.
            </p>
          </div>
        )}

        {/* Game State Summary */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{gameState.balls || 0}</div>
            <div className="text-xs text-gray-600">Balls</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{gameState.strikes || 0}</div>
            <div className="text-xs text-gray-600">Strikes</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">{gameState.outs || 0}</div>
            <div className="text-xs text-gray-600">Outs</div>
          </div>
        </div>

        {/* Base Runners Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Base Runners</h4>
          <div className="space-y-1 text-sm">
            {baseRunners.first && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-8 h-6 p-0 flex items-center justify-center text-xs">1st</Badge>
                <span>Runner on first base</span>
              </div>
            )}
            {baseRunners.second && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-8 h-6 p-0 flex items-center justify-center text-xs">2nd</Badge>
                <span>Runner on second base</span>
              </div>
            )}
            {baseRunners.third && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="w-8 h-6 p-0 flex items-center justify-center text-xs">3rd</Badge>
                <span>Runner on third base</span>
              </div>
            )}
            {!baseRunners.first && !baseRunners.second && !baseRunners.third && (
              <div className="text-gray-500 italic">No runners on base</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}