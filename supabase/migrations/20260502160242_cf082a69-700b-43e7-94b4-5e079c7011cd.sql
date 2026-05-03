
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- investigations
CREATE TABLE public.investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT,
  threshold INT NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'in_progress',
  profiles_count INT NOT NULL DEFAULT 0,
  matches_count INT NOT NULL DEFAULT 0,
  high_confidence_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.investigations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_own_all" ON public.investigations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- profiles_found
CREATE TABLE public.profiles_found (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  profile_url TEXT,
  confidence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles_found ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pf_own_all" ON public.profiles_found FOR ALL
  USING (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.user_id = auth.uid()));

-- matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL REFERENCES public.investigations(id) ON DELETE CASCADE,
  platform_a TEXT NOT NULL,
  username_a TEXT NOT NULL,
  platform_b TEXT NOT NULL,
  username_b TEXT NOT NULL,
  score NUMERIC NOT NULL,
  confidence TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "m_own_all" ON public.matches FOR ALL
  USING (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.user_id = auth.uid()));

-- graph_data
CREATE TABLE public.graph_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investigation_id UUID NOT NULL UNIQUE REFERENCES public.investigations(id) ON DELETE CASCADE,
  nodes_json JSONB NOT NULL,
  edges_json JSONB NOT NULL,
  stats_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.graph_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "g_own_all" ON public.graph_data FOR ALL
  USING (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigations i WHERE i.id = investigation_id AND i.user_id = auth.uid()));
