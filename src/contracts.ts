/**
 * API Contract definitions for the MCP server.
 *
 * These Zod schemas define the shapes of requests the MCP server sends to the
 * main-backend and the response fields it reads. They use types from
 * @repo/atoms-types to stay coupled with the backend — if the backend changes
 * a type, these schemas (and therefore the tests) break at compile time.
 */
import { z } from "zod";

import {
  AgentSupportedLanguage,
  AgentSupportedModel,
  AgentSynthesizerGender,
  AgentSynthesizerType,
  CallLogsCallType,
  CallLogStatus,
  CampaignStatus,
  WorkflowType,
  type IAgentDTO,
  type LanguageConfig,
  type SynthesizerConfig,
} from "@repo/atoms-types";

// ─── Agent Response Contract ───────────────────────────────────────────────
// Fields the MCP server reads from the GET /agent response.
// Sourced from IAgentDTO in @repo/atoms-types and the AgentDTOSchema
// in main-backend/__tests__/integration/helpers/schemas.ts.

export const AgentResponseFieldsSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  slmModel: z.nativeEnum(AgentSupportedModel),
  synthesizer: z.object({
    voiceConfig: z.object({
      model: z.nativeEnum(AgentSynthesizerType),
      voiceId: z.string(),
      gender: z.nativeEnum(AgentSynthesizerGender).optional(),
    }),
    speed: z.number(),
    consistency: z.number().optional(),
    similarity: z.number().optional(),
  }),
  language: z.object({
    default: z.nativeEnum(AgentSupportedLanguage),
    supported: z.array(z.nativeEnum(AgentSupportedLanguage)),
    switching: z.object({
      isEnabled: z.boolean(),
    }),
  }),
  allowInboundCall: z.boolean(),
  archived: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  firstMessage: z.string().optional(),
  workflowType: z.nativeEnum(WorkflowType).optional(),
  workflowId: z.union([z.string(), z.any()]),
  backgroundSound: z.string().optional(),
  smartTurnConfig: z
    .object({
      isEnabled: z.boolean(),
      waitTimeInSecs: z.number(),
    })
    .optional(),
  denoisingConfig: z.object({ isEnabled: z.boolean() }).optional(),
  redactionConfig: z.object({ isEnabled: z.boolean() }).optional(),
  totalCalls: z.number().optional(),
  globalPrompt: z.string().optional(),
});

// ─── Create Agent Request Contract ─────────────────────────────────────────
// Body the MCP server sends to POST /agent.

export const CreateAgentRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  language: z.object({
    default: z.nativeEnum(AgentSupportedLanguage),
    supported: z.array(z.nativeEnum(AgentSupportedLanguage)),
    switching: z.object({
      isEnabled: z.boolean(),
      minWordsForDetection: z.number(),
      strongSignalThreshold: z.number(),
      weakSignalThreshold: z.number(),
      minConsecutiveForWeakThresholdSwitch: z.number(),
    }),
  }),
});

// ─── Update Agent Config Request Contract ──────────────────────────────────
// Body shape the MCP server sends to PATCH /agent/:id.

export const UpdateAgentConfigRequestSchema = z
  .object({
    name: z.string(),
    description: z.string(),
    firstMessage: z.string(),
    allowInboundCall: z.boolean(),
    backgroundSound: z.string(),
    smartTurnConfig: z.object({
      isEnabled: z.boolean(),
      waitTimeInSecs: z.number().optional(),
    }),
    language: z.object({
      default: z.nativeEnum(AgentSupportedLanguage).optional(),
      supported: z.array(z.nativeEnum(AgentSupportedLanguage)).optional(),
      switching: z.object({ isEnabled: z.boolean() }),
    }),
    synthesizer: z
      .object({
        voiceConfig: z
          .object({
            model: z.string(),
            voiceId: z.string(),
          })
          .optional(),
        speed: z.number().optional(),
        consistency: z.number().optional(),
        similarity: z.number().optional(),
      })
      .optional(),
    globalPrompt: z.string(),
  })
  .partial();

// ─── Outbound Call Request Contract ────────────────────────────────────────
// Body the MCP server sends to POST /conversation/outbound.

export const OutboundCallRequestSchema = z.object({
  agentId: z.string(),
  phoneNumber: z.string(),
  fromNumber: z.string().optional(),
});

// ─── Call Logs Query Contract ──────────────────────────────────────────────
// Query params the MCP server sends to GET /analytics/call-counts-log.
// Key names MUST match getCallCountsLogFiltersSchema in
// main-backend/src/routes/analytics/analytics.validation.ts

