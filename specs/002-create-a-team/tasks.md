# Tasks: Team and Player Management System

**Input**: Design documents from `/specs/002-create-a-team/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: React/TypeScript, TanStack ecosystem, Convex, Clerk
   → Structure: Single project with src/, convex/ folders
2. Load design documents:
   → data-model.md: User, Team, Player, PlayerTeamRoster entities
   → contracts/api-contracts.md: Team, Player, Roster management APIs
   → research.md: Privacy compliance, offline sync, performance decisions
   → quickstart.md: Implementation patterns and components
3. Generate tasks by category:
   → Setup: Convex schema, auth, dependencies
   → Tests: API contract tests, integration tests (TDD)
   → Core: Database functions, React components, forms
   → Integration: Offline sync, validation, error handling
   → Polish: Privacy compliance, performance, import/export
4. Apply task rules:
   → Different files = mark [P] for parallel execution
   → TDD: All tests before implementation
   → Privacy: Validate firstName + lastNameInitial format
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph for offline-first architecture
7. Validate completeness: All contracts tested, entities modeled, privacy compliant
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths for clarity
- Privacy compliance validation in all player-related tasks

## Path Conventions
- **Convex functions**: `convex/` directory
- **React components**: `src/components/` directory  
- **Types/schemas**: `src/types/` directory
- **Tests**: `src/tests/` directory

## Phase 3.1: Setup & Schema
- [ ] T001 Create Convex database schema in convex/schema.ts with privacy-compliant player fields
- [ ] T002 [P] Initialize TypeScript types in src/types/team.ts with firstName/lastNameInitial validation
- [ ] T003 [P] Configure Zod validation schemas with privacy compliance rules
- [ ] T004 Deploy Convex schema and verify player privacy field structure

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Contract test POST /api/teams in src/tests/contracts/teams.test.ts
- [ ] T006 [P] Contract test GET /api/teams in src/tests/contracts/teams.test.ts
- [ ] T007 [P] Contract test POST /api/players in src/tests/contracts/players.test.ts with privacy validation
- [ ] T008 [P] Contract test GET /api/players search in src/tests/contracts/players.test.ts
- [ ] T009 [P] Contract test POST /api/teams/{teamId}/roster in src/tests/contracts/roster.test.ts
- [ ] T010 [P] Contract test jersey number uniqueness in src/tests/contracts/roster.test.ts
- [ ] T011 [P] Integration test team creation flow in src/tests/integration/team-management.test.ts
- [ ] T012 [P] Integration test player privacy compliance in src/tests/integration/player-privacy.test.ts
- [ ] T013 [P] Integration test offline sync for 2.5+ hours in src/tests/integration/offline-sync.test.ts

## Phase 3.3: Database Layer (ONLY after tests are failing)
- [ ] T014 [P] Team management functions in convex/teams.ts with user ownership validation
- [ ] T015 [P] Player management functions in convex/players.ts with privacy-compliant search
- [ ] T016 [P] Roster management functions in convex/roster.ts with jersey number constraints
- [ ] T017 User authentication integration with Clerk in convex/auth.ts
- [ ] T018 Database indexes for performance optimization per research.md targets

## Phase 3.4: React Components & Forms
- [ ] T019 [P] TeamList component in src/components/teams/TeamList.tsx with responsive design
- [ ] T020 [P] CreateTeamForm component in src/components/teams/CreateTeamForm.tsx
- [ ] T021 [P] CreatePlayerForm component in src/components/players/CreatePlayerForm.tsx with privacy messaging
- [ ] T022 [P] PlayerSearch component in src/components/players/PlayerSearch.tsx with firstName/initial search
- [ ] T023 [P] RosterManagement component in src/components/roster/RosterManagement.tsx
- [ ] T024 Jersey number selection with real-time validation in src/components/roster/JerseySelector.tsx
- [ ] T025 Team details view with roster display in src/components/teams/TeamDetails.tsx

## Phase 3.5: Offline & Sync Integration
- [ ] T026 TanStack Query setup for offline caching in src/lib/queryClient.ts
- [ ] T027 [P] Offline storage configuration for 2.5+ hour capacity in src/lib/offline.ts
- [ ] T028 [P] Sync status indicators in src/components/ui/SyncStatus.tsx
- [ ] T029 Conflict resolution UI for player data in src/components/ui/ConflictResolver.tsx
- [ ] T030 Network state monitoring and user notifications in src/hooks/useNetworkStatus.ts

## Phase 3.6: Validation & Error Handling
- [ ] T031 [P] Form validation with Zod schemas in src/lib/validation.ts
- [ ] T032 [P] Privacy compliance validation for player names in src/utils/privacy.ts
- [ ] T033 [P] Jersey number constraint validation in src/utils/roster.ts
- [ ] T034 Error boundary components in src/components/ui/ErrorBoundary.tsx
- [ ] T035 Toast notifications for user feedback in src/components/ui/Toast.tsx

## Phase 3.7: Data Management Features
- [ ] T036 [P] CSV export functionality in src/utils/export.ts with league-specific formats
- [ ] T037 [P] CSV import functionality in src/utils/import.ts with data validation
- [ ] T038 [P] Season rollover feature in src/features/seasons/SeasonRollover.tsx
- [ ] T039 [P] Game roster copying for tournaments in src/features/games/RosterCopy.tsx
- [ ] T040 Data migration utilities in src/utils/migration.ts

## Phase 3.8: Performance & Polish
- [ ] T041 [P] Performance optimization for <100ms roster operations per research.md
- [ ] T042 [P] Battery optimization for tablet usage in src/utils/performance.ts
- [ ] T043 [P] Responsive design validation for tablet landscape/portrait modes
- [ ] T044 [P] Manual testing checklist execution from quickstart.md
- [ ] T045 [P] Privacy compliance audit and documentation in docs/privacy-compliance.md
- [ ] T046 Code cleanup and remove duplication across components
- [ ] T047 Bundle size optimization (<150KB target per research.md)

## Dependencies
```
Setup (T001-T004) → Tests (T005-T013) → Database (T014-T018) → Components (T019-T025)
                                     → Offline (T026-T030) → Validation (T031-T035)
                                     → Data Features (T036-T040) → Polish (T041-T047)

