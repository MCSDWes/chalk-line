import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit, Calendar, Users } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useRosters, CreateRosterData, UpdateRosterData } from '../../hooks/useRosters';
import { usePlayers } from '../../hooks/usePlayers';
import { Id } from '../../../convex/_generated/dataModel';

const rosterFormSchema = z.object({
  name: z.string().min(1, 'Roster name is required').max(100, 'Roster name too long'),
  gameDate: z.string().min(1, 'Game date is required').regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  playerIds: z.array(z.string()).min(9, 'Roster must have at least 9 players').max(30, 'Roster cannot exceed 30 players'),
  isActive: z.boolean(),
});

type RosterFormData = z.infer<typeof rosterFormSchema>;

interface Roster {
  _id: Id<"rosters">;
  teamId: Id<"teams">;
  name: string;
  gameDate: string;
  playerIds: Id<"players">[];
  isActive: boolean;
  _creationTime: number;
}

interface RosterFormProps {
  teamId: Id<"teams">;
  roster?: Roster; // If provided, form is in edit mode
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RosterForm({ teamId, roster, onSuccess, onCancel }: RosterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRoster, updateRoster } = useRosters(teamId);
  const { players } = usePlayers(teamId);
  const isEditMode = !!roster;

  const form = useForm<RosterFormData>({
    resolver: zodResolver(rosterFormSchema),
    defaultValues: {
      name: '',
      gameDate: new Date().toISOString().split('T')[0], // Today's date
      playerIds: [],
      isActive: true,
    },
  });

  // Update form when roster prop changes (for edit mode)
  useEffect(() => {
    if (roster) {
      form.reset({
        name: roster.name,
        gameDate: roster.gameDate,
        playerIds: roster.playerIds,
        isActive: roster.isActive,
      });
    } else {
      form.reset({
        name: '',
        gameDate: new Date().toISOString().split('T')[0],
        playerIds: [],
        isActive: true,
      });
    }
  }, [roster, form]);

  const selectedPlayerIds = form.watch('playerIds');

  const getDisplayName = (player: any): string => {
    if (player.isMinor) {
      return `${player.firstName} ${player.lastNameInitial}.`;
    } else {
      if (player.lastName && player.lastName.trim()) {
        return `${player.firstName} ${player.lastName}`;
      } else {
        return `${player.firstName} ${player.lastNameInitial}.`;
      }
    }
  };

  const togglePlayer = (playerId: string) => {
    const currentIds = form.getValues('playerIds');
    if (currentIds.includes(playerId)) {
      form.setValue('playerIds', currentIds.filter(id => id !== playerId));
    } else {
      form.setValue('playerIds', [...currentIds, playerId]);
    }
  };

  const selectAllPlayers = () => {
    if (players) {
      form.setValue('playerIds', players.map(p => p._id));
    }
  };

  const clearAllPlayers = () => {
    form.setValue('playerIds', []);
  };

  const onSubmit = async (data: RosterFormData) => {
    try {
      setIsSubmitting(true);
      
      if (isEditMode && roster) {
        // Edit mode: update existing roster
        const updates: UpdateRosterData = {
          name: data.name.trim(),
          playerIds: data.playerIds as Id<"players">[],
          isActive: data.isActive,
        };

        await updateRoster(roster._id, updates);
      } else {
        // Create mode: create new roster
        const rosterData: CreateRosterData = {
          name: data.name.trim(),
          gameDate: data.gameDate,
          playerIds: data.playerIds as Id<"players">[],
          isActive: data.isActive,
        };

        await createRoster(rosterData);
      }
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} roster:`, error);
      alert(`Failed to ${isEditMode ? 'update' : 'create'} roster: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!players) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading players...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit className="h-5 w-5" />
                Edit Roster
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Create New Roster
              </>
            )}
          </span>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              ×
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Roster Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roster Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., vs Eagles, Practice Roster" {...field} />
                    </FormControl>
                    <FormDescription>Descriptive name for this roster</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Game Date */}
              <FormField
                control={form.control}
                name="gameDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Date of the game or event</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Active Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roster Status</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={field.value === true}
                          onChange={() => field.onChange(true)}
                          className="text-blue-600"
                        />
                        <span>Active</span>
                        <Badge variant="default" className="text-xs">Current</Badge>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={field.value === false}
                          onChange={() => field.onChange(false)}
                          className="text-blue-600"
                        />
                        <span>Inactive</span>
                        <Badge variant="secondary" className="text-xs">Draft</Badge>
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Active rosters are ready for games. Inactive rosters are drafts.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Player Selection */}
            <FormField
              control={form.control}
              name="playerIds"
              render={() => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Select Players * ({selectedPlayerIds.length}/30)
                  </FormLabel>
                  
                  {/* Player Selection Controls */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllPlayers}
                    >
                      Select All ({players.length})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearAllPlayers}
                    >
                      Clear All
                    </Button>
                  </div>

                  {/* Player List */}
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                    {players.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No players available. Add players to your team first.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {players.map((player) => (
                          <div
                            key={player._id}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="checkbox"
                              id={`player-${player._id}`}
                              checked={selectedPlayerIds.includes(player._id)}
                              onChange={() => togglePlayer(player._id)}
                              className="text-blue-600"
                            />
                            <label
                              htmlFor={`player-${player._id}`}
                              className="flex items-center gap-2 cursor-pointer flex-1"
                            >
                              <span>{getDisplayName(player)}</span>
                              <Badge variant="outline" className="text-xs">
                                {player.position}
                              </Badge>
                              {player.jerseyNumber && (
                                <Badge variant="secondary" className="text-xs">
                                  #{player.jerseyNumber}
                                </Badge>
                              )}
                              {player.isMinor && (
                                <Badge variant="secondary" className="text-xs">
                                  Minor
                                </Badge>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <FormDescription>
                    Select 9-30 players for this roster. Minimum 9 players required for a valid lineup.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (isEditMode ? 'Updating Roster...' : 'Creating Roster...') 
                  : (isEditMode ? 'Update Roster' : 'Create Roster')
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}