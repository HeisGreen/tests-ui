## JAPA - AI-Powered Visa & Migration Assistant

JAPA is a comprehensive full-stack application that helps users navigate visa and immigration processes through AI-powered recommendations, personalized checklists, document management, and connections with professional travel agents.

![JAPA Logo](Frontend/src/assets/japa-logo.png)

## Overview

JAPA simplifies the complex world of immigration by:

- **AI-Powered Recommendations**: Using OpenAI GPT models to analyze user profiles and suggest the best visa pathways
- **Personalized Checklists**: Generating step-by-step application checklists tailored to each visa type
- **Document Management**: Track and organize all required documents for visa applications
- **Travel Agent Marketplace**: Connect with professional travel agents for personalized assistance
- **Real-time Messaging**: Communicate directly with travel agents within the platform

## Problem statement (what JAPA solves)

Migration guidance today is often:

- **Scattered across many sources**
- **Out of date**
- **Inconsistent**
- **Hard to access without paying experts**
- **Overrun with intermediaries that increase cost**

Most people do not fail because they lack motivation. They fail because they miss a step, a deadline, or a rule change.

**JAPA is built to reduce migration risk by turning information into an actionable plan.**

## What’s different about JAPA

Many products optimize for information delivery:

- **Static articles**
- **Single country coverage**
- **Single visa type coverage**
- **Expert-first workflows**
- **High upfront fees**

JAPA is designed around decision-making and execution:

- **Scenario-based** (your situation drives the output)
- **Status-aware** (constraints and eligibility matter)
- **Timeline-driven** (deadlines and dependencies are explicit)
- **Multi-country**
- **AI-first with human help only when needed**

It behaves more like navigation than a knowledge base: it adapts as your situation changes.

## How the product works

1. **Intake (identity + intent)**

   - The user provides: nationality, current country, current status, education, work experience, family situation, and long-term goal
   - Plain language, minimal jargon

2. **Path generation**

   - Produces the viable legal pathways
   - Ranks them by risk, cost, and time
   - Explains disqualifiers directly (e.g., “this path fails because X”)

3. **Plan (timeline + checklist)**

   - Step-by-step timeline
   - Required documents
   - Deadlines and dependencies
   - What can break the path

4. **Monitoring**

   - Tracks: visa expiry, policy/rule changes, and missed actions
   - Alerts early so users can course-correct

5. **Human escalation**
   - Only when needed: lawyer review, sponsorship strategy, or help with official forms
   - AI handles the default path; humans handle exceptions to keep costs down

## Who JAPA is for

- **Students**: “If I study here, what are my options after graduation?”
- **Skilled workers**: “Does my job realistically lead to residency, and what are the fallback paths?”
- **Founders and freelancers**: “Where can I build long-term legally, and what are the tradeoffs?”
- **Families**: “How do we move together while staying compliant?”
- **People already in the system**: “What happens if my status changes, expires, or needs a switch?”

## Why this approach matters

This problem is high-stakes and constantly changing. People want:

- **Clarity**
- **Control**
- **A plan they can execute**

## Business model (high level)

- **Free**: Path exploration + risk assessment
- **Paid (monthly)**: Timeline tracking + alerts
- **Paid (one-time)**: Deep-dive migration plan
- **B2B**: Schools, employers, relocation firms

