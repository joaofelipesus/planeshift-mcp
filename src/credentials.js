import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Saved by `planeshift-mcp login`: { url, token }. Environment variables take precedence over it.
export function credentialsPath() {
  const dir = process.env.PLANESHIFT_CONFIG_DIR || join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "planeshift");
  return join(dir, "credentials.json");
}

export function readCredentials() {
  try {
    return JSON.parse(readFileSync(credentialsPath(), "utf8"));
  } catch {
    return {};
  }
}

export function writeCredentials(credentials) {
  const path = credentialsPath();
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify(credentials, null, 2) + "\n", { mode: 0o600 });
  chmodSync(path, 0o600);
}

export function deleteCredentials() {
  rmSync(credentialsPath(), { force: true });
}
