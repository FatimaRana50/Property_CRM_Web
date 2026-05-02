# 🏠 Property Dealer CRM

A full-stack CRM system built for property dealers in Pakistan. Built with Next.js 14, MongoDB, NextAuth, Socket.io, and Tailwind CSS.

**🌐 Live Demo:** [https://property-crm-web.vercel.app/](https://property-crm-web.vercel.app/)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Recharts |
| Backend | Next.js API Routes, Node.js custom server |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js (JWT strategy) |
| Real-time | Socket.io |
| Email | Nodemailer (Gmail SMTP) |

---

## ✨ Features

- **Role-based access control** — Admin and Agent roles with separate dashboards
- **Lead management** — Create, view, update, delete leads with full CRUD
- **Auto lead scoring** — Priority assigned automatically based on budget (High >20M, Medium 10-20M, Low <10M)
- **Lead assignment** — Admins assign leads to agents with email notification
- **Real-time updates** — Socket.io pushes live updates when leads are created or updated
- **Activity timeline** — Full audit trail of every action on a lead
- **Follow-up system** — Set follow-up dates, get overdue alerts on dashboard
- **WhatsApp integration** — Click-to-chat links for instant client contact
- **Analytics dashboard** — Charts for status distribution, priority breakdown, agent performance
- **Email notifications** — Automated emails on lead creation and assignment
- **Excel export** — Export all leads to `.xlsx` with one click (Admin only)
- **AI follow-up suggestions** — Smart suggestions per lead using rules + optional OpenAI

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth + signup
│   │   ├── leads/         # Lead CRUD + activity + AI suggest
│   │   ├── agents/        # Agent listing
│   │   ├── analytics/     # Dashboard stats
│   │   └── export/        # Excel export
│   ├── dashboard/
│   │   ├── admin/         # Admin dashboard
│   │   ├── agent/         # Agent dashboard
│   │   ├── leads/         # Leads list, new lead, lead detail
│   │   ├── analytics/     # Analytics page
│   │   └── agents/        # Agents management
│   ├── login/             # Login page
│   └── signup/            # Signup page
├── components/
│   ├── auth/              # SessionProvider
│   └── dashboard/         # Sidebar, AdminDashboard, SocketInitializer
├── lib/
│   ├── db.js              # MongoDB connection
│   ├── email.js           # Nodemailer service
│   ├── socket.js          # Socket.io helper
│   └── activityLogger.js  # Audit trail utility
├── middleware/
│   ├── auth.js            # requireAuth, requireAdmin
│   ├── validation.js      # Input validation
│   └── rateLimit.js       # Rate limiting (50 req/min for agents)
├── models/
│   ├── User.js            # User schema
│   ├── Lead.js            # Lead schema with auto-scoring
│   └── Activity.js        # Activity/audit schema
└── middleware.js           # Next.js route protection
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/FatimaRana50/Property_CRM_Web.git
cd Property_CRM_Web
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Create environment file

Create a `.env.local` file in the root:

```env
MONGODB_URI=mongodb://localhost:27017/property-crm
NEXTAUTH_SECRET=supersecretkey123
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=jwtsecretkey123

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=CRM System <your-email@gmail.com>

# Optional - for AI suggestions
OPENAI_API_KEY=
```

> For Gmail, generate an **App Password** at myaccount.google.com/apppasswords (requires 2FA enabled)

### 4. Start MongoDB

```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Testing the Application

### Step 1 — Create Admin Account
- Go to `http://localhost:3000/signup`
- Enter name, email, password
- Select role: **Admin**
- Click Create Account

### Step 2 — Login as Admin
- Go to `http://localhost:3000/login`
- Login with admin credentials
- You will land on the **Admin Dashboard**

### Step 3 — Create a Lead
- Click **Add Lead** in the sidebar
- Fill in client details
- Set budget to `25000000` (25M PKR) → auto-detects as **High Priority**
- Submit the form

### Step 4 — Test Lead Management
- Go to **All Leads** → lead appears in list
- Click the lead → view detail page
- Update status, add notes, set a follow-up date → click Save
- Go to **Activity** tab → see the audit trail

### Step 5 — Test Agent Role
- Open incognito window → go to `/signup`
- Create an **Agent** account
- Back as Admin: open the lead → assign it to the agent
- Login as agent → they only see their assigned leads

### Step 6 — Test WhatsApp
- In leads list, click the 💬 icon next to any lead
- Opens `wa.me/{phone}` — direct WhatsApp chat link

### Step 7 — Test Email
- When a lead is created → admin receives email notification
- When a lead is assigned → agent receives assignment email
- Check your inbox (or Mailtrap if using test mode)

### Step 8 — Test Real-time Updates
- Open the app in two browser windows (admin in one, agent in another)
- Create a lead in one window → the other window updates automatically

### Step 9 — Test Excel Export (Admin only)
- Go to Admin Dashboard
- Click **Export Excel** button
- A `.xlsx` file downloads with all leads

### Step 10 — Test AI Suggestions
- Open any lead detail page
- Click the **AI Suggestions** tab
- Click **Generate Suggestions**
- Get 3 actionable follow-up recommendations

---

## 👥 Roles & Permissions

| Feature | Admin | Agent |
|---------|-------|-------|
| View all leads | ✅ | ❌ (own only) |
| Create leads | ✅ | ✅ |
| Delete leads | ✅ | ❌ |
| Assign leads | ✅ | ❌ |
| View analytics | ✅ | ❌ |
| Export to Excel | ✅ | ❌ |
| Update own leads | ✅ | ✅ |
| Rate limit | None | 50 req/min |

---

## 🌿 Git Branching Strategy

```
main
├── feature/auth
├── feature/rbac
├── feature/lead-management
├── feature/lead-scoring
├── feature/middleware
├── feature/realtime-updates
├── feature/whatsapp-email
├── feature/activity-timeline
├── feature/followup-system
├── feature/analytics-dashboard
└── feature/bonus
```

Each feature was developed in isolation and merged into `main` via pull request.

---

## 📊 API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/signin` | Public | Login |
| GET | `/api/leads` | Auth | List leads (filtered by role) |
| POST | `/api/leads` | Auth | Create new lead |
| GET | `/api/leads/:id` | Auth | Get lead details |
| PUT | `/api/leads/:id` | Auth | Update lead |
| DELETE | `/api/leads/:id` | Admin | Delete lead |
| GET | `/api/leads/:id/activity` | Auth | Get activity timeline |
| POST | `/api/leads/:id/suggest` | Auth | Get AI suggestions |
| GET | `/api/agents` | Admin | List all agents |
| GET | `/api/analytics` | Admin | Dashboard statistics |
| GET | `/api/export` | Admin | Export leads to Excel |

---

## 🔒 Security Features

- Passwords hashed with **bcrypt** (12 rounds)
- JWT tokens via **NextAuth**
- Route protection via **Next.js middleware**
- **Rate limiting** — agents limited to 50 requests/minute
- Input **validation** on all API routes
- Role-based data filtering (agents see only their leads)