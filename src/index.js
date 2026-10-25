#!/usr/bin/env node
// No arguments: the MCP server on stdio. `login` / `logout`: manage the saved credentials.
// `--dev` is the same as PLANESHIFT_ENV=development (local Planeshift, separate credentials).
const [command, ...rest] = process.argv.slice(2);
const args = rest.filter((arg) => arg !== "--dev");
if (rest.includes("--dev")) process.env.PLANESHIFT_ENV = "development";

if (command === "login") {
  const { login } = await import("./login.js");
  const urlIndex = args.indexOf("--url");
  await login({ url: urlIndex >= 0 ? args[urlIndex + 1] : undefined }).catch(fail);
} else if (command === "logout") {
  const { logout } = await import("./login.js");
  await logout();
} else if (command === undefined) {
  const { startServer } = await import("./server.js");
  await startServer();
} else {
  fail(new Error(`Unknown command "${command}". Usage: planeshift-mcp [login | logout] [--dev] [--url URL]`));
}

function fail(error) {
  console.error(error.message);
  process.exit(1);
}
