USE aidline;

INSERT INTO aid_users (id, anonymous_label, preferred_language)
VALUES
  ('1a2c5028-9fd8-4d8f-8ad2-9f8c9e10d101', 'user-7H3K9A', 'en'),
  ('2b3d6139-a0e9-5e90-9be3-af9dae21e202', 'user-Q2L4XF', 'ar');

INSERT INTO organizations (organization_type, name, contact_email, contact_phone)
VALUES
  ('healthcare_provider', 'Hope Medical Network', 'ops@hope-med.org', '+961-01-555000'),
  ('pharmacy', 'CarePlus Pharmacy Group', 'stock@careplus.org', '+961-01-555001'),
  ('ngo', 'Relief Bridge NGO', 'coord@reliefbridge.org', '+961-01-555002'),
  ('government_authority', 'Public Health Operations Center', 'intel@pho.gov', '+961-01-555003');

INSERT INTO organization_capabilities (organization_id, capability)
VALUES
  (1, 'medical_consultation'),
  (1, 'emergency_medical_assistance'),
  (1, 'hospital_or_clinic_access'),
  (2, 'medication_stock_confirmation'),
  (2, 'secure_case_messaging'),
  (3, 'humanitarian_case_support'),
  (3, 'secure_case_messaging'),
  (4, 'secure_case_messaging');

INSERT INTO aid_requests (public_id, user_id, request_type, description, urgency, source_channel, status)
VALUES
  (
    '9fdb4d6f-92d7-4b6d-a672-e31f7218f301',
    '1a2c5028-9fd8-4d8f-8ad2-9f8c9e10d101',
    'sos_emergency',
    'Severe chest pain and dizziness. Need urgent medical support.',
    'critical',
    'web',
    'in_progress'
  ),
  (
    '3cf8dd5e-8263-44f8-8621-fd9d6f84cc02',
    '2b3d6139-a0e9-5e90-9be3-af9dae21e202',
    'medication_availability',
    'Need insulin refill for 7 days, no remaining stock.',
    'high',
    'mobile',
    'routed'
  ),
  (
    'd0a731c6-f14b-4576-8f8a-44f44271ea03',
    '1a2c5028-9fd8-4d8f-8ad2-9f8c9e10d101',
    'ngo_support',
    'Requesting food parcels and family support.',
    'medium',
    'web',
    'accepted'
  );

INSERT INTO triage_results (request_id, category, priority, required_responder, confidence_score, triage_notes)
VALUES
  (1, 'medical_emergency', 'critical', 'emergency_medical_team', 98.20, 'Emergency symptoms detected'),
  (2, 'medication_need', 'high', 'pharmacy_team', 95.40, 'Medication continuity risk'),
  (3, 'humanitarian_aid', 'medium', 'ngo_case_worker', 90.75, 'Humanitarian assistance workflow');

INSERT INTO request_routes (request_id, routing_module, organization_id, route_status, accepted_at)
VALUES
  (1, 'healthcare_network', 1, 'accepted', CURRENT_TIMESTAMP),
  (2, 'medication_supply', 2, 'pending', NULL),
  (3, 'ngo_coordination', 3, 'accepted', CURRENT_TIMESTAMP);

INSERT INTO secure_conversations (request_id, status)
VALUES
  (1, 'in_progress'),
  (2, 'open'),
  (3, 'in_progress');

INSERT INTO secure_messages (conversation_id, sender_type, sender_user_id, sender_organization_id, message_type, encrypted_body, is_read)
VALUES
  (1, 'user', '1a2c5028-9fd8-4d8f-8ad2-9f8c9e10d101', NULL, 'text', 'enc:Please respond quickly', 1),
  (1, 'organization', NULL, 1, 'instruction', 'enc:Stay seated and avoid physical activity. Team is contacting you.', 0),
  (2, 'user', '2b3d6139-a0e9-5e90-9be3-af9dae21e202', NULL, 'text', 'enc:Insulin request details attached', 1),
  (3, 'organization', NULL, 3, 'follow_up', 'enc:Case accepted. We will coordinate next steps in chat.', 0);

INSERT INTO request_events (request_id, event_type, event_payload)
VALUES
  (1, 'request_submitted', JSON_OBJECT('channel', 'web')),
  (1, 'triage_completed', JSON_OBJECT('category', 'medical_emergency', 'priority', 'critical')),
  (1, 'route_accepted', JSON_OBJECT('module', 'healthcare_network', 'organization_id', 1)),
  (2, 'request_submitted', JSON_OBJECT('channel', 'mobile')),
  (2, 'triage_completed', JSON_OBJECT('category', 'medication_need', 'priority', 'high')),
  (3, 'request_submitted', JSON_OBJECT('channel', 'web'));
