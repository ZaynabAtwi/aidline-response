
CREATE TABLE public.gas_stations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  district text NOT NULL,
  status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('open', 'closed', 'unknown')),
  phone text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.gas_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gas stations" ON public.gas_stations FOR SELECT USING (true);
CREATE POLICY "NGO admins can insert gas stations" ON public.gas_stations FOR INSERT WITH CHECK (has_role(auth.uid(), 'ngo_admin'::app_role));
CREATE POLICY "NGO admins can update gas stations" ON public.gas_stations FOR UPDATE USING (has_role(auth.uid(), 'ngo_admin'::app_role));
CREATE POLICY "NGO admins can delete gas stations" ON public.gas_stations FOR DELETE USING (has_role(auth.uid(), 'ngo_admin'::app_role));
