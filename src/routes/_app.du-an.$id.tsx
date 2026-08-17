import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Plus, Loader2, Calendar as CalendarIcon, GanttChart, KanbanSquare,
  ListTree, Users, User as UserIcon, CheckCircle2, Clock, AlertTriangle, Mails,
  Pencil, Trash2, Save, FileText, Search as SearchIcon, TrendingUp, Info, ShieldAlert
} from "lucide-react";
import "@/vendor/frappe-gantt.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { CongVanPanel } from "@/components/mirats/congvan/CongVanPanel";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LeanUXCanvas } from "@/components/mirats/projects/discovery/LeanUXCanvas";
import { HillChart } from "@/components/mirats/projects/delivery/HillChart";
import { DossierRegister } from "@/components/mirats/projects/dossier/DossierRegister";
import { PitchEditor } from "@/components/mirats/projects/delivery/PitchEditor";
import { OperationsLane } from "@/components/mirats/projects/operations/OperationsLane";
import { getTodayDateString } from "@/lib/mirats/calendar-date";

export const Route = createFileRoute("/_app/du-an/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: (search.view as string) || "kanban",
    q: (search.q as string) || "",
  }),
  head: ({ params }) => ({
    meta: [
      { title: `Dự án ${params.id.slice(0, 8)} — MIRATS` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DuAnDetailPage,
  errorComponent: ({ error, reset }) => (
    <Card>
      <CardContent className="p-6 space-y-3">
        <div className="text-rose-600 font-medium">Không tải được dự án</div>
        <div className="text-xs text-slate-500">{(error as Error).message}</div>
        <Button size="sm" onClick={reset}>Thử lại</Button>
      </CardContent>
    </Card>
  ),
  notFoundComponent: () => (
    <Card><CardContent className="p-6">Không tìm thấy dự án.</CardContent></Card>
  ),
});

const CV_TRANG_THAI: Record<string, { label: string; tone: string; column: string }> = {
  chua_bat_dau: { label: "Chưa bắt đầu", tone: "bg-slate-100 text-slate-700 border-slate-200", column: "Chưa bắt đầu" },
  dang_lam:     { label: "Đang làm",     tone: "bg-sky-100 text-sky-700 border-sky-200",       column: "Đang làm" },
  cho_duyet:    { label: "Chờ duyệt",    tone: "bg-amber-100 text-amber-700 border-amber-200", column: "Chờ duyệt" },
  hoan_thanh:   { label: "Hoàn thành",   tone: "bg-emerald-100 text-emerald-700 border-emerald-200", column: "Hoàn thành" },
  qua_han:      { label: "Quá hạn",      tone: "bg-rose-100 text-rose-700 border-rose-200",    column: "Quá hạn" },
};
const CV_STATUSES = ["chua_bat_dau", "dang_lam", "cho_duyet", "hoan_thanh", "qua_han"] as const;

type DuAn = {
  id: string; ma: string | null; ten: string; mo_ta: string | null;
  don_vi_id: string | null; nguoi_tao_id: string; quan_ly_id: string;
  ngay_bat_dau: string | null; ngay_ket_thuc_du_kien: string | null;
  trang_thai: string; tien_do: number;
};
type Moc = {
  id: string; du_an_id: string; ten: string; mo_ta: string | null; thu_tu: number;
  ngay_bat_dau: string | null; ngay_ket_thuc_du_kien: string | null;
  trang_thai: string; tien_do: number;
};
type CongViec = {
  id: string; du_an_id: string; moc_id: string;
  ten: string; mo_ta: string | null;
  nguoi_xu_ly_chinh: string | null;
  ngay_bat_dau: string | null; ngay_ket_thuc_du_kien: string | null;
  ngay_hoan_thanh_thuc_te: string | null;
  trang_thai: typeof CV_STATUSES[number];
  tien_do: number; ket_qua: string | null;
  created_by: string | null;
};
type Profile = { id: string; ho_ten: string | null; email: string };

function DuAnDetailPage() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { session, hasRole } = useSession();

  const { data: duAn, isLoading: loadingDA } = useQuery({
    queryKey: ["du-an", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("du_an").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as DuAn | null;
    },
  });
  const { data: mocs } = useQuery({
    queryKey: ["du-an-moc", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("du_an_moc").select("*").eq("du_an_id", id).order("thu_tu");
      if (error) throw error;
      return (data ?? []) as Moc[];
    },
  });
  const { data: congViecs } = useQuery({
    queryKey: ["du-an-cv", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("du_an_cong_viec").select("*")
        .eq("du_an_id", id).order("created_at");
      if (error) throw error;
      return (data ?? []) as CongViec[];
    },
  });

  const userIds = useMemo(() => {
    const s = new Set<string>();
    if (duAn) { s.add(duAn.quan_ly_id); s.add(duAn.nguoi_tao_id); }
    (congViecs ?? []).forEach((c) => c.nguoi_xu_ly_chinh && s.add(c.nguoi_xu_ly_chinh));
    return Array.from(s);
  }, [duAn, congViecs]);

  const { data: profiles } = useQuery({
    queryKey: ["profiles-for", userIds.sort().join(",")],
    queryFn: async () => {
      if (userIds.length === 0) return [] as Profile[];
      const { data } = await supabase.from("profiles").select("id,ho_ten,email").in("id", userIds);
      return (data ?? []) as Profile[];
    },
    enabled: userIds.length > 0,
  });
  const profileMap = useMemo(() => Object.fromEntries((profiles ?? []).map((p) => [p.id, p])), [profiles]);
  const nameOf = (uid: string | null) =>
    uid ? profileMap[uid]?.ho_ten ?? profileMap[uid]?.email ?? uid.slice(0, 8) : "—";

  const uid = session?.user?.id;
  const isManager = !!duAn && !!uid && (hasRole("admin") || duAn.quan_ly_id === uid);
  const canAddTask = isManager || hasRole("to_truong") || hasRole("quan_ly_du_an");

  const [openMoc, setOpenMoc] = useState(false);
  const [openCV, setOpenCV] = useState(false);
  const [defaultMocId, setDefaultMocId] = useState<string | null>(null);
  const [editingCV, setEditingCV] = useState<CongViec | null>(null);

  if (loadingDA) {
    return <div className="p-8 text-slate-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Đang tải…</div>;
  }
  if (!duAn) {
    return <Card><CardContent className="p-6">Không tìm thấy dự án.</CardContent></Card>;
  }

  const currentSearch = Route.useSearch();
  const activeTab = currentSearch.view;

  return (
    <div className="flex flex-col gap-4">
        {/* Astryx Page Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link to="/du-an" className="hover:text-indigo-600 transition-colors">Dự án</Link>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-900 truncate max-w-[200px]">{duAn.ten}</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{duAn.ten}</h1>
              {duAn.ma && <span className="text-xs font-mono text-slate-400 mt-0.5">{duAn.ma}</span>}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none capitalize px-2.5 py-0.5">
                {duAn.trang_thai.replace("_", " ")}
              </Badge>
              {isManager && (
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                  <Pencil className="h-4 w-4 mr-2" /> Thiết lập
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Project Metadata Toolbar */}
        <div className="flex flex-wrap items-center gap-6 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Stat label="Quản lý" value={nameOf(duAn.quan_ly_id)} icon={UserIcon} />
          <Stat label="Ngày bắt đầu" value={duAn.ngay_bat_dau ?? "—"} icon={CalendarIcon} />
          <Stat label="Kết thúc dự kiến" value={duAn.ngay_ket_thuc_du_kien ?? "—"} icon={CalendarIcon} />
          <div className="min-w-[140px] flex-1 max-w-[200px]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Tiến độ</span>
              <span className="text-slate-900">{duAn.tien_do}%</span>
            </div>
            <Progress value={duAn.tien_do} className="h-1.5 bg-slate-100" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => nav({ search: { view: v, q: currentSearch.q } as any, replace: true })}
            >
              <TabsList className="bg-slate-100 p-1 border border-slate-200" data-density="comfortable">
                <TabsTrigger value="kanban" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 h-7 text-xs font-medium">
                  <KanbanSquare className="h-3.5 w-3.5 mr-1.5" />Kanban
                </TabsTrigger>
                <TabsTrigger value="gantt" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 h-7 text-xs font-medium">
                  <GanttChart className="h-3.5 w-3.5 mr-1.5" />Gantt
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 h-7 text-xs font-medium">
                  <ListTree className="h-3.5 w-3.5 mr-1.5" />Danh sách
                </TabsTrigger>
                <TabsTrigger value="discovery" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 h-7 text-xs font-medium">Discovery</TabsTrigger>
                <TabsTrigger value="delivery" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 h-7 text-xs font-medium">Delivery</TabsTrigger>
                <TabsTrigger value="operations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-3 h-7 text-xs font-medium">Operations</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Tìm công việc..." 
                  className="h-8 pl-8 text-xs w-[180px] bg-white border-slate-200"
                  value={currentSearch.q}
                  onChange={(e) => nav({ search: { ...currentSearch, q: e.target.value } as any, replace: true })}
                />
              </div>
              {canAddTask && (
                <Button size="sm" className="h-8 px-3 text-xs bg-slate-900 hover:bg-slate-800" onClick={() => { setDefaultMocId(mocs?.[0]?.id ?? null); setEditingCV(null); setOpenCV(true); }}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Thêm việc
                </Button>
              )}
            </div>
          </div>

          <Tabs value={activeTab}>
            <TabsContent value="kanban" className="mt-0">
              <KanbanView
                mocs={mocs ?? []}
                tasks={congViecs?.filter(t => !currentSearch.q || t.ten.toLowerCase().includes(currentSearch.q.toLowerCase())) ?? []}
                nameOf={nameOf}
                onEdit={(t) => { setEditingCV(t); setDefaultMocId(t.moc_id); setOpenCV(true); }}
                canAdd={canAddTask}
                onAddIn={(mocId) => { setDefaultMocId(mocId); setEditingCV(null); setOpenCV(true); }}
              />
            </TabsContent>

            <TabsContent value="gantt" className="mt-3">
              <GanttView mocs={mocs ?? []} tasks={congViecs?.filter(t => !currentSearch.q || t.ten.toLowerCase().includes(currentSearch.q.toLowerCase())) ?? []} projectStart={duAn.ngay_bat_dau} />
            </TabsContent>

            <TabsContent value="discovery" className="mt-3">
              <LeanUXCanvas project_id={id} />
            </TabsContent>

            <TabsContent value="delivery" className="mt-3 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <HillChart 
                    markers={[
                      { id: "1", name: "Backend API", position: 35, status: "climbing" },
                      { id: "2", name: "UI Components", position: 65, status: "executing" },
                      { id: "3", name: "Dossier Integration", position: 10, status: "climbing" }
                    ]} 
                  />
                </div>
                <div className="space-y-4">
                  <Card className="border-slate-200 shadow-none bg-slate-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs uppercase text-slate-500 font-bold">Current Cycle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-bold text-slate-900">Cycle 08: Foundations</div>
                      <div className="text-[11px] text-slate-500 mt-1">17/08/2026 → 28/09/2026</div>
                      <Badge className="mt-3 bg-indigo-600">Big Batch (6w)</Badge>
                    </CardContent>
                  </Card>
                  <Button className="w-full justify-start text-xs font-semibold" variant="outline">
                    <Plus className="h-3.5 w-3.5 mr-2" /> New Pitch
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="operations" className="mt-3">
              <OperationsLane 
                wipLimit={2}
                incidents={[
                  { id: "inc-01", title: "API Gateway 502 Errors in Production", severity: "P0", sla_status: "breach", owner: "Hung Nguyen", interruption_load: 85 },
                  { id: "inc-02", title: "Storage quota reached for project dossiers", severity: "P1", sla_status: "warning", owner: "Minh Tran", interruption_load: 30 }
                ]} 
              />
            </TabsContent>

            <TabsContent value="hoso" className="mt-3">
              <DossierRegister dossier_id="default" />
            </TabsContent>

            <TabsContent value="list" className="mt-3">
              <ListView
                mocs={mocs ?? []}
                tasks={congViecs ?? []}
                nameOf={nameOf}
                onEdit={(t) => { setEditingCV(t); setDefaultMocId(t.moc_id); setOpenCV(true); }}
                canAdd={canAddTask}
                onAddIn={(mocId) => { setDefaultMocId(mocId); setEditingCV(null); setOpenCV(true); }}
                isManager={isManager}
                onDeleteMoc={async (m) => {
                  const { error } = await supabase.from("du_an_moc").delete().eq("id", m.id);
                  if (error) toast.error(error.message);
                  else { toast.success("Đã xoá mốc"); qc.invalidateQueries({ queryKey: ["du-an-moc", id] }); qc.invalidateQueries({ queryKey: ["du-an-cv", id] }); }
                }}
              />
            </TabsContent>

            <TabsContent value="cong-van" className="mt-3">
              <CongVanPanel duAnId={id} canEdit={isManager} />
            </TabsContent>
          </Tabs>
        </div>

      <CreateMocDialog
        open={openMoc}
        onOpenChange={setOpenMoc}
        duAnId={id}
        currentUserId={uid ?? ""}
        onDone={() => qc.invalidateQueries({ queryKey: ["du-an-moc", id] })}
      />
      <EditCongViecDialog
        open={openCV}
        onOpenChange={setOpenCV}
        duAnId={id}
        mocs={mocs ?? []}
        defaultMocId={defaultMocId}
        editing={editingCV}
        currentUserId={uid ?? ""}
        isManager={isManager}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ["du-an-cv", id] });
          qc.invalidateQueries({ queryKey: ["du-an-moc", id] });
        }}
      />
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof CalendarIcon }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500 mb-1 flex items-center gap-1.5"><Icon className="h-3 w-3" />{label}</div>
      <div className="text-sm font-medium truncate">{value}</div>
    </div>
  );
}

