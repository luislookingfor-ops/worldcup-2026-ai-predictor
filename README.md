# ⚽ Copa26 AI — World Cup 2026 Prediction Agent

An AI-powered FIFA World Cup 2026 match prediction application using Azure AI Foundry, React, Express.js, and Supabase.

## 🏗️ Architecture

| Layer | Technology | Hosting |
|-------|-----------|---------|
| 🤖 AI Agent | gpt-4.1-mini (Azure AI Foundry) | Azure |
| 🎨 Frontend | React + Vite | Vercel |
| 🔧 Backend | Express.js | Render |
| 🗄️ Database | PostgreSQL | Supabase |
| ⚽ Data | Football-Data.org API | — |

## 📂 Structure

```
├── frontend/    # React app (Vercel)
├── backend/     # Express API (Render)
└── supabase/    # Database migrations
```

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Fill in your credentials
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env  # Fill in your credentials
npm run dev
```

## 🔑 Required Credentials

- **Azure AI Foundry**: Project connection string + Agent ID
- **Supabase**: URL + Anon Key + Service Role Key
- **Football-Data.org**: Free API key from https://www.football-data.org/client/register

## 📜 License

MIT
