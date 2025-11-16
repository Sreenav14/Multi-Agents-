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

## Project Structure

```
agent-mvp/
├── backend/          # Python FastAPI server
│   └── app/
│       ├── main.py   # Server entry point
│       ├── routers/  # API endpoints
│       └── agents/   # Agent logic
│
└── frontend/         # React app
    └── src/
        ├── pages/    # Main pages
        └── api/      # API calls
```

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
