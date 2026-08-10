import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, ShieldAlert, Loader2, Search, RefreshCw,
  Plus, Pencil, Trash2, Shield, LogIn, KeyRound, Activity,
  RotateCcw, Download, CalendarDays, ChevronRight, Info, AlertTriangle, XCircle,
} from "lucide-react";
import { AppShell } from "@/components/mirats/app-shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/backend/client";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({
    meta: [
      { title: "Nhật ký hệ thống — MIRATS 2.0" },
      { name: "description", content: "Nhật ký hoạt động và bảo mật cho quản trị viên MIRATS." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminAuditPage,
});

type AuditRow = {
  id: string;
  user_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};

type ProfileLite = { id: string; email: string | null; ho_ten: string | null };

// ============ Human labels ============
const ENTITY_LABEL: Record<string, string> = {
  thiet_bi: "Tài sản",
  giay_phep: "Giấy phép",
  form_template: "Mẫu biểu",
  form_field: "Trường mẫu biểu",
  form_submission: "Phiếu điền",
  profiles: "Tài khoản",
  user_roles: "Phân quyền",
  dm_don_vi: "Đơn vị",
  dm_he_thong: "Hệ thống",
  dm_nhom_he_thong: "Nhóm hệ thống",
  dm_vi_tri: "Vị trí",
  dm_loai_thiet_bi: "Chủng loại",
  dm_loai_giay_phep: "Loại giấy phép",
  dm_nha_cung_cap: "Nhà cung cấp",
  dm_nha_san_xuat: "Nhà sản xuất",
  dm_noi_cap: "Nơi cấp",
  dm_trang_thai_thiet_bi: "Trạng thái tài sản",
  audit_log: "Nhật ký",
};

// Map entity → module page path (best-effort, used for the "trang" filter)
const ENTITY_PAGE: Record<string, { label: string; path: string }> = {
  thiet_bi: { label: "Sổ lý lịch", path: "/so-ly-lich" },
  giay_phep: { label: "Giấy phép", path: "/giay-phep" },
  form_template: { label: "Mẫu biểu", path: "/mau-bieu" },
  form_field: { label: "Mẫu biểu", path: "/mau-bieu" },
  form_submission: { label: "Phiếu điền", path: "/phieu-dien" },
  profiles: { label: "Tài khoản", path: "/admin/phan-quyen" },
  user_roles: { label: "Phân quyền", path: "/admin/phan-quyen" },
  dm_don_vi: { label: "Danh mục", path: "/danh-muc" },
  dm_he_thong: { label: "Hệ thống", path: "/he-thong" },
  dm_nhom_he_thong: { label: "Hệ thống", path: "/he-thong" },
  dm_vi_tri: { label: "Danh mục", path: "/danh-muc" },
  dm_loai_thiet_bi: { label: "Danh mục", path: "/danh-muc" },
  dm_loai_giay_phep: { label: "Danh mục", path: "/danh-muc" },
  dm_nha_cung_cap: { label: "Danh mục", path: "/danh-muc" },
  dm_nha_san_xuat: { label: "Danh mục", path: "/danh-muc" },
  dm_noi_cap: { label: "Danh mục", path: "/danh-muc" },
  dm_trang_thai_thiet_bi: { label: "Danh mục", path: "/danh-muc" },
  audit_log: { label: "Quản trị", path: "/admin/audit" },
};

type Kind = "create" | "update" | "delete" | "security" | "auth" | "other";
const KIND_META: Record<Kind, { label: string; Icon: typeof Plus }> = {
  create:   { label: "Tạo mới",   Icon: Plus },
  update:   { label: "Cập nhật",  Icon: Pencil },
  delete:   { label: "Xoá",       Icon: Trash2 },
  security: { label: "Bảo mật",   Icon: Shield },
  auth:     { label: "Đăng nhập", Icon: LogIn },
  other:    { label: "Khác",      Icon: Activity },
};

type Severity = "info" | "warn" | "error";
const SEVERITY_META: Record<Severity, { label: string; dot: string; text: string; bg: string; border: string; Icon: typeof Info }> = {
  info:  { label: "Info",  dot: "bg-sky-500",    text: "text-sky-700 dark:text-sky-300",      bg: "bg-sky-50 dark:bg-sky-500/10",       border: "border-sky-200 dark:border-sky-500/30",       Icon: Info },
  warn:  { label: "Warn",  dot: "bg-amber-500",  text: "text-amber-700 dark:text-amber-300",  bg: "bg-amber-50 dark:bg-amber-500/10",   border: "border-amber-200 dark:border-amber-500/30",   Icon: AlertTriangle },
  error: { label: "Error", dot: "bg-rose-500",   text: "text-rose-700 dark:text-rose-300",    bg: "bg-rose-50 dark:bg-rose-500/10",     border: "border-rose-200 dark:border-rose-500/30",     Icon: XCircle },
};

const SECURITY_ACTIONS: Record<string, string> = {
  password_reset_requested: "Yêu cầu đặt lại mật khẩu",
  password_reset_completed: "Đã đổi mật khẩu",
  password_reset_captcha_failed: "Sai CAPTCHA khi reset mật khẩu",
  password_reset_rate_limited: "Bị giới hạn tần suất reset mật khẩu",
  password_reset_unknown_email: "Reset mật khẩu — email không tồn tại",
  password_reset_inactive_account: "Reset mật khẩu — tài khoản chưa duyệt",
  password_reset_send_failed: "Gửi email reset thất bại",
};

function describe(row: AuditRow): { kind: Kind; severity: Severity; verb: string; icon: typeof Plus } {
  const a = row.action;
  if (SECURITY_ACTIONS[a]) {
    const isBad = a.includes("failed") || a.includes("captcha") || a.includes("rate_limited") || a.includes("unknown") || a.includes("inactive");
    return {
      kind: isBad ? "security" : "auth",
      severity: isBad ? (a.includes("failed") ? "error" : "warn") : "info",
      verb: SECURITY_ACTIONS[a],
      icon: isBad ? Shield : KeyRound,
    };
  }
  if (a.startsWith("insert_")) return { kind: "create", severity: "info", verb: "Tạo", icon: Plus };
  if (a.startsWith("update_")) return { kind: "update", severity: "info", verb: "Cập nhật", icon: Pencil };
  if (a.startsWith("delete_")) return { kind: "delete", severity: "warn", verb: "Xoá", icon: Trash2 };
  return { kind: "other", severity: "info", verb: a, icon: Activity };
}

function entityLabel(entity: string | null): string {
  if (!entity) return "—";
  return ENTITY_LABEL[entity] ?? entity;
}

function pageLabel(entity: string | null): string {
  if (!entity) return "—";
  return ENTITY_PAGE[entity]?.label ?? "Khác";
}

// Entities that support rollback (must match admin_rollback_audit whitelist)
const ROLLBACK_ENTITY_RE = /^(dm_|thiet_bi|giay_phep|form_|cay_node_edit|so_do|du_an|notifications)/;
const SYSTEM_TABLES = new Set(["audit_log", "profiles", "user_roles"]);

function canRollback(row: AuditRow): boolean {
  const a = row.action;
  const isCud = a.startsWith("insert_") || a.startsWith("update_") || a.startsWith("delete_");
  if (!isCud) return false;
  const e = row.entity;
  if (!e || SYSTEM_TABLES.has(e) || !ROLLBACK_ENTITY_RE.test(e)) return false;
  const d = row.detail ?? {};
  if (a.startsWith("insert_")) return !!(d as Record<string, unknown>).new;
  return !!(d as Record<string, unknown>).old;
}

function fmtVal(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (typeof v === "string") return v.length > 60 ? v.slice(0, 60) + "…" : v;
  if (typeof v === "boolean") return v ? "Có" : "Không";
  if (typeof v === "number") return String(v);
  return JSON.stringify(v);
}

const SKIP_FIELDS = new Set(["id", "created_at", "updated_at", "created_by", "updated_by"]);

function diffChanges(oldObj: unknown, newObj: unknown): Array<{ field: string; from: string; to: string }> {
  if (!oldObj || !newObj || typeof oldObj !== "object" || typeof newObj !== "object") return [];
  const o = oldObj as Record<string, unknown>;
  const n = newObj as Record<string, unknown>;
  const keys = new Set([...Object.keys(o), ...Object.keys(n)]);
  const out: Array<{ field: string; from: string; to: string }> = [];
  for (const k of keys) {
    if (SKIP_FIELDS.has(k)) continue;
    if (JSON.stringify(o[k]) !== JSON.stringify(n[k])) {
      out.push({ field: k, from: fmtVal(o[k]), to: fmtVal(n[k]) });
    }
  }
  return out;
}

function rowLabel(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  const r = obj as Record<string, unknown>;
  const code = r.ma ?? r.ma_thiet_bi ?? r.ma_giay_phep ?? r.code;
  const name = r.ten ?? r.ten_thiet_bi ?? r.mo_ta ?? r.title ?? r.email;
  if (code && name) return `${code} — ${name}`;
  return (code ?? name ?? null) as string | null;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ---------- Time-range presets ----------
type RangePreset = "1h" | "24h" | "7d" | "30d" | "custom";
const RANGE_LABEL: Record<RangePreset, string> = {
  "1h": "1 giờ qua",
  "24h": "24 giờ qua",
  "7d": "7 ngày qua",
  "30d": "30 ngày qua",
  custom: "Tuỳ chọn…",
};
function rangeToIso(preset: RangePreset, fromDate: string, toDate: string): { from?: string; to?: string } {
  if (preset === "custom") {
    return {
      from: fromDate ? new Date(fromDate + "T00:00:00").toISOString() : undefined,
      to: toDate ? new Date(toDate + "T23:59:59.999").toISOString() : undefined,
    };
  }
  const now = Date.now();
  const ms: Record<Exclude<RangePreset, "custom">, number> = {
    "1h": 3600e3, "24h": 86400e3, "7d": 7 * 86400e3, "30d": 30 * 86400e3,
  };
  return { from: new Date(now - ms[preset]).toISOString() };
}

function AdminAuditPage() {
  const nav = useNavigate();
  const { loading, session, profile, hasRole } = useSession();
  const isAdmin = hasRole("admin");
  const canView = isAdmin || hasRole("phong_kt");

  const [q, setQ] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("__all__");
  const [kindFilter, setKindFilter] = useState<string>("__all__");
  const [entityFilter, setEntityFilter] = useState<string>("__all__");
  const [pageFilter, setPageFilter] = useState<string>("__all__");
  const [userFilter, setUserFilter] = useState<string>("__all__");
  const [limit, setLimit] = useState<number>(200);
  const [range, setRange] = useState<RangePreset>("24h");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (loading) return;
    if (!session) nav({ to: "/auth", replace: true });
    else if (profile && !profile.active) nav({ to: "/pending", replace: true });
  }, [loading, session, profile, nav]);

  const iso = useMemo(() => rangeToIso(range, fromDate, toDate), [range, fromDate, toDate]);

  const auditQ = useQuery({
    enabled: !!session && canView,
    queryKey: ["audit_log", limit, iso.from ?? "", iso.to ?? ""],
    queryFn: async () => {
      let qb = supabase
        .from("audit_log")
        .select("id,user_id,action,entity,entity_id,detail,created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (iso.from) qb = qb.gte("created_at", iso.from);
      if (iso.to) qb = qb.lte("created_at", iso.to);
      const { data, error } = await qb;
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
    refetchOnWindowFocus: false,
  });

  const userIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of auditQ.data ?? []) if (r.user_id) s.add(r.user_id);
    return Array.from(s);
  }, [auditQ.data]);

  const profilesQ = useQuery({
    enabled: userIds.length > 0,
    queryKey: ["audit_profiles", userIds.sort().join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email,ho_ten")
        .in("id", userIds);
      if (error) throw error;
      return (data ?? []) as ProfileLite[];
    },
    refetchOnWindowFocus: false,
  });
  const profileMap = useMemo(() => new Map((profilesQ.data ?? []).map((p) => [p.id, p])), [profilesQ.data]);

  const queryClient = useQueryClient();
  const [rollbackTarget, setRollbackTarget] = useState<AuditRow | null>(null);
  const rollbackMut = useMutation({
    mutationFn: async (row: AuditRow) => {
      const { data, error } = await supabase.rpc("admin_rollback_audit", { _audit_id: row.id });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Đã hoàn tác về dữ liệu trước đó");
      setRollbackTarget(null);
      queryClient.invalidateQueries({ queryKey: ["audit_log"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Hoàn tác thất bại");
    },
  });

  const retentionQ = useQuery({
    enabled: !!session && isAdmin,
    queryKey: ["audit_retention"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_audit_retention");
      if (error) throw error;
      return Number(data ?? 365);
    },
    refetchOnWindowFocus: false,
  });
  const [retentionInput, setRetentionInput] = useState<string>("");
  useEffect(() => {
    if (typeof retentionQ.data === "number") setRetentionInput(String(retentionQ.data));
  }, [retentionQ.data]);
  const retentionMut = useMutation({
    mutationFn: async (days: number) => {
      const { data, error } = await supabase.rpc("admin_set_audit_retention", { _days: days });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (d) => {
      toast.success(`Đã lưu: giữ nhật ký ${d} ngày`);
      queryClient.invalidateQueries({ queryKey: ["audit_retention"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Lưu thất bại"),
  });

  const enriched = useMemo(() => {
    return (auditQ.data ?? []).map((r) => {
      const meta = describe(r);
      return { row: r, ...meta };
    });
  }, [auditQ.data]);

  const entityOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of enriched) if (e.row.entity) s.add(e.row.entity);
    return Array.from(s).sort();
  }, [enriched]);

  const pageOptions = useMemo(() => {
    const s = new Set<string>();
    for (const e of enriched) s.add(pageLabel(e.row.entity));
    return Array.from(s).sort();
  }, [enriched]);

  const userOptions = useMemo(() => {
    const rows = (profilesQ.data ?? []).slice();
    rows.sort((a, b) => (a.ho_ten ?? a.email ?? "").localeCompare(b.ho_ten ?? b.email ?? ""));
    return rows;
  }, [profilesQ.data]);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return enriched.filter((e) => {
      if (severityFilter !== "__all__" && e.severity !== severityFilter) return false;
      if (kindFilter !== "__all__" && e.kind !== kindFilter) return false;
      if (entityFilter !== "__all__" && e.row.entity !== entityFilter) return false;
      if (pageFilter !== "__all__" && pageLabel(e.row.entity) !== pageFilter) return false;
      if (userFilter !== "__all__") {
        if (userFilter === "__system__") { if (e.row.user_id) return false; }
        else if (e.row.user_id !== userFilter) return false;
      }
      if (!kw) return true;
      const p = e.row.user_id ? profileMap.get(e.row.user_id) : null;
      const hay = `${e.verb} ${e.row.action} ${e.row.entity ?? ""} ${e.row.entity_id ?? ""} ${p?.email ?? ""} ${p?.ho_ten ?? ""} ${JSON.stringify(e.row.detail ?? {})}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [enriched, q, severityFilter, kindFilter, entityFilter, pageFilter, userFilter, profileMap]);

  const sevCount: Record<Severity, number> = { info: 0, warn: 0, error: 0 };
  for (const e of enriched) sevCount[e.severity]++;

  const exportCsv = () => {
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : typeof v === "string" ? v : JSON.stringify(v);
      return `"${s.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    };
    const header = ["Thoi_diem", "Muc_do", "Nguoi_thuc_hien", "Email", "Trang", "Hanh_dong", "Loai_du_lieu", "Entity_ID", "Chi_tiet"];
    const lines = [header.join(",")];
    for (const e of filtered) {
      const p = e.row.user_id ? profileMap.get(e.row.user_id) : null;
      lines.push([
        esc(fmtTime(e.row.created_at)),
        esc(e.severity),
        esc(p?.ho_ten ?? ""),
        esc(p?.email ?? ""),
        esc(pageLabel(e.row.entity)),
        esc(e.row.action),
        esc(entityLabel(e.row.entity)),
        esc(e.row.entity_id ?? ""),
        esc(e.row.detail ?? {}),
      ].join(","));
    }
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Đã xuất ${filtered.length} dòng`);
  };

  const clearFilters = () => {
    setQ(""); setSeverityFilter("__all__"); setKindFilter("__all__");
    setEntityFilter("__all__"); setPageFilter("__all__"); setUserFilter("__all__");
    setRange("24h"); setFromDate(""); setToDate("");
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
            <CardDescription>Chỉ vai trò <b>admin</b> hoặc <b>phong_kt</b> mới xem được nhật ký hệ thống.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Về trang chủ</Link></Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-3 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold sm:text-2xl">Nhật ký hệ thống</h1>
            <p className="text-sm text-muted-foreground">Ghi nhận hoạt động theo mức độ, người dùng, và trang.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/audit/lap-thao"><Activity className="mr-1.5 h-3.5 w-3.5" /> Lắp / tháo</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Xuất CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => auditQ.refetch()} disabled={auditQ.isFetching}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${auditQ.isFetching ? "animate-spin" : ""}`} /> Làm mới
            </Button>
          </div>
        </div>

        {/* Severity chips */}
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(SEVERITY_META) as Severity[]).map((s) => {
            const m = SEVERITY_META[s];
            const active = severityFilter === s;
            const Icon = m.Icon;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSeverityFilter(active ? "__all__" : s)}
                className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-left transition-colors ${active ? `${m.border} ${m.bg}` : "border-border hover:bg-muted/60"}`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${m.bg} ${m.border} border`}>
                  <Icon className={`h-3.5 w-3.5 ${m.text}`} />
                </span>
                <div className="min-w-0">
                  <div className={`text-[11px] uppercase tracking-wide ${m.text}`}>{m.label}</div>
                  <div className="font-mono text-base font-semibold tabular-nums leading-tight">{sevCount[s]}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Toolbar / filters */}
        <div className="rounded-md border bg-card p-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm người / mã / nội dung…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-8 w-full pl-7 text-xs"
              />
            </div>

            <Select value={range} onValueChange={(v) => setRange(v as RangePreset)}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /><SelectValue /></div>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RANGE_LABEL) as RangePreset[]).map((k) => (
                  <SelectItem key={k} value={k}>{RANGE_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {range === "custom" && (
              <div className="flex items-center gap-1 rounded-md border px-1.5">
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-7 w-[130px] border-0 p-0 text-xs focus-visible:ring-0" aria-label="Từ ngày" />
                <span className="text-xs text-muted-foreground">→</span>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-7 w-[130px] border-0 p-0 text-xs focus-visible:ring-0" aria-label="Đến ngày" />
              </div>
            )}

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="h-8 w-[180px] text-xs"><SelectValue placeholder="Người dùng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả người dùng</SelectItem>
                <SelectItem value="__system__">Hệ thống (không user)</SelectItem>
                {userOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.ho_ten ?? u.email ?? u.id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={pageFilter} onValueChange={setPageFilter}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Trang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả trang</SelectItem>
                {pageOptions.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="h-8 w-[170px] text-xs"><SelectValue placeholder="Loại dữ liệu" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả loại</SelectItem>
                {entityOptions.map((e) => (<SelectItem key={e} value={e}>{entityLabel(e)}</SelectItem>))}
              </SelectContent>
            </Select>

            <Select value={kindFilter} onValueChange={setKindFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Hành động" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Mọi hành động</SelectItem>
                {(Object.keys(KIND_META) as Kind[]).map((k) => (
                  <SelectItem key={k} value={k}>{KIND_META[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
              <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[50, 100, 200, 500, 1000].map((n) => (<SelectItem key={n} value={String(n)}>{n} dòng</SelectItem>))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>Đặt lại</Button>
            <div className="ml-auto text-xs text-muted-foreground">
              {filtered.length}/{enriched.length} bản ghi
            </div>
          </div>
        </div>

        {/* Log table — Supabase-like */}
        <div className="overflow-hidden rounded-md border bg-card">
          <div className="grid grid-cols-[28px_170px_80px_180px_1fr_140px] items-center gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span></span>
            <span>Thời điểm</span>
            <span>Mức độ</span>
            <span>Người dùng</span>
            <span>Sự kiện</span>
            <span>Trang</span>
          </div>

          {auditQ.isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Đang tải…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Không có bản ghi phù hợp.</div>
          ) : (
            <div className="divide-y">
              {filtered.map((e) => (
                <LogRow
                  key={e.row.id}
                  entry={e}
                  profile={e.row.user_id ? profileMap.get(e.row.user_id) : null}
                  expanded={expanded.has(e.row.id)}
                  onToggle={() => toggleExpand(e.row.id)}
                  canRollback={isAdmin && canRollback(e.row)}
                  onRollback={() => setRollbackTarget(e.row)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Retention (admin only) */}
        {isAdmin && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" /> Chính sách lưu trữ nhật ký
              </CardTitle>
              <CardDescription className="text-xs">
                Bản ghi cũ hơn số ngày cấu hình sẽ tự động xoá vào 03:15 mỗi ngày (30–3650 ngày).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Số ngày giữ lại</label>
                <Input
                  type="number"
                  min={30}
                  max={3650}
                  className="h-8 w-32"
                  value={retentionInput}
                  onChange={(e) => setRetentionInput(e.target.value)}
                  disabled={retentionQ.isLoading || retentionMut.isPending}
                />
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const n = Number(retentionInput);
                  if (!Number.isFinite(n) || n < 30 || n > 3650) {
                    toast.error("Nhập số nguyên từ 30 đến 3650");
                    return;
                  }
                  retentionMut.mutate(Math.floor(n));
                }}
                disabled={retentionMut.isPending || retentionQ.isLoading || Number(retentionInput) === retentionQ.data}
              >
                {retentionMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Lưu
              </Button>
              {typeof retentionQ.data === "number" && (
                <span className="text-xs text-muted-foreground">Hiện tại: <b>{retentionQ.data}</b> ngày</span>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!rollbackTarget} onOpenChange={(o) => { if (!o) setRollbackTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hoàn tác</AlertDialogTitle>
            <AlertDialogDescription>
              {rollbackTarget?.action.startsWith("insert_")
                ? "Bản ghi vừa được tạo sẽ bị xoá khỏi cơ sở dữ liệu."
                : rollbackTarget?.action.startsWith("delete_")
                ? "Bản ghi đã xoá sẽ được khôi phục lại với dữ liệu cũ."
                : "Bản ghi sẽ được đưa về đúng giá trị trước khi chỉnh sửa."}
              {" "}Thao tác này cũng được ghi vào nhật ký.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rollbackMut.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              disabled={rollbackMut.isPending}
              onClick={(ev) => { ev.preventDefault(); if (rollbackTarget) rollbackMut.mutate(rollbackTarget); }}
            >
              {rollbackMut.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Hoàn tác
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function LogRow({
  entry, profile, expanded, onToggle, canRollback, onRollback,
}: {
  entry: { row: AuditRow; kind: Kind; severity: Severity; verb: string; icon: typeof Plus };
  profile: ProfileLite | null | undefined;
  expanded: boolean;
  onToggle: () => void;
  canRollback?: boolean;
  onRollback?: () => void;
}) {
  const { row, kind, severity, verb, icon: Icon } = entry;
  const sev = SEVERITY_META[severity];
  const entLabel = entityLabel(row.entity);
  const detail = (row.detail ?? {}) as Record<string, unknown>;
  const label = rowLabel(detail.new) ?? rowLabel(detail.old);
  const changes = diffChanges(detail.old, detail.new);
  const email = typeof detail.email === "string" ? detail.email : null;
  const ip = typeof detail.ip === "string" ? detail.ip : null;
  const who = profile?.ho_ten || profile?.email || email || "Hệ thống";
  const pg = pageLabel(row.entity);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[28px_170px_80px_180px_1fr_140px] items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted/40"
      >
        <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`} />
        <span className="font-mono tabular-nums text-[11px] text-muted-foreground">{fmtTime(row.created_at)}</span>
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${sev.dot}`} />
          <span className={`text-[11px] uppercase ${sev.text}`}>{sev.label}</span>
        </span>
        <span className="truncate">{who}</span>
        <span className="flex min-w-0 items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">{verb.toLowerCase()}</span>
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">{entLabel}</Badge>
          {label && <span className="truncate font-medium">{label}</span>}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">{pg}</span>
      </button>

      {expanded && (
        <div className="space-y-3 border-t bg-muted/20 px-3 py-3">
          {kind === "update" && changes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="pb-1 pr-3 text-left font-medium">Trường</th>
                    <th className="pb-1 pr-3 text-left font-medium">Trước</th>
                    <th className="pb-1 text-left font-medium">Sau</th>
                  </tr>
                </thead>
                <tbody>
                  {changes.map((c) => (
                    <tr key={c.field} className="border-t">
                      <td className="py-1 pr-3 font-medium">{c.field}</td>
                      <td className="py-1 pr-3 font-mono text-rose-700 line-through dark:text-rose-300">{c.from}</td>
                      <td className="py-1 font-mono text-emerald-700 dark:text-emerald-300">{c.to}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1.5 text-[11px] sm:grid-cols-3">
            <MetaRow label="Mã hành động" value={row.action} mono />
            <MetaRow label="Loại dữ liệu" value={entLabel} />
            <MetaRow label="ID bản ghi" value={row.entity_id ?? "—"} mono />
            <MetaRow label="Người thực hiện" value={profile ? `${profile.ho_ten ?? ""} ${profile.email ? `<${profile.email}>` : ""}`.trim() || "—" : "Hệ thống"} />
            <MetaRow label="Thời điểm" value={new Date(row.created_at).toLocaleString("vi-VN")} />
            {ip && <MetaRow label="IP" value={ip} mono />}
          </div>

          {row.detail && Object.keys(row.detail).length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Xem dữ liệu thô (JSON)</summary>
              <pre className="mt-1 max-h-64 overflow-auto rounded bg-background p-2 font-mono text-[10px] leading-snug">
                {JSON.stringify(row.detail, null, 2)}
              </pre>
            </details>
          )}

          {canRollback && onRollback && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 dark:border-amber-500/30 dark:bg-amber-500/10">
              <span className="text-[11px] text-amber-800 dark:text-amber-200">
                {kind === "create" ? "Hoàn tác sẽ xoá bản ghi vừa được tạo."
                  : kind === "delete" ? "Hoàn tác sẽ khôi phục lại bản ghi đã xoá."
                  : "Hoàn tác sẽ đưa bản ghi về đúng giá trị trước khi sửa."}
              </span>
              <Button size="sm" variant="outline" className="h-7 shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:text-amber-200 dark:hover:bg-amber-500/20" onClick={onRollback}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Hoàn tác
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`min-w-0 flex-1 truncate ${mono ? "font-mono" : ""}`} title={value}>{value}</span>
    </div>
  );
}
