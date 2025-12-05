# Multi-Agent Studio MVP

A **Rowboat-style** multi-agent orchestration platform with LLM-driven tool calling. Build, test, and deploy AI assistants with multiple agents that can use external tools dynamically.

## ✨ Key Features

- **Multi-Agent Workflows** - Create sequential agent pipelines where each agent can see outputs from previous agents
- **LLM-Driven Tool Calling** - Agents autonomously decide when to use tools based on user queries
- **Built-in Tools** - Tavily web search, OpenWeatherMap weather, Gmail integration
- **MCP Server Support** - Connect custom tools via Model Context Protocol (MCP) HTTP servers
- **Google OAuth** - Secure Gmail integration with OAuth2 flow
- **Real-time Chat** - Interactive playground to test workflows before deployment
- **Beautiful UI** - Modern, warm cream theme with responsive design

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + JavaScript)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   HomePage   │  │   Studio     │  │  Dashboard   │  │  Assistant   │     │
│  │              │  │  Workspace   │  │              │  │    Page      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                 │                 │              │
│         └─────────────────┴─────────────────┴─────────────────┘              │
│                                    │                                         │
│                              API Layer (Axios)                               │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     │ HTTP/REST
┌────────────────────────────────────┼─────────────────────────────────────────┐
│                              BACKEND (FastAPI)                               │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐   │
│  │                           API Routers                                  │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │   │
│  │  │ assistants │ │    runs    │ │   tools    │ │ mcp_servers│          │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘          │   │
│  │  ┌────────────┐ ┌────────────┐                                        │   │
│  │  │   chats    │ │google_oauth│                                        │   │
│  │  └────────────┘ └────────────┘                                        │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                     │                                         │
│  ┌──────────────────────────────────┴────────────────────────────────────┐   │
│  │                        Agent Runtime                                   │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │   │
│  │  │  run_assistant  │───▶│ run_agent_with  │───▶│  Tool Registry  │    │   │
│  │  │     _graph      │    │     _tools      │    │  & Execution    │    │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘    │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                     │                                         │
│  ┌──────────────────────────────────┴────────────────────────────────────┐   │
│  │                         LLM Client (Groq)                              │   │
│  │           call_llm_with_tools() → Tool Calls → Execute → Loop          │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                     │                                         │
│  ┌──────────────────────────────────┴────────────────────────────────────┐   │
│  │                      Database (PostgreSQL)                             │   │
│  │  Assistants │ Chats │ Runs │ Messages │ Tools │ MCP Servers           │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

