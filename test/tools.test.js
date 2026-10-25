import assert from "node:assert/strict";
import { test } from "node:test";
import { registerAddImportantLink } from "../src/tools/add-important-link.js";
import { registerAddMeeting } from "../src/tools/add-meeting.js";
import { registerAddNote } from "../src/tools/add-note.js";
import { registerAddTodoAction } from "../src/tools/add-todo-action.js";
import { registerGetTimeline } from "../src/tools/get-timeline.js";
import { registerListProjects } from "../src/tools/list-projects.js";
import { fakeServer, setEnv, stubFetch } from "./support.js";

const env = { PLANESHIFT_URL: "http://planeshift.test", PLANESHIFT_TOKEN: "ps_token" };

test("list_projects returns the API response as text", async (t) => {
  setEnv(t, env);
  const calls = stubFetch(t, () => [200, { projects: [{ id: 1, name: "Billing" }] }]);
  const { list_projects } = fakeServer(registerListProjects);

  const result = await list_projects.handler({});

  assert.equal(calls[0].url.pathname, "/api/v1/projects");
  assert.equal(result.isError, undefined);
  assert.deepEqual(JSON.parse(result.content[0].text), { projects: [{ id: 1, name: "Billing" }] });
});

test("get_timeline sends only the filters that were given", async (t) => {
  setEnv(t, env);
  const calls = stubFetch(t, () => [200, { entries: [] }]);
  const { get_timeline } = fakeServer(registerGetTimeline);

  await get_timeline.handler({ project_id: 7, query: "rollbar spike", type: "note", limit: 5 });
  await get_timeline.handler({ project_id: 7 });

  assert.equal(calls[0].url.pathname, "/api/v1/projects/7/timeline");
  assert.equal(calls[0].url.searchParams.get("q"), "rollbar spike");
  assert.equal(calls[0].url.searchParams.get("type"), "note");
  assert.equal(calls[0].url.searchParams.get("limit"), "5");
  assert.equal(calls[1].url.search, "");
});

test("get_timeline validates its input", () => {
  const { get_timeline } = fakeServer(registerGetTimeline);
  const { project_id, type, limit } = get_timeline.config.inputSchema;

  assert.ok(project_id.safeParse(1).success);
  assert.ok(!project_id.safeParse("1").success);
  assert.ok(type.safeParse("meeting").success);
  assert.ok(!type.safeParse("email").success);
  assert.ok(!limit.safeParse(101).success);
});

test("add_note posts the description to the project", async (t) => {
  setEnv(t, env);
  const calls = stubFetch(t, () => [201, { note: { id: 3, description: "Ship on Friday." } }]);
  const { add_note } = fakeServer(registerAddNote);

  const result = await add_note.handler({ project_id: 4, description: "Ship on Friday." });

  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].url.pathname, "/api/v1/projects/4/notes");
  assert.deepEqual(calls[0].body, { description: "Ship on Friday." });
  assert.equal(JSON.parse(result.content[0].text).note.id, 3);
});

test("add_note rejects an empty description", () => {
  const { add_note } = fakeServer(registerAddNote);

  assert.ok(!add_note.config.inputSchema.description.safeParse("").success);
});

test("API errors become tool errors instead of throwing", async (t) => {
  setEnv(t, env);
  stubFetch(t, () => [404, { error: "not_found" }]);
  const { add_note } = fakeServer(registerAddNote);

  const result = await add_note.handler({ project_id: 999, description: "Hi" });

  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Planeshift API 404/);
});

test("add_meeting posts the meeting fields without the project id", async (t) => {
  setEnv(t, env);
  const calls = stubFetch(t, () => [201, { meeting: { id: 1 } }]);
  const { add_meeting } = fakeServer(registerAddMeeting);

  await add_meeting.handler({ project_id: 4, title: "Planning", date: "2026-10-20", description: "Scope." });

  assert.equal(calls[0].url.pathname, "/api/v1/projects/4/meetings");
  assert.deepEqual(calls[0].body, { title: "Planning", date: "2026-10-20", description: "Scope." });
});

test("add_meeting only accepts YYYY-MM-DD dates", () => {
  const { add_meeting } = fakeServer(registerAddMeeting);
  const { date } = add_meeting.config.inputSchema;

  assert.ok(date.safeParse("2026-10-20").success);
  assert.ok(date.safeParse(undefined).success);
  assert.ok(!date.safeParse("20/10/2026").success);
});

test("add_todo_action posts the title and description", async (t) => {
  setEnv(t, env);
  const calls = stubFetch(t, () => [201, { todo_action: { id: 1 } }]);
  const { add_todo_action } = fakeServer(registerAddTodoAction);

  await add_todo_action.handler({ project_id: 4, title: "Check Rollbar" });

  assert.equal(calls[0].url.pathname, "/api/v1/projects/4/todo_actions");
  assert.deepEqual(calls[0].body, { title: "Check Rollbar" });
});

test("add_important_link posts the name and url, and validates the url", async (t) => {
  setEnv(t, env);
  const calls = stubFetch(t, () => [201, { important_link: { id: 1 } }]);
  const { add_important_link } = fakeServer(registerAddImportantLink);

  await add_important_link.handler({ project_id: 4, name: "Rollbar", url: "https://rollbar.com" });

  assert.equal(calls[0].url.pathname, "/api/v1/projects/4/important_links");
  assert.deepEqual(calls[0].body, { name: "Rollbar", url: "https://rollbar.com" });
  assert.ok(!add_important_link.config.inputSchema.url.safeParse("not a url").success);
});
