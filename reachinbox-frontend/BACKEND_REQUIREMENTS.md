# ReachInbox — Backend Architecture & Requirements Specification

This document provides the complete, production-grade backend engineering specification for **ReachInbox**, an email scheduling and deliverability platform. The backend is designed to pair seamlessly with the existing Next.js frontend located in this repository.

---

## 1. System Architecture & Technology Recommendation

```mermaid
flowchart TD
    Client["ReachInbox Frontend (Next.js / TypeScript)"]
    API["API Gateway / Backend Server (Node.js/NestJS or Python/FastAPI)"]
    DB[(PostgreSQL Database)]
    Redis[(Redis Cache & Message Broker)]
    WorkerPool["Distributed Worker Engine (BullMQ / Celery)"]
    ESP["Email Service Provider (AWS SES / Resend / SendGrid / SMTP)"]
    SlackAPI["Slack Web API & Webhooks"]
    GoogleOAuth["Google Identity Services"]

    Client -->|REST API + JWT Bearer / HTTP Cookie| API
    API -->|Auth / Exchange Code| GoogleOAuth
    API -->|CRUD Operations| DB
    API -->|Enqueue Jobs & Token Buckets| Redis
    Redis -->|Consume Queued Dispatches| WorkerPool
    WorkerPool -->|Send Individual Emails with Throttling| ESP
    WorkerPool -->|Rate Limit Warnings| SlackAPI
    ESP -->|Bounce / Delivery Webhooks| API
```

### Recommended Tech Stack:
- **Language/Framework**: Node.js with **NestJS** or **Fastify/Express** (TypeScript) *OR* Python with **FastAPI**.
- **Database**: **PostgreSQL 15+** with **Prisma ORM** or **Drizzle ORM**.
- **In-Memory Cache & Message Broker**: **Redis 7+** (for BullMQ queues, rate limiting, and sliding-window throttle counters).
- **Worker Engine**: **BullMQ** (Node.js) or **Celery / ARQ** (Python).
- **Email Dispatch Provider**: **AWS SES** (recommended for cold outreach scale) or **Resend / SendGrid**, with support for custom SMTP relay pools.
- **Third-Party Integrations**: Google OAuth 2.0 (Identity), Slack Web API (OAuth & Incoming Webhooks).

---

## 2. Authentication & Session Management

Authentication is strictly performed via **Google OAuth 2.0**. No email/password registration is supported.

### Endpoints & Flow

#### 1. `GET /api/v1/auth/google`
- Redirects user to Google OAuth consent screen with scopes:
  - `openid`
  - `email`
  - `profile`
- Generates and stores a cryptographic `state` in Redis to prevent CSRF.

#### 2. `GET /api/v1/auth/google/callback`
- Query parameters: `?code={code}&state={state}`
- Exchanges code for Google access token and user info (`googleId`, `email`, `name`, `avatarUrl`).
- Creates user record in PostgreSQL if new, or updates profile if existing.
- Issues a **JWT session token** stored in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie (or returned as a Bearer token in response headers).
- Redirects client to `/dashboard`.

#### 3. `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>` or HTTP cookie.
- **Response**:
```json
{
  "id": "usr_991823a",
  "name": "Alex Morgan",
  "email": "alex.morgan@reachinbox.ai",
  "avatarUrl": "https://lh3.googleusercontent.com/a/sample-avatar",
  "googleId": "10982348912739182"
}
```

#### 4. `POST /api/v1/auth/logout`
- Clears session cookie and blacklists JWT in Redis.

---

## 3. Database Schema (PostgreSQL DDL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Campaigns Table
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'failed');

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    status campaign_status DEFAULT 'scheduled',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    delay_seconds INT NOT NULL DEFAULT 2 CHECK (delay_seconds >= 1 AND delay_seconds <= 300),
    hourly_limit INT NOT NULL DEFAULT 200 CHECK (hourly_limit >= 1 AND hourly_limit <= 1000),
    total_leads INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Scheduled Emails Table (Pending Dispatches)
CREATE TYPE email_status AS ENUM ('scheduled', 'processing', 'paused', 'failed');

CREATE TABLE scheduled_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status email_status DEFAULT 'scheduled',
    retry_count INT DEFAULT 0,
    job_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX idx_scheduled_emails_scheduled_at ON scheduled_emails(scheduled_at);
CREATE INDEX idx_scheduled_emails_user_id ON scheduled_emails(user_id);

-- 4. Sent Emails History Table
CREATE TYPE delivery_status AS ENUM ('sent', 'failed');

