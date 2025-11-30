# 📋 Quick Reference Card

## 🚀 Start Development

```bash
# Terminal 1 - Backend
cd backend
python manage.py runserver

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

Or use the automated script:
```bash
start.bat
```

## 🌐 URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs/
- Login: http://localhost:3000/login
- Register: http://localhost:3000/register

## 📁 File Locations

### Add New Book API Endpoint
📁 `backend/books/views.py`

### Add New Review API Endpoint
📁 `backend/reviews/views.py`

### Modify Login Page
📁 `frontend/app/login/page.tsx`

### Modify Register Page
📁 `frontend/app/register/page.tsx`

### Add New Protected Page
📁 `frontend/app/yourpage/page.tsx`
📁 `frontend/middleware.ts` (add to matcher)

### NextAuth Configuration
📁 `frontend/app/api/auth/[...nextauth]/route.ts`

### MongoDB Connection
📁 `frontend/lib/mongodb.ts`

## 🔧 Common Commands

### Backend
```bash
# Create migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell
```

### Frontend
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🔐 Authentication

### Login User (NextAuth)
```typescript
import { signIn } from "next-auth/react";

await signIn("credentials", {
  username: "user",
  password: "pass",
  redirect: false,
});
```

### Get Session
```typescript
import { useSession } from "next-auth/react";

const { data: session, status } = useSession();
// session.user.id, username, email, role
```

### Logout
```typescript
import { signOut } from "next-auth/react";

await signOut({ callbackUrl: "/login" });
```

### Protect Server Component
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const session = await getServerSession(authOptions);
if (!session) redirect("/login");
```

## 🗄️ Database

### MongoDB Connection String
```
mongodb://localhost:27017
```

### Database Name
```
WebAppDB
```

### Collections
- `users` - User accounts
- `books` - Book catalog
- `reviews` - Book reviews

### Check MongoDB
```bash
# Connect to MongoDB shell
mongosh

# Switch to database
use WebAppDB

# Show collections
show collections

# Find users
db.users.find()

# Count documents
db.users.countDocuments()
```

## 🐛 Debug Tips

### Check if MongoDB is running
```bash
mongosh --eval "db.runCommand({ping: 1})"
```

### View backend logs
Backend terminal shows Django logs

### View frontend logs
Browser console (F12) shows Next.js logs

### Check environment variables
```bash
# Backend
echo $MONGO_URI

# Frontend (in Node.js)
console.log(process.env.MONGODB_URI)
```

## 📦 Dependencies

### Backend
- django
- djangorestframework
- pymongo
- mongoengine
- django-cors-headers
- drf-spectacular
- python-dotenv

### Frontend
- next
- react
- next-auth
- mongodb
- bcryptjs
- axios
- zustand
- tailwindcss

## 🔑 Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb://localhost:27017
MONGO_DB=WebAppDB
DEBUG=1
ALLOWED_HOSTS=localhost,127.0.0.1,[::1]
```

### Frontend (.env.local)
```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=WebAppDB
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

## 🎨 Styling

- **Framework:** Tailwind CSS
- **Config:** `frontend/tailwind.config.js`
- **Global CSS:** `frontend/app/globals.css`

## 📝 Common Tasks

### Add a New Page
1. Create `frontend/app/yourpage/page.tsx`
2. Add route to middleware if protected
3. Add navigation link

### Add New API Endpoint (Django)
1. Add view in `backend/app/views.py`
2. Add URL in `backend/app/urls.py`
3. Test at http://localhost:8000/api/...

### Add New API Route (Next.js)
1. Create `frontend/app/api/yourroute/route.ts`
2. Export GET/POST/PUT/DELETE functions
3. Test at http://localhost:3000/api/yourroute

## 🆘 Help

- **SETUP.md** - Detailed setup instructions
- **MIGRATION.md** - Authentication migration details  
- **SUMMARY.md** - Complete project overview
- **README.md** - Project introduction

## 🎯 Project Structure Summary

```
backend/     → Django APIs (books, reviews)
frontend/    → Next.js (UI + Auth)
  ├── app/
  │   ├── api/         → API routes (auth, register, me)
  │   ├── login/       → Login page
  │   ├── register/    → Register page
  │   └── HomePage/    → Protected home
  └── lib/
      └── mongodb.ts   → DB connection
```

---

💡 **Tip:** Keep this file open while developing for quick reference!
