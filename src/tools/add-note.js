import { z } from "zod";
import { post } from "../client.js";
import { toolResult } from "./helpers.js";

export function registerAddNote(server) {
  server.registerTool(
    "add_note",
    {
      description: "Add a note to the timeline of a project.",
      inputSchema: {
        project_id: z.number().int().describe("Project id, from list_projects"),
        description: z.string().min(1).describe("The text of the note"),
      },
    },
    toolResult(({ project_id, description }) => post(`/projects/${project_id}/notes`, { description })),
  );
}
