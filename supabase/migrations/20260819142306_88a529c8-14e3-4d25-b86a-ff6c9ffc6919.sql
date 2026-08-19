-- Migration: OCR Shared Artifacts & Runtime Metrics
-- 1. ocr_artifact table
CREATE TABLE IF NOT EXISTS public.ocr_artifact (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_hash text NOT NULL,
    ocr_version text NOT NULL,
    language text NOT NULL,
    provider_id text NOT NULL,
    provider_version text NOT NULL,
    model_id text,
    model_checksum text,
    preprocessing_profile text NOT NULL,
    page_count integer,
    pages jsonb DEFAULT '[]'::jsonb,
    full_text text,
    normalized_text text,
    average_confidence numeric,
    technical_token_accuracy numeric,
    quality_score numeric,
    status text NOT NULL CHECK (status IN ('completed', 'partial', 'rejected', 'superseded')),
    verified_level text NOT NULL DEFAULT 'automatic' CHECK (verified_level IN ('automatic', 'sampled', 'human_reviewed')),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(file_hash, ocr_version, language, provider_id, provider_version, model_checksum, preprocessing_profile)
);

-- 2. tai_lieu_ocr_link table
CREATE TABLE IF NOT EXISTS public.tai_lieu_ocr_link (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type text NOT NULL CHECK (source_type IN ('model_tai_lieu', 'thiet_bi_tep_dinh_kem')),
    source_id uuid NOT NULL,
    artifact_id uuid REFERENCES public.ocr_artifact(id) ON DELETE CASCADE,
    active boolean DEFAULT true,
    linked_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(source_type, source_id, artifact_id)
);

-- 3. ocr_runtime_profile_stats table
CREATE TABLE IF NOT EXISTS public.ocr_runtime_profile_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_bucket text NOT NULL, -- grouped capabilities
    provider_id text NOT NULL,
    provider_version text NOT NULL,
    model_checksum text,
    quality_profile text NOT NULL,
    page_class text, -- simple, technical, noisy
    sample_count integer DEFAULT 1,
    avg_duration_ms numeric,
    p50_duration_ms numeric,
    p95_duration_ms numeric,
    avg_confidence numeric,
    success_rate numeric,
    fallback_rate numeric,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(profile_bucket, provider_id, provider_version, model_checksum, quality_profile, page_class)
);

-- Grants
GRANT SELECT ON public.ocr_artifact TO authenticated;
GRANT INSERT, UPDATE ON public.ocr_artifact TO authenticated;
GRANT ALL ON public.ocr_artifact TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tai_lieu_ocr_link TO authenticated;
GRANT ALL ON public.tai_lieu_ocr_link TO service_role;

GRANT SELECT ON public.ocr_runtime_profile_stats TO authenticated;
GRANT INSERT, UPDATE ON public.ocr_runtime_profile_stats TO authenticated;
GRANT ALL ON public.ocr_runtime_profile_stats TO service_role;

-- RLS
ALTER TABLE public.ocr_artifact ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tai_lieu_ocr_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocr_runtime_profile_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Read artifact via link"
ON public.ocr_artifact
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tai_lieu_ocr_link l
        WHERE l.artifact_id = id
        AND (
            (l.source_type = 'model_tai_lieu' AND EXISTS (SELECT 1 FROM public.model_tai_lieu m WHERE m.id = l.source_id))
            OR
            (l.source_type = 'thiet_bi_tep_dinh_kem' AND EXISTS (SELECT 1 FROM public.thiet_bi_tep_dinh_kem t WHERE t.id = l.source_id))
        )
    )
);

CREATE POLICY "Manage link if can read source"
ON public.tai_lieu_ocr_link
FOR ALL
TO authenticated
USING (
    (source_type = 'model_tai_lieu' AND EXISTS (SELECT 1 FROM public.model_tai_lieu m WHERE m.id = source_id))
    OR
    (source_type = 'thiet_bi_tep_dinh_kem' AND EXISTS (SELECT 1 FROM public.thiet_bi_tep_dinh_kem t WHERE t.id = source_id))
);

CREATE POLICY "Read anonymized stats"
ON public.ocr_runtime_profile_stats
FOR SELECT
TO authenticated
USING (true);

