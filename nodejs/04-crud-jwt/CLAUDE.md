# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Educational REST API — Todo App CRUD built with Node.js and Express. Full requirements are in `specs.md`.

## Stack

- **Runtime**: Node.js with ES6+ (import instead of require)
- **Framework**: Express.js v5
- **Persistence**: JSON file (no database)
- **UUID generation**: Node.js native `crypto.randomUUID()`

## Commands

```bash
npm run dev    # node --watch (auto-restart on file change)
npm start      # production start, no watch
```

No test runner or linter configured.

## Architecture

```
src/
  index.js          # Express app setup, global middleware, 404/error handlers, listen
  routes/
    tasks.js        # all task endpoints; imports fileStore directly (no controller layer)
  db/
    fileStore.js    # in-memory array backed by JSON file; auto-loads on import
  data/
    tasks.json      # persistence file; created empty on first run if missing
```

**Request flow**: `index.js` → mounts `tasksRouter` at `/api/v1/tasks` → route handlers call `fileStore` functions directly.

### fileStore API

```js
getAll()          // returns in-memory tasks array
getById(id)       // returns task or null
add(task)         // pushes and persists
update(id, fields) // merges fields, persists, returns updated task or null
remove(id)        // splices and persists, returns boolean
```

`load()` is called automatically at the bottom of `fileStore.js` when the module is imported. Every mutating function calls `persist()` (save → load) to keep memory and file in sync.

### ESM `__dirname` pattern

`fileStore.js` reconstructs `__dirname` because it does not exist in ES Modules:

```js
const __dirname = dirname(fileURLToPath(import.meta.url));
```

## Key rules

- **Use the `nodejs-backend-patterns` skill** for any backend implementation work.
- **Comment the code** — this is an educational project; explain the why where useful. Comments are in Spanish.
- **Prefer native Node.js modules** (`fs`, `crypto`, `path`) over external packages.
- **Task model**: `id` (uuid), `title`, `description`, `priority` (low/mid/high), `completed` (boolean, default `false`), `createdAt` (ISO timestamp), `updatedAt` (same as `createdAt` on creation).
- **Route ordering**: in `tasks.js`, always declare `/:id/toggle` **before** `/:id` — Express matches routes top-to-bottom and `/:id` would swallow `/toggle` otherwise.
- **Query filters on GET /tasks**: `?completed=true|false` and `?search=keyword` (title or description).
