-- Remove location tracking and move to structured routing
ALTER TABLE public.sos_alerts DROP COLUMN IF EXISTS location;
ALTER TABLE public.volunteers DROP COLUMN IF EXISTS location;
ALTER TABLE public.shelters DROP COLUMN IF EXISTS location;
ALTER TABLE public.clinics DROP COLUMN IF EXISTS location;
ALTER TABLE public.pharmacies DROP COLUMN IF EXISTS location;
ALTER TABLE public.onboarding_responses DROP COLUMN IF EXISTS district;

DROP INDEX IF EXISTS idx_shelters_location;
DROP INDEX IF EXISTS idx_clinics_location;
DROP INDEX IF EXISTS idx_pharmacies_location;
DROP INDEX IF EXISTS idx_volunteers_location;
DROP INDEX IF EXISTS idx_sos_alerts_location;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_request_type') THEN
    CREATE TYPE public.service_request_type AS ENUM (
      'sos_emergency',
      'healthcare_service',
      'medication_availability',
      'ngo_support',
      'secure_message'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_category') THEN
    CREATE TYPE public.request_category AS ENUM (
      'medical_emergency',
      'medication_need',
      'humanitarian_aid',
      'general_inquiry'
    );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'routing_module') THEN
    CREATE TYPE public.routing_module AS ENUM (
      'healthcare_network',
      'medication_supply',
      'ngo_coordination',
      'secure_communication'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type service_request_type NOT NULL,
  issue_description text,
  urgency urgency_level NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'triaged', 'routed', 'accepted', 'in_progress', 'resolved', 'cancelled', 'escalated')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.request_triage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES public.service_requests(id) ON DELETE CASCADE,
  category request_category NOT NULL,
  priority urgency_level NOT NULL,
  required_responder text NOT NULL,
  confidence_score numeric(5,2),
  triage_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.request_routing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  module routing_module NOT NULL,
  route_status text NOT NULL DEFAULT 'pending' CHECK (
    route_status IN ('pending', 'accepted', 'declined', 'escalated', 'closed')
  ),
  organization_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  closed_at timestamptz
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create service requests" ON public.service_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and responders can view service requests" ON public.service_requests
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR has_role(auth.uid(), 'ngo_admin') OR has_role(auth.uid(), 'volunteer')
  );

CREATE POLICY "Responders can update service requests" ON public.service_requests
  FOR UPDATE TO authenticated USING (
    has_role(auth.uid(), 'ngo_admin') OR has_role(auth.uid(), 'volunteer')
  );

CREATE POLICY "Responders can manage triage" ON public.request_triage
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'ngo_admin') OR has_role(auth.uid(), 'volunteer')
  )
  WITH CHECK (
    has_role(auth.uid(), 'ngo_admin') OR has_role(auth.uid(), 'volunteer')
  );

CREATE POLICY "Responders can manage routing" ON public.request_routing
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'ngo_admin') OR has_role(auth.uid(), 'volunteer')
  )
  WITH CHECK (
    has_role(auth.uid(), 'ngo_admin') OR has_role(auth.uid(), 'volunteer')
  );

CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
