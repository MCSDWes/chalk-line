import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InteractiveBaseballField from './InteractiveBaseballField';

interface BaseballDiamondProps {
  baseRunners: {
    first?: string;
    second?: string;
    third?: string;
  };
  currentBatter?: string;
  balls: number;
  strikes: number;
  outs: number;
  lineup: Array<{ name: string; position: string; jerseyNumber?: number }>;
  currentBatterIndex: number;
  onBall: () => void;
  onStrike: () => void;
  onFoul: () => void;
  onHit: (type: '1B' | '2B' | '3B' | 'HR') => void;
  onOut: (type: string) => void;
  onError: (position: number) => void;
  onRunnerMove?: (from: 'first' | 'second' | 'third', to: 'second' | 'third' | 'home' | null) => void;
}

interface AtBatHistory {
  batter: string;
  outcome: string;
  balls: number;
  strikes: number;
  baseRunners: {
    first?: string;
    second?: string;
    third?: string;
  };
  battingAvg?: number;
  hitDirection?: 'left' | 'center' | 'right';
}

export const ModernBaseballDiamond: React.FC<BaseballDiamondProps> = ({
  baseRunners,
  balls,
  strikes,
  outs,
  lineup,
  currentBatterIndex,
  onBall,
  onStrike,
  onFoul,
  onHit,
  onOut,
  onError,
  onRunnerMove
}) => {
  const [showErrorOptions, setShowErrorOptions] = useState(false);
  const [showOutOptions, setShowOutOptions] = useState(false);
  const [atBatHistory, setAtBatHistory] = useState<AtBatHistory[]>([]);
  const [lastAction, setLastAction] = useState<string>('');
  const [animatingRunner, setAnimatingRunner] = useState<'first' | 'second' | 'third' | null>(null);
  const [showSprayChart, setShowSprayChart] = useState(false);
  const [pendingHitType, setPendingHitType] = useState<'1B' | '2B' | '3B' | 'HR' | null>(null);

  // Add visual feedback for actions
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => setLastAction(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  // Get current batter and on-deck batter
  const getCurrentBatter = () => {
    if (lineup.length === 0) return { name: 'No Batter', position: '', jerseyNumber: 0 };
    const index = currentBatterIndex % lineup.length;
    return lineup[index] || { name: 'Unknown', position: '', jerseyNumber: 0 };
  };

  const getOnDeckBatter = () => {
    if (lineup.length === 0) return { name: 'No Batter', position: '', jerseyNumber: 0 };
    const index = (currentBatterIndex + 1) % lineup.length;
    return lineup[index] || { name: 'Unknown', position: '', jerseyNumber: 0 };
  };

  const currentBatterInfo = getCurrentBatter();
  const onDeckBatterInfo = getOnDeckBatter();

  // Calculate player stats
  const getPlayerStats = (playerName: string) => {
    const playerHistory = atBatHistory.filter(h => h.batter === playerName);
    const hits = playerHistory.filter(h => ['1B', '2B', '3B', 'HR'].includes(h.outcome)).length;
    const atBats = playerHistory.length;
    const battingAvg = atBats > 0 ? hits / atBats : 0;
    
    const hitsByDirection = playerHistory.filter(h => h.hitDirection);
    const leftPerc = hitsByDirection.length > 0 ? (hitsByDirection.filter(h => h.hitDirection === 'left').length / hitsByDirection.length) * 100 : 0;
    const centerPerc = hitsByDirection.length > 0 ? (hitsByDirection.filter(h => h.hitDirection === 'center').length / hitsByDirection.length) * 100 : 0;
    const rightPerc = hitsByDirection.length > 0 ? (hitsByDirection.filter(h => h.hitDirection === 'right').length / hitsByDirection.length) * 100 : 0;

    return { battingAvg, leftPerc, centerPerc, rightPerc, hits, atBats };
  };

  // Handle automatic progression for walks (4 balls)
  const handleBall = () => {
    const newBalls = balls + 1;
    if (newBalls >= 4) {
      // Walk - automatically advance to first base and cycle to next batter
      setLastAction('BB (Walk)');
      
      // Add to history with BB notation
      const historyEntry: AtBatHistory = {
        batter: currentBatterInfo.name,
        outcome: 'BB',
        balls: 4,
        strikes,
        baseRunners: { ...baseRunners },
        battingAvg: getPlayerStats(currentBatterInfo.name).battingAvg
      };
      setAtBatHistory(prev => [...prev, historyEntry]);
      
      // Call the hit function with walk AND manually trigger batter progression
      onHit('1B'); // Walk is treated as reaching first base
      
      // Force next batter (this is a workaround until we fix the backend)
      setTimeout(() => {
        // This should trigger parent component to update currentBatterIndex
        console.log('Walk completed, should advance to next batter');
      }, 100);
    } else {
      onBall();
    }
  };

  // Handle strikeout (3 strikes)
  const handleStrike = () => {
    const newStrikes = strikes + 1;
    if (newStrikes >= 3) {
      // Strikeout - add to history and cycle to next batter
      setLastAction('K (Strikeout)');
      
      const historyEntry: AtBatHistory = {
        batter: currentBatterInfo.name,
        outcome: 'K',
        balls,
        strikes: 3,
        baseRunners: { ...baseRunners },
        battingAvg: getPlayerStats(currentBatterInfo.name).battingAvg
      };
      setAtBatHistory(prev => [...prev, historyEntry]);
      
      onOut('strikeout');
      
      // Force next batter (this is a workaround until we fix the backend)
      setTimeout(() => {
        console.log('Strikeout completed, should advance to next batter');
      }, 100);
    } else {
      onStrike();
    }
  };

  const handleHit = (type: '1B' | '2B' | '3B' | 'HR') => {
    setLastAction(`${type} Hit!`);
    onHit(type);
    
    // Calculate batting average (simplified)
    const currentPlayerHistory = atBatHistory.filter(h => h.batter === currentBatterInfo.name);
    const hits = currentPlayerHistory.filter(h => ['1B', '2B', '3B', 'HR'].includes(h.outcome)).length + 1;
    const atBats = currentPlayerHistory.length + 1;
    const battingAvg = hits / atBats;

    // Save to history
    const historyEntry: AtBatHistory = {
      batter: currentBatterInfo.name,
      outcome: type,
      balls,
      strikes,
      baseRunners: { ...baseRunners },
      battingAvg,
      hitDirection: Math.random() > 0.66 ? 'right' : Math.random() > 0.33 ? 'center' : 'left' // Random for demo
    };
    setAtBatHistory(prev => [...prev, historyEntry]);

    // Animate runner movement
    if (type !== 'HR') {
      setAnimatingRunner('first');
      setTimeout(() => setAnimatingRunner(null), 1000);
    }
  };

  const handleOut = (type: string) => {
    setShowOutOptions(false);
    setLastAction(`${type} Out`);
    onOut(type);
    
    const historyEntry: AtBatHistory = {
      batter: currentBatterInfo.name,
      outcome: type,
      balls,
      strikes,
      baseRunners: { ...baseRunners },
      battingAvg: getPlayerStats(currentBatterInfo.name).battingAvg
    };
    setAtBatHistory(prev => [...prev, historyEntry]);
  };

  const handleError = (position: number) => {
    setShowErrorOptions(false);
    setLastAction(`E-${position} Error`);
    onError(position);
    
    const historyEntry: AtBatHistory = {
      batter: currentBatterInfo.name,
      outcome: `E-${position}`,
      balls,
      strikes,
      baseRunners: { ...baseRunners },
      battingAvg: getPlayerStats(currentBatterInfo.name).battingAvg
    };
    setAtBatHistory(prev => [...prev, historyEntry]);
  };

  const handleRunnerClick = (base: 'first' | 'second' | 'third') => {
    if (!baseRunners[base] || !onRunnerMove) return;
    
    // Simple runner movement - advance one base (or to home)
    const nextBase = base === 'first' ? 'second' : base === 'second' ? 'third' : 'home';
    onRunnerMove(base, nextBase as 'second' | 'third' | 'home');
    
    setAnimatingRunner(base);
    setTimeout(() => setAnimatingRunner(null), 1000);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 max-w-6xl mx-auto">
      {/* Header - Current Batter and On Deck */}
      <Card className="p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-8">
            {/* Current Batter */}
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">NOW BATTING</div>
              <div className="text-2xl font-bold text-blue-600">
                #{currentBatterInfo.jerseyNumber} {currentBatterInfo.name}
              </div>
              <div className="text-sm text-gray-600">{currentBatterInfo.position}</div>
              <div className="text-xs text-gray-500 mt-1">
                AVG: {getPlayerStats(currentBatterInfo.name).battingAvg.toFixed(3)}
              </div>
            </div>
            
            {/* On Deck */}
            <div className="text-center border-l pl-8">
              <div className="text-sm text-gray-600 mb-1">ON DECK</div>
              <div className="text-lg font-semibold text-gray-700">
                #{onDeckBatterInfo.jerseyNumber} {onDeckBatterInfo.name}
              </div>
              <div className="text-sm text-gray-600">{onDeckBatterInfo.position}</div>
            </div>
          </div>
          
          {/* Count Display */}
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{balls}</div>
              <div className="text-sm text-gray-600">BALLS</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">{strikes}</div>
              <div className="text-sm text-gray-600">STRIKES</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600">{outs}</div>
              <div className="text-sm text-gray-600">OUTS</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Diamond Area */}
      <div className="flex-1">
        <Card className="p-6">
          {/* Action Feedback */}
          {lastAction && (
            <div className="text-center mb-4">
              <div className="text-lg font-semibold text-green-600 animate-pulse bg-green-100 p-2 rounded-lg inline-block">
                {lastAction}
              </div>
            </div>
          )}

          {/* Baseball Diamond SVG */}
          <div className="flex justify-center mb-8">
            <svg viewBox="0 0 400 400" className="w-96 h-96 bg-green-400 rounded-lg shadow-lg">
              {/* Diamond */}
              <polygon
                points="200,320 320,200 200,80 80,200"
                fill="#D2691E"
                stroke="#8B4513"
                strokeWidth="3"
              />
              
              {/* Bases */}
              <rect x="75" y="195" width="10" height="10" fill="white" stroke="black" strokeWidth="1" />
              <rect x="195" y="75" width="10" height="10" fill="white" stroke="black" strokeWidth="1" />
              <rect x="315" y="195" width="10" height="10" fill="white" stroke="black" strokeWidth="1" />
              <path d="M 190 310 L 200 320 L 210 310 L 200 300 Z" fill="white" stroke="black" strokeWidth="1" />
              
              {/* Base Labels */}
              <text x="60" y="190" fontSize="12" fill="black" fontWeight="bold">3B</text>
              <text x="190" y="65" fontSize="12" fill="black" fontWeight="bold">2B</text>
              <text x="330" y="190" fontSize="12" fill="black" fontWeight="bold">1B</text>
              <text x="185" y="345" fontSize="12" fill="black" fontWeight="bold">HOME</text>
              
              {/* Runners */}
              {baseRunners.first && (
                <g>
                  <circle 
                    cx="320" 
                    cy="200" 
                    r="15" 
                    fill={animatingRunner === 'first' ? '#3B82F6' : '#10B981'} 
                    className="cursor-pointer transition-all hover:scale-110"
                    onClick={() => handleRunnerClick('first')}
                  />
                  <text x="320" y="205" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
                    {baseRunners.first.slice(0, 3)}
                  </text>
                </g>
              )}
              
              {baseRunners.second && (
                <g>
                  <circle 
                    cx="200" 
                    cy="80" 
                    r="15" 
                    fill={animatingRunner === 'second' ? '#3B82F6' : '#10B981'} 
                    className="cursor-pointer transition-all hover:scale-110"
                    onClick={() => handleRunnerClick('second')}
                  />
                  <text x="200" y="85" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
                    {baseRunners.second.slice(0, 3)}
                  </text>
                </g>
              )}
              
              {baseRunners.third && (
                <g>
                  <circle 
                    cx="80" 
                    cy="200" 
                    r="15" 
                    fill={animatingRunner === 'third' ? '#3B82F6' : '#10B981'} 
                    className="cursor-pointer transition-all hover:scale-110"
                    onClick={() => handleRunnerClick('third')}
                  />
                  <text x="80" y="205" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
                    {baseRunners.third.slice(0, 3)}
                  </text>
                </g>
              )}
              
              {/* Batter */}
              <circle cx="200" cy="350" r="12" fill="#6366F1" />
              <text x="200" y="355" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">
                BAT
              </text>
            </svg>
          </div>

          {/* Tablet-Optimized Control Grid */}
          <div className="bg-slate-50 p-4 rounded-lg border shadow-sm">
            {/* Primary Actions - Top Row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <Button 
                onClick={handleBall} 
                className="h-12 text-sm bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors touch-manipulation shadow-md"
              >
                BALL ({balls})
              </Button>
              <Button 
                onClick={handleStrike} 
                className="h-12 text-sm bg-red-500 hover:bg-red-600 text-white font-bold transition-colors touch-manipulation shadow-md"
              >
                STRIKE ({strikes})
              </Button>
              <Button 
                onClick={onFoul} 
                className="h-12 text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors touch-manipulation shadow-md"
              >
                FOUL
              </Button>
              <Button 
                onClick={() => setShowOutOptions(!showOutOptions)} 
                className="h-12 text-sm bg-gray-600 hover:bg-gray-700 text-white font-bold transition-colors touch-manipulation shadow-md"
              >
                OUT ({outs})
              </Button>
            </div>

            {/* Hit Actions - Second Row */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <Button 
                onClick={() => { setPendingHitType('1B'); setShowSprayChart(true); }} 
                className="h-12 text-sm bg-green-500 hover:bg-green-600 text-white font-bold transition-colors touch-manipulation shadow-md"
              >
                SINGLE
              </Button>
              <Button 
                onClick={() => { setPendingHitType('2B'); setShowSprayChart(true); }} 
                className="h-12 text-sm bg-green-600 hover:bg-green-700 text-white font-bold transition-colors touch-manipulation shadow-md"
              >
                DOUBLE
              </Button>
              <Button 
                onClick={() => { setPendingHitType('3B'); setShowSprayChart(true); }} 
                className="h-12 text-sm bg-green-700 hover:bg-green-800 text-white font-bold transition-colors touch-manipulation shadow-md"
              >
                TRIPLE
              </Button>
              <Button 
                onClick={() => { setPendingHitType('HR'); setShowSprayChart(true); }} 
                className="h-12 text-sm bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-colors touch-manipulation shadow-md"
              >
                HOME RUN
              </Button>
            </div>

            {/* Utility Actions - Third Row */}
            <div className="grid grid-cols-3 gap-2">
              <Button 
                onClick={() => setShowErrorOptions(!showErrorOptions)} 
                className="h-10 text-xs bg-yellow-600 hover:bg-yellow-700 text-white font-semibold transition-colors touch-manipulation"
              >
                ERROR
              </Button>
              <Button 
                onClick={() => console.log('Stolen base functionality')} 
                className="h-10 text-xs bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-colors touch-manipulation"
              >
                STOLEN BASE
              </Button>
              <Button 
                onClick={() => console.log('Wild pitch functionality')} 
                className="h-10 text-xs bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-colors touch-manipulation"
              >
                WILD PITCH
              </Button>
            </div>
          </div>



          {/* Error Options */}
          {showErrorOptions && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <h5 className="font-bold text-center mb-3">Error Position</h5>
              <div className="grid grid-cols-9 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(pos => (
                  <Button 
                    key={pos} 
                    onClick={() => handleError(pos)} 
                    size="sm" 
                    className="h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-bold transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
                  >
                    E-{pos}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Out Options */}
          {showOutOptions && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <h5 className="font-bold text-center mb-3">Out Type</h5>
              <div className="grid grid-cols-4 gap-3">
                <Button onClick={() => handleOut('K')} size="lg" className="h-16 bg-gray-600 hover:bg-gray-700 text-white font-bold transform hover:scale-105 transition-all shadow-lg hover:shadow-xl">
                  STRIKEOUT
                </Button>
                <Button onClick={() => handleOut('6-3')} size="lg" className="h-16 bg-gray-600 hover:bg-gray-700 text-white font-bold transform hover:scale-105 transition-all shadow-lg hover:shadow-xl">
                  GROUNDOUT
                </Button>
                <Button onClick={() => handleOut('F7')} size="lg" className="h-16 bg-gray-600 hover:bg-gray-700 text-white font-bold transform hover:scale-105 transition-all shadow-lg hover:shadow-xl">
                  FLY OUT
                </Button>
                <Button onClick={() => handleOut('SF')} size="lg" className="h-16 bg-gray-600 hover:bg-gray-700 text-white font-bold transform hover:scale-105 transition-all shadow-lg hover:shadow-xl">
                  SAC FLY
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Spray Chart Dialog */}
        <Dialog open={showSprayChart} onOpenChange={setShowSprayChart}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Select Hit Location</DialogTitle>
              <DialogDescription>
                Click on the field where the {pendingHitType === '1B' ? 'single' : pendingHitType === '2B' ? 'double' : pendingHitType === '3B' ? 'triple' : 'home run'} was hit for spray chart tracking.
              </DialogDescription>
            </DialogHeader>
            
            <InteractiveBaseballField
              hitType={pendingHitType || '1B'}
              isSelecting={true}
              onLocationClick={(x, y, zone) => {
                // Record the hit with location data
                if (pendingHitType) {
                  handleHit(pendingHitType);
                  setLastAction(`${pendingHitType} to ${zone} (${Math.round(x)}, ${Math.round(y)})`);
                  
                  // TODO: Save spray chart data to backend
                  console.log('Spray chart data:', {
                    hitType: pendingHitType,
                    x,
                    y,
                    zone,
                    batter: currentBatterInfo.name
                  });
                }
                
                setShowSprayChart(false);
                setPendingHitType(null);
              }}
            />

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSprayChart(false);
                  setPendingHitType(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Record hit without spray chart data
                  if (pendingHitType) {
                    handleHit(pendingHitType);
                  }
                  setShowSprayChart(false);
                  setPendingHitType(null);
                }}
              >
                Skip Location (Record Hit Only)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ModernBaseballDiamond;