# Event Manager Dashboard

Full-stack event manager: create events, let people apply to them, and manage participants from an owner dashboard.

- **Frontend** — TypeScript, Next.js 16 (App Router), Tailwind CSS v4
- **Backend** — Express.js + PostgreSQL with **raw SQL only** (no ORM)
- **Auth** — email/password with JWT (bonus feature; applying to an event stays public)

```
event-manager-dashboard/
├── backend/          Express API (model / controller / route layers)
│   └── src/
│       ├── config/       env + pg pool
│       ├── models/       raw SQL queries
│       ├── controllers/  request handling
│       ├── routes/       routers
│       ├── middleware/   auth, zod validation, error handler
│       ├── schemas/      zod schemas
│       └── db/           schema.sql, migrate, seed
├── frontend/         Next.js App Router UI
│   └── src/
│       ├── app/          routes: /, /events/new, /events/[id], /events/[id]/edit, /dashboard, /login, /register
│       ├── components/   UI + feature components
│       └── lib/          API client, zod schemas, hooks
└── docs/SYSTEM_DESIGN.md
```

## Quick start

Prerequisites: Node.js 20.9+, PostgreSQL 14+.

```bash
# 1. Database
createdb eventmanager   # or: psql -c "CREATE DATABASE eventmanager;"

# 2. Backend
cd backend
cp .env.example .env    # set DATABASE_URL / JWT_SECRET
npm install
npm run migrate         # applies src/db/schema.sql
npm run seed            # optional demo data: demo@example.com / password123
npm run dev             # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                  # http://localhost:3000
```

### Environment variables

| Backend | Description |
| --- | --- |
| `PORT` | API port (default `4000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `CORS_ORIGIN` | Comma-separated allowed origins |

| Frontend | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the API |

## API

Base URL: `/api`. All responses are wrapped: `{ "data": ... }` on success, `{ "error": "...", "details": { field: message } }` on failure.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | – | Create account, returns JWT |
| `POST` | `/auth/login` | – | Sign in, returns JWT |
| `GET` | `/auth/me` | Bearer | Current user |
| `GET` | `/events` | – | List events; filters `search`, `location`, `from`, `to`, `ownerId`; sort `sort=date\|name\|created_at`, `order=asc\|desc` |
| `GET` | `/events/:id` | – | Event by id (includes participant count) |
| `POST` | `/events` | Bearer | Create event (caller becomes owner) |
| `PUT` | `/events/:id` | Bearer (owner) | Update event |
| `DELETE` | `/events/:id` | Bearer (owner) | Delete event and its registrations |
| `POST` | `/events/:id/registrations` | – | Apply to an event |
| `GET` | `/events/:id/registrations` | Bearer (owner) | List participants |
| `PATCH` | `/events/:id/registrations/:registrationId/cancel` | Bearer (owner) | Cancel a registration with a reason |
| `GET` | `/health` | – | Liveness + database check |

Example:

```bash
curl -X POST http://localhost:4000/api/events \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Next.js Meetup","description":"App Router deep dive","date":"2026-10-14","location":"Bengaluru"}'
```

## Database

`backend/src/db/schema.sql` creates three tables: `users`, `events`, `registrations`. Registrations are soft-cancelled (`status`, `cancellation_reason`, `cancelled_at`) so the organizer keeps an audit trail, and `UNIQUE (event_id, participant_email)` prevents double registration.

## Features

- Create / list / view / edit / delete events
- Public event detail page with an **Apply** form
- Owner **dashboard**: pick one of your events, see its participants, cancel a registration with a mandatory reason
- Search by name/description, filter by location and date range, sort by date/name/recently added
- Zod validation on both client and server, with inline field errors
- Graceful API error handling (PostgreSQL error codes mapped to meaningful HTTP responses)
- JWT auth with ownership checks on every mutating route

## Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| backend | `npm run dev` / `build` / `start` | Run, compile, serve the API |
| backend | `npm run migrate` / `seed` | Apply schema / insert demo data |
| backend | `npm run lint` / `typecheck` | ESLint / tsc |
| frontend | `npm run dev` / `build` / `start` | Next.js dev, production build, serve |
| frontend | `npm run lint` | ESLint |

## Deployment notes

`docs/SYSTEM_DESIGN.md` covers the target AWS topology (EC2 + Nginx reverse proxy + RDS), scaling considerations, and trade-offs. In short:

```
client → Nginx (443) ─┬─ /            → Next.js (127.0.0.1:3000)
                      └─ /api, /health → Express (127.0.0.1:4000) → PostgreSQL (RDS)
```
