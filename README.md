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

## Deploying on Ubuntu EC2

### Step 1 — Launch an EC2 instance

1. Go to **AWS Console → EC2 → Launch Instance**.
2. Choose **Ubuntu Server 22.04 LTS (or 24.04)** as the AMI.
3. Choose instance type — **t3.medium** (2 vCPU / 4 GB) minimum; t3.large recommended.
4. Under **Security Group**, add these inbound rules:

   | Type | Port | Source |
   |---|---|---|
   | SSH | 22 | Your IP |
   | HTTP | 80 | 0.0.0.0/0 |
   | HTTPS | 443 | 0.0.0.0/0 (if you add SSL later) |

5. Create or select a key pair and download the `.pem` file.
6. Launch the instance and note its **Public IP**.

---

### Step 2 — SSH into the instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<your-ec2-public-ip>
```

---

### Step 3 — Install Docker Engine + Compose plugin

> **Note:** Ubuntu's default apt repo does not include `docker-compose-plugin`.
> You must install from Docker's official repository.

```bash
# Update packages
sudo apt-get update
sudo apt-get upgrade -y

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker's apt repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker and enable it on boot
sudo systemctl enable docker
sudo systemctl start docker

# Allow ubuntu user to run Docker without sudo
sudo usermod -aG docker $USER
newgrp docker
```

Verify the installation:

```bash
docker --version
docker compose version
```

---

### Step 4 — Copy the project to the server

**Option A — Clone from GitHub** (recommended):
```bash
git clone https://github.com/<your-username>/ProcureFlow.git
cd ProcureFlow
```

**Option B — Copy from your local machine** (using scp):
```bash
# Run this on your LOCAL machine, not the server
scp -i your-key.pem -r /path/to/ProcureFlow ubuntu@<ec2-ip>:~/ProcureFlow
```

---

### Step 5 — Configure environment variables

```bash
cd ProcureFlow
cp .env.example .env
nano .env   # or: vi .env
```

At minimum, change these values from their defaults:

```env
POSTGRES_PASSWORD=a_strong_database_password
JWT_SECRET=a_random_string_at_least_32_characters_long
JWT_REFRESH_SECRET=another_random_string_at_least_32_characters
ENCRYPTION_KEY=exactly_32_characters_for_aes256_!
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=your_secure_admin_password
FRONTEND_URL=http://<your-ec2-public-ip>
SENDGRID_API_KEY=           # leave blank to log emails to console
```

> Generate random secrets with: `openssl rand -hex 32`

---

### Step 6 — Build and start the application

```bash
docker compose up -d --build
```

The first build takes **5–10 minutes** (downloads Node.js, compiles TypeScript, builds React).
Each backend service automatically runs `prisma db push` to create its database schemas before starting.

Watch the logs to confirm all services are up:

```bash
docker compose logs -f
```

You should see lines like:
```
procurement-identity  | 🚀 Identity Service running on port 5001
procurement-finance   | 🚀 Finance Service running on port 5002
procurement-procurement | 🚀 Procurement Service running on port 5003
procurement-document  | 🚀 Document Service running on port 5004
```

---

### Step 7 — Open the app

Navigate to `http://<your-ec2-public-ip>` in a browser.

Sign in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you set in `.env`.

---

## Environment variables reference

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | `procureflow` | Postgres username |
| `POSTGRES_PASSWORD` | `procureflow` | **Change in production** |
| `POSTGRES_DB` | `procureflow` | Database name |
| `DATABASE_URL` | `postgresql://procureflow:procureflow@postgres:5432/procureflow` | Shared connection string (all services) |
| `JWT_SECRET` | dev default | **Change in production** — 32+ random chars |
| `JWT_REFRESH_SECRET` | dev default | **Change in production** — 32+ random chars |
| `ENCRYPTION_KEY` | dev default | AES-256 key for sensitive fields — **change in production** |
| `ADMIN_EMAIL` | `admin@procureflow.com` | Seeded admin account email |
| `ADMIN_PASSWORD` | `changeme123` | Seeded admin account password |
| `SENDGRID_API_KEY` | _(blank)_ | Leave blank to print emails to container logs |
| `SENDGRID_FROM` | `noreply@procureflow.com` | Sender address for outbound emails |
| `FRONTEND_URL` | `http://localhost` | Base URL used in email links (set to your EC2 IP or domain) |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

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
