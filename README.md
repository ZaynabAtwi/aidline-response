# AidLine

AidLine is a crisis coordination platform that routes requests through structured triage and service workflows.

The system is designed to operate **without GPS/location tracking**.  
Instead of geographic matching, requests move through this pipeline:

**User Request -> AI Classification -> Service Routing -> Responder Acceptance -> Secure Communication -> Case Resolution -> Crisis Intelligence**

## Key capabilities

- SOS emergency request intake
- Healthcare and medication request handling
- NGO/humanitarian case coordination
- Secure user-responder communication workflows
- Aggregated operational analytics for institutions

## Tech stack

- React + TypeScript + Vite (frontend)
- Supabase integration (existing app integration layer)
- MySQL schema and routing procedures (new database model)

## Project structure

- `src/` - frontend application
- `src/lib/aidlineRouting.ts` - triage/routing domain logic
- `src/test/aidlineRouting.test.ts` - routing model tests
- `database/mysql/` - MySQL schema and stored procedures
- `docs/aidline-operational-model.md` - architecture and interaction model
- `docker-compose.mysql.yml` - local MySQL runtime

## Getting started

### 1) Install dependencies

```bash
npm install
```

### 2) Run frontend locally

```bash
npm run dev
```

### 3) Run tests

```bash
npm test
```

### 4) Build production bundle

```bash
npm run build
```

## MySQL setup

You can initialize the AidLine MySQL schema with Docker:

```bash
docker compose -f docker-compose.mysql.yml up -d
```

Schema/procedure files:

- `database/mysql/001_aidline_schema.sql`
- `database/mysql/002_aidline_routing_procedures.sql`

Manual apply option:

```bash
mysql -u root -p < database/mysql/001_aidline_schema.sql
mysql -u root -p < database/mysql/002_aidline_routing_procedures.sql
```

## Privacy model

- No GPS coordinates are required for request routing.
- No proximity-based responder matching is used.
- Crisis intelligence is generated from non-identifying operational metadata.

## Notes

For deeper architecture details, see:

- `docs/aidline-operational-model.md`
