# Visa Agent Backend API

FastAPI backend for the Visa Agent application with PostgreSQL database and JWT authentication.

## Features

- PostgreSQL database integration with SQLAlchemy
- User registration and authentication with JWT tokens
- Password hashing with bcrypt
- Protected API endpoints
- OpenAI integration for visa recommendations

## Setup

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database:
```bash
# Create database
createdb visa_agent

# Or using psql:
psql -U postgres
CREATE DATABASE visa_agent;
```

3. Configure environment variables:
```bash
cp env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/visa_agent`)
- `SECRET_KEY`: A random secret key for JWT tokens (change in production!)
- `OPENAI_API_KEY`: Your OpenAI API key (if using recommendations)

4. Initialize database tables:
```bash
python setup_db.py
```

Or tables will be created automatically when you start the server.

### Running the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

API documentation (Swagger UI) is available at `http://localhost:8000/docs`

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
  - Body: `{ "email": "user@example.com", "name": "User Name", "password": "password123" }`
  - Returns: User object

- `POST /auth/login` - Login and get access token
  - Body (form data): `username=user@example.com&password=password123`
  - Returns: `{ "access_token": "...", "token_type": "bearer" }`

- `GET /auth/me` - Get current user info (requires authentication)
  - Headers: `Authorization: Bearer <token>`
  - Returns: User object

### Other Endpoints

- `GET /health` - Health check
- `POST /intakes` - Create intake data
- `GET /intakes/{intake_id}` - Get intake data
- `POST /recommendations` - Get visa recommendations

## Database Schema

### Users Table

- `id`: Integer (Primary Key)
- `email`: String (Unique, Indexed)
- `name`: String
- `hashed_password`: String
- `is_active`: Boolean
- `created_at`: DateTime
- `updated_at`: DateTime

## Development

### Database Migrations

Tables are created automatically using SQLAlchemy. For production, consider using Alembic for migrations.

### Testing Authentication

1. Register a user:
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User", "password": "testpass123"}'
```

2. Login:
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=testpass123"
```

3. Use the token to access protected endpoints:
```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer <your-token-here>"
```
