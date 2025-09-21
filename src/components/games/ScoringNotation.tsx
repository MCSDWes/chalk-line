import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ScoringNotationProps {
  onScorePlay: (notation: string, description: string) => void;
}

interface PlayNotation {
  notation: string;
  description: string;
  category: 'out' | 'hit' | 'advance' | 'error' | 'special';
}

const commonPlays: PlayNotation[] = [
  // Outs
  { notation: 'K', description: 'Strikeout (swinging)', category: 'out' },
  { notation: 'K_c', description: 'Strikeout (called)', category: 'out' },
  { notation: '6-3', description: 'Groundout (SS to 1B)', category: 'out' },
  { notation: '4-3', description: 'Groundout (2B to 1B)', category: 'out' },
  { notation: '5-3', description: 'Groundout (3B to 1B)', category: 'out' },
  { notation: '1-3', description: 'Groundout (P to 1B)', category: 'out' },
  { notation: 'F7', description: 'Flyout to LF', category: 'out' },
  { notation: 'F8', description: 'Flyout to CF', category: 'out' },
  { notation: 'F9', description: 'Flyout to RF', category: 'out' },
  { notation: 'P5', description: 'Popup to 3B', category: 'out' },
  { notation: 'P4', description: 'Popup to 2B', category: 'out' },
  { notation: 'P6', description: 'Popup to SS', category: 'out' },
  { notation: '6-4-3', description: 'Double Play (SS-2B-1B)', category: 'out' },
  { notation: '4-6-3', description: 'Double Play (2B-SS-1B)', category: 'out' },
  
  // Hits
  { notation: '1B', description: 'Single', category: 'hit' },
  { notation: '2B', description: 'Double', category: 'hit' },
  { notation: '3B', description: 'Triple', category: 'hit' },
  { notation: 'HR', description: 'Home Run', category: 'hit' },
  { notation: '1B/7', description: 'Single to LF', category: 'hit' },
  { notation: '1B/8', description: 'Single to CF', category: 'hit' },
  { notation: '1B/9', description: 'Single to RF', category: 'hit' },
  { notation: '2B/7', description: 'Double to LF', category: 'hit' },
  { notation: '2B/8', description: 'Double to CF', category: 'hit' },
  { notation: '2B/9', description: 'Double to RF', category: 'hit' },
  
  // Errors
  { notation: 'E4', description: 'Error by 2B', category: 'error' },
  { notation: 'E5', description: 'Error by 3B', category: 'error' },
  { notation: 'E6', description: 'Error by SS', category: 'error' },
  { notation: 'E7', description: 'Error by LF', category: 'error' },
  { notation: 'E8', description: 'Error by CF', category: 'error' },
  { notation: 'E9', description: 'Error by RF', category: 'error' },
  
  // Special plays
  { notation: 'BB', description: 'Walk (Base on Balls)', category: 'special' },
  { notation: 'IBB', description: 'Intentional Walk', category: 'special' },
  { notation: 'HBP', description: 'Hit by Pitch', category: 'special' },
  { notation: 'SF7', description: 'Sacrifice Fly to LF', category: 'special' },
  { notation: 'SF8', description: 'Sacrifice Fly to CF', category: 'special' },
  { notation: 'SF9', description: 'Sacrifice Fly to RF', category: 'special' },
  { notation: 'SH', description: 'Sacrifice Hit (Bunt)', category: 'special' },
  { notation: 'FC', description: 'Fielder\'s Choice', category: 'special' },
  { notation: 'WP', description: 'Wild Pitch', category: 'special' },
  { notation: 'PB', description: 'Passed Ball', category: 'special' },
  { notation: 'SB2', description: 'Stolen Base (2nd)', category: 'advance' },
  { notation: 'SB3', description: 'Stolen Base (3rd)', category: 'advance' },
  { notation: 'SBH', description: 'Stolen Base (Home)', category: 'advance' },
  { notation: 'CS2', description: 'Caught Stealing (2nd)', category: 'advance' },
  { notation: 'CS3', description: 'Caught Stealing (3rd)', category: 'advance' }
];

