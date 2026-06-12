*This project has been created as part of the 42 curriculum by `eebert, jgotz, cgerling, kmuhlbau, tpaesch`.*

---

# Transcendence — Multiplayer Tetris

A competitive, real-time multiplayer Tetris platform built as the final Common Core project at 42 Heilbronn. Players compete head-to-head in live matches, send garbage to opponents, climb a global leaderboard, build friendships, and unlock achievements. The application is a full-stack web app running entirely in Docker.

**Key features at a glance:**
- Real-time multiplayer Tetris with client-side prediction and server reconciliation
- Complete social system: friends, direct messages, match invites, user blocking, online presence
- Achievements, leaderboard, XP leveling, and per-user match history
- GitHub OAuth and TOTP-based Two-Factor Authentication
- Public REST API with API-key auth and rate limiting
- Prometheus + Grafana monitoring stack
- Privacy Policy and Terms of Service pages

---

## Table of Contents

1. [Team Information](#i-team-information)
2. [Project Management](#ii-project-management)
3. [Instructions](#iii-instructions)
4. [Technical Stack](#iv-technical-stack)
5. [Database Schema](#v-database-schema)
6. [Features List](#vi-features-list)
7. [Modules](#vii-modules)
8. [Individual Contributions](#viii-individual-contributions)
9. [Resources](#ix-resources)

---

## I. Team Information

| Login | Role(s) | Responsibilities |
|---|---|---|
| `eebert` | **Product Owner** · Developer | Defines product vision and priorities. Validates completed work. Led backend infrastructure, auth, friends/chat system, public API, and monitoring setup. |
| `tpaesch` | **Project Manager / Scrum Master** · Developer | Organized meetings, tracked progress, managed blockers. Led profile system, achievements/gamification, and UI/UX improvements. |
| `jgotz` | **Technical Lead / Architect** · Developer | Defined the technical architecture and stack. Enforced code quality and reviewed critical changes. Led the Tetris game engine and multiplayer game logic. |
| `cgerling` | Developer | Implemented core Tetris mechanics refinements (piece rotations, T-spin detection, gravity, game feel). |
| `kmuhlbau` | Developer | Co-implemented Prometheus + Grafana monitoring. |

---

## II. Project Management

**Workflow:** The team held regular in-person working sessions at 42 Heilbronn. Working side-by-side accelerated debugging, architecture decisions, and pair programming, especially for the complex real-time game logic.

**Scheduling and async communication:** WhatsApp was used to coordinate meeting times and share quick updates between sessions.

**Task tracking:** GitHub Issues and Pull Requests were used throughout the project. Features were developed on dedicated branches and merged via PRs, ensuring at least one peer review on significant changes.

**Work distribution:** Features were broken into GitHub Issues and assigned to team members based on their expertise. The Tech Lead held veto over architecture decisions. The PO prioritized the backlog and validated features before merging.

---

## III. Instructions

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed
- Ports `80` and `443` available on your machine

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd transcendence
   ```

2. **Configure environment variables:**
   ```bash
   make setup
   ```
   This copies `.env.example` files to the correct locations (`frontend/.env` and `backend/.env`) and configures the database host for Docker. Review the generated files and fill in any required values (e.g., GitHub OAuth credentials).

3. **Start the application:**
   ```bash
   make up
   ```
   This builds and starts all containers (frontend, backend, PostgreSQL, Nginx, Prometheus, Grafana).

4. **Access the app:**
   - Application: **`https://localhost`** (HTTPS, self-signed cert — accept the browser warning)
   - Grafana dashboard: **`http://localhost:3000`**

5. **Stop the application:**
   ```bash
   make down
   ```

6. **Full reset** (wipes database and volumes):
   ```bash
   make reset
   ```

### Notes

- The game screen (solo mode and multiplayer rooms) requires a desktop browser and a minimum viewport of 800×600 px. The rest of the application is fully responsive.
- A default profile picture is assigned automatically if no avatar is uploaded.

---

## IV. Technical Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React** | UI framework (component model, hooks, concurrent rendering) |
| **TanStack Router** | File-based, type-safe client-side routing |
| **TanStack Query** | Server state management, caching, and background refetching |
| **TanStack Store** | Lightweight client state (notifications, overlay visibility) |
| **Tailwind CSS** | Utility-first styling, responsive design |
| **Radix UI** | Accessible headless component primitives |
| **Socket.IO client** | Real-time WebSocket communication |
| **Vite** | Build tool and dev server |

### Backend

| Technology | Purpose |
|---|---|
| **NestJS** | Backend framework (modules, dependency injection, guards, gateways) |
| **Socket.IO** | WebSocket gateway for real-time game and social events |
| **Passport.js** | Auth middleware (JWT strategy, GitHub OAuth strategy) |
| **Speakeasy** | TOTP generation and verification for 2FA |
| **TypeORM** | ORM for database access and migrations |
| **class-validator** | DTO validation at API boundaries |

### Database

**PostgreSQL** was chosen for its strong support for relational data, ACID guarantees (critical for match results and friend relationships), and excellent TypeORM integration. The schema makes heavy use of UUID primary keys for security and distributed compatibility.

### Infrastructure

| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Single-command containerized deployment |
| **Nginx** | Reverse proxy, TLS termination, static asset serving |
| **Prometheus** | Metrics scraping from backend |
| **Grafana** | Visualization dashboards and alerting |

### Shared Package

A `shared/` TypeScript package contains the `TetrisGame` class used verbatim by both the backend (authoritative game server) and the frontend (client-side prediction engine). This guarantees the client and server run identical game logic, which is the foundation of the prediction/reconciliation system.

### Architecture decisions

- **Client-side prediction with server reconciliation:** The game server is authoritative, but the local player's inputs are applied immediately on the client for zero-latency feel. On every server tick the client reconciles by snapping to server state and replaying unacknowledged inputs. See [`docs/client-side-prediction.md`](docs/client-side-prediction.md) for a full technical write-up.
- **Monorepo with a shared package:** Sharing game logic avoids the classic "server says one thing, client renders another" class of bugs.
- **NestJS + Socket.IO gateway:** NestJS's module system made it straightforward to co-locate the WebSocket gateway with the HTTP controllers, sharing guards, services, and dependency injection.

---

## V. Database Schema

### Tables

#### `users`
Core user record. Stores credentials, profile data, game preferences, and aggregate lifetime stats.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `email` | text UNIQUE | |
| `username` | text UNIQUE | normalized to lowercase |
| `password` | text nullable | null for OAuth users |
| `userType` | enum (`email`, `github`) | |
| `githubId` | text UNIQUE nullable | |
| `githubAvatarUrl` | text nullable | |
| `profilePictureId` | text UNIQUE nullable | filename in storage |
| `theme` | enum (`light`, `dark`) | |
| `gameControls` | jsonb | keybind map |
| `tetrisHandlingSettings` | jsonb | ARR / DAS / SDF / DCD |
| `twoFaEnabled` | boolean | |
| `twoFaSecret` | text nullable | encrypted TOTP secret |
| `level` | int | derived from total lines |
| `playTimeInSeconds` | int | |
| `piecesPlaced` | int | |
| `totalLinesCleared` | int | |
| `matchesPlayed` | int | |
| `matchesWon` | int | |
| `matchesLost` | int | |
| `createdAt` | timestamp | |

#### `match_results`
One row per player per match. Rows sharing the same `matchId` belong to the same game.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `matchId` | UUID | groups all players in one game |
| `roomId` | text | |
| `userId` | UUID FK → users | |
| `placement` | int nullable | 1 = winner |
| `score` | int | |
| `lines` | int | |
| `state` | jsonb | full final board state snapshot |
| `createdAt` | timestamp | |

Unique index on `(matchId, userId)`.

#### `friendships`
Bidirectional friendship. Canonical ordering (`userLowId < userHighId`) prevents duplicate rows.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `userLowId` | UUID FK → users | |
| `userHighId` | UUID FK → users | |
| `createdAt` | timestamp | |

Unique index on `(userLowId, userHighId)`.

#### `friend_requests`
Tracks pending, accepted, and denied friendship requests.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `fromUserId` | UUID FK → users | |
| `toUserId` | UUID FK → users | |
| `status` | enum (`pending`, `accepted`, `denied`) | |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

Unique index on `(fromUserId, toUserId)`.

#### `user_blocks`
Records which users have blocked which other users.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `blockerId` | UUID FK → users | |
| `blockedId` | UUID FK → users | |
| `createdAt` | timestamp | |

Unique index on `(blockerId, blockedId)`.

#### `direct_messages`
Persistent DM history between two users.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `senderId` | UUID FK → users | |
| `recipientId` | UUID FK → users | |
| `content` | text | |
| `type` | enum (`text`, `match_invite`) | |
| `roomId` | text nullable | set for match_invite type |
| `seen` | boolean | read receipt flag |
| `createdAt` | timestamp | |

Indexed on `(senderId, recipientId, createdAt)` and `(recipientId, seen)`.

#### `user_presence`
Tracks real-time online/offline/away status per user.

| Column | Type | Notes |
|---|---|---|
| `userId` | UUID PK FK → users | |
| `status` | enum (`online`, `offline`, `away`) | |
| `lastSeenAt` | timestamp nullable | |
| `updatedAt` | timestamp | |

#### `api_keys`
Public API keys for third-party access.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `userId` | UUID | owner |
| `name` | text | user-defined label |
| `keyHash` | text UNIQUE | bcrypt hash of the raw key |
| `keyPreview` | varchar(16) | last 4 chars shown in UI |
| `rateLimitPerMinute` | int | default 60 |
| `lastUsedAt` | timestamp nullable | |
| `revokedAt` | timestamp nullable | |
| `createdAt` | timestamp | |

#### `users_2fa`
Short-lived 2FA sessions issued during login when 2FA is enabled.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | session token |
| `userId` | UUID FK → users | |
| `secret` | varchar | encrypted TOTP secret copy |
| `failedAttempts` | int | lockout protection |
| `lastAttemptAt` | timestamp nullable | |
| `createdAt` | timestamp | |
| `expiredAt` | timestamp | |

### Relationships

```
users ─────────────────────────── match_results  (1 : N)
users ─────────────────────────── users_2fa       (1 : N)
users ──── friendships ─────────── users          (N : M via join table)
users ──── friend_requests ─────── users          (N : M via join table)
users ──── user_blocks ─────────── users          (N : M via join table)
users ──── direct_messages ─────── users          (N : M)
users ─────────────────────────── user_presence   (1 : 1)
users ─────────────────────────── api_keys        (1 : N)
```

---

## VI. Features List

### Authentication & Security

| Feature | Description | Authors |
|---|---|---|
| Email/password registration & login | Hashed (bcrypt) passwords, JWT sessions | Emil |
| GitHub OAuth 2.0 | One-click sign-in via GitHub | Emil |
| Two-Factor Authentication (TOTP) | App-based 2FA (Google Authenticator, Authy, etc.) with session-scoped challenge | Emil |
| HTTPS everywhere | Nginx TLS termination with self-signed certificate in dev | Emil |
| Input validation | DTO validation on all API boundaries via class-validator | Emil |

### User Profiles

| Feature | Description | Authors |
|---|---|---|
| Profile page | Displays avatar, username, level, rank, points, match history stats, and shared-play charts when viewing a friend | Emil (initial), Theo (features) |
| Avatar upload | Custom profile picture upload with server-side storage | Emil |
| Username / theme update | Edit display name and light/dark theme | Emil |
| Keybind customization | Fully remappable game controls and DAS/ARR/SDF handling settings | Emil, Jonas |
| Online presence | Real-time online/away/offline indicator visible to friends | Emil |
| Leaderboard | Global ranking by total score; #1 player gets a crown badge | Theo |

### Social System

| Feature | Description | Authors |
|---|---|---|
| Friend requests | Send, accept, and deny friend requests; incoming request badge | Emil, Theo |
| Friends list | View all friends with online status and unread DM count | Emil |
| Direct messages | Persistent 1:1 chat with infinite scroll, read receipts, and unread indicators | Emil, Jonas |
| Match invites | Invite a friend to a match directly from DM or their profile | Emil, Jonas |
| Block / Unblock | Block users to prevent messages and friend requests; unblock from friends sidebar or profile | Emil, Theo |
| Profile dialog | Click any username anywhere in the app to open a profile popup with stats and social actions | Emil (initial), Theo (features) |

### Tetris Game Engine

| Feature | Description | Authors |
|---|---|---|
| Full Tetris ruleset | SRS+ rotation system (including 180° rotation), wall kicks, lock delay, hold piece, ghost piece | Jonas (initial), Charlotte (refinements) |
| T-Spin detection | Correct 3-corner T-spin detection with double/triple line bonuses | Charlotte |
| Back-to-back and combos | B2B and combo multipliers with visual display | Jonas |
| Garbage system | Line attacks sent to opponents; configurable targeting | Jonas |
| Solo mode | Single-player practice with fully configurable gravity, lock delay, queue size, and blowback | Jonas, Charlotte |

### Multiplayer

| Feature | Description | Authors |
|---|---|---|
| Room system | Create named rooms (case-insensitive), set visibility, configure game settings | Emil (rooms), Jonas (game loop) |
| Real-time multiplayer | Up to N players per room; live board updates for all participants via WebSocket | Emil, Jonas |
| Client-side prediction | Local inputs applied instantly; server reconciliation on every tick for lag-free feel | Jonas |
| Synchronized piece queue | All players in a room share the same random piece sequence | Jonas |
| Disconnection handling | Player is removed from the game on disconnect; remaining players continue | Jonas |
| Friends in lobby | Friend profile pictures show a heart badge in the player list | Theo |

### Achievements & Gamification

| Feature | Description | Authors |
|---|---|---|
| Achievements system | 25+ achievements across match, score, lines, wins, social, ranking, domination, and collection categories | Theo |
| Achievement popups | Animated popup notifications when achievements unlock, suppressed during active games | Theo |
| XP / Level system | Level advances every 10 lines cleared; displayed on profile and leaderboard | Jonas, Theo |
| Achievements page | Scrollable page showing all achievements, progress, and unlock status | Theo |

### Public API

| Feature | Description | Authors |
|---|---|---|
| API key management | Create, rename, and revoke API keys from the settings page | Emil |
| Rate limiting | Per-key configurable rate limit (default: 60 req/min) | Emil |
| Public endpoints | `GET /public-api/v1/profile`, `/stats`, `/matches`, `/leaderboard`, `/activity`, `/friends`, `/achievements` | Emil |

### DevOps & Infrastructure

| Feature | Description | Authors |
|---|---|---|
| Docker Compose deployment | Single `make up` starts all services | Emil |
| Prometheus metrics | Backend exposes a `/metrics` endpoint scraped by Prometheus | Konrad, Emil |
| Grafana dashboards | Pre-configured dashboards for request rates, latency, and system health | Konrad, Emil |
| Privacy Policy & Terms of Service | Accessible from the app footer; contain project-relevant content | Emil |

---

## VII. Modules

**Total points claimed: 23** (14 required; remaining 9 are bonus, capped at +5 during evaluation)

### Web — 9 pts

| Module | Type | Points | Implementation | Authors |
|---|---|---|---|---|
| Frontend + Backend frameworks | Major | 2 | React (frontend) and NestJS (backend) | Jonas, Emil |
| Real-time features via WebSockets | Major | 2 | Socket.IO gateway; game state, social events, and presence are all pushed via WebSocket | Emil, Jonas |
| User interactions (chat, profiles, friends) | Major | 2 | Persistent DM system, friend requests, profile dialogs, online presence, blocking | Emil, Theo, Jonas |
| Public API (≥5 endpoints, API key, rate limiting) | Major | 2 | 7 read endpoints under `/public-api/v1/*` + full CRUD for API keys (`GET/POST/PATCH/DELETE /api-keys`); each key is hashed, rate-limited, and revokable | Emil |
| ORM | Minor | 1 | TypeORM with PostgreSQL; all models declared as entities with explicit relations | Emil |

### User Management — 5 pts

| Module | Type | Points | Implementation | Authors |
|---|---|---|---|---|
| Standard user management & authentication | Major | 2 | Profile editing, avatar upload, friend system with online status, per-user profile pages | Emil, Theo |
| Game statistics & match history | Minor | 1 | Tracks wins, losses, lines, score, placement per match; displays history and leaderboard | Jonas, Theo |
| OAuth 2.0 | Minor | 1 | GitHub OAuth via Passport.js; links GitHub identity to local account | Emil |
| Two-Factor Authentication | Minor | 1 | TOTP-based 2FA (Speakeasy); challenge issued at login, verified before JWT is issued | Emil |

### Gaming and User Experience — 7 pts

| Module | Type | Points | Implementation | Authors |
|---|---|---|---|---|
| Web-based game | Major | 2 | Full Tetris implementation in the browser: SRS+ rotations, T-spins, hold, ghost piece, combos, B2B | Jonas, Charlotte |
| Remote players | Major | 2 | Two or more players on separate computers play in real-time; client-side prediction eliminates perceived latency | Jonas, Emil |
| Advanced chat features | Minor | 1 | Block users from messaging, match invites from DM, profile access from chat, persistent history, read receipts, typing indicators | Emil, Theo, Jonas |
| Game customization options | Minor | 1 | Configurable gravity, lock delay, queue size, blowback percentage per room or solo session | Jonas, Charlotte |
| Gamification system | Minor | 1 | Achievements (25+), XP/level system, leaderboard, animated unlock notifications with deduplication | Theo |

### DevOps — 2 pts

| Module | Type | Points | Implementation | Authors |
|---|---|---|---|---|
| Monitoring with Prometheus and Grafana | Major | 2 | Prometheus scrapes the NestJS `/metrics` endpoint; Grafana dashboards show request rates, response latency, and system health | Konrad, Emil |

---

## VIII. Individual Contributions

### Emil (`eebert`) — Product Owner & Developer

Emil was the backbone of the backend and owned the majority of the infrastructure. He built the entire authentication system (email/password, GitHub OAuth, 2FA), the friends and social system (friend requests, blocking, online presence, DM history), the Public API with API-key management and rate limiting, and the Prometheus metrics endpoint. He also led the Docker Compose setup and the Nginx reverse proxy configuration. On the frontend side Emil drove the overall architecture, the real-time Socket.IO integration, and the friends overlay/chat UI. He co-built the multiplayer room system (room creation, joinability) and set up the Grafana monitoring together with Konrad.

### Theo (`tpaesch`) — Project Manager & Developer

Theo owned project coordination: organized meetings, maintained the GitHub issue board, and kept the team unblocked. On the product side he built and iterated the profile system (public profile dialogs, shared-match charts, friendship visualizations, the #1 crown on the leaderboard), the entire achievements and gamification system (25+ achievements across multiple categories, animated popup notifications, deduplication via localStorage, achievement baseline seeding), and numerous UX improvements (mobile-responsive friends overlay and DM panel, unblock flow, heart badge for friends in the lobby, "Accept Friend Request" fix for mutual-request edge case).

### Jonas (`jgotz`) — Technical Lead & Developer

Jonas defined the project's technical architecture and was the primary author of the Tetris game engine in the shared package (`TetrisGame`). He implemented the SRS+ rotation system, the multiplayer game server loop, the client-side prediction and server reconciliation system (the project's most technically complex feature), the synchronized piece queue, the garbage attack system, and the B2B/combo mechanics. He also co-built the multiplayer room game frontend and the match invite flow from DMs. Jonas enforced code quality across the codebase and reviewed all critical pull requests.

### Charlotte (`cgerling`) — Developer

Charlotte refined the core Tetris game feel. She corrected piece rotation states for the S and Z tetrominoes, fixed the 180° rotation edge cases, implemented the T-spin detection algorithm (3-corner check with proper Mini T-spin distinction), and tuned gravity and lock delay behavior to match competitive Tetris standards. She also worked on solo mode settings and game configuration UI.

### Konrad (`kmuhlbau`) — Developer

Konrad co-implemented the DevOps monitoring module. Together with Emil he configured Prometheus exporters, defined scrape targets, and built the Grafana dashboards that give visibility into application health, request throughput, and response latency.

---

## IX. Resources

### Technical References

- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [TanStack Router](https://tanstack.com/router/latest)
- [TanStack Query](https://tanstack.com/query/latest)
- [TypeORM Documentation](https://typeorm.io/)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tetris Guideline (The Tetris Company)](https://tetris.wiki/Tetris_Guideline)
- [SRS+ Rotation System](https://tetris.wiki/SRS)
- [Gabriel Gambetta — Client-Side Prediction and Server Reconciliation](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html)
- [Valve Source Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Speakeasy TOTP library](https://github.com/speakeasy-js/speakeasy)
- [Passport.js](https://www.passportjs.org/)

### AI Usage

Artificial Intelligence was used strictly as an assistive tool during this project. Specifically:

- **Drafting boilerplate text:** AI helped generate initial versions of tedious boilerplate (e.g., DTO structures, repetitive NestJS module scaffolding, CSS layout skeletons) which were then reviewed and adjusted by team members.
- **Formatting and summarizing:** AI was used to format and summarize meeting transcripts to help keep notes organized.

**Important:** All core logic, system architecture, database design, game mechanics, and code reviews were performed exclusively by human team members. AI was never used to conduct code reviews or make architectural decisions.
