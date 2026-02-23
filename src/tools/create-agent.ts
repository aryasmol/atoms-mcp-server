import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { atomsApi, formatApiError } from "../api.js";
import type { IAgentDTO, LanguageConfig } from "../types.js";

export function registerCreateAgent(server: McpServer) {
  server.registerTool(
    "create_agent",
    {
      description:
        "Create a new AI agent in your organization. Returns the created agent's ID. The agent prompt is set separately via update_agent_prompt after creation.",
      inputSchema: {
        name: z.string().optional().describe("Name for the new agent"),
        description: z.string().optional().describe("Short description of what the agent does"),
        language: z
          .string()
          .default("en")
          .describe("Default language code (e.g. en, hi, ta). Defaults to en."),
      },
    },
    async (params) => {
      const body: Partial<
        Pick<IAgentDTO, "name" | "description"> & {
          language: Pick<LanguageConfig, "default" | "supported"> & { switching: { isEnabled: boolean } };
        }
      > = {};

      if (params.name !== undefined) body.name = params.name;
      if (params.description !== undefined) body.description = params.description;

      body.language = {
        default: params.language,
        supported: [params.language],
        switching: { isEnabled: false },
      };

      const result = await atomsApi("POST", "/agent", body);

      if (!result.ok) {
        return { content: [{ type: "text" as const, text: formatApiError(result) }] };
      }

      const agentId = result.data?.data ?? result.data;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                message: "Agent created successfully",
                agentId,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
