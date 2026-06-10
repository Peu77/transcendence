# ft_transcendence — Multiplayer Tetris

Welcome to our `ft_transcendence` project! We have built a multiplayer Tetris web application—inspired by modern competitive Tetris platforms (like TETR.IO) but with our own spin. It features real-time multiplayer, matchmaking, chat, a robust profile system, and more.

## I. Team Organization and Roles

Our team (`eebert`, `jgoetz`, `cgerling`, `kmuhlbau`, `tpaesch`) organized the project with the following roles to ensure clear responsibilities and smooth coordination.

*   **`eebert`**: Product Owner (PO) & Developer
*   **`tpaesch`**: Project Manager / Scrum Master & Developer
*   **`jgoetz`**: Technical Lead / Architect & Developer
*   **`cgerling`**: Developer
*   **`kmuhlbau`**: Developer

**Workflow & Project Management:**
We relied on regular, documented team meetings to discuss architecture, debug complex issues, and assign tasks. For task tracking and version control, we utilized GitHub (Issues, Pull Requests). 

## II. Technology Stack

*   **Frontend Framework:** React
*   **Backend Framework:** NestJS
*   **Database:** PostgreSQL
*   **ORM:** TypeORM
*   **Infrastructure / DevOps:** Docker & Docker Compose, Prometheus, Grafana

## III. Implemented Modules

To fulfill the project requirements, we selected the following modules:

**Web**
*   Major (1): Use a Frontend framework (React)
*   Major (1): Use a Backend framework (NestJS)
*   Major (2): Realtime feature using WebSockets
*   Minor (2): User interactions (Basic Chat, Friend system, Profile system)
*   Minor (2): Public API (at least 5 endpoints)
*   Minor (1): Use an ORM (TypeORM)

**User Management**
*   Major (2): Standard User Management, Authentication, Advanced Profiles
*   Minor (1): Implement OAuth 2.0 (42 API)
*   Major (2): Implement a complete 2FA (Two-Factor Authentication) system
*   Minor (1): Game statistics, match history, and progression

**Gaming and User Experience**
*   Major (2): Implement a Web-based Game (Tetris)
*   Major (2): Remote players (Real-time remote multiplayer)
*   Minor (1): Advanced Chat Features
*   Minor (1): Game customization options
*   Minor (1): Gamification system

**DevOps**
*   Major (2): Monitoring System with Prometheus and Grafana

## IV. Quick Start / How to Run

Deployment is fully containerized using Docker Compose. To start the application, use the provided `Makefile` at the root of the repository:

1. **Setup Environment Variables**:
   ```bash
   make setup
   ```
   *This copies the `.env.example` files to the required frontend and backend `.env` locations and configures the database host for Docker.*

2. **Start the Application**:
   ```bash
   make up
   ```
   *This builds (if necessary) and runs the multi-container Docker application.*

3. **Access the App**:
   Once the containers are successfully running, the application will be accessible via **`http://localhost`**.

4. **Stop the Application**:
   ```bash
   make down
   ```
   *(To completely wipe the database and containers, run `make reset`)*

## V. Statement on AI Usage

During the development of this project, Artificial Intelligence was utilized strictly as an assistive tool. AI was occasionally used to speed up the drafting of tedious boilerplate text, generate CSS layouts, and format or summarize our meeting transcripts.

**Important Note:** All core logic, system architecture, database design, and specifically **all code reviews** were performed manually by human team members. At no point was AI used to conduct code reviews,// filepath: /Users/t-o/42_Heilbronn/transcendence/README.md
# ft_transcendence — Multiplayer Tetris


# Modules:
- Potential points from Modules: 20 / 19 max 

## Web
- [x] Use a frontend framework - (1)
- [x] Use a backend framework - (1)
- [x] Allow users to interact with other users (2)
  - [x] A basic chat system
  - [x] A friend system
  - [ ] A profile system (Theo)
- [x] Realtime feature using WebSockets - (2)
- [x] User interaction - Basic Chat, friend system, profile system - (2)
- [ ] Public API (at least 5 endpoints) - (2) (blocked by achievements)
- [x] ORM - (1)


## Accessibility and Internationalization
- None

## User Management
- [x] Standard User Management and Auth --> Update profile info, upload avatar, add friends and see if online, profile page per user - (2) (Theo)
- [x] Game statistics and match history - (1) --> ? 
  - [x] Track user game statistics (wins, losses, ranking, level, etc.)
  - [] Display match history (1v1 games, dates, results, opponents).
  - [ ] Show achievements and progression.
  - [x] Leaderboard integration.
- [x] Implement OAuth 2.0 (1)
- [x] Users have a profile page displaying their information. (Theo)
- [x] Implement a complete 2FA (Two-Factor Authentication) system for the users

## Artificial Intelligence
- None

## Cybersecurity
- None

## Gaming and User Experience | --> Check requirements
- [x] Implement Web based Game (2) 
- [x] Multiplayer game (2)
- [x] Remote players — Enable two players on separate computers to play the
  same game in real-time
- [ ] Advanced Chat Features (1)
- [x] Game customization options (1)
- [ ] Gamification system (1)

## Devops
- [x] Monitoring System with Prometheus and Grafana (2)

## Data and Analytics
- None

## Blockchain
- None



# Tetris Features:
- [ ] T-Spin implementation (remove 4 lines) 
- [ ] Allow custom game configs for rooms (needs testing)
- [ ] Special Modes (bomb mode for example)
- [x] Solo Mode (needs enhancing)
- [ ] Quick Play Mode?






# General Features / other todos:
- [ ] Change Readme to requirements of the subject 

