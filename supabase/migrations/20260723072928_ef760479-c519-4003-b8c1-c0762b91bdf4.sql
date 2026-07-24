-- Fix FK referential check for he_thong_thanh_phan -> dm_he_thong.
-- The runtime owner role needs UPDATE privilege on the referenced table so
-- PostgreSQL can acquire FOR KEY SHARE during the FK check.
GRANT UPDATE ON TABLE public.dm_he_thong TO sandbox_exec;

-- Keep the existing explicit Data API reachability intact for app users/service role.
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLE public.dm_he_thong TO authenticated;
GRANT ALL ON TABLE public.dm_he_thong TO service_role;

-- Future-proof the specific child table as well.
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER ON TABLE public.he_thong_thanh_phan TO authenticated;
GRANT ALL ON TABLE public.he_thong_thanh_phan TO service_role;