CREATE TABLE sent_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status delivery_status NOT NULL,
    error_message TEXT,
    provider_message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sent_emails_user_id ON sent_emails(user_id);
CREATE INDEX idx_sent_emails_sent_at ON sent_emails(sent_at);
CREATE INDEX idx_sent_emails_status ON sent_emails(status);

-- 5. Slack Integrations Table
CREATE TABLE slack_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_name VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    channel_id VARCHAR(100) NOT NULL,
    webhook_url TEXT,
    bot_access_token TEXT NOT NULL,
    connected BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. User Preferences Table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    slack_notifications BOOLEAN DEFAULT TRUE,
    scheduling_alerts BOOLEAN DEFAULT FALSE,
    show_failed_emails BOOLEAN DEFAULT TRUE,
    default_delay INT DEFAULT 2,
    default_hourly_limit INT DEFAULT 200,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. API Endpoints Specification

### A. Dashboard Metrics
- **`GET /api/v1/dashboard/metrics`**
- **Response**: `200 OK`
```json
{
  "scheduledEmailsCount": 340,
  "sentEmailsCount": 1248,
  "failedEmailsCount": 3,
  "queuedEmailsCount": 28
}
```

---

### B. Lead File Upload & Validation
- **`POST /api/v1/campaigns/upload-leads`**
- **Content-Type**: `multipart/form-data`
- **Payload**: Form field `file` (`.csv` or `.txt`)
- **Processing Logic**:
  1. Validate file format (`.csv`, `.txt`) and max size (e.g. 10MB).
  2. Stream parsing (e.g., using `csv-parse` or regex line scanner).
  3. Extract email addresses using RFC 5322 compliant regex:
     `/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g`
  4. Deduplicate emails within the uploaded file.
  5. Return detected count and metadata (or cache temporary lead list in Redis under key `leads:{upload_token}` with 1-hour TTL).
- **Response**: `200 OK`
```json
{
  "detectedCount": 127,
  "fileName": "q4-prospects-enterprise.csv",
  "fileSize": 24576,
  "uploadToken": "upl_8a91f82c"
}
```

---

### C. Campaign Creation & Scheduling
- **`POST /api/v1/campaigns/schedule`**
- **Request Body**:
```json
{
  "subject": "Strategic partnership Q4",
  "body": "Hi there,\n\nWe wanted to reach out regarding your outreach cadence...",
  "detectedLeadsCount": 127,
  "uploadToken": "upl_8a91f82c",
  "startTime": "2026-09-23T09:00:00Z",
  "delaySeconds": 2,
  "hourlyLimit": 200
}
```
- **Execution**:
  1. Verify user's hourly quota against system tier limits.
  2. Create `campaigns` entry with status `'scheduled'`.
  3. Bulk insert individual `scheduled_emails` rows with staggered `scheduled_at` timestamps calculated by:
     `scheduled_at = startTime + (index * delaySeconds)`
     while respecting the maximum rolling cap of `hourlyLimit` per hour.
  4. Enqueue tasks in Redis/BullMQ.
- **Response**: `201 Created`
```json
{
  "campaignId": "cmp_901824a",
  "totalScheduled": 127,
  "firstDispatch": "2026-09-23T09:00:00Z",
  "estimatedCompletion": "2026-09-23T09:04:14Z"
}
```

---

### D. Scheduled Deliveries Management
- **`GET /api/v1/emails/scheduled`**
  - **Query Parameters**:
    - `query` (optional string): Filter by recipient email or subject
    - `status` (optional string): `'all' | 'scheduled' | 'processing' | 'paused' | 'failed'`
  - **Response**: `200 OK` (Array of `ScheduledEmail`)
- **`POST /api/v1/emails/scheduled/:id/pause`**
  - Pauses specific dispatch. If campaign-wide, marks campaign and associated pending dispatches as `'paused'`. Removes BullMQ delayed job.
- **`POST /api/v1/emails/scheduled/:id/resume`**
  - Reschedules paused dispatch in queue with updated `scheduled_at`.
- **`DELETE /api/v1/emails/scheduled/:id`**
  - Deletes row from `scheduled_emails` and cancels BullMQ job.

---

### E. Sent History & Retries
- **`GET /api/v1/emails/sent`**
  - **Query Parameters**:
    - `query` (optional): Filter recipient or subject
    - `status` (optional): `'all' | 'sent' | 'failed'`
  - **Response**: `200 OK` (Array of `SentEmail`)
- **`POST /api/v1/emails/sent/:id/retry`**
  - Validates that target record has status `'failed'`.
  - Requeues dispatch as immediate priority job.
  - Returns `200 OK` with updated record.

