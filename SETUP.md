# BookConnect Setup

This guide explains how to run BookConnect locally on Windows, macOS, or Linux.

## Prerequisites

Install:

- Python 3.10 or newer
- Node.js 18 or newer
- MongoDB running locally on port `27017`
- Git

Recommended:

- A Python virtual environment for the backend
- Two terminal windows, one for Django and one for Next.js

## 1. Clone Or Open The Project

```bash
cd Licenta_BookConnect
```

## 2. Configure Environment Variables

Create or update the root `.env` file:

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB=WebAppDB
DEBUG=1
ALLOWED_HOSTS=localhost,127.0.0.1,[::1]
MEDIA_URL=/media/
MEDIA_ROOT=media
```

Create or update `frontend/.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=WebAppDB
NEXTAUTH_SECRET=change-this-to-a-long-random-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
```

Optional frontend AI key:

```env
NEXT_PUBLIC_OPENROUTER_API_KEY=your-openrouter-key
```

Optional Cloudinary variables, if you want cloud image uploads:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

If Cloudinary is not configured, the app still supports local fallback storage for relevant uploads.

## 3. Backend Setup

Open a terminal in the project root.

```bash
cd backend
python -m venv venv
```

Activate the environment.

Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Windows cmd:

```cmd
venv\Scripts\activate.bat
```

macOS/Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run Django:

```bash
python manage.py runserver
```

The backend should be available at:

```text
http://127.0.0.1:8000
```

Django API documentation:

```text
http://127.0.0.1:8000/api/docs/
```

## 4. Frontend Setup

Open a second terminal in the project root.

```bash
cd frontend
npm install
npm run dev
```

The frontend should be available at:

```text
http://localhost:3000
```

## 5. Create An Account

1. Open `http://localhost:3000/register`.
2. Create a user.
3. Choose an account type:
   - Reader: Library, Public Works, Community
   - Writer: Studio
   - Both: Reader and writer features
4. Log in at `http://localhost:3000/login`.

You can change the account type later from `/settings`.

## 6. Common Workflows

Profile:

- Go to `/profile` to view your profile.
- Go to `/settings` to update username, email, about text, avatar, and account type.
- The top-right avatar uses the saved profile image.

Studio:

- Go to `/studio`.
- Create a new manuscript or upload a supported file.
- Open the editor to update title, author name, and content.
- Generate a cover and click `Save as manuscript cover`.
- Publish only after title and author name are filled.

Public Works:

- Published manuscripts appear at `/manuscripts`.
- Each public manuscript shows cover, title, and author name.
- Readers can open a manuscript and leave feedback.

Library:

- Use `/library` to browse books.
- Use `/books/[id]` to open book details.
- PDF reading uses the bundled `public/pdf.worker.min.mjs`.

Marketplace:

- Use `/marketplace/create` to create a listing.
- Use `/marketplace` to browse listings.

Community:

- Use `/community` for groups and messages.

## 7. Useful Commands

Frontend type check:

```bash
cd frontend
npx tsc --noEmit
```

Frontend production build:

```bash
cd frontend
npm run build
```

Backend syntax smoke check:

```bash
cd backend
python -B -c "import ast, pathlib; ast.parse(pathlib.Path('manuscripts/views.py').read_text(encoding='utf-8'))"
```

Run Django migrations, if needed for SQL-backed Django apps/admin:

```bash
cd backend
python manage.py migrate
```

## 8. Troubleshooting

MongoDB connection errors:

- Make sure MongoDB is running.
- Check `MONGO_URI`, `MONGO_DB`, `MONGODB_URI`, and `MONGODB_DB`.
- Default local database is `WebAppDB`.

NextAuth secret errors:

- Set `NEXTAUTH_SECRET` in `frontend/.env.local`.
- Use a long random value.

Login redirects unexpectedly:

- Check that `NEXTAUTH_URL=http://localhost:3000`.
- Clear old auth cookies if you changed auth settings.

Django CORS or CSRF errors:

- Make sure the frontend is running at `http://localhost:3000`.
- Make sure the backend is running at `http://127.0.0.1:8000`.
- Check `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` in Django settings.

Manuscript uploads do not show text:

- TXT, MD, RTF, and text-based PDF files can be extracted.
- Scanned PDFs and DOC/DOCX files may not have readable browser-extractable text. Paste the text into the editor if extraction fails.

Cover image does not load:

- The cover generator includes a local SVG fallback.
- Generate again and save with `Save as manuscript cover`.

Avatar does not show in the top-right corner:

- Go to `/settings` and save an avatar.
- Refresh the page.
- If the image URL is invalid, the UI falls back to initials.

`npm run lint` asks to configure ESLint:

- This project currently uses Next's `next lint` script, which can prompt for setup in newer Next.js versions.
- Use `npx tsc --noEmit` for TypeScript validation until ESLint is configured.

## 9. Ports

Default local ports:

- Frontend: `http://localhost:3000`
- Backend: `http://127.0.0.1:8000`
- MongoDB: `mongodb://localhost:27017`
