# DHMS Backend

**District Health Management System** — Django REST API

---

## Quick Start

### 1. Create virtual environment & install dependencies
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment
```bash
# Edit .env with your values
# Required for dev: SECRET_KEY, DATABASE_URL (SQLite default works)
# Optional: OPENROUTER_API_KEY, TELEGRAM_BOT_TOKEN, CELERY_BROKER_URL

# Generate a SECRET_KEY:
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 3. Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create superuser (Django admin)
```bash
python manage.py createsuperuser
```

### 5. Seed mock data (matches frontend exactly)
```bash
python manage.py shell < seed_data.py
```
This creates:
- `admin@dhms.in` / `admin123` → admin role, Raigad district
- `staff@dhms.in` / `staff123` → staff role, Alibag PHC
- `patient@dhms.in` / `patient123` → patient role
- All 6 hospitals, doctors, stock, beds from frontend mocks

### 6. Run dev server
```bash
python manage.py runserver
```
API is live at: `http://localhost:8000/api/`  
Django admin: `http://localhost:8000/admin/`

---

## Running Celery (Background Tasks)

> Requires Redis running locally: `redis-server`

```bash
# Worker (processes tasks)
celery -A config worker -l info

# Beat scheduler (periodic tasks every 6h, 30min)
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

---

## API Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login/` | None | Login → `{ token, user }` |
| POST | `/api/auth/register/` | None | Patient registration |
| GET | `/api/auth/me/` | JWT | Current user |
| GET | `/api/hospitals/` | JWT | Hospital list (filters: `area`, `type`, `lat`, `lng`) |
| GET | `/api/hospitals/district-stats/` | Admin | KPI cards |
| GET | `/api/hospitals/footfall-trend/` | Admin | 7-day footfall chart |
| GET | `/api/hospitals/<id>/` | JWT | Hospital detail |
| GET | `/api/hospitals/<id>/stock/` | Staff/Admin | Stock list |
| PATCH | `/api/hospitals/<id>/stock/<item_id>/` | Staff/Admin | Update stock |
| GET | `/api/appointments/` | JWT | Appointments (role-scoped) |
| POST | `/api/appointments/` | Patient | Book appointment |
| GET | `/api/appointments/slots/` | JWT | Available slots |
| GET | `/api/notifications/` | JWT | Notifications |
| PATCH | `/api/notifications/read-all/` | JWT | Mark all read |
| GET | `/api/insights/` | Admin | AI insights (`?lang=en\|mr`) |
| GET | `/api/insights/forecast/` | Admin | Stock-out forecast |
| GET | `/api/insights/redistribution/` | Admin | Redistribution suggestions |
| GET | `/api/flagged/` | Admin | Flagged hospitals |
| POST | `/api/import/stock/` | Staff/Admin | Excel stock import |
| POST | `/api/import/patients/` | Admin | Excel patient import |

---

## Excel Import Formats

### Stock Import (`/api/import/stock/` or `python manage.py import_stock file.xlsx`)
| Column | Required | Example |
|--------|----------|---------|
| `hospital_name` | ✓ | Alibag PHC |
| `medicine` | ✓ | Paracetamol 500mg |
| `unit` | ✓ | tabs |
| `current_qty` | ✓ | 120 |
| `ordered` | | 500 |
| `dispensed` | | 380 |
| `threshold` | ✓ | 200 |

### Patient Import (`/api/import/patients/` or `python manage.py import_patients file.xlsx`)
| Column | Required | Example |
|--------|----------|---------|
| `name` | ✓ | Ramesh Patil |
| `email` | ✓ | ramesh@example.com |
| `phone` | | +91 9876543210 |
| `dob` | | 1985-06-15 |
| `gender` | | Male |
| `blood_group` | | O+ |
| `emergency_contact` | | +91 9876543211 |
| `district_code` | | RAIGAD |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | ✓ | Django secret key |
| `DATABASE_URL` | | Default: SQLite. Use `postgres://...` for PostgreSQL |
| `CORS_ALLOWED_ORIGINS` | | Default: `http://localhost:5173` |
| `OPENROUTER_API_KEY` | | Free at https://openrouter.ai/keys |
| `OPENROUTER_MODEL` | | Default: `meta-llama/llama-3.1-8b-instruct:free` |
| `TELEGRAM_BOT_TOKEN` | | From @BotFather on Telegram |
| `TELEGRAM_CHAT_ID` | | Your group chat ID |
| `CELERY_BROKER_URL` | | Default: `redis://localhost:6379/0` |

---

## Folder Structure

```
backend/
├── manage.py
├── seed_data.py          ← Run once to load Raigad mock data
├── .env                  ← Your secrets (never commit)
├── requirements.txt
│
├── config/
│   ├── settings.py       ← All Django settings
│   ├── urls.py           ← Root URL config
│   ├── celery.py         ← Celery app + beat schedule
│   └── wsgi.py
│
├── core/
│   ├── models.py         ← All data models
│   ├── serializers.py    ← DRF serializers (camelCase output)
│   ├── views.py          ← All API views
│   ├── urls.py           ← All API routes
│   ├── permissions.py    ← Role-based permission classes
│   ├── signals.py        ← post_save → Telegram alert trigger
│   ├── tasks.py          ← Celery tasks (AI, alerts, flagging)
│   ├── admin.py          ← Django admin (with import-export)
│   └── management/commands/
│       ├── import_stock.py
│       └── import_patients.py
│
└── services/
    ├── ai.py             ← OpenRouter API client
    ├── telegram.py       ← Telegram Bot sender
    └── geo.py            ← Haversine distance calculation
```

---

## Frontend Flags (Missing UI — Needs Frontend Work)

These backend APIs exist but frontend doesn't have UI for them yet:

| API | Missing Frontend Page |
|-----|----------------------|
| `GET /api/hospitals/:id/tests/` | Test availability section on hospital detail |
| `GET /api/insights/forecast/` | Forecast chart on admin overview |
| `GET /api/insights/redistribution/` | Redistribution suggestions panel |
| `GET /api/flagged/` | Flagged hospitals intervention log table |
| Map component | Hospital has `lat`/`lng` but no map component on frontend |

> Pass this list to whoever owns the frontend to keep both sides in sync.
