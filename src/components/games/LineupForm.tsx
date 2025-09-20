import { useState, useEffect } from 'react';
import { useLineups } from '../../hooks/useLineups';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Alert } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Plus, X, Save, Users } from 'lucide-react';
import type { Id } from '../../../convex/_generated/dataModel';

interface Player {
  _id: Id<"players">;
  firstName: string;
  lastNameInitial: string;
  jerseyNumber?: number;
  position: string;
}

interface LineupSpot {
  playerId: Id<"players">;
  battingPosition: number;
  fieldPosition: 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';
}

interface LineupFormProps {
  gameId: Id<"games">;
  teamId: Id<"teams">;
  teamName: string;
  isHomeTeam: boolean;
  players: Player[];
  onSaveComplete: () => void;
  onCancel: () => void;
}

const FIELD_POSITIONS = [
  { value: 'P', label: 'Pitcher' },
  { value: 'C', label: 'Catcher' },
  { value: '1B', label: '1st Base' },
  { value: '2B', label: '2nd Base' },
  { value: '3B', label: '3rd Base' },
  { value: 'SS', label: 'Shortstop' },
  { value: 'LF', label: 'Left Field' },
  { value: 'CF', label: 'Center Field' },
  { value: 'RF', label: 'Right Field' },
  { value: 'DH', label: 'Designated Hitter' },
] as const;

