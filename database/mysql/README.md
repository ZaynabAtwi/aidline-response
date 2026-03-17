# AidLine MySQL Database

This directory contains a MySQL-first data model for AidLine's **non-location** operating mode.

## Core principle

AidLine routes requests through:

1. Request intake
2. AI triage classification
3. Service routing
4. Responder acceptance
5. Secure communication
6. Case resolution
7. Aggregated crisis intelligence

No GPS, coordinates, or proximity matching are required.

## Files

- `001_aidline_schema.sql`
  - Core tables for users, requests, triage, routing, assignments, messaging, medication inventory, and events.
  - Includes `v_crisis_intelligence`.
  - Includes `sp_submit_aid_request`.
- `002_aidline_routing_procedures.sql`
  - Routing/triage stored procedures:
    - `sp_triage_and_route`
    - `sp_accept_route_assignment`
  - Includes `v_institutional_dashboard` for institutional analytics.

## Apply schema

```bash
mysql -u root -p < database/mysql/001_aidline_schema.sql
mysql -u root -p < database/mysql/002_aidline_routing_procedures.sql
```

## Notes

- JSON fields are used for triage reasoning and event payloads.
- Views expose **aggregated** operational intelligence suitable for dashboards.
- Tables are normalized for secure request lifecycle tracking.
