-- ============================================================================
-- RLS cross-unit verification (read + write) for MIRATS
-- Runs as a bypassrls role but evaluates the ACTUAL deployed policy predicates
-- (pg_policies.qual / with_check) with auth.uid() replaced by each persona uuid.
-- This faithfully reproduces what Postgres RLS would allow/deny per user.
--
-- Personas (see docs/SECURITY_MATRIX.md):
--   admin      3e4602f3-a947-4fe0-81c3-bf16bf3a5da7  (role admin, no unit)
--   phong_kt   e5bdd96e-7b1e-4848-80e0-3ed50943662f  (role phong_kt, no unit)
--   ql_A       7fd569de-c6c5-4040-8758-9c88767bcaec  (phu_trach_dv, unit CLA)
--   nv_A       89dc7793-8373-47db-94c0-89d721efd107  (ktv, unit CLA)
--   nv_B       9c6365a2-8fbd-41da-9b11-b065bf49378a  (ktv, unit PLK)
--   locked     a11c0000-0000-4000-8000-0000000000aa  (ktv, unit CLA, active=false)
--   anon       NULL                                   (unauthenticated)
--
-- Fixtures: RLSTEST devices/records A (unit CLA) and B (unit PLK).
-- Exit: RAISES an exception (non-zero) if any assertion FAILs.
-- ============================================================================
\set ON_ERROR_STOP on

DO $$
DECLARE
  r_pass int := 0;
  r_fail int := 0;
  msg text;

  -- personas as (label, uid-literal-or-NULL)
  personas text[][] := ARRAY[
    ARRAY['admin',   '3e4602f3-a947-4fe0-81c3-bf16bf3a5da7'],
    ARRAY['phong_kt','e5bdd96e-7b1e-4848-80e0-3ed50943662f'],
    ARRAY['ql_A',    '7fd569de-c6c5-4040-8758-9c88767bcaec'],
    ARRAY['nv_A',    '89dc7793-8373-47db-94c0-89d721efd107'],
    ARRAY['nv_B',    '9c6365a2-8fbd-41da-9b11-b065bf49378a'],
    ARRAY['locked',  'a11c0000-0000-4000-8000-0000000000aa'],
    ARRAY['anon',    NULL]
  ];

  -- expected SELECT visibility of the A-row (unit CLA) per persona, in persona order
  exp_read_A bool[] := ARRAY[true, true, true, true, false, false, false];
  -- expected SELECT visibility of the B-row (unit PLK) per persona
  exp_read_B bool[] := ARRAY[true, true, false, false, true, false, false];

  -- tables with device-linked snapshot/unit scoping (same pattern as their device)
  read_tables text[][] := ARRAY[
    ARRAY['thiet_bi',                'a11c0000-0000-4000-8000-0000000000a1','a11c0000-0000-4000-8000-0000000000b1'],
    ARRAY['su_co',                   'a11c0000-0000-4000-8000-00000000c0a1','a11c0000-0000-4000-8000-00000000c0b1'],
    ARRAY['bao_tri',                 'a11c0000-0000-4000-8000-00000000d0a1','a11c0000-0000-4000-8000-00000000d0b1'],
    ARRAY['hong_hoc',                'a11c0000-0000-4000-8000-00000000e0a1','a11c0000-0000-4000-8000-00000000e0b1'],
    ARRAY['kho',                     'a11c0000-0000-4000-8000-00000000f0a1','a11c0000-0000-4000-8000-00000000f0b1'],
    ARRAY['kho_giao_dich',           'a11c0000-0000-4000-8000-00000000a0a1','a11c0000-0000-4000-8000-00000000a0b1'],
    ARRAY['thiet_bi_tep_dinh_kem',   'a11c0000-0000-4000-8000-00000000b0a1','a11c0000-0000-4000-8000-00000000b0b1']
  ];

  p text[]; t text[];
  uid text; lbl text; tbl text; rowA text; rowB text;
  qual_or text; got bool; expA bool; expB bool; i int;

  -- write personas: expected manager-only write (can_manage_equipment)
  exp_mgr bool[] := ARRAY[true, true, false, false, false, false, false];
