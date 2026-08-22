import { PageHeader } from "@/components/mirats/PageHeader";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Package,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
  ClipboardCheck,
  Plus,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StandardTable } from "@/components/mirats/StandardTable";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import {
  useKhoList,
  useVatTuList,
  useTonKho,
  useTonKhoCanhBao,
  useGiaoDich,
  useModelOptions,
  useNccOptions,
  useDonViOptions,
  useTaoKho,
  useTaoVatTu,
  useKhoNhap,
  useKhoXuat,
  useKhoChuyen,
  useKhoKiemKe,
  LOAI_VAT_TU_META,
  LOAI_GD_META,
  type LoaiVatTu,
  type VatTuRow,
  type KhoRow,
} from "@/lib/mirats/kho";
import { DetailDrawer } from "@/components/mirats/DetailDrawer";
import { useDetailPanel } from "@/lib/mirats/ui/detail-panel";
import { InventoryDashboard } from "@/components/mirats/vat-tu/InventoryDashboard";
import { SparePartsTable } from "@/components/mirats/vat-tu/SparePartsTable";
import { StockMovementLog } from "@/components/mirats/vat-tu/StockMovementLog";

export const Route = createFileRoute("/_app/vat-tu")({
  head: () => ({
    meta: [
      { title: "Vật tư & Kho — MIRATS" },
      {
        name: "description",
        content:
          "Sổ cái kho vật tư: nhập, xuất, chuyển kho, kiểm kê. Tồn kho tính từ giao dịch, truy nguyên được, cảnh báo dưới định mức.",
      },
      { property: "og:title", content: "Vật tư & Kho — MIRATS" },
      {
        property: "og:description",
        content: "Quản lý tồn kho vật tư dự phòng và tiêu hao theo sổ cái bất biến.",
      },
    ],
  }),
  component: VatTuPage,
});

const fmt = (n: number) => new Intl.NumberFormat("vi-VN").format(n);

