import { useState } from 'react';
import { useGames } from '../../hooks/useGames';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert } from '../ui/alert';

interface Team {
  _id: string;
  name: string;
  season: string;
}

interface GameFormProps {
  teams: Team[];
  onGameCreated: () => void;
  onCancel: () => void;
}

export function GameForm({ teams, onGameCreated, onCancel }: GameFormProps) {
  const { createGame } = useGames();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    myTeamId: '',
    myTeamRole: 'home' as 'home' | 'away',
    opponentTeamName: '',
    gameDate: new Date().toISOString().split('T')[0], // Today's date
    gameTime: '',
    field: '',
    season: teams[0]?.season || '',
    gameType: 'regular' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.myTeamId) {
        throw new Error('Please select your team');
      }
      
      if (!formData.opponentTeamName.trim()) {
        throw new Error('Please enter the opposing team name');
      }

      // Set home and away teams based on user selection
      const homeTeamId = formData.myTeamRole === 'home' ? formData.myTeamId : undefined;
      const awayTeamId = formData.myTeamRole === 'away' ? formData.myTeamId : undefined;
      const homeTeamName = formData.myTeamRole === 'home' ? undefined : formData.opponentTeamName.trim();
      const awayTeamName = formData.myTeamRole === 'away' ? undefined : formData.opponentTeamName.trim();

      await createGame({
        homeTeamId: homeTeamId as any,
        awayTeamId: awayTeamId as any,
        homeTeamName: homeTeamName,
        awayTeamName: awayTeamName,
        gameDate: formData.gameDate,
        gameTime: formData.gameTime || undefined,
        field: formData.field || undefined,
        season: formData.season,
        gameType: formData.gameType,
      });

      onGameCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Game</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <div className="text-red-800">{error}</div>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="myTeam">Your Team</Label>
              <select
                id="myTeam"
                value={formData.myTeamId}
                onChange={(e) => handleInputChange('myTeamId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select your team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} ({team.season})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="teamRole">Your Team Role</Label>
              <select
                id="teamRole"
                value={formData.myTeamRole}
                onChange={(e) => handleInputChange('myTeamRole', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="home">Home Team</option>
                <option value="away">Away Team (Visiting)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="opponentTeam">Opposing Team</Label>
              <Input
                id="opponentTeam"
                type="text"
                value={formData.opponentTeamName}
                onChange={(e) => handleInputChange('opponentTeamName', e.target.value)}
                placeholder="Enter opposing team name"
                required
              />
            </div>

            <div>
              <Label htmlFor="gameDate">Game Date</Label>
              <Input
                id="gameDate"
                type="date"
                value={formData.gameDate}
                onChange={(e) => handleInputChange('gameDate', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="gameTime">Game Time (Optional)</Label>
              <Input
                id="gameTime"
                type="time"
                value={formData.gameTime}
                onChange={(e) => handleInputChange('gameTime', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="field">Field/Venue (Optional)</Label>
              <Input
                id="field"
                type="text"
                value={formData.field}
                onChange={(e) => handleInputChange('field', e.target.value)}
                placeholder="Enter field or venue name"
              />
            </div>

            <div>
              <Label htmlFor="season">Season</Label>
              <Input
                id="season"
                type="text"
                value={formData.season}
                onChange={(e) => handleInputChange('season', e.target.value)}
                placeholder="e.g., 2025 Spring"
                required
              />
            </div>

            <div>
              <Label htmlFor="gameType">Game Type</Label>
              <select
                id="gameType"
                value={formData.gameType}
                onChange={(e) => handleInputChange('gameType', e.target.value as any)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="regular">Regular Season</option>
                <option value="playoff">Playoff</option>
                <option value="championship">Championship</option>
                <option value="scrimmage">Scrimmage</option>
                <option value="tournament">Tournament</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Game'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}