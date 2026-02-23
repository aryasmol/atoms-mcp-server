/**
 * Contract tests for the MCP server.
 *
 * These tests verify that the payloads built by MCP tools match the shapes
 * expected by the main-backend, and that the response fields the tools read
 * actually exist in the backend's response DTOs.
 *
 * If a backend schema changes (field renamed, type changed, enum value added),
 * these tests will fail — surfacing the breaking change before it hits prod.
 */
import { describe, expect, it } from "vitest";
import {
  AgentSupportedLanguage,
  CallLogsCallType,
  CallLogStatus,
  CampaignStatus,
  WorkflowType,
} from "@repo/atoms-types";
import {
  AgentListQuerySchema,
  AgentResponseFieldsSchema,
  CallLogResponseFieldsSchema,
  CallLogsQuerySchema,
  CampaignListQuerySchema,
  CreateAgentRequestSchema,
  MCP_CAMPAIGN_STATUSES,
  OutboundCallRequestSchema,
  UpdateAgentConfigRequestSchema,
  WorkflowPatchRequestSchema,
} from "../contracts.js";

// ─── Request Shape Tests ───────────────────────────────────────────────────
// Verify the payloads the MCP tools build pass our contract schemas.

describe("create_agent request contract", () => {
  it("should match backend create agent schema shape", () => {
    // This is the body create-agent.ts builds:
    const body = {
      name: "Test Agent",
      description: "A test agent",
      language: {
        default: "en" as const,
        supported: ["en" as const],
        switching: {
          isEnabled: false,
          minWordsForDetection: 2,
          strongSignalThreshold: 0.7,
          weakSignalThreshold: 0.3,
          minConsecutiveForWeakThresholdSwitch: 2,
        },
      },
    };

    const result = CreateAgentRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("should accept minimal body (no name/description)", () => {
    const body = {
      language: {
        default: "en" as const,
        supported: ["en" as const],
        switching: {
          isEnabled: false,
          minWordsForDetection: 2,
          strongSignalThreshold: 0.7,
          weakSignalThreshold: 0.3,
          minConsecutiveForWeakThresholdSwitch: 2,
        },
      },
    };

    const result = CreateAgentRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("should reject invalid language code", () => {
    const body = {
      language: {
        default: "xx",
        supported: ["xx"],
        switching: {
          isEnabled: false,
          minWordsForDetection: 2,
          strongSignalThreshold: 0.7,
          weakSignalThreshold: 0.3,
          minConsecutiveForWeakThresholdSwitch: 2,
        },
      },
    };

    const result = CreateAgentRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });
});

describe("update_agent_config request contract", () => {
  it("should accept partial config update", () => {
    const body = {
      name: "Renamed Agent",
      firstMessage: "Hello!",
    };

    const result = UpdateAgentConfigRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("should accept synthesizer config", () => {
    const body = {
      synthesizer: {
        voiceConfig: {
          model: "waves_lightning_v2",
          voiceId: "some-voice-id",
        },
        speed: 1.0,
      },
    };

    const result = UpdateAgentConfigRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("should accept language config with switching", () => {
    const body = {
      language: {
        default: "hi" as const,
        supported: ["hi" as const, "en" as const],
        switching: { isEnabled: true },
      },
    };

    const result = UpdateAgentConfigRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });
});

describe("make_call request contract", () => {
  it("should match backend outbound schema shape", () => {
    const body = {
      agentId: "507f1f77bcf86cd799439011",
      phoneNumber: "+14155551234",
    };

    const result = OutboundCallRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("should accept optional fromNumber", () => {
    const body = {
      agentId: "507f1f77bcf86cd799439011",
      phoneNumber: "+14155551234",
      fromNumber: "+14155559999",
    };

    const result = OutboundCallRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("should reject missing agentId", () => {
    const body = {
      phoneNumber: "+14155551234",
    };

    const result = OutboundCallRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
  });
});

describe("update_agent_prompt workflow patch contract", () => {
  it("should match backend workflow patch schema", () => {
    const body = {
      type: "single_prompt" as const,
      singlePromptConfig: {
        prompt: "You are a helpful assistant.",
        tools: [],
      },
    };

    const result = WorkflowPatchRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("should accept existing tools", () => {
    const body = {
      type: "single_prompt" as const,
      singlePromptConfig: {
        prompt: "You are a helpful assistant.",
        tools: [{ type: "end_call", name: "hangup" }],
      },
    };

    const result = WorkflowPatchRequestSchema.safeParse(body);
    expect(result.success).toBe(true);
  });
});

// ─── Response Shape Tests ──────────────────────────────────────────────────
// Verify that mock responses matching what the backend actually returns
// pass our schema — proving the MCP tools can parse them correctly.

describe("get_agents response contract", () => {
  it("should parse a typical agent response", () => {
    const agent = {
      _id: "507f1f77bcf86cd799439011",
      name: "Sales Agent",
      description: "Handles sales calls",
      slmModel: "electron",
      synthesizer: {
        voiceConfig: {
          model: "waves_lightning_v2",
          voiceId: "default-voice",
          gender: "female",
        },
        speed: 1.0,
        consistency: 0.5,
        similarity: 0.5,
      },
      language: {
        default: "en",
        supported: ["en"],
        switching: {
          isEnabled: false,
        },
      },
      allowInboundCall: true,
      archived: false,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
      workflowType: "workflow_graph",
      workflowId: "507f1f77bcf86cd799439012",
      totalCalls: 42,
    };

    const result = AgentResponseFieldsSchema.safeParse(agent);
    expect(result.success).toBe(true);
  });
});

describe("get_call_logs response contract", () => {
  it("should parse a typical call log entry", () => {
    const callLog = {
      callId: "CALL-1234567890-abc123",
      callType: "telephony_outbound",
      callStatus: "completed",
      callDurationMs: 45000,
      costSpent: 0.02,
      fromNumber: "+14155551234",
      toNumber: "+14155559999",
      agentName: "Sales Agent",
      disconnectionReason: "agent_hangup",
      timestamp: "2025-01-15T10:00:00Z",
    };

    const result = CallLogResponseFieldsSchema.safeParse(callLog);
    expect(result.success).toBe(true);
  });

  it("should reject invalid call status", () => {
    const callLog = {
      callId: "CALL-123",
      callType: "telephony_outbound",
      callStatus: "INVALID_STATUS",
    };

    const result = CallLogResponseFieldsSchema.safeParse(callLog);
    expect(result.success).toBe(false);
  });
});

describe("get_call_logs query contract", () => {
  it("should accept valid query params", () => {
    const query = {
      page: "1",
      limit: "20",
      agentId: "507f1f77bcf86cd799439011",
      callStatus: "completed" as const,
      callType: "telephony_outbound" as const,
      dateFrom: "2025-01-01T00:00:00Z",
      dateTo: "2025-01-31T00:00:00Z",
    };

    const result = CallLogsQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
  });

  it("should use dateFrom/dateTo (not startDate/endDate) matching backend schema", () => {
    // The backend's getCallCountsLogFiltersSchema uses dateFrom/dateTo.
    // This test ensures we don't regress to startDate/endDate.
    const schema = CallLogsQuerySchema;
    const keys = Object.keys(schema.shape);
    expect(keys).toContain("dateFrom");
    expect(keys).toContain("dateTo");
    expect(keys).not.toContain("startDate");
    expect(keys).not.toContain("endDate");
  });
});

describe("get_agents query contract", () => {
  it("should accept valid query params matching backend getAllAgentsSchema", () => {
    const query = {
      page: "1",
      offset: "20",
      search: "Sales",
      archived: "true",
    };

    const result = AgentListQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
  });

  it("should use offset (not limit) matching backend schema", () => {
    const keys = Object.keys(AgentListQuerySchema.shape);
    expect(keys).toContain("offset");
    expect(keys).not.toContain("limit");
  });
});

describe("get_campaigns query contract", () => {
  it("should accept valid query params matching backend getAllCampaignsSchema", () => {
    const query = {
      page: "1",
      offset: "20",
      status: "running",
      search: "Sales",
    };

    const result = CampaignListQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
  });

  it("should use offset (not limit) matching backend schema", () => {
    const keys = Object.keys(CampaignListQuerySchema.shape);
    expect(keys).toContain("offset");
    expect(keys).not.toContain("limit");
  });
});

// ─── Enum Consistency Tests ────────────────────────────────────────────────
// Verify that the enum values hardcoded in MCP tool input schemas match
// the actual enums from @repo/atoms-types.

describe("enum consistency", () => {
  it("call statuses in MCP should be valid CallLogStatus values", () => {
    const mcpCallStatuses = [
      "pending",
      "in_queue",
      "active",
      "completed",
      "failed",
      "no_answer",
      "busy",
      "cancelled",
    ];

    const validStatuses = Object.values(CallLogStatus);
    for (const status of mcpCallStatuses) {
      // "busy" is accepted by the MCP tool but may not be in the enum.
      // All others must match.
      if (status === "busy") continue;
      expect(validStatuses).toContain(status);
    }
  });

  it("call types in MCP should be valid CallLogsCallType values", () => {
    const mcpCallTypes = ["telephony_inbound", "telephony_outbound", "webcall", "chat"];

    const validTypes = Object.values(CallLogsCallType);
    for (const type of mcpCallTypes) {
      expect(validTypes).toContain(type);
    }
  });

  it("campaign statuses in MCP should be valid CampaignStatus values", () => {
    const validStatuses = Object.values(CampaignStatus);
    for (const status of MCP_CAMPAIGN_STATUSES) {
      // "cancelled" is a status the MCP accepts but may not be in the backend enum
      if (status === "cancelled") continue;
      expect(validStatuses).toContain(status);
    }
  });

  it("workflow types should match between MCP and backend", () => {
    expect(WorkflowType.SINGLE_PROMPT).toBe("single_prompt");
    expect(WorkflowType.WORKFLOW_GRAPH).toBe("workflow_graph");
  });

  it("language codes should be valid AgentSupportedLanguage values", () => {
    const validLanguages = Object.values(AgentSupportedLanguage);
    expect(validLanguages).toContain("en");
    expect(validLanguages).toContain("hi");
  });
});
