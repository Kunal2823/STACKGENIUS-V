# StackGenius v2.0 — AI Tech Stack Recommender

Built by **Kunal Sharma** · Powered by **Grok (xAI)**

---

## 🚀 Quick Start (3 steps)

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your API key
```bash
cp .env.example .env
```
Then open `.env` and add your Grok API key:
```
GROK_API_KEY=xai-...
```
Get your key at: https://console.x.ai/ → API Keys

### 3. Run the app
```bash
npm start
```
Open → **http://localhost:3000**

---

## 🛠 Development (auto-restart on save)
```bash
npm run dev
```

---

## 📁 Project Structure
```
stackgenius/
├── public/
│   ├── index.html        # Main app (Home, Generator, Docs, About)
│   ├── login.html        # Onboarding flow
│   ├── css/
│   │   └── style.css     # All styles
│   └── js/
│       └── app.js        # Frontend logic
├── server/
│   ├── index.js          # Express server
│   └── claude.js         # Grok API integration
├── .env                  # Your secrets (never commit this)
├── .env.example          # Template for .env
└── package.json
```

---

## ⚠️ Important — Always use the server

**Never open index.html directly in browser.** Always run `npm start` first, then go to **http://localhost:3000**

---

## 🔑 API Used
- **Grok** (`grok-3-latest` by xAI) — stack recommendations
- The API key lives in `.env` on the server — never exposed to the browser

---

## 🌐 Deploy to Render (free)
1. Push to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo
4. Set environment variable: `GROK_API_KEY`
5. Build command: `npm install`
6. Start command: `npm start`
