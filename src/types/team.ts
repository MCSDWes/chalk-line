import { z } from "zod";

// Baseball position enum matching Convex schema
export const PositionSchema = z.enum([
  'P',    // Pitcher
  'C',    // Catcher
  '1B',   // First Base
  '2B',   // Second Base
  '3B',   // Third Base
  'SS',   // Shortstop
  'LF',   // Left Field
  'CF',   // Center Field
  'RF',   // Right Field
  'DH'    // Designated Hitter
]);

export type Position = z.infer<typeof PositionSchema>;

// Position display names for UI
export const POSITION_LABELS: Record<Position, string> = {
  'P': 'Pitcher',
  'C': 'Catcher',
  '1B': 'First Base',
  '2B': 'Second Base', 
  '3B': 'Third Base',
  'SS': 'Shortstop',
  'LF': 'Left Field',
  'CF': 'Center Field',
  'RF': 'Right Field',
  'DH': 'Designated Hitter'
};

// Privacy-compliant player name validation
export const PlayerNameSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less")
    .regex(/^[a-zA-Z\s\-']+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  
  lastNameInitial: z.string()
    .length(1, "Last name initial must be exactly one letter")
    .regex(/^[A-Z]$/, "Last name initial must be a single uppercase letter")
});

// Team validation
export const TeamSchema = z.object({
  name: z.string()
    .min(1, "Team name is required")
    .max(50, "Team name must be 50 characters or less")
    .regex(/^[a-zA-Z0-9\s]+$/, "Team name can only contain letters, numbers, and spaces"),
  
  season: z.string()
    .min(1, "Season is required")
    .max(20, "Season must be 20 characters or less")
});

// Jersey number validation (1-99 for baseball)
export const JerseyNumberSchema = z.number()
  .int("Jersey number must be a whole number")
  .min(1, "Jersey number must be at least 1")
  .max(99, "Jersey number must be 99 or less");

// Roster entry validation
export const RosterEntrySchema = z.object({
  playerId: z.string().min(1, "Player is required"),
  jerseyNumber: JerseyNumberSchema,
  primaryPosition: PositionSchema,
  secondaryPositions: z.array(PositionSchema)
    .optional()
    .default([])
    .refine(
      (positions) => positions.length <= 3,
      "Player can have at most 3 secondary positions"
    )
});

// Form schemas for React Hook Form
export const CreateTeamSchema = TeamSchema;
export const CreatePlayerSchema = PlayerNameSchema;
export const AddPlayerToTeamSchema = RosterEntrySchema;

// TypeScript types
export type Team = z.infer<typeof TeamSchema>;
export type Player = z.infer<typeof PlayerNameSchema> & {
  id: string;
  displayName: string; // "FirstName L." format
  createdAt: Date;
  updatedAt: Date;
};

export type PlayerTeamRoster = {
  id: string;
  playerId: string;
  teamId: string;
  player: Player;
  jerseyNumber: number;
  primaryPosition: Position;
  secondaryPositions: Position[];
  isActive: boolean;
  joinedAt: Date;
  leftAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamWithRoster = Team & {
  id: string;
  userId: string;
  roster: PlayerTeamRoster[];
  playerCount: number;
  createdAt: Date;
  updatedAt: Date;
};

// Form types for React Hook Form
export type CreateTeamForm = z.infer<typeof CreateTeamSchema>;
export type CreatePlayerForm = z.infer<typeof CreatePlayerSchema>;
export type AddPlayerToTeamForm = z.infer<typeof AddPlayerToTeamSchema>;

// Utility function to create display name for privacy compliance
export const createDisplayName = (firstName: string, lastNameInitial: string): string => {
  return `${firstName} ${lastNameInitial}.`;
};

// Validation helper for checking duplicate players
export const isDuplicatePlayer = (
  existingPlayers: Player[],
  newPlayer: CreatePlayerForm
): boolean => {
  return existingPlayers.some(
    player => 
      player.firstName.toLowerCase() === newPlayer.firstName.toLowerCase() &&
      player.lastNameInitial === newPlayer.lastNameInitial
  );
};

// Jersey number availability checker
export const isJerseyNumberAvailable = (
  roster: PlayerTeamRoster[],
  jerseyNumber: number,
  excludePlayerId?: string
): boolean => {
  return !roster.some(
    entry => 
      entry.isActive && 
      entry.jerseyNumber === jerseyNumber &&
      entry.playerId !== excludePlayerId
  );
};

// Get available jersey numbers for a team
export const getAvailableJerseyNumbers = (roster: PlayerTeamRoster[]): number[] => {
  const usedNumbers = new Set(
    roster
      .filter(entry => entry.isActive)
      .map(entry => entry.jerseyNumber)
  );
  
  const available: number[] = [];
  for (let i = 1; i <= 99; i++) {
    if (!usedNumbers.has(i)) {
      available.push(i);
    }
  }
  
  return available;
};