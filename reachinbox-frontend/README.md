# ReachInbox — Cold Email Scheduling Platform Frontend

> Production-quality B2B SaaS frontend application for automated, high-deliverability email scheduling, rate-limit throttling, and campaign dispatch monitoring.

Built strictly with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## 1. Project Overview

**ReachInbox** is an email scheduling platform built for modern sales, growth, and marketing teams. It allows users to authenticate seamlessly via **Google OAuth**, compose high-cadence email campaigns, upload and validate lead files (CSV/TXT), configure warmup delay intervals and hourly dispatch limits, integrate Slack for instant rate-limit warnings, and audit scheduled and sent email statuses.

The application follows a **Light Theme B2B SaaS Design System** that is clean, minimal, responsive across mobile, tablet, laptop, and desktop, and completely decoupled from backend persistence via a typed service abstraction layer (`src/services/api/*`).

---

## 2. Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, zero `any` types)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linting**: ESLint (Next.js core web vitals and strict hook purity)

---

## 3. Installation & Setup

### Prerequisites
- Node.js: `v18+` (Tested on `v24.12.0`)
- npm: `v9+` (Tested on `11.6.2`)

### 1. Clone or Navigate to the Workspace
```bash
cd reachinbox-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

---

## 4. Environment Variables

All external service endpoints are driven by environment variables without hardcoded URLs:

| Variable | Description | Default / Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base endpoint URL for ReachInbox backend API | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | Display name of the platform | `ReachInbox` |
| `NEXT_PUBLIC_APP_ENV` | Application running mode | `development` / `production` |

> [!SECURITY NOTE]
> Never expose OAuth client secrets, SMTP credentials, Redis passwords, or Elasticsearch authentication tokens in `NEXT_PUBLIC_*` variables. The browser only receives `NEXT_PUBLIC_API_URL`.

---

## 5. Development Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts Next.js development server at `http://localhost:3000` |
| `npm run build` | Compiles an optimized production build |
| `npm run start` | Runs the compiled production server |
| `npm run lint` | Runs ESLint analysis across all project files |

---

## 6. Folder Structure

```
reachinbox-frontend/
├── .env.example                       # Template for environment variables
├── .env.local                         # Local environment configuration
├── package.json                       # Dependencies & build scripts
├── tsconfig.json                      # Strict TypeScript compiler options
├── next.config.ts                     # Next.js runtime configuration
├── README.md                          # Platform documentation
│
└── src/
    ├── types/
    │   └── index.ts                   # Strict data contracts (User, ScheduledEmail, etc.)
    │
    ├── lib/
    │   ├── utils.ts                   # Utility functions (cn, formatters, byte sizes)
    │   └── mockData.ts                # Isolated development fixtures for offline inspection
    │
    ├── services/
    │   ├── auth.ts                    # Root auth export alias
    │   ├── emailSearch.ts             # Root emailSearch export alias
    │   └── api/
    │       ├── client.ts              # Base HTTP client with headers & error handling
    │       ├── auth.ts                # Google OAuth login, logout, and session check
    │       ├── emails.ts              # Scheduled & sent email fetching and actions
    │       ├── campaigns.ts           # CSV/TXT lead upload & campaign scheduling
    │       ├── slack.ts               # Slack workspace connect & disconnect
    │       ├── search.ts              # Elasticsearch proxy client
    │       └── preferences.ts         # User toggle configuration persistence
    │
    ├── components/
    │   ├── ui/                        # Reusable accessible design system primitives
    │   │   ├── Button.tsx             # Primary, secondary, outline, danger variants with loading state
    │   │   ├── Input.tsx              # Text, number, datetime-local with icons & errors
    │   │   ├── Textarea.tsx           # Textarea with live character counter
    │   │   ├── Select.tsx             # Custom styled select dropdown
    │   │   ├── Toggle.tsx             # Reusable accessible switch with ON/OFF badges & keyboard nav
    │   │   ├── Modal.tsx              # Accessible dialog with ESC, backdrop click & focus trap
    │   │   ├── Badge.tsx              # Scheduled, processing, paused, sent, failed badges
    │   │   ├── Toast.tsx              # Toast notification system & ToastProvider
    │   │   ├── Skeleton.tsx           # Card & table row shimmer loading loaders
    │   │   ├── EmptyState.tsx         # Clean zero-data placeholder with CTA
    │   │   └── ErrorState.tsx         # User-facing failure alert with retry button
    │   │
    │   ├── layout/                    # Global SaaS layout components
    │   │   ├── navConfig.ts           # Centralized navigation routing config
    │   │   ├── Sidebar.tsx            # Desktop sidebar with brand logo & navigation
    │   │   ├── Header.tsx             # Sticky header with breadcrumb, actions & UserMenu
    │   │   ├── MobileNav.tsx          # Responsive mobile slide-over drawer
    │   │   ├── UserMenu.tsx           # User profile dropdown with logout modal
    │   │   └── PageContainer.tsx      # Consistent gutter, padding & max-width wrapper
    │   │
    │   ├── dashboard/                 # Overview dashboard components
    │   │   ├── StatCard.tsx           # Metrics card with trends and status colors
    │   │   ├── QuickActions.tsx       # Compose, scheduled, sent shortcuts
    │   │   └── RecentEmails.tsx       # Compact preview table of recent deliveries
    │   │
    │   ├── email/                     # Campaign & scheduling components
    │   │   ├── EmailComposer.tsx      # Comprehensive campaign form with validation
    │   │   ├── LeadUploader.tsx       # Drag & drop CSV/TXT uploader with detected count
    │   │   ├── ScheduleConfiguration.tsx # Start time, delay, and hourly limit inputs
    │   │   ├── EmailTable.tsx         # Table for scheduled & sent records with actions
    │   │   ├── EmailSearch.tsx        # Debounced search bar
    │   │   └── EmailStatusBadge.tsx   # Color-coded status badge mapper
    │   │
    │   └── slack/                     # Slack integration components
    │       └── SlackConnectionCard.tsx# Connected / disconnected states with confirmation modal
    │
    └── app/
        ├── layout.tsx                 # Root layout with ToastProvider & metadata
        ├── globals.css                # Tailwind directives & light theme styling
        ├── page.tsx                   # Centered Google OAuth authentication landing page
        │
        └── dashboard/
            ├── layout.tsx             # SaaS layout wrapper (Sidebar, Header, MobileNav)
            ├── page.tsx               # Main dashboard overview
            ├── compose/
            │   └── page.tsx           # Compose new email campaign
            ├── scheduled/
            │   └── page.tsx           # Scheduled emails list with search & actions
            ├── sent/
            │   └── page.tsx           # Sent emails audit history & retry
            ├── slack/
            │   └── page.tsx           # Slack integration management
            └── settings/
                ├── page.tsx           # Profile info & scheduling defaults
                └── preferences/
                    └── page.tsx       # Reusable toggle switches page
```

