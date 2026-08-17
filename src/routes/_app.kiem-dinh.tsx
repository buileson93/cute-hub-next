// ============================================================================
// Task 48 — Danh sách Kiểm định & Hiệu chuẩn.
// Dùng StandardTable + ListToolbar + useListControls (Task 23/24).
// Dữ liệu từ useKdHcList (Task 47/48); chỉ trình bày, không thêm nguồn.
// ============================================================================
import { PageHeader } from "@/components/mirats/PageHeader";
import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { ListToolbar, type FilterDef } from "@/components/mirats/ListToolbar";
import { useListControls } from "@/lib/mirats/ui/use-list-controls";
import { locVaSapXep } from "@/lib/mirats/ui/list-controls";
import { ExpiringBadge } from "@/components/mirats/ExpiringBadge";
import { fmtNgay } from "@/lib/mirats/format";
import { useKdHcList, type KdHcRow } from "@/lib/mirats/db-chung-chi";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { DEFAULT_NGAY_SAP_HET_HAN } from "@/lib/mirats/han-canh-bao";

export const Route = createFileRoute("/_app/kiem-dinh")({
  head: () => ({
    meta: [
      { title: "Kiểm định & Hiệu chuẩn — MIRATS" },
      {
        name: "description",
        content:
          "Danh sách tài sản thuộc diện kiểm định / hiệu chuẩn kèm cảnh báo chứng chỉ sắp hết hạn.",
      },
    ],
  }),
  component: KiemDinhPage,
});

type TrangThaiHan = "chua" | "con" | "n30" | "n60" | "n90" | "qua";

function trangThaiCua(row: KdHcRow): TrangThaiHan {
  if (!row.cc || !row.cc.ngay_het_han) return "chua";
  const n = row.soNgay;
  if (n == null) return "chua";
  if (n < 0) return "qua";
  if (n <= 30) return "n30";
  if (n <= 60) return "n60";
  if (n <= 90) return "n90";
  return "con";
}

