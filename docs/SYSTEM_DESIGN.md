# Event Manager Dashboard — System Design

## 1. Overview

The Event Manager Dashboard lets an organizer publish events, lets anyone apply to an event, and gives the
organizer a dashboard to review participants and cancel registrations with a recorded reason.

The system is split into two independently deployable applications that talk over a REST API:

| Component | Technology | Responsibility |
| --- | --- | --- |
| `frontend` | Next.js 16 (App Router), React 19, Tailwind CSS v4 | Rendering, routing, client-side validation, session storage |
| `backend` | Express.js, `pg`, zod, JWT | REST API, validation, authorization, raw SQL data access |
| database | PostgreSQL 14+ | Durable storage of users, events, registrations |

Splitting the two allows each side to scale on its own axis: the UI is mostly static assets and can sit behind a
CDN, while the API is CPU/IO bound and scales horizontally behind a load balancer.

## 2. Architecture

```
                       ┌────────────────────────────┐
   Browser  ───────────►  Nginx (TLS termination)   │
                       │  /        → Next.js :3000  │
                       │  /api     → Express :4000  │
                       └───────┬────────────┬───────┘
                               │            │
                    ┌──────────▼───┐   ┌────▼───────────┐
                    │  Next.js SSR │   │  Express API   │
                    │  (Node 20)   │   │  (Node 20)     │
                    └──────────────┘   └────┬───────────┘
                                            │  pg pool (max 10)
                                     ┌──────▼─────────┐
                                     │  PostgreSQL    │
                                     │  (RDS / local) │
                                     └────────────────┘
```

Requests flow: UI event handler → typed API client (`frontend/src/lib/api.ts`) → Express router → zod validation
middleware → controller → model (raw SQL) → PostgreSQL. Errors bubble up to a single Express error handler that
converts `HttpError`s and PostgreSQL error codes into a consistent `{ error, details }` payload, which the API
client re-throws as an `ApiError` and the forms render inline.

### Backend layering

```
routes/        HTTP surface: path, method, middleware chain
  ↓
middleware/    auth (JWT), validate (zod), errorHandler
  ↓
controllers/   request/response orchestration, authorization checks
  ↓
models/        parameterised raw SQL, row → domain mapping
  ↓
config/db.ts   pg Pool, query/queryOne/withTransaction helpers
```

Every layer has one reason to change: swapping the transport (e.g. adding GraphQL) only touches routes and
controllers; swapping the datastore only touches models.

## 3. Data model

```sql
users(id, name, email UNIQUE, password_hash, created_at)
events(id, name, description, date, location, owner_id → users, created_at, updated_at)
registrations(id, event_id → events ON DELETE CASCADE, participant_name, participant_email,
              note, status ∈ {registered, cancelled}, cancellation_reason, cancelled_at, created_at,
              UNIQUE(event_id, participant_email))
```

Design decisions:

- **Soft cancellation.** A cancelled registration keeps its row plus reason and timestamp, so organizers retain an
  audit trail and participants can be re-instated. Participant counts filter on `status = 'registered'`.
- **Unique (event_id, participant_email).** Prevents duplicate applications at the database level rather than
  relying on an application-level check that would race under concurrency.
- **`ON DELETE CASCADE`.** Deleting an event removes its registrations in one statement, so no orphan rows.
- **Indexes.** `events(date)` for the default sort, `events(owner_id)` for the dashboard query,
  `lower(events.name)` for search, `registrations(event_id)` for the participants list.
- **`DATE` not `TIMESTAMP`.** The assignment models a calendar day; dates are serialised with
  `to_char(date, 'YYYY-MM-DD')` so no timezone shifting can occur between Postgres, Node and the browser.

## 4. API design

REST over JSON, versionable by prefix (`/api` today, `/api/v2` later). Responses are always enveloped
(`{ data }` / `{ error, details }`) so clients have one parsing path.

Authorization rules:

| Action | Rule |
| --- | --- |
| Browse events, view an event, apply | Public |
| Create event | Any authenticated user (becomes owner) |
| Update / delete event, list participants, cancel registration | Event owner only |

Ownership is checked in the controller after loading the row, which keeps the SQL simple and returns a
distinguishable `404` (missing) vs `403` (not yours).

## 5. Security

