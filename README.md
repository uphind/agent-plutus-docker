# Tokenear

Enterprise AI usage analytics platform. Plug-and-play system that receives user directories from organizations and cross-references them with usage data from Anthropic, OpenAI, Cursor, Vertex AI, n8n, and Lovable.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### Run with Docker

```bash
# Start PostgreSQL + app
docker compose up -d

# The app will be available at http://localhost:3000
```

### Local Development

```bash
# Install dependencies
npm install

# Start PostgreSQL only
docker compose up db -d

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed demo organization
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

The seed script outputs an API key -- save it. You'll enter it in the dashboard Settings page.

## Architecture

```
POST /api/v1/directory   <-- Organizations push their user directory here
     |
     v
 ┌─────────────────────────────────────────┐
 │             Tokenear Platform           │
 │                                         │
 │  Dashboard UI (Next.js)                 │
 │  API Routes (/api/v1/*)                 │
 │  Sync Engine (node-cron, every 6h)      │
 │                                         │
 │  PostgreSQL                             │
 └────────┬──────────┬──────────┬──────────┘
          │          │          │
          v          v          v
     Anthropic    OpenAI    Cursor    Vertex AI    n8n    Lovable
```

## API Reference

All API routes require `X-API-Key` header with the organization's Tokenear API key.

### User Directory

**POST** `/api/v1/directory` -- Push user directory

```json
{
  "users": [
    {
      "email": "alice@acme.com",
      "name": "Alice Smith",
      "department": "Engineering",
      "team": "Platform",
      "job_title": "Senior Engineer",
      "employee_id": "EMP-001",
      "status": "active"
    }
  ]
}
```

### Provider Credentials

- **GET** `/api/v1/providers` -- List configured providers
- **POST** `/api/v1/providers` -- Add/update provider API key
- **DELETE** `/api/v1/providers?provider=anthropic` -- Remove provider

### Analytics

- **GET** `/api/v1/analytics/overview?days=30` -- Aggregated dashboard data
- **GET** `/api/v1/analytics/by-user?days=30` -- Per-user breakdown
- **GET** `/api/v1/analytics/by-provider?days=30` -- Per-provider breakdown
- **GET** `/api/v1/analytics/by-model?days=30` -- Per-model breakdown

### Sync

- **POST** `/api/v1/sync` -- Trigger sync (all providers)
- **POST** `/api/v1/sync` + `{"provider": "anthropic"}` -- Sync specific provider
- **GET** `/api/v1/sync` -- View sync logs

### Users

- **GET** `/api/v1/users?department=Engineering&team=Platform&search=alice` -- List/filter users

## Provider Integration Status

| Provider | API Support | Data Available |
|----------|------------|----------------|
| Anthropic | Admin API (usage + cost) | Tokens, cost, by model/workspace/API key |
| OpenAI | Admin API (usage + cost) | Tokens, cost, by model/user/project |
| Cursor | Enterprise Analytics API | Agent edits, tabs, DAU, model usage |
| Vertex AI | Stub (GCP Monitoring + BigQuery) | Placeholder -- requires GCP setup |
| n8n | REST API (executions) | Workflow execution metrics |
| Lovable | Stub (no API available) | Placeholder -- manual entry |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://tokenear:tokenear_secret@localhost:5432/tokenear` |
| `ENCRYPTION_KEY` | AES-256 encryption key for provider credentials | Must be set |

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: Tailwind CSS v4, Recharts
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: API key based (bcrypt hashed)
- **Encryption**: AES-256-GCM for provider credentials
- **Scheduling**: node-cron (6-hour sync cycle)
- **Deployment**: Docker + docker-compose
