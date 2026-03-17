# PettyCash Frontend — AL-Dhow Group

React SPA for the PettyCash Settlement Application.
Built with React 18 + Vite 6 — no CSS framework, all inline styles via a centralized theme.

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 6.3.5 | Build tool & dev server |
| @vitejs/plugin-react | 4.3.4 | JSX support |

No CSS framework — all styling via `src/theme.js`.

---

## Local Development

### 1. Clone and install

```bash
git clone <your-frontend-repo-url>
cd pettycash-frontend
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# In development, leave VITE_API_URL empty — Vite proxies /api to localhost:3001
```

### 3. Make sure the backend is running

```bash
# In your backend folder:
npm run dev   # runs on port 3001
```

### 4. Start the dev server

```bash
npm run dev
# App available at http://localhost:5173
```

---

## Project Structure

```
pettycash-frontend/
├── index.html
├── vite.config.js          # Dev proxy: /api → localhost:3001
├── src/
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Shell: sidebar nav + page routing
│   ├── api.js              # All HTTP calls (fetch-based, auto auth headers)
│   ├── theme.js            # Centralized style tokens
│   ├── context/
│   │   └── AuthContext.jsx # JWT state — login, logout, refreshUser, hasRole
│   ├── hooks/
│   │   └── useFetch.js     # useFetch + useAction helpers
│   ├── components/
│   │   ├── UI.jsx          # Btn, Modal, Alert, FormField, Input, Select, etc.
│   │   └── SearchableSelect.jsx  # Reusable searchable dropdown
│   └── pages/
│       ├── LoginPage.jsx          # Login + forced password change
│       ├── DashboardPage.jsx      # Stat boxes + filterable voucher table
│       ├── VoucherFormPage.jsx    # Create/edit voucher with lines & attachments
│       ├── VoucherViewPage.jsx    # Read-only view + action buttons + PDF preview
│       ├── ManagerApprovalsPage.jsx  # Pending + history with pagination
│       ├── CashierPage.jsx        # Refund queue, funding, fund closing tabs
│       ├── AdminPage.jsx          # Full user CRUD
│       └── MasterPages.jsx        # Divisions, Departments, Projects, ExpenseTypes, Employees
```

---

## Page Access by Role

| Page | Roles |
|------|-------|
| Dashboard | All (except cashier-only) |
| New Voucher | petty_cash_holder, admin |
| Manager Approvals | Managers (users with managed users), admin |
| CA Review | chief_accountant, admin |
| Cashier | cashier, admin |
| User Admin | admin |
| Employees | employee_definition, admin |
| Divisions / Departments / Projects / Expense Types | admin |

---

## Deploying to Render (Static Site)

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial frontend"
git branch -M main
git remote add origin https://github.com/<you>/pettycash-frontend.git
git push -u origin main
```

### Step 2 — Create a Static Site on Render

1. Go to [render.com](https://render.com) → **New → Static Site**
2. Connect your GitHub repo
3. Configure:

| Field | Value |
|-------|-------|
| **Name** | `pettycash-frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your backend Render URL, e.g. `https://pettycash-backend.onrender.com` |

5. Click **Deploy**. Your app will be at:
   `https://pettycash-frontend.onrender.com`

6. **Go back to your backend** on Render and update the `FRONTEND_URL` env variable to match this URL.

### Step 3 — Handle SPA routing

Render static sites need a redirect rule so all routes serve `index.html`.

Create a file at the root of the repo:

**`_redirects`** (place in the `public/` folder or root):
```
/*    /index.html   200
```

This file is already included in the repo at `public/_redirects`.

---

## Environment Variables

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_API_URL` | *(empty — Vite proxy handles /api)* | `https://your-backend.onrender.com` |

---

## Build for Production

```bash
npm run build
# Output in dist/
```

To preview the production build locally:

```bash
npm run preview
# Serves dist/ at http://localhost:4173
```
