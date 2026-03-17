DO $$
BEGIN
  CREATE TYPE public.assistance_category AS ENUM (
    'medical_emergency',
    'healthcare_service',
    'medication_need',
    'humanitarian_aid',
    'general_inquiry'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.routing_module AS ENUM (
    'healthcare_network',
    'medication_supply',
    'ngo_coordination',
    'secure_messaging'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.responder_type AS ENUM (
    'healthcare_provider',
    'pharmacy_partner',
    'ngo_coordinator',
    'support_agent'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.routing_status AS ENUM (
    'queued',
    'triaged',
    'routed',
    'accepted',
    'resolved',
    'escalated',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.sos_alerts
  ADD COLUMN IF NOT EXISTS urgency public.urgency_level NOT NULL DEFAULT 'critical',
  ADD COLUMN IF NOT EXISTS assistance_category public.assistance_category NOT NULL DEFAULT 'medical_emergency',
  ADD COLUMN IF NOT EXISTS priority_level public.urgency_level NOT NULL DEFAULT 'critical',
  ADD COLUMN IF NOT EXISTS routing_module public.routing_module NOT NULL DEFAULT 'healthcare_network',
  ADD COLUMN IF NOT EXISTS routing_status public.routing_status NOT NULL DEFAULT 'routed',
  ADD COLUMN IF NOT EXISTS required_responder public.responder_type NOT NULL DEFAULT 'healthcare_provider',
  ADD COLUMN IF NOT EXISTS classification_summary text,
  ADD COLUMN IF NOT EXISTS triage_reason text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP INDEX IF EXISTS idx_sos_alerts_location;
ALTER TABLE public.sos_alerts DROP COLUMN IF EXISTS location;

DROP TRIGGER IF EXISTS update_sos_alerts_updated_at ON public.sos_alerts;
CREATE TRIGGER update_sos_alerts_updated_at
BEFORE UPDATE ON public.sos_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.medication_requests
  ADD COLUMN IF NOT EXISTS assistance_category public.assistance_category NOT NULL DEFAULT 'medication_need',
  ADD COLUMN IF NOT EXISTS priority_level public.urgency_level NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS routing_module public.routing_module NOT NULL DEFAULT 'medication_supply',
  ADD COLUMN IF NOT EXISTS routing_status public.routing_status NOT NULL DEFAULT 'routed',
  ADD COLUMN IF NOT EXISTS required_responder public.responder_type NOT NULL DEFAULT 'pharmacy_partner',
  ADD COLUMN IF NOT EXISTS classification_summary text,
  ADD COLUMN IF NOT EXISTS triage_reason text,
  ADD COLUMN IF NOT EXISTS escalation_target public.routing_module,
  ADD COLUMN IF NOT EXISTS responder_notes text,
  ADD COLUMN IF NOT EXISTS stock_status text NOT NULL DEFAULT 'pending_review';

ALTER TABLE public.volunteers
  ADD COLUMN IF NOT EXISTS service_channels text[] NOT NULL DEFAULT ARRAY['ngo_coordination', 'secure_messaging']::text[],
  ADD COLUMN IF NOT EXISTS assignment_capacity integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS availability_notes text,
  ADD COLUMN IF NOT EXISTS routing_tags text[] NOT NULL DEFAULT ARRAY[]::text[];

DROP INDEX IF EXISTS idx_volunteers_location;
ALTER TABLE public.volunteers DROP COLUMN IF EXISTS location;

ALTER TABLE public.onboarding_responses
  ADD COLUMN IF NOT EXISTS needs_healthcare boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS needs_humanitarian_aid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_contact_channel text NOT NULL DEFAULT 'secure_messaging',
  ADD COLUMN IF NOT EXISTS service_preferences text[] NOT NULL DEFAULT ARRAY[]::text[];

ALTER TABLE public.onboarding_responses DROP COLUMN IF EXISTS district;

CREATE OR REPLACE VIEW public.request_intelligence_summary AS
SELECT
  'sos_alerts'::text AS request_source,
  assistance_category::text AS assistance_category,
  routing_module::text AS routing_module,
  priority_level::text AS priority_level,
  routing_status::text AS routing_status,
  date_trunc('day', created_at) AS request_day,
  count(*)::bigint AS total_requests
FROM public.sos_alerts
GROUP BY
  assistance_category,
  routing_module,
  priority_level,
  routing_status,
  date_trunc('day', created_at)

UNION ALL

SELECT
  'medication_requests'::text AS request_source,
  assistance_category::text AS assistance_category,
  routing_module::text AS routing_module,
  priority_level::text AS priority_level,
  routing_status::text AS routing_status,
  date_trunc('day', created_at) AS request_day,
  count(*)::bigint AS total_requests
FROM public.medication_requests
GROUP BY
  assistance_category,
  routing_module,
  priority_level,
  routing_status,
  date_trunc('day', created_at);
