import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { atomsApi, formatApiError } from "../api.js";
import type { IAgentDTO } from "../types.js";

export function registerGetUsageStats(server: McpServer) {
  server.registerTool(
    "get_usage_stats",
    {
      description:
        "Get call usage statistics for your organization — total calls, duration, costs, and status breakdown. Useful for understanding usage patterns and costs.",
      inputSchema: {
        start_date: z.string().optional().describe("Start date (ISO 8601). Defaults to 7 days ago."),
        end_date: z.string().optional().describe("End date (ISO 8601). Defaults to now."),
        agent_name: z.string().optional().describe("Filter to a specific agent (partial match)"),
      },
    },
    async (params) => {
      const startDate =
        params.start_date ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const endDate = params.end_date ?? new Date().toISOString().split("T")[0];

      // If filtering by agent, resolve agent ID first
      let agentId: string | undefined;
      if (params.agent_name) {
        const agentsResult = await atomsApi(
          "GET",
          `/agent?page=1&offset=5&search=${encodeURIComponent(params.agent_name)}`
        );
        if (!agentsResult.ok) {
          return { content: [{ type: "text" as const, text: formatApiError(agentsResult) }] };
        }
        const agents = (agentsResult.data?.data?.agents ?? []) as IAgentDTO[];
        if (agents.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No agents found matching your criteria." }],
          };
        }
        agentId = agents[0]._id;
      }

      const queryParams = new URLSearchParams({
        startDate,
        endDate,
      });
      if (agentId) queryParams.set("agentId", agentId);

      const result = await atomsApi("GET", `/analytics/summary?${queryParams.toString()}`);

      if (!result.ok) {
        return { content: [{ type: "text" as const, text: formatApiError(result) }] };
      }

      const data = result.data?.data ?? result.data;

      const summary = {
        period: { from: startDate, to: endDate },
        ...(params.agent_name ? { agentFilter: params.agent_name } : {}),
        stats: data,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(summary, null, 2) }],
      };
    }
  );
}
