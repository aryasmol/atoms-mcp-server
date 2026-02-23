import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { atomsApi, formatApiError } from "../api.js";

export function registerMakeCall(server: McpServer) {
  server.registerTool(
    "make_call",
    {
      description:
        "Initiate an outbound phone call using a specific agent. The agent will call the provided phone number and follow its configured prompt.",
      inputSchema: {
        agent_id: z.string().describe("The agent ID to use for the call"),
        phone_number: z.string().describe("Phone number to call in E.164 format (e.g. +14155551234)"),
        from_number: z
          .string()
          .optional()
          .describe(
            "Caller ID / from number in E.164 format. Must be a number owned by your org. If omitted, a default number is used."
          ),
      },
    },
    async (params) => {
      const body: { agentId: string; phoneNumber: string; fromNumber?: string } = {
        agentId: params.agent_id,
        phoneNumber: params.phone_number,
      };
      if (params.from_number) {
        body.fromNumber = params.from_number;
      }

      const result = await atomsApi("POST", "/conversation/outbound", body);

      if (!result.ok) {
        return { content: [{ type: "text" as const, text: formatApiError(result) }] };
      }

      const data = result.data?.data ?? result.data;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                message: "Outbound call initiated",
                callId: data?.callId,
                status: data?.status ?? "initiated",
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
