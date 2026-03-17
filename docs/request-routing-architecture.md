# AidLine request routing architecture

AidLine now follows a routing-first operating model. The platform no longer depends on user location, GPS, or geographic proximity to decide where a request should go.

## Operational pipeline

1. **User request entry**
   - Users submit SOS requests, healthcare needs, medication requests, humanitarian support requests, or secure messages.
   - The request payload contains structured fields such as request type, description, urgency, and optional attachments.

2. **AI triage**
   - Requests are classified into one of these categories:
     - `medical_emergency`
     - `healthcare_service`
     - `medication_need`
     - `humanitarian_aid`
     - `general_inquiry`
   - Each request is assigned:
     - a priority level
     - a routing module
     - a required responder type
     - a routing summary and triage reason

3. **Service routing**
   - `healthcare_network`
   - `medication_supply`
   - `ngo_coordination`
   - `secure_messaging`

4. **Responder acceptance**
   - Providers or coordinators accept, decline, or escalate a case.
   - Routing metadata remains attached to the case for auditability.

5. **Secure communication**
   - Once a case is accepted, secure messaging becomes the primary coordination channel.

6. **Case resolution and crisis intelligence**
   - Resolved and escalated cases feed aggregate dashboards without collecting user location data.

## Repository changes

### Frontend

- Removed all browser geolocation collection from SOS and volunteer flows.
- Added a shared triage engine in `src/lib/requestRouting.ts`.
- Added routing previews to user-facing request forms.
- Updated dashboards to display routing metrics, module assignment, responder type, and routing state.
- Updated product copy to describe structured routing instead of nearby matching.

### Supabase compatibility

The existing frontend still reads and writes through Supabase, so a compatibility migration was added:

- `supabase/migrations/20260317113000_request_routing_architecture.sql`

That migration:

- removes location storage from user-facing request tables
- adds routing enums and metadata columns
- adds onboarding fields for service preferences rather than district selection
- creates a `request_intelligence_summary` view for aggregate analytics

### MySQL schema

The new canonical routing-oriented database model is defined in:

- `database/mysql/aidline_request_routing_schema.sql`

Key MySQL tables:

- `aidline_users`
- `service_providers`
- `provider_service_modules`
- `service_requests`
- `request_assignments`
- `request_messages`
- `request_attachments`
- `medication_inventory`
- `routing_audit_log`
- `crisis_intelligence_daily`

Key MySQL views:

- `institutional_request_dashboard`
- `medication_shortage_overview`

## Running the MySQL database locally

Use the included Docker Compose file:

```bash
npm run db:mysql:up
```

This starts MySQL and loads the AidLine routing schema automatically.

Useful commands:

```bash
npm run db:mysql:logs
npm run db:mysql:down
```

## Design notes

- No geospatial columns are required in the MySQL schema.
- Routing decisions are based on declared need, urgency, and responder capability.
- Secure messaging is the default coordination mechanism after case acceptance.
- Institutional dashboards consume aggregated counts and trends rather than user location data.
