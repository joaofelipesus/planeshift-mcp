# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`planeshift-mcp` is an MCP server (stdio) for [Planeshift](../planeshift), a Rails app that keeps a per-project timeline of notes, meetings and actions. It is a thin client: each tool forwards to the Planeshift JSON API (`/api/v1`). Business rules, validation and authorization live in Rails, not here.

Plain JavaScript (ESM, Node >= 20), no build step and no TypeScript. The only dependencies are `@modelcontextprotocol/sdk` and `zod`. The package is published to npm, and `bin` points straight at `src/index.js`, so `npx planeshift-mcp` runs the source.

## Commands

```
npm install
npm start          # runs the server on stdio; it waits for JSON-RPC on stdin
npm test           # node:test, no extra dependencies
node --test --test-name-pattern="add_note" test/tools.test.js   # a subset
```

There is no linter. Tests stub `fetch` (`test/support.js`: `stubFetch`, `setEnv`, `fakeServer`) and call tool handlers directly; `test/login.test.js` plays the browser against the real listener; `test/server.test.js` spawns the real server over stdio against a local fake API. `support.js` is not a test file, so keep new tests named `*.test.js`. Never write to stdout from the code (no `console.log`): stdout is the MCP transport. Use `console.error` for debugging.

## Authentication and the Rails side

- Credentials come from `PLANESHIFT_URL` / `PLANESHIFT_TOKEN`, or else from `~/.config/planeshift/credentials.json` (override the directory with `PLANESHIFT_CONFIG_DIR`). `settings()` in `src/client.js` resolves them on every call; with neither, a tool returns a "Not logged in" error instead of failing at startup.
- Development mode (`PLANESHIFT_ENV=development`, or `--dev` on `login`/`logout`, which sets it in `src/index.js`) defaults the URL to `http://localhost:3000` and uses `credentials.development.json`, so a local login never overwrites the production one (`developmentMode()`, `defaultUrl()`, `credentialsPath()` in `src/credentials.js`). The default URL is the production one on Railway. To run the local checkout from Claude Desktop/Code, set `PLANESHIFT_ENV=development` in the server's `env`.
- `planeshift-mcp login [--url URL]` (`src/login.js`) is a browser flow: it starts a one-shot listener on `127.0.0.1:<random port>`, opens `<url>/cli/authorization?port=&state=&name=`, and Rails redirects back to `/callback?token=&state=` after the user clicks Allow. A wrong `state` is answered with 400 and ignored. `logout` calls `DELETE /api/v1/token` (best effort) and deletes the file. `src/index.js` dispatches `login` / `logout`; with no argument it starts the MCP server.
- To test `login` in a browser without opening the system one, call `login({ url, open: () => {} })` from a script and navigate to the printed URL yourself.
- The token is a Planeshift API token (`ps_...`) sent as `Authorization: Bearer`. Without the browser flow, create one in the Rails repo: `docker compose exec app bin/rails 'api_tokens:create[user@email.com,MCP]'`. Rails stores only a digest.
- The API lives in the Rails repo under `app/controllers/api/v1` (`projects#index`, `timelines#show`, and `create` for notes, meetings, todo_actions and important_links, plus `token#destroy`); the login page is `Cli::AuthorizationsController`. When a tool needs a new endpoint, add it there first. API errors come back as `{ "error": ..., "details": ... }` with 401/404/400/422.

## Architecture

- `src/server.js` creates the `McpServer`, calls each `register*` function, and connects the stdio transport.
- `src/client.js` exports `api(path, init)`, the only place that does HTTP, and `post(path, body)` for JSON posts. It prefixes `/api/v1`, adds the auth header, and throws `Planeshift API <status>: <body>` on non-2xx.
- `src/tools/<name>.js` defines one tool each (`list_projects`, `get_timeline`, and `add_note`, `add_meeting`, `add_todo_action`, `add_important_link`), exporting `register<Name>(server)` that calls `server.registerTool` with a zod `inputSchema`. Wrap the handler in `toolResult` (`src/tools/helpers.js`) so the API response becomes JSON text and thrown errors become `isError` results instead of crashing the server.

To add a tool: create the file in `src/tools/`, register it in `src/server.js`. Tool and parameter descriptions are what the model reads to decide when to call it, so keep them specific. Parameters use snake_case to match the Rails API.
