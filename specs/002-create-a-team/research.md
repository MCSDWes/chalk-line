# Research: Team and Player Management System

**Phase**: 0 - Outline & Research  
**Date**: 2025-09-19  
**Status**: Complete

## Research Questions Addressed

### 1. TanStack DB Offline Strategy for Team/Player Data

**Decision**: Use TanStack DB with IndexedDB for local storage, automatic sync to Convex  
**Rationale**: 
- TanStack DB provides CRDT-based conflict resolution
- IndexedDB offers robust offline storage (50MB-1GB capacity)
- Automatic sync handles connectivity interruptions gracefully
- Type-safe integration with React and TypeScript

**Alternatives considered**:
- Local Storage: Too limited (5-10MB) for multi-team data
- Native SQLite: Not available in web browsers
- Manual IndexedDB: Too complex, no conflict resolution

### 2. Multi-Team Player Management Architecture

**Decision**: Junction table (PlayerTeamRoster) with team-specific attributes  
**Rationale**:
- Players can belong to multiple teams simultaneously
- Jersey numbers are unique per team, not globally
- Separate statistics per team-player combination
- Clean separation of player identity vs. team membership

**Alternatives considered**:
- Player duplication per team: Data inconsistency issues
- Single team per player: Doesn't match real-world usage
- Embedded team data in player: Complex queries and updates

### 3. Conflict Resolution for Offline Synchronization

**Decision**: Last-write-wins with user notification for conflicts  
**Rationale**:
- TanStack DB handles automatic CRDT merging
- User modifications timestamp for conflict detection
- Coaches typically manage own teams (low conflict probability)
- Clear UI feedback when conflicts occur

**Alternatives considered**:
- Manual conflict resolution: Too complex for coaches
- Field-level merging: Overkill for team management scenarios
- Server-always-wins: Loses offline work, violates offline-first principle

### 4. Player Privacy and Legal Compliance

**Decision**: Store only firstName + lastNameInitial format for player names  
**Rationale**:
- Protects minor privacy under youth sports regulations
- Reduces personally identifiable information (PII) exposure
- Complies with data protection laws (COPPA, GDPR)
- Sufficient identification for team roster management
- Reduces legal liability for youth organizations
- **Manual disambiguation**: Coaches manually differentiate duplicate names
- **Jersey number differentiation**: Different jersey numbers prevent on-field confusion

**Alternatives considered**:
- Full name storage: Privacy risk, legal compliance issues
- Anonymous ID only: Poor user experience, no meaningful identification
- Encrypted full names: Complex key management, still stores PII
- Automatic numeric suffixes: Reduces coach control over identification

### 5. Mobile UI Patterns for Team Management

**Decision**: Card-based layouts with touch-friendly controls (min 44px targets)  
**Rationale**:
- Easy navigation on tablets during games
- Clear visual hierarchy for teams and players
- Swipe gestures for common actions (edit, delete)
- Responsive breakpoints for landscape/portrait modes

**Alternatives considered**:
- Table-based layout: Poor mobile experience
- List-only interface: Less visual information density
- Desktop-first responsive: Violates mobile-first constitution

### 6. Jersey Number Uniqueness Constraints

**Decision**: Database constraint + client validation for uniqueness within team scope  
**Rationale**:
- Jersey numbers must be unique within each team (standard 1-99 range)
- Real-time validation prevents duplicate entry
- Clear error messaging for constraint violations
- Supports jersey number reuse across different teams
- **No retired numbers**: Keeps system simple for youth sports
- **Pickup player handling**: Different jersey numbers prevent field confusion

**Alternatives considered**:
- Global uniqueness: Doesn't match baseball rules
- No constraints: Would allow invalid team rosters
- Server-only validation: Poor offline user experience
- Retired number support: Unnecessary complexity for youth sports

### 7. Data Validation Strategy

**Decision**: Zod schemas for runtime validation + TypeScript types  
**Rationale**:
- Single source of truth for validation rules
- Client and server use same validation logic
- Excellent TypeScript integration
- Form validation with clear error messages

**Alternatives considered**:
- Joi validation: Less TypeScript-native
- Manual validation: Code duplication and inconsistency
- Yup: Less performant, dated API

### 8. State Management for Team/Player Data

**Decision**: TanStack Query for server state + React state for UI state  
**Rationale**:
- TanStack Query handles caching, sync, and offline scenarios
- Automatic background refresh when online
- Optimistic updates for responsive UI
- Built-in loading and error states

