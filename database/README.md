# AidLine MySQL Database

This directory contains the MySQL schema and analytics procedures for AidLine's request-routing architecture.

## Files

| File | Description |
|---|---|
| `001_initial_schema.sql` | Core tables, indexes, foreign keys, and seed data |
| `002_analytics_procedures.sql` | Views, stored procedures, and scheduled event |

## Schema Overview

```
users
  └─ service_requests  ──── request_classifications
       └─ request_assignments ──── service_providers
            └─ secure_messages           └─ medication_inventory
                                         └─ ngo_access_tokens
                                              └─ coordination_notes

volunteers  (linked to users)
sos_alerts  (linked to service_requests)
medication_requests  (linked to service_requests + service_providers)
onboarding_responses (linked to users)
chat_conversations   (linked to users)
  └─ chat_messages
crisis_analytics     (daily aggregates)
```

## Request Routing Pipeline

```
User submits request
        ↓
service_requests (status: pending)
        ↓
request_classifications (AI triage — category + priority_score)
        ↓
service_requests (status: classified)
        ↓
request_assignments (routed to matching service provider)
        ↓
service_requests (status: routed)
        ↓
Provider accepts → request_assignments.status = accepted
        ↓
service_requests (status: accepted → in_progress)
        ↓
secure_messages (bidirectional encrypted communication)
        ↓
service_requests (status: resolved)
        ↓
crisis_analytics (daily aggregation via stored procedure)
```

## Setup

### Prerequisites
- MySQL 8.0+ (required for `DEFAULT (UUID())` and JSON columns)
- Event scheduler enabled for automatic analytics aggregation

### Running Migrations

Using the backend migration script:
```bash
cd backend
npm run migrate
```

Or directly against MySQL:
```bash
mysql -u root -p < database/001_initial_schema.sql
mysql -u root -p aidline < database/002_analytics_procedures.sql
```

### Create Database User
```sql
CREATE USER 'aidline'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON aidline.* TO 'aidline'@'localhost';
FLUSH PRIVILEGES;
```

### Enable Event Scheduler
Add to `my.cnf`:
```ini
[mysqld]
event_scheduler=ON
```

## Key Design Decisions

- **No geolocation data**: No `GEOGRAPHY`, `POINT`, or coordinate columns exist anywhere in the schema.
- **Request routing without proximity**: Routing is done by matching `recommended_provider_type` to `service_providers.type`.
- **Privacy-first**: Anonymous users are fully supported; no PII is required to submit a request.
- **JSON columns**: `skills`, `services`, `attachments` use MySQL JSON type for flexible structured data.
- **UUID primary keys**: All IDs are UUIDs for distributed system compatibility.
