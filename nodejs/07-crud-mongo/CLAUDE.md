# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev   # start server with --watch (hot reload)
```

No test runner is configured. No build step — Node runs the source directly.

## Architecture

Express 5 REST API for task management, using **ES modules** (`"type": "module"` — always use `import`/`export`, never `require`/`module.exports`).

**Entry point:** `index.js` — mounts routers, registers 404 and global error handler middleware.

**Route prefix:** `/api`

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/:id` | Get task by id |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task fields |
| PATCH | `/api/tasks/:id/toggle` | Toggle completed |
| DELETE | `/api/tasks/:id` | Delete task |

**Task shape:** `{ title, description, priority: 'low'|'mid'|'high', completed: boolean, createdAt, updatedAt }`

**DB layer:**
- `src/db/client.js` — `MongoClient` singleton; exports `connectToDatabase()` (called once at startup) and `getDb()`.
- `src/db/tasksCollection.js` — repository functions (`findAll`, `findById`, `insertTask`, `updateTask`, `deleteTask`) that call `getDb().collection('tasks')`.

**Startup:** `index.js` calls `connectToDatabase()` before `server.listen()`. If the connection fails, the process exits.

**Error handling:** Routes call `next(err)` with `err.status` set; the global handler in `index.js` returns `{ status, error }` JSON. Express 5 auto-catches async errors, so no try/catch is needed in route handlers.
