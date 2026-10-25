import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const PRODUCTION_URL = "https://planeshift-production.up.railway.app";
export const DEVELOPMENT_URL = "http://localhost:3000";

// Development mode (PLANESHIFT_ENV=development, or --dev on login/logout) targets a local Planeshift
// and keeps its own credentials, so it never overwrites the production login.
export function developmentMode() {
  return process.env.PLANESHIFT_ENV === "development";
}

export function defaultUrl() {
  return developmentMode() ? DEVELOPMENT_URL : PRODUCTION_URL;
}

// Saved by `planeshift-mcp login`: { url, token }. Environment variables take precedence over it.
export function credentialsPath() {
  const dir = process.env.PLANESHIFT_CONFIG_DIR || join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "planeshift");
  return join(dir, developmentMode() ? "credentials.development.json" : "credentials.json");
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
