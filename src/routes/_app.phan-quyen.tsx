import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck, Users, Lock, Eye, KeyRound, FileClock, Database,
  Check, X, Search, Building2, UserCog, Wrench, AlertTriangle,
  Replace, ArrowLeftRight, Package, HardDrive, Loader2, ClipboardList,
  FolderKanban, Network, FileText, Boxes,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StandardTable } from "@/components/mirats/StandardTable";
import { supabase } from "@/integrations/backend/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/phan-quyen")({
  head: () => ({
    meta: [
      { title: "Phân quyền & Bảo mật — MIRATS 2.0" },
      { name: "description", content: "Vai trò, RBAC theo collection, phân bố tài khoản theo đơn vị và nhật ký kiểm toán — số liệu thật." },
    ],
  }),
  component: PhanQuyenPage,
});

type PermLevel = "CRUD" | "CRU" | "CRUD-DV" | "CRU-DV" | "C-DV" | "R" | "R-DV" | "-";
type RoleKey = "admin" | "phong_kt" | "phu_trach_dv" | "quan_ly_du_an" | "to_truong" | "ktv" | "readonly";

// ---- Real-data shapes returned by phan_quyen_thong_ke() RPC ----
type Stats = {
  total_accounts: number;
  active_accounts: number;
  roles: Record<string, { total: number; active: number }>;
  units: { don_vi: string; accounts: number; active: number }[];
  entities: {
    thiet_bi: number; giay_phep: number; tickets: number;
    du_an: number; so_do: number; forms: number; audit: number;
  };
};

// Role display metadata — counts come from the DB.
const roleMeta: Record<RoleKey, {
  name: string; short: string; scope: string; icon: typeof ShieldCheck; tone: string; desc: string;
}> = {
  admin: {
    name: "Quản trị hệ thống", short: "Admin", scope: "Toàn hệ thống", icon: ShieldCheck,
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    desc: "Toàn quyền cấu hình & quản trị.",
  },
  phong_kt: {
    name: "Phòng Kỹ thuật", short: "Phòng KT", scope: "Toàn công ty", icon: UserCog,
    tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    desc: "CRUD nghiệp vụ toàn công ty; duyệt phiếu.",
  },
  phu_trach_dv: {
    name: "Phụ trách đơn vị", short: "PT đơn vị", scope: "Trong đơn vị", icon: Building2,
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    desc: "Xem trong đơn vị, tạo sự cố / phiếu nghiệp vụ.",
  },
  quan_ly_du_an: {
    name: "Quản lý dự án", short: "QL dự án", scope: "Dự án phụ trách", icon: FolderKanban,
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
    desc: "Quản trị dự án được phân công.",
  },
  to_truong: {
    name: "Tổ trưởng", short: "Tổ trưởng", scope: "Trong đơn vị", icon: Users,
    tone: "bg-teal-500/10 text-teal-600 dark:text-teal-300",
    desc: "Điều phối công việc bảo dưỡng trong đơn vị.",
  },
  ktv: {
    name: "Kỹ thuật viên", short: "KTV", scope: "Trong đơn vị", icon: Wrench,
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
    desc: "Tạo sự cố / phiếu điền; xem trong đơn vị.",
  },
  readonly: {
    name: "Người xem", short: "Read-only", scope: "Trong đơn vị", icon: Eye,
    tone: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    desc: "Chỉ xem & xuất báo cáo.",
  },
};
const ROLE_ORDER: RoleKey[] = ["admin", "phong_kt", "phu_trach_dv", "quan_ly_du_an", "to_truong", "ktv", "readonly"];

const DON_VI_LABEL: Record<string, string> = {
  CRA: "Cảng HK Cam Ranh", CLA: "Cảng HK Chu Lai", PBA: "Cảng HK Phú Bài",
  PLK: "Cảng HK Pleiku", THO: "Cảng HK Thọ Xuân", PCA: "Cảng HK Phù Cát",
};
const dvLabel = (ma: string) => DON_VI_LABEL[ma] ?? ma;

