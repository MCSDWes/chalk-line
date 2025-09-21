import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { ArrowLeft, Plus, Users, Save, X } from 'lucide-react';

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
  jerseyNumber?: number;
  battingPosition: number;
  fieldPosition: string;
}

interface ExternalTeamLineupFormProps {
  awayTeamName: string;
  onSubmit: (lineup: ExternalTeamPlayer[]) => void;
  onCancel: () => void;
  existingLineup?: ExternalTeamPlayer[];
  mode?: 'edit' | 'start-game'; // 'edit' for saving, 'start-game' for game start
}

export function ExternalTeamLineupForm({ 
  awayTeamName, 
  onSubmit, 
  onCancel,
  existingLineup,
  mode = 'start-game'
}: ExternalTeamLineupFormProps) {
  const [lineup, setLineup] = useState<ExternalTeamPlayer[]>(
    existingLineup && existingLineup.length > 0 
      ? existingLineup 
      : [{ playerName: '', jerseyNumber: undefined, battingPosition: 1, fieldPosition: '' }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Quick fill with standard lineup
  const quickFillStandardLineup = () => {
    const standardLineup: ExternalTeamPlayer[] = [
      { playerName: '', jerseyNumber: undefined, battingPosition: 1, fieldPosition: 'CF' },
      { playerName: '', jerseyNumber: undefined, battingPosition: 2, fieldPosition: '2B' },
      { playerName: '', jerseyNumber: undefined, battingPosition: 3, fieldPosition: '1B' },
      { playerName: '', jerseyNumber: undefined, battingPosition: 4, fieldPosition: 'LF' },
      { playerName: '', jerseyNumber: undefined, battingPosition: 5, fieldPosition: '3B' },
      { playerName: '', jerseyNumber: undefined, battingPosition: 6, fieldPosition: 'RF' },
      { playerName: '', jerseyNumber: undefined, battingPosition: 7, fieldPosition: 'C' },
      { playerName: '', jerseyNumber: undefined, battingPosition: 8, fieldPosition: 'SS' },
      { playerName: '', jerseyNumber: undefined, battingPosition: 9, fieldPosition: 'P' },
    ];
    setLineup(standardLineup);
  };

  const addPlayer = () => {
    if (lineup.length < 15) { // Max 15 players (9 starters + 6 bench)
      setLineup([
        ...lineup,
        { 
          playerName: '', 
          jerseyNumber: undefined,
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

  const updatePlayer = (index: number, field: keyof ExternalTeamPlayer, value: string | number | undefined) => {
    const newLineup = [...lineup];
    newLineup[index] = { ...newLineup[index], [field]: value };
    setLineup(newLineup);
  };

  const movePlayerUp = (index: number) => {
    if (index > 0) {
      const newLineup = [...lineup];
      [newLineup[index - 1], newLineup[index]] = [newLineup[index], newLineup[index - 1]];
      // Update batting positions
      newLineup[index - 1].battingPosition = index;
      newLineup[index].battingPosition = index + 1;
      setLineup(newLineup);
    }
  };

  const movePlayerDown = (index: number) => {
    if (index < lineup.length - 1) {
      const newLineup = [...lineup];
      [newLineup[index], newLineup[index + 1]] = [newLineup[index + 1], newLineup[index]];
      // Update batting positions
      newLineup[index].battingPosition = index + 1;
      newLineup[index + 1].battingPosition = index + 2;
      setLineup(newLineup);
    }
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
              <li>• Enter player names, jersey numbers, and field positions</li>
              <li>• Click "Quick Fill Standard Lineup" to set up positions automatically</li>
              <li>• Use ↑↓ arrows next to batting order number to reorder players</li>
              <li>• Enter at least 9 players for the starting lineup</li>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {awayTeamName} Batting Order & Field Positions
            </CardTitle>
            <Button
              onClick={quickFillStandardLineup}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700"
            >
              Quick Fill Standard Lineup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lineup.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No players in lineup yet</p>
                <p className="text-sm">Click "Quick Fill Standard Lineup" to set up positions automatically</p>
              </div>
            ) : (
              lineup.map((player, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="min-w-[2rem]">
                      {index + 1}
                    </Badge>
                    <div className="flex flex-col gap-1">
                      <Button
                        onClick={() => movePlayerUp(index)}
                        disabled={index === 0}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        onClick={() => movePlayerDown(index)}
                        disabled={index === lineup.length - 1}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                      >
                        ↓
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`player-${index}`} className="text-sm">Player Name</Label>
                      <Input
                        id={`player-${index}`}
                        value={player.playerName}
                        onChange={(e) => updatePlayer(index, 'playerName', e.target.value)}
                        placeholder="Enter player name"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`jersey-${index}`} className="text-sm">Jersey #</Label>
                      <Input
                        id={`jersey-${index}`}
                        type="number"
                        min="0"
                        max="99"
                        value={player.jerseyNumber || ''}
                        onChange={(e) => updatePlayer(index, 'jerseyNumber', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="#"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`position-${index}`} className="text-sm">Field Position</Label>
                      <select
                        id={`position-${index}`}
                        value={player.fieldPosition}
                        onChange={(e) => updatePlayer(index, 'fieldPosition', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select position</option>
                        {FIELD_POSITIONS.map((pos) => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    {lineup.length > 1 && (
                      <Button
                        onClick={() => removePlayer(index)}
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}

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

            {/* Submit Actions - moved inside the main card */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex gap-4 justify-end">
                <Button onClick={onCancel} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={mode === 'edit' ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {isSubmitting ? (
                    mode === 'edit' ? 'Saving...' : 'Starting Game...'
                  ) : (
                    mode === 'edit' ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Lineup
                      </>
                    ) : 'Start Game'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}