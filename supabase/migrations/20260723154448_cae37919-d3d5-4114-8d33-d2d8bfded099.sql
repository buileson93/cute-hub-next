create or replace function public.rpc_reliability_trend(
  _from timestamptz default (now() - interval '90 days'),
  _to   timestamptz default now(),
  _bucket text default 'day'
)
returns table(
  bucket_start timestamptz,
  so_su_co int,
  so_dong int,
  mttr_phut numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with base as (
    select
      date_trunc(
        case lower(_bucket)
          when 'week' then 'week'
          when 'month' then 'month'
          else 'day'
        end,
        s.at_bao_cao
      ) as bucket_start,
      s.at_bao_cao,
      s.at_hoan_thanh
    from public.su_co s
    where s.at_bao_cao is not null
      and s.at_bao_cao >= _from
      and s.at_bao_cao <  _to
  )
  select
    b.bucket_start,
    count(*)::int as so_su_co,
    count(b.at_hoan_thanh)::int as so_dong,
    round(
      avg(extract(epoch from (b.at_hoan_thanh - b.at_bao_cao)) / 60.0)
        filter (where b.at_hoan_thanh is not null and b.at_hoan_thanh > b.at_bao_cao)
      ::numeric, 1
    ) as mttr_phut
  from base b
  group by b.bucket_start
  order by b.bucket_start;
$$;

grant execute on function public.rpc_reliability_trend(timestamptz, timestamptz, text) to authenticated;