// Ma trận đồng bộ với RLS thực tế trong CSDL (kiểm chứng qua pg_policies).
// CRUD: toàn hệ thống · CRUD-DV: trong đơn vị · CRU/CRU-DV: tạo+sửa (không xoá)
// C-DV: chỉ tạo trong đơn vị · R: xem toàn hệ thống · R-DV: xem trong đơn vị
const collections: {
  key: string; label: string; icon: typeof HardDrive;
  perms: Record<RoleKey, PermLevel>;
}[] = [
  { key: "thiet_bi", label: "Tài sản", icon: HardDrive,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "R-DV", quan_ly_du_an: "R-DV", to_truong: "R-DV", ktv: "R-DV", readonly: "R-DV" } },
  { key: "bao_tri", label: "Bảo dưỡng", icon: Wrench,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "R-DV", quan_ly_du_an: "R-DV", to_truong: "R-DV", ktv: "R-DV", readonly: "R-DV" } },
  { key: "su_co", label: "Sự cố", icon: AlertTriangle,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "C-DV", quan_ly_du_an: "C-DV", to_truong: "C-DV", ktv: "C-DV", readonly: "R-DV" } },
  { key: "hong_hoc", label: "Hỏng hóc & Thay thế", icon: Replace,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "R-DV", quan_ly_du_an: "R-DV", to_truong: "R-DV", ktv: "R-DV", readonly: "R-DV" } },
  { key: "ban_giao", label: "Bàn giao", icon: ArrowLeftRight,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "R-DV", quan_ly_du_an: "R-DV", to_truong: "R-DV", ktv: "R-DV", readonly: "R-DV" } },
  { key: "vat_tu", label: "Vật tư & Kho", icon: Package,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "R-DV", quan_ly_du_an: "R-DV", to_truong: "R-DV", ktv: "R-DV", readonly: "R-DV" } },
  { key: "giay_phep", label: "Giấy phép", icon: ShieldCheck,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "R-DV", quan_ly_du_an: "R-DV", to_truong: "R-DV", ktv: "R-DV", readonly: "R-DV" } },
  { key: "forms", label: "Phiếu điền (Forms)", icon: FileText,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "CRU-DV", quan_ly_du_an: "CRU-DV", to_truong: "CRU-DV", ktv: "CRU-DV", readonly: "R-DV" } },
  { key: "du_an", label: "Dự án", icon: FolderKanban,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "R", quan_ly_du_an: "CRUD-DV", to_truong: "R", ktv: "R", readonly: "R" } },
  { key: "so_do", label: "Sơ đồ hệ thống", icon: Network,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "CRU-DV", quan_ly_du_an: "CRU-DV", to_truong: "R-DV", ktv: "R-DV", readonly: "R-DV" } },
  { key: "tickets", label: "Yêu cầu (Tickets)", icon: ClipboardList,
    perms: { admin: "CRUD", phong_kt: "CRU", phu_trach_dv: "CRU", quan_ly_du_an: "CRU", to_truong: "CRU", ktv: "CRU", readonly: "CRU" } },
  { key: "danh_muc", label: "Danh mục nền", icon: Database,
    perms: { admin: "CRUD", phong_kt: "CRUD", phu_trach_dv: "R", quan_ly_du_an: "R", to_truong: "R", ktv: "R", readonly: "R" } },
  { key: "nguoi_dung", label: "Người dùng & Vai trò", icon: Users,
    perms: { admin: "CRUD", phong_kt: "-", phu_trach_dv: "-", quan_ly_du_an: "-", to_truong: "-", ktv: "-", readonly: "-" } },
];

