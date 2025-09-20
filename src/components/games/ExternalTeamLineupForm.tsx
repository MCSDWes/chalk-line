import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react';

// Baseball field positions
const FIELD_POSITIONS = [
  { value: 'P', label: 'Pitcher (P)' },
  { value: 'C', label: 'Catcher (C)' },
  { value: '1B', label: '1st Base (1B)' },
  { value: '2B', label: '2nd Base (2B)' },
  { value: '3B', label: '3rd Base (3B)' },
  { value: 'SS', label: 'Shortstop (SS)' },
  { value: 'LF', label: 'Left Field (LF)' },
  { value: 'CF', label: 'Center Field (CF)' },
  { value: 'RF', label: 'Right Field (RF)' },
  { value: 'DH', label: 'Designated Hitter (DH)' },
];

interface ExternalTeamPlayer {
  playerName: string;
  battingPosition: number;
  fieldPosition: string;
}

interface ExternalTeamLineupFormProps {
  awayTeamName: string;
  onSubmit: (lineup: ExternalTeamPlayer[]) => void;
  onCancel: () => void;
}

export function ExternalTeamLineupForm({ 
  awayTeamName, 
  onSubmit, 
  onCancel 
}: ExternalTeamLineupFormProps) {
  const [lineup, setLineup] = useState<ExternalTeamPlayer[]>([
    { playerName: '', battingPosition: 1, fieldPosition: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const addPlayer = () => {
    if (lineup.length < 15) { // Max 15 players (9 starters + 6 bench)
      setLineup([
        ...lineup,
        { 
          playerName: '', 
          battingPosition: lineup.length + 1, 
          fieldPosition: '' 
        }
      ]);
    }
  };

  const removePlayer = (index: number) => {
    if (lineup.length > 1) {
      const newLineup = lineup.filter((_, i) => i !== index);
      // Renumber batting positions
      const renumberedLineup = newLineup.map((player, i) => ({
        ...player,
        battingPosition: i + 1
      }));
      setLineup(renumberedLineup);
    }
  };

  const updatePlayer = (index: number, field: keyof ExternalTeamPlayer, value: string | number) => {
    const newLineup = [...lineup];
    newLineup[index] = { ...newLineup[index], [field]: value };
    setLineup(newLineup);
  };

  const validateLineup = (): string[] => {
    const errors: string[] = [];
    
    // Check minimum players (must have at least 9)
    if (lineup.length < 9) {
      errors.push('You must enter at least 9 players (starting lineup)');
    }

    // Check for empty player names in batting order
    const battingLineup = lineup.filter(p => p.battingPosition <= 9);
    const emptyNames = battingLineup.filter(p => !p.playerName.trim());
    if (emptyNames.length > 0) {
      errors.push('All players in the batting order (1-9) must have names');
    }

    // Check for required field positions (at least P and C)
    const positions = lineup.map(p => p.fieldPosition).filter(Boolean);
    if (!positions.includes('P')) {
      errors.push('You must assign a Pitcher (P)');
    }
    if (!positions.includes('C')) {
      errors.push('You must assign a Catcher (C)');
    }

    // Check for duplicate field positions in starting lineup
    const startingPositions = lineup
      .filter(p => p.battingPosition <= 9 && p.fieldPosition)
      .map(p => p.fieldPosition);
    const duplicatePositions = startingPositions.filter((pos, index) => 
      startingPositions.indexOf(pos) !== index
    );
    if (duplicatePositions.length > 0) {
      errors.push(`Duplicate field positions: ${duplicatePositions.join(', ')}`);
    }

    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateLineup();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);
    
    try {
      // Filter to only include players with names and sort by batting position
      const validPlayers = lineup
        .filter(p => p.playerName.trim())
        .sort((a, b) => a.battingPosition - b.battingPosition);
      
      await onSubmit(validPlayers);
    } catch (error) {
      setErrors(['Failed to save lineup. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onCancel} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Enter {awayTeamName} Lineup</h1>
          <p className="text-gray-600">Set the batting order and field positions for the visiting team</p>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">📋 Instructions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Enter at least 9 players for the starting lineup</li>
              <li>• Assign field positions for the defensive lineup</li>
              <li>• Batting order determines the sequence of at-bats</li>
              <li>• You can add substitute players (positions 10-15)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">❌ Please fix these issues:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lineup Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {awayTeamName} Batting Order & Field Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lineup.map((player, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant={index < 9 ? "default" : "secondary"} className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <Label className="text-sm font-medium">
                    {index < 9 ? 'Starter' : 'Substitute'}
                  </Label>
                </div>
                
                <div>
                  <Label htmlFor={`player-${index}`}>Player Name</Label>
                  <Input
                    id={`player-${index}`}
                    value={player.playerName}
                    onChange={(e) => updatePlayer(index, 'playerName', e.target.value)}
                    placeholder="Enter player name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`position-${index}`}>Field Position</Label>
                  <select
                    id={`position-${index}`}
                    value={player.fieldPosition}
                    onChange={(e) => updatePlayer(index, 'fieldPosition', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select position</option>
                    {FIELD_POSITIONS.map((pos) => (
                      <option key={pos.value} value={pos.value}>
                        {pos.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  {lineup.length > 1 && (
                    <Button
                      onClick={() => removePlayer(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Player Button */}
            {lineup.length < 15 && (
              <Button
                onClick={addPlayer}
                variant="outline"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player {lineup.length < 9 ? `(${9 - lineup.length} more needed)` : '(Substitute)'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 justify-end">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Starting Game...' : 'Start Game'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}