function VatTuPage() {
  const { hasRole, roles } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");

  const kho = useKhoList();
  const vatTu = useVatTuList();
  const ton = useTonKho();
  const canhBao = useTonKhoCanhBao();
  const giaoDich = useGiaoDich();

  const [q, setQ] = useState("");
  const [action, setAction] = useState<null | "nhap" | "xuat" | "chuyen" | "kiemke">(null);
  const [openKho, setOpenKho] = useState(false);
  const [openVatTu, setOpenVatTu] = useState(false);

  const canhBaoCount = canhBao.data?.length ?? 0;

  const detail = useDetailPanel();
  const vatTuById = useMemo(
    () => new Map((vatTu.data ?? []).map((v: VatTuRow) => [v.id, v] as const)),
    [vatTu.data],
  );
  const detailRow =
    detail.loai === "vat_tu" && detail.moId ? (vatTuById.get(detail.moId) ?? null) : null;

  const tonRows = useMemo(() => {
    const list = ton.data ?? [];
    const kw = q.trim().toLowerCase();
    if (!kw) return list;
    return list.filter(
      (r) =>
        r.ten_vat_tu.toLowerCase().includes(kw) ||
        (r.ma_vat_tu ?? "").toLowerCase().includes(kw) ||
        r.ten_kho.toLowerCase().includes(kw),
    );
  }, [ton.data, q]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <PageHeader
        icon={Package}
        title="Vật tư & Kho"
        help="Sổ cái kho vật tư: tồn kho luôn được tính từ các giao dịch nhập/xuất/chuyển/điều chỉnh (bất biến, truy nguyên được) — không sửa số tồn trực tiếp."
        actions={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => setAction("nhap")}>
                <PackagePlus className="h-4 w-4" /> Nhập
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAction("xuat")}>
                <PackageMinus className="h-4 w-4" /> Xuất
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAction("chuyen")}>
                <ArrowLeftRight className="h-4 w-4" /> Chuyển
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAction("kiemke")}>
                <ClipboardCheck className="h-4 w-4" /> Kiểm kê
              </Button>
            </div>
          ) : null
        }
      />

      <InventoryDashboard
        vatTuCount={vatTu.data?.length ?? 0}
        khoCount={kho.data?.length ?? 0}
        giaoDichCount={giaoDich.data?.length ?? 0}
        canhBaoCount={canhBaoCount}
      />

      <Tabs defaultValue="ton">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ton">Tồn kho</TabsTrigger>
          <TabsTrigger value="canhbao">
            Cảnh báo{" "}
            {canhBaoCount > 0 && (
              <span className="ml-1 rounded bg-red-100 px-1.5 text-[11px] text-red-700">
                {canhBaoCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="vattu">Danh mục vật tư</TabsTrigger>
          <TabsTrigger value="kho">Kho</TabsTrigger>
          <TabsTrigger value="soquy">Sổ giao dịch</TabsTrigger>
        </TabsList>

        <TabsContent value="ton" className="mt-4 space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm vật tư / kho…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
          <Card>
            <CardContent className="p-2">
              <SparePartsTable rows={tonRows} isLoading={ton.isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cảnh báo */}
        <TabsContent value="canhbao" className="mt-4">
          <Card>
            <CardContent className="p-2">
              <StandardTable
                tableKey="vat_tu_canhbao_list"
                rows={canhBao.data ?? []}
                getRowId={(r) => r.vat_tu_id}
                requireFilterToShow={false}
                emptyContent={
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Không có vật tư nào dưới định mức.
                  </div>
                }
                columns={[
                  {
                    key: "vat_tu",
                    label: "Vật tư",
                    filter: "text",
                    value: (r) => r.ten_vat_tu,
                    cell: (r) => (
                      <div>
                        <div className="font-medium">{r.ten_vat_tu}</div>
                        {r.ma_vat_tu && (
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {r.ma_vat_tu}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "loai",
                    label: "Loại",
                    filter: "cat",
                    hideBelow: "sm",
                    value: (r) => LOAI_VAT_TU_META[r.loai].label,
                    cell: (r) => <StatBadge loai={r.loai} />,
                  },
                  {
                    key: "tong_ton",
                    label: "Tổng tồn",
                    align: "right",
                    sortable: true,
                    value: (r) => r.tong_ton,
                    cell: (r) => (
                      <span className="text-right font-mono font-semibold text-red-600">
                        {fmt(r.tong_ton)} {r.don_vi_tinh}
                      </span>
                    ),
                  },
                  {
                    key: "dinh_muc",
                    label: "Định mức",
                    align: "right",
                    sortable: true,
                    hideBelow: "lg",
                    value: (r) => r.muc_ton_toi_thieu,
                    cell: (r) => (
                      <span className="text-right font-mono text-sm">
                        {fmt(r.muc_ton_toi_thieu)}
                      </span>
                    ),
                  },
                  {
                    key: "thieu",
                    label: "Thiếu",
                    align: "right",
                    sortable: true,
                    value: (r) => r.muc_ton_toi_thieu - r.tong_ton,
                    cell: (r) => (
                      <span className="text-right font-mono text-sm text-red-600">
                        {fmt(r.muc_ton_toi_thieu - r.tong_ton)}
                      </span>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danh mục vật tư */}
        <TabsContent value="vattu" className="mt-4 space-y-3">
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => setOpenVatTu(true)}>
              <Plus className="h-4 w-4" /> Thêm vật tư
            </Button>
          )}
          <Card>
            <CardContent className="p-2">
              <StandardTable
                tableKey="vat_tu_danhmuc_list"
                rows={vatTu.data ?? []}
                getRowId={(v) => v.id}
                requireFilterToShow={false}
                onRowClick={(v) => detail.open("vat_tu", v.id)}
                emptyContent={
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Chưa có vật tư. Thêm vật tư để bắt đầu.
                  </div>
                }
                columns={[
                  {
                    key: "ten",
                    label: "Tên",
                    filter: "text",
                    value: (v) => v.ten,
                    cell: (v) => (
                      <div>
                        <div className="font-medium">{v.ten}</div>
                        {v.ma_vat_tu && (
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {v.ma_vat_tu}
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "loai",
                    label: "Loại",
                    filter: "cat",
                    hideBelow: "sm",
                    value: (v) => LOAI_VAT_TU_META[v.loai].label,
                    cell: (v) => <StatBadge loai={v.loai} />,
                  },
                  {
                    key: "dvt",
                    label: "ĐVT",
                    hideBelow: "md",
                    value: (v) => v.don_vi_tinh,
                    cell: (v) => <span className="text-sm">{v.don_vi_tinh}</span>,
                  },
                  {
                    key: "don_gia",
                    label: "Đơn giá",
                    align: "right",
                    sortable: true,
                    hideBelow: "xl",
                    value: (v) => v.don_gia,
                    cell: (v) => (
                      <span className="text-right font-mono text-sm">{fmt(v.don_gia)}</span>
                    ),
                  },
                  {
                    key: "dinh_muc",
                    label: "Định mức",
                    align: "right",
                    sortable: true,
                    hideBelow: "lg",
                    value: (v) => v.muc_ton_toi_thieu,
                    cell: (v) => (
                      <span className="text-right font-mono text-sm">
                        {fmt(v.muc_ton_toi_thieu)}
                      </span>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kho */}
        <TabsContent value="kho" className="mt-4 space-y-3">
          {canManage && (
            <Button size="sm" variant="outline" onClick={() => setOpenKho(true)}>
              <Plus className="h-4 w-4" /> Thêm kho
            </Button>
          )}
          <Card>
            <CardContent className="p-2">
              <StandardTable
                tableKey="vat_tu_kho_list"
                rows={kho.data ?? []}
                getRowId={(k) => k.id}
                requireFilterToShow={false}
                emptyContent={
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Chưa có kho. Thêm kho để bắt đầu.
                  </div>
                }
                columns={[
                  {
                    key: "ten",
                    label: "Tên kho",
                    filter: "text",
                    value: (k) => k.ten,
                    cell: (k) => <span className="font-medium">{k.ten}</span>,
                  },
                  {
                    key: "ma_kho",
                    label: "Mã",
                    hideBelow: "sm",
                    value: (k) => k.ma_kho ?? "",
                    cell: (k) => (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {k.ma_kho ?? "—"}
                      </span>
                    ),
                  },
                  {
                    key: "ghi_chu",
                    label: "Ghi chú",
                    filter: "text",
                    hideBelow: "md",
                    value: (k) => k.ghi_chu ?? "",
                    cell: (k) => (
                      <span className="text-sm text-muted-foreground">{k.ghi_chu ?? "—"}</span>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sổ giao dịch */}
        <TabsContent value="soquy" className="mt-4">
          <Card>
            <CardContent className="p-2">
              <StockMovementLog rows={giaoDich.data ?? []} isLoading={giaoDich.isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {action && (
        <GiaoDichDialog
          action={action}
          onClose={() => setAction(null)}
          khoList={kho.data ?? []}
          vatTuList={vatTu.data ?? []}
        />
      )}
      {openKho && <KhoDialog onClose={() => setOpenKho(false)} />}
      {openVatTu && <VatTuDialog onClose={() => setOpenVatTu(false)} />}

      <DetailDrawer
        open={Boolean(detail.moId && detail.loai === "vat_tu")}
        onOpenChange={(v) => {
          if (!v) detail.close();
        }}
        loai="vat_tu"
        row={detailRow as Record<string, unknown> | null}
        roles={roles}
      />
    </div>
  );
}

function StatBadge({ loai }: { loai: LoaiVatTu }) {
  const m = LOAI_VAT_TU_META[loai];
  return (
    <Badge variant="outline" className={cn("border-transparent", m.cls)}>
      {m.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Dialog: nhập / xuất / chuyển / kiểm kê
// ---------------------------------------------------------------------------

function GiaoDichDialog({
  action,
  onClose,
  khoList,
  vatTuList,
}: {
  action: "nhap" | "xuat" | "chuyen" | "kiemke";
  onClose: () => void;
  khoList: KhoRow[];
  vatTuList: VatTuRow[];
}) {
  const nhap = useKhoNhap();
  const xuat = useKhoXuat();
  const chuyen = useKhoChuyen();
  const kiemKe = useKhoKiemKe();

  const [vatTuId, setVatTuId] = useState("");
  const [khoId, setKhoId] = useState("");
  const [khoDichId, setKhoDichId] = useState("");
  const [soLuong, setSoLuong] = useState("");
  const [donGia, setDonGia] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  const titles = {
    nhap: "Nhập kho",
    xuat: "Xuất kho",
    chuyen: "Chuyển kho",
    kiemke: "Kiểm kê (điều chỉnh tồn)",
  } as const;

  const busy = nhap.isPending || xuat.isPending || chuyen.isPending || kiemKe.isPending;

  async function submit() {
    const sl = Number(soLuong);
    if (!vatTuId || !khoId) {
      toast.error("Chọn vật tư và kho");
      return;
    }
    if (!Number.isFinite(sl) || sl < 0) {
      toast.error("Số lượng không hợp lệ");
      return;
    }
    if (action !== "kiemke" && sl <= 0) {
      toast.error("Số lượng phải > 0");
      return;
    }
    try {
      if (action === "nhap") {
        await nhap.mutateAsync({
          vatTuId,
          khoId,
          soLuong: sl,
          donGia: Number(donGia) || 0,
          ghiChu,
        });
      } else if (action === "xuat") {
        await xuat.mutateAsync({
          vatTuId,
          khoId,
          soLuong: sl,
          donGia: Number(donGia) || 0,
          ghiChu,
        });
      } else if (action === "chuyen") {
        if (!khoDichId) {
          toast.error("Chọn kho đích");
          return;
        }
        await chuyen.mutateAsync({ vatTuId, khoNguonId: khoId, khoDichId, soLuong: sl, ghiChu });
      } else {
        await kiemKe.mutateAsync({ vatTuId, khoId, soLuongThucTe: sl, ghiChu });
      }
      toast.success(`${titles[action]} thành công`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thao tác thất bại");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[action]}</DialogTitle>
          <DialogDescription>
            {action === "kiemke"
              ? "Nhập số lượng thực tế đếm được — hệ thống tự tạo bút toán điều chỉnh."
              : "Giao dịch được ghi vào sổ cái bất biến, tồn kho cập nhật tức thời."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Vật tư">
            <PickerSelect
              value={vatTuId}
              onChange={setVatTuId}
              placeholder="Chọn vật tư"
              items={vatTuList.map((v) => ({
                id: v.id,
                label: `${v.ten}${v.ma_vat_tu ? ` · ${v.ma_vat_tu}` : ""}`,
              }))}
            />
          </Field>
          <Field label={action === "chuyen" ? "Kho nguồn" : "Kho"}>
            <PickerSelect
              value={khoId}
              onChange={setKhoId}
              placeholder="Chọn kho"
              items={khoList.map((k) => ({ id: k.id, label: k.ten }))}
            />
          </Field>
          {action === "chuyen" && (
            <Field label="Kho đích">
              <PickerSelect
                value={khoDichId}
                onChange={setKhoDichId}
                placeholder="Chọn kho đích"
                items={khoList
                  .filter((k) => k.id !== khoId)
                  .map((k) => ({ id: k.id, label: k.ten }))}
              />
            </Field>
          )}
          <Field label={action === "kiemke" ? "Số lượng thực tế" : "Số lượng"}>
            <Input
              type="number"
              min={0}
              value={soLuong}
              onChange={(e) => setSoLuong(e.target.value)}
            />
          </Field>
          {(action === "nhap" || action === "xuat") && (
            <Field label="Đơn giá (tuỳ chọn)">
              <Input
                type="number"
                min={0}
                value={donGia}
                onChange={(e) => setDonGia(e.target.value)}
              />
            </Field>
          )}
          <Field label="Ghi chú">
            <Input
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Lý do / tham chiếu…"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {titles[action]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KhoDialog({ onClose }: { onClose: () => void }) {
  const tao = useTaoKho();
  const donVi = useDonViOptions();
  const [ten, setTen] = useState("");
  const [maKho, setMaKho] = useState("");
  const [donViId, setDonViId] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  async function submit() {
    if (!ten.trim()) {
      toast.error("Nhập tên kho");
      return;
    }
    try {
      await tao.mutateAsync({
        ten: ten.trim(),
        ma_kho: maKho || null,
        don_vi_id: donViId || null,
        ghi_chu: ghiChu || null,
      });
      toast.success("Đã thêm kho");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thất bại");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm kho</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Tên kho">
            <Input value={ten} onChange={(e) => setTen(e.target.value)} />
          </Field>
          <Field label="Mã kho (tuỳ chọn)">
            <Input value={maKho} onChange={(e) => setMaKho(e.target.value)} />
          </Field>
          <Field label="Đơn vị quản lý">
            <PickerSelect
              value={donViId}
              onChange={setDonViId}
              placeholder="Chọn đơn vị"
              items={donVi.data ?? []}
            />
          </Field>
          <Field label="Ghi chú">
            <Input value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={tao.isPending}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={tao.isPending}>
            {tao.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VatTuDialog({ onClose }: { onClose: () => void }) {
  const tao = useTaoVatTu();
  const models = useModelOptions();
  const ncc = useNccOptions();
  const donVi = useDonViOptions();
  const [ten, setTen] = useState("");
  const [maVatTu, setMaVatTu] = useState("");
  const [loai, setLoai] = useState<LoaiVatTu>("DU_PHONG");
  const [dvt, setDvt] = useState("cái");
  const [donGia, setDonGia] = useState("");
  const [dinhMuc, setDinhMuc] = useState("");
  const [modelId, setModelId] = useState("");
  const [nccId, setNccId] = useState("");
  const [donViId, setDonViId] = useState("");

  async function submit() {
    if (!ten.trim()) {
      toast.error("Nhập tên vật tư");
      return;
    }
    try {
      await tao.mutateAsync({
        ten: ten.trim(),
        ma_vat_tu: maVatTu || null,
        loai,
        don_vi_tinh: dvt || "cái",
        don_gia: Number(donGia) || 0,
        muc_ton_toi_thieu: Number(dinhMuc) || 0,
        model_id: modelId || null,
        nha_cung_cap_id: nccId || null,
        don_vi_id: donViId || null,
      });
      toast.success("Đã thêm vật tư");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Thất bại");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm vật tư</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tên vật tư" full>
            <Input value={ten} onChange={(e) => setTen(e.target.value)} />
          </Field>
          <Field label="Mã (tuỳ chọn)">
            <Input value={maVatTu} onChange={(e) => setMaVatTu(e.target.value)} />
          </Field>
          <Field label="Loại">
            <Select value={loai} onValueChange={(v) => setLoai(v as LoaiVatTu)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DU_PHONG">Dự phòng</SelectItem>
                <SelectItem value="TIEU_HAO">Tiêu hao</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Đơn vị tính">
            <Input value={dvt} onChange={(e) => setDvt(e.target.value)} />
          </Field>
          <Field label="Đơn giá">
            <Input
              type="number"
              min={0}
              value={donGia}
              onChange={(e) => setDonGia(e.target.value)}
            />
          </Field>
          <Field label="Mức tồn tối thiểu">
            <Input
              type="number"
              min={0}
              value={dinhMuc}
              onChange={(e) => setDinhMuc(e.target.value)}
            />
          </Field>
          <Field label="Model tương thích" full>
            <PickerSelect
              value={modelId}
              onChange={setModelId}
              placeholder="Không bắt buộc"
              items={models.data ?? []}
            />
          </Field>
          <Field label="Nhà cung cấp">
            <PickerSelect
              value={nccId}
              onChange={setNccId}
              placeholder="Không bắt buộc"
              items={ncc.data ?? []}
            />
          </Field>
          <Field label="Đơn vị">
            <PickerSelect
              value={donViId}
              onChange={setDonViId}
              placeholder="Không bắt buộc"
              items={donVi.data ?? []}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={tao.isPending}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={tao.isPending}>
            {tao.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", full && "col-span-2")}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PickerSelect({
  value,
  onChange,
  items,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { id: string; label: string }[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.length === 0 && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground">Không có dữ liệu</div>
        )}
        {items.map((it) => (
          <SelectItem key={it.id} value={it.id}>
            {it.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
