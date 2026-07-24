create or replace function public.rpc_incident_heatmap(
  _from timestamptz default (now() - interval '90 days'),
  _to   timestamptz default now()
)
returns table(
  dow int,
  hour int,
  so_su_co int
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    extract(dow  from s.at_bao_cao at time zone 'Asia/Ho_Chi_Minh')::int as dow,
    extract(hour from s.at_bao_cao at time zone 'Asia/Ho_Chi_Minh')::int as hour,
    count(*)::int as so_su_co
  from public.su_co s
  where s.at_bao_cao is not null
    and s.at_bao_cao >= _from
    and s.at_bao_cao <  _to
  group by 1, 2
  order by 1, 2;
$$;

grant execute on function public.rpc_incident_heatmap(timestamptz, timestamptz) to authenticated;