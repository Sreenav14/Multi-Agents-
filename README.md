# Multi-Agent Studio MVP

A multi-agent orchestration platform with LLM-driven tool calling. Build, test, and deploy AI assistants with multiple agents that can use external tools dynamically.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + TypeScript)                   │
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
│  │  │ assistants │ │    runs    │ │   chats    │ │   tools    │          │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘          │   │
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

## 📁 Complete File Structure

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
│   │   └── config.py              # Settings: DATABASE_URL, GROQ_API_KEY, LLM_MODEL
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
│   ├── routers/
│   │   ├── assistants.py          # CRUD for assistants
│   │   ├── chats.py               # Chat history management
│   │   ├── mcp_servers.py         # MCP server configuration
│   │   ├── run.py                 # Execute assistant runs
│   │   └── tools.py               # User tool connections
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── schemas.py             # Pydantic models for API
│   │   └── tools.py               # Tool-related schemas
│   │
│   ├── services/
│   │   └── tool_resolver.py       # Resolves tool configs per agent
│   │
│   └── tools/
│       ├── definitions.py         # ToolDefinition class & TOOL_REGISTRY
│       └── registry.py            # Tavily, Weather tool implementations
│
└── migrate_add_chat_id.py         # Database migration script
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── main.tsx                   # React entry point
│   ├── App.tsx                    # Router configuration
│   ├── style.css                  # Global styles
│   │
│   ├── api/                       # API client functions
│   │   ├── client.ts              # Axios instance
│   │   ├── assistants.ts          # Assistant CRUD
│   │   ├── chats.ts               # Chat management
│   │   ├── runs.ts                # Run execution
│   │   └── tools.ts               # Tool connections
│   │
│   ├── components/
│   │   ├── assistant/             # Assistant page components
│   │   │   ├── AgentList.tsx      # List of agents in graph
│   │   │   ├── AgentNode.tsx      # Single agent display
│   │   │   ├── AssistantHeader.tsx
│   │   │   ├── chatTranscripts.tsx
│   │   │   ├── MessageBubble.tsx  # Chat message with markdown
│   │   │   └── Playground.tsx     # Chat interface
│   │   │
│   │   ├── common/                # Reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── Spinner.tsx
│   │   │
│   │   └── studio/                # Studio workspace components
│   │       ├── AddToolsModal.tsx
│   │       ├── AssistantCard.tsx
│   │       ├── AssistantGrid.tsx
│   │       ├── FlowSection.tsx    # Agent flow order
│   │       ├── NewAssistantForm.tsx
│   │       ├── PromptsSection.tsx # Agent prompts editor
│   │       └── ToolsPanel.tsx
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAssistant.ts
│   │   ├── useAssistants.ts
│   │   └── useTools.ts
│   │
│   ├── layout/                    # App layout components
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   │
│   ├── pages/                     # Route pages
│   │   ├── HomePage.tsx
│   │   ├── StudioWorkspace.tsx    # Build assistants
│   │   ├── StudioDashboard/       # List assistants
│   │   ├── Assistantdetails/      # Chat with assistant
│   │   └── AssistantEditor/       # Edit assistant
│   │
│   ├── tools/                     # Frontend tool templates
│   │   ├── index.ts
│   │   └── tavily.ts
│   │
│   ├── types/
│   │   └── api.ts                 # TypeScript interfaces
│   │
│   └── utils/
│       └── assistantGraph.ts      # Graph parsing utilities
│
├── package.json
├── vite.config.ts
└── tsconfig.json
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

### Tool JSON Schema Format

```json
{
  "type": "function",
  "function": {
    "name": "tavily",
    "description": "Search the web for current information",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "The search query"
        }
      },
      "required": ["query"]
    }
  }
}
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

# Create .env file
echo "DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/agent" > .env
echo "GROQ_API_KEY=your-groq-api-key" >> .env

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GROQ_API_KEY` | Groq API key for LLM | Yes |
| `FRONTEND_URL` | Frontend URL (for CORS) | No |

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

---

## 🔧 Key Technologies

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM with connection pooling
- **PostgreSQL** - Primary database
- **Groq** - LLM provider (Llama 3.1)
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **react-markdown** - Markdown rendering

### External APIs
- **Tavily** - Web search
- **OpenWeatherMap** - Weather data

---

## 📝 Development Notes

### Database Optimizations
- Connection pooling (5 connections, 10 overflow)
- Cascade deletes on relationships
- Eager loading with `joinedload`
- SQL logging disabled in production

### Tool Calling Best Practices
- Max 10 tool iterations per agent
- Duplicate call detection to prevent infinite loops
- Automatic final response forcing
- Config injection for security

---

## 📄 License

MIT License