### Backend (`/backend`)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point, router registration
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   └── runtime.py             # Core agent orchestration & tool loop
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py              # Settings: DATABASE_URL, GROQ_API_KEY, Google OAuth
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py                # SQLAlchemy declarative base
│   │   ├── models.py              # All database models
│   │   └── session.py             # Engine, SessionLocal, get_db dependency
│   │
│   ├── llm/
│   │   └── client.py              # Groq API wrapper with tool calling support
│   │
│   ├── mcp/
│   │   ├── __init__.py
│   │   └── client.py              # MCP HTTP client for custom tool servers
│   │
│   ├── routers/
│   │   ├── assistants.py          # CRUD for assistants
│   │   ├── chats.py               # Chat history management
│   │   ├── google_oauth.py        # Google OAuth2 flow for Gmail
│   │   ├── mcp_servers.py         # MCP server configuration & management
│   │   ├── run.py                 # Execute assistant runs
│   │   └── tools.py               # User tool connections (Tavily, Gmail, etc.)
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── schemas.py             # Pydantic models for API
│   │   └── tools.py               # Tool-related schemas
│   │
│   ├── services/
│   │   ├── google_oauth.py        # Google OAuth token management
│   │   ├── mcp_tools.py           # MCP tool refresh service
│   │   └── tool_resolver.py       # Resolves tool configs per agent
│   │
│   └── tools/
│       ├── definitions.py         # ToolDefinition class & TOOL_REGISTRY
│       ├── gmail_helpers.py       # Gmail API helper functions
│       └── registry.py            # Tavily, Weather, Gmail, MCP implementations
│
└── .env                           # Environment variables
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── main.jsx                   # React entry point
│   ├── app.jsx                    # Router configuration
│   ├── style.css                  # Global styles + Tailwind
│   │
│   ├── api/                       # API client functions
│   │   ├── client.js              # Axios instance
│   │   ├── assistants.js          # Assistant CRUD
│   │   ├── chats.js               # Chat management
│   │   ├── runs.js                # Run execution
│   │   └── tools.js               # Tool & MCP server connections
│   │
│   ├── components/
│   │   ├── assistant/             # Assistant page components
│   │   │   ├── AgentList.jsx      # List of agents in graph
│   │   │   ├── AgentNode.jsx      # Single agent display
│   │   │   ├── AssistantHeader.jsx
│   │   │   ├── chatTranscripts.jsx
│   │   │   ├── MessageBubble.jsx  # Chat message with markdown
│   │   │   ├── Playground.jsx     # Chat interface
│   │   │   └── *.module.css       # Component-scoped styles
│   │   │
│   │   ├── common/                # Reusable components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── *.module.css       # Component-scoped styles
│   │   │
│   │   └── studio/                # Studio workspace components
│   │       ├── AddToolsModal.jsx  # Tool connection modal
│   │       ├── AssistantCard.jsx
│   │       ├── AssistantGrid.jsx
│   │       ├── FlowSection.jsx    # Agent flow order
│   │       ├── NewAssistantForm.jsx
│   │       ├── PromptsSection.jsx # Agent prompts editor
│   │       ├── ToolsPanel.jsx     # Connected tools display
│   │       └── *.module.css       # Component-scoped styles
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAssistant.js
│   │   ├── useAssistants.js
│   │   └── useTools.js
│   │
│   ├── layout/                    # App layout components
│   │   ├── AppShell.jsx
│   │   └── AppShell.module.css
│   │
│   ├── pages/                     # Route pages
│   │   ├── HomePage.jsx
│   │   ├── HomePage.module.css
│   │   ├── StudioWorkspace.jsx    # Build assistants
│   │   ├── StudioWorkspace.css
│   │   ├── StudioDashboard/       # List assistants
│   │   ├── Assistantdetails/      # Chat with assistant
│   │   └── AssistantEditor/       # Edit assistant
│   │
│   ├── tools/                     # Frontend tool templates
│   │   ├── index.js
│   │   └── tavily.js
│   │
│   ├── types/
│   │   └── api.js                 # Type definitions (JSDoc comments)
│   │
│   └── utils/
│       └── assistantGraph.js      # Graph parsing utilities
│
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 🔄 Data Flow

### 1. Creating & Running an Assistant

```
User Input → Frontend → POST /assistants/{id}/runs → Backend
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   run.py Router       │
                        │   - Create/get Chat   │
                        │   - Create Run        │
                        │   - Resolve tools     │
                        └───────────┬───────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   runtime.py          │
                        │   run_assistant_graph │
                        └───────────┬───────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
    ┌──────────┐             ┌──────────┐             ┌──────────┐
    │  Agent 1 │────────────▶│  Agent 2 │────────────▶│  Agent 3 │
    │ (Planner)│             │(Researcher)            │ (Writer) │
    └──────────┘             └──────────┘             └──────────┘
          │                         │                         │
          │                         ▼                         │
          │              ┌──────────────────┐                 │
          │              │ Tool Calling Loop│                 │
          │              │  - LLM decides   │                 │
          │              │  - Execute tools │                 │
          │              │  - Feed results  │                 │
          │              │  - Repeat...     │                 │
          │              └──────────────────┘                 │
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   Messages saved to   │
                        │   database            │
                        └───────────┬───────────┘
                                    │
                                    ▼
                              Response to User
```

### 2. Tool Calling Loop (Agentic)