Critical Path:
T001 (Schema) blocks T005-T013 (Tests)
T005-T013 (Tests) block T014-T018 (Database)  
T014-T016 (Database) block T019-T025 (Components)
T017 (Auth) blocks T019-T025 (Components)
T026-T028 (Offline) required for T041 (Performance)
```

## Parallel Execution Examples
```bash
# Phase 3.2 - All contract tests (must fail initially):
Task T005: "Contract test POST /api/teams"
Task T006: "Contract test GET /api/teams" 
Task T007: "Contract test POST /api/players with privacy validation"
Task T008: "Contract test GET /api/players search"

# Phase 3.3 - Database functions (after tests written):
Task T014: "Team management functions in convex/teams.ts"
Task T015: "Player management functions in convex/players.ts"  
Task T016: "Roster management functions in convex/roster.ts"

# Phase 3.4 - React components (after database layer):
Task T019: "TeamList component in src/components/teams/TeamList.tsx"
Task T020: "CreateTeamForm component in src/components/teams/CreateTeamForm.tsx"
Task T021: "CreatePlayerForm with privacy messaging"
```

## Privacy Compliance Checkpoints
- [ ] **T007, T012**: Validate firstName + lastNameInitial format in all player tests
- [ ] **T015, T021**: Ensure player creation UI shows privacy protection messaging
- [ ] **T032**: Comprehensive privacy validation prevents full name storage
- [ ] **T045**: Final privacy audit confirms legal compliance for youth sports

## Performance Validation Points
- [ ] **T018**: Database queries optimized for <100ms roster operations
- [ ] **T027**: Offline storage tested for 2.5+ hour game duration  
- [ ] **T041**: UI response times validated on target tablet devices
- [ ] **T047**: Bundle size within <150KB target for mobile performance

## Notes
- **[P] tasks**: Different files, can run in parallel
- **TDD Critical**: All tests (T005-T013) must be written and failing before implementation
- **Privacy First**: Every player-related task includes privacy compliance validation
- **Offline Ready**: Components designed for extended offline use during games
- **Mobile Optimized**: Touch-friendly design for tablet use during baseball games

---

**Status**: Ready for implementation  
**Next**: Execute Phase 3.1 setup tasks, then proceed with TDD approach