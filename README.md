# ReachlnBox

ReachInbox is a high-deliverability email outreach and campaign scheduling platform built with Next.js, Express.js, PostgreSQL, Redis, BullMQ, and Nodemailer.

---

## Architecture Overview

```
Campaign / Compose (/dashboard/compose or REST API)
         ↓
PostgreSQL (campaigns & emails storage)
         ↓
BullMQ Dispatch Queue ('email-dispatch-queue' with pacing & delay)
         ↓
Redis (127.0.0.1:6379)
         ↓
BullMQ Worker (concurrency: 5)
         ↓
Sliding-Window Hourly Rate-Limit Check (Redis sorted sets + Lua script)
         ↓
Idempotent Claim (UPDATE emails SET status = 'processing' WHERE status = 'scheduled')
         ↓
Nodemailer Transporter (SMTP / Ethereal)
         ↓
PostgreSQL Status Update (status = 'sent', provider_message_id, sent_at)
```

---

## Features

- **Asynchronous Email Pipeline**: BullMQ and Redis-backed delayed execution with hourly rate limiting per sender.
- **Dynamic Audience & Lead Parsing**: Automatic CSV/TXT upload, RFC-compliant email extraction, and deduplication.
- **Modern Responsive Dashboard**: Collapsible sidebar, mobile drawer navigation, live scheduled/sent metrics, and responsive email composer.
- **Authentication & Security**: Google OAuth2 authentication flow, JWT session handling, and credential safety.
- **Slack Integration**: Webhook alerts for campaign kickoff, completions, and error notifications.

---

## Tech Stack

### Frontend (`reachinbox-frontend`)
- **Framework**: Next.js 16 (App Router & Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Backend (`reachinbox-backend`)
- **Server**: Node.js & Express.js
- **Database**: PostgreSQL (pg pool)
- **Job Queue**: BullMQ
- **Cache / Limiter**: Redis (ioredis)
- **Mail Delivery**: Nodemailer (Ethereal SMTP)
- **Language**: TypeScript

---

## Project Structure

```
.
├── reachinbox-backend/         # Express.js REST API & BullMQ delivery worker
│   ├── src/
│   │   ├── config/             # DB, Redis, Google OAuth, and environment configs
│   │   ├── controllers/        # Email, campaign, auth, and Slack controllers
│   │   ├── modules/
│   │   │   ├── limiter/        # Sliding-window rate limiter
│   │   │   └── queue/          # BullMQ queue and worker implementations
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Store, auth, and email delivery services
│   │   └── index.ts            # Server entrypoint and graceful shutdown
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── reachinbox-frontend/        # Next.js web application
│   ├── src/
│   │   ├── app/                # Next.js App Router (Dashboard, Compose, Settings)
│   │   ├── components/         # Layout, email composer, tables, and UI widgets
│   │   ├── services/           # Frontend API clients
│   │   └── types/              # TypeScript data types
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (running on port 5432)
- Redis (running on port 6379)

### 2. Backend Setup
```bash
cd reachinbox-backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL, Redis, and SMTP credentials
npm run build
npm start
```

### 3. Frontend Setup
```bash
cd reachinbox-frontend
npm install
cp .env.example .env.local
npm run dev
```

The frontend will be accessible at `http://localhost:3000` and the backend API at `http://localhost:5000/api/v1`.
>>>>>>> 3056d71 (Initial ReachInbox implementation)