Experts become partners in escalation, not the default gate.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│                    React 18 + Vite + Tailwind CSS                   │
│          (http://localhost:5173)                                     │
├─────────────────────────────────────────────────────────────────────┤
│                             │                                        │
│                        REST API                                      │
│                             │                                        │
├─────────────────────────────────────────────────────────────────────┤
│                           BACKEND                                    │
│                    FastAPI + SQLAlchemy                             │
│          (http://localhost:8000)                                     │
├─────────────────────────────────────────────────────────────────────┤
│                             │                                        │
│              ┌──────────────┼──────────────┐                        │
│              │              │              │                         │
│         PostgreSQL      OpenAI API    Firebase                      │
│         (Database)      (AI/GPT)      (Storage)                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

### For Regular Users (Visa Applicants)

| Feature                    | Description                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **User Onboarding**        | Multi-step form collecting personal details, education, work experience, immigration goals, and preferences |
| **AI Recommendations**     | Get personalized visa pathway recommendations based on your profile using GPT-4                             |
| **Interactive Checklists** | AI-generated step-by-step checklists with progress tracking for each visa type                              |
| **Document Management**    | Upload, organize, and track the status of required documents                                                |
| **Agent Discovery**        | Browse and filter travel agents by country, expertise, and availability                                     |
| **Messaging**              | Direct communication with travel agents for personalized assistance                                         |
| **Profile Management**     | View and update your profile information                                                                    |

### For Travel Agents

| Feature              | Description                                                                         |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Agent Onboarding** | Comprehensive profile setup including specializations, experience, and availability |
| **Client Messaging** | Receive and respond to inquiries from potential clients                             |
| **Client Insights**  | View relevant client profile summaries (non-sensitive information only)             |
| **Dashboard**        | Manage conversations and track client interactions                                  |

## Tech Stack

### Frontend

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Supabase JS** - Database client (optional)

### Backend

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Primary database
- **OpenAI API** - GPT models for AI recommendations
- **JWT (python-jose)** - Token-based authentication
- **bcrypt** - Password hashing
- **Google Auth** - OAuth integration

## Project Structure

```
tests-ui/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # API endpoints & application entry
│   │   ├── models.py          # SQLAlchemy database models
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── auth.py            # Authentication utilities
│   │   ├── oauth.py           # Google OAuth integration
│   │   ├── config.py          # Application configuration
│   │   ├── database.py        # Database connection setup
│   │   ├── migrations.py      # Database migrations
│   │   └── storage.py         # In-memory intake storage
│   ├── requirements.txt       # Python dependencies
│   ├── travel_agent_onboarding_schema.json  # Agent form schema
│   └── env.example            # Environment variables template
│
├── Frontend/                   # React Frontend
│   ├── src/
│   │   ├── pages/             # Page components
│   │   │   ├── Landing.jsx    # Public landing page
│   │   │   ├── Login.jsx      # User login
│   │   │   ├── Register.jsx   # User registration (with role selection)
│   │   │   ├── Onboarding.jsx # User onboarding flow
│   │   │   ├── AgentOnboarding.jsx  # Travel agent onboarding
│   │   │   ├── Home.jsx       # User dashboard
│   │   │   ├── Recommendation.jsx   # AI visa recommendations
│   │   │   ├── Checklist.jsx  # Visa application checklist
│   │   │   ├── Documents.jsx  # Document management
│   │   │   ├── Agents.jsx     # Travel agent marketplace
│   │   │   ├── Messages.jsx   # Messaging interface
│   │   │   ├── Profile.jsx    # User profile
│   │   │   ├── TravelAgentHome.jsx     # Agent dashboard
│   │   │   └── TravelAgentProfile.jsx  # Agent profile
│   │   ├── components/        # Reusable components
│   │   │   ├── Layout.jsx     # User layout wrapper
│   │   │   ├── TravelAgentLayout.jsx  # Agent layout wrapper
│   │   │   ├── ui/            # UI component library
│   │   │   └── kastamer/      # Kastamer onboarding components
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Authentication state management
│   │   ├── utils/
│   │   │   ├── api.js         # API client functions
│   │   │   └── oauth.js       # OAuth utilities
│   │   ├── data/              # Static data (countries, services)
│   │   ├── App.jsx            # Application routes
│   │   └── main.jsx           # React entry point
│   ├── package.json           # Node dependencies
│   └── vite.config.js         # Vite configuration
│
└── md/                         # Documentation
    ├── SETUP.md               # Setup instructions
    ├── TRAVEL_AGENT_FEATURE.md  # Travel agent feature docs
    └── backend/frontend issues.md  # Known issues
```

## Database Schema

### Core Tables

```sql
-- Users with role-based access
users (
  id, email, name, hashed_password, role, is_active, created_at, updated_at
)

-- User profiles with onboarding data
user_profiles (
  id, user_id, onboarding_data (JSON), created_at, updated_at
)

-- AI-generated visa recommendations
recommendations (
  id, user_id, input_data (JSON), output_data (JSON), raw_response, created_at
)

-- Uploaded documents
documents (
  id, user_id, name, type, file_url, file_path, size, status, visa_id, description, uploaded_at
)

-- Checklist progress tracking
checklist_progress (
  id, user_id, visa_type, progress_json (JSON), created_at, updated_at
)

-- Cached AI-generated checklists
checklist_cache (
  id, user_id, visa_type, option_hash, checklist_json (JSON), source, created_at, updated_at
)

-- Travel agent profiles
travel_agent_profiles (
  id, user_id, onboarding_data (JSON), is_verified, created_at, updated_at
)

-- User-Agent conversations
conversations (
  id, user_id, agent_id, last_message_at, created_at, updated_at
)

-- Messages within conversations
messages (
  id, conversation_id, sender_id, content, is_read, created_at
)
```

### User Roles

| Role           | Description                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------- |
| `USER`         | Regular visa applicants - can view recommendations, manage documents, contact agents          |
| `TRAVEL_AGENT` | Professional travel agents - can receive inquiries, view client profiles, respond to messages |

## API Endpoints

### Authentication

| Method | Endpoint         | Description                            |
| ------ | ---------------- | -------------------------------------- |
| POST   | `/auth/register` | Register new user (with optional role) |
| POST   | `/auth/login`    | Login and receive JWT token            |
| POST   | `/auth/google`   | Google OAuth login                     |
| GET    | `/auth/me`       | Get current user info                  |
| PUT    | `/auth/me`       | Update current user info               |

### User Profile

| Method | Endpoint   | Description                           |
| ------ | ---------- | ------------------------------------- |
| GET    | `/profile` | Get user profile with onboarding data |
| POST   | `/profile` | Create or update profile              |
| PUT    | `/profile` | Update profile onboarding data        |

### Recommendations

| Method | Endpoint                   | Description                 |
| ------ | -------------------------- | --------------------------- |
| POST   | `/recommendations`         | Get AI visa recommendations |
| GET    | `/recommendations/history` | Get recommendation history  |
| GET    | `/recommendations/{id}`    | Get specific recommendation |

### Checklists

| Method | Endpoint                     | Description                      |
| ------ | ---------------------------- | -------------------------------- |
| POST   | `/checklist`                 | Get or generate cached checklist |
| POST   | `/recommendations/checklist` | Generate new checklist           |
| GET    | `/checklist/progress`        | Get checklist progress           |
| GET    | `/checklist/progress/all`    | Get all checklist progress       |
| PUT    | `/checklist/progress`        | Save checklist progress          |

### Documents

| Method | Endpoint          | Description           |
| ------ | ----------------- | --------------------- |
| POST   | `/documents`      | Upload document       |
| GET    | `/documents`      | List all documents    |
| GET    | `/documents/{id}` | Get specific document |
| PUT    | `/documents/{id}` | Update document       |
| DELETE | `/documents/{id}` | Delete document       |

### Travel Agents

| Method | Endpoint                           | Description                      |
| ------ | ---------------------------------- | -------------------------------- |
| GET    | `/travel-agents/onboarding-schema` | Get agent onboarding form schema |
| GET    | `/travel-agents/profile`           | Get current agent's profile      |
| POST   | `/travel-agents/profile`           | Create agent profile             |
| PUT    | `/travel-agents/profile`           | Update agent profile             |
| GET    | `/travel-agents/list`              | List agents with filters         |
| GET    | `/travel-agents/{id}`              | Get agent public profile         |

### Messaging

| Method | Endpoint                       | Description         |
| ------ | ------------------------------ | ------------------- |
| POST   | `/conversations`               | Create conversation |
| GET    | `/conversations`               | List conversations  |
| GET    | `/conversations/{id}`          | Get conversation    |
| POST   | `/messages`                    | Send message        |
| GET    | `/conversations/{id}/messages` | Get messages        |

## Getting Started

### Prerequisites

- **Python 3.8+**
- **Node.js 16+** and npm
- **PostgreSQL 12+**
- **OpenAI API Key**

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Create virtual environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL database:**

   ```bash
   createdb visa_agent
   # Or via psql: CREATE DATABASE visa_agent;
   ```

5. **Configure environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` and set:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/visa_agent
   SECRET_KEY=your-secret-key-here
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-4o-mini
   ```

6. **Start the server:**

   ```bash
   uvicorn app.main:app --reload
   ```

   API available at: `http://localhost:8000`

   Swagger docs at: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd Frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

   App available at: `http://localhost:5173`

### Building for Production

```bash
# Frontend
cd Frontend
npm run build
npm run preview  # Preview production build

# Backend (using gunicorn)
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## Authentication Flow

### Email/Password Registration

```
Register → Auto-login → Onboarding (based on role) → Dashboard
```

### Google OAuth

```
Google Sign-in → Backend verification → JWT issued → Dashboard
```

### JWT Token Flow

- Token stored in `localStorage`
- Included in `Authorization: Bearer <token>` header
- Auto-refresh user data on app load
- Logout clears token and user data

## AI Recommendation System

### How It Works

1. **User completes onboarding** - Personal details, education, work experience, immigration goals
2. **Request recommendation** - User triggers AI analysis
3. **OpenAI processes profile** - GPT-4 analyzes eligibility for various visa pathways
4. **Results returned** - Top 3 visa recommendations with scores, requirements, and checklists
5. **Caching** - Recommendations are cached to reduce API costs

### Recommendation Response Structure

```json
{
  "summary": "Analysis of your immigration readiness",
  "options": [
    {
      "visa_type": "EB-2 NIW",
      "reasoning": "Your advanced degree and exceptional ability make you eligible",
      "likelihood": "possible",
      "estimated_timeline": "12-18 months",
      "estimated_costs": "$5,000 - $15,000",
      "requirements": ["Advanced degree", "National interest evidence"],
      "checklist": [...]
    }
  ]
}
```

## Design System

### Colors

- Primary Blue: `#4A90E2`
- Background Light: `#E8F1FF`
- Text Dark: `#333333`
- Accent Pink: `#FFD0D6`
- White: `#FFFFFF`

### Typography

- Headings: Custom fonts with motion effects
- Body: Clean, readable sans-serif

### Components

- Built on Radix UI primitives
- Consistent spacing and borders
- Responsive design (mobile-first)
- Smooth animations with Framer Motion

## Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Tokens**: Expiring access tokens
- **Role-Based Access**: Separate routes and permissions
- **CORS**: Restricted to known origins
- **Input Validation**: Pydantic schemas for all endpoints
- **SQL Injection Prevention**: SQLAlchemy ORM
- **Profile Privacy**: Limited data exposure between users and agents

## Environment Variables

### Backend (`.env`)

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/visa_agent
SECRET_KEY=your-random-secret-key
OPENAI_API_KEY=sk-...

# Optional
OPENAI_MODEL=gpt-4o-mini
ENV=local
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# ... other Firebase config
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Verify database exists
psql -U postgres -l | grep visa_agent
```

### CORS Errors

- Ensure backend CORS origins include frontend URL
- Check browser console for specific error messages

### OpenAI API Errors

- Verify API key is valid and has credits
- Check rate limits

### Authentication Issues

- Clear localStorage and try again
- Check JWT token in browser dev tools
- Verify backend is running

## Roadmap

### Planned Features

- [ ] WebSocket support for real-time messaging
- [ ] File attachments in messages
- [ ] Agent verification workflow
- [ ] Agent ratings and reviews
- [ ] Appointment scheduling
- [ ] Payment integration
- [ ] Email/SMS notifications
- [ ] Multi-language support

## License

This project is proprietary. All rights reserved.

## Contributing

For internal team members:

1. Create a feature branch
2. Make changes and test locally
3. Submit pull request for review
4. Await approval before merging

---

Built for a world without borders.