export const CallLogsQuerySchema = z.object({
  page: z.string(),
  limit: z.string(),
  agentId: z.string().optional(),
  callStatus: z.nativeEnum(CallLogStatus).optional(),
  callType: z.nativeEnum(CallLogsCallType).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ─── Agent List Query Contract ────────────────────────────────────────────
// Query params the MCP server sends to GET /agent.
// Key names MUST match getAllAgentsSchema in
// main-backend/src/routes/agent/agent.validation.ts

export const AgentListQuerySchema = z.object({
  page: z.string(),
  offset: z.string(),
  search: z.string().optional(),
  archived: z.string().optional(),
});

// ─── Campaign List Query Contract ─────────────────────────────────────────
// Query params the MCP server sends to GET /campaign.
// Key names MUST match getAllCampaignsSchema in
// main-backend/src/routes/campaign/campaign.controller.ts

export const CampaignListQuerySchema = z.object({
  page: z.string(),
  offset: z.string(),
  status: z.string().optional(),
  search: z.string().optional(),
});

// ─── Call Log Response Fields Contract ─────────────────────────────────────
// Fields the MCP server reads from call log entries.

export const CallLogResponseFieldsSchema = z.object({
  callId: z.string(),
  callType: z.nativeEnum(CallLogsCallType),
  callStatus: z.nativeEnum(CallLogStatus),
  callDurationMs: z.number().optional(),
  costSpent: z.number().optional(),
  fromNumber: z.string().optional(),
  toNumber: z.string().optional(),
  agentName: z.string().optional(),
  campaignName: z.string().optional(),
  disconnectionReason: z.string().optional(),
  timestamp: z.string().optional(),
  recordingUrl: z.string().optional(),
});

// ─── Campaign Status Enum Contract ─────────────────────────────────────────
// The statuses the MCP server's get_campaigns tool accepts as filters.

export const MCP_CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "running",
  "paused",
  "completed",
  "cancelled",
] as const;

// ─── Workflow Patch Request Contract ───────────────────────────────────────
// Body the MCP server sends to PATCH /workflow/:id for prompt updates.

export const WorkflowPatchRequestSchema = z.object({
  type: z.literal("single_prompt"),
  singlePromptConfig: z.object({
    prompt: z.string(),
    tools: z.array(z.any()),
  }),
});

// ─── Type Assertions ───────────────────────────────────────────────────────
// Compile-time checks that the MCP server's assumed field names exist on the
// actual IAgentDTO interface. If IAgentDTO drops or renames a field, this
// file will fail to compile.

type AssertFieldExists<T, K extends keyof T> = K;

// Fields the get_agents tool reads from the response:
type _AgentFields =
  | AssertFieldExists<IAgentDTO, "_id">
  | AssertFieldExists<IAgentDTO, "name">
  | AssertFieldExists<IAgentDTO, "description">
  | AssertFieldExists<IAgentDTO, "slmModel">
  | AssertFieldExists<IAgentDTO, "synthesizer">
  | AssertFieldExists<IAgentDTO, "language">
  | AssertFieldExists<IAgentDTO, "allowInboundCall">
  | AssertFieldExists<IAgentDTO, "archived">
  | AssertFieldExists<IAgentDTO, "createdAt">
  | AssertFieldExists<IAgentDTO, "updatedAt">
  | AssertFieldExists<IAgentDTO, "firstMessage">
  | AssertFieldExists<IAgentDTO, "workflowType">
  | AssertFieldExists<IAgentDTO, "backgroundSound">
  | AssertFieldExists<IAgentDTO, "smartTurnConfig">
  | AssertFieldExists<IAgentDTO, "denoisingConfig">
  | AssertFieldExists<IAgentDTO, "redactionConfig">
  | AssertFieldExists<IAgentDTO, "totalCalls">
  | AssertFieldExists<IAgentDTO, "workflowId">
  | AssertFieldExists<IAgentDTO, "globalPrompt">;

// Fields the update_agent_prompt tool reads:
type _PromptFields =
  | AssertFieldExists<IAgentDTO, "workflowId">
  | AssertFieldExists<IAgentDTO, "workflowType">;

// Language config shape:
type _LangFields =
  | AssertFieldExists<LanguageConfig, "default">
  | AssertFieldExists<LanguageConfig, "supported">
  | AssertFieldExists<LanguageConfig, "switching">;

// Synthesizer config shape:
type _SynthFields =
  | AssertFieldExists<SynthesizerConfig, "voiceConfig">
  | AssertFieldExists<SynthesizerConfig, "speed">
  | AssertFieldExists<SynthesizerConfig, "consistency">
  | AssertFieldExists<SynthesizerConfig, "similarity">;
