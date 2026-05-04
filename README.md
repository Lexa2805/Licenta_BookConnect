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
│   │   ├── layout.tsx                # Root layout, fonts, ThemeProvider
│   ├── globals.css               # Tailwind + design tokens (CSS variables)
│   ├── page.tsx                  # Home
│   ├── library/page.tsx
│   ├── marketplace/page.tsx
│   ├── create/page.tsx
│   ├── studio/page.tsx
│   ├── community/page.tsx
│   └── profile/page.tsx
├── components/
│   ├── layout/                   # PageLayout, Sidebar, Topbar
│   ├── ui/                       # Button, Input, Pill, Badge, Card, Eyebrow, SectionTitle
│   ├── books/                    # BookCover, BookCard
│   ├── stats/                    # StatCard
│   ├── home/                     # Hero, StatsStrip, ContinueReading, Recommended, CommunityPulse
│   └── theme/                    # ThemeProvider, ThemeToggle
├── lib/
│   ├── nav.ts                    # Sidebar navigation config
│   └── data.ts                   # Sample data (replace with your API/DB)
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.mjs
├── tsconfig.json
└── package.json        
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

Copying into an existing Next.js project
Tailwind setup — merge tailwind.config.ts into your config (the theme.extend block adds the bc.* color scale, gradient backgrounds, fonts, shadows, keyframes, and animations).
CSS variables + utilities — copy the :root and .dark blocks from app/globals.css, plus the @layer components rules (.bc-card, .bc-section-title, .bc-orb*, .bc-dot-grid, .bc-stagger).
Fonts — copy the next/font setup from app/layout.tsx (Plus Jakarta Sans + Fraunces). They expose --font-sans / --font-display to Tailwind.
Theme — drop components/theme/ in. Wrap your root layout with <ThemeProvider> and use <ThemeToggle /> anywhere. Toggling adds/removes a dark class on <html>.
Pages + components — copy any folder under app/ and components/ you want. They are framework-agnostic apart from next/link and next/font.
Data — lib/data.ts holds sample fixtures so the UI renders out of the box. Replace each export with calls to your API/DB. Components only depend on the typed shapes (Book, LibraryBook, MarketplaceBook, etc.).
Design system
All visual tokens live as CSS variables in globals.css and are exposed to Tailwind through tailwind.config.ts:

Token group	Tailwind utilities
Colors	bg-bc-bg, text-bc-text, border-bc-border, bg-bc-primary, text-bc-subtext, bg-bc-surface-muted, etc.
Gradients	bg-bc-primary-grad, bg-bc-secondary-grad, bg-bc-hero
Shadows	shadow-bc-xs/sm/md/lg/xl/glow/primary/primary-hover
Radii	rounded-bc-sm/md/lg/xl/2xl/3xl
Fonts	font-sans (Plus Jakarta), font-display (Fraunces)
Animations	animate-bc-fade-up, animate-bc-float, animate-bc-float-slow, animate-bc-pulse-glow, animate-bc-blob
Easings	ease-bc-ease, ease-bc-bounce
Light/dark are switched via the dark class on <html> (Tailwind darkMode: "class"). Variables in :root are overridden in .dark.

Reusable components
PageLayout — sidebar + topbar shell with page title/subtitle/actions and the 1240-max-width content rail.
Sidebar — accepts an active key from lib/nav.ts.
Topbar — sticky blurred header with search input + theme toggle + avatar.
Button — variant: primary | secondary | ghost, size: sm | md | lg, leftIcon / rightIcon props. Primary has an animated gradient + shine sweep + arrow nudge on hover.
Input — inputSize, leftIcon, rightSlot. Focus state shows a soft glow ring.
Pill — toggleable filter chip with active prop. Active pills use the gradient soft fill.
Badge — variant: default | primary | soft | success | warning.
Card — wrapper for the bc-card system; pass hover for the lift-on-hover behaviour.
SectionHeader / SectionTitle — section heading with the gradient accent bar.
Eyebrow — glass chip with optional pulsing dot.
BookCover — pure-CSS book cover (no images required) with spine, paper edge, and gloss highlight.
BookCard — cover + title + author + optional badge/meta with hover tilt.
StatCard — KPI tile with accent corner, icon tile, and trend line.
Responsive
Sidebar collapses below lg (mobile shows topbar only).
Stats and book grids: 2-col mobile → 3-col tablet → 4-/6-col desktop.
Hero stacks on mobile, grid on desktop.
All horizontal-scroll patterns from the mockup were replaced with proper responsive grids.
Notes
No business logic / backend integration is included. Fetch your real data and pass it into the existing component props. The component tree is purely presentational.
No images. All book covers render from CSS gradients via <BookCover />. Swap them for <Image /> later if you want real cover art.
Accessibility: focus rings on buttons, aria-label on icon-only buttons, prefers-reduced-motion honored in globals.css.
License
Use freely in your project.