- Passwords hashed with bcrypt (cost 10); the hash never leaves the model layer.
- Stateless JWTs signed with `JWT_SECRET`, 7-day expiry, sent as `Authorization: Bearer`. Stateless tokens keep the
  API horizontally scalable; the trade-off is no server-side revocation — a short-lived access token plus refresh
  token is the next step if that matters.
- Every SQL statement is parameterised (`$1, $2 …`); no string interpolation of user input. Sort/order inputs are
  mapped through a whitelist because column names cannot be parameterised.
- Payload size capped (`express.json({ limit: '100kb' })`), CORS restricted to configured origins.
- Validation happens twice: in the browser for fast feedback and on the server as the source of truth.

## 6. Scalability

Current shape handles a single small instance comfortably. Scaling path, in order of what breaks first:

1. **Stateless API replicas.** No session state lives in the process, so run N Express containers behind an ALB.
   The `pg` pool is per-process (`max: 10`), so cap `replicas × 10` below the Postgres `max_connections`, or put
   PgBouncer in front.
2. **Read scaling.** Event browsing is read-heavy and write-light. Add an RDS read replica and route
   `GET /events` there, or cache list responses in Redis keyed by the filter set with short TTL + invalidation on
   write.
3. **Pagination.** `GET /events` currently returns the full filtered set. Keyset pagination
   (`WHERE (date, id) > ($1, $2) LIMIT 20`) is the first change once event counts grow beyond a page.
4. **Full-text search.** `ILIKE '%term%'` cannot use a b-tree index. At scale, switch to a `tsvector` GIN index or
   `pg_trgm`.
5. **Static delivery.** The Next.js build output is CDN-cacheable; only the dynamic event routes hit Node.
6. **Hot rows.** A popular event's registration insert is a single row write with a unique index — no contention
   hotspot. If waitlists/capacity limits are added, the capacity check must move into a transaction with
   `SELECT … FOR UPDATE` on the event row.

## 7. Reliability & observability

- `GET /health` runs `SELECT 1`, giving the load balancer a real dependency check rather than a process ping.
- Graceful shutdown on `SIGINT`/`SIGTERM`: stop accepting connections, drain the pg pool, exit.
- Database failures map to `503` with a retryable message; constraint violations map to `4xx` so clients do not
  retry them blindly.
- `morgan` request logging in development; in production this would ship structured JSON logs to CloudWatch, with
  request IDs propagated from Nginx.

## 8. Deployment (AWS)

```
Route53 → ALB/EC2 (Nginx, TLS via certbot)
            ├── /            → pm2: next start        (127.0.0.1:3000)
            └── /api, /health→ pm2: node dist/server.js (127.0.0.1:4000)
                                     └── RDS PostgreSQL (private subnet)
```

- Both apps run under `pm2` (or systemd) on the EC2 instance; Nginx is the only public listener.
- Secrets (`DATABASE_URL`, `JWT_SECRET`) come from SSM Parameter Store / environment files outside the repo.
- Deploy = `git pull && npm ci && npm run build && npm run migrate && pm2 reload all`.
- Nginx sketch:

```nginx
server {
  listen 443 ssl;
  server_name events.example.com;

  location /api/ { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host; }
  location /health { proxy_pass http://127.0.0.1:4000; }
  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }
}
```

## 9. Trade-offs and what I would do next

| Decision | Why | Trade-off |
| --- | --- | --- |
| Raw SQL, no ORM | Assignment requirement; predictable query plans | Manual row→DTO mapping, no migration tooling out of the box |
| Client-side data fetching in the App Router | Auth token lives in `localStorage`; keeps the API the single source of truth | No server-side rendering of event data (SEO would need cookie-based auth + server fetches) |
| JWT in `localStorage` | Simplest cross-origin setup for a split deployment | Vulnerable to XSS; httpOnly cookies + CSRF tokens are the production answer |
| Soft cancellation | Preserves organizer audit trail | Registration table grows monotonically; needs archival eventually |
| SQL file migration | One command, no dependency | No versioned up/down migrations — `node-pg-migrate` would be the next step |

Next increments: pagination, capacity limits with waitlists, email notifications on cancellation, refresh tokens,
and an automated test suite (Vitest + Supertest for the API, Playwright for the golden-path UI flow).
