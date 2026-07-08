# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Example backend built for a Prompt Engineering class (UNTREF). It's a thin Express API that forwards a user prompt to Google's Gemini API (with a fixed system instruction defining a medical-clinic assistant persona) and optionally logs the exchange to MongoDB.

## Commands

- `npm run dev` — runs `app.js` with Node's native `--watch` and `--env-file .env` flags (no nodemon/dotenv dependency; requires a `.env` file at the repo root, see `env.sample`).
- There are no lint, build, or test scripts/frameworks configured in this repo.

## Architecture

Everything routes through a single Express instance in `app.js`:

- `app.js` — defines the one endpoint, `POST /ask-questions`, which accepts `{ prompt: string, chatId?: string }`.
  - **New conversation** (no `chatId` in the body): a new `chatId` (UUID) is minted, no history is fetched.
  - **Continuing conversation** (`chatId` present): the prior turns for that `chatId` are fetched via `getChatHistory` and passed into `generateContentFromGemini` as conversation context.
  - Flow per request: validate `prompt` → `await connectDB()` (failure is caught and treated as "DB unavailable" rather than crashing the request) → conditionally fetch history → call `generateContentFromGemini(prompt, history, resolvedChatId)` → if Gemini succeeded and returned text, persist the turn via `saveChat` (keyed by the resolved `chatId`) → return `{ success, status, chatId, data: text }`. If Gemini itself failed or returned no text, the original error `status` is returned to the client. Unhandled errors are caught and a generic 500 is returned (the real error is only logged server-side).
- `services/geminiService.js` — wraps `@google/genai`. `generateContentFromGemini(prompt, history)` converts `history` (from `database.js`) into Gemini's native multi-turn `contents` array (alternating `role: "user"` / `role: "model"` turns, in chronological order, with the current `prompt` appended last) via the internal `buildContents` helper. The system persona stays in `systemInstruction` (imported from `instructions/prompt.js`) and is not repeated per turn. Both success and error paths are normalized into `{ status, data }`.
- `instructions/prompt.js` — exports `instrucciones`, a large Spanish-language system prompt that defines the assistant's persona (clinic customer service agent), strict formatting rules for its opening message, and static reference data (doctor schedules, available studies) interpolated into the prompt string. This is the main "prompt engineering" artifact of the project — changes to the assistant's behavior generally happen here, not in the service/route code. Conversation history is *not* described as JSON in this prompt (that was replaced by native `contents` turns) — the model just sees prior turns as normal conversation.
- `database/database.js` — MongoDB client (database `AIChat`, collection `History`). `connectDB()` pings the server and is `await`ed in `app.js` to gate both history lookup and chat persistence. `saveChat`/`getChatHistory` read/write chat records keyed by `chatId`; `getChatHistory` is what powers multi-turn context in `app.js`.

All exported functions in `database/database.js` and `services/geminiService.js` are documented with JSDoc (including the `ChatHistoryEntry`/`ChatRecord` typedefs) — check those for the exact shapes passed between layers.

## Environment

Two env vars are required, loaded from `.env` (see `env.sample` for the expected keys):
- `GEMINI_API_KEY` — Gemini API key used by `services/geminiService.js`.
- `MONGODB_CS` — MongoDB connection string used by `database/database.js`.
