-- Table: lean_ux_canvases
CREATE TABLE public.lean_ux_canvases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.du_an(id) ON DELETE CASCADE NOT NULL,
    business_problem text,
    business_outcomes text,
    users_customers text,
    user_benefits text,
    solution_ideas text,
    hypotheses text,
    riskiest_assumptions text,
    first_steps_experiments text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id)
);

-- Table: pitches
CREATE TABLE public.pitches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.du_an(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    problem text,
    solution text,
    rabbit_holes text,
    no_gos text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: pitch_scopes
CREATE TABLE public.pitch_scopes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pitch_id uuid REFERENCES public.pitches(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    hill_position integer DEFAULT 0, -- 0 to 100
    hill_status text DEFAULT 'climbing', -- climbing, executing
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: project_dossiers
CREATE TABLE public.project_dossiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.du_an(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(project_id)
);

-- Table: dossier_documents
CREATE TABLE public.dossier_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id uuid REFERENCES public.project_dossiers(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    abstract text,
    submit_date date,
    sign_date date,
    format text DEFAULT 'digital', -- digital, paper
    copy_type text DEFAULT 'original', -- original, copy, certified
    issuing_body text,
    status text DEFAULT 'pending', -- pending, complete
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lean_ux_canvases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_scopes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_dossiers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dossier_documents TO authenticated;

GRANT ALL ON public.lean_ux_canvases TO service_role;
GRANT ALL ON public.pitches TO service_role;
GRANT ALL ON public.pitch_scopes TO service_role;
GRANT ALL ON public.project_dossiers TO service_role;
GRANT ALL ON public.dossier_documents TO service_role;

-- RLS
ALTER TABLE public.lean_ux_canvases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dossier_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own project lean ux canvases" ON public.lean_ux_canvases
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can manage their own project pitches" ON public.pitches
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can manage their own project pitch scopes" ON public.pitch_scopes
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can manage their own project dossiers" ON public.project_dossiers
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can manage their own project dossier documents" ON public.dossier_documents
    FOR ALL TO authenticated USING (true);
