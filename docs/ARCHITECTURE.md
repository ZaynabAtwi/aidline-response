# AidLine request-routing architecture

AidLine now operates as a centralized coordination and triage platform rather than a location-aware matching system.

## Core principles

- No GPS, map, or proximity-based routing.
- Requests are classified by type, urgency, and required responder.
- Routing is performed through service networks and responder acceptance.
- Resolution happens inside secure communication channels.
- Aggregated analytics are generated from anonymous operational data.

## Operational pipeline

1. **User request entry**
   - Entry points: SOS, medication, support chat, shelter or NGO assistance.
   - Data collected: assistance type, free-text description, urgency, optional attachments.
   - Data not collected: exact or approximate location.

2. **AI classification and triage**
   - AidLine assigns a request category:
     - medical emergency
     - medication need
     - humanitarian aid
     - general inquiry
   - The request also receives a priority level and a target routing module.

3. **Service routing**
   - `healthcare_network` handles medical emergencies and clinical care.
   - `medication_supply` handles pharmacy and medicine fulfillment workflows.
   - `ngo_coordination` handles shelter, aid, and humanitarian assistance.
   - `secure_communication` handles follow-up, clarification, and general inquiry flows.

4. **Responder acceptance**
   - Providers or organizations accept ownership of the case.
   - Routing can be escalated if the first provider cannot resolve the request.

5. **Secure communication**
   - Users and responders exchange instructions, updates, files, and follow-up requests.
   - This becomes the primary case-resolution channel.

6. **Resolution and analytics**
   - Cases move to resolved, cancelled, or escalated states.
   - Aggregated metrics support dashboards for health authorities, NGOs, and operators.

## Application impact

- SOS and volunteer flows must not request browser geolocation.
- Onboarding must not collect district or area data.
- UI text should describe coordination, routing, triage, and privacy rather than "nearby" services.
- The persistence layer should model routing, assignments, conversations, and analytics explicitly.

## Recommended persistence model

The MySQL schema in `database/mysql/001_request_routing_schema.sql` introduces:

- request intake records
- triage events
- routing events
- service providers and networks
- medication inventory
- responder assignments
- secure conversations and messages
- crisis analytics views

## End-to-end interaction chain

```text
User Request
  -> AI Classification
  -> Service Routing
  -> Responder Acceptance
  -> Secure Communication
  -> Case Resolution
  -> Crisis Intelligence
```
