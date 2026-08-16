// ============================================================================
// Nhật ký LẮP / THÁO tài sản — dòng thời gian đầy đủ mọi thao tác trên
// gan_chuc_nang: ai làm, thời điểm, tài sản nào, vị trí nào, trước–sau (thiết
// bị cũ tại vị trí đó → tài sản mới), kèm liên kết mở tài sản / hệ thống.
// ============================================================================
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, ArrowRightLeft, ExternalLink, HardDrive, History,
  Loader2, Plug, RefreshCw, Search, ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/mirats/app-shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/backend/client";

export const Route = createFileRoute("/admin/audit/lap-thao")({
  head: () => ({
    meta: [
      { title: "Nhật ký lắp / tháo tài sản — MIRATS 2.0" },
      { name: "description", content: "Nhật ký thao tác lắp / tháo / thay thế tài sản vào vị trí chức năng." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: LapThaoAuditPage,
});

// Một dòng gán trong gan_chuc_nang (kể cả đã đóng).
type GanRow = {
  id: string;
  thanh_phan_id: string;
  thiet_bi_id: string;
  tu_ngay: string;
  den_ngay: string | null;
  ly_do: string;
  ghi_chu: string | null;
  nguoi_thuc_hien: string | null;
  thiet_bi: {
    ma_thiet_bi: string;
    ten_thiet_bi: string | null;
    ma_serial: string | null;
  } | null;
  he_thong_thanh_phan: {
    id: string;
    ma_thanh_phan: string | null;
    ten: string;
    he_thong_id: string;
    dm_he_thong: { id: string; ten: string; ma_he_thong: string | null } | null;
  } | null;
};

type ProfileLite = { id: string; email: string | null; ho_ten: string | null };

/** Sự kiện được suy ra từ 1 dòng gan_chuc_nang — có thể là "lắp" hoặc "tháo". */
type Event = {
  kind: "lap" | "thao";
  at: string; // ISO
  actor: string | null;
  ganRow: GanRow;
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit",
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}
function dayKey(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

function LapThaoAuditPage() {
  const nav = useNavigate();
  const { loading, session, profile, hasRole } = useSession();
  const canView = hasRole("admin") || hasRole("phong_kt");

  useEffect(() => {
    if (loading) return;
    if (!session) nav({ to: "/auth", replace: true });
    else if (profile && !profile.active) nav({ to: "/pending", replace: true });
  }, [loading, session, profile, nav]);

  const [q, setQ] = useState("");
  const [heThongFilter, setHeThongFilter] = useState<string>("__all__");
  const [kindFilter, setKindFilter] = useState<"__all__" | "lap" | "thao">("__all__");
  const [limit, setLimit] = useState<number>(200);

  const dataQ = useQuery({
    enabled: !!session && canView,
    queryKey: ["audit_lap_thao", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gan_chuc_nang")
        .select(
          "id, thanh_phan_id, thiet_bi_id, tu_ngay, den_ngay, ly_do, ghi_chu, nguoi_thuc_hien," +
          " thiet_bi:thiet_bi_id(ma_thiet_bi, ten_thiet_bi, ma_serial)," +
          " he_thong_thanh_phan:thanh_phan_id(id, ma_thanh_phan, ten, he_thong_id, dm_he_thong:he_thong_id(id, ten, ma_he_thong))"
        )
        .order("tu_ngay", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as GanRow[];
    },
    refetchOnWindowFocus: false,
  });

  // Tra cứu nhanh: dòng liền kề trước dòng hiện tại tại cùng thanh_phan_id →
  // dùng để hiển thị "tài sản TRƯỚC" khi có sự kiện lắp mới.
  const prevAtPos = useMemo(() => {
    const rows = [...(dataQ.data ?? [])].sort(
      (a, b) => a.tu_ngay.localeCompare(b.tu_ngay),
    );
    const byPos = new Map<string, GanRow[]>();
    for (const r of rows) {
      const arr = byPos.get(r.thanh_phan_id) ?? [];
      arr.push(r);
      byPos.set(r.thanh_phan_id, arr);
    }
    const map = new Map<string, GanRow | null>();
    for (const [, arr] of byPos) {
      for (let i = 0; i < arr.length; i++) map.set(arr[i].id, i > 0 ? arr[i - 1] : null);
    }
    return map;
  }, [dataQ.data]);

  // Nạp tên người thực hiện
  const actorIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of dataQ.data ?? []) if (r.nguoi_thuc_hien) s.add(r.nguoi_thuc_hien);
    return Array.from(s);
  }, [dataQ.data]);
  const profilesQ = useQuery({
    enabled: actorIds.length > 0,
    queryKey: ["audit_lap_thao_actors", actorIds.sort().join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles").select("id,email,ho_ten").in("id", actorIds);
      if (error) throw error;
      return (data ?? []) as ProfileLite[];
    },
    refetchOnWindowFocus: false,
  });
  const actorMap = useMemo(
    () => new Map((profilesQ.data ?? []).map((p) => [p.id, p])),
    [profilesQ.data],
  );

  // Sự kiện: mỗi dòng có 1 "lắp"; nếu đã đóng, thêm 1 "tháo".
  const events: Event[] = useMemo(() => {
    const out: Event[] = [];
    for (const r of dataQ.data ?? []) {
      out.push({ kind: "lap", at: r.tu_ngay, actor: r.nguoi_thuc_hien, ganRow: r });
      if (r.den_ngay) {
        out.push({ kind: "thao", at: r.den_ngay, actor: r.nguoi_thuc_hien, ganRow: r });
      }
    }
    out.sort((a, b) => b.at.localeCompare(a.at));
    return out;
  }, [dataQ.data]);

  const heThongOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of dataQ.data ?? []) {
      const ht = r.he_thong_thanh_phan?.dm_he_thong;
      if (ht) m.set(ht.id, ht.ten);
    }
    return Array.from(m, ([id, ten]) => ({ id, ten })).sort((a, b) => a.ten.localeCompare(b.ten));
  }, [dataQ.data]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return events.filter((e) => {
      if (kindFilter !== "__all__" && e.kind !== kindFilter) return false;
      if (heThongFilter !== "__all__" && e.ganRow.he_thong_thanh_phan?.he_thong_id !== heThongFilter) return false;
      if (!kw) return true;
      const p = e.actor ? actorMap.get(e.actor) : null;
      const hay = [
        e.ganRow.thiet_bi?.ma_thiet_bi, e.ganRow.thiet_bi?.ten_thiet_bi, e.ganRow.thiet_bi?.ma_serial,
        e.ganRow.he_thong_thanh_phan?.ten, e.ganRow.he_thong_thanh_phan?.ma_thanh_phan,
        e.ganRow.he_thong_thanh_phan?.dm_he_thong?.ten,
        e.ganRow.ly_do, e.ganRow.ghi_chu, p?.email, p?.ho_ten,
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(kw);
    });
  }, [events, q, kindFilter, heThongFilter, actorMap]);

  const groups = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of filtered) {
      const k = dayKey(e.at);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  if (loading || !session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> <span className="text-sm">Đang tải…</span>
      </div>
    );
  }

  if (!canView) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Không có quyền
            </CardTitle>
            <CardDescription>Chỉ vai trò <b>admin</b> hoặc <b>phong_kt</b> mới xem được nhật ký này.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Về trang chủ</Link></Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const totalLap = filtered.filter((e) => e.kind === "lap").length;
  const totalThao = filtered.filter((e) => e.kind === "thao").length;

  return (
    <AppShell>
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/admin/audit" className="inline-flex items-center gap-1 hover:text-foreground">
                <ArrowLeft className="h-3 w-3" /> Nhật ký hệ thống
              </Link>
              <span>›</span>
              <span>Lắp / tháo tài sản</span>
            </div>
            <h1 className="text-xl font-semibold sm:text-2xl">Nhật ký lắp / tháo tài sản</h1>
            <p className="text-sm text-muted-foreground">
              Ai lắp/tháo tài sản nào, vào vị trí nào, khi nào — kèm thông tin trước–sau và liên kết mở nhanh.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => dataQ.refetch()} disabled={dataQ.isFetching}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${dataQ.isFetching ? "animate-spin" : ""}`} /> Làm mới
          </Button>
        </div>

        {/* Summary chips */}
        <div className="grid grid-cols-2 gap-2 sm:max-w-md">
          <button
            type="button"
            onClick={() => setKindFilter(kindFilter === "lap" ? "__all__" : "lap")}
            className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors ${kindFilter === "lap" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"}`}
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
              <Plug className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-meta uppercase tracking-wide text-muted-foreground">Sự kiện lắp</div>
              <div className="font-mono text-base font-semibold tabular-nums">{totalLap}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setKindFilter(kindFilter === "thao" ? "__all__" : "thao")}
            className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors ${kindFilter === "thao" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"}`}
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
              <ArrowRightLeft className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-meta uppercase tracking-wide text-muted-foreground">Sự kiện tháo</div>
              <div className="font-mono text-base font-semibold tabular-nums">{totalThao}</div>
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tài sản / vị trí / người thực hiện / ghi chú…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-8 sm:w-96"
            />
          </div>
          <Select value={heThongFilter} onValueChange={setHeThongFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Hệ thống" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tất cả hệ thống</SelectItem>
              {heThongOptions.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.ten}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[100, 200, 500, 1000].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} dòng</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timeline */}
        {dataQ.isLoading ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Đang tải…
          </CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
            Không có thao tác lắp / tháo nào phù hợp.
          </CardContent></Card>
        ) : (
          <div className="space-y-5">
            {groups.map(([day, items]) => (
              <section key={day} className="space-y-2">
                <div className="sticky top-0 z-10 -mx-1 flex items-center gap-2 bg-background/80 px-1 py-1 backdrop-blur">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-meta font-semibold uppercase tracking-wider text-muted-foreground">{day}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-meta text-muted-foreground">{items.length}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2">
                  {items.map((e, idx) => (
                    <EventRow
                      key={`${e.kind}-${e.ganRow.id}-${idx}`}
                      event={e}
                      actor={e.actor ? actorMap.get(e.actor) ?? null : null}
                      prev={e.kind === "lap" ? prevAtPos.get(e.ganRow.id) ?? null : null}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EventRow({
  event, actor, prev,
}: {
  event: Event;
  actor: ProfileLite | null;
  prev: GanRow | null;
}) {
  const { kind, at, ganRow: r } = event;
  const isLap = kind === "lap";
  const dev = r.thiet_bi;
  const tp = r.he_thong_thanh_phan;
  const who = actor?.ho_ten || actor?.email || "Hệ thống";

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border ${isLap
          ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
          : "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"}`}>
          {isLap ? <Plug className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold">{who}</span>
            <span className="text-sm text-muted-foreground">{isLap ? "lắp tài sản" : "tháo tài sản"}</span>
            <Badge variant="outline" className="text-meta uppercase">{r.ly_do}</Badge>
          </div>

          {/* Trước → Sau (chỉ cho sự kiện LẮP; nếu có tài sản đã tồn tại tại vị trí trước đó) */}
          {isLap && prev && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed bg-muted/40 px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">Trước:</span>
              <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
              <Link
                to="/thiet-bi/$maThietBi"
                params={{ maThietBi: prev.thiet_bi?.ma_thiet_bi ?? "" }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                className="font-mono hover:underline"
              >
                {prev.thiet_bi?.ma_thiet_bi}
              </Link>
              <span className="text-muted-foreground truncate">{prev.thiet_bi?.ten_thiet_bi}</span>
              <ArrowRight className="mx-1 h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Sau:</span>
              <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
              {dev && (
                <>
                  <Link
                    to="/thiet-bi/$maThietBi"
                    params={{ maThietBi: dev.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                    className="font-mono hover:underline"
                  >
                    {dev.ma_thiet_bi}
                  </Link>
                  <span className="text-muted-foreground truncate">{dev.ten_thiet_bi}</span>
                </>
              )}
            </div>
          )}

          {/* Thẻ tài sản & vị trí */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="min-w-0 rounded-md border bg-muted/30 p-2 text-xs">
              <div className="mb-1 flex items-center gap-1 text-meta uppercase tracking-wide text-muted-foreground">
                <HardDrive className="h-3 w-3" /> Tài sản
              </div>
              {dev ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    to="/thiet-bi/$maThietBi"
                    params={{ maThietBi: dev.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                    className="font-mono font-medium hover:underline"
                  >
                    {dev.ma_thiet_bi}
                  </Link>
                  <span className="truncate">{dev.ten_thiet_bi}</span>
                  {dev.ma_serial && <Badge variant="outline" className="text-meta">SN {dev.ma_serial}</Badge>}
                  <Link
                    to="/thiet-bi/$maThietBi"
                    params={{ maThietBi: dev.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}
                    className="ml-auto text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : <span className="text-muted-foreground">—</span>}
            </div>
            <div className="min-w-0 rounded-md border bg-muted/30 p-2 text-xs">
              <div className="mb-1 flex items-center gap-1 text-meta uppercase tracking-wide text-muted-foreground">
                <Plug className="h-3 w-3" /> Vị trí · Hệ thống
              </div>
              {tp ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium truncate">{tp.ten}</span>
                  {tp.ma_thanh_phan && <span className="font-mono text-muted-foreground">{tp.ma_thanh_phan}</span>}
                  <span className="text-muted-foreground">·</span>
                  {tp.dm_he_thong ? (
                    <Link
                      to="/he-thong/$id"
                      params={{ id: tp.he_thong_id }}
                      className="text-primary hover:underline"
                    >
                      {tp.dm_he_thong.ten}
                    </Link>
                  ) : "—"}
                </div>
              ) : <span className="text-muted-foreground">—</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-meta text-muted-foreground">
            <span title={new Date(at).toLocaleString("vi-VN")}>
              <History className="mr-1 inline h-3 w-3" /> {fmtTime(at)}
            </span>
            {actor?.email && <span className="font-mono">{actor.email}</span>}
            {r.ghi_chu && <span className="italic">“{r.ghi_chu}”</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
