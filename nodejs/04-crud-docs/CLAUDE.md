# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (requires .env file)
npm run dev
# Equivalent: node --watch --env-file=.env src/index.js
```

No test runner is configured (`npm test` exits with an error).

## Environment

Requires a `.env` file with:
```
PORT=3001
MONGO_URI=<MongoDB Atlas connection string>
DB_NAME=<database name>
```

## Architecture

Express 5 REST API using ES Modules (`"type": "module"`). API is versioned under `/api/v1`.

**Data layer**
- `src/services/taskService.js` — MongoDB CRUD service. All functions are async. MongoDB generates `_id` (ObjectId); a `fmt()` helper renames it to `id` in every response (the native driver has no transform layer like Mongoose). `toggle` uses an aggregation pipeline update for an atomic flip of `completed`.
- `src/db/mongoClient.js` — MongoDB singleton (connect once at startup, expose `getDB()`). Used by both `taskService.js` and the health check.
- `src/services/fileStore.js` — legacy JSON file store, no longer wired up.

**Request flow**
```
src/index.js  →  /api/v1/tasks  →  src/routes/tasks.js  →  src/services/taskService.js  →  MongoDB
               →  /health        →  src/routes/health.js  →  src/db/mongoClient.js        →  MongoDB
```

**Task schema**: `{ id (ObjectId string), title, description, priority ("low"|"mid"|"high"), completed (bool), createdAt, updatedAt }`

**Input handling**
- `title` and `description` are trimmed at the route layer before validation. A whitespace-only `title` is rejected with 400.

**Error handling**
- Stack traces are only logged to console for 5xx errors. 4xx errors (malformed JSON, not found, validation) are silent in the console.
- `err.status` and `err.statusCode` are both checked — some third-party middleware uses the latter.
- All route handlers are async; Express 5 forwards unhandled rejections to the global error handler automatically.
