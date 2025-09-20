# API Contracts: Team and Player Management

**Phase**: 1 - Design & Contracts  
**Date**: 2025-09-19  
**Status**: Complete

## Overview

This document defines the API contracts for team and player management functionality. All APIs follow REST principles with TypeScript interfaces for request/response validation.

## Authentication

All endpoints require Clerk authentication. The user ID is extracted from the Clerk session token.

```typescript
// Authentication Context
interface AuthContext {
  userId: string; // From Clerk session
  sessionId: string;
}
```

## Team Management APIs

### Create Team
**Endpoint**: `POST /api/teams`  
**Description**: Creates a new team for the authenticated user

```typescript
// Request
interface CreateTeamRequest {
  name: string; // 1-50 chars, alphanumeric + spaces
  season: string; // 1-20 chars
}

// Response
interface CreateTeamResponse {
  success: true;
  data: {
    id: string;
    userId: string;
    name: string;
    season: string;
    createdAt: string; // ISO date
    updatedAt: string; // ISO date
  };
}

// Error Response
interface CreateTeamError {
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'DUPLICATE_TEAM' | 'UNAUTHORIZED';
    message: string;
    details?: Record<string, string[]>; // Field validation errors
  };
}
```

**Validation Rules**:
- Team name must be unique per user+season combination
- Name: 1-50 characters, alphanumeric and spaces only
- Season: 1-20 characters

**Status Codes**:
- 201: Team created successfully
- 400: Validation error or duplicate team
- 401: Authentication required
- 500: Server error

### Get User Teams
**Endpoint**: `GET /api/teams`  
**Description**: Retrieves all teams owned by the authenticated user

```typescript
// Query Parameters
interface GetTeamsQuery {
  season?: string; // Filter by season
  limit?: number; // Default 50, max 100
  offset?: number; // Default 0
}

// Response
interface GetTeamsResponse {
  success: true;
  data: {
    teams: Array<{
      id: string;
      userId: string;
      name: string;
      season: string;
      playerCount: number; // Active players on roster
      createdAt: string;
      updatedAt: string;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}
```

**Status Codes**:
- 200: Teams retrieved successfully
- 401: Authentication required
- 500: Server error

### Get Team Details
**Endpoint**: `GET /api/teams/{teamId}`  
**Description**: Retrieves detailed information about a specific team

```typescript
// Response
interface GetTeamResponse {
  success: true;
  data: {
    id: string;
    userId: string;
    name: string;
    season: string;
    createdAt: string;
    updatedAt: string;
    roster: Array<{
      id: string; // PlayerTeamRoster ID
      player: {
        id: string;
        firstName: string;
        lastNameInitial: string;
        displayName: string; // "FirstName L." format
      };
      jerseyNumber: number;
      primaryPosition: Position;
      secondaryPositions: Position[];
      isActive: boolean;
      joinedAt: string;
      leftAt?: string;
    }>;
  };
}

// Error Response
interface GetTeamError {
  success: false;
  error: {
    code: 'TEAM_NOT_FOUND' | 'UNAUTHORIZED';
    message: string;
  };
}
```

**Status Codes**:
- 200: Team details retrieved successfully
- 404: Team not found or not owned by user
- 401: Authentication required
- 500: Server error

### Update Team
**Endpoint**: `PUT /api/teams/{teamId}`  
**Description**: Updates team information

```typescript
// Request
interface UpdateTeamRequest {
  name?: string;
  season?: string;
}

// Response
interface UpdateTeamResponse {
  success: true;
  data: {
    id: string;
    userId: string;
    name: string;
    season: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Status Codes**:
- 200: Team updated successfully
- 400: Validation error
- 404: Team not found or not owned by user
- 401: Authentication required
- 500: Server error

### Delete Team
**Endpoint**: `DELETE /api/teams/{teamId}`  
**Description**: Deletes a team and all associated roster entries

```typescript
// Response
interface DeleteTeamResponse {
  success: true;
  data: {
    message: string;
    deletedTeamId: string;
    deletedRosterEntries: number;
  };
}
```

**Status Codes**:
- 200: Team deleted successfully
- 404: Team not found or not owned by user
- 401: Authentication required
- 500: Server error

## Player Management APIs

### Create Player
**Endpoint**: `POST /api/players`  
**Description**: Creates a new player (global entity)

```typescript
// Request
interface CreatePlayerRequest {
  firstName: string; // 1-50 chars, letters, spaces, hyphens, apostrophes
  lastNameInitial: string; // Exactly 1 letter (A-Z)
}

// Response
interface CreatePlayerResponse {
  success: true;
  data: {
    id: string;
    firstName: string;
    lastNameInitial: string;
    displayName: string; // "FirstName L." format for UI
    createdAt: string;
    updatedAt: string;
  };
}

// Error Response
interface CreatePlayerError {
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'DUPLICATE_PLAYER';
    message: string;
    details?: Record<string, string[]>;
  };
}
```

**Status Codes**:
- 201: Player created successfully
- 400: Validation error or duplicate player name
- 401: Authentication required
- 500: Server error

### Search Players
**Endpoint**: `GET /api/players`  
**Description**: Search for existing players to add to team

```typescript
// Query Parameters
interface SearchPlayersQuery {
  firstName?: string; // Partial first name search
  lastNameInitial?: string; // Exact last name initial match
  limit?: number; // Default 20, max 50
  offset?: number; // Default 0
}

