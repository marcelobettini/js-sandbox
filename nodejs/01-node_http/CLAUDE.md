# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev   # start server with --watch (auto-reloads on file changes)
```

No build step, no tests, no linter configured.

## Architecture

This is one of two parallel projects in `nodejs/` that implement the same recipes API — one with raw Node.js (`01-node_http`), one with Express (`02-express`) — for side-by-side comparison.

**Single-file server** (`index.js`):
- Uses `node:http` and the `URL` class for routing and query-param parsing
- Loads recipe data at startup via a static JSON import (`recipes.json`)
- Routes are handled via a `switch` on `url.pathname`

**Routes:**
- `GET /` — plain text hello
- `GET /about` — plain text
- `GET /recipes` — returns full recipe array as JSON
- `GET /recipes/search?name=&ingredient=` — filters recipes by name and/or ingredient (case-insensitive substring match); returns 404 JSON if no results

**Module system:** ES modules (`"type": "module"` in package.json); use `import`/`export`, not `require`.

**Data:** `recipes.json` is a static fixture with 30 recipes. The `total` field (50) reflects the original upstream dataset size, not the local count.
