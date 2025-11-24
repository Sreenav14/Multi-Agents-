# Multi-Agent Assistant MVP

A simple web app for creating AI assistants that work together. Each assistant uses three AI agents (Planner, Researcher, Writer) to answer your questions.

## What This Does

- **Create Assistants** - Give them a name and description
- **Ask Questions** - Type a question and get a detailed answer
- **See How It Works** - Watch as the Planner, Researcher, and Writer work together
- **Manage Assistants** - View, delete, and organize your assistants

## How It Works

1. You create an assistant and give it a name
2. You ask it a question
3. The **Planner** breaks down your question into steps
4. The **Researcher** finds information about your question
5. The **Writer** puts it all together into a clear answer

## What You Need

- Python 3.11 or newer
- Node.js 18 or newer
- PostgreSQL database
- A Groq API key (get one at https://console.groq.com)

## Quick Setup

### 1. Backend Setup

```bash
# Go to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Activate it (Mac/Linux)
source venv/bin/activate

# Install packages
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-dotenv groq

# Create .env file in backend/ folder with:
# DATABASE_URL=postgresql+psycopg2://postgres:password@localhost:5432/agent
# GROQ_API_KEY=your_groq_api_key_here

# Create the database in PostgreSQL
# (Open psql and run: CREATE DATABASE agent;)

# Start the backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup

```bash
# Go to frontend folder
cd frontend

# Install packages
npm install

# Start the frontend
npm run dev
```

### 3. Open the App

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## How to Use

1. **Start both servers** (backend and frontend)
2. **Go to** http://localhost:5173
3. **Click "New Assistant"** to create one
4. **Click on an assistant** to open it
5. **Type a question** in the playground
6. **Click "Run"** and watch the agents work!

## Complete File Structure

### Backend Files

#### Root Level
- **`migrate_add_chat_id.py`** - Database migration script to add chat_id to runs table

#### `backend/app/` - Main Application
- **`__init__.py`** - Python package initialization
- **`main.py`** - FastAPI application entry point, CORS configuration, router registration

#### `backend/app/core/` - Core Configuration
- **`__init__.py`** - Package initialization
- **`config.py`** - Application settings (database URL, Groq API key, LLM model configuration)

#### `backend/app/db/` - Database Layer
- **`__init__.py`** - Package initialization
- **`base.py`** - SQLAlchemy Base class for all models
- **`models.py`** - Database models (Assistant, Chat, Run, Message, MCPServer, MCPTool, UserToolConnection)
- **`session.py`** - Database session factory and dependency injection

#### `backend/app/routers/` - API Endpoints
- **`assistants.py`** - Assistant CRUD operations (GET, POST, PUT, DELETE, graph updates)
- **`chats.py`** - Chat history endpoints (list chats, get chat messages)
- **`mcp_servers.py`** - MCP server management (list, create servers)
- **`run.py`** - Workflow execution endpoint (POST runs)
- **`tools.py`** - User tools management (CRUD operations)

#### `backend/app/agents/` - Agent Logic
- **`__init__.py`** - Package initialization
- **`prompts.py`** - Agent prompt templates and system prompts
- **`runtime.py`** - Agent graph execution engine, sequential agent processing

#### `backend/app/llm/` - LLM Integration
- **`client.py`** - Groq API client wrapper, LLM request handling

#### `backend/app/schemas/` - Data Validation
- **`__init__.py`** - Package initialization
- **`schemas.py`** - Pydantic models for assistants, chats, runs, messages
- **`tools.py`** - Pydantic models for tools and MCP servers

### Frontend Files

#### Root Configuration
- **`frontend/package.json`** - NPM dependencies and scripts
- **`frontend/package-lock.json`** - Locked dependency versions
- **`frontend/vite.config.ts`** - Vite build configuration
- **`frontend/tsconfig.json`** - TypeScript compiler configuration
- **`frontend/tailwind.config.js`** - Tailwind CSS configuration
- **`frontend/postcss.config.js`** - PostCSS configuration
- **`frontend/index.html`** - HTML entry point

#### `frontend/src/` - Source Code

##### Entry Points
- **`main.tsx`** - React application entry point, renders App component
- **`app.tsx`** - Main App component with React Router setup and route definitions

##### `frontend/src/pages/` - Page Components
- **`HomePage.tsx`** - Landing page with hero section and navigation buttons
- **`HomePage.module.css`** - Styles for home page (cream theme)
- **`StudioDashboard/StudioDashboard.tsx`** - Dashboard page listing all assistants
- **`StudioWorkspace.tsx`** - Main Studio workspace for building workflows (prompts, flow, chat)
- **`StudioWorkspace.css`** - Styles for Studio workspace (cream theme)
- **`Assistantdetails/AssistantPage.tsx`** - Assistant detail page with playground
- **`AssistantEditor/AssistantEditor.tsx`** - Legacy editor component (deprecated, functionality moved to StudioWorkspace)

##### `frontend/src/components/` - Reusable Components

**`common/` - Shared Components**
- **`Button.tsx`** - Reusable button component
- **`Button.module.css`** - Button styles
- **`Card.tsx`** - Card container component
- **`Card.module.css`** - Card styles
- **`EmptyState.tsx`** - Empty state placeholder component
- **`EmptyState.module.css`** - Empty state styles
- **`Spinner.tsx`** - Loading spinner component

**`studio/` - Studio-Specific Components**
- **`PromptsSection.tsx`** - Component for creating/editing agent prompts
- **`FlowSection.tsx`** - Component for defining agent execution order
- **`ToolsPanel.tsx`** - Panel displaying available tools
- **`ToolsPanel.module.css`** - Tools panel styles
- **`AddToolsModal.tsx`** - Modal for adding tools and MCP servers
- **`AddToolsModal.module.css`** - Modal styles
- **`AssistantCard.tsx`** - Card component for displaying assistant in grid
- **`AssistantCard.module.css`** - Assistant card styles
- **`AssistantGrid.tsx`** - Grid layout for assistant cards
- **`AssistantGrid.module.css`** - Grid styles
- **`NewAssistantForm.tsx`** - Form for creating new assistants (legacy)
- **`NewAssistantForm.module.css`** - Form styles
- **`agent-editor/AgentEditorPanel.tsx`** - Legacy agent editor panel
- **`agent-editor/AgentList.tsx`** - Legacy agent list component
- **`agent-editor/ToolSelector.tsx`** - Legacy tool selector component

**`assistant/` - Assistant View Components**
- **`Playground.tsx`** - Chat playground for interacting with assistants
- **`Playground.module.css`** - Playground styles
- **`MessageBubble.tsx`** - Individual message bubble component
- **`MessageBubble.module.css`** - Message bubble styles
- **`AssistantHeader.tsx`** - Header component for assistant detail page
- **`AssistantHeader.module.css`** - Header styles
- **`AgentList.tsx`** - List of agents in the workflow
- **`AgentList.module.css`** - Agent list styles
- **`AgentNode.tsx`** - Individual agent node component
- **`AgentNode.module.css`** - Agent node styles
- **`chatTranscripts.tsx`** - Chat history transcript component
- **`chatTranscripts.module.css`** - Transcript styles

##### `frontend/src/layout/` - Layout Components
- **`AppShell.tsx`** - Main application shell with sidebar and content area
- **`AppShell.module.css`** - App shell styles (sidebar, topbar, main area)
- **`Sidebar.tsx`** - Navigation sidebar component
- **`Topbar.tsx`** - Top navigation bar component

##### `frontend/src/api/` - API Client
- **`client.ts`** - Axios instance configuration and base API client
- **`assistants.ts`** - API functions for assistant operations (fetch, create, update, delete, update graph)
- **`runs.ts`** - API functions for running workflows
- **`tools.ts`** - API functions for tools and MCP servers

##### `frontend/src/hooks/` - Custom React Hooks
- **`useAssistants.ts`** - Hook for fetching and managing list of assistants
- **`useAssistant.ts`** - Hook for fetching single assistant details

##### `frontend/src/types/` - TypeScript Types
- **`api.ts`** - TypeScript interfaces for API responses (Assistant, Chat, Run, Message, AgentNode, etc.)

##### `frontend/src/utils/` - Utility Functions
- **`assistantGraph.ts`** - Utility functions for parsing and transforming assistant graph data

##### `frontend/src/routes/` - Route Configuration
- **`index.tsx`** - Route definitions (legacy, routes now in app.tsx)

##### Other Files
- **`style.css`** - Global CSS styles and Tailwind imports
- **`counter.ts`** - Example counter component (legacy/unused)
- **`typescript.svg`** - TypeScript logo asset

## Features

- ✅ Create and manage assistants
- ✅ Delete assistants
- ✅ Run assistants with questions
- ✅ See all agent responses
- ✅ View conversation history
- ✅ Clean, modern interface

## Troubleshooting

**Backend won't start?**
- Make sure PostgreSQL is running
- Check your `.env` file has the correct database URL
- Make sure you're in the `backend/` folder when running uvicorn

**Frontend won't start?**
- Run `npm install` in the `frontend/` folder
- Make sure the backend is running first

**Can't create assistants?**
- Check that the backend is running on port 8000
- Check your Groq API key is correct in the `.env` file

**Agents not responding?**
- Check your Groq API key is valid
- Look at the backend terminal for error messages

## Tech Stack

- **Backend:** FastAPI (Python)
- **Frontend:** React + TypeScript
- **Database:** PostgreSQL
- **AI:** Groq API (Llama models)

## Need Help?

Check the backend terminal for error messages. Most issues are related to:
- Database connection
- Missing API keys
- Port conflicts (make sure ports 8000 and 5173 are free)

---

**That's it!** You now have a working multi-agent assistant system. Create assistants, ask questions, and watch them work together to give you detailed answers.
