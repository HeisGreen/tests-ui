# Setup Guide - Database and Authentication

This guide will help you set up PostgreSQL database and authentication for the Visa Agent application.

## Prerequisites

- PostgreSQL 12+ installed and running
- Python 3.8+ (for backend)
- Node.js and npm (for frontend)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Up PostgreSQL Database

Create a PostgreSQL database:

```bash
# Using psql
psql -U postgres
CREATE DATABASE visa_agent;
\q

# Or using createdb command
createdb visa_agent
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp env.example .env
```

Edit `.env` and update these values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/visa_agent
SECRET_KEY=your-secret-key-change-this-in-production-use-a-random-string
OPENAI_API_KEY=your-openai-api-key-here
```

**Important**: Change the `SECRET_KEY` to a random string in production!

### 4. Initialize Database Tables

Tables will be created automatically when you start the server, or you can run:

```bash
python setup_db.py
```

### 5. Start the Backend Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd Frontend
npm install
```

### 2. Configure API URL (Optional)

If your backend is running on a different URL, create a `.env` file in the `Frontend` directory:

```env
VITE_API_URL=http://localhost:8000
```

The default is `http://localhost:8000`, so you can skip this if using the default.

### 3. Start the Frontend

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Testing Authentication

1. **Register a new user**:
   - Go to `http://localhost:5173/register`
   - Fill in name, email, and password
   - Click "Create account"

2. **Login**:
   - Go to `http://localhost:5173/login`
   - Enter your email and password
   - Click "Sign in"

3. **Access protected routes**:
   - After login, you'll be redirected to `/home`
   - All protected routes require authentication

## API Endpoints

### Authentication Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info (requires authentication)

### Example API Calls

**Register:**
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "password": "testpass123"}'
```

**Login:**
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpass123"
```

**Get Current User (with token):**
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### Database Connection Issues

- Make sure PostgreSQL is running: `pg_isready`
- Check your `DATABASE_URL` in `.env` matches your PostgreSQL setup
- Verify database exists: `psql -U postgres -l | grep visa_agent`

### Authentication Issues

- Check that backend is running on port 8000
- Verify CORS settings allow requests from `http://localhost:5173`
- Check browser console for API errors
- Verify JWT token is being stored in localStorage

### Frontend Can't Connect to Backend

- Ensure backend is running: `curl http://localhost:8000/health`
- Check `VITE_API_URL` in frontend `.env` file
- Verify CORS middleware is configured correctly in backend

## Next Steps

- Users are now saved to PostgreSQL database
- Authentication uses JWT tokens
- Protected routes require valid authentication
- **Onboarding data is now stored in user profiles** and can be used to generate recommendations
- You can extend the user model with additional fields as needed

## User Profile & Onboarding Data

The application now stores onboarding data in the `user_profiles` table:

- Each user has a profile that stores their onboarding/intake data
- Onboarding data is automatically saved when users complete the onboarding process
- Profile data is loaded when users log in
- The onboarding data can be used to generate visa recommendations via the `/recommendations` endpoint

### Profile API Endpoints

- `GET /profile` - Get current user's profile (requires authentication)
- `POST /profile` - Create or update user profile with onboarding data
- `PUT /profile` - Update user profile onboarding data

The onboarding data follows the `IntakeData` schema and includes all the information collected during the onboarding process.
