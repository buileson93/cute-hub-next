-- MIRATS 2.0 Project Lean Framework Additive Migration

-- 1. Project Framework Settings
CREATE TABLE public.project_framework_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.du_an(id) ON DELETE CASCADE NOT NULL,
    lean_ux_enabled BOOLEAN DEFAULT FALSE,
    shape_up_enabled BOOLEAN DEFAULT FALSE,
    ops_lane_enabled BOOLEAN DEFAULT FALSE,
    cycle_small_appetite_weeks INTEGER DEFAULT 2,
    cycle_big_appetite_weeks INTEGER DEFAULT 6,
    cooldown_weeks INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(project_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_framework_settings TO authenticated;
GRANT ALL ON public.project_framework_settings TO service_role;
ALTER TABLE public.project_framework_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view settings for projects they can see" ON public.project_framework_settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.du_an WHERE id = project_id));
CREATE POLICY "Managers can update settings" ON public.project_framework_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.du_an WHERE id = project_id AND quan_ly_id = auth.uid()));

-- 2. Lean UX Discovery
CREATE TABLE public.lean_ux_canvases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.du_an(id) ON DELETE CASCADE NOT NULL,
    business_problem TEXT,
    business_outcomes TEXT,
    users_customers TEXT,
    user_benefits TEXT,
    solution_ideas TEXT,
    hypotheses TEXT,
    riskiest_assumptions TEXT,
    first_steps_experiments TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lean_ux_canvases TO authenticated;
GRANT ALL ON public.lean_ux_canvases TO service_role;
ALTER TABLE public.lean_ux_canvases ENABLE ROW LEVEL SECURITY;

-- 3. Shape Up & Shaping
CREATE TABLE public.pitches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.du_an(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    problem TEXT,
    appetite TEXT,
    solution TEXT,
    rabbit_holes TEXT,
    no_gos TEXT,
    status TEXT DEFAULT 'draft',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitches TO authenticated;
GRANT ALL ON public.pitches TO service_role;
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.pitch_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pitch_id UUID REFERENCES public.pitches(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    hill_position INTEGER DEFAULT 0, -- 0-100
    hill_status TEXT DEFAULT 'climbing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_scopes TO authenticated;
GRANT ALL ON public.pitch_scopes TO service_role;
ALTER TABLE public.pitch_scopes ENABLE ROW LEVEL SECURITY;

-- 4. Cycles
CREATE TABLE public.cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.du_an(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    kind TEXT DEFAULT 'big', -- small, big, cooldown
    status TEXT DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycles TO authenticated;
GRANT ALL ON public.cycles TO service_role;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- 5. Project Dossiers
CREATE TABLE public.project_dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.du_an(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_dossiers TO authenticated;
GRANT ALL ON public.project_dossiers TO service_role;
ALTER TABLE public.project_dossiers ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.dossier_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id UUID REFERENCES public.project_dossiers(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    abstract TEXT,
    submit_date DATE,
    sign_date DATE,
    format TEXT, -- paper, digital
    copy_type TEXT, -- original, copy, certified
    issuing_body TEXT,
    file_url TEXT,
    storage_path TEXT,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dossier_documents TO authenticated;
GRANT ALL ON public.dossier_documents TO service_role;
ALTER TABLE public.dossier_documents ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for brevity, assuming standard project visibility)
CREATE POLICY "Project members can view canvases" ON public.lean_ux_canvases FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.du_an WHERE id = project_id));
CREATE POLICY "Project members can view pitches" ON public.pitches FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.du_an WHERE id = project_id));
CREATE POLICY "Project members can view cycles" ON public.cycles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.du_an WHERE id = project_id));
CREATE POLICY "Project members can view dossiers" ON public.project_dossiers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.du_an WHERE id = project_id));
CREATE POLICY "Project members can view documents" ON public.dossier_documents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.project_dossiers d JOIN public.du_an p ON d.project_id = p.id WHERE d.id = dossier_id));

