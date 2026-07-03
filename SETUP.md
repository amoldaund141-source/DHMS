# Healthcare Dashboard — Complete Setup & Deployment Guide

This guide explains how to run, test, and deploy the **District Health Monitoring System / Healthcare Dashboard** project.

## 1. Project Overview

This project has two main parts:

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Django REST Framework
- **Database:** SQLite for local development, PostgreSQL for production
- **Deployment-ready files included:** `render.yaml`, Dockerfiles, `.env.example`, and `docker-compose.prod.yml`

## 2. Folder Structure

```text
healthcare-dashboard/
├── backend/                 # Django backend
├── src/                     # React frontend source code
├── public/                  # Frontend static files
├── package.json             # Frontend dependencies/scripts
├── render.yaml              # Render deployment configuration
├── docker-compose.prod.yml  # Docker production setup
├── frontend.Dockerfile      # Frontend Dockerfile
├── .env.example             # Frontend environment example
└── SETUP.md                 # This setup guide
```

## 3. Requirements

Install these before running the project:

- Node.js 18 or higher
- npm 9 or higher
- Python 3.11 or higher
- pip
- Git
- Optional: Docker Desktop

Check versions:

```bash
node -v
npm -v
python --version
pip --version
```

## 4. Environment Variables

### Frontend `.env`

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Example:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Backend `.env`

Create a `.env` file inside the `backend` folder:

```bash
cd backend
cp .env.example .env
```

Example:

```env
SECRET_KEY=change-this-to-a-long-random-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
JWT_ACCESS_TOKEN_LIFETIME_MIN=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
CORS_ALLOWED_ORIGINS=http://localhost:5173
OPENROUTER_API_KEY=
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

Important: Never upload real `.env` files to GitHub.

## 5. Backend Local Setup

From the project root:

```bash
cd backend
python -m venv venv
```

Activate virtual environment:

### Windows

```bash
venv\Scripts\activate
```

### macOS/Linux

```bash
source venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Run database migrations:

```bash
python manage.py migrate
```

Optional: load seed/demo data:

```bash
python seed_data.py
```

Create admin user:

```bash
python manage.py createsuperuser
```

Run backend server:

```bash
python manage.py runserver
```

Backend will run at:

```text
http://localhost:8000
```

API base URL:

```text
http://localhost:8000/api
```

Admin panel:

```text
http://localhost:8000/admin
```

## 6. Frontend Local Setup

Open a new terminal in the project root:

```bash
npm ci
```

Run frontend development server:

```bash
npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

## 7. Production Build Check

Before deploying, always run:

```bash
npm run build
```

If the build succeeds, the production frontend files will be created in:

```text
dist/
```

Preview production build locally:

```bash
npm run preview
```

## 8. Backend Health Check

Inside the `backend` folder:

```bash
python manage.py check
python manage.py migrate --check
```

If both commands pass, the backend is ready.

## 9. Docker Production Setup

From the project root:

```bash
docker compose -f docker-compose.prod.yml up --build
```

To stop containers:

```bash
docker compose -f docker-compose.prod.yml down
```

## 10. Deploy on Render

This project includes `render.yaml`, so Render can deploy backend, frontend, and PostgreSQL.

### Steps

1. Push the project to a public or private GitHub repository.
2. Go to Render.
3. Click **New +**.
4. Select **Blueprint**.
5. Connect your GitHub repository.
6. Render will detect `render.yaml`.
7. Create the services.
8. Wait for deployment to finish.

### Render Services Created

- `dhms-postgres` — PostgreSQL database
- `dhms-backend` — Django backend
- `dhms-frontend` — React static frontend

### Important Render Environment Variables

Backend:

```env
DEBUG=False
SECRET_KEY=auto-generated-by-render
DATABASE_URL=auto-linked-from-render-postgres
ALLOWED_HOSTS=*
CORS_ALLOWED_ORIGINS=https://dhms-frontend.onrender.com
```

Frontend:

```env
VITE_API_BASE_URL=https://dhms-backend.onrender.com/api
```

After deployment, update `CORS_ALLOWED_ORIGINS` and `VITE_API_BASE_URL` if your Render service names are different.

## 11. GitHub Upload Checklist

Before pushing to GitHub, make sure these are not uploaded:

```text
.env
backend/.env
node_modules/
backend/venv/
backend/db.sqlite3
.git/
```

Use these commands:

```bash
git init
git add .
git commit -m "Initial production-ready healthcare dashboard"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## 12. Common Errors and Fixes

### Error: `npm install` or `npm run build` fails because of node_modules

Fix:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

For production/CI, prefer:

```bash
npm ci
```

### Error: CORS blocked

Check backend `.env`:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

For Render:

```env
CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
```

### Error: Django secret key missing

Add this in `backend/.env`:

```env
SECRET_KEY=your-secret-key-here
```

### Error: Database not migrated

Run:

```bash
cd backend
python manage.py migrate
```

### Error: Frontend API not connecting

Check root `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Then restart the frontend server.

## 13. Final Deployment Checklist

Before final submission/deployment:

- Backend `.env` created
- Frontend `.env` created
- `python manage.py check` passes
- `python manage.py migrate` completed
- `npm ci` completed
- `npm run build` passes
- Real secrets are not committed
- Render environment variables are updated
- Frontend URL is added in backend CORS
- Backend API URL is added in frontend env

## 14. Useful Commands Summary

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Frontend:

```bash
npm ci
npm run dev
npm run build
npm run preview
```

Docker:

```bash
docker compose -f docker-compose.prod.yml up --build
```

## 15. Security Note

The old uploaded project contained real API keys in `.env`. Those keys should be changed immediately from their provider dashboards. The production-ready zip only includes safe `.env.example` files.