**Alternatives considered**:
- Redux: Overkill for this feature scope
- Zustand: Good but TanStack Query more specialized for data
- Context API only: No caching or sync capabilities

### 9. Data Import/Export and Season Management

**Decision**: CSV import/export with season rollover and game roster copying  
**Rationale**:
- **CSV format**: Universal compatibility with spreadsheets and league systems
- **Season rollover**: Copy teams to new seasons with preserved roster
- **Game roster copying**: Support multiple games per day (travel tournaments)
- **League-specific templates**: Support different league data formats
- **Data portability**: Enable migration between systems and compliance reporting

**Alternatives considered**:
- Excel-only format: Less universal, requires additional libraries
- JSON export: Not user-friendly for coaches
- Manual season recreation: Time-intensive for coaches
- Single-game focus: Doesn't match travel tournament workflows

### 10. Offline Performance and Sync Strategy

**Decision**: 2.5-hour offline capacity with clear online/offline indicators  
**Rationale**:
- **Extended offline duration**: Full game plus pre/post-game management
- **Prominent sync status**: Clear visual indicators for connectivity
- **Performance targets**: <100ms roster operations, optimized for tablets
- **Battery optimization**: Minimal background sync, efficient local storage
- **Conflict resolution UI**: Clear notifications with user-friendly resolution options

**Alternatives considered**:
- Shorter offline periods: Insufficient for full game management
- Hidden sync status: Poor user awareness of data state
- Background heavy sync: Battery drain during games
- Automatic conflict resolution: Loses user control over important data

## Technical Specifications

### Performance Targets
- Team list load: <200ms from cache
- Player addition: <100ms UI response (tablet-optimized)
- Roster operations: <100ms for optimal game-time performance
- Sync operation: <1s for typical team roster
- Offline capacity: 2.5+ hours of continuous operation
- Bundle impact: <150KB for team management features
- Battery optimization: Minimal drain during extended offline use

### Browser Compatibility
- Chrome 90+ (primary target for tablets)
- Safari 14+ (iOS tablets)
- Firefox 88+ (secondary support)
- Edge 90+ (Windows tablets)

### Data Storage Estimates
- Team record: ~200 bytes
- Player record: ~300 bytes
- PlayerTeamRoster record: ~150 bytes
- Typical team (25 players): ~8KB total
- Storage headroom: 50+ teams per user easily supported

## Integration Points

### External Dependencies
- **Clerk**: User authentication and session management
- **Convex**: Cloud database and real-time sync
- **TanStack DB**: Local database with conflict resolution
- **Shadcn/ui**: Pre-built accessible UI components

### Internal Dependencies
- User authentication flow (from Clerk integration)
- Navigation system (TanStack Router)
- Common UI components and styling (TailwindCSS)

## Risk Mitigation

### Privacy and Legal Compliance Risks
**Risk**: Storing full player names creates privacy liability for minors  
**Mitigation**: 
- Implement firstName + lastNameInitial format only
- Add clear privacy notices in player creation forms
- Document data minimization approach for legal compliance
- Regular audit of stored player data

**Risk**: Data breach exposing minor information  
**Mitigation**:
- Minimize PII storage (no full names, addresses, phone numbers)
- Encrypt data in transit (HTTPS) and at rest (Convex encryption)
- Implement proper access controls (team ownership validation)
- Regular security assessment of data handling practices

### Technical Implementation Risks

### Technical Implementation Risks
1. **Sync conflicts during offline use**: Mitigated by CRDT approach and user notifications
2. **Browser storage limits**: Monitored usage, cleanup old seasons if needed
3. **Performance with large rosters**: Virtualization for large lists, pagination for stats
4. **Complex multi-team scenarios**: Clear UI to show team context and player assignments

### Data Quality Risks
**Risk**: Duplicate players with similar name combinations  
**Mitigation**:
- Search existing players before creating new ones
- Clear disambiguation in UI ("John D." vs "John D." - show team context)
- Manual admin tools for data cleanup if needed

**Risk**: Invalid jersey number assignments  
**Mitigation**:
- Real-time validation during jersey selection
- Database constraints to prevent duplicate assignments
- Clear error messaging with suggested alternatives

### Monitoring Points
- Local storage usage trends
- Sync conflict frequency
- UI response times on target devices
- User error rates during team/player creation
- Privacy compliance metrics (PII storage audit)

---

**Research Status**: ✅ Complete - All technical decisions finalized  
**Next Phase**: Phase 1 - Design & Contracts