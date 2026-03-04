
-- Enable PostGIS for geolocation
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. ROLE-BASED ACCESS CONTROL
CREATE TYPE public.app_role AS ENUM ('displaced_user', 'volunteer', 'ngo_admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- 2. SHELTERS
CREATE TABLE public.shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  location GEOGRAPHY(POINT, 4326),
  capacity INTEGER NOT NULL DEFAULT 0,
  available_spots INTEGER NOT NULL DEFAULT 0,
  is_operational BOOLEAN NOT NULL DEFAULT true,
  ngo TEXT,
  phone TEXT,
  amenities TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CLINICS
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  location GEOGRAPHY(POINT, 4326),
  phone TEXT,
  is_operational BOOLEAN NOT NULL DEFAULT true,
  services TEXT[],
  operating_hours TEXT,
  ngo TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PHARMACIES
CREATE TABLE public.pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  location GEOGRAPHY(POINT, 4326),
  phone TEXT,
  is_operational BOOLEAN NOT NULL DEFAULT true,
  available_medications TEXT[],
  operating_hours TEXT,
  ngo TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. MEDICATION REQUESTS
CREATE TYPE public.urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'fulfilled', 'cancelled');

CREATE TABLE public.medication_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  urgency urgency_level NOT NULL DEFAULT 'medium',
  status request_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  fulfilled_by UUID REFERENCES auth.users(id),
  pharmacy_id UUID REFERENCES public.pharmacies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. VOLUNTEERS
CREATE TYPE public.volunteer_status AS ENUM ('available', 'assigned', 'unavailable');

CREATE TABLE public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  skills TEXT[] NOT NULL DEFAULT '{}',
  status volunteer_status NOT NULL DEFAULT 'available',
  location GEOGRAPHY(POINT, 4326),
  rating NUMERIC(2,1) DEFAULT 0,
  total_missions INTEGER DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. SOS ALERTS
CREATE TYPE public.sos_status AS ENUM ('active', 'responding', 'resolved', 'cancelled');

CREATE TABLE public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  location GEOGRAPHY(POINT, 4326),
  status sos_status NOT NULL DEFAULT 'active',
  responded_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

-- 9. SECURITY DEFINER FOR ROLE CHECKS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 10. RLS POLICIES

-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'ngo_admin'));

-- Shelters
CREATE POLICY "Anyone can view shelters" ON public.shelters FOR SELECT TO authenticated USING (true);
CREATE POLICY "NGO admins can insert shelters" ON public.shelters FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'ngo_admin'));
CREATE POLICY "NGO admins can update shelters" ON public.shelters FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ngo_admin'));
CREATE POLICY "NGO admins can delete shelters" ON public.shelters FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ngo_admin'));

-- Clinics
CREATE POLICY "Anyone can view clinics" ON public.clinics FOR SELECT TO authenticated USING (true);
CREATE POLICY "NGO admins can insert clinics" ON public.clinics FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'ngo_admin'));
CREATE POLICY "NGO admins can update clinics" ON public.clinics FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ngo_admin'));
CREATE POLICY "NGO admins can delete clinics" ON public.clinics FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ngo_admin'));

-- Pharmacies
CREATE POLICY "Anyone can view pharmacies" ON public.pharmacies FOR SELECT TO authenticated USING (true);
CREATE POLICY "NGO admins can insert pharmacies" ON public.pharmacies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'ngo_admin'));
CREATE POLICY "NGO admins can update pharmacies" ON public.pharmacies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ngo_admin'));
CREATE POLICY "NGO admins can delete pharmacies" ON public.pharmacies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'ngo_admin'));

-- Medication requests
CREATE POLICY "Users can view own med requests" ON public.medication_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ngo_admin') OR public.has_role(auth.uid(), 'volunteer'));
CREATE POLICY "Users can create med requests" ON public.medication_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users/admins can update med requests" ON public.medication_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ngo_admin'));

-- Volunteers
CREATE POLICY "Anyone can view volunteers" ON public.volunteers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Volunteers can insert own record" ON public.volunteers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Volunteers can update own record" ON public.volunteers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- SOS alerts
CREATE POLICY "Users can create SOS" ON public.sos_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view SOS" ON public.sos_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'ngo_admin') OR public.has_role(auth.uid(), 'volunteer'));
CREATE POLICY "Responders can update SOS" ON public.sos_alerts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'ngo_admin') OR public.has_role(auth.uid(), 'volunteer'));

-- 11. UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shelters_updated_at BEFORE UPDATE ON public.shelters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON public.pharmacies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medication_requests_updated_at BEFORE UPDATE ON public.medication_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON public.volunteers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name) VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'displaced_user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. GEOLOCATION INDEXES
CREATE INDEX idx_shelters_location ON public.shelters USING GIST (location);
CREATE INDEX idx_clinics_location ON public.clinics USING GIST (location);
CREATE INDEX idx_pharmacies_location ON public.pharmacies USING GIST (location);
CREATE INDEX idx_volunteers_location ON public.volunteers USING GIST (location);
CREATE INDEX idx_sos_alerts_location ON public.sos_alerts USING GIST (location);