```
┌─────────────────────────────────────────────────────────────────┐
│                    run_agent_with_tools()                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Build messages with system prompt + history                  │
│                          │                                       │
│                          ▼                                       │
│  2. call_llm_with_tools(messages, tool_schemas)                  │
│                          │                                       │
│                          ▼                                       │
│  3. LLM Response ───────┬──────────────────────────────────┐    │
│                         │                                   │    │
│           ┌─────────────┴─────────────┐                     │    │
│           ▼                           ▼                     │    │
│   Has tool_calls?              Has content only?            │    │
│           │                           │                     │    │
│           ▼                           ▼                     │    │
│   Execute each tool            Return final response        │    │
│   via TOOL_REGISTRY                   │                     │    │
│           │                           │                     │    │
│           ▼                           │                     │    │
│   Add tool results                    │                     │    │
│   to conversation                     │                     │    │
│           │                           │                     │    │
│           └──────────┬────────────────┘                     │    │
│                      │                                       │    │
│                      ▼                                       │    │
│              Loop back to step 2                             │    │
│              (max 10 iterations)                             │    │
│                                                              │    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔌 Database Models

### Entity Relationship

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Assistant     │       │      Chat       │       │      Run        │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │◄──────│ assistant_id    │       │ id              │
│ name            │       │ id              │◄──────│ chat_id         │
│ description     │       │ title           │       │ assistant_id    │
│ graph_json      │       │ created_at      │       │ status          │
│ created_at      │       │ updated_at      │       │ input_text      │
│ updated_at      │       └─────────────────┘       │ created_at      │
└─────────────────┘                                 │ completed_at    │
         │                                          │ error_message   │
         │ cascade                                  └─────────────────┘
         ▼                                                   │
┌─────────────────┐                                          │ cascade
│ UserToolConnection │                                       ▼
├─────────────────┤                                 ┌─────────────────┐
│ id              │                                 │    Message      │
│ name            │                                 ├─────────────────┤
│ template_key    │                                 │ id              │
│ config_json     │                                 │ run_id          │
│ status          │                                 │ sender          │
└─────────────────┘                                 │ content         │
                                                    │ message_metadata│
┌─────────────────┐                                 │ created_at      │
│   MCPServer     │                                 └─────────────────┘
├─────────────────┤
│ id              │
│ name            │
│ server_type     │
│ endpoint        │
│ config_json     │
└─────────────────┘
         │
         │ cascade
         ▼
┌─────────────────┐
│    MCPTool      │
├─────────────────┤
│ id              │
│ server_id       │
│ name            │
│ description     │
│ schema_json     │
│ enabled         │
└─────────────────┘
```

---

## 🛠️ Tool System

### Available Tools

| Tool | Description | Config Required |
|------|-------------|-----------------|
| **Tavily** | Web search for current/real-time information | `api_key` |
| **Weather** | Current weather via OpenWeatherMap | `api_key` |
| **Gmail** | Read emails, search, create drafts | Google OAuth |
| **MCP** | Proxy for custom MCP server tools | `endpoint`, `config_json` |

### How Tools Work

1. **Tool Definition**: Each tool has a JSON schema (for LLM) and a handler function
2. **Registration**: Tools are registered with `TOOL_REGISTRY`
3. **LLM Decision**: The LLM sees tool schemas and decides when to call them
4. **Execution**: We execute the tool and feed results back to LLM
5. **Config Injection**: API keys are injected server-side (never exposed to LLM)

### Adding a New Tool

```python
# backend/app/tools/registry.py

from app.tools.definitions import ToolDefinition, register_tool

def _my_tool_handler(args: Dict[str, Any]) -> str:
    """Execute the tool"""
    # Get LLM-provided arguments
    query = args.get("query", "")
    
    # Get injected config (API key)
    api_key = args.get("_config_api_key")
    if not api_key:
        return "Error: API key not configured"
    
    # Execute and return result
    result = call_external_api(query, api_key)
    return result

register_tool(ToolDefinition(
    name="my_tool",
    description="Description for LLM to understand when to use this tool",
    parameters={
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "What to search for"
            }
        },
        "required": ["query"]
    },
    handler=_my_tool_handler,
    require_config=["api_key"]  # Will be injected as _config_api_key
))
```

---

## 🎨 UI Theme

The application uses a **warm cream/white theme**:

