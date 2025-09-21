import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface InningScoreboardProps {
  homeTeamName: string;
  awayTeamName: string;
  currentInning: number;
  isTopInning: boolean;
  homeScore: number;
  awayScore: number;
  inningScores: {
    home: number[];
    away: number[];
  };
  onInningComplete: (runs: number) => void;
  onNextInning: () => void;
  onSwitchHalf: () => void;
}

export const InningScoreboard: React.FC<InningScoreboardProps> = ({
  homeTeamName,
  awayTeamName,
  currentInning,
  isTopInning,
  homeScore,
  awayScore,
  inningScores,
  onNextInning,
  onSwitchHalf
}) => {
  const [currentInningRuns, setCurrentInningRuns] = useState(0);
  const [currentInningHits, setCurrentInningHits] = useState(0);
  const [currentInningErrors, setCurrentInningErrors] = useState(0);
  const [currentInningLOB, setCurrentInningLOB] = useState(0);

  const addRun = () => {
    setCurrentInningRuns(prev => prev + 1);
  };

  const subtractRun = () => {
    setCurrentInningRuns(prev => Math.max(0, prev - 1));
  };

  const addHit = () => {
    setCurrentInningHits(prev => prev + 1);
  };

  const addError = () => {
    setCurrentInningErrors(prev => prev + 1);
  };

  const currentTeam = isTopInning ? awayTeamName : homeTeamName;

  return (
    <div className="space-y-6">
      {/* Main Scoreboard */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isTopInning ? 'Top' : 'Bottom'} of the {currentInning}
            {currentInning === 1 ? 'st' : currentInning === 2 ? 'nd' : currentInning === 3 ? 'rd' : 'th'}
          </h2>
          <div className="text-lg text-gray-600">
            <span className="font-semibold text-blue-600">{currentTeam}</span> batting
          </div>
        </div>

        {/* Inning-by-Inning Score */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="p-2 text-left font-bold">Team</th>
                {Array.from({ length: Math.max(9, currentInning) }, (_, i) => (
                  <th key={i} className={`p-2 w-12 font-bold ${
                    i + 1 === currentInning ? 'bg-blue-100 text-blue-800' : ''
                  }`}>
                    {i + 1}
                  </th>
                ))}
                <th className="p-2 w-16 font-bold bg-gray-100">R</th>
                <th className="p-2 w-16 font-bold bg-gray-100">H</th>
                <th className="p-2 w-16 font-bold bg-gray-100">E</th>
              </tr>
            </thead>
            <tbody>
              {/* Away Team */}
              <tr className={`border-b ${isTopInning ? 'bg-blue-50' : ''}`}>
                <td className="p-2 text-left font-semibold">{awayTeamName}</td>
                {Array.from({ length: Math.max(9, currentInning) }, (_, i) => (
                  <td key={i} className={`p-2 ${
                    i + 1 === currentInning && isTopInning ? 'bg-blue-200 font-bold' : 
                    i + 1 === currentInning ? 'bg-blue-100' : ''
                  }`}>
                    {i + 1 === currentInning && isTopInning ? 
                      currentInningRuns : 
                      (inningScores.away[i] ?? (i < currentInning - 1 ? 0 : '-'))
                    }
                  </td>
                ))}
                <td className="p-2 bg-gray-100 font-bold text-lg">
                  {awayScore + (isTopInning ? currentInningRuns : 0)}
                </td>
                <td className="p-2 bg-gray-100">-</td>
                <td className="p-2 bg-gray-100">-</td>
              </tr>
              
              {/* Home Team */}
              <tr className={`${!isTopInning ? 'bg-blue-50' : ''}`}>
                <td className="p-2 text-left font-semibold">{homeTeamName}</td>
                {Array.from({ length: Math.max(9, currentInning) }, (_, i) => (
                  <td key={i} className={`p-2 ${
                    i + 1 === currentInning && !isTopInning ? 'bg-blue-200 font-bold' : 
                    i + 1 === currentInning ? 'bg-blue-100' : ''
                  }`}>
                    {i + 1 === currentInning && !isTopInning ? 
                      currentInningRuns : 
                      (inningScores.home[i] ?? (i < currentInning - 1 ? 0 : '-'))
                    }
                  </td>
                ))}
                <td className="p-2 bg-gray-100 font-bold text-lg">
                  {homeScore + (!isTopInning ? currentInningRuns : 0)}
                </td>
                <td className="p-2 bg-gray-100">-</td>
                <td className="p-2 bg-gray-100">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Current Inning Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{currentInningRuns}</div>
            <div className="text-sm text-gray-600">Runs This Inning</div>
            <div className="flex gap-2 mt-2 justify-center">
              <Button onClick={addRun} size="sm" className="bg-green-500 hover:bg-green-600">
                +1
              </Button>
              <Button onClick={subtractRun} size="sm" variant="outline">
                -1
              </Button>
            </div>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{currentInningHits}</div>
            <div className="text-sm text-gray-600">Hits This Inning</div>
            <Button onClick={addHit} size="sm" className="mt-2 bg-green-500 hover:bg-green-600">
              +1 Hit
            </Button>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{currentInningErrors}</div>
            <div className="text-sm text-gray-600">Errors This Inning</div>
            <Button onClick={addError} size="sm" className="mt-2 bg-yellow-500 hover:bg-yellow-600">
              +1 Error
            </Button>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{currentInningLOB}</div>
            <div className="text-sm text-gray-600">Left on Base</div>
            <div className="flex gap-1 mt-2 justify-center">
              <Button 
                onClick={() => setCurrentInningLOB(prev => Math.max(0, prev - 1))} 
                size="sm" 
                variant="outline"
              >
                -
              </Button>
              <Button 
                onClick={() => setCurrentInningLOB(prev => prev + 1)} 
                size="sm" 
                variant="outline"
              >
                +
              </Button>
            </div>
          </Card>
        </div>

        {/* Inning Control Buttons */}
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={onSwitchHalf}
            size="lg"
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8"
          >
            {isTopInning ? 'End Top Half' : 'End Bottom Half'}
          </Button>
          
          {!isTopInning && (
            <Button 
              onClick={onNextInning}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8"
            >
              Next Inning
            </Button>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            onClick={() => {
              addRun();
              addHit();
            }}
            className="bg-green-500 hover:bg-green-600 text-white font-bold"
          >
            RBI Single
          </Button>
          
          <Button 
            onClick={() => {
              setCurrentInningRuns(prev => prev + 2);
              addHit();
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold"
          >
            2-RBI Double
          </Button>
          
          <Button 
            onClick={() => {
              setCurrentInningRuns(prev => prev + 3);
              addHit();
            }}
            className="bg-green-700 hover:bg-green-800 text-white font-bold"
          >
            3-RBI Triple
          </Button>
          
          <Button 
            onClick={() => {
              setCurrentInningRuns(prev => prev + 4);
              addHit();
            }}
            className="bg-green-800 hover:bg-green-900 text-white font-bold"
          >
            Grand Slam
          </Button>
        </div>
      </Card>
    </div>
  );
};