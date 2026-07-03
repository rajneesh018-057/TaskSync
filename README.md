# TaskSync - Mindful Focus & Flow Sanctuary 🧘‍♂️✨

**TaskSync** is a mindful daily planner and AI-assisted cognitive guide designed to alleviate stress, balance mental workload, and restore focus. By combining structured goal alignment, a drag-and-drop chronological timeline, and real-time AI insights, TaskSync helps you navigate your day with clarity, composure, and intent.

---

## 🏗️ Architecture & Technology Stack

The application is built using a modern full-stack TypeScript architecture:

### Frontend
- **Framework:** React 19 (TypeScript)
- **Bundler:** Vite
- **Styling:** Tailwind CSS v4
- **Animations:** Motion (formerly Framer Motion) for fluid transitions and micro-interactions
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js
- **Database client:** Prisma ORM
- **Database:** PostgreSQL (supports local containerized Postgres or cloud instances like Supabase)

### AI Integration
- **LLM Engine:** Groq API (fallback list: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`).
- **Heuristic Fallback:** If no API key is specified, the application uses local rule-based analysis to maintain core functionality.

---

## 🌟 Core Features & Modules

1. **Dashboard View (`/`):**
   - A unified dashboard featuring a real-time stress assessment engine.
   - Computes a dynamic **Cognitive Load Risk Level** (Low, Medium, High) based on active tasks and cognitive load metadata.
   - Highlights your current goal progress, task completion metrics, and real-time AI suggestions.

2. **Daily Planner (`/planner`):**
   - A drag-and-drop chronological timeline tracker for calendar events and scheduled tasks.
   - Visual hours breakdown indicating active, upcoming, and completed slots.
   - Auto-calculates active durations and coordinates scheduling items directly.

3. **Capture Inbox (`/inbox`):**
   - An entry point for dumping quick thoughts, unformatted tasks, or links.
   - Items can be converted into structured tasks or mapped to projects with one click.

4. **Goals & Projects (`/goals`):**
   - Section to define long-term milestones.
   - Tracks metrics, target dates, and relative sub-task completion percentages.

5. **AI Insights (`/insights`):**
   - Features deep cognitive load analysis.
   - Provides personalized recommendations on tasks to delegate, break down, or postpone.

6. **AI Assistant Drawer:**
   - A floating interactive chat companion available across all views.
   - Parses natural language requests (e.g., *"Schedule gym tomorrow at 8 AM"*, *"Add review code task to Project X"*) and directly updates the database.

7. **Settings View (`/settings`):**
   - Manage credentials, configure AI API keys, switch dark/light modes, and authorize Google Calendar integration for automated event imports.

---

## ⚙️ Environment Variables Setup

Create a `.env` file inside both `/server` and `/frontend` directories.

### Backend Config (`server/.env`)
```env
PORT=5050
JWT_SECRET="YOUR_JWT_SECRET_STRING"

# PostgreSQL connection strings (e.g. Supabase, AWS RDS, or localhost)
# DATABASE_URL: Pooler connection string for transaction handling
DATABASE_URL="postgresql://username:password@host:6543/db?pgbouncer=true"
# DIRECT_URL: Direct database port connection string for schema migrations
DIRECT_URL="postgresql://username:password@host:5432/db"

# Groq API key (Required for LLM features)
GROQ_API_KEY="gsk_..."

# Google OAuth Credentials (Required for Google Calendar Sync)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
GOOGLE_REDIRECT_URI="http://localhost:5050/api/auth/google/callback"
```

### Frontend Config (`frontend/.env`)
```env
# Optional Supabase credentials if using Supabase client side features
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

---

## 🚀 Getting Started

### 1. Manual Local Development

#### Prerequisites
- Node.js (v18 or above)
- A running PostgreSQL database instance (or Supabase project)

#### Step A: Configure and Prepare the Database
1. Update `server/.env` with your `DATABASE_URL` and `DIRECT_URL`.
2. Generate the Prisma Client and migrate the database schema:
   ```bash
   cd server
   npm install
   npm run prisma:generate
   npm run prisma:push
   ```

#### Step B: Start the Backend Server
```bash
# From the server directory
npm run dev
```


#### Step C: Start the Frontend Application
1. Open a new terminal.
2. Install frontend dependencies and run the Vite server:
   ```bash
   cd frontend
   npm install
   npm run dev


---

### 🐳 2. Running with Docker & Docker Compose

Docker Compose builds the entire service mesh (Postgres Database, Express Server, and Nginx Frontend) with a single command.

#### Step A: Configure Environment Variables
Copy backend env parameters into a root-level `.env` file (or set them directly in the host shell environment):
```bash
# At the project root, configure .env
JWT_SECRET="any-custom-jwt-secret-string"
GROQ_API_KEY="your-groq-api-key"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

#### Step B: Run Docker Compose
At the project root, start the containers:
```bash
docker compose up --build
```

#### Step C: Services Access Points
- 🖥️ **Frontend App:** [http://localhost:5173](http://localhost:5173) (Served by Nginx)
- ⚙️ **Backend API:** [http://localhost:5050](http://localhost:5050)
- 🗄️ **Database:** `localhost:5432` (Username: `postgres`, Password: `postgrespassword`, DB: `tasksync`)

*Note: Database migrations run automatically during backend container startup via `npx prisma db push` before Express launches.*

---

## 🧹 Stopping Services
To tear down the Docker Compose environment, run:
```bash
docker compose down -v
```
*(The `-v` flag deletes local Postgres volumes. Omit it if you want to persist database data across builds)*.
