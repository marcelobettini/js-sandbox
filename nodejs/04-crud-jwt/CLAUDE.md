# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Educational Todo REST API built with Node.js (ESM), Express 5, and MongoDB Atlas. Implements CRUD + JWT auth as a learning project. The goal is simplicity without anti-patterns; comments explain the *why* behind decisions.

## Commands

```bash
npm run dev    # node --watch with .env loaded — use during development
npm start      # production start, no hot reload
```

No test runner is configured. Manual testing via curl or an HTTP client (Postman, etc.) against `http://localhost:3000`.

## Environment

Requires a `.env` file at the project root with:

```
MONGODB_URI=<MongoDB Atlas connection string>
JWT_SECRET=<minimum 32 characters>
JWT_REFRESH_SECRET=<minimum 32 characters, different from JWT_SECRET>
NODE_ENV=development   # set to "production" to enable secure cookies
```

## Architecture

**Entry point** (`src/index.js`): connects to MongoDB, creates the `users.email` unique index, then starts the HTTP server. Fail-fast: `process.exit(1)` if any step fails.

**Layers:**

```
src/
  index.js          # Express setup, global error handler, startup sequence
  middleware/
    auth.js         # verifyToken — reads Bearer token, attaches payload to req.user
  routes/
    tasks.js        # CRUD endpoints under /api/v1/tasks
    auth.js         # register, login, refresh, logout under /api/v1/auth
    health.js       # GET /health — pings MongoDB, returns 200/503
  db/
    mongoClient.js  # Singleton MongoClient + connectDB() / getDb()
    tasksStore.js   # Data access for tasks (toTask() maps _id → id)
    usersStore.js   # Data access for users + ensureIndexes()
```

**Request flow (authenticated):** `routes/tasks.js` → `middleware/auth.js` → `db/mongoStore.js` → `db/mongoClient.js`

**Request flow (auth routes):** `routes/auth.js` → `db/usersStore.js` → `db/mongoClient.js`

**Key conventions:**

- MongoDB stores documents with `_id`; `toTask()` in `mongoStore.js` remaps it to `id` before returning — the rest of the app never sees `_id`. Users are handled the same way in auth routes.
- IDs are UUIDs from Node's native `crypto.randomUUID()`.
- `PATCH /:id/toggle` must be declared **before** `PATCH /:id` — Express matches in declaration order.
- All errors go to the global error handler via `next(err)`, except `/health` (always responds directly for load balancer compatibility).
- 5xx handler does not expose `err.message` to the client.
- User search input is regex-escaped before building a MongoDB `$regex` query (ReDoS prevention).

## Auth design

- **Access token**: 15 min, signed with `JWT_SECRET`, sent in response body.
- **Refresh token**: 7 days, signed with `JWT_REFRESH_SECRET`, sent as `httpOnly` cookie (invisible to client JS).
- **Rotation**: every `POST /auth/refresh` issues a new refresh token and a new access token.
- **Logout**: clears the cookie server-side; access token remains valid until its 15-min TTL (stateless trade-off).
- **Timing attack prevention**: `/login` always calls `bcrypt.compare` even when the user is not found (uses a module-level `DUMMY_HASH` generated at startup).
- **Protected routes**: `POST`, `PATCH`, `DELETE` on `/tasks` require a valid Bearer token. `GET` routes are public.
- **`authorId`**: set automatically from `req.user.sub` when creating a task; no ownership enforcement on update/delete.

## Rules (from specs.md)

- Simpler is better, but never at the cost of anti-patterns
- Prefer native Node.js modules over external packages when possible
- Document with comments explaining *why*, not *what*
- Follow REST API standards
- Use ESM (`import`/`export`) — this is `"type": "module"` project
