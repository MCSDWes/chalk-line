import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Plus, Edit3, RotateCcw } from 'lucide-react';
import { InningScoreEntry } from './InningScoreEntry';
import type { Id } from '../../../convex/_generated/dataModel';

interface ConvexInning {
  _id: Id<"innings">;
  _creationTime: number;
  gameId: Id<"games">;
  inningNumber: number;
  homeRuns: number;
  awayRuns: number;
  homeHits?: number;
  awayHits?: number;
  homeErrors?: number;
  awayErrors?: number;
  isComplete: boolean;
}

interface ScorekeeperInterfaceProps {
  gameId: Id<"games">;
  homeTeamName: string;
  awayTeamName: string;
  currentInning: number;
  innings: ConvexInning[];
  onRefresh?: () => void;
}

export function ScorekeeperInterface({
  gameId,
  homeTeamName,
  awayTeamName,
  currentInning,
  innings,
  onRefresh
}: ScorekeeperInterfaceProps) {
  const [editingInning, setEditingInning] = useState<number | null>(null);

  // Calculate totals
  const totalHomeRuns = innings.reduce((sum, inning) => sum + inning.homeRuns, 0);
  const totalAwayRuns = innings.reduce((sum, inning) => sum + inning.awayRuns, 0);
  const totalHomeHits = innings.reduce((sum, inning) => sum + (inning.homeHits || 0), 0);
  const totalAwayHits = innings.reduce((sum, inning) => sum + (inning.awayHits || 0), 0);
  const totalHomeErrors = innings.reduce((sum, inning) => sum + (inning.homeErrors || 0), 0);
  const totalAwayErrors = innings.reduce((sum, inning) => sum + (inning.awayErrors || 0), 0);

  const handleScoreUpdated = () => {
    setEditingInning(null);
    onRefresh?.();
  };

  const handleAddNewInning = () => {
    const nextInning = Math.max(currentInning, innings.length) + 1;
    setEditingInning(nextInning);
  };

  const getInningData = (inningNum: number) => {
    return innings.find(inning => inning.inningNumber === inningNum);
  };

  return (
    <div className="space-y-6">
      {/* Current Score Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Scorekeeping Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">{awayTeamName}</h3>
              <div className="text-4xl font-bold text-red-600 mb-1">{totalAwayRuns}</div>
              <div className="text-sm text-gray-600">
                H: {totalAwayHits} | E: {totalAwayErrors}
              </div>
              <Badge variant="outline">Away</Badge>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">{homeTeamName}</h3>
              <div className="text-4xl font-bold text-blue-600 mb-1">{totalHomeRuns}</div>
              <div className="text-sm text-gray-600">
                H: {totalHomeHits} | E: {totalHomeErrors}
              </div>
              <Badge variant="outline">Home</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inning Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inning by Inning Scores</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={handleAddNewInning}
                size="sm"
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Inning
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Scoreboard Table */}
          {innings.length > 0 && (
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2">
                    <th className="text-left py-3 px-2 font-semibold">Team</th>
                    {innings.map((inning) => (
                      <th key={inning.inningNumber} className="text-center py-3 px-2 min-w-[50px] font-semibold">
                        {inning.inningNumber}
                      </th>
                    ))}
                    <th className="text-center py-3 px-2 font-bold border-l-2">R</th>
                    <th className="text-center py-3 px-2 font-bold">H</th>
                    <th className="text-center py-3 px-2 font-bold">E</th>
                    <th className="text-center py-3 px-2 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Away Team Row */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{awayTeamName}</td>
                    {innings.map((inning) => (
                      <td key={`away-${inning.inningNumber}`} className="text-center py-3 px-2 text-lg">
                        {inning.awayRuns}
                      </td>
                    ))}
                    <td className="text-center py-3 px-2 font-bold text-lg border-l-2">{totalAwayRuns}</td>
                    <td className="text-center py-3 px-2 font-bold">{totalAwayHits}</td>
                    <td className="text-center py-3 px-2 font-bold">{totalAwayErrors}</td>
                    <td className="text-center py-3 px-2">
                      <Badge className="bg-red-100 text-red-800">Away</Badge>
                    </td>
                  </tr>
                  
                  {/* Home Team Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{homeTeamName}</td>
                    {innings.map((inning) => (
                      <td key={`home-${inning.inningNumber}`} className="text-center py-3 px-2 text-lg">
                        {inning.homeRuns}
                      </td>
                    ))}
                    <td className="text-center py-3 px-2 font-bold text-lg border-l-2">{totalHomeRuns}</td>
                    <td className="text-center py-3 px-2 font-bold">{totalHomeHits}</td>
                    <td className="text-center py-3 px-2 font-bold">{totalHomeErrors}</td>
                    <td className="text-center py-3 px-2">
                      <Badge className="bg-blue-100 text-blue-800">Home</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Inning Actions */}
          {innings.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
              {innings.map((inning) => (
                <Button
                  key={inning.inningNumber}
                  onClick={() => setEditingInning(inning.inningNumber)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  Inning {inning.inningNumber}
                </Button>
              ))}
            </div>
          )}

          {innings.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No innings recorded yet</p>
              <Button onClick={handleAddNewInning} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Start Scorekeeping
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Entry Form */}
      {editingInning && (
        <InningScoreEntry
          gameId={gameId}
          inningNumber={editingInning}
          homeTeamName={homeTeamName}
          awayTeamName={awayTeamName}
          currentHomeRuns={getInningData(editingInning)?.homeRuns}
          currentAwayRuns={getInningData(editingInning)?.awayRuns}
          currentHomeHits={getInningData(editingInning)?.homeHits}
          currentAwayHits={getInningData(editingInning)?.awayHits}
          currentHomeErrors={getInningData(editingInning)?.homeErrors}
          currentAwayErrors={getInningData(editingInning)?.awayErrors}
          onScoreUpdated={handleScoreUpdated}
        />
      )}

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scorekeeping Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• <strong>Runs:</strong> Number of runs scored by the team in this inning</p>
            <p>• <strong>Hits:</strong> Number of hits (singles, doubles, triples, home runs) by the team</p>
            <p>• <strong>Errors:</strong> Number of fielding errors committed by the opposing team</p>
            <p>• Click "Edit Inning X" to modify scores for any inning</p>
            <p>• The totals are automatically calculated and update the game score</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}