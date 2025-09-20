import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { usePlayers, VALID_POSITIONS, CreatePlayerData } from '../../hooks/usePlayers';
import { Id } from '../../../convex/_generated/dataModel';

const playerFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastNameInitial: z.string().min(1, 'Last name initial is required').max(1, 'Must be a single letter').regex(/^[A-Za-z]$/, 'Must be a letter'),
  lastName: z.string().max(50, 'Last name too long').optional(),
  isMinor: z.boolean(),
  position: z.string().min(1, 'Position is required'),
  jerseyNumber: z.coerce.number().min(0, 'Jersey number must be 0 or higher').max(99, 'Jersey number must be 99 or lower').optional(),
});

type PlayerFormData = z.infer<typeof playerFormSchema>;

interface PlayerFormProps {
  teamId: Id<"teams">;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PlayerForm({ teamId, onSuccess, onCancel }: PlayerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPlayer } = usePlayers(teamId);

  const form = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: '',
      lastNameInitial: '',
      lastName: '',
      isMinor: true,
      position: '',
      jerseyNumber: undefined,
    },
  });

  const isMinor = form.watch('isMinor');

  const onSubmit = async (data: PlayerFormData) => {
    try {
      setIsSubmitting(true);
      
      const playerData: CreatePlayerData = {
        firstName: data.firstName.trim(),
        lastNameInitial: data.lastNameInitial.toUpperCase(),
        isMinor: data.isMinor,
        position: data.position,
      };

      // Only include lastName for adults
      if (!data.isMinor && data.lastName && data.lastName.trim()) {
        playerData.lastName = data.lastName.trim();
      }

      // Only include jersey number if provided
      if (data.jerseyNumber !== undefined && data.jerseyNumber !== null) {
        playerData.jerseyNumber = data.jerseyNumber;
      }

      await createPlayer(playerData);
      
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create player:', error);
      alert(`Failed to create player: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Player
          </span>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Privacy Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">Privacy</Badge>
                <span className="text-sm font-medium">COPPA Compliant</span>
              </div>
              <p className="text-xs text-gray-600">
                For minors (under 13): Only first name and last initial are stored. 
                Adults may optionally provide full last name.
              </p>
            </div>

            {/* Minor Status */}
            <FormField
              control={form.control}
              name="isMinor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player Age Status</FormLabel>
                  <FormControl>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={field.value === true}
                          onChange={() => field.onChange(true)}
                          className="text-blue-600"
                        />
                        <span>Minor (Under 13)</span>
                        <Badge variant="secondary" className="text-xs">Privacy Protected</Badge>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={field.value === false}
                          onChange={() => field.onChange(false)}
                          className="text-blue-600"
                        />
                        <span>Adult (13+)</span>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Alex" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name Initial */}
              <FormField
                control={form.control}
                name="lastNameInitial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name Initial *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., J" 
                        maxLength={1}
                        className="text-center font-mono text-lg"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Single letter only</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Full Last Name (Adults Only) */}
            {!isMinor && (
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Last Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Johnson" {...field} />
                    </FormControl>
                    <FormDescription>
                      Available for adults only. Leave blank to use initial only.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Position */}
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position *</FormLabel>
                    <FormControl>
                      <select 
                        {...field} 
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select position</option>
                        {VALID_POSITIONS.map((pos) => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Jersey Number */}
              <FormField
                control={form.control}
                name="jerseyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jersey Number (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="99" 
                        placeholder="e.g., 23"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>0-99, leave blank for coaches</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding Player...' : 'Add Player'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}