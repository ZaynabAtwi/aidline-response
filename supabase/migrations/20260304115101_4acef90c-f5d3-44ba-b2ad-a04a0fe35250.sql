
-- Access tokens for NGO secure channel (admin-generated)
CREATE TABLE public.ngo_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  label text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ngo_access_tokens ENABLE ROW LEVEL SECURITY;

-- Only ngo_admins can manage tokens
CREATE POLICY "Admins can manage tokens" ON public.ngo_access_tokens
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'ngo_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'ngo_admin'::app_role));

-- Coordination notes (internal, minimal metadata)
CREATE TABLE public.coordination_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  author_token_id uuid REFERENCES public.ngo_access_tokens(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coordination_notes ENABLE ROW LEVEL SECURITY;

-- Only ngo_admins can CRUD coordination notes
CREATE POLICY "Admins can manage notes" ON public.coordination_notes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'ngo_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'ngo_admin'::app_role));

-- Function to validate token (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.validate_ngo_token(p_token text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.ngo_access_tokens
  WHERE token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
$$;
