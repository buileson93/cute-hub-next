
create or replace function public.run_audit_daily_digest()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from timestamptz := now() - interval '24 hours';
  v_total int;
  v_users int;
  v_top text;
  v_body text;
  v_count int := 0;
  v_admin record;
begin
  select count(*), count(distinct user_id)
    into v_total, v_users
  from public.audit_log
  where created_at >= v_from;

  if v_total = 0 then
    return 0;
  end if;

  select string_agg(entity || ': ' || c, E'\n' order by c desc)
    into v_top
  from (
    select entity, count(*)::int as c
    from public.audit_log
    where created_at >= v_from and entity is not null
    group by entity
    order by count(*) desc
    limit 5
  ) t;

  v_body := format(
    'Trong 24 giờ qua có %s hành động từ %s người dùng.%s%s',
    v_total, v_users,
    case when v_top is not null then E'\n\nTop bảng:\n' else '' end,
    coalesce(v_top, '')
  );

  for v_admin in
    select ur.user_id from public.user_roles ur where ur.role = 'admin'
  loop
    insert into public.notifications(user_id, loai, tieu_de, noi_dung, link, ref_type)
    values (
      v_admin.user_id,
      'he_thong',
      format('Nhật ký 24h: %s hành động', v_total),
      v_body,
      '/admin/audit',
      'audit_digest'
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.run_audit_daily_digest() from public, anon, authenticated;
grant execute on function public.run_audit_daily_digest() to service_role;

-- Huỷ job cũ nếu có, rồi lên lịch mới: 07:00 mỗi ngày
do $$
begin
  perform cron.unschedule('audit_daily_digest');
exception when others then null;
end $$;

select cron.schedule(
  'audit_daily_digest',
  '0 7 * * *',
  $cron$ select public.run_audit_daily_digest(); $cron$
);
