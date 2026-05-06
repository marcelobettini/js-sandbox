# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Educational REST API — Todo App CRUD built with Node.js and Express. Full requirements are in `specs.md`.

## Stack

- **Runtime**: Node.js with ES6+ (CommonJS or ESM — to be decided)
- **Framework**: Express.js v5
- **Persistence**: JSON file (no database)
- **UUID generation**: Node.js native `crypto.randomUUID()`

## Commands

```bash
node src/index.js        # start the server
```

No test runner or linter configured.

## Planned file structure

```
src/
  index.js          # Express app setup and server listen
  routes/
    tasks.js        # all task endpoints
  db/
    fileStore.js    # JSON file read/write module (independent, reusable)
  data/
    tasks.json      # persistence file
```

## Key rules

- **Use the `nodejs-backend-patterns` skill** for any backend implementation work.
- **Comment the code** — this is an educational project; explain the why where useful.
- **Prefer native Node.js modules** (`fs`, `crypto`, `path`) over external packages.
- **JSON file protocol**: `fileStore.js` loads the file into memory on startup; every POST, PATCH, or DELETE must overwrite the file and reload memory to keep state consistent.
- **Task model**: `id` (uuid, internal), `title`, `description`, `priority` (low/mid/high), `completed` (boolean, default `false`), `createdAt` (timestamp), `updatedAt` (timestamp, same as `createdAt` on creation).
