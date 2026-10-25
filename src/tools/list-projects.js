import { api } from "../client.js";
import { toolResult } from "./helpers.js";

export function registerListProjects(server) {
  server.registerTool(
    "list_projects",
    {
      description: "List the Planeshift projects of the current user. Use it to find a project id.",
      inputSchema: {},
    },
    toolResult(() => api("/projects")),
  );
}