---

### F. Slack Integration & Webhooks
- **`GET /api/v1/slack/status`**
  - **Response**:
```json
{
  "connected": true,
  "workspaceName": "Acme Corp",
  "channelName": "#marketing-outreach",
  "connectedAt": "2026-09-18T14:30:00Z"
}
```
- **`POST /api/v1/slack/connect`**
  - Handles Slack OAuth 2.0 exchange (`chat:write`, `incoming-webhook`).
- **`POST /api/v1/slack/disconnect`**
  - Revokes Slack token and removes entry from `slack_connections`.

---

### G. Application Preferences
- **`GET /api/v1/preferences`**
- **`PUT /api/v1/preferences`**
  - **Request Body**:
```json
{
  "emailNotifications": true,
  "slackNotifications": true,
  "schedulingAlerts": false,
  "showFailedEmails": true
}
```

---

## 5. Job Queue & Deliverability Throttling Engine

The core value of ReachInbox is ensuring sending accounts do not get flagged or blacklisted by mailbox providers (Google Workspace, Microsoft 365).

### Distributed Queue Architecture (BullMQ + Redis)
1. **Queue Definition**: `email-dispatch-queue`
2. **Worker Concurrency**: 5–10 concurrent jobs per worker instance.
3. **Pacing Enforcement (Delay Between Emails)**:
   - When a job is processed, calculate delay to next dispatch.
   - Enforce an inter-email sleep or schedule delay via BullMQ's `delay` option (`delaySeconds * 1000 ms`).

### Rolling Hourly Rate Limiting (Token Bucket / Sliding Window)
- Key in Redis: `ratelimit:user:{userId}:hourly`
- Use Redis sorted sets (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`):
```lua
-- Add current timestamp
redis.call('ZADD', KEYS[1], ARGV[1], ARGV[1])
-- Expire entries older than 3600 seconds
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1] - 3600)
-- Get current count in last hour
local current_count = redis.call('ZCARD', KEYS[1])
return current_count
```
- **Rate Limit Trigger**:
  - If `current_count >= hourlyLimit`, defer dispatch to the next rolling hour window.
  - Automatically dispatch alert to Slack if `slackNotifications` preference is enabled.

### Slack Rate Limit Alert Payload Format
When an hourly throttle threshold is reached:
```json
{
  "channel": "#marketing-outreach",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": ":warning: *ReachInbox Alert: Hourly Limit Reached*\nYour campaign reached the configured limit of *200 emails/hour*. Dispatches have been throttled to protect domain reputation."
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Campaign: *Q4 Strategic Partnership* | Sending will automatically resume in 14 minutes."
        }
      ]
    }
  ]
}
```

---

## 6. Email Delivery & Error Code Taxonomy

When an email fails to dispatch, standard error categories must be stored in `sent_emails.error_message`:
- `SMTP_TIMEOUT`: Mailbox server did not respond within connection window.
- `RATE_LIMIT_EXCEEDED`: ESP returned HTTP 429 or transient sending limit.
- `MAILBOX_UNAVAILABLE`: Recipient email does not exist (hard bounce / 550).
- `SPAM_REJECTED`: Message flagged by spam filter / domain reputation block.
- `AUTH_FAILURE`: Sender SMTP credentials or DKIM signature invalid.

---

## 7. Environment Configuration Variables (`.env`)

```env
# Application Server
PORT=4000
NODE_ENV=production
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://reachinbox_user:securepassword@localhost:5432/reachinbox_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT Security
JWT_SECRET=super-secret-cryptographic-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback

# Slack App Credentials
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=http://localhost:4000/api/v1/slack/callback

# Mail Service Provider (AWS SES / Resend)
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
DEFAULT_FROM_EMAIL=outreach@reachinbox.ai
```

---

## 8. Backend Implementation Checklist

- [ ] Initialize repository with TypeScript + NestJS / Express or FastAPI.
- [ ] Setup PostgreSQL database & run migration scripts with above schema.
- [ ] Implement Google OAuth 2.0 and JWT authentication middleware.
- [ ] Configure BullMQ with Redis for asynchronous delivery queues.
- [ ] Implement CSV & TXT streaming lead parser with deduplication.
- [ ] Build rolling 1-hour window sliding throttle algorithm in Redis.
- [ ] Integrate AWS SES / Resend with bounce handling webhooks.
- [ ] Build Slack Bot integration for hourly throttle alerts.
- [ ] Enable CORS for `http://localhost:3000` with `credentials: true`.
