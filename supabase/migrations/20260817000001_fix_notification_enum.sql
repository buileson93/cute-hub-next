-- Add 'cv_moi' to notification_loai enum if it doesn't exist
-- We use a DO block because ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block in some versions,
-- but standard Supabase migrations handle this.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        JOIN pg_namespace n ON t.typnamespace = n.oid 
        WHERE n.nspname = 'public' 
          AND t.typname = 'notification_loai' 
          AND e.enumlabel = 'cv_moi'
    ) THEN
        ALTER TYPE public.notification_loai ADD VALUE 'cv_moi';
    END IF;
END
$$;

-- Also verify if other missing values from triggers are needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'notification_loai' AND e.enumlabel = 'cv_cap_nhat'
    ) THEN
        ALTER TYPE public.notification_loai ADD VALUE 'cv_cap_nhat';
    END IF;
END
$$;
