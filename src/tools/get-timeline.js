import { z } from "zod";
import { api } from "../client.js";
import { toolResult } from "./helpers.js";

export function registerGetTimeline(server) {
  server.registerTool(
    "get_timeline",
    {
      description:
        "Read the timeline of a project (notes, meetings and actions), newest first. " +
        "Pass `query` to search titles and descriptions.",
      inputSchema: {
        project_id: z.number().int().describe("Project id, from list_projects"),
        query: z.string().optional().describe("Text to search for, case-insensitive"),
        type: z.enum(["note", "meeting", "todo_action"]).optional().describe("Only entries of this type"),
        limit: z.number().int().min(1).max(100).optional().describe("Maximum entries (default 30)"),
      },
    },
    toolResult(({ project_id, query, type, limit }) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (type) params.set("type", type);
      if (limit) params.set("limit", String(limit));

      return api(`/projects/${project_id}/timeline?${params}`);
    }),
  );
}