function KiemDinhPage() {
  const { data = [], isLoading, error } = useKdHcList();
  const { data: taxo } = useDbTaxonomy();
  const controls = useListControls({ kichThuoc: 25 });

  const donViMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const d of taxo?.donViList ?? []) m.set(d.id, d.ten);
    return m;
  }, [taxo]);
  const heThongMap = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const h of taxo?.htList ?? []) m.set(h.id, h.ten);
    return m;
  }, [taxo]);

  const filters: FilterDef[] = [
    {
      id: "loai",
      label: "Loại",
      options: [
        { value: "KIEM_DINH", label: "Kiểm định" },
        { value: "HIEU_CHUAN", label: "Hiệu chuẩn" },
      ],
    },
    {
      id: "trang_thai",
      label: "Trạng thái",
      options: [
        { value: "chua", label: "Chưa có chứng chỉ" },
        { value: "qua", label: "Đã hết hạn" },
        { value: "n30", label: "≤ 30 ngày" },
        { value: "n60", label: "≤ 60 ngày" },
        { value: "n90", label: "≤ 90 ngày" },
        { value: "con", label: "Còn hạn (>90 ngày)" },
      ],
    },
    {
      id: "don_vi",
      label: "Đơn vị",
      options: (taxo?.donViList ?? []).map((d) => ({ value: d.id, label: d.ten })),
    },
    {
      id: "he_thong",
      label: "Hệ thống",
      options: (taxo?.htList ?? []).map((h) => ({ value: h.id, label: h.ten })),
    },
  ];

  const { data: pageRows, tong } = locVaSapXep<KdHcRow>(data, controls.state, {
    timKiem: (r) =>
      `${r.ma_thiet_bi} ${r.ten_thiet_bi} ${r.model ?? ""} ${r.cc?.so_giay_chung_nhan ?? ""}`,
    loc: {
      loai: (r, v) => String(v ?? "") === "" || r.che_do === String(v),
      trang_thai: (r, v) => String(v ?? "") === "" || trangThaiCua(r) === String(v),
      don_vi: (r, v) => String(v ?? "") === "" || (r.don_vi_id ?? "") === String(v),
      he_thong: (r, v) => String(v ?? "") === "" || (r.he_thong_id ?? "") === String(v),
    },
    sort: {
      ma_thiet_bi: (a, b) => a.ma_thiet_bi.localeCompare(b.ma_thiet_bi, "vi"),
      ten_thiet_bi: (a, b) => a.ten_thiet_bi.localeCompare(b.ten_thiet_bi, "vi"),
      loai: (a, b) => a.che_do.localeCompare(b.che_do),
      ngay_het_han: (a, b) =>
        (a.cc?.ngay_het_han ?? "9999-12-31").localeCompare(b.cc?.ngay_het_han ?? "9999-12-31"),
    },
  });

  const soCanhBao = data.filter(
    (r) => r.daHetHan || (r.soNgay != null && r.soNgay <= DEFAULT_NGAY_SAP_HET_HAN),
  ).length;
  const soChua = data.filter((r) => !r.cc).length;

  const columns: StdColumn<KdHcRow>[] = [
    {
      key: "ma_thiet_bi", label: "Mã tài sản", sortable: true,
      value: (r) => r.ma_thiet_bi,
      cell: (r) => (
        <Link
          to="/thiet-bi/$maThietBi"
          params={{ maThietBi: r.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}
          className="font-mono text-primary hover:underline"
        >
          {r.ma_thiet_bi}
        </Link>
      ),
    },
    {
      key: "ten_thiet_bi", label: "Tên / Model", sortable: true,
      value: (r) => r.ten_thiet_bi,
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium">{r.ten_thiet_bi}</div>
          {r.model && <div className="truncate text-xs text-muted-foreground">{r.model}</div>}
        </div>
      ),
    },
    {
      key: "don_vi", label: "Đơn vị / Hệ thống", hideBelow: "md",
      value: (r) => `${donViMap.get(r.don_vi_id ?? "") ?? ""} ${heThongMap.get(r.he_thong_id ?? "") ?? ""}`,
      cell: (r) => (
        <div className="text-xs text-muted-foreground">
          <div>{donViMap.get(r.don_vi_id ?? "") ?? "—"}</div>
          <div>{heThongMap.get(r.he_thong_id ?? "") ?? "—"}</div>
        </div>
      ),
    },
    {
      key: "loai", label: "Loại", sortable: true, hideBelow: "sm",
      value: (r) => r.che_do,
      cell: (r) => (
        <Badge
          variant="outline"
          className={
            r.che_do === "KIEM_DINH"
              ? "bg-sky-50 text-sky-700 border-sky-200"
              : "bg-violet-50 text-violet-700 border-violet-200"
          }
        >
          {r.che_do === "KIEM_DINH" ? "KĐ" : "HC"}
        </Badge>
      ),
    },
    {
      key: "so_giay", label: "Số giấy chứng nhận",
      value: (r) => r.cc?.so_giay_chung_nhan ?? "",
      cell: (r) =>
        r.cc ? (
          <span className="font-mono text-sm">{r.cc.so_giay_chung_nhan}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground">Chưa có</span>
        ),
    },
    {
      key: "ngay_bat_dau", label: "Bắt đầu", hideBelow: "xl",
      value: (r) => r.cc?.ngay_bat_dau ?? "",
      cell: (r) => (r.cc?.ngay_bat_dau ? fmtNgay(r.cc.ngay_bat_dau) : "—"),
    },
    {
      key: "ngay_het_han", label: "Hết hạn", sortable: true, hideBelow: "xl",
      value: (r) => r.cc?.ngay_het_han ?? "",
      cell: (r) => (r.cc?.ngay_het_han ? fmtNgay(r.cc.ngay_het_han) : "—"),
    },
    {
      key: "canh_bao", label: "Cảnh báo", hideBelow: "2xl",
      value: (r) => (r.soNgay ?? ""),
      cell: (r) =>
        r.cc?.ngay_het_han ? (
          <ExpiringBadge soNgay={r.soNgay} />
        ) : (
          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
            —
          </Badge>
        ),
    },
    {
      key: "actions", label: "", align: "right",
      cell: (r) => (
        <Button asChild size="sm" variant="ghost">
          <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: r.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }}>
            <Eye className="mr-1 h-3.5 w-3.5" /> Xem
          </Link>
        </Button>
      ),
    },
  ];


  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <PageHeader
        icon={ShieldCheck}
        title="Kiểm định & Hiệu chuẩn"
        help="Theo dõi tài sản thuộc diện kiểm định/hiệu chuẩn, chứng chỉ đã cấp và cảnh báo trước ngày hết hạn."
      />


      <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Tài sản thuộc diện KĐ/HC
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Chưa có chứng chỉ
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-amber-600">{soChua}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Sắp / đã hết hạn ({DEFAULT_NGAY_SAP_HET_HAN} ngày)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">{soCanhBao}</CardContent>
        </Card>
      </div>

      <ListToolbar
        controls={controls}
        filters={filters}
        placeholder="Tìm mã tài sản / số giấy chứng nhận…"
      />

      <StandardTable<KdHcRow>
        tableKey="kiem_dinh_hieu_chuan"
        columns={columns}
        rows={pageRows}
        getRowId={(r) => r.thiet_bi_id}
        requireFilterToShow={false}
        hideReorderToggle
        emptyText="Không có tài sản nào thuộc diện KĐ/HC khớp bộ lọc."
        trangThai={{ dangTai: isLoading, loi: error ? String(error) : null }}
        pagination={{ controls, tong }}
      />

    </div>
  );
}
