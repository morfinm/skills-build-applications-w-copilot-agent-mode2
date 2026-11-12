# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build thin, API-driven React views that render the already-validated backend contract, with loading, empty, and error states expressed as accessible UI rather than custom business logic.
- Logic tier decision: Keep Express routes focused on request validations, MongoDB interaction, and response shaping; move reusable domain behavior into a service layer so the API contract remains consistent across list/create flows.
- Data tier decision: Use Mongoose schemas to enforce required fields, relationship integrity, and seed-time data fidelity; keep the seeded dataset representative and idempotent so tests can assert stable contracts.
- Activity tracking approach: Validate userId and teamId against existing documents, enforce required activity fields, compute points from minutes and type, and store both the raw relationship fields and the derived occurredAt/points values.
- Team management approach: Require a team name at create time, keep members as an array of user references, and expose team membership in list payloads without hiding the underlying document relationships.
- Leaderboard approach: Aggregate teams by total activity points, sort descending, and assign a 1-based rank from the ordered list so the API returns deterministic scoreboard data.
- Workout suggestions approach: Match suggestions to the user’s recent activity pattern or fitness goal, ensure the first suggestion’s focus aligns with that pattern, and return a clear 4xx if the email is not seeded in the system.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates the Mongoose schema contract for users, teams, activities, and workout suggestions; failures here mean required fields, relationships, or model validation are not defined correctly.
- API command: `npm run test:api --prefix octofit-tracker/backend` — validates request validation, 4xx handling, team creation, leaderboard aggregation, and workout suggestion behavior; 501 or [] responses indicate the routes/services are not wired to the contract yet.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — validates the presentation layer; failures usually indicate missing rendering, no accessible alerts, or absent loading/empty states rather than backend logic problems.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — checks TypeScript integrity of the server, routes, services, and models.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — checks TypeScript and Vite build integrity for the React app and its API-driven components.
