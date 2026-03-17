# AidLine request-routing architecture

AidLine now operates as a centralized coordination and triage platform rather than a location-aware discovery system. The platform is designed to classify, route, and resolve requests through structured workflows, secure communication, and aggregated operational intelligence.

## Core principles

- No user location or GPS collection.
- Structured request intake instead of proximity matching.
- AI-assisted triage for category and urgency.
- Routing to responder networks by service capability.
- Secure messaging as the main coordination channel.
- Anonymous analytics for crisis intelligence and institutional dashboards.

## Operational pipeline

```text
User Request
  ->
AI Classification
  ->
Service Routing
  ->
Responder Acceptance
  ->
Secure Communication
  ->
Case Resolution
  ->
Anonymous Data Aggregation
```

## 1. User request entry layer

Users can submit structured requests for:

- SOS emergency support
- Healthcare services
- Medication availability
- NGO or humanitarian assistance
- Secure case messaging

The intake payload should focus on structured, non-location fields such as:

- assistance type
- issue description
- urgency level
- optional attachments
- preferred language

## 2. Crisis classification and AI triage

Each request is classified after submission to determine:

- request category
  - medical emergency
  - medication need
  - humanitarian aid
  - general inquiry
- priority level
- required responder type
- routing rationale

This allows AidLine to prioritize cases without manual sorting or geographic matching.

## 3. Service routing engine

After triage, requests are routed into one or more service networks:

- **Healthcare Network Module**
  - medical consultation
  - emergency medical support
  - clinic or hospital access
- **Medication Supply Module**
  - pharmacy availability checks
  - alternative medication handling
  - reservation and fulfillment instructions
- **NGO Coordination Module**
  - humanitarian review
  - case acceptance
  - support planning and coordination

Routing decisions should be stored explicitly so cases can be audited, escalated, and reassigned.

## 4. Secure communication system

Once a responder or organization accepts a case, AidLine switches into secure coordination mode:

- encrypted text messaging
- document sharing
- follow-up questions
- instructions and case updates

This secure channel becomes the primary coordination mechanism between the user and the responder.

## 5. Service-specific workflows

### Healthcare workflow

Healthcare responders can:

- request additional patient information
- provide teleconsultation guidance
- coordinate appointments
- issue immediate care instructions

### Medication workflow

Pharmacy responders can:

- confirm stock availability
- suggest alternatives
- reserve medication
- share pickup or distribution instructions
- escalate shortages to NGOs or medical aid organizations

### NGO workflow

NGOs can:

- review humanitarian requests
- accept responsibility for a case
- coordinate support delivery
- keep all case communication inside AidLine

## 6. Crisis intelligence and institutional integration

AidLine should expose aggregated, anonymous operational data such as:

- number of SOS requests
- healthcare demand volume
- medication shortages
- humanitarian aid requests
- active versus resolved cases

Administrative dashboards can use this data for:

- request volume analytics
- crisis trend monitoring
- healthcare stress indicators
- humanitarian demand analysis

## Data model alignment

The target MySQL schema for this model lives in:

- `database/mysql/001_request_routing_schema.sql`

That schema removes location fields from case routing and introduces:

- service requests
- triage assessments
- service routes
- responder networks
- secure conversations and messages
- medication inventory and reservations
- case event logs
- dashboard views for aggregated intelligence

## Repository alignment

To reflect this architecture, the repository now:

- removes location capture from onboarding, SOS submission, and volunteer registration
- updates product copy to describe routing and triage instead of proximity
- adds an in-app request-routing overview on the homepage
- includes a MySQL schema for the non-location backend model
