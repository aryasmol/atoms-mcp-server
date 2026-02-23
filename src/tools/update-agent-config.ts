import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { atomsApi, formatApiError } from "../api.js";
import type { LanguageConfig, SynthesizerConfig } from "../types.js";

export function registerUpdateAgentConfig(server: McpServer) {
  server.registerTool(
    "update_agent_config",
    {
      description:
        "Update an agent's configuration (name, language, first message, voice settings, etc.). Only provided fields are updated. To update the agent's prompt/instructions, use update_agent_prompt instead.",
      inputSchema: {
        agent_id: z.string().describe("The agent ID to update"),
        name: z.string().optional().describe("New agent name"),
        description: z.string().optional().describe("Agent description"),
        language: z
          .object({
            default: z.string().optional().describe("Default language code (e.g. en, hi)"),
            supported: z.array(z.string()).optional().describe("List of supported language codes"),
            switching_enabled: z
              .boolean()
              .optional()
              .describe("Enable automatic language switching during calls"),
          })
          .optional()
          .describe("Language configuration"),
        first_message: z.string().optional().describe("First message when call starts (max 500 chars)"),
        synthesizer: z
          .object({
            voiceConfig: z
              .object({
                model: z.string().describe("Voice model (e.g. waves_lightning_v2, waves_lightning_large)"),
                voiceId: z.string().describe("Voice ID"),
              })
              .optional()
              .describe("Voice model and ID configuration"),
            speed: z.number().optional().describe("Voice speed (0-2)"),
            consistency: z.number().optional().describe("Voice consistency (0-1)"),
            similarity: z.number().optional().describe("Voice similarity (0-1)"),
          })
          .optional()
          .describe("Voice synthesizer configuration"),
        allow_inbound_call: z.boolean().optional().describe("Whether to allow inbound calls"),
        smart_turn_config: z
          .object({
            isEnabled: z.boolean().optional(),
            waitTimeInSecs: z.number().optional(),
          })
          .optional()
          .describe("Smart turn detection configuration"),
        background_sound: z.string().optional().describe("Background sound option"),
      },
    },
    async (params) => {
      const body: {
        name?: string;
        description?: string;
        firstMessage?: string;
        allowInboundCall?: boolean;
        smartTurnConfig?: { isEnabled: boolean; waitTimeInSecs: number };
        backgroundSound?: string;
        language?: LanguageConfig;
        synthesizer?: SynthesizerConfig;
      } = {};
      if (params.name !== undefined) body.name = params.name;
      if (params.description !== undefined) body.description = params.description;
      if (params.first_message !== undefined) body.firstMessage = params.first_message;
      if (params.allow_inbound_call !== undefined) body.allowInboundCall = params.allow_inbound_call;
      if (params.smart_turn_config !== undefined)
        body.smartTurnConfig = params.smart_turn_config as typeof body.smartTurnConfig;
      if (params.background_sound !== undefined) body.backgroundSound = params.background_sound;

      // Language must be sent as a nested object
      if (params.language !== undefined) {
        body.language = {
          default: params.language.default as LanguageConfig["default"],
          supported: (params.language.supported ??
            (params.language.default ? [params.language.default] : undefined)) as LanguageConfig["supported"],
          ...(params.language.switching_enabled !== undefined && {
            switching: { isEnabled: params.language.switching_enabled },
          }),
        } as LanguageConfig;
      }

      // Synthesizer must be sent as a nested object matching backend schema
      if (params.synthesizer !== undefined) {
        body.synthesizer = {
          ...(params.synthesizer.voiceConfig && {
            voiceConfig: params.synthesizer.voiceConfig as SynthesizerConfig["voiceConfig"],
          }),
          ...(params.synthesizer.speed !== undefined && { speed: params.synthesizer.speed }),
          ...(params.synthesizer.consistency !== undefined && {
            consistency: params.synthesizer.consistency,
          }),
          ...(params.synthesizer.similarity !== undefined && { similarity: params.synthesizer.similarity }),
        } as SynthesizerConfig;
      }

      if (Object.keys(body).length === 0) {
        return {
          content: [{ type: "text" as const, text: "No fields provided to update." }],
        };
      }

      const result = await atomsApi("PATCH", `/agent/${encodeURIComponent(params.agent_id)}`, body);

      if (!result.ok) {
        if (result.status === 404) {
          return {
            content: [{ type: "text" as const, text: `Agent not found: ${params.agent_id}` }],
          };
        }
        return { content: [{ type: "text" as const, text: formatApiError(result) }] };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Agent ${params.agent_id} config updated successfully. Fields updated: ${Object.keys(body).join(", ")}`,
          },
        ],
      };
    }
  );
}