| Element | Color | Hex |
|---------|-------|-----|
| Background | Cream | `#FAF8F3` |
| Secondary BG | Light Cream | `#F5F1E8` |
| Border | Warm Gray | `#E8E0D4` / `#D4C9B8` |
| Primary Text | Dark Brown | `#2C2416` |
| Secondary Text | Brown | `#5A4A3A` |
| Muted Text | Light Brown | `#8B7A6B` |
| Button | Brown | `#6B5B4F` |
| Deploy Button | Green | `#4A7C59` |

---

## 🚀 Setup & Running

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables section)

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server (default port 5173)
npm run dev
```

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/agent

# LLM
GROQ_API_KEY=your-groq-api-key

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:5173

# Google OAuth (for Gmail integration)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/oauth/google/callback
```

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GROQ_API_KEY` | Groq API key for LLM | Yes |
| `FRONTEND_URL` | Frontend URL for CORS/redirects | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Gmail |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | For Gmail |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect URI | For Gmail |

---

## 📡 API Endpoints

### Assistants
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assistants` | List all assistants |
| POST | `/assistants` | Create new assistant |
| GET | `/assistants/{id}` | Get assistant by ID |
| DELETE | `/assistants/{id}` | Delete assistant |
| PUT | `/assistants/{id}/graph` | Update assistant graph |

### Runs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/assistants/{id}/runs` | Execute assistant run |

### Chats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/assistants/{id}/chats` | List chats for assistant |
| GET | `/assistants/{id}/chats/{chat_id}` | Get chat with messages |
| DELETE | `/assistants/{id}/chats/{chat_id}` | Delete chat |

### Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tools` | List connected tools |
| POST | `/tools` | Connect a new tool |
| DELETE | `/tools/{id}` | Disconnect tool |
| POST | `/tools/gmail/connect` | Start Gmail OAuth flow |

### MCP Servers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mcp_servers` | List MCP servers |
| POST | `/mcp_servers` | Add MCP server |
| DELETE | `/mcp_servers/{id}` | Remove MCP server |
| POST | `/mcp_servers/{id}/refresh_tools` | Refresh tools from server |

### OAuth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oauth/google/login` | Start Google OAuth flow |
| GET | `/oauth/google/callback` | Google OAuth callback |

---

## 🔧 Key Technologies

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM with PostgreSQL/JSONB support
- **PostgreSQL** - Primary database with JSONB for configs
- **Groq** - LLM provider (Llama 3.1 8B Instant)
- **Pydantic** - Data validation
- **Google API Client** - Gmail integration

### Frontend
- **React 19** - UI framework
- **JavaScript** - Plain JS (no TypeScript)
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Utility-first styling
- **CSS Modules** - Scoped component styles
- **React Router 7** - Navigation
- **Axios** - HTTP client
- **react-markdown** - Markdown rendering

### External APIs
- **Tavily** - Web search
- **OpenWeatherMap** - Weather data
- **Google Gmail API** - Email access
- **MCP Protocol** - Custom tool servers

---

## 📝 Development Notes

### Database Optimizations
- Connection pooling (5 connections, 10 overflow)
- Cascade deletes on relationships
- JSONB columns for flexible configs
- SQL logging disabled in production

### Tool Calling Best Practices
- Max 10 tool iterations per agent
- Duplicate call detection to prevent infinite loops
- Automatic final response forcing
- Config injection for security (API keys never in prompts)

### Gmail Integration
- OAuth2 with automatic token refresh
- Scopes: `gmail.readonly`, `gmail.compose`
- Actions: list_recent, search, top_emails, draft

### MCP Server Protocol
- HTTP-based communication
- Endpoints: `/tools` (list), `/call` (execute)
- Config passthrough for stateless servers

---

## 🐛 Troubleshooting

### Common Issues

**"Groq API key not configured"**
- Ensure `GROQ_API_KEY` is set in your `.env` file

**"Gmail is not connected"**
- Click "Connect Gmail" in the Tools panel
- Complete the Google OAuth flow
- Ensure Google Cloud Console has Gmail API enabled

**Tool not executing**
- Check that the tool status is "connected"
- Verify API keys are configured correctly
- Check backend logs for detailed errors

**MCP server connection failed**
- Verify the endpoint URL is accessible
- Check that the MCP server is running
- Ensure `/tools` and `/call` endpoints are implemented

---

## 📄 License

MIT License
