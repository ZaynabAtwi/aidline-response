# AidLine Operational Interaction Model (No Location Data)

AidLine runs as a centralized coordination and triage platform.
Requests are processed through structured routing, not geographic proximity.

## Interaction chain

User Request -> AI Classification -> Service Routing -> Responder Acceptance -> Secure Communication -> Case Resolution -> Aggregated Intelligence

## Layer mapping

1. **User Request Entry**
   - Captures request type, issue description, urgency, and optional attachments.
   - Backed by:
     - `aid_requests`
     - `request_attachments`

2. **Crisis Classification and Triage**
   - Categorizes requests into:
     - `medical_emergency`
     - `medication_need`
     - `humanitarian_aid`
     - `general_inquiry`
   - Assigns responder type and priority.
   - Backed by:
     - `triage_results`
     - `sp_triage_and_route`

3. **Service Routing Engine**
   - Routes requests to one of:
     - `healthcare_network`
     - `medication_supply`
     - `ngo_coordination`
     - `secure_messaging`
   - Backed by:
     - `request_routing`
     - `route_assignments`

4. **Secure Communication**
   - Starts once a responder accepts an assignment.
   - Supports encrypted text and file-oriented follow-up workflows.
   - Backed by:
     - `secure_conversations`
     - `secure_messages`

5. **Case Resolution**
   - Tracks workflow events across triage, acceptance, escalation, and closure.
   - Backed by:
     - `case_events`

6. **Crisis Intelligence and Institutional Dashboards**
   - Aggregates non-identifying operational trends.
   - Backed by:
     - `v_crisis_intelligence`
     - `v_institutional_dashboard`

## Privacy impact

- No location coordinates are required for routing.
- No proximity matching is used for assignment.
- Operational analytics can be generated from category, urgency, status, and service-path metadata.
