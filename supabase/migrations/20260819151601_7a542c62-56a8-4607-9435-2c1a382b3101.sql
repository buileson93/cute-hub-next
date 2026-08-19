ALTER TABLE public.du_an_su_kien
DROP CONSTRAINT IF EXISTS du_an_su_kien_actor_id_fkey,
ADD CONSTRAINT du_an_su_kien_actor_id_fkey 
FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
ON DELETE SET NULL;
