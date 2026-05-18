# BookConnect

BookConnect is a reading community, marketplace, and self-publishing platform built with a Next.js frontend, Django REST backend, and MongoDB.

The app lets users discover and read books, manage a personal library, sell books in a marketplace, chat with other readers, write manuscripts in Studio, generate covers, publish public works, and manage their profile/avatar/account type.

## Tech Stack

- Frontend: Next.js 15, React 18, TypeScript, Tailwind CSS
- Authentication: NextAuth.js with JWT sessions
- Backend: Django 4, Django REST Framework
- Database: MongoDB
- File/media handling: Django media storage, optional Cloudinary image uploads
- AI features: local Django text generation endpoint, optional OpenRouter/Pollinations-assisted frontend generation
- PDF reading: `react-pdf`

## Main Features

- Account roles: reader, writer, or both
- Profile editing with avatar upload/generated avatars and role switching
- Library browsing and PDF reading with bookmarks/reading sessions
- Marketplace listings, wishlist, reviews, and seller flows
- Community groups and direct messages
- Studio writing workspace for drafts and uploaded manuscripts
- Manuscript upload with text extraction for TXT/MD/RTF/text-based PDF files
- Public Works page for published manuscripts
- Manuscript author attribution from the posting user
- Generated manuscript covers that can be saved to manuscripts
- Topbar profile avatar pulled from the current user profile

## Project Structure

```text
Licenta_BookConnect/
  backend/
    Licenta_BookConnect/     Django settings and URL configuration
    ai/                      Local AI text generation endpoint
    books/                   Home/book data API
    chat/                    Groups and messages
    library/                 Library books, user library, bookmarks, sessions
    marketplace/             Listings, payouts, marketplace reviews
    manuscripts/             Drafts, published manuscripts, feedback
    reviews/                 Book reviews
    media/                   Local uploaded files
    manage.py
    requirements.txt

  frontend/
    app/                     Next.js app routes and API routes
    components/              Layout, UI, books, home, theme components
    lib/                     Auth, API clients, roles, services, utilities
    public/                  Static images, books, covers, PDF worker
    types/                   NextAuth type declarations
    package.json

  README.md
  SETUP.md
```

## Important Routes

Frontend pages:

- `/login` and `/register`
- `/` home
- `/library` and `/books/[id]`
- `/marketplace` and `/marketplace/create`
- `/community`
- `/studio` and `/studio/editor/[id]`
- `/manuscripts` and `/manuscripts/[id]`
- `/profile` and `/settings`

Next.js API routes:

- `/api/auth/[...nextauth]`
- `/api/register`
- `/api/me`
- `/api/users`
- `/api/uploads/cloudinary`
- `/api/pdf/[...path]`
- `/api/password-reset/request`
- `/api/password-reset/confirm`

Django API routes:

- `/api/home-data/`
- `/api/library/books/`
- `/api/library/user-library/`
- `/api/library/bookmarks/`
- `/api/library/reading-sessions/`
- `/api/marketplace/listings/`
- `/api/marketplace/payouts/`
- `/api/marketplace/reviews/`
- `/api/manuscripts/`
- `/api/manuscripts/{id}/publish/`
- `/api/manuscripts/{id}/feedback/`
- `/api/chat/groups/`
- `/api/chat/messages/`
- `/ai/generate/`
- `/api/docs/`

## Authentication And Access

Authentication is handled by Next.js and NextAuth.

- User credentials are stored in MongoDB.
- Passwords are hashed with `bcryptjs`.
- Sessions use JWT.
- The Next.js middleware protects app routes and enforces role access.
- Reader areas include Library, Books, Public Works, Community, and PDF proxy routes.
- Writer areas include Studio.
- Users with role `both` can access both reader and writer areas.

## Environment

The app uses two environment files:

- Root `.env` for Django
- `frontend/.env.local` for Next.js

See [SETUP.md](./SETUP.md) for full setup instructions and example values.

## Development Commands

Backend:

```bash
cd backend
python manage.py runserver
```

Frontend:

```bash
cd frontend
npm run dev
```

Checks:

```bash
cd frontend
npx tsc --noEmit
```

```bash
cd backend
python -B -c "import ast, pathlib; ast.parse(pathlib.Path('manuscripts/views.py').read_text())"
```

## Notes

- MongoDB must be running before either app can fully work.
- The frontend expects the Django API at `http://127.0.0.1:8000` by default.
- The Django backend expects the frontend at `http://localhost:3000` for CORS/CSRF during development.
- Cloudinary is optional for some image uploads. If it is not configured, supported local storage fallback is used where available.
- Some AI image generation can depend on external image services. The Studio cover generator also includes a local SVG fallback so a cover can still be shown and saved.
