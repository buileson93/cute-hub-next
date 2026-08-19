-- Migration: OCR PDF Platform Foundation
-- Generated at: 20260819123553

-- 1. Create table tai_lieu_ocr
CREATE TABLE IF NOT EXISTS public.tai_lieu_ocr (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type text NOT NULL CHECK (source_type IN ('model_tai_lieu', 'thiet_bi_tep_dinh_kem')),
    source_id uuid NOT NULL,
    file_hash text,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'extracting', 'ocr_running', 'completed', 'partial', 'failed', 'cancelled')),
    page_count integer,
    processed_pages integer DEFAULT 0,
    full_text text,
    normalized_text text,
    pages jsonb DEFAULT '[]'::jsonb,
    language text DEFAULT 'vie+eng',
    average_confidence numeric,
    provider_id text,
    quality_profile text,
    ocr_version text,
    error_code text,
    error_message text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(source_type, source_id)
);

-- 2. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tai_lieu_ocr TO authenticated;
GRANT ALL ON public.tai_lieu_ocr TO service_role;

-- 3. Enable RLS
ALTER TABLE public.tai_lieu_ocr ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- SELECT: Inherit from source document
CREATE POLICY "Select OCR if can read source document"
ON public.tai_lieu_ocr
FOR SELECT
TO authenticated
USING (
    CASE 
        WHEN source_type = 'model_tai_lieu' THEN 
            EXISTS (
                SELECT 1 FROM public.model_tai_lieu m 
                WHERE m.id = source_id
            )
        WHEN source_type = 'thiet_bi_tep_dinh_kem' THEN 
            EXISTS (
                SELECT 1 FROM public.thiet_bi_tep_dinh_kem t 
                WHERE t.id = source_id
            )
        ELSE FALSE
    END
);

-- ALL (Write): Inherit from source document manager
CREATE POLICY "Manage OCR if can manage source document"
ON public.tai_lieu_ocr
FOR ALL
TO authenticated
USING (
    CASE 
        WHEN source_type = 'model_tai_lieu' THEN 
            EXISTS (
                SELECT 1 FROM public.model_tai_lieu m 
                WHERE m.id = source_id
            )
        WHEN source_type = 'thiet_bi_tep_dinh_kem' THEN 
            EXISTS (
                SELECT 1 FROM public.thiet_bi_tep_dinh_kem t 
                WHERE t.id = source_id
            )
        ELSE FALSE
    END
)
WITH CHECK (
    CASE 
        WHEN source_type = 'model_tai_lieu' THEN 
            EXISTS (
                SELECT 1 FROM public.model_tai_lieu m 
                WHERE m.id = source_id
            )
        WHEN source_type = 'thiet_bi_tep_dinh_kem' THEN 
            EXISTS (
                SELECT 1 FROM public.thiet_bi_tep_dinh_kem t 
                WHERE t.id = source_id
            )
        ELSE FALSE
    END
);

-- 5. Cascade Delete Triggers

-- Trigger for model_tai_lieu
CREATE OR REPLACE FUNCTION public.handle_delete_model_tai_lieu_ocr()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.tai_lieu_ocr WHERE source_type = 'model_tai_lieu' AND source_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER trigger_delete_model_tai_lieu_ocr
AFTER DELETE ON public.model_tai_lieu
FOR EACH ROW EXECUTE FUNCTION public.handle_delete_model_tai_lieu_ocr();

-- Trigger for thiet_bi_tep_dinh_kem
CREATE OR REPLACE FUNCTION public.handle_delete_thiet_bi_tep_dinh_kem_ocr()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.tai_lieu_ocr WHERE source_type = 'thiet_bi_tep_dinh_kem' AND source_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER trigger_delete_thiet_bi_tep_dinh_kem_ocr
AFTER DELETE ON public.thiet_bi_tep_dinh_kem
FOR EACH ROW EXECUTE FUNCTION public.handle_delete_thiet_bi_tep_dinh_kem_ocr();

-- 6. Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at_tai_lieu_ocr()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_updated_at_tai_lieu_ocr
BEFORE UPDATE ON public.tai_lieu_ocr
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at_tai_lieu_ocr();