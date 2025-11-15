# Multi-Agent MVP - Complete Documentation

A full-stack application for creating and running multi-agent AI assistants with a React frontend and FastAPI backend.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Frontend Structure](#frontend-structure)
- [Backend Structure](#backend-structure)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)

---

## 🎯 Overview

This is a Multi-Agent MVP application that allows users to:
- **Create AI Assistants** with custom agent graphs (Planner → Researcher → Writer)
- **Run Assistants** with user input and get multi-agent responses
- **View History** of all runs and messages
- **Manage Assistants** through a modern web interface

The system uses a graph-based architecture where agents process information sequentially, with each agent building upon the previous agent's output.

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React Frontend│  ──────▶│  FastAPI Backend│  ──────▶│  PostgreSQL DB  │
│   (Vite + TS)   │         │   (Python)      │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                      │
                                      ▼
                            ┌─────────────────┐
                            │  Multi-Agent    │
                            │  Runtime Engine │
                            └─────────────────┘
```

### Flow:
1. User creates an Assistant with name, description, and spec
2. Backend generates a default agent graph (Planner → Researcher → Writer)
3. User submits input text to run the assistant
4. Runtime engine processes through each agent sequentially
5. All messages are stored and returned to the frontend

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Relational database
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client

---

## 📁 Project Structure

```
agent-mvp/
├── backend/
│   └── app/
│       ├── main.py                 # FastAPI app entry point
│       ├── core/
│       │   └── config.py           # Configuration (DB, API keys)
│       ├── db/
│       │   ├── base.py              # SQLAlchemy Base
│       │   ├── models.py            # Database models
│       │   └── session.py           # Database session management
│       ├── routers/
│       │   ├── assistants.py        # Assistant CRUD endpoints
│       │   └── run.py               # Run execution endpoints
│       ├── schemas.py               # Pydantic schemas
│       └── agents/
│           └── runtime.py           # Multi-agent orchestration
├── frontend/
│   └── src/
│       ├── main.tsx                 # React app entry point
│       ├── app.tsx                 # Router configuration
│       ├── api/
│       │   ├── client.ts            # Axios client setup
│       │   ├── assistants.ts       # Assistant API functions
│       │   └── runs.ts              # Run API functions
│       └── pages/
│           ├── StudioDashboard.tsx  # Main dashboard
│           └── AssistantPage.tsx    # Individual assistant page
└── .env                             # Environment variables
```

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 12+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment (if not exists):**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-dotenv
   ```

4. **Create `.env` file in `backend/` directory:**
   ```env
   DATABASE_URL=postgresql+psycopg2://postgres:sreenav@localhost:5432/agent
   FRONTEND_URL=http://localhost:5173
   GROQ_API_KEY=your_groq_api_key_here
   ```

5. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE agent;
   ```

6. **Run the backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file (optional):**
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Run the frontend:**
   ```bash
   npm run dev
   ```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Interactive API Docs
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Endpoints

#### Health Check
```
GET /health
```
Returns server status.

**Response:**
```json
{
  "status": "ok"
}
```

#### Assistants

##### List All Assistants
```
GET /assistants
```
Returns all assistants ordered by creation date.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Trip Planner",
    "description": "Helps plan trips",
    "spec": "Plan trips given city and dates",
    "graph_json": {...},
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

##### Get Assistant by ID
```
GET /assistants/{assistant_id}
```
Returns a specific assistant.

**Response:** Same as above (single object)

##### Create Assistant
```
POST /assistants
```
Creates a new assistant with a default agent graph.

**Request Body:**
```json
{
  "name": "Assistant Name",
  "description": "Optional description",
  "spec": "Optional specification"
}
```

**Response:** Assistant object with generated `graph_json`

#### Runs

##### Create Run for Assistant
```
POST /assistants/{assistant_id}/runs
```
Starts a new run for an assistant. Executes the multi-agent graph.

**Request Body:**
```json
{
  "input_text": "User's input text"
}
```

**Response:**
```json
{
  "id": 1,
  "assistant_id": 1,
  "status": "completed",
  "input_text": "User's input",
  "created_at": "2024-01-01T00:00:00",
  "completed_at": "2024-01-01T00:00:01",
  "error_message": null,
  "messages": [
    {
      "id": 1,
      "run_id": 1,
      "sender": "user",
      "content": "User's input",
      "message_metadata": null,
      "created_at": "2024-01-01T00:00:00"
    },
    {
      "id": 2,
      "run_id": 1,
      "sender": "planner",
      "content": "Agent response...",
      "message_metadata": null,
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

##### Get Run by ID
```
GET /runs/{run_id}
```
Returns a run with all its messages.

**Response:** Same as Create Run response

---

## 🗄️ Database Schema

### Assistant Table
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| name | String(255) | Assistant name |
| description | Text | Optional description |
| spec | Text | Optional specification |
| graph_json | JSONB | Agent graph configuration |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### Run Table
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| assistant_id | Integer | Foreign key to Assistant |
| status | String(50) | Status: "created", "running", "completed", "failed" |
| input_text | Text | User's input text |
| created_at | DateTime | Creation timestamp |
| completed_at | DateTime | Completion timestamp (nullable) |
| error_message | Text | Error message if failed (nullable) |

### Message Table
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| run_id | Integer | Foreign key to Run |
| sender | String(100) | Sender: "user" or agent ID |
| content | Text | Message content |
| message_metadata | JSONB | Optional metadata |
| created_at | DateTime | Creation timestamp |

### Relationships
- **Assistant** has many **Runs** (one-to-many)
- **Run** has many **Messages** (one-to-many)
- **Run** belongs to one **Assistant** (many-to-one)

---

## 🎨 Frontend Structure

### Components

#### `StudioDashboard.tsx`
Main dashboard page that displays:
- List of all assistants in a grid
- "New Assistant" button to create assistants
- Slide-over panel for creating new assistants
- Error handling and loading states

**Features:**
- Fetches and displays all assistants
- Creates new assistants via form
- Navigates to assistant detail page on click

#### `AssistantPage.tsx`
Individual assistant page (placeholder for now).

### API Layer

#### `api/client.ts`
Axios client configuration:
- Base URL from environment variable
- JSON content type headers
- Error interceptors

#### `api/assistants.ts`
Assistant API functions:
- `fetchAssistants()` - Get all assistants
- `fetchAssistant(id)` - Get single assistant
- `createAssistant(payload)` - Create new assistant

#### `api/runs.ts`
Run API functions:
- `createRun(assistantId, inputText)` - Start a run
- `fetchRunById(runId)` - Get run with messages

### Routing
- `/` - Studio Dashboard
- `/assistants/:assistantId` - Assistant detail page

---

## ⚙️ Backend Structure

### Main Application (`main.py`)
- FastAPI app initialization
- CORS middleware configuration
- Router registration
- Database table creation on startup

### Routers

#### `routers/assistants.py`
Handles assistant CRUD operations:
- `GET /assistants` - List all
- `GET /assistants/{id}` - Get one
- `POST /assistants` - Create new

**Default Graph Generation:**
When creating an assistant, a default graph is generated with:
- **Planner** agent - Breaks down user request into steps
- **Researcher** agent - Generates relevant information
- **Writer** agent - Creates final answer

#### `routers/run.py`
Handles run execution:
- `POST /assistants/{id}/runs` - Start a run
- `GET /runs/{id}` - Get run with messages

**Run Flow:**
1. Creates Run with status "running"
2. Calls `run_assistant_graph()` to execute agents
3. Updates status to "completed" or "failed"
4. Returns run with all messages

### Database Models (`db/models.py`)

#### Assistant Model
```python
class Assistant(Base):
    id: int
    name: str
    description: Optional[str]
    spec: Optional[str]
    graph_json: dict  # JSONB in PostgreSQL
    created_at: datetime
    updated_at: datetime
    runs: relationship("Run")
```

#### Run Model
```python
class Run(Base):
    id: int
    assistant_id: int
    status: str  # "created", "running", "completed", "failed"
    input_text: str
    created_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str]
    assistant: relationship("Assistant")
    messages: relationship("Message")
```

#### Message Model
```python
class Message(Base):
    id: int
    run_id: int
    sender: str  # "user" or agent ID
    content: str
    message_metadata: Optional[dict]  # JSONB
    created_at: datetime
    run: relationship("Run")
```

### Runtime Engine (`agents/runtime.py`)

#### `run_assistant_graph(db, assistant, run)`
Main orchestration function:

1. **Creates user message** from `run.input_text`
2. **Iterates through graph nodes** in order
3. **For each agent node:**
   - Builds prompt using `_build_prompt_for_agent()`
   - Calls LLM (currently dummy function)
   - Creates and stores agent message
4. **Returns all messages**

#### `_build_prompt_for_agent(node, messages)`
Constructs prompt for an agent:
- Includes agent's `system_prompt` from graph
- Includes conversation history
- Adds role context

#### `_dummy_llm_call(prompt, agent_id)`
Placeholder LLM function. **TODO:** Replace with real Groq API call.

---

## 🏃 Running the Application

### Start Backend
```bash
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend will be available at: http://127.0.0.1:8000

### Start Frontend
```bash
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:5173

### Access Points
- **Frontend:** http://localhost:5173
- **Backend API:** http://127.0.0.1:8000
- **API Docs:** http://127.0.0.1:8000/docs
- **Health Check:** http://127.0.0.1:8000/health

---

## 🔧 Development Workflow

### Adding a New Endpoint

1. **Create schema** in `schemas.py`:
   ```python
   class MySchema(BaseModel):
       field: str
   ```

2. **Add route** in appropriate router:
   ```python
   @router.post("/my-endpoint")
   def my_endpoint(data: MySchema, db: Session = Depends(get_db)):
       # Implementation
   ```

3. **Add frontend API function** in `api/` directory:
   ```typescript
   export async function myFunction(data: MySchema) {
     const res = await apiClient.post("/my-endpoint", data);
     return res.data;
   }
   ```

### Adding a New Agent Type

1. **Update `build_default_graph_json()`** in `routers/assistants.py`
2. **Add new node** to the nodes array with:
   - `id`: unique identifier
   - `type`: "agent"
   - `role`: display name
   - `system_prompt`: agent instructions
3. **Update edges** to include new agent in flow

### Integrating Real LLM

Replace `_dummy_llm_call()` in `agents/runtime.py`:

```python
import groq

def _real_llm_call(prompt: str, agent_id: str) -> str:
    client = groq.Groq(api_key=settings.Groq_API_KEY)
    response = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content
```

---

## 📝 Environment Variables

### Backend (`.env` in `backend/`)
```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/dbname
FRONTEND_URL=http://localhost:5173
GROQ_API_KEY=your_api_key_here
```

### Frontend (`.env` in `frontend/`)
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🐛 Common Issues

### Backend Issues

**Error: "Could not import module 'app'"**
- **Solution:** Run from `backend/` directory: `uvicorn app.main:app --reload`

**Error: "password authentication failed"**
- **Solution:** Check PostgreSQL credentials in `.env` file

**Error: "ModuleNotFoundError: No module named 'app'"**
- **Solution:** Make sure you're in the `backend/` directory when running uvicorn

### Frontend Issues

**Error: "Cannot find module 'axios'"**
- **Solution:** Run `npm install` in `frontend/` directory

**Error: Tailwind CSS PostCSS error**
- **Solution:** Already fixed - uses `@tailwindcss/postcss` for v4

**Error: JSX not recognized**
- **Solution:** Ensure `tsconfig.json` has `"jsx": "react-jsx"`

---

## 🚧 TODO / Future Enhancements

- [ ] Replace dummy LLM with real Groq API integration
- [ ] Add authentication and user management
- [ ] Implement custom graph editor in frontend
- [ ] Add real-time updates for running agents
- [ ] Add message streaming
- [ ] Implement agent memory/context management
- [ ] Add error recovery mechanisms
- [ ] Add unit and integration tests
- [ ] Implement caching for assistant graphs
- [ ] Add export/import functionality for assistants

---

## 📚 Key Concepts

### Agent Graph
A JSON structure defining the flow of agents:
```json
{
  "nodes": [
    {"id": "planner", "type": "agent", "role": "Planner", "system_prompt": "..."},
    {"id": "researcher", "type": "agent", "role": "Researcher", "system_prompt": "..."},
    {"id": "writer", "type": "agent", "role": "Writer", "system_prompt": "..."}
  ],
  "edges": [
    {"from": "planner", "to": "researcher"},
    {"from": "researcher", "to": "writer"}
  ]
}
```

### Run Execution Flow
1. User submits input → Creates Run with status "running"
2. Runtime creates user message
3. For each agent in graph:
   - Build prompt from history + agent system_prompt
   - Call LLM
   - Save agent message
4. Update Run status to "completed"
5. Return Run with all messages

---

## 📄 License

This is an MVP project for demonstration purposes.

---

## 👥 Contributing

This is a personal MVP project. For questions or issues, please refer to the code comments or create an issue.

---

**Last Updated:** 2024
**Version:** 1.0.0

