-- Helper: can the user view records tied to a device (by ma_thiet_bi)?
create or replace function public.can_view_thiet_bi_ma(_ma text, _user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.thiet_bi t
    where t.ma_thiet_bi = _ma
      and (
        public.can_manage_equipment(_user)
        or (t.don_vi_quan_ly_id is not distinct from public.get_user_don_vi_id(_user))
        or (t.don_vi_id is not distinct from public.get_user_don_vi_id(_user))
      )
  )
$$;

revoke all on function public.can_view_thiet_bi_ma(text, uuid) from public, anon;
grant execute on function public.can_view_thiet_bi_ma(text, uuid) to authenticated;

-- bao_tri
drop policy if exists bao_tri_select on public.bao_tri;
create policy bao_tri_select on public.bao_tri
for select to authenticated
using (
  public.is_active_user(auth.uid())
  and (
    public.can_manage_equipment(auth.uid())
    or (thiet_bi is not null and public.can_view_thiet_bi_ma(thiet_bi, auth.uid()))
  )
);

-- su_co
drop policy if exists su_co_select on public.su_co;
create policy su_co_select on public.su_co
for select to authenticated
using (
  public.is_active_user(auth.uid())
  and (
    public.can_manage_equipment(auth.uid())
    or (thiet_bi is not null and public.can_view_thiet_bi_ma(thiet_bi, auth.uid()))
  )
);

-- hong_hoc (device column is thiet_bi_hong)
drop policy if exists hong_hoc_select on public.hong_hoc;
create policy hong_hoc_select on public.hong_hoc
for select to authenticated
using (
  public.is_active_user(auth.uid())
  and (
    public.can_manage_equipment(auth.uid())
    or (thiet_bi_hong is not null and public.can_view_thiet_bi_ma(thiet_bi_hong, auth.uid()))
  )
);

-- ban_giao
drop policy if exists ban_giao_select on public.ban_giao;
create policy ban_giao_select on public.ban_giao
for select to authenticated
using (
  public.is_active_user(auth.uid())
  and (
    public.can_manage_equipment(auth.uid())
    or (thiet_bi is not null and public.can_view_thiet_bi_ma(thiet_bi, auth.uid()))
  )
);

-- form_submission_thiet_bi: enforce the same scope as the parent form_submission
drop policy if exists form_sub_tb_select_by_parent on public.form_submission_thiet_bi;
create policy form_sub_tb_select_by_parent on public.form_submission_thiet_bi
for select to authenticated
using (
  exists (
    select 1
    from public.form_submission s
    where s.id = form_submission_thiet_bi.submission_id
      and public.is_active_user(auth.uid())
      and (
        public.can_manage_equipment(auth.uid())
        or s.created_by = auth.uid()
        or (
          s.status <> 'draft'::form_submission_status
          and s.don_vi_id is not null
          and s.don_vi_id = public.get_user_don_vi_id(auth.uid())
        )
      )
  )
);