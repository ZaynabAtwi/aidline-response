# MySQL migration notes for AidLine

This repository originally relied on Supabase/PostgreSQL tables that still reflect an older geography-oriented model. The MySQL design added in this change replaces location storage with request-routing entities.

## Goals

- Remove dependence on PostGIS `GEOGRAPHY` columns.
- Store structured request, triage, routing, and communication data in MySQL.
- Preserve anonymous-user workflows while allowing external auth providers.
- Support aggregated dashboards without storing user location.

## Table mapping

| Existing table | MySQL destination | Notes |
| --- | --- | --- |
| `profiles` | `app_users` | Keep anonymous or external auth references. |
| `user_roles` | `app_users`, `organizations`, app auth layer | Authorization should move into the application or API layer. |
| `clinics`, `pharmacies`, `shelters` | `service_providers`, `provider_services` | Providers become network-aware resources instead of map entries. |
| `medication_requests` | `aid_requests`, `request_triage_events`, `routing_events` | Medication intake is routed and tracked end to end. |
| `volunteers` | `service_providers` or a dedicated responder table | Availability and skills matter; coordinates do not. |
| `sos_alerts` | `aid_requests`, `responder_assignments` | Emergency requests become triaged cases. |
| `chat_conversations`, `chat_messages` | `secure_conversations`, `secure_messages` | Conversation state stays attached to a request. |
| `coordination_notes` | `routing_events` or internal ops tables | Better represented as request or routing activity. |
| `onboarding_responses` | `aid_requests` prefill or profile preferences | Avoid storing district or area fields. |

## Removed concepts

- `location GEOGRAPHY(POINT, 4326)`
- GIS indexes and distance calculations
- GPS-based search or responder matching
- district-based intake as a substitute for precise location

## Added concepts

- `category`
- `priority_level`
- `routing_module`
- `request_triage_events`
- `routing_events`
- `responder_assignments`
- `secure_conversations`
- `secure_messages`
- `provider_medication_inventory`
- crisis analytics views

## Auth and authorization

Supabase row-level security does not translate directly to MySQL. The expected replacement is:

1. authenticate users in an API or gateway
2. map the authenticated subject to `app_users.external_auth_id`
3. enforce authorization in the service layer
4. expose restricted analytics through application-level roles

## Migration sequence

1. Create the MySQL schema from `database/mysql/001_request_routing_schema.sql`.
2. Backfill providers from shelters, clinics, pharmacies, NGOs, and volunteers.
3. Convert medication requests and SOS alerts into `aid_requests`.
4. Attach triage metadata and routing events during import.
5. Migrate chat data into request-linked secure conversations.
6. Switch frontend/backend integrations from Supabase table access to an API backed by MySQL.
