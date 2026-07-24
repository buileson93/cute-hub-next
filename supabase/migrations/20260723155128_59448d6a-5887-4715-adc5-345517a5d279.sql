create or replace function public.rpc_incident_by_severity(
  _from timestamptz default (now() - interval '90 days'),
  _to   timestamptz default now()
)
returns table(
  muc_do text,
  so_su_co int,
  so_dong int
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(nullif(trim(s.muc_do), ''), '(không rõ)') as muc_do,
    count(*)::int as so_su_co,
    count(s.at_hoan_thanh)::int as so_dong
  from public.su_co s
  where s.at_bao_cao is not null
    and s.at_bao_cao >= _from
    and s.at_bao_cao <  _to
  group by 1
  order by so_su_co desc;
$$;

grant execute on function public.rpc_incident_by_severity(timestamptz, timestamptz) to authenticated;