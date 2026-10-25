# planeshift-mcp

MCP server for Planeshift. It runs locally over stdio and forwards tool calls to the Planeshift Rails API (`/api/v1`).

## Install

Requires Node.js 20 or newer.

### 1. Log in (once)

```
npx -y planeshift-mcp login
```

Your browser opens Planeshift. Sign in, click Allow, and the token is saved to `~/.config/planeshift/credentials.json` (readable only by you). Claude Code and Claude Desktop both read it, so you only do this once. Use `--url https://your-instance` for a self-hosted Planeshift. `npx -y planeshift-mcp logout` revokes the token and deletes the file.

### 2a. Claude Code

```
claude mcp add --scope user planeshift -- npx -y planeshift-mcp
```

Start a new `claude` session and run `/mcp` to check that `planeshift` is connected.

### 2b. Claude Desktop

Open Settings > Developer > Edit Config (or edit `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS, `%APPDATA%\Claude\claude_desktop_config.json` on Windows) and add the server:

```json
{
  "mcpServers": {
    "planeshift": {
      "command": "npx",
      "args": ["-y", "planeshift-mcp"]
    }
  }
}
```

Quit Claude Desktop completely and open it again. The tools appear under the tools icon of the chat box. If `npx` is not found, use the full path of `npx` (run `which npx`) as the `command`, since the app does not load your shell profile.

### Tools

`list_projects`, `get_timeline`, `add_note`, `add_meeting`, `add_todo_action`, `add_important_link`.

### Without `login`

Set `PLANESHIFT_URL` and `PLANESHIFT_TOKEN` (create a token on the API tokens page) in the `env` of the config above, or with `claude mcp add -e PLANESHIFT_URL=... -e PLANESHIFT_TOKEN=...`. They take precedence over the saved credentials.

## Development

```
npm install
npm start
```

Add a tool in `src/tools/` and register it in `src/index.ts`.
