# Wali — Islamic Financial Guardian

A mobile-first web app that creates productive friction before non-essential purchases, using Gemini AI to evaluate spending through an Islamic financial lens.

---

## Quick Start (GitHub Codespaces)

### Step 1 — Fork & open in Codespaces
1. Go to [github.com](https://github.com) and create a new repository
2. Upload all these files (or push via git)
3. Click the green **Code** button → **Codespaces** tab → **Create codespace on main**
4. Wait ~60 seconds for the environment to boot

### Step 2 — Install dependencies
In the Codespaces terminal at the bottom:
```bash
npm install
```

### Step 3 — Run the dev server
```bash
npm run dev
```
Codespaces will show a popup: **"Open in Browser"** — click it. Your app is running.

### Step 4 — Get your free Gemini API key
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google → **Create API key**
3. Copy the key (starts with `AIza...`)
4. Open your app → tap **Settings** → paste the key → **Save**

That's it. Wali is ready.

---

## Project Structure

```
wali-app/
├── index.html                  # Entry HTML (PWA meta tags)
├── vite.config.js              # Vite bundler config
├── tailwind.config.js          # Tailwind theme (dark, emerald accents)
├── postcss.config.js
├── package.json
└── src/
    ├── main.jsx                # React entry point
    ├── App.jsx                 # Router + layout
    ├── styles/
    │   └── index.css           # Global styles + Tailwind layers
    ├── lib/
    │   ├── gemini.js           # Gemini Flash API + Wali system prompt
    │   └── storage.js          # All localStorage logic
    ├── hooks/
    │   └── useStorage.js       # React hooks for settings + evaluations
    ├── components/
    │   ├── BottomNav.jsx       # Mobile bottom navigation
    │   ├── ResultCard.jsx      # AI result + countdown timer
    │   └── UI.jsx              # Shared primitives
    └── pages/
        ├── EvaluatePage.jsx    # Main form + AI call
        ├── HistoryPage.jsx     # Past evaluations
        ├── DashboardPage.jsx   # Charts + stats
        └── SettingsPage.jsx    # API key + budget config
```

---

## How It Works

### The Evaluation Flow
1. User enters item name, price, category, necessity score, and their reason
2. App checks if item exceeds remaining monthly budget → blocks if so
3. Gemini Flash receives the Wali system prompt + item details
4. Wali classifies the purchase as **Dharuriyyat / Hajiyyat / Tahsiniyyat**
5. Returns a verdict (approve / caution / discourage) + argument + investment alternative
6. If discouraged: a **48-hour countdown timer** locks the buy link
7. After timer: a Google Shopping search link appears

### Data Storage
Everything is stored in **localStorage** — no account, no server, no cloud.
- `wali_settings` — API key, budget limit, currency
- `wali_evaluations` — all past evaluations (max 100)
- `wali_timers` — cooling-off timer expiry timestamps

### The Islamic Brain (Gemini System Prompt)
Wali follows these principles:
- **Anti-Israf:** Flags duplicate purchases and wasteful spending
- **Anti-Riba:** Never suggests savings accounts — always Halal ETFs, Gold, Sukuk, Mudarabah
- **Barakah:** Reminds users wealth is Amanah (trust)
- **The Nafs Test:** Identifies ego/status-driven purchases

---

## Deploy to Production (Free)

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```
Follow the prompts. Your app gets a free `*.vercel.app` URL in ~2 minutes.

### Netlify
```bash
npm run build
# Drag the `dist/` folder to netlify.com/drop
```

---

## Convert to Android App (After Getting Your Laptop)

When you have a laptop with Android Studio installed:

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize
npx cap init "Wali" "com.wali.app" --web-dir=dist

# Build the web app first
npm run build

# Add Android platform
npx cap add android

# Open in Android Studio
npx cap open android
```

Then in Android Studio: **Build → Generate Signed Bundle/APK**

No code changes needed — your React app becomes an Android APK automatically.

---

## Customization

### Change the currency default
In `src/lib/storage.js`, find `DEFAULT_SETTINGS` and change `currency: '৳'` to your preferred symbol.

### Adjust the investment return rate
In `src/lib/gemini.js`, the system prompt uses 8% annual return. Change this line:
```
FV = price × (1.08)^5  (8% annual Halal market average)
```

### Add more categories
In `src/pages/EvaluatePage.jsx`, add to the `CATEGORIES` array.

### Modify Wali's personality
Edit the `SYSTEM_PROMPT` constant in `src/lib/gemini.js`.

---

## Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React 18 + Vite | Free |
| Styling | Tailwind CSS (dark theme) | Free |
| AI | Gemini 1.5 Flash API | Free (1M tokens/month) |
| Storage | localStorage | Free |
| Fonts | DM Serif Display + DM Sans | Free (Google Fonts) |
| Charts | Recharts | Free |
| Hosting | Vercel / Netlify | Free |
| Android | Capacitor.js | Free |

**Total cost: ৳0**

---

## Roadmap (Future Versions)

- [ ] Firebase sync (multi-device)
- [ ] Push notifications for timer expiry
- [ ] OpenStreetMap local store finder
- [ ] Offline-first PWA (installable on phone)
- [ ] Monthly budget auto-reset
- [ ] Export history as PDF