// ---- Calm 4-tier access model (consistent tokens) ----
type Tier = "full" | "edit" | "view" | "none";
const tierMeta: Record<Tier, { label: string; dot: string; cell: string }> = {
  full: { label: "Đầy đủ", dot: "bg-emerald-500",
    cell: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  edit: { label: "Tạo · Sửa", dot: "bg-sky-500",
    cell: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  view: { label: "Chỉ xem", dot: "bg-muted-foreground/50",
    cell: "bg-muted text-muted-foreground" },
  none: { label: "Không truy cập", dot: "bg-transparent border border-border",
    cell: "text-muted-foreground/40" },
};
function permToTier(p: PermLevel): { tier: Tier; dv: boolean } {
  switch (p) {
    case "CRUD": return { tier: "full", dv: false };
    case "CRUD-DV": return { tier: "full", dv: true };
    case "CRU": return { tier: "edit", dv: false };
    case "CRU-DV": return { tier: "edit", dv: true };
    case "C-DV": return { tier: "edit", dv: true };
    case "R": return { tier: "view", dv: false };
    case "R-DV": return { tier: "view", dv: true };
    default: return { tier: "none", dv: false };
  }
}

// ---- Audit log (real) ----
type AuditRow = {
  id: string; user_id: string | null; action: string;
  entity: string | null; entity_id: string | null; created_at: string;
};
const ENTITY_LABEL: Record<string, string> = {
  thiet_bi: "Tài sản", giay_phep: "Giấy phép", form_template: "Mẫu biểu",
  form_field: "Trường mẫu biểu", form_submission: "Phiếu điền", profiles: "Tài khoản",
  user_roles: "Phân quyền", dm_don_vi: "Đơn vị", dm_he_thong: "Hệ thống",
  dm_nhom_he_thong: "Nhóm hệ thống", dm_vi_tri: "Vị trí", dm_loai_thiet_bi: "Chủng loại",
  dm_loai_giay_phep: "Loại giấy phép", dm_nha_cung_cap: "Nhà cung cấp",
  dm_nha_san_xuat: "Nhà sản xuất", dm_noi_cap: "Nơi cấp", du_an: "Dự án",
  so_do_he_thong: "Sơ đồ hệ thống", audit_log: "Nhật ký", tickets: "Yêu cầu",
};
function describeAction(a: string): { verb: string; ok: boolean } {
  if (a.includes("failed") || a.includes("captcha") || a.includes("rate_limited") || a.includes("unknown") || a.includes("inactive"))
    return { verb: a, ok: false };
  if (a.startsWith("insert_")) return { verb: "Tạo mới", ok: true };
  if (a.startsWith("update_")) return { verb: "Cập nhật", ok: true };
  if (a.startsWith("delete_")) return { verb: "Xoá", ok: true };
  if (a.includes("password_reset")) return { verb: "Đặt lại mật khẩu", ok: true };
  if (a.includes("login") || a.includes("sign")) return { verb: "Đăng nhập", ok: true };
  return { verb: a, ok: true };
}
function fmtTs(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PhanQuyenPage() {
  const [q, setQ] = useState("");

  const statsQ = useQuery({
    queryKey: ["phan_quyen_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("phan_quyen_thong_ke");
      if (error) throw error;
      return data as unknown as Stats;
    },
    refetchOnWindowFocus: false,
  });
  const stats = statsQ.data;

  const auditQ = useQuery({
    queryKey: ["phan_quyen_audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id,user_id,action,entity,entity_id,created_at")
        .order("created_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
    refetchOnWindowFocus: false,
  });

  const auditUserIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of auditQ.data ?? []) if (r.user_id) s.add(r.user_id);
    return Array.from(s);
  }, [auditQ.data]);

  const auditProfilesQ = useQuery({
    enabled: auditUserIds.length > 0,
    queryKey: ["phan_quyen_audit_profiles", auditUserIds.sort().join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,ho_ten,don_vi")
        .in("id", auditUserIds);
      if (error) throw error;
      return (data ?? []) as { id: string; ho_ten: string | null; don_vi: string | null }[];
    },
    refetchOnWindowFocus: false,
  });
  const profileMap = useMemo(
    () => new Map((auditProfilesQ.data ?? []).map((p) => [p.id, p])),
    [auditProfilesQ.data],
  );

  const filteredAudit = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return (auditQ.data ?? []).filter((r) => {
      if (!kw) return true;
      const p = r.user_id ? profileMap.get(r.user_id) : null;
      const hay = `${r.action} ${r.entity ?? ""} ${r.entity_id ?? ""} ${p?.ho_ten ?? ""} ${p?.don_vi ?? ""}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [auditQ.data, q, profileMap]);

  const roleCards = useMemo(() => {
    if (!stats) return [];
    const known = ROLE_ORDER
      .filter((k) => stats.roles[k])
      .map((k) => ({ key: k, ...roleMeta[k], total: stats.roles[k].total, active: stats.roles[k].active }));
    const extras = Object.keys(stats.roles)
      .filter((k) => !(ROLE_ORDER as string[]).includes(k))
      .map((k) => ({
        key: k,
        name: k, short: k,
        scope: "—", icon: KeyRound,
        tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
        desc: "Vai trò bổ sung.", total: stats.roles[k].total, active: stats.roles[k].active,
      }));
    return [...known, ...extras];
  }, [stats]);

  const entityCards = stats ? [
    { label: "Tài sản", value: stats.entities.thiet_bi, icon: HardDrive },
    { label: "Giấy phép", value: stats.entities.giay_phep, icon: ShieldCheck },
    { label: "Yêu cầu", value: stats.entities.tickets, icon: ClipboardList },
    { label: "Dự án", value: stats.entities.du_an, icon: FolderKanban },
    { label: "Sơ đồ", value: stats.entities.so_do, icon: Network },
    { label: "Biểu mẫu", value: stats.entities.forms, icon: FileText },
    { label: "Nhật ký", value: stats.entities.audit, icon: FileClock },
  ] : [];

  const maxUnit = stats ? Math.max(1, ...stats.units.map((u) => u.accounts)) : 1;

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <PageHeader
        icon={ShieldCheck}
        title="Vai trò & kiểm soát truy cập"
        description="Quản lý vai trò, phạm vi truy cập và nhật ký kiểm toán trên toàn hệ thống."
        help="Mỗi tài khoản gắn với một hoặc nhiều vai trò; phạm vi truy cập được thu hẹp theo đơn vị và dự án."
        actions={
          stats ? (
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="font-mono">
                <Users className="mr-1 h-3 w-3" /> {stats.total_accounts} tài khoản
              </Badge>
              <Badge variant="outline" className="font-mono text-emerald-600 dark:text-emerald-300">
                {stats.active_accounts} hoạt động
              </Badge>
            </div>
          ) : null
        }
      />


      {/* Role cards — compact */}
      {statsQ.isLoading ? (
        <Card><CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải số liệu…
        </CardContent></Card>
      ) : statsQ.isError ? (
        <Card><CardContent className="py-8 text-center text-sm text-destructive">Không tải được số liệu phân quyền.</CardContent></Card>
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {roleCards.map((r) => {
            const Icon = r.icon;
            return (
              <Card key={r.key} className="p-4">
                <div className="flex items-center justify-between">
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", r.tone)}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="font-mono text-2xl font-semibold leading-none tabular-nums">{r.total}</span>
                </div>
                <div className="mt-3 text-sm font-semibold leading-tight">{r.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{r.scope}</div>
              </Card>
            );
          })}
        </section>
      )}

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matrix"><Lock className="mr-1.5 h-3.5 w-3.5" />Ma trận quyền</TabsTrigger>
          <TabsTrigger value="phanbo"><Boxes className="mr-1.5 h-3.5 w-3.5" />Phân bố</TabsTrigger>
          <TabsTrigger value="audit"><FileClock className="mr-1.5 h-3.5 w-3.5" />Nhật ký</TabsTrigger>
          <TabsTrigger value="policy"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Chính sách</TabsTrigger>
        </TabsList>

        {/* ===== RBAC matrix — calm 4-tier ===== */}
        <TabsContent value="matrix" className="space-y-3">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3">
              <div>
                <CardTitle className="text-base">Ma trận quyền theo dữ liệu</CardTitle>
                <CardDescription>Số dưới mỗi vai trò là số tài khoản thật đang giữ.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
                {(Object.keys(tierMeta) as Tier[]).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <span className={cn("h-2.5 w-2.5 rounded-full", tierMeta[t].dot)} />
                    {tierMeta[t].label}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <span className="rounded bg-muted px-1 font-mono text-[9px] font-semibold">ĐV</span>
                  giới hạn đơn vị
                </span>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px]">Dữ liệu</TableHead>
                    {ROLE_ORDER.map((k) => (
                      <TableHead key={k} className="text-center">
                        <div className="text-xs font-medium">{roleMeta[k].short}</div>
                        <div className="font-mono text-[10px] font-normal text-muted-foreground">
                          {stats?.roles[k]?.total ?? 0}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.map((c) => {
                    const Icon = c.icon;
                    return (
                      <TableRow key={c.key}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 text-sm">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.label}
                          </div>
                        </TableCell>
                        {ROLE_ORDER.map((k) => {
                          const { tier, dv } = permToTier(c.perms[k]);
                          const m = tierMeta[tier];
                          return (
                            <TableCell key={k} className="text-center">
                              <span
                                title={m.label + (dv ? " · giới hạn đơn vị" : "")}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium",
                                  m.cell,
                                )}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
                                {tier === "none" ? "—" : m.label}
                                {dv && <span className="rounded bg-background/60 px-1 font-mono text-[8.5px] font-semibold">ĐV</span>}
                              </span>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Phân bố dữ liệu (real) ===== */}
        <TabsContent value="phanbo" className="space-y-3">
          <div className="grid gap-3 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Tài khoản theo đơn vị</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!stats || stats.units.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Chưa có tài khoản nào gắn đơn vị.</p>
                ) : (
                  stats.units.map((u) => (
                    <div key={u.don_vi} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">
                          <span className="font-mono">{u.don_vi}</span>
                          <span className="ml-1.5 text-muted-foreground">· {dvLabel(u.don_vi)}</span>
                        </span>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {u.accounts} <span className="opacity-70">({u.active} hoạt động)</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.round((u.accounts / maxUnit) * 100)}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Khối lượng dữ liệu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {entityCards.map((e) => {
                    const Icon = e.icon;
                    return (
                      <div key={e.label} className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide text-muted-foreground">
                          <Icon className="h-3 w-3" /> {e.label}
                        </div>
                        <div className="mt-1 font-mono text-xl font-semibold tabular-nums">{e.value.toLocaleString("vi-VN")}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Ràng buộc theo hàng: <span className="font-mono">don_vi = user.don_vi</span> cho dữ liệu nghiệp vụ; vai trò cấp công ty được bỏ qua.</span>
          </div>
        </TabsContent>

        {/* ===== Audit log (real) ===== */}
        <TabsContent value="audit" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Nhật ký kiểm toán</CardTitle>
                  <CardDescription>{auditQ.data?.length ?? 0} bản ghi gần nhất.</CardDescription>
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo người, đối tượng…" className="h-8 pl-8 text-xs" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <StandardTable<AuditRow>
                tableKey="phan_quyen_audit_log"
                rows={filteredAudit.slice(0, 50)}
                getRowId={(r) => r.id}
                requireFilterToShow={false}
                trangThai={{ dangTai: auditQ.isLoading }}
                emptyContent={<div className="py-10 text-center text-sm text-muted-foreground">Không có bản ghi phù hợp.</div>}
                columns={[
                  {
                    key: "created_at", label: "Thời điểm", sortable: true,
                    value: (r) => r.created_at,
                    cell: (r) => <span className="font-mono text-[11px] text-muted-foreground">{fmtTs(r.created_at)}</span>,
                  },
                  {
                    key: "nguoi", label: "Người thực hiện", filter: "text",
                    value: (r) => {
                      const p = r.user_id ? profileMap.get(r.user_id) : null;
                      return `${p?.ho_ten ?? ""} ${p?.don_vi ?? ""}`;
                    },
                    cell: (r) => {
                      const p = r.user_id ? profileMap.get(r.user_id) : null;
                      return (
                        <div>
                          <div className="text-xs font-medium">{p?.ho_ten ?? "—"}</div>
                          <div className="text-[10.5px] text-muted-foreground">{p?.don_vi ? dvLabel(p.don_vi) : "Hệ thống"}</div>
                        </div>
                      );
                    },
                  },
                  {
                    key: "action", label: "Hành động", filter: "cat",
                    value: (r) => describeAction(r.action).verb,
                    cell: (r) => <span className="text-xs">{describeAction(r.action).verb}</span>,
                  },
                  {
                    key: "entity", label: "Đối tượng", filter: "cat",
                    value: (r) => ENTITY_LABEL[r.entity ?? ""] ?? r.entity ?? "",
                    cell: (r) => <Badge variant="outline" className="text-[10.5px]">{ENTITY_LABEL[r.entity ?? ""] ?? r.entity ?? "—"}</Badge>,
                  },
                  {
                    key: "entity_id", label: "Mã bản ghi", filter: "text",
                    value: (r) => r.entity_id ?? "",
                    cell: (r) => <span className="font-mono text-[11px] text-muted-foreground">{r.entity_id ?? "—"}</span>,
                  },
                  {
                    key: "kq", label: "KQ", align: "center",
                    value: (r) => describeAction(r.action).ok ? "OK" : "Lỗi",
                    cell: (r) => describeAction(r.action).ok
                      ? <Check className="mx-auto h-4 w-4 text-emerald-600" />
                      : <X className="mx-auto h-4 w-4 text-rose-600" />,
                  },
                ]}
              />
            </CardContent>

          </Card>
        </TabsContent>

        {/* ===== Policy — condensed ===== */}
        <TabsContent value="policy" className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: KeyRound, title: "Xác thực", items: ["Tài khoản mới cần quản trị duyệt", "Khôi phục mật khẩu qua email có ghi log"] },
              { icon: FileClock, title: "Kiểm toán", items: ["Ghi log mọi thao tác thêm/sửa/xoá", "Lưu dữ liệu trước/sau để hoàn tác"] },
              { icon: Lock, title: "Bảo mật trường", items: ["Ẩn giá trị & chi phí với KTV, Read-only", "Trường nhạy cảm ghi log riêng"] },
              { icon: Database, title: "Sao lưu & toàn vẹn", items: ["Sao lưu tự động theo lịch", "Ưu tiên archive thay vì xoá cứng"] },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.title} className="p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4 text-muted-foreground" /> {p.title}
                  </div>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    {p.items.map((it) => (
                      <li key={it} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /> {it}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>

          <Card className="border-dashed p-4">
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              {[
                ["Least privilege", "Chỉ cấp quyền tối thiểu cần thiết."],
                ["Tách tạo — duyệt", "Người tạo phiếu không tự phê duyệt."],
                ["Không xoá cứng", "Lịch sử được lưu để truy vết."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-lg border bg-muted/40 p-3">
                  <div className="mb-1 font-semibold text-foreground">{t}</div>
                  {d}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
