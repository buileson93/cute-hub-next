import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck, Loader2, RefreshCw, AlertTriangle, CheckCircle2, Copy, Fingerprint,
  Link2Off, FileWarning, GitCompareArrows, Timer, ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { PageHeader } from "@/components/mirats/PageHeader";
import { analyzeReviewQueue, type ReviewRowOut } from "@/lib/mirats/data-quality.functions";
import {
  CATEGORY_LABELS, SEVERITY_LABELS, type ReviewCategory, type ReviewSeverity,
} from "@/lib/mirats/data-quality";
import { ENTITIES } from "@/lib/mirats/import-config";

export const Route = createFileRoute("/_app/admin/review")({
  head: () => ({
    meta: [
      { title: "Trung tâm rà soát dữ liệu — MIRATS 2.0" },
      { name: "description", content: "Rà soát chất lượng dữ liệu nhập: trùng lặp, xung đột tham chiếu, thiếu dữ liệu và danh mục gần trùng." },
    ],
  }),
  component: ReviewConsole,
});

const ENTITY_OPTIONS: ComboOption[] = [
  { value: "", label: "Tất cả loại dữ liệu" },
  ...ENTITIES.map((e) => ({ value: e.id, label: e.label })),
  { value: "danh_muc", label: "Danh mục nền" },
];

const CATEGORY_ORDER: ReviewCategory[] = [
  "unprocessed", "possible_dup", "serial_dup", "fk_conflict", "missing", "near_catalog",
];

const CATEGORY_ICON: Record<ReviewCategory, typeof Copy> = {
  unprocessed: ShieldCheck,
  possible_dup: Copy,
  serial_dup: Fingerprint,
  fk_conflict: Link2Off,
  missing: FileWarning,
  near_catalog: GitCompareArrows,
};

function severityBadge(sev: ReviewSeverity) {
  const variant = sev === "error" ? "destructive" : sev === "needs_review" ? "secondary" : "outline";
  return <Badge variant={variant as any}>{SEVERITY_LABELS[sev]}</Badge>;
}

type Analysis = Awaited<ReturnType<typeof analyzeReviewQueue>>;

