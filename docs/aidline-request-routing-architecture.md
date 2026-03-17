# AidLine Request Routing Architecture (No Location Data)

AidLine operates as a centralized coordination and triage platform. Requests are processed through classification and routing pipelines, not geographic proximity.

## Interaction Chain

User Request  
-> AI Classification  
-> Service Routing  
-> Responder Acceptance  
-> Secure Communication  
-> Case Resolution  
-> Aggregated Intelligence

## Layered Workflow

### 1) User Request Entry Layer

Users submit requests through structured forms:

- SOS emergency request
- Healthcare service request
- Medication request
- NGO/humanitarian support request
- Secure messaging request

Captured fields:

- assistance category
- urgency level
- issue description
- optional document/image metadata

No latitude, longitude, GPS, or proximity fields are used.

### 2) Crisis Classification and AI Triage

The triage module classifies each request by:

- category (`medical_emergency`, `medication_need`, `humanitarian_aid`, `general_inquiry`)
- priority (`low`, `medium`, `high`, `critical`)
- responder type (`healthcare`, `pharmacy`, `ngo`, `mixed`)

Triage decisions are persisted and auditable.

### 3) Service Routing Engine

Requests are routed by category/priority and provider capacity:

- Healthcare Network Module
- Medication Supply Module
- NGO Coordination Module

Routing state tracks queueing, delivery, acceptance, escalation, and completion.

### 4) Secure Communication System

Once accepted, requester and responder communicate in a secure channel:

- encrypted message payload storage
- document metadata exchange
- follow-up and instructions

### 5) Domain Workflows

- Healthcare: information requests, teleconsultation instructions, appointment coordination.
- Medication: stock confirmation, alternatives, reservation, pickup instructions.
- NGO: case evaluation, acceptance, aid coordination, follow-up.

### 6) Crisis Intelligence and Institutional Dashboards

Aggregated analytics provide:

- SOS volume
- medical/emergency trends
- medication shortages
- humanitarian demand
- responder network load

These outputs support institutional planning without tracking user locations.
