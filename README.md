# ProcureFlow

A full-stack procurement and invoicing platform built with TypeScript microservices and React.
Runs as a single `docker compose up` on any Linux server — no cloud account or Kubernetes cluster required.

## What's inside

| Area | Features |
|---|---|
| **Procurement** | Vendor registry, Purchase Requests, Purchase Orders, Contracts with expiry alerts |
| **Invoicing** | Two PDF templates (Beulix GST tax invoice + Individual trainer invoice), GST/TDS auto-computation, Issuer Profile settings |
| **Purchases** | Vendor-invoice ledger with flat 10% TDS auto-calculation |
| **Finance dashboards** | Invoice Dashboard (Total invoices, Income generated, TDS deducted, GST collected) and Purchases Dashboard — separate, never netted |
| **Excel export** | Invoices + Purchases + Summary workbook with year/month filter |
| **Documents** | Upload/download contract and purchase-order documents |
| **Notifications** | In-app alerts + SendGrid emails for invoice due/overdue, contract expiry (30d/7d/1d), new account creation, password reset |
| **Audit log** | Every create/update/approve/delete action is logged |
| **Users & Roles** | Admin-only bootstrap; admin creates restricted accounts (procurement_manager, finance, vendor, auditor, employee) from the Users screen |
| **Theme** | Apple-glass light/dark theme following OS `prefers-color-scheme`, manual toggle, frosted-glass panels over gradient-orb backdrops |
| **Mobile** | Collapsible sidebar, responsive layouts throughout |

## Architecture

```
frontend (nginx + React SPA)
    |
    ├── /api/auth  /api/users  /api/hr       → identity-service  :5001
    ├── /api/invoices  /api/customers  ...    → finance-service   :5002
    ├── /api/vendors  /api/contracts  ...     → procurement-service :5003
    └── /api/documents  /api/notifications    → document-service  :5004
                                                       |
                                               postgres:5432  (one DB, one schema per service)
                                               uploads volume  (PDFs + documents on disk)
```

Each service owns its own PostgreSQL schema (`identity`, `finance`, `procurement`, `document`) managed by Prisma.
There is no API gateway, no Kubernetes, and no cloud dependencies.

## Quick start

### Prerequisites
- Docker + Docker Compose (Docker Desktop or `docker-compose` on Linux)

### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env — at minimum set:
#   POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY
#   ADMIN_EMAIL, ADMIN_PASSWORD
#   SENDGRID_API_KEY (leave blank to log emails to console)
```

### 2. Build and run

```bash
docker compose up -d --build
```

The first run builds all images (~5 minutes). Each service automatically runs
`prisma db push` to create its database schema before starting.

### 3. Open the app

Navigate to `http://localhost` (or your server's IP).
Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `procureflow` | Postgres superuser name |
| `POSTGRES_PASSWORD` | `procureflow` | **Change in production** |
| `POSTGRES_DB` | `procureflow` | Database name |
| `DATABASE_URL` | `postgresql://procureflow:procureflow@postgres:5432/procureflow` | Same URL for all services |
| `JWT_SECRET` | dev default | **Change in production** — 32+ random chars |
| `JWT_REFRESH_SECRET` | dev default | **Change in production** — 32+ random chars |
| `ENCRYPTION_KEY` | dev default | AES-256 key for PAN/Aadhar fields — **change in production** |
| `ADMIN_EMAIL` | `admin@procureflow.com` | Seeded admin account email |
| `ADMIN_PASSWORD` | `changeme123` | Seeded admin account password |
| `SENDGRID_API_KEY` | _(blank)_ | Leave blank to log emails to console instead of sending |
| `SENDGRID_FROM` | `noreply@procureflow.com` | Sender address for outbound emails |
| `FRONTEND_URL` | `http://localhost` | Used to build reset-password and welcome links in emails |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin for dev |

## Deployment on EC2

```bash
# Install Docker on Amazon Linux 2023 / Ubuntu
sudo apt-get install -y docker.io docker-compose-plugin   # Ubuntu
# or
sudo yum install -y docker && sudo systemctl start docker  # AL2

# Allow current user to run docker
sudo usermod -aG docker $USER && newgrp docker

# Copy project and .env to the server, then:
docker compose up -d --build
```

Open port 80 (HTTP) in the EC2 security group inbound rules.
For HTTPS, put nginx or Caddy in front as a reverse proxy with your SSL certificate.

## Stopping / updating

```bash
docker compose down          # stop and remove containers (data volumes are preserved)
docker compose up -d --build # rebuild after a code change and restart
```

## Data volumes

| Volume | Contents |
|---|---|
| `postgres_data` | All database data |
| `uploads_data` | Generated PDFs, uploaded contract/document files |

Both volumes are preserved across `docker compose down` restarts.
To wipe everything and start fresh: `docker compose down -v`.
