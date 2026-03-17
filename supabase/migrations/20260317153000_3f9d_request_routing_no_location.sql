-- Transition AidLine away from geographic routing.
-- This migration removes location fields and adds structured routing metadata.

ALTER TABLE public.onboarding_responses
  DROP COLUMN IF EXISTS district;

ALTER TABLE public.shelters
  DROP COLUMN IF EXISTS location;

ALTER TABLE public.clinics
  DROP COLUMN IF EXISTS location;

ALTER TABLE public.pharmacies
  DROP COLUMN IF EXISTS location;

ALTER TABLE public.volunteers
  DROP COLUMN IF EXISTS location;

ALTER TABLE public.sos_alerts
  DROP COLUMN IF EXISTS location;

DROP INDEX IF EXISTS public.idx_shelters_location;
DROP INDEX IF EXISTS public.idx_clinics_location;
DROP INDEX IF EXISTS public.idx_pharmacies_location;
DROP INDEX IF EXISTS public.idx_volunteers_location;
DROP INDEX IF EXISTS public.idx_sos_alerts_location;

DO $$
BEGIN
  CREATE TYPE public.service_request_category AS ENUM (
    'medical_emergency',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.sos_alerts
  ADD COLUMN IF NOT EXISTS assistance_category public.service_request_category NOT NULL DEFAULT 'medical_emergency',
  ADD COLUMN IF NOT EXISTS urgency public.urgency_level NOT NULL DEFAULT 'critical',
  ADD COLUMN IF NOT EXISTS triage_status TEXT NOT NULL DEFAULT 'classified',
  ADD COLUMN IF NOT EXISTS responder_type TEXT NOT NULL DEFAULT 'ngo';

ALTER TABLE public.medication_requests
  ADD COLUMN IF NOT EXISTS assistance_category public.service_request_category NOT NULL DEFAULT 'medication_need',
  ADD COLUMN IF NOT EXISTS triage_status TEXT NOT NULL DEFAULT 'routed',
  ADD COLUMN IF NOT EXISTS responder_type TEXT NOT NULL DEFAULT 'pharmacy';
