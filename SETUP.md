# Setup Instructions

## Quick Start Guide

### Prerequisites
- Python 3.8+
- Node.js 18+
- MongoDB running on localhost:27017

### Step 1: Clone and Setup

```bash
# Navigate to project root
cd Licenta_BookConnect
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux

# Install Python dependencies
pip install django djangorestframework pymongo mongoengine django-cors-headers drf-spectacular drf-spectacular-sidecar python-dotenv

# Run Django server
python manage.py runserver
```

The backend will run on `http://localhost:8000`

### Step 3: Frontend Setup

```bash
# Open new terminal, navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Create .env.local file with:
# MONGODB_URI=mongodb://localhost:27017
# MONGODB_DB=WebAppDB
# NEXTAUTH_SECRET=your-secret-key-here
# NEXTAUTH_URL=http://localhost:3000
# NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000

# Run Next.js development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### Step 4: Test Authentication

1. Visit `http://localhost:3000/register`
2. Create a new account (choose role: reader, author, or admin)
3. Login at `http://localhost:3000/login`
4. You'll be redirected to `/HomePage` after successful login

## Architecture Changes

### What Changed?
- ✅ Authentication moved from Django to Next.js
- ✅ NextAuth.js handles login/register/sessions
- ✅ MongoDB connection now in both Django and Next.js
- ✅ Django backend simplified to only serve books & reviews APIs

### Benefits
- 🚀 Faster authentication (no backend API calls)
- 🔒 Secure session management with NextAuth
- 🎨 Better UX with client-side routing
- 📦 Cleaner separation of concerns

## Troubleshooting

### MongoDB Connection Issues
- Make sure MongoDB is running: `mongod`
- Check connection string in `.env` and `.env.local`

### NextAuth Secret Error
- Generate a secret: `openssl rand -base64 32`
- Add to `frontend/.env.local` as `NEXTAUTH_SECRET`

### CORS Errors
- Verify Django CORS settings include `http://localhost:3000`
- Check that both servers are running

## Development Workflow

1. **Backend (Django):** Handles books and reviews CRUD operations
2. **Frontend (Next.js):** Handles all authentication + UI
3. **MongoDB:** Shared database for both applications

## Project Structure After Changes

```
backend/
├── books/              # Book management API
├── reviews/            # Review management API
└── Licenta_BookConnect/  # Django settings (simplified)

frontend/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth configuration
│   │   ├── register/route.ts             # User registration
│   │   └── me/route.ts                   # Get current user
│   ├── login/          # Login page
│   ├── register/       # Registration page
│   └── HomePage/       # Protected homepage
├── lib/
│   ├── mongodb.ts      # MongoDB connection
│   └── api.ts          # Axios instance for Django API
└── types/
    └── next-auth.d.ts  # NextAuth type definitions
```
