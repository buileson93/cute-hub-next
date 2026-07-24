-- Gộp "Số model" (so_model) và "P/N" (p_n) trong dm_model thành một trường P/N duy nhất.
UPDATE public.dm_model
SET p_n = so_model
WHERE (p_n IS NULL OR btrim(p_n) = '') AND so_model IS NOT NULL AND btrim(so_model) <> '';

ALTER TABLE public.dm_model DROP COLUMN IF EXISTS so_model;