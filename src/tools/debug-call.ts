import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { atomsApi, formatApiError } from "../api.js";

export function registerDebugCall(server: McpServer) {
  server.registerTool(
    "debug_call",
    {
      description:
        "Deep-dive into a single call for debugging. Returns full transcript, errors, timing, cost breakdown, post-call analytics, and agent config at time of call. Use a callId (e.g. CALL-1234567890-abc123).",
      inputSchema: {
        call_id: z.string().describe("The callId to debug (e.g. CALL-1234567890-abc123)"),
      },
    },
    async (params) => {
      const result = await atomsApi(
        "GET",
        `/analytics/conversation-details/${encodeURIComponent(params.call_id)}`
      );

      if (!result.ok) {
        if (result.status === 404) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Call not found: ${params.call_id}. Make sure you're using the full callId (e.g. CALL-1234567890-abc123).`,
              },
            ],
          };
        }
        return { content: [{ type: "text" as const, text: formatApiError(result) }] };
      }

      const data = result.data?.data ?? result.data;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );
}
