# @developer-smallestai/atoms-mcp-server

MCP (Model Context Protocol) server that lets AI coding assistants interact with the Atoms platform — query call logs, manage agents, check usage stats, and more, directly from your IDE.

## Prerequisites

- Node.js >= 18
- An Atoms API key (Console → API Keys)

## Setup

### 1. Get your API key

Go to the [Atoms Console](https://console.smallest.ai) → **API Keys** and create a key.

### 2. Configure your MCP client

**Cursor** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "atoms": {
      "command": "npx",
      "args": ["-y", "@developer-smallestai/atoms-mcp-server"],
      "env": {
        "ATOMS_API_KEY": "sk_..."
      }
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "atoms": {
      "command": "npx",
      "args": ["-y", "@developer-smallestai/atoms-mcp-server"],
      "env": {
        "ATOMS_API_KEY": "sk_..."
      }
    }
  }
}
```

**VS Code (Claude Code extension)** (`.vscode/mcp.json`):

```json
{
  "servers": {
    "atoms": {
      "command": "npx",
      "args": ["-y", "@developer-smallestai/atoms-mcp-server"],
      "env": {
        "ATOMS_API_KEY": "sk_..."
      }
    }
  }
}
```

### Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ATOMS_API_KEY` | Yes | — | Your Atoms API key |
| `ATOMS_API_URL` | No | `https://atoms-api.smallest.ai/api/v1` | Override the API base URL (e.g. for staging) |

## Available Tools

### Agent Management

| Tool | Description |
|---|---|
| `get_agents` | List agents in your organization. Filter by name, include archived agents. Returns agent config, voice settings, language, call stats. |
| `create_agent` | Create a new agent. Accepts a name, description, and default language. The agent's prompt must be set separately via `update_agent_prompt`. |
| `update_agent_prompt` | Update an agent's system prompt / instructions. Handles both `single_prompt` and `workflow_graph` workflow types automatically. |
| `update_agent_config` | Update agent settings — name, description, language, first message, voice/synthesizer config, inbound call toggle, smart turn detection, and background sound. |
| `delete_agent` | Archive (soft-delete) an agent. The agent will no longer be active but can be recovered. |

### Calls & Campaigns

| Tool | Description |
|---|---|
| `make_call` | Initiate an outbound phone call using a specific agent. Provide the agent ID and a phone number in E.164 format. |
| `get_call_logs` | Query call logs with filters — status, type, agent name, phone number, date range, and error presence. |
| `debug_call` | Deep-dive into a single call by its call ID. Returns the full transcript, errors, timing breakdown, cost details, and post-call analytics. |
| `get_campaigns` | List outbound calling campaigns. Filter by status or agent name. Shows progress counts and scheduling info. |

### Account

| Tool | Description |
|---|---|
| `get_phone_numbers` | List all phone numbers in your account with their country, capabilities, status, and assigned agent. |
| `get_usage_stats` | Retrieve usage summary (calls, duration, costs) for a date range. Optionally filter by agent name. |

## Available Resources

| Resource | URI | Description |
|---|---|---|
| Platform Overview | `atoms://docs/platform-overview` | Key concepts, call types, statuses, campaigns, post-call analytics, and cost breakdown |

## Development

```bash
cd apps/mcp-server
./build.sh

# Run directly with tsx (no build step)
ATOMS_API_KEY=your-key npm run dev

# Type-check without emitting
npm run type-check
```

## License

MIT
