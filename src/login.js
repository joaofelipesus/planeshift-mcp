import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { hostname } from "node:os";
import { authorizedPage, deniedPage } from "./pages.js";
import { defaultUrl, deleteCredentials, readCredentials, writeCredentials } from "./credentials.js";

const TIMEOUT_MS = 5 * 60 * 1000;

export function openBrowser(url) {
  const [command, ...args] =
    process.platform === "darwin" ? ["open", url] : process.platform === "win32" ? ["cmd", "/c", "start", "", url] : ["xdg-open", url];

  spawn(command, args, { stdio: "ignore", detached: true }).on("error", () => {}).unref();
}

// Opens the browser on Planeshift's authorization page and waits for it to send the token back to a
// one-shot listener on 127.0.0.1. `open` and `log` are injectable for tests.
export async function login({ url, open = openBrowser, log = console.log, timeoutMs = TIMEOUT_MS } = {}) {
  const baseUrl = (url || process.env.PLANESHIFT_URL || readCredentials().url || defaultUrl()).replace(/\/+$/, "");
  const state = randomBytes(24).toString("base64url");

  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  const result = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timed out waiting for the browser.")), timeoutMs);
    server.on("close", () => clearTimeout(timer));

    server.on("request", (req, res) => {
      const callback = new URL(req.url, "http://127.0.0.1");
      if (callback.pathname !== "/callback") return reply(res, 404, "Not found");
      if (callback.searchParams.get("state") !== state) return reply(res, 400, "Invalid state. Start the login again.");

      if (callback.searchParams.get("error")) {
        reply(res, 200, deniedPage(), "text/html");
        return reject(new Error("Access denied in the browser."));
      }

      const token = callback.searchParams.get("token");
      if (!token) return reply(res, 400, "Missing token.");

      reply(res, 200, authorizedPage(), "text/html");
      resolve(token);
    });
  });

  const query = new URLSearchParams({ port: String(server.address().port), state, name: `MCP on ${hostname()}` });
  const authorizeUrl = `${baseUrl}/cli/authorization?${query}`;
  log(`Opening ${authorizeUrl}\nIf the browser does not open, copy that address into it.`);
  open(authorizeUrl);

  try {
    const token = await result;
    writeCredentials({ url: baseUrl, token });
    log(`Logged in to ${baseUrl}.`);
  } finally {
    server.close();
    server.closeAllConnections();
  }
}

// Revokes the saved token on the server (best effort) and deletes the credentials file.
export async function logout({ log = console.log } = {}) {
  const { url, token } = readCredentials();
  if (!token) return log("Not logged in.");

  try {
    await fetch(new URL("/api/v1/token", url), { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  } catch {
    log("Could not reach the server to revoke the token; revoke it on the API tokens page.");
  }
  deleteCredentials();
  log("Logged out.");
}

function reply(res, status, message, type = "text/plain") {
  res.writeHead(status, { "Content-Type": `${type}; charset=utf-8`, Connection: "close" });
  res.end(message);
}
