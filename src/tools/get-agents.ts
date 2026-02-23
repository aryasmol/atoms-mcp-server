import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { atomsApi, formatApiError } from "../api.js";
import type { IAgentDTO } from "../types.js";

export function registerGetAgents(server: McpServer) {
  server.registerTool(
    "get_agents",
    {
      description:
        "List AI agents in your organization. Returns agent configuration including voice, LLM model, language settings, and call statistics.",
      inputSchema: {
        agent_name: z.string().optional().describe("Filter by agent name (partial match, case-insensitive)"),
        include_archived: z.boolean().default(false).describe("Include archived agents"),
        limit: z.number().default(20).describe("Max results to return (default 20, max 50)"),
      },
    },
    async (params) => {
      const limit = Math.min(params.limit, 50);

      const queryParams = new URLSearchParams({
        page: "1",
        offset: String(limit),
      });

      if (params.agent_name) {
        queryParams.set("search", params.agent_name);
      }
      if (params.include_archived) {
        queryParams.set("archived", "true");
      }

      const result = await atomsApi("GET", `/agent?${queryParams.toString()}`);

      if (!result.ok) {
        return { content: [{ type: "text" as const, text: formatApiError(result) }] };
      }

      const data = result.data?.data ?? result.data;
      const agents = (data?.agents ?? []).map((agent: IAgentDTO) => ({
        _id: agent._id,
        name: agent.name,
        description: agent.description,
        slmModel: agent.slmModel,
        synthesizer: agent.synthesizer,
        language: agent.language,
        allowInboundCall: agent.allowInboundCall,
        archived: agent.archived,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        firstMessage: agent.firstMessage,
        workflowType: agent.workflowType,
        backgroundSound: agent.backgroundSound,
        smartTurnConfig: agent.smartTurnConfig,
        denoisingConfig: agent.denoisingConfig,
        redactionConfig: agent.redactionConfig,
        totalCalls: agent.totalCalls ?? 0,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ count: agents.length, agents }, null, 2),
          },
        ],
      };
    }
  );
}
