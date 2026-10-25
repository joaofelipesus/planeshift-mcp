// Thin HTTP client for the Planeshift Rails API. All business rules live in Rails.
import { readCredentials } from "./credentials.js";

// The environment wins over the credentials saved by `planeshift-mcp login`.
export function settings() {
  const saved = readCredentials();

  return {
    baseUrl: process.env.PLANESHIFT_URL || saved.url,
    token: process.env.PLANESHIFT_TOKEN || saved.token,
  };
}

export async function api(path, init = {}) {
  const { baseUrl, token } = settings();

  if (!baseUrl || !token) {
    throw new Error("Not logged in. Run `npx planeshift-mcp login`, or set PLANESHIFT_URL and PLANESHIFT_TOKEN");
  }

  const response = await fetch(new URL(`/api/v1${path}`, baseUrl), {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Planeshift API ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

export function post(path, body) {
  return api(path, { method: "POST", body: JSON.stringify(body) });
}
