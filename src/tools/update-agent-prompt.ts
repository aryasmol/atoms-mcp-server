import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { atomsApi, formatApiError } from "../api.js";
import type { IAgentDTO } from "../types.js";

export function registerUpdateAgentPrompt(server: McpServer) {
  server.registerTool(
    "update_agent_prompt",
    {
      description:
        "Update an agent's system prompt / instructions. Pass the full new prompt text. This updates the agent's workflow with the new prompt.",
      inputSchema: {
        agent_id: z.string().describe("The agent ID to update"),
        prompt: z.string().describe("The new system prompt for the agent"),
      },
    },
    // @ts-expect-error - registerTool generic inference too deep for TS with this callback
    async (params: { agent_id: string; prompt: string }) => {
      // Step 1: Get the agent to find its workflowId and workflowType
      const agentResult = await atomsApi("GET", `/agent/${encodeURIComponent(params.agent_id)}`);

      if (!agentResult.ok) {
        if (agentResult.status === 404) {
          return {
            content: [{ type: "text" as const, text: `Agent not found: ${params.agent_id}` }],
          };
        }
        return { content: [{ type: "text" as const, text: formatApiError(agentResult) }] };
      }

      const agent = (agentResult.data?.data ?? agentResult.data) as IAgentDTO;
      const workflowId = agent?.workflowId;
      const workflowType: IAgentDTO["workflowType"] = agent?.workflowType;

      if (!workflowId) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Agent ${params.agent_id} has no workflow associated. Cannot update prompt.`,
            },
          ],
        };
      }

      // Step 2: Update the workflow with the new prompt
      // For SINGLE_PROMPT workflows, use singlePromptConfig
      // For WORKFLOW_GRAPH workflows, update the globalPrompt on the agent instead
      if (workflowType === "workflow_graph") {
        // For workflow graph agents, update the globalPrompt field on the agent
        const result = await atomsApi("PATCH", `/agent/${encodeURIComponent(params.agent_id)}`, {
          globalPrompt: params.prompt,
        });

        if (!result.ok) {
          return { content: [{ type: "text" as const, text: formatApiError(result) }] };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Agent ${params.agent_id} global prompt updated successfully.`,
            },
          ],
        };
      }

      // SINGLE_PROMPT: update via workflow endpoint
      // First get current workflow to preserve existing tools
      const workflowResult = await atomsApi(
        "GET",
        `/workflow/get-workflow?workflowId=${encodeURIComponent(workflowId)}`
      );

      if (!workflowResult.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to fetch existing workflow (needed to preserve tools): ${formatApiError(workflowResult)}`,
            },
          ],
        };
      }

      const existingTools = workflowResult.data?.data?.singlePromptConfig?.tools ?? [];

      const result = await atomsApi("PATCH", `/workflow/${encodeURIComponent(workflowId)}`, {
        type: "single_prompt",
        singlePromptConfig: {
          prompt: params.prompt,
          tools: existingTools,
        },
      });

      if (!result.ok) {
        return { content: [{ type: "text" as const, text: formatApiError(result) }] };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Agent ${params.agent_id} prompt updated successfully.`,
          },
        ],
      };
    }
  );
}
