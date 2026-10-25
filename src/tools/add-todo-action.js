import { z } from "zod";
import { post } from "../client.js";
import { toolResult } from "./helpers.js";

export function registerAddTodoAction(server) {
  server.registerTool(
    "add_todo_action",
    {
      description: "Add an action (a to-do item) to a project. It starts as pending.",
      inputSchema: {
        project_id: z.number().int().describe("Project id, from list_projects"),
        title: z.string().min(1).describe("What needs to be done"),
        description: z.string().optional().describe("Details about the action"),
      },
    },
    toolResult(({ project_id, ...todoAction }) => post(`/projects/${project_id}/todo_actions`, todoAction)),
  );
}
