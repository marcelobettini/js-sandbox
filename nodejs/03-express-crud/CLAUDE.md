# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Educational REST API — Todo App CRUD built with Node.js and Express. Full requirements are in `specs.md`.

## Stack

- **Runtime**: Node.js ≥ 20.6 with ES6+ (ESM — `import`, not `require`)
- **Framework**: Express.js v5
- **Database**: MongoDB Atlas via native `mongodb` driver (no Mongoose)

## Commands

```bash
npm run dev    # node --watch --env-file .env (auto-restart + loads .env)
npm start      # production start — env vars must be injected externally
```

`npm run dev` loads `.env` automatically via Node's `--env-file` flag. `npm start` does **not** load `.env` by design — in production, variables are injected by the hosting platform.

No test runner or linter configured.

## Environment

```
MONGODB_URI=<connection string from MongoDB Atlas>
```

Required in `.env` for local development. The app calls `process.exit(1)` if the DB connection fails at startup.

## Architecture

```
src/
  index.js             # Express setup, global middleware, 404/error handlers, listen
  routes/
    tasks.js           # all task CRUD endpoints
    health.js          # GET /health — checks MongoDB connectivity
  db/
    mongoClient.js     # singleton MongoClient; exports connectDB() and getDb()
    mongoStore.js      # data access layer; all operations async
```

**Request flow**: `index.js` → calls `connectDB()` before `app.listen()` → mounts `tasksRouter` at `/api/v1/tasks` and `healthRouter` at `/health` → handlers call `mongoStore` functions directly.

### mongoStore API

All functions are async and operate on the `tasks` collection in the `todoAPI` database.

```js
getAll({ completed, search })  // filters applied in MongoDB, not in memory
getById(id)                    // returns raw doc or null; guards with ObjectId.isValid()
add(task)                      // inserts and returns { _id, ...task }
update(id, fields)             // $set patch; returns updated doc or null
remove(id)                     // returns boolean
```

`id` params from route handlers are strings; the store converts them to `ObjectId` internally. An invalid format returns `null`/`false` without throwing.

### Connection singleton

`mongoClient.js` holds a module-level `db` reference. `connectDB()` is called once at startup. Any call to `getDb()` before `connectDB()` throws explicitly — fast fail.

### Health endpoint

`GET /health` — mounted at `/health`, outside `/api/v1` (infrastructure, not domain). Returns `200 { status: 'ok', db: 'ok' }` or `503 { status: 'error', db: 'unreachable' }`. Never delegates to `next(err)` — always returns a structured response so load balancers/orchestrators can read the HTTP status code.

## Key rules

- **Use the `nodejs-backend-patterns` skill** for any backend implementation work.
- **Comment the code** — educational project; explain the *why* where useful. Comments are in Spanish.
- **Prefer native Node.js modules** (`fs`, `path`) over external packages.
- **Task model**: `_id` (ObjectId, generado por MongoDB), `title`, `description`, `priority` (low/mid/high), `completed` (boolean, default `false`), `createdAt` (ISO timestamp), `updatedAt` (same as `createdAt` on creation).
- **Route ordering**: in `tasks.js`, always declare `/:id/toggle` **before** `/:id` — Express matches top-to-bottom and `/:id` would swallow `/toggle` otherwise.
- **Query filters on GET /tasks**: `?completed=true|false` and `?search=keyword` (title or description). Filtering happens in MongoDB via `getAll()`; the router just passes `req.query`.
- **ReDoS prevention**: user input used in `RegExp` must be escaped before use — see `mongoStore.js` `getAll()` and `ReDoS.md` for context.
- **Error handling pattern**: all async route handlers use `async (req, res, next)` with `try/catch` delegating to `next(err)`. The global error handler in `index.js` hides 5xx details from clients.
