# 🏍️ Pittsburgh Ruff Ryders — Attendance Tracker

Mobile-first web app for tracking chapter event attendance and points.
Built with **Next.js + Supabase**, deployed free on **Vercel**.

---

## ✅ POINT SYSTEM

| Event Type     | Points |
|---------------|--------|
| Annual Event   | 2 pts  |
| Beer Blast     | 1 pt   |
| Bike Night     | 1 pt   |

---

## 🚀 SETUP GUIDE (follow in order)

### STEP 1 — Create a free Supabase database

1. Go to **https://supabase.com** → click **Start for free**
2. Sign up and create a new project
   - Name it: `pgh-ruff-ryders`
   - Set a database password (save it somewhere)
   - Choose region: **US East**
3. Wait ~2 minutes for the project to spin up
4. Go to **SQL Editor** (left sidebar)
5. Click **New query**
6. Copy and paste the entire contents of `supabase/schema.sql`
7. Click **Run** — this creates your tables and loads all 16 members

### STEP 2 — Get your Supabase credentials

1. In Supabase, go to **Settings → API** (gear icon in sidebar)
2. Copy these two values:
   - **Project URL** → looks like `https://abcdefgh.supabase.co`
   - **anon / public key** → long string starting with `eyJ...`
3. Keep these ready for Step 4

### STEP 3 — Put the code on GitHub

1. Go to **https://github.com** → sign in (or create a free account)
2. Click the **+** icon → **New repository**
3. Name it: `pgh-ruff-ryders-tracker`
4. Keep it **Private** → click **Create repository**
5. On your computer, open a terminal in this project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pgh-ruff-ryders-tracker.git
git push -u origin main
```

> If you don't have Git, download it at https://git-scm.com

### STEP 4 — Deploy to Vercel

1. Go to **https://vercel.com** → click **Sign up** → choose **Continue with GitHub**
2. Click **Add New Project**
3. Find `pgh-ruff-ryders-tracker` and click **Import**
4. Under **Environment Variables**, add these two:
   ```
   NEXT_PUBLIC_SUPABASE_URL       →  paste your Project URL from Step 2
   NEXT_PUBLIC_SUPABASE_ANON_KEY  →  paste your anon key from Step 2
   ```
5. Click **Deploy**
6. Wait ~1 minute — Vercel gives you a live URL like:
   ```
   https://pgh-ruff-ryders-tracker.vercel.app
   ```

### STEP 5 — Add to phone home screen

**iPhone:**
1. Open the URL in Safari
2. Tap the share icon (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add** — the app icon appears on your home screen

**Android:**
1. Open the URL in Chrome
2. Tap the three dots menu
3. Tap **Add to Home Screen**
4. Tap **Install**

---

## 📱 HOW TO USE

**Leaderboard tab** — See all members ranked by total points. Updates live.

**Events tab** — Add events:
- Type the event name
- Select the month
- Select the type (Annual = 2 pts, Beer Blast / Bike Night = 1 pt)
- Tap **Add Event**

**Attendance tab** — Mark who showed up:
- Select the event from the dropdown
- Tap each member who attended — button turns green ✓
- Tap again to remove attendance
- Leaderboard updates automatically

---

## 🔧 LOCAL DEVELOPMENT (optional)

```bash
# Copy env file and fill in your Supabase credentials
cp .env.local.example .env.local

# Install dependencies
npm install

# Run locally
npm run dev
# Open http://localhost:3000
```

---

## 📁 PROJECT STRUCTURE

```
pgh-ruff-ryders/
├── app/
│   ├── layout.js          # Root layout + metadata
│   ├── page.js            # Main app (Leaderboard, Events, Attendance)
│   └── globals.css        # Global styles
├── lib/
│   └── supabase.js        # Database client
├── supabase/
│   └── schema.sql         # Run this in Supabase to set up tables + members
├── public/
│   └── manifest.json      # PWA manifest (Add to Home Screen support)
├── .env.local.example     # Copy to .env.local with your credentials
├── package.json
└── README.md
```

---

## 🛠️ ADDING NEW MEMBERS

Go to **Supabase → Table Editor → members → Insert row** and add the name.
The app will show them automatically on next load.

Or run in SQL Editor:
```sql
insert into members (name) values ('New Member Name');
```
