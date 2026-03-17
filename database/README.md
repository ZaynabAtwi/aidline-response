# AidLine Database – Request Routing Architecture

AidLine operates as a **service coordination and triage platform** rather than a geolocation system. The MySQL schema supports structured request routing with **no location tracking**.

## Architecture Overview

```
User Request → AI Classification → Service Routing → Responder Acceptance → Secure Communication → Case Resolution
```

### Operational Pipeline

1. **User Request Entry** – SOS, healthcare, medication, humanitarian, or general inquiry
2. **AI Triage** – Category, priority, responder type
3. **Service Routing** – Healthcare, Medication, or NGO module
4. **Secure Communication** – Encrypted messaging between user and responder
5. **Crisis Intelligence** – Aggregated analytics (no individual location data)

## MySQL Setup

### Using Docker

```bash
docker compose up -d mysql
```

MySQL will start on port 3306. The schema in `database/mysql/001_schema.sql` is applied automatically on first run.

### Manual Setup

1. Create database: `CREATE DATABASE aidline;`
2. Run schema: `mysql -u root -p aidline < database/mysql/001_schema.sql`

### Environment (Server)

Copy `server/.env.example` to `server/.env` and configure:

```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=aidline
MYSQL_PASSWORD=aidline
MYSQL_DATABASE=aidline
PORT=3001
```

## Schema Highlights

- **No location columns** – `shelters`, `clinics`, `pharmacies`, `volunteers`, `sos_alerts` do not store coordinates
- **Unified requests** – `requests` table for all request types with `request_classifications` for AI triage
- **Request routing** – `request_routing` links requests to healthcare, medication, or NGO modules
- **Crisis analytics** – `crisis_analytics` for aggregated, anonymous operational intelligence

## Running the API

```bash
cd server && npm install && npm run dev
```

The API listens on `http://localhost:3001`. Set `VITE_API_URL=http://localhost:3001` in the frontend `.env` to use the MySQL backend.