BEGIN
  RAISE NOTICE '===== RLS CROSS-UNIT TESTS =====';

  -- ---------- READ (SELECT) ----------
  FOREACH t SLICE 1 IN ARRAY read_tables LOOP
    tbl := t[1]; rowA := t[2]; rowB := t[3];
    -- OR of all permissive SELECT policy predicates for this table
    SELECT string_agg('('||replace(pol.qual, 'auth.uid()', '__UID__')||')', ' OR ')
      INTO qual_or
      FROM pg_policies pol
      WHERE pol.schemaname='public' AND pol.tablename=tbl
        AND pol.cmd IN ('SELECT','ALL') AND pol.qual IS NOT NULL
        AND pol.permissive='PERMISSIVE';
    IF qual_or IS NULL THEN
      RAISE EXCEPTION 'no SELECT policy found for %', tbl;
    END IF;

    i := 1;
    FOREACH p SLICE 1 IN ARRAY personas LOOP
      lbl := p[1]; uid := p[2];
      expA := exp_read_A[i]; expB := exp_read_B[i];

      -- A row
      EXECUTE format(
        'SELECT EXISTS(SELECT 1 FROM public.%1$I WHERE %1$I.id=%2$L AND (%3$s))',
        tbl, rowA,
        replace(qual_or, '__UID__', CASE WHEN uid IS NULL THEN 'NULL::uuid' ELSE quote_literal(uid)||'::uuid' END)
      ) INTO got;
      IF got IS DISTINCT FROM expA THEN
        r_fail := r_fail+1; RAISE WARNING 'FAIL read % / %(A CLA): got=% expected=%', tbl, lbl, got, expA;
      ELSE r_pass := r_pass+1; END IF;

      -- B row
      EXECUTE format(
        'SELECT EXISTS(SELECT 1 FROM public.%1$I WHERE %1$I.id=%2$L AND (%3$s))',
        tbl, rowB,
        replace(qual_or, '__UID__', CASE WHEN uid IS NULL THEN 'NULL::uuid' ELSE quote_literal(uid)||'::uuid' END)
      ) INTO got;
      IF got IS DISTINCT FROM expB THEN
        r_fail := r_fail+1; RAISE WARNING 'FAIL read % / %(B PLK): got=% expected=%', tbl, lbl, got, expB;
      ELSE r_pass := r_pass+1; END IF;

      i := i+1;
    END LOOP;
  END LOOP;

  -- ---------- WRITE (WITH CHECK) : manager-only tables ----------
  -- thiet_bi, bao_tri, hong_hoc, kho, kho_giao_dich, thiet_bi_tep_dinh_kem -> can_manage_equipment
  DECLARE
    mgr_tables text[] := ARRAY['thiet_bi','bao_tri','hong_hoc','kho','kho_giao_dich','thiet_bi_tep_dinh_kem'];
    mt text;
  BEGIN
    FOREACH mt IN ARRAY mgr_tables LOOP
      i := 1;
      FOREACH p SLICE 1 IN ARRAY personas LOOP
        lbl := p[1]; uid := p[2];
        got := (CASE WHEN uid IS NULL THEN false
                     ELSE (SELECT public.can_manage_equipment(uid::uuid)) END);
        IF got IS DISTINCT FROM exp_mgr[i] THEN
          r_fail := r_fail+1; RAISE WARNING 'FAIL write % / %: got=% expected=%', mt, lbl, got, exp_mgr[i];
        ELSE r_pass := r_pass+1; END IF;
        i := i+1;
      END LOOP;
    END LOOP;
  END;

  -- ---------- WRITE su_co owner-insert : active + can_view device ----------
  -- Expected INSERT allowed on su_co for dev_A (CLA): admin,phong_kt (mgr) + ql_A,nv_A (can_view A). Others no.
  DECLARE
    exp_scA bool[] := ARRAY[true, true, true, true, false, false, false];
    exp_scB bool[] := ARRAY[true, true, false, false, true, false, false];
    devA constant uuid := 'a11c0000-0000-4000-8000-0000000000a1';
    devB constant uuid := 'a11c0000-0000-4000-8000-0000000000b1';
  BEGIN
    i := 1;
    FOREACH p SLICE 1 IN ARRAY personas LOOP
      lbl := p[1]; uid := p[2];
      -- dev A
      got := (CASE WHEN uid IS NULL THEN false ELSE (
        SELECT public.can_manage_equipment(uid::uuid)
            OR (public.is_active_user(uid::uuid) AND public.can_view_thiet_bi(devA, uid::uuid))
      ) END);
      IF got IS DISTINCT FROM exp_scA[i] THEN
        r_fail := r_fail+1; RAISE WARNING 'FAIL su_co-insert dev_A / %: got=% expected=%', lbl, got, exp_scA[i];
      ELSE r_pass := r_pass+1; END IF;
      -- dev B
      got := (CASE WHEN uid IS NULL THEN false ELSE (
        SELECT public.can_manage_equipment(uid::uuid)
            OR (public.is_active_user(uid::uuid) AND public.can_view_thiet_bi(devB, uid::uuid))
      ) END);
      IF got IS DISTINCT FROM exp_scB[i] THEN
        r_fail := r_fail+1; RAISE WARNING 'FAIL su_co-insert dev_B / %: got=% expected=%', lbl, got, exp_scB[i];
      ELSE r_pass := r_pass+1; END IF;
      i := i+1;
    END LOOP;
  END;

  -- ---------- READ: unassigned device must NOT leak to no-unit users ----------
  -- DEV_C has both unit columns NULL. Only managers may view it.
  -- readonly (active, no unit) and unit-users must be denied (guards NULL=NULL match).
  DECLARE
    devC constant uuid := 'a11c0000-0000-4000-8000-0000000000c1';
    leak_personas text[][] := ARRAY[
      ARRAY['admin',    '3e4602f3-a947-4fe0-81c3-bf16bf3a5da7'],
      ARRAY['phong_kt', 'e5bdd96e-7b1e-4848-80e0-3ed50943662f'],
      ARRAY['readonly', 'f92efa92-d4f7-4a5e-b0f1-48cfdef935d4'],
      ARRAY['nv_B',     '9c6365a2-8fbd-41da-9b11-b065bf49378a'],
      ARRAY['locked',   'a11c0000-0000-4000-8000-0000000000aa']
    ];
    exp_leak bool[] := ARRAY[true, true, false, false, false];
  BEGIN
    i := 1;
    FOREACH p SLICE 1 IN ARRAY leak_personas LOOP
      lbl := p[1]; uid := p[2];
      -- mirror policy gating: is_active_user AND (manager OR unit match)
      got := public.is_active_user(uid::uuid) AND public.can_view_thiet_bi(devC, uid::uuid);
      IF got IS DISTINCT FROM exp_leak[i] THEN
        r_fail := r_fail+1; RAISE WARNING 'FAIL null-unit-leak can_view DEV_C / %: got=% expected=%', lbl, got, exp_leak[i];
      ELSE r_pass := r_pass+1; END IF;
      i := i+1;
    END LOOP;
  END;



  RAISE NOTICE '===== RESULT: % passed, % failed =====', r_pass, r_fail;
  IF r_fail > 0 THEN
    RAISE EXCEPTION 'RLS cross-unit tests FAILED: % failures', r_fail;
  END IF;
END $$;
