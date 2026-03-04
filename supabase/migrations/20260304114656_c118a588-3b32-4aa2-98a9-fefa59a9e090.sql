
-- Onboarding responses table linked to anonymous user via auth.uid()
CREATE TABLE public.onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  needs_shelter boolean NOT NULL DEFAULT false,
  needs_medication boolean NOT NULL DEFAULT false,
  is_volunteering boolean NOT NULL DEFAULT false,
  district text,
  urgency text NOT NULL DEFAULT 'low',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own onboarding data
CREATE POLICY "Users can view own onboarding" ON public.onboarding_responses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON public.onboarding_responses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON public.onboarding_responses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Admins can view all onboarding data
CREATE POLICY "Admins can view all onboarding" ON public.onboarding_responses
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'ngo_admin'::app_role));
