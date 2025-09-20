# ⚾ PRD – Baseball Scorekeeping App (MVP + PWA)

## Goal

Build a modern, tablet-friendly web app for baseball scorekeeping that works offline-first (like a native scorebook app), syncs stats to the cloud when online, and supports multi-team and multi-player tracking.

## 1. Tech Stack

### Frontend
- **Framework**: React + TypeScript
- **UI**: TailwindCSS + Shadcn/ui (mobile-first design)
- **Routing**: TanStack Router

### Data Layer
- **Local Storage**: TanStack DB (offline-first, IndexedDB in browser)
- **State Management**: TanStack Query (state + mutations)
- **Cloud Database**: Convex (cloud DB + sync)

### Authentication
- **Auth Provider**: Clerk (user accounts, ready for scaling)

### Visualization
- **Charts**: Konva.js (drag/drop spray charts)
- **Future Enhancement**: Optional D3.js overlays later

### Hosting & Deployment
- **Platform**: Vercel (static hosting + CDN)

### Offline/PWA
- **Service Worker**: Workbox
- **Capabilities**:
  - Installable on iPad/Android home screen
  - Offline asset caching
  - Background sync for Convex when back online

## 2. Data Model

### User (Clerk ID)
- `id`, `email`

### Team
- `id`, `userId`, `name`, `season`

### Player
- `id`, `teamId`, `name`, `number`, `positions[]`

### Game
- `id`, `teamId`, `opponent`, `date`, `location`, `status` (in-progress, final)

### AtBat
- `id`, `gameId`, `playerId`, `inning`, `result` (out, single, double, etc.), `rbi`, `stolenBases`

### Pitch
- `id`, `atBatId`, `pitcherId`, `pitchType` (ball, strike, foul, in-play), `countBefore`, `countAfter`

### SprayChart
- `atBatId`, `x`, `y` (coordinates of ball-in-play)

## 3. Features

### ✅ MVP Features

#### Teams & Players
- Create/manage multiple teams and rosters
- Each player's stats tracked per team + across all teams

#### Games
- Create games with opponent, date, location
- Start/pause/end games

#### Scorekeeping
- Log every pitch (ball, strike, foul, in-play)
- Configurable pitch count rules (Little League, Travel Ball, etc)
- Outcomes: single, double, triple, HR, sac fly, stolen base, RBI
- Substitutions (pitchers, batters, fielders)

#### Spray Chart
- Drag/drop ball placement on field graphic
- Save x/y coordinates per hit

#### Stats
- Live batting average, OBP, SLG, etc.
- Pitch counts per pitcher
- Team and season stats
- Cross-team rollups for multi-team players

### 🔋 PWA Features (offline-first)

#### Installable App
- Add to home screen on iPad/Android

#### Offline Mode
- App loads fully offline (cached HTML, JS, CSS)
- TanStack DB persists data in IndexedDB

#### Auto-Sync
- When back online, sync changes to Convex backend
- Conflicts resolved via CRDTs (TanStack DB handles merges)

#### Background Sync
- If browser supports it, unsynced plays/pitches are sent automatically when network returns

## 4. User Flows

### First Visit (Online)
1. User signs up/login via Clerk
2. Service Worker installs → caches app
3. App is installable as PWA

### Offline Scoring
1. User opens app (from cache)
2. Creates games, logs plays, tracks stats
3. All data stored locally in TanStack DB

### Back Online
1. App syncs local DB → Convex backend
2. User's other devices (if logged in) receive synced data instantly

## 5. MVP Screens

### Authentication
- Login/Signup (Clerk)

### Main Navigation
- Dashboard – teams + upcoming/recent games
- Team Management – add/edit players

### Game Screen
- Pitch counter + at-bat logger
- Spray chart (drag/drop hit locations)
- Substitution manager
- Inning tracker

### Analytics
- Per-game stats
- Season stats
- Cross-team player averages

## 6. Performance & Data

### Data Size
- One game = ~200 pitches + 40 ABs ≈ 50–100KB max
- IndexedDB supports 50MB–1GB, so hundreds of games can be stored offline

### Sync Speed
- Delta-based sync → only changed rows sent
- One game sync = milliseconds

## ✅ Project Outcomes

With this PRD, you'll have:
- Offline-first scorekeeping
- Cloud sync + auth ready for future scaling
- Native app-like experience (PWA)

## Next Steps

Use SpecKit slash commands to develop this project:
1. `/constitution` - Establish coding principles and standards
2. `/specify` - Create detailed specifications based on this PRD
3. `/plan` - Create technical implementation plan
4. `/tasks` - Break down into actionable development tasks
5. `/implement` - Execute the development plan