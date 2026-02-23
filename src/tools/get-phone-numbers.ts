import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { atomsApi, formatApiError } from "../api.js";
import type { IPhoneNumberEntry } from "../types.js";

export function registerGetPhoneNumbers(server: McpServer) {
  server.registerTool(
    "get_phone_numbers",
    {
      description:
        "List phone numbers acquired by your organization. Shows number, country, capabilities, and which agent it's assigned to.",
      inputSchema: {},
    },
    async () => {
      const result = await atomsApi("GET", "/product/phone-numbers");

      if (!result.ok) {
        return { content: [{ type: "text" as const, text: formatApiError(result) }] };
      }

      const data = result.data?.data ?? result.data;
      const numbers = (Array.isArray(data) ? data : (data?.numbers ?? [])).map((n: IPhoneNumberEntry) => ({
        phoneNumber: n.attributes?.phoneNumber ?? n.phoneNumber,
        country: n.attributes?.countryCode ?? n.country,
        provider: n.attributes?.provider,
        assignedAgentId: n.agentId ?? n.agent?._id,
        isActive: n.isActive,
        productType: n.productType,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ count: numbers.length, numbers }, null, 2),
          },
        ],
      };
    }
  );
}
