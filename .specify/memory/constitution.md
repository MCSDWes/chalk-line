<!--
Sync Impact Report:
- Version change: 1.1.0 → 1.2.0 (tech stack refinement)
- List of modified principles: 
  * V. Progressive Web App Compliance → V. Web-First Accessibility (removed installation requirement)
  * Technology Standards section updated (added Vite, clarified TanStack Router standalone)
- Added sections: None
- Removed sections: None
- Templates requiring updates:
  ✅ .specify/templates/plan-template.md (constitution check aligned)
  ✅ .specify/templates/spec-template.md (requirements alignment verified)
  ✅ .specify/templates/tasks-template.md (task categorization verified)
- Follow-up TODOs: None
-->

# Baseball Scorekeeping App Constitution

## Core Principles

### I. Offline-First Architecture (NON-NEGOTIABLE)
The application MUST function completely offline. All core scorekeeping functionality (logging pitches, tracking at-bats, recording stats) MUST work without internet connectivity. Local data storage using TanStack DB with IndexedDB is mandatory. No feature can require real-time server communication to function.

Rationale: Baseball games occur in various locations with unreliable internet. Users must be able to keep score regardless of connectivity status.

### II. Mobile-First Design
All interfaces MUST be optimized for tablet and mobile devices first, with desktop as secondary consideration. Touch-friendly controls, appropriate sizing for finger interaction, and landscape/portrait orientation support are required. UI components must follow mobile-first responsive design principles using TailwindCSS.

Rationale: Primary use case is scorekeeping on tablets and mobile devices during games.

### III. Data Integrity & Synchronization
Local data MUST be the source of truth until successfully synchronized. Conflict resolution via CRDTs is mandatory when merging offline changes. Data loss is unacceptable - failed syncs must be retried and users warned of pending synchronization. All data mutations must be atomic and reversible.

Rationale: Baseball statistics are critical data that cannot be lost or corrupted during sync operations.

### IV. Performance Standards
Initial app load MUST complete in under 3 seconds on cached assets. Game data entry (pitch logging, at-bat recording) MUST respond within 100ms. Database queries for stats calculation MUST complete within 500ms. Bundle size MUST remain under 2MB for optimal PWA performance.

Rationale: Real-time game situations require immediate response times for effective scorekeeping.

### V. Web-First Accessibility
The application MUST be accessible via web browsers on tablets and mobile devices without requiring installation. Service worker implementation with Workbox is mandatory for offline asset caching and improved performance. Background sync capabilities MUST handle data synchronization when connectivity returns. App must be optimized for mobile web browsers.

Rationale: Users prefer accessing the app through their existing browser rather than installing additional applications.

## Technology Standards

### Required Tech Stack
- Frontend: React + TypeScript (strict type checking enabled)
- Build Tool: Vite (for fast development and optimized builds)
- Routing: TanStack Router (standalone, not TanStack Start)
- State Management: TanStack Query + TanStack DB
- UI Framework: TailwindCSS + Shadcn/ui components
- Authentication: Clerk
- Cloud Backend: Convex
- Hosting: Vercel
- Offline Caching: Workbox service worker (manual implementation)

### Code Quality Requirements
- TypeScript strict mode must be enabled
- ESLint and Prettier configuration mandatory
- Unit test coverage minimum 80% for core business logic
- Integration tests required for data synchronization flows
- Component testing with React Testing Library for all UI components

## Development Workflow

### Testing Strategy
Test-Driven Development (TDD) for all business logic components. Tests must be written before implementation for data models, statistics calculations, and synchronization logic. UI components require snapshot testing and interaction testing. End-to-end testing for critical user flows using Playwright.

### Feature Development Process
1. All features must start with clear specifications
2. Offline functionality must be implemented and tested first
3. Online synchronization added as enhancement
4. Performance testing required before feature completion
5. PWA compliance verification for user-facing features

## Governance

This constitution supersedes all other development practices and guidelines. All pull requests must verify compliance with these principles. Any deviation requires explicit justification and approval from project maintainers.

Amendments to this constitution require semantic versioning:
- MAJOR: Changes affecting offline-first architecture or core data integrity principles
- MINOR: Addition of new principles or substantial expansion of existing ones
- PATCH: Clarifications, wording improvements, or non-semantic refinements

Development decisions must prioritize user experience during live game scenarios over developer convenience. When in doubt, optimize for the baseball coach using the app during a game.

**Version**: 1.2.0 | **Ratified**: 2025-09-19 | **Last Amended**: 2025-09-19