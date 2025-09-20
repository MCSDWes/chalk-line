import { z } from "zod";
import { 
  CreateTeamSchema,
  CreatePlayerSchema,
  AddPlayerToTeamSchema,
  PositionSchema
} from "../types/team";

// Error message customization for better UX
export const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.expected === "string") {
        return { message: "This field is required" };
      }
      break;
    case z.ZodIssueCode.too_small:
      if (issue.type === "string") {
        return { message: `Must be at least ${issue.minimum} characters` };
      }
      if (issue.type === "number") {
        return { message: `Must be at least ${issue.minimum}` };
      }
      break;
    case z.ZodIssueCode.too_big:
      if (issue.type === "string") {
        return { message: `Must be no more than ${issue.maximum} characters` };
      }
      if (issue.type === "number") {
        return { message: `Must be no more than ${issue.maximum}` };
      }
      break;
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "regex") {
        if (issue.path.includes("firstName")) {
          return { message: "First name can only contain letters, spaces, hyphens, and apostrophes" };
        }
        if (issue.path.includes("lastNameInitial")) {
          return { message: "Must be a single uppercase letter (A-Z)" };
        }
        if (issue.path.includes("name")) {
          return { message: "Team name can only contain letters, numbers, and spaces" };
        }
      }
      break;
  }
  return { message: ctx.defaultError };
};

// Set custom error map globally
z.setErrorMap(customErrorMap);

// Validation schemas with enhanced error handling
export const ValidationSchemas = {
  createTeam: CreateTeamSchema,
  createPlayer: CreatePlayerSchema,
  addPlayerToTeam: AddPlayerToTeamSchema,
  position: PositionSchema,
} as const;

// Form field validation helpers
export const validateTeamName = (name: string): string | null => {
  try {
    ValidationSchemas.createTeam.shape.name.parse(name);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid team name";
    }
    return "Invalid team name";
  }
};

export const validatePlayerName = (firstName: string, lastNameInitial: string): string | null => {
  try {
    ValidationSchemas.createPlayer.parse({ firstName, lastNameInitial });
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid player name";
    }
    return "Invalid player name";
  }
};

export const validateJerseyNumber = (number: number): string | null => {
  if (!Number.isInteger(number) || number < 1 || number > 99) {
    return "Jersey number must be between 1 and 99";
  }
  return null;
};

export const validatePosition = (position: string): string | null => {
  try {
    ValidationSchemas.position.parse(position);
    return null;
  } catch (error) {
    return "Invalid position selected";
  }
};

// Privacy compliance validation
export const validatePrivacyCompliance = (data: any): string[] => {
  const violations: string[] = [];

  // Check for full name patterns that might violate privacy
  if (data.firstName && data.firstName.includes(" ")) {
    const parts = data.firstName.split(" ");
    if (parts.length > 2) {
      violations.push("First name should not contain multiple names for privacy protection");
    }
  }

  // Check for last name initial compliance
  if (data.lastNameInitial && data.lastNameInitial.length > 1) {
    violations.push("Only last name initial allowed for privacy protection");
  }

  // Check for potentially identifying information
  const suspiciousPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
    /\b\d{3}-\d{3}-\d{4}\b/, // Phone pattern
    /\b[\w\.-]+@[\w\.-]+\.\w+\b/, // Email pattern
  ];

  const textToCheck = JSON.stringify(data).toLowerCase();
  suspiciousPatterns.forEach((pattern, index) => {
    if (pattern.test(textToCheck)) {
      const types = ["Social Security Number", "Phone Number", "Email Address"];
      violations.push(`Potentially identifying information detected: ${types[index]}`);
    }
  });

  return violations;
};

// Sanitize player data for privacy compliance
export const sanitizePlayerData = (data: any) => {
  return {
    ...data,
    firstName: data.firstName?.trim(),
    lastNameInitial: data.lastNameInitial?.toUpperCase()?.charAt(0),
  };
};

// Jersey number suggestion helper
export const suggestJerseyNumbers = (
  availableNumbers: number[],
  playerName: string,
  position?: string
): number[] => {
  // Sort available numbers
  const sorted = [...availableNumbers].sort((a, b) => a - b);
  
  // Suggest numbers based on position (baseball conventions)
  const positionSuggestions: Record<string, number[]> = {
    'P': [1, 11, 21, 31, 41], // Pitchers often wear these
    'C': [2, 12, 22, 32], // Catchers
    '1B': [3, 13, 23], // First basemen
    '2B': [4, 14, 24], // Second basemen  
    '3B': [5, 15, 25], // Third basemen
    'SS': [6, 16, 26], // Shortstops
    'LF': [7, 17, 27], // Left field
    'CF': [8, 18, 28], // Center field
    'RF': [9, 19, 29], // Right field
    'DH': [10, 20, 30], // Designated hitter
  };

  let suggestions: number[] = [];
  
  if (position && positionSuggestions[position]) {
    // Add position-based suggestions that are available
    suggestions = positionSuggestions[position].filter(num => availableNumbers.includes(num));
  }

  // Add some low numbers (popular choices)
  const popularNumbers = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 15, 17, 21, 23, 24, 42];
  suggestions.push(...popularNumbers.filter(num => 
    availableNumbers.includes(num) && !suggestions.includes(num)
  ));

  // Fill with remaining available numbers
  suggestions.push(...sorted.filter(num => !suggestions.includes(num)));

  return suggestions.slice(0, 10); // Return top 10 suggestions
};

// Export validation utilities
export {
  CreateTeamSchema,
  CreatePlayerSchema, 
  AddPlayerToTeamSchema,
  PositionSchema
};