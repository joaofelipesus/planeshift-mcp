import { z } from "zod";
import { post } from "../client.js";
import { toolResult } from "./helpers.js";

export function registerAddImportantLink(server) {
  server.registerTool(
    "add_important_link",
    {
      description: "Add a reference (an important link, like a dashboard or a doc) to a project.",
      inputSchema: {
        project_id: z.number().int().describe("Project id, from list_projects"),
        name: z.string().min(1).describe("Name of the reference"),
        url: z.string().url().describe("http or https URL"),
      },
    },
    toolResult(({ project_id, ...importantLink }) => post(`/projects/${project_id}/important_links`, importantLink)),
  );
}
