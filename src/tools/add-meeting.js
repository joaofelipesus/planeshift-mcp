import { z } from "zod";
import { post } from "../client.js";
import { toolResult } from "./helpers.js";

export function registerAddMeeting(server) {
  server.registerTool(
    "add_meeting",
    {
      description: "Record a meeting on the timeline of a project: what was discussed and decided.",
      inputSchema: {
        project_id: z.number().int().describe("Project id, from list_projects"),
        description: z.string().min(1).describe("What happened in the meeting"),
        title: z.string().optional().describe("Short title of the meeting"),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Day it took place, YYYY-MM-DD (default: today)"),
      },
    },
    toolResult(({ project_id, ...meeting }) => post(`/projects/${project_id}/meetings`, meeting)),
  );
}
