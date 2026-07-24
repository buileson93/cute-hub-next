
create or replace function public.rpc_reliability_by_system(
  _from timestamptz default (now() - interval '90 days'),
  _to   timestamptz default now()
)
returns table(
  he_thong_id uuid,
  ma text,
  ten text,
  so_su_co int,
  so_dong int,
  mttr_phut numeric,
  mtbf_gio numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with base as (
    select
      s.he_thong_id,
      s.at_bao_cao,
      s.at_hoan_thanh
    from public.su_co s
    where s.at_bao_cao is not null
      and s.at_bao_cao >= _from
      and s.at_bao_cao <  _to
      and s.he_thong_id is not null
  ),
  agg as (
    select
      b.he_thong_id,
      count(*)::int as so_su_co,
      count(b.at_hoan_thanh)::int as so_dong,
      avg(extract(epoch from (b.at_hoan_thanh - b.at_bao_cao)) / 60.0)
        filter (where b.at_hoan_thanh is not null and b.at_hoan_thanh > b.at_bao_cao) as mttr_phut
    from base b
    group by b.he_thong_id
  )
  select
    a.he_thong_id,
    h.ma,
    h.ten,
    a.so_su_co,
    a.so_dong,
    round(a.mttr_phut::numeric, 1) as mttr_phut,
    case
      when a.so_su_co > 0 then
        round((extract(epoch from (_to - _from)) / 3600.0 / a.so_su_co)::numeric, 1)
      else null
    end as mtbf_gio
  from agg a
  left join public.dm_he_thong h on h.id = a.he_thong_id
  order by a.so_su_co desc, h.ten;
$$;

grant execute on function public.rpc_reliability_by_system(timestamptz, timestamptz) to authenticated;
