import assert from "node:assert/strict";
import { test } from "node:test";
import { api } from "../src/client.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeCredentials } from "../src/credentials.js";
import { setEnv, stubFetch } from "./support.js";

const env = { PLANESHIFT_URL: "http://planeshift.test", PLANESHIFT_TOKEN: "ps_token" };

test("sends the request to /api/v1 with the bearer token", async (t) => {
  setEnv(t, env);
  const calls = stubFetch(t, () => [200, { projects: [] }]);

  const data = await api("/projects");

  assert.deepEqual(data, { projects: [] });
  assert.equal(calls[0].url.href, "http://planeshift.test/api/v1/projects");
  assert.equal(calls[0].init.headers.Authorization, "Bearer ps_token");
  assert.equal(calls[0].init.headers.Accept, "application/json");
});

test("passes the method and body through", async (t) => {
  setEnv(t, env);
  const calls = stubFetch(t);

  await api("/projects/1/notes", { method: "POST", body: JSON.stringify({ description: "Hi" }) });

  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calls[0].body, { description: "Hi" });
});

test("throws with the status and body on a non-2xx response", async (t) => {
  setEnv(t, env);
  stubFetch(t, () => [401, { error: "unauthorized" }]);

  await assert.rejects(api("/projects"), /Planeshift API 401: .*unauthorized/);
});

test("throws when nothing is configured", async (t) => {
  setEnv(t, { PLANESHIFT_URL: undefined, PLANESHIFT_TOKEN: undefined, PLANESHIFT_CONFIG_DIR: mkdtempSync(join(tmpdir(), "planeshift-")) });
  const calls = stubFetch(t);

  await assert.rejects(api("/projects"), /Not logged in/);
  assert.equal(calls.length, 0);
});

test("uses the credentials saved by login when the environment is empty", async (t) => {
  setEnv(t, { PLANESHIFT_URL: undefined, PLANESHIFT_TOKEN: undefined, PLANESHIFT_CONFIG_DIR: mkdtempSync(join(tmpdir(), "planeshift-")) });
  writeCredentials({ url: "http://saved.test", token: "ps_saved" });
  const calls = stubFetch(t);

  await api("/projects");

  assert.equal(calls[0].url.origin, "http://saved.test");
  assert.equal(calls[0].init.headers.Authorization, "Bearer ps_saved");
});

test("the environment wins over the saved credentials", async (t) => {
  setEnv(t, { ...env, PLANESHIFT_CONFIG_DIR: mkdtempSync(join(tmpdir(), "planeshift-")) });
  writeCredentials({ url: "http://saved.test", token: "ps_saved" });
  const calls = stubFetch(t);

  await api("/projects");

  assert.equal(calls[0].url.origin, "http://planeshift.test");
  assert.equal(calls[0].init.headers.Authorization, "Bearer ps_token");
});