// Response
interface SearchPlayersResponse {
  success: true;
  data: {
    players: Array<{
      id: string;
      firstName: string;
      lastNameInitial: string;
      displayName: string; // "FirstName L." format
      currentTeams: Array<{
        teamId: string;
        teamName: string;
        season: string;
        jerseyNumber: number;
      }>;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}
```

**Status Codes**:
- 200: Players retrieved successfully
- 401: Authentication required
- 500: Server error

## Roster Management APIs

### Add Player to Team
**Endpoint**: `POST /api/teams/{teamId}/roster`  
**Description**: Adds a player to a team roster

```typescript
// Request
interface AddPlayerToTeamRequest {
  playerId: string;
  jerseyNumber: number; // 1-99
  primaryPosition: Position;
  secondaryPositions?: Position[];
}

// Response
interface AddPlayerToTeamResponse {
  success: true;
  data: {
    id: string; // PlayerTeamRoster ID
    playerId: string;
    teamId: string;
    player: {
      id: string;
      firstName: string;
      lastNameInitial: string;
      displayName: string; // "FirstName L." format
    };
    jerseyNumber: number;
    primaryPosition: Position;
    secondaryPositions: Position[];
    isActive: boolean;
    joinedAt: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Error Response
interface AddPlayerToTeamError {
  success: false;
  error: {
    code: 'VALIDATION_ERROR' | 'JERSEY_NUMBER_TAKEN' | 'PLAYER_ALREADY_ON_TEAM' | 'TEAM_NOT_FOUND' | 'PLAYER_NOT_FOUND' | 'UNAUTHORIZED';
    message: string;
    details?: Record<string, string[]>;
  };
}
```

**Validation Rules**:
- Jersey number must be unique within the team
- Player cannot be added to same team twice while active
- Primary position must be valid baseball position
- Secondary positions must be valid and different from primary
- **Privacy Note**: Player names are stored as firstName + lastNameInitial only

**Status Codes**:
- 201: Player added to team successfully
- 400: Validation error, jersey taken, or player already on team
- 404: Team or player not found
- 401: Authentication required
- 500: Server error

### Update Player Roster Entry
**Endpoint**: `PUT /api/teams/{teamId}/roster/{rosterId}`  
**Description**: Updates a player's roster information

```typescript
// Request
interface UpdateRosterEntryRequest {
  jerseyNumber?: number;
  primaryPosition?: Position;
  secondaryPositions?: Position[];
  isActive?: boolean;
}

// Response - Same as AddPlayerToTeamResponse
interface UpdateRosterEntryResponse {
  success: true;
  data: {
    id: string;
    playerId: string;
    teamId: string;
    player: {
      id: string;
      firstName: string;
      lastNameInitial: string;
      displayName: string; // "FirstName L." format
    };
    jerseyNumber: number;
    primaryPosition: Position;
    secondaryPositions: Position[];
    isActive: boolean;
    joinedAt: string;
    leftAt?: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Status Codes**:
- 200: Roster entry updated successfully
- 400: Validation error or jersey number conflict
- 404: Team, roster entry not found, or not owned by user
- 401: Authentication required
- 500: Server error

### Remove Player from Team
**Endpoint**: `DELETE /api/teams/{teamId}/roster/{rosterId}`  
**Description**: Removes a player from team (sets isActive = false)

```typescript
// Response
interface RemovePlayerFromTeamResponse {
  success: true;
  data: {
    message: string;
    rosterId: string;
    leftAt: string; // ISO date when player left team
  };
}
```

**Status Codes**:
- 200: Player removed from team successfully
- 404: Team, roster entry not found, or not owned by user
- 401: Authentication required
- 500: Server error

### Get Team Roster
**Endpoint**: `GET /api/teams/{teamId}/roster`  
**Description**: Retrieves all players on a team roster

```typescript
// Query Parameters
interface GetRosterQuery {
  activeOnly?: boolean; // Default true
  position?: Position; // Filter by position
}

// Response
interface GetRosterResponse {
  success: true;
  data: {
    teamId: string;
    teamName: string;
    season: string;
    roster: Array<{
      id: string; // PlayerTeamRoster ID
      player: {
        id: string;
        firstName: string;
        lastNameInitial: string;
        displayName: string; // "FirstName L." format
      };
      jerseyNumber: number;
      primaryPosition: Position;
      secondaryPositions: Position[];
      isActive: boolean;
      joinedAt: string;
      leftAt?: string;
    }>;
    summary: {
      totalPlayers: number;
      activePlayers: number;
      positionCounts: Record<Position, number>;
    };
  };
}
```

**Status Codes**:
- 200: Roster retrieved successfully
- 404: Team not found or not owned by user
- 401: Authentication required
- 500: Server error

## Shared Types

```typescript
// Position enum
type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';

// Common error structure
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
    requestId: string;
  };
}

// Success response wrapper
interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

## Error Handling

### Common Error Codes
- `VALIDATION_ERROR`: Request data validation failed
- `UNAUTHORIZED`: Authentication required or insufficient permissions
- `NOT_FOUND`: Requested resource not found
- `DUPLICATE_RESOURCE`: Resource already exists
- `JERSEY_NUMBER_TAKEN`: Jersey number already assigned to another player
- `PLAYER_ALREADY_ON_TEAM`: Player is already active on this team
- `SERVER_ERROR`: Internal server error

### Error Response Format
All errors follow a consistent structure with actionable error codes and messages suitable for UI display.

---

**Contracts Status**: ✅ Complete - Ready for quickstart guide  
**Next Step**: Generate quickstart development guide