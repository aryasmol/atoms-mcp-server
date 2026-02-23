import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { atomsApi, formatApiError } from "../api.js";
import type { ICampaignDTO } from "../types.js";

export function registerGetCampaigns(server: McpServer) {
  server.registerTool(
    "get_campaigns",
    {
      description:
        "List outbound calling campaigns for your organization. Shows campaign status, progress, agent used, and audience size.",
      inputSchema: {
        status: z
          .enum(["draft", "scheduled", "running", "paused", "completed", "cancelled"])
          .optional()
          .describe("Filter by campaign status"),
        agent_name: z.string().optional().describe("Filter by agent name (partial match)"),
        limit: z.number().default(20).describe("Max results (default 20, max 50)"),
      },
    },
    async (params) => {
      const limit = Math.min(params.limit, 50);

      const queryParams = new URLSearchParams({
        page: "1",
        offset: String(limit),
      });

      if (params.status) queryParams.set("status", params.status);
      if (params.agent_name) queryParams.set("search", params.agent_name);

      const result = await atomsApi("GET", `/campaign?${queryParams.toString()}`);

      if (!result.ok) {
        return { content: [{ type: "text" as const, text: formatApiError(result) }] };
      }

      const data = result.data?.data ?? result.data;
      const campaigns = (data?.campaigns ?? []).map((c: ICampaignDTO) => ({
        _id: c._id,
        name: c.name,
        status: c.status,
        agentName: c.agent?.name,
        scheduledAt: c.scheduledAt,
        createdAt: c.createdAt,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ count: campaigns.length, campaigns }, null, 2),
          },
        ],
      };
    }
  );
}