function ReviewConsole() {
  const analyze = useServerFn(analyzeReviewQueue);
  const [entity, setEntity] = useState("");
  const [donVi, setDonVi] = useState("");
  const [heThong, setHeThong] = useState("");
  const [batchId, setBatchId] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Analysis | null>(null);
  const [active, setActive] = useState<ReviewCategory>("possible_dup");
  const [donViOptions, setDonViOptions] = useState<ComboOption[]>([{ value: "", label: "Tất cả đơn vị" }]);
  const [batchOptions, setBatchOptions] = useState<ComboOption[]>([{ value: "", label: "Tất cả lô đang mở" }]);

  useEffect(() => {
    supabase.from("dm_don_vi").select("ma, ten").order("ma").limit(500).then(({ data: d }) => {
      setDonViOptions([
        { value: "", label: "Tất cả đơn vị" },
        ...((d ?? []).map((r: any) => ({ value: r.ma, label: `${r.ma} — ${r.ten}`, hint: r.ten }))),
      ]);
    });
    supabase.from("import_batch").select("id, file_name, status")
      .in("status", ["staged", "reviewing"]).order("created_at", { ascending: false }).limit(500)
      .then(({ data: d }) => {
        setBatchOptions([
          { value: "", label: "Tất cả lô đang mở" },
          ...((d ?? []).map((r: any) => ({ value: r.id, label: r.file_name || r.id, hint: r.status }))),
        ]);
      });
  }, []);

  const run = async () => {
    setBusy(true);
    try {
      const res = await analyze({ data: { entity: entity || undefined, donVi: donVi || undefined, heThong: heThong || undefined, batchId: batchId || undefined } });
      setData(res);
      // Chọn nhóm đầu tiên có dữ liệu để hiển thị ngay.
      const first = CATEGORY_ORDER.find((c) => (res.metrics.byCategory[c] ?? 0) > 0);
      if (first) setActive(first);
      toast.success(`Đã rà soát ${res.metrics.total} dòng của ${res.batchCount} lô (${res.elapsedMs} ms)`);
    } catch (e: any) {
      toast.error(e?.message ?? "Không rà soát được");
    } finally {
      setBusy(false);
    }
  };

  // Chạy một lần khi mount để nạp dữ liệu review ban đầu.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, []);

  const rows = useMemo(
    () => (data?.rows ?? []).filter((r) => r.category === active),
    [data, active],
  );

  const columns: StdColumn<ReviewRowOut>[] = useMemo(() => [
    { key: "severity", label: "Mức", minW: "min-w-[110px]", value: (r) => SEVERITY_LABELS[r.severity], cell: (r) => severityBadge(r.severity), filter: "cat" },
    { key: "entityLabel", label: "Loại", minW: "min-w-[130px]", value: (r) => r.entityLabel, filter: "cat" },
    { key: "keyValue", label: "Mã / Khóa", minW: "min-w-[150px]", value: (r) => r.keyValue, sticky: true, cell: (r) => <span className="font-medium">{r.keyValue || "—"}</span> },
    { key: "displayName", label: "Tên", minW: "min-w-[200px]", value: (r) => r.displayName, filter: "text" },
    { key: "donVi", label: "Đơn vị", minW: "min-w-[100px]", value: (r) => r.donVi, filter: "cat" },
    { key: "heThong", label: "Hệ thống", minW: "min-w-[130px]", value: (r) => r.heThong, filter: "cat" },
    { key: "reason", label: "Chẩn đoán", minW: "min-w-[260px]", value: (r) => r.reason },
    { key: "candidate", label: "Ứng viên khớp", minW: "min-w-[160px]", value: (r) => r.candidateLabel ?? "", cell: (r) => r.candidateCount > 0 ? <span>{r.candidateLabel ?? "?"}{r.candidateCount > 1 ? ` (+${r.candidateCount - 1})` : ""}</span> : <span className="text-muted-foreground">—</span> },
    { key: "batchName", label: "Lô", minW: "min-w-[150px]", value: (r) => r.batchName, filter: "cat" },
    { key: "rowIndex", label: "Dòng", minW: "min-w-[70px]", align: "right", value: (r) => r.rowIndex, sortable: true },
  ], []);

  const m = data?.metrics;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShieldCheck}
        title="Trung tâm rà soát dữ liệu"
        subtitle="Rà soát các lô nhập chưa xử lý."
        help={
          <>
            Rà soát các lô nhập chưa xử lý: có thể trùng, trùng serial, xung đột tham chiếu, thiếu dữ liệu, danh mục gần trùng. Chỉ xem &amp; phân loại — không tự sửa.
          </>
        }
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/nhap-lieu">Mở Nhập/Xuất hàng loạt <ExternalLink className="ml-1 h-4 w-4" /></Link>
          </Button>
        }
      />

      {/* Bộ lọc */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bộ lọc</CardTitle>
          <CardDescription>Lọc theo loại dữ liệu, đơn vị, hệ thống rồi rà soát lại.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-1">
            <Label>Loại dữ liệu</Label>
            <Combobox options={ENTITY_OPTIONS} value={entity} onChange={setEntity} placeholder="Tất cả loại dữ liệu" />
          </div>
          <div className="space-y-1">
            <Label>Lô nhập</Label>
            <Combobox options={batchOptions} value={batchId} onChange={setBatchId} placeholder="Tất cả lô đang mở" />
          </div>
          <div className="space-y-1">
            <Label>Đơn vị</Label>
            <Combobox options={donViOptions} value={donVi} onChange={setDonVi} placeholder="Tất cả đơn vị" />
          </div>
          <div className="space-y-1">
            <Label>Hệ thống (mã/tên)</Label>
            <Input value={heThong} onChange={(e) => setHeThong(e.target.value)} placeholder="Lọc theo hệ thống…" />
          </div>
          <div className="flex items-end">
            <Button onClick={run} disabled={busy} className="w-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Rà soát lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Số liệu tổng hợp */}
      {m && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard icon={CheckCircle2} label="An toàn (auto)" value={`${m.autoSafe}`} sub={`${(m.autoSafeRate * 100).toFixed(1)}%`} tone="text-emerald-600" />
          <MetricCard icon={AlertTriangle} label="Cần rà soát" value={`${m.needsReview}`} sub={`${(m.needsReviewRate * 100).toFixed(1)}%`} tone="text-amber-600" />
          <MetricCard icon={FileWarning} label="Lỗi" value={`${m.errors}`} sub={`${(m.errorRate * 100).toFixed(1)}%`} tone="text-destructive" />
          <MetricCard icon={RefreshCw} label="Lô đã hoàn tác" value={`${data?.rolledBackCount ?? 0}`} sub={`${data?.batchCount ?? 0} lô đang mở`} tone="text-muted-foreground" />
          <MetricCard icon={Timer} label="Thời gian xử lý" value={`${data?.elapsedMs ?? 0} ms`} sub={`${m.total} dòng`} tone="text-muted-foreground" />
        </div>
      )}

      {/* Tabs nhóm */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_ORDER.map((c) => {
          const Icon = CATEGORY_ICON[c];
          const count = m?.byCategory[c] ?? 0;
          return (
            <Button key={c} size="sm" variant={active === c ? "default" : "outline"} onClick={() => setActive(c)}>
              <Icon className="mr-1.5 h-4 w-4" />
              {CATEGORY_LABELS[c]}
              <Badge variant="secondary" className="ml-2">{count}</Badge>
            </Button>
          );
        })}
      </div>

      <StandardTable
        tableKey={`review-${active}`}
        columns={columns}
        rows={rows}
        getRowId={(r) => r.itemId}
        requireFilterToShow={false}
        emptyText={busy ? "Đang rà soát…" : "Không có dòng nào trong nhóm này."}
        countUnit="dòng"
      />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, tone }: { icon: typeof Copy; label: string; value: string; sub: string; tone: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className={`h-4 w-4 ${tone}`} /> {label}
        </div>
        <div className={`mt-1 text-2xl font-bold ${tone}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