// =====================================================
// KANBAN
// =====================================================
function KanbanView({
  mocs, tasks, nameOf, onEdit, canAdd, onAddIn,
}: {
  mocs: Moc[]; tasks: CongViec[]; nameOf: (u: string | null) => string;
  onEdit: (t: CongViec) => void;
  canAdd: boolean; onAddIn: (mocId: string) => void;
}) {
  const mocMap = useMemo(() => Object.fromEntries(mocs.map((m) => [m.id, m])), [mocs]);
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-320px)]">
      {CV_STATUSES.map((st) => {
        const col = CV_TRANG_THAI[st];
        const list = tasks.filter((t) => t.trang_thai === st);
        return (
          <div key={st} className="flex-shrink-0 w-[300px] flex flex-col gap-3">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", st === 'hoan_thanh' ? 'bg-emerald-500' : st === 'dang_lam' ? 'bg-sky-500' : st === 'cho_duyet' ? 'bg-amber-500' : st === 'qua_han' ? 'bg-rose-500' : 'bg-slate-300')} />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{col.label}</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border-none rounded-full">
                  {list.length}
                </Badge>
              </div>
              {canAdd && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400" onClick={() => onAddIn(mocs[0]?.id)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-3 p-1 rounded-lg bg-slate-50/50 border border-slate-100/50 min-h-[150px]">
              {list.map((t) => (
                <Card 
                  key={t.id} 
                  className="group cursor-pointer border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-200"
                  onClick={() => onEdit(t)}
                >
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[10px] font-mono text-slate-400 tracking-tight">#{t.id.slice(0, 6).toUpperCase()}</div>
                      {t.tien_do > 0 && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-indigo-50 text-indigo-600 border-none">{t.tien_do}%</Badge>}
                    </div>
                    
                    <div className="text-sm font-semibold leading-tight text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {t.ten}
                    </div>

                    {t.mo_ta && (
                      <div className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic">
                        {t.mo_ta}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-50 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <UserIcon className="h-3 w-3 text-slate-400" />
                        <span className="max-w-[80px] truncate">{nameOf(t.nguoi_xu_ly_chinh)}</span>
                      </div>
                      {t.ngay_ket_thuc_du_kien && (
                        <div className={cn("flex items-center gap-1.5 text-[10px]", t.trang_thai === 'qua_han' ? 'text-rose-600 font-medium' : 'text-slate-500')}>
                          <CalendarIcon className="h-3 w-3 text-slate-400" />
                          <span>{t.ngay_ket_thuc_du_kien}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {list.length === 0 && (
                <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-lg">
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">No Tasks</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// GANTT (frappe-gantt)
// =====================================================
function GanttView({ mocs, tasks, projectStart }: { mocs: Moc[]; tasks: CongViec[]; projectStart: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Week");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!ref.current) return;
    const el = ref.current;
    el.innerHTML = "";

    const today = getTodayDateString();
    const fallbackStart = projectStart ?? today;
    const items: {
      id: string; name: string; start: string; end: string;
      progress: number; custom_class?: string;
    }[] = [];

    for (const m of mocs) {
      items.push({
        id: `m_${m.id}`,
        name: `● ${m.ten}`,
        start: m.ngay_bat_dau ?? fallbackStart,
        end: m.ngay_ket_thuc_du_kien ?? m.ngay_bat_dau ?? fallbackStart,
        progress: m.tien_do,
        custom_class: "gantt-milestone",
      });
      for (const t of tasks.filter((x) => x.moc_id === m.id)) {
        items.push({
          id: `t_${t.id}`,
          name: `   ${t.ten}`,
          start: t.ngay_bat_dau ?? m.ngay_bat_dau ?? fallbackStart,
          end: t.ngay_ket_thuc_du_kien ?? t.ngay_bat_dau ?? m.ngay_ket_thuc_du_kien ?? fallbackStart,
          progress: t.tien_do,
          custom_class: `gantt-${t.trang_thai}`,
        });
      }
    }
    if (items.length === 0) return;

    let cancelled = false;
    import("frappe-gantt")
      .then((mod) => {
        if (cancelled) return;
        const Gantt = (mod as { default?: unknown }).default ?? mod;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new (Gantt as any)(el, items, {
            view_mode: viewMode,
            readonly: true,
            bar_height: 22,
            padding: 14,
            language: "en",
          });
        } catch (e) {
          console.error("Gantt render error", e);
        }
      })
      .catch((e) => console.error("Gantt load error", e));

    return () => { cancelled = true; };
  }, [mocs, tasks, projectStart, viewMode]);


  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">Sơ đồ Gantt</CardTitle>
          <div className="flex gap-1">
            {(["Day", "Week", "Month"] as const).map((v) => (
              <Button key={v} size="sm" variant={viewMode === v ? "default" : "outline"} onClick={() => setViewMode(v)}>
                {v === "Day" ? "Ngày" : v === "Week" ? "Tuần" : "Tháng"}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mocs.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">Chưa có mốc/công việc để hiển thị Gantt.</div>
        ) : (
          <div className="overflow-x-auto">
            <div ref={ref} className="frappe-gantt-wrapper" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// LIST
// =====================================================
function ListView({
  mocs, tasks, nameOf, onEdit, canAdd, onAddIn, isManager, onDeleteMoc,
}: {
  mocs: Moc[]; tasks: CongViec[]; nameOf: (u: string | null) => string;
  onEdit: (t: CongViec) => void;
  canAdd: boolean; onAddIn: (mocId: string) => void;
  isManager: boolean;
  onDeleteMoc: (m: Moc) => void;
}) {
  if (mocs.length === 0) {
    return <Card><CardContent className="py-8 text-center text-slate-500 text-sm">Chưa có mốc nào. Người quản lý hãy thêm mốc chính đầu tiên.</CardContent></Card>;
  }
  return (
    <div className="space-y-3">
      {mocs.map((m) => {
        const list = tasks.filter((t) => t.moc_id === m.id);
        const tt = CV_TRANG_THAI[m.trang_thai] ?? CV_TRANG_THAI.chua_bat_dau;
        return (
          <Card key={m.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-base">{m.ten}</CardTitle>
                  {m.mo_ta && <CardDescription>{m.mo_ta}</CardDescription>}
                  <div className="text-[11px] text-slate-500 mt-1">
                    {m.ngay_bat_dau ?? "—"} → {m.ngay_ket_thuc_du_kien ?? "—"} · {list.length} công việc
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={tt.tone}>{tt.label}</Badge>
                  {canAdd && (
                    <Button size="sm" variant="outline" onClick={() => onAddIn(m.id)}>
                      <Plus className="h-4 w-4 mr-1" />CV con
                    </Button>
                  )}
                  {isManager && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" aria-label="Xoá">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xoá mốc "{m.ten}"?</AlertDialogTitle>
                          <AlertDialogDescription>Toàn bộ công việc con thuộc mốc sẽ bị xoá.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Huỷ</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteMoc(m)} className="bg-rose-600 hover:bg-rose-700">
                            Xoá
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {list.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">Chưa có công việc con.</div>
              ) : (
                <div className="divide-y">
                  {list.map((t) => {
                    const c = CV_TRANG_THAI[t.trang_thai];
                    return (
                      <button
                        key={t.id}
                        onClick={() => onEdit(t)}
                        className="w-full text-left py-2 grid grid-cols-12 gap-2 hover:bg-slate-50 rounded px-2"
                      >
                        <div className="col-span-5 min-w-0">
                          <div className="font-medium text-sm truncate">{t.ten}</div>
                          {t.mo_ta && <div className="text-[11px] text-slate-500 truncate">{t.mo_ta}</div>}
                        </div>
                        <div className="col-span-2 text-xs text-slate-600 truncate flex items-center gap-1">
                          <UserIcon className="h-3 w-3 shrink-0" />{nameOf(t.nguoi_xu_ly_chinh)}
                        </div>
                        <div className="col-span-2 text-xs text-slate-500 flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />{t.ngay_ket_thuc_du_kien ?? "—"}
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <Progress value={t.tien_do} className="h-1.5 flex-1" />
                          <span className="text-[11px] text-slate-500 tabular-nums">{t.tien_do}%</span>
                        </div>
                        <div className="col-span-1 text-right">
                          <Badge variant="outline" className={cn(c.tone, "text-[10px]")}>{c.label}</Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// =====================================================
// DIALOGS
// =====================================================
function CreateMocDialog({
  open, onOpenChange, duAnId, currentUserId, onDone,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  duAnId: string; currentUserId: string; onDone: () => void;
}) {
  const [form, setForm] = useState({ ten: "", mo_ta: "", ngay_bat_dau: "", ngay_ket_thuc_du_kien: "" });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.ten.trim()) throw new Error("Cần nhập tên mốc");
      const { error } = await supabase.from("du_an_moc").insert({
        du_an_id: duAnId,
        ten: form.ten.trim(),
        mo_ta: form.mo_ta.trim() || null,
        ngay_bat_dau: form.ngay_bat_dau || null,
        ngay_ket_thuc_du_kien: form.ngay_ket_thuc_du_kien || null,
        created_by: currentUserId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã thêm mốc chính");
      onOpenChange(false);
      setForm({ ten: "", mo_ta: "", ngay_bat_dau: "", ngay_ket_thuc_du_kien: "" });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm mốc công việc chính</DialogTitle>
          <DialogDescription>VD: Chuẩn bị đầu tư, LCNT, Ký hợp đồng…</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Tên mốc *</Label>
            <Input value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea rows={2} value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Bắt đầu</Label>
              <Input type="date" value={form.ngay_bat_dau} onChange={(e) => setForm({ ...form, ngay_bat_dau: e.target.value })} />
            </div>
            <div>
              <Label>Kết thúc dự kiến</Label>
              <Input type="date" value={form.ngay_ket_thuc_du_kien} onChange={(e) => setForm({ ...form, ngay_ket_thuc_du_kien: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCongViecDialog({
  open, onOpenChange, duAnId, mocs, defaultMocId, editing, currentUserId, onDone, isManager,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  duAnId: string; mocs: Moc[]; defaultMocId: string | null;
  editing: CongViec | null;
  currentUserId: string; onDone: () => void;
  isManager: boolean;
}) {
  const isEdit = !!editing;
  const [form, setForm] = useState({
    moc_id: "", ten: "", mo_ta: "",
    nguoi_xu_ly_chinh: "",
    ngay_bat_dau: "", ngay_ket_thuc_du_kien: "",
    trang_thai: "chua_bat_dau" as typeof CV_STATUSES[number],
    tien_do: 0,
    ket_qua: "",
  });

  const qc = useQueryClient();
  useEffect(() => {
    if (editing) {
      setForm({
        moc_id: editing.moc_id,
        ten: editing.ten,
        mo_ta: editing.mo_ta ?? "",
        nguoi_xu_ly_chinh: editing.nguoi_xu_ly_chinh ?? "",
        ngay_bat_dau: editing.ngay_bat_dau ?? "",
        ngay_ket_thuc_du_kien: editing.ngay_ket_thuc_du_kien ?? "",
        trang_thai: editing.trang_thai,
        tien_do: editing.tien_do,
        ket_qua: editing.ket_qua ?? "",
      });
    } else {
      setForm({
        moc_id: defaultMocId ?? "",
        ten: "", mo_ta: "",
        nguoi_xu_ly_chinh: "",
        ngay_bat_dau: "", ngay_ket_thuc_du_kien: "",
        trang_thai: "chua_bat_dau",
        tien_do: 0, ket_qua: "",
      });
    }
  }, [editing, defaultMocId, open]);

  // list of users (all profiles for assignment)
  const { data: users } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id,ho_ten,email").eq("active", true).order("ho_ten");
      return (data ?? []) as Profile[];
    },
  });

  // collaborators
  const { data: collabs } = useQuery({
    queryKey: ["cv-phoi-hop", editing?.id],
    queryFn: async () => {
      if (!editing) return [] as { user_id: string }[];
      const { data } = await supabase.from("du_an_cong_viec_phoi_hop").select("user_id").eq("cong_viec_id", editing.id);
      return data ?? [];
    },
    enabled: !!editing,
  });
  const collabIds = new Set((collabs ?? []).map((c) => c.user_id));

  const { data: capabilities } = useQuery({
    queryKey: ["cv-capabilities", editing?.id],
    queryFn: async () => {
      if (!editing) return { can_edit: true, can_delete: true };
      const { data, error } = await supabase.rpc("can_edit_cong_viec", { _cv_id: editing.id, _user: currentUserId });
      if (error) return { can_edit: false, can_delete: false };
      return { can_edit: !!data, can_delete: isManager }; // Simplified for now, real RPC might return object
    },
    enabled: !!editing,
  });

  const canEditTask = isManager || capabilities?.can_edit;
  const canDeleteTask = isManager || capabilities?.can_delete;

  const save = useMutation({
    mutationFn: async () => {
      if (!form.ten.trim()) throw new Error("Cần nhập tên công việc");
      if (!form.moc_id) throw new Error("Chọn mốc chính");
      const payload = {
        du_an_id: duAnId,
        moc_id: form.moc_id,
        ten: form.ten.trim(),
        mo_ta: form.mo_ta.trim() || null,
        nguoi_xu_ly_chinh: form.nguoi_xu_ly_chinh || null,
        ngay_bat_dau: form.ngay_bat_dau || null,
        ngay_ket_thuc_du_kien: form.ngay_ket_thuc_du_kien || null,
        trang_thai: form.trang_thai,
        tien_do: Math.max(0, Math.min(100, form.tien_do)),
        ket_qua: form.ket_qua.trim() || null,
        ngay_hoan_thanh_thuc_te:
          form.trang_thai === "hoan_thanh"
            ? (editing?.ngay_hoan_thanh_thuc_te ?? getTodayDateString())
            : null,
      };
      if (isEdit && editing) {
        const { error } = await supabase.from("du_an_cong_viec").update(payload).eq("id", editing.id);
        if (error) throw error;
        return editing.id;
      } else {
        const { data, error } = await supabase.from("du_an_cong_viec")
          .insert({ ...payload, created_by: currentUserId }).select("id").single();
        if (error) throw error;
        return data.id as string;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Đã cập nhật" : "Đã thêm công việc");
      onOpenChange(false);
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await supabase.from("du_an_cong_viec").delete().eq("id", editing.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã xoá"); onOpenChange(false); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleCollab = useMutation({
    mutationFn: async (userId: string) => {
      if (!editing) return;
      if (collabIds.has(userId)) {
        const { error } = await supabase.from("du_an_cong_viec_phoi_hop").delete()
          .eq("cong_viec_id", editing.id).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("du_an_cong_viec_phoi_hop").insert({
          cong_viec_id: editing.id, user_id: userId, added_by: currentUserId,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      onDone();
      if (editing) {
        qc.invalidateQueries({ queryKey: ["cv-phoi-hop", editing.id] });
        qc.invalidateQueries({ queryKey: ["du-an-cv", duAnId] });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Cập nhật công việc" : "Thêm công việc con"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Cập nhật tiến độ, kết quả thực hiện và người phối hợp." : "VD: Khảo sát và lập báo cáo khảo sát, Lập BCKTKT…"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-3">
            <div>
              <Label>Mốc chính *</Label>
              <Combobox
                value={form.moc_id}
                onChange={(v) => setForm({ ...form, moc_id: v })}
                placeholder="Chọn mốc"
                searchPlaceholder="Tìm mốc…"
                options={mocs?.map((m) => ({ value: m.id, label: m.ten })) ?? []}
              />
            </div>
            <div className="col-span-2">
              <Label>Tên công việc *</Label>
              <Input value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Mô tả</Label>
            <Textarea rows={2} value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Người xử lý chính</Label>
              <Combobox
                value={form.nguoi_xu_ly_chinh || "__none__"}
                onChange={(v) => setForm({ ...form, nguoi_xu_ly_chinh: v === "__none__" ? "" : v })}
                placeholder="— chọn —"
                searchPlaceholder="Tìm người…"
                options={[{ value: "__none__", label: "— chưa gán —" }, ...(users ?? []).map((u) => ({ value: u.id, label: u.ho_ten ?? u.email ?? u.id }))]}
              />
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={form.trang_thai} onValueChange={(v) => setForm({ ...form, trang_thai: v as typeof CV_STATUSES[number] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CV_STATUSES.map((s) => <SelectItem key={s} value={s}>{CV_TRANG_THAI[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-3">
            <div>
              <Label>Bắt đầu</Label>
              <Input type="date" value={form.ngay_bat_dau} onChange={(e) => setForm({ ...form, ngay_bat_dau: e.target.value })} />
            </div>
            <div>
              <Label>Hạn hoàn thành</Label>
              <Input type="date" value={form.ngay_ket_thuc_du_kien} onChange={(e) => setForm({ ...form, ngay_ket_thuc_du_kien: e.target.value })} />
            </div>
            <div>
              <Label>Tiến độ (%)</Label>
              <Input type="number" min={0} max={100} value={form.tien_do} onChange={(e) => setForm({ ...form, tien_do: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label>Kết quả thực hiện</Label>
            <Textarea rows={3} value={form.ket_qua} onChange={(e) => setForm({ ...form, ket_qua: e.target.value })}
              placeholder="Ghi chú kết quả, tài liệu, liên kết…" />
          </div>

          {isEdit && (
            <div>
              <Label className="flex items-center gap-1.5"><Users className="h-4 w-4" />Người phối hợp</Label>
              <div className="mt-2 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded border bg-slate-50">
                {(users ?? []).filter((u) => u.id !== form.nguoi_xu_ly_chinh).map((u) => {
                  const on = collabIds.has(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleCollab.mutate(u.id)}
                      className={cn(
                        "text-xs px-2 py-1 rounded-full border transition",
                        on ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:border-indigo-300",
                      )}
                    >
                      {u.ho_ten ?? u.email}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isEdit && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-rose-600 mr-auto">
                  <Trash2 className="h-4 w-4 mr-1.5" /> Xoá
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xoá công việc?</AlertDialogTitle>
                  <AlertDialogDescription>Hành động không thể hoàn tác.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Huỷ</AlertDialogCancel>
                  <AlertDialogAction onClick={() => del.mutate()} className="bg-rose-600 hover:bg-rose-700">Xoá</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isEdit ? "Lưu" : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
