# AidLine MySQL Database

This directory contains a location-free relational model for AidLine's request routing architecture.

## Goals

- No GPS or geographic proximity dependency.
- Structured request intake for SOS, healthcare, medication, NGO support, and secure messages.
- AI triage output persistence (category, priority, responder type, confidence).
- Deterministic routing and escalation tracking.
- Secure communication records between requester and responder.
- Aggregated intelligence views for institutional dashboards.

## Files

- `001_schema.sql`: Core transactional schema.
- `002_views.sql`: Analytics and institutional dashboard views.

## Run

```sql
SOURCE /absolute/path/to/database/mysql/001_schema.sql;
SOURCE /absolute/path/to/database/mysql/002_views.sql;
```

Or via CLI:

```bash
mysql -u <user> -p < /absolute/path/to/database/mysql/001_schema.sql
mysql -u <user> -p < /absolute/path/to/database/mysql/002_views.sql
```

## Operational Mapping

1. **User Request Entry Layer** → `aid_requests`
2. **AI Classification & Triage** → `request_triage_results`
3. **Service Routing Engine** → `request_routes`, `provider_accounts`
4. **Secure Communication** → `secure_conversations`, `secure_messages`
5. **Healthcare Workflow** → `healthcare_interactions`
6. **Medication Workflow** → `medication_responses`
7. **NGO Assistance Workflow** → `ngo_case_actions`
8. **Crisis Intelligence** → `vw_*` analytics views
9. **Institutional Integration** → `vw_institutional_dashboard`