-- 4. RPCs
CREATE OR REPLACE FUNCTION public.find_reusable_ocr_artifact(
    p_source_type text,
    p_source_id uuid,
    p_file_hash text,
    p_ocr_version text,
    p_language text
)
RETURNS SETOF public.ocr_artifact
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_source_type = 'model_tai_lieu' THEN
        IF NOT EXISTS (SELECT 1 FROM public.model_tai_lieu WHERE id = p_source_id) THEN
            RETURN;
        END IF;
    ELSIF p_source_type = 'thiet_bi_tep_dinh_kem' THEN
        IF NOT EXISTS (SELECT 1 FROM public.thiet_bi_tep_dinh_kem WHERE id = p_source_id) THEN
            RETURN;
        END IF;
    ELSE
        RETURN;
    END IF;

    RETURN QUERY
    SELECT a.*
    FROM public.ocr_artifact a
    WHERE a.file_hash = p_file_hash
      AND a.ocr_version = p_ocr_version
      AND a.language = p_language
      AND a.status IN ('completed', 'partial')
    ORDER BY 
        CASE WHEN a.verified_level = 'human_reviewed' THEN 0 ELSE 1 END,
        a.technical_token_accuracy DESC NULLS LAST,
        a.quality_score DESC NULLS LAST,
        a.average_confidence DESC NULLS LAST
    LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_ocr_artifact(
    p_source_type text,
    p_source_id uuid,
    p_artifact_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_artifact_id uuid;
    v_file_hash text;
    v_ocr_version text;
    v_language text;
    v_provider_id text;
    v_provider_version text;
    v_model_checksum text;
    v_preprocessing_profile text;
BEGIN
    IF p_source_type = 'model_tai_lieu' THEN
        IF NOT EXISTS (SELECT 1 FROM public.model_tai_lieu WHERE id = p_source_id) THEN
            RAISE EXCEPTION 'Access Denied';
        END IF;
    ELSIF p_source_type = 'thiet_bi_tep_dinh_kem' THEN
        IF NOT EXISTS (SELECT 1 FROM public.thiet_bi_tep_dinh_kem WHERE id = p_source_id) THEN
            RAISE EXCEPTION 'Access Denied';
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid source type';
    END IF;

    v_file_hash := p_artifact_data->>'file_hash';
    v_ocr_version := p_artifact_data->>'ocr_version';
    v_language := p_artifact_data->>'language';
    v_provider_id := p_artifact_data->>'provider_id';
    v_provider_version := p_artifact_data->>'provider_version';
    v_model_checksum := p_artifact_data->>'model_checksum';
    v_preprocessing_profile := p_artifact_data->>'preprocessing_profile';

    INSERT INTO public.ocr_artifact (
        file_hash, ocr_version, language, provider_id, provider_version,
        model_id, model_checksum, preprocessing_profile, page_count, pages,
        full_text, normalized_text, average_confidence, technical_token_accuracy,
        quality_score, status, verified_level, created_by
    )
    VALUES (
        v_file_hash, v_ocr_version, v_language, v_provider_id, v_provider_version,
        p_artifact_data->>'model_id', v_model_checksum, v_preprocessing_profile,
        (p_artifact_data->>'page_count')::integer, p_artifact_data->'pages',
        p_artifact_data->>'full_text', p_artifact_data->>'normalized_text',
        (p_artifact_data->>'average_confidence')::numeric,
        (p_artifact_data->>'technical_token_accuracy')::numeric,
        (p_artifact_data->>'quality_score')::numeric,
        p_artifact_data->>'status',
        COALESCE(p_artifact_data->>'verified_level', 'automatic'),
        auth.uid()
    )
    ON CONFLICT (file_hash, ocr_version, language, provider_id, provider_version, model_checksum, preprocessing_profile)
    DO UPDATE SET
        pages = EXCLUDED.pages,
        full_text = EXCLUDED.full_text,
        normalized_text = EXCLUDED.normalized_text,
        average_confidence = EXCLUDED.average_confidence,
        technical_token_accuracy = EXCLUDED.technical_token_accuracy,
        quality_score = EXCLUDED.quality_score,
        status = EXCLUDED.status,
        updated_at = now()
    RETURNING id INTO v_artifact_id;

    INSERT INTO public.tai_lieu_ocr_link (source_type, source_id, artifact_id, linked_by)
    VALUES (p_source_type, p_source_id, v_artifact_id, auth.uid())
    ON CONFLICT (source_type, source_id, artifact_id) DO NOTHING;

    RETURN v_artifact_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.report_ocr_runtime_metric(
    p_metric_data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_bucket text;
    v_provider_id text;
    v_provider_version text;
    v_model_checksum text;
    v_quality_profile text;
    v_page_class text;
    v_duration numeric;
    v_confidence numeric;
BEGIN
    v_profile_bucket := p_metric_data->>'profile_bucket';
    v_provider_id := p_metric_data->>'provider_id';
    v_provider_version := p_metric_data->>'provider_version';
    v_model_checksum := p_metric_data->>'model_checksum';
    v_quality_profile := p_metric_data->>'quality_profile';
    v_page_class := p_metric_data->>'page_class';
    v_duration := (p_metric_data->>'duration_ms')::numeric;
    v_confidence := (p_metric_data->>'confidence')::numeric;

    INSERT INTO public.ocr_runtime_profile_stats (
        profile_bucket, provider_id, provider_version, model_checksum, 
        quality_profile, page_class, avg_duration_ms, avg_confidence, sample_count
    )
    VALUES (
        v_profile_bucket, v_provider_id, v_provider_version, v_model_checksum,
        v_quality_profile, v_page_class, v_duration, v_confidence, 1
    )
    ON CONFLICT (profile_bucket, provider_id, provider_version, model_checksum, quality_profile, page_class)
    DO UPDATE SET
        avg_duration_ms = (ocr_runtime_profile_stats.avg_duration_ms * ocr_runtime_profile_stats.sample_count + EXCLUDED.avg_duration_ms) / (ocr_runtime_profile_stats.sample_count + 1),
        avg_confidence = (ocr_runtime_profile_stats.avg_confidence * ocr_runtime_profile_stats.sample_count + EXCLUDED.avg_confidence) / (ocr_runtime_profile_stats.sample_count + 1),
        sample_count = ocr_runtime_profile_stats.sample_count + 1,
        updated_at = now();
END;
$$;