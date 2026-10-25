#!/usr/bin/env node
// No arguments: the MCP server on stdio. `login` / `logout`: manage the saved credentials.
const [command, ...args] = process.argv.slice(2);

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
  fail(new Error(`Unknown command "${command}". Usage: planeshift-mcp [login [--url URL] | logout]`));
}

function fail(error) {
  console.error(error.message);
  process.exit(1);
}