---

## 7. Available Routes

| Route | Purpose | Features |
|---|---|---|
| `/` | **Landing / Login** | Strictly Google OAuth ("Continue with Google"), zero password/signup forms |
| `/dashboard` | **Overview** | 4 metric cards (Scheduled, Sent, Failed, Queued), Quick Actions, Recent emails |
| `/dashboard/compose` | **Email Composer** | Subject, body with character count, CSV/TXT leads upload, start time, delay, hourly limit |
| `/dashboard/scheduled` | **Scheduled Emails** | Recipient, subject, scheduled time, status badges, search, pause/resume/delete actions |
| `/dashboard/sent` | **Sent Emails** | Recipient, subject, sent time, sent/failed status, search, retry failed deliveries |
| `/dashboard/slack` | **Slack Integration** | Workspace connection card, rate-limit notification alerts, disconnect modal |
| `/dashboard/settings` | **General Settings** | Google profile overview, default dispatch delay, default hourly limits |
| `/dashboard/settings/preferences` | **Preferences** | Dedicated accessible toggle list for email alerts, Slack alerts, and display options |

---

## 8. Component & State Architecture

### UI Philosophy
- **Light Theme**: Built with pure white, subtle slate borders (`border-slate-200`), and a refined indigo brand accent (`bg-indigo-600`).
- **Zero Dark UI / Zero Complex Animations**: Built strictly for enterprise B2B readability and crisp focus.
- **Micro-State Separation**:
  - Global toasts: `ToastProvider` via React Context with auto-dismissal.
  - Modals: Reusable `Modal` component with focus traps, escape key support, and confirm actions.
  - Toggles: Pure, accessible `Toggle` component with ARIA switch roles and keyboard activation (`Enter` / `Space`).

---

## 9. API Integration & Backend Connection

All network calls are isolated inside `src/services/api/`:

```typescript
// Example: src/services/api/campaigns.ts
import { apiClient } from './client';

export const campaignService = {
  async uploadLeadsFile(file: File): Promise<LeadsUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient<ApiResponse<LeadsUploadResult>>('/campaigns/parse-leads', {
      method: 'POST',
      body: formData,
    });
    return res.data;
  },

  async scheduleEmailCampaign(payload: EmailCampaignPayload) {
    const res = await apiClient<ApiResponse<{ id: string }>>('/campaigns/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },
};
```

### Connecting to the Backend
When the ReachInbox backend is started:
1. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
   ```
2. The `apiClient` automatically sends JSON headers, handles 204 responses, unpacks errors into `ApiError`, and proxies requests.
3. If `NEXT_PUBLIC_API_URL` is not reachable during local development, the service layer transparently falls back to typed fixtures in `src/lib/mockData.ts` so developers can inspect and verify every screen without crashing.

---

## 10. Authentication Flow (Google OAuth)

1. The landing page (`/`) presents a single CTA: **Continue with Google**.
2. When clicked, `authService.loginWithGoogle()` initiates the flow:
   - In production: Redirects the browser to `${NEXT_PUBLIC_API_URL}/auth/google`.
   - The backend handles Google consent, tokens, and sets an `HttpOnly` session cookie.
   - The backend then redirects the user to `/dashboard`.
3. The dashboard layout verifies the active session via `authService.getCurrentUser()` calling `/auth/me`.
4. Sign out is handled via `authService.logout()`, which calls `/auth/logout` and clears the session.

---

## 11. Production Build & Deployment

To verify and produce an optimized production bundle:

```bash
# 1. Type-check and build Next.js App Router static/server routes
npm run build

# 2. Run the production server
npm run start
```

All 8 routes are prerendered and optimized for high-speed page loads.
