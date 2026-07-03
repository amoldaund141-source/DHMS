# 🏠 RUN LOCALLY ON LOCALHOST - STEP BY STEP

## 📋 REQUIREMENTS CHECK

Before starting, verify you have:
- ✅ Python 3.12+ installed
- ✅ Node.js 18+ installed
- ✅ npm 9+ installed
- ✅ Git (already installed)

### Check Your Versions:

Open PowerShell and run:
```powershell
python --version
node --version
npm --version
```

---

## 🔷 PHASE 1: BACKEND SETUP (5 minutes)

### Step 1.1: Navigate to Backend
```powershell
cd c:\Users\Admin\Desktop\vscode\test\backend
```

### Step 1.2: Create Virtual Environment
```powershell
python -m venv venv
```

### Step 1.3: Activate Virtual Environment
```powershell
# Windows
venv\Scripts\activate

# You should see (venv) at the start of your terminal prompt
```

### Step 1.4: Install Dependencies
```powershell
pip install -r requirements.txt
```

**⏳ This takes 2-3 minutes. Wait for it to complete.**

### Step 1.5: Create Database (Migrations)
```powershell
python manage.py makemigrations
python manage.py migrate
```

You should see:
```
Running migrations...
  Applying core.0001_initial... OK
```

### Step 1.6: Create Superuser (Admin Account)
```powershell
python manage.py createsuperuser
```

When prompted, enter:
```
Username: admin
Email: admin@dhms.in
Password: admin123
Password (again): admin123
```

### Step 1.7: Load Seed Data (Test Data)
```powershell
python manage.py shell < seed_data.py
```

You should see:
```
✓ Created test users and sample data
```

### Step 1.8: Start Django Server
```powershell
python manage.py runserver
```

**🟢 SUCCESS!** You should see:
```
Starting development server at http://127.0.0.1:8000/
```

### ✅ Backend Running!
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/

**KEEP THIS TERMINAL RUNNING** - Don't close it!

---

## 🔷 PHASE 2: FRONTEND SETUP (5 minutes)

### Step 2.1: Open NEW Terminal
Press `Ctrl + Shift + `backtick`` in VS Code to open a **new terminal** (keep the backend running in the old one)

### Step 2.2: Navigate to Project Root
```powershell
cd c:\Users\Admin\Desktop\vscode\test
```

### Step 2.3: Install Frontend Dependencies
```powershell
npm install
```

**⏳ This takes 2-3 minutes. Wait for it.**

### Step 2.4: Start Frontend Dev Server
```powershell
npm run dev
```

**🟢 SUCCESS!** You should see:
```
VITE v8.1.1  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### ✅ Frontend Running!
- Application: http://localhost:5173

**KEEP THIS TERMINAL RUNNING** - Don't close it!

---

## 🔷 PHASE 3: TEST YOUR APP (5 minutes)

### You Now Have:
```
Backend API ────────→ http://localhost:8000/api
                     (with AI & Telegram features)
                     
Frontend UI ────────→ http://localhost:5173
                     (connects to backend)
```

### Step 3.1: Open Frontend in Browser
1. Go to http://localhost:5173
2. You should see the **Healthcare Dashboard login page**

### Step 3.2: Test Login with Admin
- **Email:** `admin@dhms.in`
- **Password:** `admin123`
- Click **Login**

✅ **Should see Admin Dashboard**

### Step 3.3: Test Login with Staff
Logout and try:
- **Email:** `staff@dhms.in`
- **Password:** `staff123`

✅ **Should see Staff Dashboard (Beds, Stock, Attendance)**

### Step 3.4: Test Login with Patient
Logout and try:
- **Email:** `patient@dhms.in`
- **Password:** `patient123`

✅ **Should see Patient Dashboard (Book Appointments, Nearby Hospitals)**

### Step 3.5: Test API Endpoints

Open new terminal (keep both running) and test:

```powershell
# Get all districts
curl http://localhost:8000/api/districts/

# Get all hospitals
curl http://localhost:8000/api/hospitals/

# Get AI insights (requires OpenRouter API)
curl http://localhost:8000/api/insights/
```

---

## 🔷 PHASE 4: TEST FEATURES (Optional)

### AI Insights Feature
1. Go to Admin Dashboard → Overview
2. Scroll down to "AI-Powered Insights"
3. Should show insights from OpenRouter

**If it works:** ✅ AI integration working!
**If blank:** Check backend logs for API errors

### Telegram Alerts Feature
1. Modify stock quantity to trigger alert (< 10%)
2. Check if you receive Telegram message
3. Message should come to chat ID: `6729001488`

**If you get message:** ✅ Telegram working!
**If not:** Check backend logs

### Multilingual Support
1. Top right corner → Language selector
2. Switch between English 🇬🇧 and Hindi 🇮🇳
3. UI should change language

**If it works:** ✅ i18n working!

---

## 📊 WHAT YOU'VE VERIFIED

If all tests pass, you know:
- ✅ Backend API is working
- ✅ Frontend connects to backend
- ✅ Authentication works
- ✅ Database is functional
- ✅ All 3 roles work correctly
- ✅ AI integration working
- ✅ Telegram integration working
- ✅ Multilingual support working

---

## 🛑 STOPPING THE SERVERS

When you're done testing:

**Backend Terminal:**
```powershell
# Press Ctrl + C
```

**Frontend Terminal:**
```powershell
# Press Ctrl + C
```

Both will stop.

---

## 🆘 TROUBLESHOOTING

### Backend won't start - "Port already in use"
```powershell
# Use different port
python manage.py runserver 8001
```

### Frontend won't connect to backend
1. Check backend is running on http://localhost:8000
2. Check `VITE_API_BASE_URL` in `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

### Login fails
```powershell
# In backend terminal, run seed data again
python manage.py shell < seed_data.py
```

### npm install fails
```powershell
# Clear cache and try again
npm cache clean --force
npm install
```

### Python virtual environment not activating
```powershell
# Use full path
c:\Users\Admin\Desktop\vscode\test\backend\venv\Scripts\activate
```

---

## ✅ READY FOR NEXT STEPS

Once everything works locally:
1. Stop both servers (Ctrl + C)
2. Commit your changes: `git add . && git commit -m "Verified local setup"`
3. Push to GitHub (Phase 2 from DEPLOYMENT_PLAN.md)
4. Deploy to Render (Phases 3-5 from DEPLOYMENT_PLAN.md)

---

## 🎯 QUICK COMMAND REFERENCE

### Terminal 1 - Backend:
```powershell
cd c:\Users\Admin\Desktop\vscode\test\backend
venv\Scripts\activate
python manage.py runserver
```

### Terminal 2 - Frontend:
```powershell
cd c:\Users\Admin\Desktop\vscode\test
npm run dev
```

### Access Points:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Admin Panel: http://localhost:8000/admin/

---

**Now start with Phase 1! Follow each step carefully.** 🚀

