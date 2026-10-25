import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { test } from "node:test";
import { createInterface } from "node:readline";

// Starts the real server over stdio against a fake Planeshift API and talks MCP to it.
test("serves the tools over stdio and forwards calls to the API", async (t) => {
  const requests = [];
  const api = createServer((req, res) => {
    requests.push({ url: req.url, authorization: req.headers.authorization });
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ projects: [{ id: 1, name: "Billing" }] }));
  });
  await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
  t.after(() => api.close());

  const child = spawn(process.execPath, ["src/index.js"], {
    env: { ...process.env, PLANESHIFT_URL: `http://127.0.0.1:${api.address().port}`, PLANESHIFT_TOKEN: "ps_token" },
    stdio: ["pipe", "pipe", "inherit"],
  });
  t.after(() => child.kill());

  const pending = new Map();
  createInterface({ input: child.stdout }).on("line", (line) => {
    const message = JSON.parse(line);
    pending.get(message.id)?.(message);
  });
  const request = (id, method, params = {}) =>
    new Promise((resolve) => {
      pending.set(id, resolve);
      child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    });

  await request(1, "initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "test", version: "0" },
  });
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

  const list = await request(2, "tools/list");
  assert.deepEqual(list.result.tools.map((tool) => tool.name).sort(), [
    "add_important_link",
    "add_meeting",
    "add_note",
    "add_todo_action",
    "get_timeline",
    "list_projects",
  ]);

  const call = await request(3, "tools/call", { name: "list_projects", arguments: {} });
  assert.deepEqual(JSON.parse(call.result.content[0].text).projects[0].name, "Billing");
  assert.deepEqual(requests, [{ url: "/api/v1/projects", authorization: "Bearer ps_token" }]);
});
