import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerResources(server: McpServer) {
  server.resource(
    "platform-overview",
    "atoms://docs/platform-overview",
    { description: "Overview of the Atoms platform, key concepts, and terminology" },
    async () => ({
      contents: [
        {
          uri: "atoms://docs/platform-overview",
          mimeType: "text/markdown",
          text: `# Atoms Platform Overview

Atoms is a voice AI platform for building, deploying, and managing AI-powered voice agents.

## Key Concepts

### Agents
An Agent is a configured AI voice assistant. Each agent has:
- **LLM Model**: The language model powering the agent (e.g. GPT-4, Claude, Gemini)
- **Synthesizer (TTS)**: The text-to-speech voice (e.g. ElevenLabs, Smallest AI)
- **Transcriber (STT)**: The speech-to-text engine (e.g. Deepgram)
- **Workflow**: The conversation flow logic
- **Language**: Primary and supported languages
- **Post-Call Analytics**: Disposition metrics evaluated after each call

### Call Types
- **telephony_inbound**: Incoming phone calls to your agent
- **telephony_outbound**: Outbound calls made by your agent (campaigns or API-triggered)
- **webcall**: Browser-based voice calls via WebRTC
- **chat**: Text-based chat conversations

### Call Statuses
- **pending**: Call created, not yet dispatched
- **in_queue**: Waiting in dispatcher queue
- **active**: Currently in progress
- **completed**: Successfully finished
- **failed**: Ended with an error
- **no_answer**: Recipient didn't answer (outbound)
- **busy**: Recipient line busy (outbound)
- **cancelled**: Cancelled before connecting

### Campaigns
Outbound calling campaigns that dial a list of audience members using a specific agent.

### Post-Call Analytics
After a call completes, the platform can evaluate "disposition metrics" — structured data points extracted from the conversation (e.g., "Was the issue resolved?", "Customer sentiment score").

### Cost Breakdown
Each call has a cost breakdown:
- **llmCost**: LLM API usage
- **ttsCost**: Text-to-speech usage
- **transcriberCost**: Speech-to-text usage
- **telephonyCost**: Phone network charges
- **fixedCost**: Platform fee
- **totalCost**: Sum of all costs
`,
        },
      ],
    })
  );
}
