import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useGames } from '../../hooks/useGames';
import type { Id } from '../../../convex/_generated/dataModel';

interface InningScoreEntryProps {
  gameId: Id<"games">;
  inningNumber: number;
  homeTeamName: string;
  awayTeamName: string;
  currentHomeRuns?: number;
  currentAwayRuns?: number;
  currentHomeHits?: number;
  currentAwayHits?: number;
  currentHomeErrors?: number;
  currentAwayErrors?: number;
  onScoreUpdated?: () => void;
}

export function InningScoreEntry({
  gameId,
  inningNumber,
  homeTeamName,
  awayTeamName,
  currentHomeRuns = 0,
  currentAwayRuns = 0,
  currentHomeHits = 0,
  currentAwayHits = 0,
  currentHomeErrors = 0,
  currentAwayErrors = 0,
  onScoreUpdated
}: InningScoreEntryProps) {
  const { updateInningScore, ensureInningExists } = useGames();
  
  // Home team state
  const [homeRuns, setHomeRuns] = useState(currentHomeRuns);
  const [homeHits, setHomeHits] = useState(currentHomeHits);
  const [homeErrors, setHomeErrors] = useState(currentHomeErrors);
  
  // Away team state
  const [awayRuns, setAwayRuns] = useState(currentAwayRuns);
  const [awayHits, setAwayHits] = useState(currentAwayHits);
  const [awayErrors, setAwayErrors] = useState(currentAwayErrors);
  
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateScore = async (isHomeTeam: boolean) => {
    setIsUpdating(true);
    try {
      // Ensure the inning exists before updating
      await ensureInningExists({ gameId, inningNumber });
      
      if (isHomeTeam) {
        await updateInningScore({
          gameId,
          inningNumber,
          isHomeTeam: true,
          runs: homeRuns,
          hits: homeHits,
          errors: homeErrors
        });
      } else {
        await updateInningScore({
          gameId,
          inningNumber,
          isHomeTeam: false,
          runs: awayRuns,
          hits: awayHits,
          errors: awayErrors
        });
      }
      onScoreUpdated?.();
    } catch (error) {
      console.error('Error updating score:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Inning {inningNumber} Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Away Team */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center border-b pb-2">
              {awayTeamName} (Away)
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor={`away-runs-${inningNumber}`} className="text-sm">Runs</Label>
                <Input
                  id={`away-runs-${inningNumber}`}
                  type="number"
                  min="0"
                  max="20"
                  value={awayRuns}
                  onChange={(e) => setAwayRuns(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
              <div>
                <Label htmlFor={`away-hits-${inningNumber}`} className="text-sm">Hits</Label>
                <Input
                  id={`away-hits-${inningNumber}`}
                  type="number"
                  min="0"
                  max="10"
                  value={awayHits}
                  onChange={(e) => setAwayHits(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
              <div>
                <Label htmlFor={`away-errors-${inningNumber}`} className="text-sm">Errors</Label>
                <Input
                  id={`away-errors-${inningNumber}`}
                  type="number"
                  min="0"
                  max="5"
                  value={awayErrors}
                  onChange={(e) => setAwayErrors(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
            </div>
            
            <Button
              onClick={() => handleUpdateScore(false)}
              disabled={isUpdating}
              className="w-full"
              variant="outline"
            >
              {isUpdating ? 'Updating...' : `Save ${awayTeamName} Score`}
            </Button>
          </div>

          {/* Home Team */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center border-b pb-2">
              {homeTeamName} (Home)
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor={`home-runs-${inningNumber}`} className="text-sm">Runs</Label>
                <Input
                  id={`home-runs-${inningNumber}`}
                  type="number"
                  min="0"
                  max="20"
                  value={homeRuns}
                  onChange={(e) => setHomeRuns(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
              <div>
                <Label htmlFor={`home-hits-${inningNumber}`} className="text-sm">Hits</Label>
                <Input
                  id={`home-hits-${inningNumber}`}
                  type="number"
                  min="0"
                  max="10"
                  value={homeHits}
                  onChange={(e) => setHomeHits(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
              <div>
                <Label htmlFor={`home-errors-${inningNumber}`} className="text-sm">Errors</Label>
                <Input
                  id={`home-errors-${inningNumber}`}
                  type="number"
                  min="0"
                  max="5"
                  value={homeErrors}
                  onChange={(e) => setHomeErrors(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
            </div>
            
            <Button
              onClick={() => handleUpdateScore(true)}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? 'Updating...' : `Save ${homeTeamName} Score`}
            </Button>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600 text-center">
            Enter the runs, hits, and errors for each team in this inning. 
            Click the save button to record the scores.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}