export const ScoringNotation: React.FC<ScoringNotationProps> = ({ onScorePlay }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customNotation, setCustomNotation] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  const filteredPlays = selectedCategory === 'all' 
    ? commonPlays 
    : commonPlays.filter(play => play.category === selectedCategory);

  const handlePlaySelect = (play: PlayNotation) => {
    onScorePlay(play.notation, play.description);
  };

  const handleCustomPlay = () => {
    if (customNotation.trim() && customDescription.trim()) {
      onScorePlay(customNotation.trim(), customDescription.trim());
      setCustomNotation('');
      setCustomDescription('');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'out': return 'bg-red-500 hover:bg-red-600';
      case 'hit': return 'bg-green-500 hover:bg-green-600';
      case 'error': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'special': return 'bg-blue-500 hover:bg-blue-600';
      case 'advance': return 'bg-purple-500 hover:bg-purple-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-4 text-center">Baseball Scoring Notation</h3>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <Button
            onClick={() => setSelectedCategory('all')}
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="font-semibold"
          >
            All
          </Button>
          <Button
            onClick={() => setSelectedCategory('out')}
            variant={selectedCategory === 'out' ? 'default' : 'outline'}
            className="font-semibold"
          >
            Outs
          </Button>
          <Button
            onClick={() => setSelectedCategory('hit')}
            variant={selectedCategory === 'hit' ? 'default' : 'outline'}
            className="font-semibold"
          >
            Hits
          </Button>
          <Button
            onClick={() => setSelectedCategory('error')}
            variant={selectedCategory === 'error' ? 'default' : 'outline'}
            className="font-semibold"
          >
            Errors
          </Button>
          <Button
            onClick={() => setSelectedCategory('special')}
            variant={selectedCategory === 'special' ? 'default' : 'outline'}
            className="font-semibold"
          >
            Special
          </Button>
          <Button
            onClick={() => setSelectedCategory('advance')}
            variant={selectedCategory === 'advance' ? 'default' : 'outline'}
            className="font-semibold"
          >
            Baserunning
          </Button>
        </div>
      </div>

      {/* Common Plays Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        {filteredPlays.map((play, index) => (
          <Button
            key={index}
            onClick={() => handlePlaySelect(play)}
            className={`h-20 flex flex-col items-center justify-center text-white font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl ${getCategoryColor(play.category)}`}
          >
            <div className="text-lg font-bold">{play.notation}</div>
            <div className="text-xs text-center leading-tight">{play.description}</div>
          </Button>
        ))}
      </div>

      {/* Custom Notation Entry */}
      <Card className="p-4 bg-gray-50">
        <h4 className="font-bold mb-3">Custom Play Notation</h4>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Notation</label>
            <input
              type="text"
              value={customNotation}
              onChange={(e) => setCustomNotation(e.target.value)}
              placeholder="e.g., 6-4-3"
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="e.g., Double play SS to 2B to 1B"
              className="w-full p-2 border rounded-md"
            />
          </div>
          <Button 
            onClick={handleCustomPlay}
            disabled={!customNotation.trim() || !customDescription.trim()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6"
          >
            Add Play
          </Button>
        </div>
      </Card>

      {/* Scoring Legend */}
      <Card className="p-4 bg-blue-50 mt-4">
        <h4 className="font-bold mb-3">Position Numbers Reference</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold">Infield:</div>
            <div>1 - Pitcher (P)</div>
            <div>2 - Catcher (C)</div>
            <div>3 - First Base (1B)</div>
            <div>4 - Second Base (2B)</div>
            <div>5 - Third Base (3B)</div>
            <div>6 - Shortstop (SS)</div>
          </div>
          <div>
            <div className="font-semibold">Outfield:</div>
            <div>7 - Left Field (LF)</div>
            <div>8 - Center Field (CF)</div>
            <div>9 - Right Field (RF)</div>
          </div>
          <div>
            <div className="font-semibold">Common Codes:</div>
            <div>K - Strikeout</div>
            <div>BB - Walk</div>
            <div>HBP - Hit by Pitch</div>
            <div>E - Error</div>
            <div>SF - Sacrifice Fly</div>
            <div>SB - Stolen Base</div>
          </div>
        </div>
      </Card>
    </Card>
  );
};