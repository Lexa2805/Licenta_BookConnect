Licenta BookConnect
A comprehensive social marketplace and self-publishing platform for book lovers.

Project Structure
I have updated the backend structure to reflect the new apps needed for the new features.

Licenta_BookConnect/
├── backend/                  # Django REST API
│   ├── books/                # Standard Book management
│   ├── reviews/              # Book reviews
│   ├── marketplace/          # New: Second-hand listings, pricing, consignment logic
│   ├── manuscripts/          # New: User writing tools and self-publishing
│   ├── chat/                 # New: Real-time messaging and groups
│   ├── Licenta_BookConnect/  # Django project settings
│   ├── media/                # New: Storage for book photos
│   └── manage.py             # Django management script
│
├── frontend/                 # Next.js frontend application
│   ├── app/            
│   │   ├── marketplace/      # New: Shop interface
│   │   ├── studio/           # New: Manuscript editor
│   │   ├── community/        # New: Chat & Groups interface
│   │   ├── api/       
│   │   ├── login/      
│   │   ├── register/   
│   │   └── HomePage/   
│   ├── lib/            
│   ├── store/          
│   └── types/          
│
└── .env                      # Root environment variables
Authentication Architecture
Authentication is handled entirely by Next.js:

NextAuth.js manages user sessions with JWT

MongoDB stores user credentials (hashed with bcrypt)

Django backend serves data APIs (Marketplace, Chat, Manuscripts)

Protected routes use Next.js middleware

Getting Started
1. Install Dependencies
Frontend:

Bash

cd frontend
npm install
2. Configure Environment Variables
Root .env (for Django):

MONGO_URI=mongodb://localhost:27017
MONGO_DB=WebAppDB
DEBUG=1
ALLOWED_HOSTS=localhost,127.0.0.1,[::1]
# Add configuration for image hosting
MEDIA_URL=/media/
MEDIA_ROOT=./media
Frontend .env.local:

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=WebAppDB
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
3. Run the Applications
Backend (Django):

Bash

cd backend
python manage.py runserver
Frontend (Next.js):

Bash

cd frontend
npm run dev
Features
🔐 Authentication (Next.js)
✅ User registration with MongoDB

✅ Login with NextAuth credentials provider

✅ Session management with JWT

✅ Protected routes with middleware

🛒 Consignment Marketplace (Second-Hand)
Sell Your Books: Users can list used books with photos and prices.

Consignment Model: Users send physical books to the platform. The platform handles the sale, and the user recoups the money once the book is sold.

Inventory Tracking: Track status (Listed, Received by Platform, Sold, Paid Out).

✍️ Creative Studio (Manuscripts)
Writing Tool: dedicated interface for users to write and edit their own manuscripts.

Self-Publishing: Users can finalize their manuscripts and add them to the platform's library as original works.

Draft Saving: Auto-save functionality for ongoing writing.

💬 Social & Community
Direct Messaging: Users can search for other users and start private chats to discuss books.

Groups: Create and join interest groups (e.g., "Sci-Fi Lovers", "Sunday Readers").

Real-time Interaction: Connect with the community instantly.

📚 Core Management
Book catalog management (CRUD)

Review and Rating system

API documentation with Swagger

API Endpoints
Authentication (Next.js)
POST /api/auth/[...nextauth] - NextAuth endpoint

POST /api/register - User registration

GET /api/me - Get current user

Backend Services (Django)
Marketplace:

GET/POST /api/marketplace/listings/ - Create listings with photos/price

GET /api/marketplace/payouts/ - Check earned money from sold books

Creative Studio:

GET/POST /api/manuscripts/ - Create and edit manuscripts

POST /api/manuscripts/publish/ - Publish a draft to the public library

Social:

GET/POST /api/chat/messages/ - Send/Receive direct messages

GET/POST /api/chat/groups/ - Create or join groups

Core:

GET/POST /api/books/ - Books CRUD

GET/POST /api/reviews/ - Reviews CRUD

GET /api/docs/ - Swagger documentation