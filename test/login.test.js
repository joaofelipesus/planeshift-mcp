import assert from "node:assert/strict";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { credentialsPath, readCredentials, writeCredentials } from "../src/credentials.js";
import { login, logout } from "../src/login.js";
import { setEnv, stubFetch } from "./support.js";

function useConfigDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "planeshift-"));
  setEnv(t, { PLANESHIFT_CONFIG_DIR: dir });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
}

// The "browser": reads the authorization URL the CLI opened and calls back like Rails would.
function browser(callbackParams, sink = []) {
  return (authorizeUrl) => {
    const url = new URL(authorizeUrl);
    const port = url.searchParams.get("port");
    const state = url.searchParams.get("state");
    const query = new URLSearchParams({ state, ...callbackParams(state) });
    sink.push(new Promise((resolve) => setImmediate(() => resolve(fetch(`http://127.0.0.1:${port}/callback?${query}`)))));
  };
}

test("login saves the token handed back by the browser, readable only by the user", async (t) => {
  useConfigDir(t);
  let opened;
  const open = (url) => {
    opened = new URL(url);
    browser(() => ({ token: "ps_abc" }))(url);
  };

  await login({ url: "http://planeshift.test/", open, log: () => {} });

  assert.equal(opened.origin + opened.pathname, "http://planeshift.test/cli/authorization");
  assert.match(opened.searchParams.get("name"), /^MCP on /);
  assert.deepEqual(readCredentials(), { url: "http://planeshift.test", token: "ps_abc" });
  assert.equal(statSync(credentialsPath()).mode & 0o777, 0o600);
});

test("the browser gets a styled page, for success and for denial", async (t) => {
  useConfigDir(t);
  const requests = [];

  await login({ url: "http://planeshift.test", open: browser(() => ({ token: "ps_abc" }), requests), log: () => {} });
  await assert.rejects(login({ url: "http://planeshift.test", open: browser(() => ({ error: "access_denied" }), requests), log: () => {} }));

  const pages = await Promise.all(
    requests.map(async (request) => {
      const response = await request;
      return { type: response.headers.get("content-type"), body: await response.text() };
    }),
  );

  assert.match(pages[0].type, /^text\/html/);
  assert.match(pages[0].body, /Planeshift MCP is authorized/);
  assert.match(pages[1].body, /Access denied/);
});

test("login ignores a callback with the wrong state and keeps waiting", async (t) => {
  useConfigDir(t);
  const open = (url) => {
    const port = new URL(url).searchParams.get("port");
    setImmediate(async () => {
      const forged = await fetch(`http://127.0.0.1:${port}/callback?state=forged&token=ps_evil`);
      assert.equal(forged.status, 400);
      browser(() => ({ token: "ps_good" }))(url);
    });
  };

  await login({ url: "http://planeshift.test", open, log: () => {} });

  assert.equal(readCredentials().token, "ps_good");
});

test("login fails when the access is denied and saves nothing", async (t) => {
  useConfigDir(t);

  await assert.rejects(
    login({ url: "http://planeshift.test", open: browser(() => ({ error: "access_denied" })), log: () => {} }),
    /Access denied/,
  );
  assert.deepEqual(readCredentials(), {});
});

test("login times out when the browser never answers", async (t) => {
  useConfigDir(t);

  await assert.rejects(login({ url: "http://planeshift.test", open: () => {}, log: () => {}, timeoutMs: 50 }), /Timed out/);
});

test("logout revokes the token on the server and deletes the file", async (t) => {
  useConfigDir(t);
  writeCredentials({ url: "http://planeshift.test", token: "ps_abc" });
  const calls = stubFetch(t, () => [204, ""]);

  await logout({ log: () => {} });

  assert.equal(calls[0].init.method, "DELETE");
  assert.equal(calls[0].url.href, "http://planeshift.test/api/v1/token");
  assert.equal(calls[0].init.headers.Authorization, "Bearer ps_abc");
  assert.deepEqual(readCredentials(), {});
});

test("logout deletes the file even if the server is unreachable", async (t) => {
  useConfigDir(t);
  writeCredentials({ url: "http://planeshift.test", token: "ps_abc" });
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("offline");
  };
  t.after(() => (globalThis.fetch = original));

  await logout({ log: () => {} });

  assert.deepEqual(readCredentials(), {});
});