export function LineupForm({ 
  gameId, 
  teamId, 
  teamName, 
  isHomeTeam, 
  players,
  onSaveComplete,
  onCancel 
}: LineupFormProps) {
  const { setLineup, getGameLineup } = useLineups();
  const [lineup, setLineupState] = useState<LineupSpot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing lineup if it exists
  const existingLineup = getGameLineup(gameId, teamId);

  useEffect(() => {
    if (existingLineup?.lineup) {
      setLineupState(existingLineup.lineup.battingOrder);
    }
  }, [existingLineup]);

  const addLineupSpot = () => {
    const nextPosition = lineup.length + 1;
    setLineupState([...lineup, {
      playerId: '' as Id<"players">,
      battingPosition: nextPosition,
      fieldPosition: 'P'
    }]);
  };

  const addAllPlayers = () => {
    // Add all available players that aren't already in the lineup
    // Filter out coaches/managers and only include actual players
    const usedPlayerIds = new Set(lineup.map(spot => spot.playerId));
    const availablePlayers = players.filter(p => 
      !usedPlayerIds.has(p._id) && 
      p.position !== 'Coach' && 
      p.position !== 'Manager' &&
      p.jerseyNumber !== null &&
      p.jerseyNumber !== undefined
    );
    
    // Position mapping from full names to abbreviations
    const positionMap: { [key: string]: LineupSpot['fieldPosition'] } = {
      'pitcher': 'P',
      'catcher': 'C',
      '1st base': '1B',
      '2nd base': '2B',
      '3rd base': '3B',
      'shortstop': 'SS',
      'left field': 'LF',
      'center field': 'CF',
      'right field': 'RF',
      'designated hitter': 'DH',
      'P': 'P',
      'C': 'C',
      '1B': '1B',
      '2B': '2B',
      '3B': '3B',
      'SS': 'SS',
      'LF': 'LF',
      'CF': 'CF',
      'RF': 'RF',
      'DH': 'DH'
    };
    
    const newSpots: LineupSpot[] = availablePlayers.map((player, index) => ({
      playerId: player._id,
      battingPosition: lineup.length + index + 1,
      fieldPosition: positionMap[player.position.toLowerCase()] || 'P'
    }));
    
    setLineupState([...lineup, ...newSpots]);
  };

  const clearLineup = () => {
    setLineupState([]);
  };

  const removeLineupSpot = (index: number) => {
    const newLineup = lineup.filter((_, i) => i !== index);
    // Renumber batting positions
    const renumbered = newLineup.map((spot, i) => ({
      ...spot,
      battingPosition: i + 1
    }));
    setLineupState(renumbered);
  };

  const updateLineupSpot = (index: number, field: keyof LineupSpot, value: any) => {
    const newLineup = [...lineup];
    newLineup[index] = { ...newLineup[index], [field]: value };
    setLineupState(newLineup);
  };

  const moveLineupSpot = (fromIndex: number, toIndex: number) => {
    const newLineup = [...lineup];
    const [movedItem] = newLineup.splice(fromIndex, 1);
    newLineup.splice(toIndex, 0, movedItem);
    
    // Renumber batting positions
    const renumbered = newLineup.map((spot, i) => ({
      ...spot,
      battingPosition: i + 1
    }));
    setLineupState(renumbered);
  };

  const validateLineup = (): string | null => {
    if (lineup.length === 0) {
      return 'Lineup cannot be empty';
    }

    // Check for missing players
    const missingPlayers = lineup.filter(spot => !spot.playerId);
    if (missingPlayers.length > 0) {
      return 'All lineup spots must have a player selected';
    }

    // Check for duplicate players
    const playerIds = lineup.map(spot => spot.playerId);
    const uniquePlayerIds = new Set(playerIds);
    if (playerIds.length !== uniquePlayerIds.size) {
      return 'Each player can only appear once in the lineup';
    }

    // Check for duplicate field positions (except DH)
    const fieldPositions = lineup
      .map(spot => spot.fieldPosition)
      .filter(pos => pos !== 'DH');
    const uniqueFieldPositions = new Set(fieldPositions);
    if (fieldPositions.length !== uniqueFieldPositions.size) {
      return 'Each field position can only be assigned once (except DH)';
    }

    return null;
  };

  const handleSave = async () => {
    setError(null);
    
    const validationError = validateLineup();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await setLineup({
        gameId,
        teamId,
        isHomeTeam,
        battingOrder: lineup,
      });
      onSaveComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to save lineup');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlayerDisplay = (player: Player) => {
    const jerseyText = player.jerseyNumber ? `#${player.jerseyNumber}` : '';
    return `${player.firstName} ${player.lastNameInitial}. ${jerseyText}`.trim();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {teamName} Lineup
            <Badge variant={isHomeTeam ? 'default' : 'secondary'}>
              {isHomeTeam ? 'Home' : 'Away'}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={addLineupSpot} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Player
            </Button>
            <Button onClick={addAllPlayers} size="sm" variant="default">
              <Users className="h-4 w-4 mr-1" />
              Add All Players
            </Button>
            {lineup.length > 0 && (
              <Button onClick={clearLineup} size="sm" variant="destructive">
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="border-red-200 bg-red-50 mb-4">
            <div className="text-red-800">{error}</div>
          </Alert>
        )}

        <div className="space-y-3">
          {lineup.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No players in lineup yet</p>
              <p className="text-sm">Click "Add All Players" to quickly add all players, then adjust order and positions as needed</p>
            </div>
          ) : (
            lineup.map((spot, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="min-w-[2rem]">
                    {spot.battingPosition}
                  </Badge>
                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={() => moveLineupSpot(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      ↑
                    </Button>
                    <Button
                      onClick={() => moveLineupSpot(index, Math.min(lineup.length - 1, index + 1))}
                      disabled={index === lineup.length - 1}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      ↓
                    </Button>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`player-${index}`} className="text-sm">Player</Label>
                    <select
                      id={`player-${index}`}
                      value={spot.playerId}
                      onChange={(e) => updateLineupSpot(index, 'playerId', e.target.value as Id<"players">)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">Select player</option>
                      {players
                        .filter(player => player.position !== 'Coach' && player.position !== 'Manager')
                        .map((player) => (
                        <option 
                          key={player._id} 
                          value={player._id}
                          disabled={lineup.some(s => s.playerId === player._id && s !== spot)}
                        >
                          {getPlayerDisplay(player)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor={`position-${index}`} className="text-sm">Field Position</Label>
                    <select
                      id={`position-${index}`}
                      value={spot.fieldPosition}
                      onChange={(e) => updateLineupSpot(index, 'fieldPosition', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    >
                      {FIELD_POSITIONS.map((pos) => (
                        <option 
                          key={pos.value} 
                          value={pos.value}
                          disabled={pos.value !== 'DH' && lineup.some(s => s.fieldPosition === pos.value && s !== spot)}
                        >
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  onClick={() => removeLineupSpot(index)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between pt-6">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Lineup'}
          </Button>
        </div>

        {lineup.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Lineup Preview</h4>
            <div className="text-sm text-blue-700">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Batting Order:</strong>
                  <ol className="list-decimal list-inside mt-1">
                    {lineup.map((spot, i) => {
                      const player = players.find(p => p._id === spot.playerId);
                      return (
                        <li key={i} className="text-xs">
                          {player ? getPlayerDisplay(player) : 'No player'} ({spot.fieldPosition})
                        </li>
                      );
                    })}
                  </ol>
                </div>
                <div>
                  <strong>Field Positions:</strong>
                  <ul className="mt-1">
                    {FIELD_POSITIONS.map(pos => {
                      const player = lineup.find(s => s.fieldPosition === pos.value);
                      const playerData = player ? players.find(p => p._id === player.playerId) : null;
                      return (
                        <li key={pos.value} className="text-xs">
                          {pos.label}: {playerData ? getPlayerDisplay(playerData) : '—'}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}