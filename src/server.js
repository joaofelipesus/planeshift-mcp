import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAddImportantLink } from "./tools/add-important-link.js";
import { registerAddMeeting } from "./tools/add-meeting.js";
import { registerAddNote } from "./tools/add-note.js";
import { registerAddTodoAction } from "./tools/add-todo-action.js";
import { registerGetTimeline } from "./tools/get-timeline.js";
import { registerListProjects } from "./tools/list-projects.js";

export async function startServer() {
  const server = new McpServer({ name: "planeshift", version: "0.1.0" });

  registerListProjects(server);
  registerGetTimeline(server);
  registerAddNote(server);
  registerAddMeeting(server);
  registerAddTodoAction(server);
  registerAddImportantLink(server);

  await server.connect(new StdioServerTransport());
}
