# AidLine Operational Interaction Model (No Location Data)

AidLine operates as a centralized crisis-coordination platform with structured triage and service routing.

## Interaction flow

1. **User Request Entry**
   - Supported actions:
     - SOS emergency
     - healthcare services
     - medication availability
     - NGO/humanitarian support
     - secure messaging
   - Captured fields:
     - request type
     - urgency
     - issue description
     - optional attachments
   - No geographic user tracking or GPS.

2. **AI Triage**
   - Classifies each request into:
     - medical emergency
     - medication need
     - humanitarian aid
     - general inquiry
   - Computes priority and required responder type.

3. **Service Routing**
   - `medical_emergency` -> `healthcare_network`
   - `medication_need` -> `medication_supply`
   - `humanitarian_aid` -> `ngo_coordination`
   - `general_inquiry` -> `secure_communication`

4. **Responder Acceptance**
   - Organization accepts/declines/escalates.
   - Route status is tracked for audit and operations.

5. **Secure Communication**
   - Encrypted text/document exchange between user and responders.
   - Instructions and follow-up handled in-platform.

6. **Resolution + Crisis Intelligence**
   - Request closes after coordination completes.
   - Aggregate analytics are generated for dashboards (without personal location data).

## Canonical chain

`User Request -> AI Classification -> Service Routing -> Responder Acceptance -> Secure Communication -> Case Resolution -> Aggregated Intelligence`
