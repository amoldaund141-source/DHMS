# DHMS — District Health Monitoring System

> **A multilingual, real-time PHC/CHC health centre management platform for district health departments.**  
> Built with React + Vite, Tailwind CSS v3, Framer Motion, Recharts, and React-Leaflet.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Design System](#design-system)
- [Role-Based Routing](#role-based-routing)
- [Authentication Flow](#authentication-flow)
- [API Integration](#api-integration)
- [Internationalisation (i18n)](#internationalisation-i18n)
- [Key Components](#key-components)
- [Screen Build Order](#screen-build-order)
- [Connecting the Real Backend](#connecting-the-real-backend)
- [Adding a New Language](#adding-a-new-language)
- [Hackathon Notes](#hackathon-notes)

---

## Overview

DHMS is a **role-based, multilingual** district health monitoring frontend that connects to a **Django REST API** backend. After login, users are automatically redirected to one of three completely separate app shells based on their role:

| Role | Home Route | Purpose |
|---|---|---|
| `admin` | `/admin` | District-wide overview, hospital comparison, AI insights |
| `staff` | `/staff` | Hospital staff — beds, stock, attendance, appointments |
| `patient` | `/patient` | Book appointments, find nearby hospitals |

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 6+ | Build tool / dev server |
| Tailwind CSS | **v3** | Utility-first CSS (custom design tokens) |
| Framer Motion | latest | Page transitions, card animations, count-up |
| Recharts | latest | Stock trend lines, bed charts, footfall graphs |
| React-Leaflet + Leaflet | latest | Interactive district map (OpenStreetMap, no API key) |
| React Router v6 | latest | Client-side routing, nested protected routes |
| Axios | latest | API calls with JWT interceptor |
| @tanstack/react-query | v5 | Server state, caching, loading/error states |
| react-hook-form | latest | Login, registration, stock update forms |
| date-fns | latest | Date formatting throughout |
| i18next + react-i18next | latest | EN / HI multilingual support |
| @tailwindcss/forms | latest | Consistent form input styling |

---

## Project Structure

```
healthcare-dashboard/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/                  # Static images / icons
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AdminShell.jsx   # Admin layout (sidebar + topbar + Outlet)
│   │   │   ├── StaffShell.jsx   # Staff layout
│   │   │   ├── PatientShell.jsx # Patient layout
│   │   │   ├── Sidebar.jsx      # Collapsible animated sidebar (shared)
│   │   │   └── TopBar.jsx       # Top bar: pulse indicator + lang switcher
│   │   │
│   │   ├── ui/
│   │   │   ├── StatCard.jsx     # Big stat number: count-up + status pill
│   │   │   ├── StatusPill.jsx   # Color-coded pill (success/warning/critical/info)
│   │   │   ├── PulseLine.jsx    # Signature ECG-style SVG animation
│   │   │   ├── Skeleton.jsx     # Shimmer loading states (card/row/chart/text)
│   │   │   ├── PageTransition.jsx # Framer Motion fade+slide route wrapper
│   │   │   └── States.jsx       # EmptyState + ErrorState
│   │   │
│   │   └── charts/              # Recharts wrappers (added per screen)
│   │
│   ├── context/
│   │   └── AuthContext.jsx      # JWT auth state, login(), logout(), useAuth()
│   │
│   ├── hooks/                   # useQuery data-fetching hooks (per domain)
│   │
│   ├── lib/
│   │   ├── api.js               # Axios instance + interceptors + typed API helpers
│   │   └── i18n.js              # i18next config (EN + HI, persists to localStorage)
│   │
│   ├── locales/
│   │   ├── en/translation.json  # English strings
│   │   └── hi/translation.json  # Hindi strings (100% key parity)
│   │
│   ├── mocks/                   # Mock JSON data per screen (used as placeholderData)
│   │
│   ├── pages/
│   │   ├── _Stub.jsx            # Placeholder for screens not yet built
│   │   ├── public/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── NotFoundPage.jsx # 404
│   │   │   └── ErrorPage.jsx    # API offline / network error
│   │   ├── admin/
│   │   │   ├── AdminOverview.jsx      # District dashboard: map + cards + AI
│   │   │   ├── HospitalDetail.jsx     # Drill-down charts per hospital
│   │   │   ├── CompareCharts.jsx      # Side-by-side hospital comparison
│   │   │   ├── AdminNotifications.jsx
│   │   │   └── AdminProfile.jsx
│   │   ├── staff/
│   │   │   ├── StaffDashboard.jsx     # Beds, stock, footfall, doctors
│   │   │   ├── AttendancePage.jsx     # Doctor attendance calendar
│   │   │   ├── AppointmentsPage.jsx   # Today's bookings + free slots
│   │   │   ├── StockPage.jsx          # Full stock management + history
│   │   │   ├── StaffNotifications.jsx
│   │   │   └── StaffProfile.jsx
│   │   └── patient/
│   │       ├── NearbyHospitals.jsx        # Map + list of nearby facilities
│   │       ├── HospitalDetailPatient.jsx  # Patient-safe hospital view
│   │       ├── BookAppointment.jsx        # 3-step booking wizard
│   │       ├── MyAppointments.jsx         # Upcoming / past
│   │       ├── PatientNotifications.jsx
│   │       └── PatientProfile.jsx
│   │
│   ├── router/
│   │   └── index.jsx            # All routes, ProtectedRoute, RootRedirect
│   │
│   ├── App.jsx                  # Root: QueryClient + AuthProvider + BrowserRouter
│   ├── main.jsx                 # ReactDOM.createRoot entry point
│   └── index.css                # Tailwind layers + design system classes
│
├── tailwind.config.js           # Color tokens + font families
├── postcss.config.js
├── vite.config.js               # @/ path alias → src/
├── index.html                   # SEO meta + Leaflet CSS CDN
├── .env.example                 # Environment variable template
└── package.json
```

---

## Prerequisites

- **Node.js** ≥ 18 (LTS recommended) — check: `node -v`
- **npm** ≥ 9 — check: `npm -v`
- A running Django REST API backend, **or** just use mock data (works offline)

---

## Installation

```bash
# 1. Enter the project folder
cd healthcare-dashboard

# 2. Install all dependencies (already committed in package.json)
npm install

# 3. Copy environment template
cp .env.example .env
```

> All packages — Tailwind, Framer Motion, Recharts, Leaflet, i18next, etc. — are already listed in `package.json`. No separate global installs needed.

---

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Django REST API base URL | `http://localhost:8000/api` |

> All `VITE_` variables are embedded in the browser bundle at build time. **Do not store secrets here.**

---

## Running the App

```bash
# Development — hot-reload, opens browser automatically
npm run dev
```

App runs at **`http://localhost:5173`**

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Design System

All design tokens are defined **once** in `tailwind.config.js`. Never hardcode hex values inline — always use Tailwind token classes.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#0F766E` | Buttons, active nav, key accents |
| `ink` | `#14212B` | Headings, primary text |
| `body` | `#3D4B54` | Paragraph / secondary text |
| `mist` | `#F6F8F7` | Page background |
| `surface` | `#FFFFFF` | Cards, panels |
| `border` | `#E2E8E6` | Dividers, card borders |
| `success` | `#1B9C6E` | Free beds, doctor present, stock healthy |
| `warning` | `#D68A1F` | Low stock, approaching threshold |
| `critical` | `#C0392B` | Stock-out, bed full, doctor absent |
| `info` | `#2563A8` | AI insights, forecast lines on charts |

**Using tokens in JSX:**
```jsx
<div className="bg-primary text-surface">Primary button</div>
<span className="text-critical font-mono">0 units</span>
<div className="border border-border rounded-xl shadow-card bg-surface">Card</div>
```

### Typography

| Font | Tailwind Class | Used For |
|---|---|---|
| **Space Grotesk** | `font-display` | Page titles, hospital names, section headings |
| **Inter** | `font-body` | All labels, table text, navigation, body copy |
| **IBM Plex Mono** | `font-mono` | **ALL numbers** — stock counts, %, bed counts, stat figures |

> **Critical rule**: Every numeric value — even inline in a sentence — must use `font-mono` with `tabular-nums`. This is the app's signature design detail. Numbers should visually read as "instrument data."

```jsx
<span className="font-mono tabular text-4xl font-semibold text-ink">247</span>
<p className="font-body text-sm">
  Occupancy: <span className="font-mono font-medium">82%</span> of beds filled.
</p>
```

### Pre-built Component Classes (`index.css`)

| Class | Description |
|---|---|
| `.card` | White surface with `border-border` + `shadow-card` |
| `.card-hover` | Adds `translateY(-2px)` + deeper shadow on hover |
| `.pill` | Base pill (use with variant below) |
| `.pill-success / .pill-warning / .pill-critical / .pill-info` | Coloured pill backgrounds |
| `.stat-number` | Plex Mono, `tabular-nums`, bold, tight tracking |
| `.stat-label` | Uppercase, wide letter-spacing, tiny, body colour |
| `.btn-primary` | Teal filled button — `scale(1.02)` on hover |
| `.btn-ghost` | Outlined teal button |
| `.skeleton` | CSS shimmer animation for loading states |
| `.nav-item` | Sidebar nav link with active indicator bar |
| `.form-input` | Styled text input with focus ring |
| `.ai-panel` | Info-tint panel for AI-generated content |

---

## Role-Based Routing

After login, the router reads `user.role` from the JWT response and redirects:

```
role === 'admin'   →  /admin      (AdminShell)
role === 'staff'   →  /staff      (StaffShell)
role === 'patient' →  /patient    (PatientShell)
```

**ProtectedRoute** wraps every role shell. Accessing `/admin` without being authenticated, or as a `staff` user, automatically redirects to the correct destination.

```
Public (no auth):  /landing  /login  /register  /error  /404
Admin only:        /admin/*
Staff only:        /staff/*
Patient only:      /patient/*
```

---

## Authentication Flow

```
1. User submits login form
2. POST /auth/login/  →  backend returns { token, user: { id, name, role, ... } }
3. AuthContext.login(token, user) stores both in localStorage under:
     dhms_token  — JWT string
     dhms_user   — JSON user object
4. Router reads role → redirects to correct shell home
5. Every subsequent API call automatically attaches:
     Authorization: Bearer <token>
6. On 401 response from any endpoint → auto-logout + redirect to /login
7. On network error (no response) → redirect to /error
```

**Relevant files:**
- `src/context/AuthContext.jsx` — state store, `useAuth()` hook
- `src/lib/api.js` — Axios interceptors handling steps 5–7

**`useAuth()` hook returns:**
```js
const { user, token, role, isAuthenticated, isLoading, login, logout } = useAuth()
```

---

## API Integration

All calls go through `src/lib/api.js`. The Axios instance has:
- `baseURL` from `VITE_API_BASE_URL`
- 15-second timeout
- JWT auto-attach on every request
- 401 → logout, network error → `/error`

### Typed API helpers (all pre-defined):

```js
import {
  authApi, hospitalsApi, stockApi, bedsApi,
  attendanceApi, appointmentsApi, aiApi,
  notificationsApi, profileApi
} from '@/lib/api'

authApi.login({ email, password })
authApi.register(data)

hospitalsApi.list({ type: 'PHC', area: 'rural', status: 'critical' })
hospitalsApi.detail(hospitalId)

stockApi.list(hospitalId)
stockApi.update(hospitalId, stockData)

bedsApi.summary(hospitalId)

attendanceApi.list(hospitalId, { date: '2026-07-01' })
attendanceApi.mark(hospitalId, { doctor_id: 5, status: 'present' })

appointmentsApi.book({ hospital, doctor, slot, patient })
appointmentsApi.list({ role: 'patient', patient_id: 12 })
appointmentsApi.slots(hospitalId, doctorId, date)

aiApi.insights(districtId)

notificationsApi.list({ unread: true })
notificationsApi.markRead(notificationId)
```

### Mock data pattern

Every screen hook uses `placeholderData` so the UI works without a backend:

```js
// src/hooks/useHospitals.js
import { MOCK_HOSPITALS } from '@/mocks/hospitals.mock'
import { hospitalsApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export function useHospitals(filters) {
  return useQuery({
    queryKey: ['hospitals', filters],
    queryFn: () => hospitalsApi.list(filters).then(r => r.data),
    placeholderData: MOCK_HOSPITALS,   // ← one-line swap: delete when backend ready
  })
}
```

---

## Internationalisation (i18n)

Two locales fully set up with **100% key parity**: English (`en`) and Hindi (`hi`).

### Language switcher

`EN` / `HI` toggle lives in the top bar on every screen. Selection persists to `localStorage` automatically and sets `document.documentElement.lang`.

### Using translations in components

```jsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return (
    <>
      <h1>{t('dashboard.districtOverview')}</h1>
      <p>{t('dashboard.lastUpdated')}: {formattedDate}</p>
    </>
  )
}
```

### Adding a new translation key

1. Add to `src/locales/en/translation.json`
2. Add the same key + Hindi translation to `src/locales/hi/translation.json`
3. Use `t('your.new.key')` in JSX — done

### Adding a new language (e.g. Marathi)

1. Create `src/locales/mr/translation.json` (copy en keys, fill Marathi values)
2. In `src/lib/i18n.js`:
   ```js
   import mr from '@/locales/mr/translation.json'
   // inside resources:
   mr: { translation: mr },
   ```
3. In `src/components/layout/TopBar.jsx`, add to `LANG_OPTIONS`:
   ```js
   { code: 'mr', label: 'MR' }
   ```

---

## Key Components

### `<StatCard />`

```jsx
import StatCard from '@/components/ui/StatCard'

<StatCard
  label="Total Facilities"   // stat-label: uppercase + letter-spaced
  value={42}                  // animates 0 → 42 on mount (RAF count-up)
  unit="%"                    // optional suffix rendered in font-mono
  variant="success"           // 'success' | 'warning' | 'critical' | 'info'
  pillLabel="Healthy"         // text inside the colored pill
  trend="+3 vs last month"    // small secondary line below pill
  icon={<MyIcon />}           // optional icon in top-right corner
  delay={0.1}                 // Framer Motion stagger delay (seconds)
  loading={isLoading}         // shows skeleton shimmer if true
/>
```

### `<StatusPill />`

```jsx
import StatusPill from '@/components/ui/StatusPill'

<StatusPill variant="success"  label="Available" />
<StatusPill variant="warning"  label="Low Stock" />
<StatusPill variant="critical" label="Beds Full" />
<StatusPill variant="info"     label="AI Insight" />
```

### `<PulseLine />` — signature ECG element

```jsx
import PulseLine from '@/components/ui/PulseLine'

// As section divider (hairline with animated blip)
<PulseLine mode="divider" className="my-4" />

// Inline next to "Last updated" timestamps
<PulseLine mode="indicator" className="text-primary" />
```

### Skeleton loaders

```jsx
import { SkeletonCard, SkeletonRow, SkeletonChart, SkeletonText } from '@/components/ui/Skeleton'

// Always prefer skeleton over spinner
{isLoading ? <SkeletonCard /> : <StatCard ... />}
{isLoading ? <SkeletonChart height={240} /> : <MyChart data={data} />}
{isLoading ? <SkeletonRow /> : <HospitalRow hospital={hospital} />}
```

### `<EmptyState />` and `<ErrorState />`

```jsx
import { EmptyState, ErrorState } from '@/components/ui/States'

// When there is no data yet
<EmptyState
  title="No hospitals found"
  description="Try adjusting your filters."
  action={<button className="btn-primary">Clear filters</button>}
/>

// When API call failed
<ErrorState onRetry={refetch} />
```

---

## Screen Build Order

Screens are built one at a time (say "next" to proceed to the next screen):

| # | Screen | Role | Status |
|---|---|---|---|
| 1 | Landing page | Public | 🔧 Next |
| 2 | Login page | Public | ⬜ |
| 3 | Registration | Public | ⬜ |
| 4 | Admin Overview Dashboard | Admin | ⬜ |
| 5 | Hospital Detail | Admin | ⬜ |
| 6 | Comparison Charts | Admin | ⬜ |
| 7 | Staff Dashboard | Staff | ⬜ |
| 8 | Attendance Page | Staff | ⬜ |
| 9 | Appointments Page | Staff | ⬜ |
| 10 | Stock Management | Staff | ⬜ |
| 11 | Nearby Hospitals | Patient | ⬜ |
| 12 | Hospital Detail (patient) | Patient | ⬜ |
| 13 | Book Appointment Wizard | Patient | ⬜ |
| 14 | My Appointments | Patient | ⬜ |
| 15 | Profile / Settings | All | ⬜ |
| 16 | Notifications | All | ⬜ |
| 17 | 404 / Error pages | All | ✅ Done |

---

## Connecting the Real Backend

### Step 1 — Set API URL

```env
# .env
VITE_API_BASE_URL=https://your-django-api.example.com/api
```

### Step 2 — Verify login response shape

The app expects:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Dr. Ananya Rao",
    "email": "ananya@raigad.gov.in",
    "role": "admin"
  }
}
```

If your backend uses a different shape, update the response destructuring in `LoginPage.jsx`.

### Step 3 — Remove mock `placeholderData`

For each hook in `src/hooks/`, delete the `placeholderData` line:

```js
// Before
return useQuery({
  queryKey: ['hospitals', filters],
  queryFn: () => hospitalsApi.list(filters).then(r => r.data),
  placeholderData: MOCK_HOSPITALS,  // ← delete this line
})

// After — live API
return useQuery({
  queryKey: ['hospitals', filters],
  queryFn: () => hospitalsApi.list(filters).then(r => r.data),
})
```

That's the only change needed per screen.

---

## Hackathon Notes

**Rules everyone on the frontend team must follow:**

- All UI strings → `t('key')` — **never** hardcode English text in JSX
- All numbers → `font-mono tabular` — this is the signature visual detail
- All hex values → Tailwind token classes (`bg-primary`, `text-critical`)
- Loading states → `<Skeleton*>` components — never raw spinners or blank divs
- Empty states → `<EmptyState>` — never let a section go blank

**Before marking any screen done:**
- [ ] Renders correctly with mock data
- [ ] Skeleton shows when `loading={true}`
- [ ] EN ↔ HI toggle works (no hardcoded visible strings)
- [ ] Responsive: narrow viewport stacks cards, sidebar collapses
- [ ] Zero console errors

**File naming convention:**
- Components: `PascalCase.jsx`
- Hooks: `useCamelCase.js`
- Mock files: `camelCase.mock.js`
- Locale keys: `dot.separated.lowercase`

---

*District Health Monitoring System — Hackathon Frontend*  
*Raigad District, Maharashtra | Built with React + Vite*
