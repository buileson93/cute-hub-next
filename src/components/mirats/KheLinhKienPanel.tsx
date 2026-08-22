// ============================================================================
// KheLinhKienPanel — quản lý KHE LINH KIỆN của một tài sản (mô hình tầng 2).
//   - Danh sách khe + linh kiện đang "pin" (mã + serial) hoặc "Đang chờ để thay thế".
//   - NHỊP I: khai thêm / sửa / ngừng khe (chỉ admin/phòng KT).
//   - NHỊP II: lắp / tháo / thay thế linh kiện (RPC atomic) qua ngăn chi tiết.
// Song song với ThanhPhanChiTietDialog (tầng 1: hệ thống -> vị trí -> tài sản).
// ============================================================================
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Cpu,
  Clock,
  PackageOpen,
  Wrench,
  ArrowRightLeft,
  History,
  X,
  Pencil,
  Plus,
  Ban,
  ChevronRight,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/mirats/Combobox";
import {
  useKheLinhKien,
  useLinhKienRanh,
  useLapLinhKien,
  useThaoLinhKien,
  useThayTheLinhKien,
  useDieuChuyenLinhKien,
  useLuuKhe,
  useNgungKhe,
  useLyLichKhe,
  type KheLinhKienTree,
  type KheLinhKien,
} from "@/lib/mirats/thiet-bi-khe-linh-kien";
import { rankEligibleUnits } from "@/lib/mirats/khe-gan";

export function KheLinhKienPanel({
  thietBiId,
  canManage,
}: {
  thietBiId: string;
  canManage: boolean;
}) {
  const { data: khe = [], isLoading } = useKheLinhKien(thietBiId);
  const [selected, setSelected] = useState<KheLinhKienTree | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Khe linh kiện là "ổ cắm" cố định của tài sản. Linh kiện cụ thể được lắp/tháo vào khe và
          ghi vào lý lịch.
        </p>
        {canManage && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => setCreating(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Thêm khe
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải khe linh kiện…</p>
      ) : khe.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Tài sản chưa khai khe linh kiện nào.
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {khe.map((k) => (
            <li key={k.id}>
              <button
                type="button"
                onClick={() => setSelected(k)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
              >
                <Cpu className="h-4 w-4 shrink-0 text-violet-600" />
                <span className="font-medium">{k.ten}</span>
                <span className="font-mono text-xs text-muted-foreground">{k.ma_khe}</span>
                {k.trang_thai === "ngung" && (
                  <Badge variant="outline" className="border-muted-foreground/40">
                    Đã ngừng
                  </Badge>
                )}
                {k.trang_thai !== "ngung" && k.bat_buoc && (
                  <Badge variant="secondary">Bắt buộc</Badge>
                )}
                <span className="ml-auto flex items-center gap-2">
                  {k.linhKien ? (
                    <span className="flex items-center gap-1.5 text-xs">
                      <Badge variant="outline" className="font-mono font-normal">
                        {k.linhKien.ma_thiet_bi}
                      </Badge>
                      {k.linhKien.ma_serial && (
                        <span className="text-muted-foreground">SN {k.linhKien.ma_serial}</span>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <Clock className="h-3.5 w-3.5" /> Đang chờ để thay thế
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <KheChiTietSheet
          khe={khe.find((k) => k.id === selected.id) ?? selected}
          thietBiId={thietBiId}
          canManage={canManage}
          onClose={() => setSelected(null)}
        />
      )}
      {creating && <KheFormSheet thietBiId={thietBiId} onClose={() => setCreating(false)} />}
    </div>
  );
}

function KheChiTietSheet({
  khe,
  thietBiId,
  canManage,
  onClose,
}: {
  khe: KheLinhKienTree;
  thietBiId: string;
  canManage: boolean;
  onClose: () => void;
}) {
  const lk = khe.linhKien;
  const ngung = khe.trang_thai === "ngung";
  const [edit, setEdit] = useState(false);
  const [mode, setMode] = useState<null | "lap" | "thay" | "chuyen">(null);
  const [editKhe, setEditKhe] = useState(false);
  const ngungMut = useNgungKhe(thietBiId);

  if (editKhe) {
    return <KheFormSheet thietBiId={thietBiId} khe={khe} onClose={() => setEditKhe(false)} />;
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-2">
            <Cpu className="h-4 w-4 shrink-0 text-violet-600" />
            <span>{khe.ten}</span>
            {khe.ma_khe && (
              <span className="font-mono text-xs font-normal text-muted-foreground">
                {khe.ma_khe}
              </span>
            )}
            {ngung && (
              <Badge variant="outline" className="border-muted-foreground/40">
                Đã ngừng
              </Badge>
            )}
            {!ngung && khe.bat_buoc && <Badge variant="secondary">Bắt buộc</Badge>}
          </SheetTitle>
          <SheetDescription>
            Khe linh kiện là "ổ cắm" cố định của tài sản. Linh kiện cụ thể được lắp/tháo vào khe này
            và ghi vào lý lịch.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {khe.mo_ta && <p className="text-sm text-muted-foreground">{khe.mo_ta}</p>}

          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="h-7" onClick={() => setEditKhe(true)}>
                <Pencil className="mr-1 h-3.5 w-3.5" /> Sửa khe
              </Button>
              {!ngung && !lk && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-destructive"
                  disabled={ngungMut.isPending}
                  onClick={() =>
                    ngungMut.mutate(khe.id, {
                      onSuccess: () => {
                        toast.success("Đã ngừng khe");
                        onClose();
                      },
                      onError: (e) =>
                        toast.error(e instanceof Error ? e.message : "Không ngừng được khe"),
                    })
                  }
                >
                  <Ban className="mr-1 h-3.5 w-3.5" /> Ngừng khe
                </Button>
              )}
            </div>
          )}

          {/* Linh kiện đang được "pin" vào khe */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Linh kiện đang lắp
              </div>
              {canManage && !ngung && (
                <Button
                  size="sm"
                  variant={edit ? "secondary" : "outline"}
                  className="h-7"
                  onClick={() => {
                    setEdit((v) => !v);
                    setMode(null);
                  }}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" /> {edit ? "Xong" : "Chỉnh sửa"}
                </Button>
              )}
            </div>

            {lk ? (
              <div className="flex flex-wrap items-center gap-2">
                <Cpu className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="font-medium">{lk.ten_thiet_bi || lk.ma_thiet_bi}</span>
                <Badge variant="outline" className="gap-1 font-mono font-normal">
                  {lk.ma_thiet_bi}
                </Badge>
                {lk.ma_serial && (
                  <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
                    S/N {lk.ma_serial}
                  </Badge>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-2.5 py-2 text-sm text-amber-600">
                <Clock className="h-4 w-4 shrink-0" />
                Đang chờ để thay thế{khe.bat_buoc ? " (bắt buộc)" : ""}
              </div>
            )}
          </div>

          {/* Thao tác thay đổi linh kiện — chỉ khi bật Chỉnh sửa */}
          {canManage &&
            !ngung &&
            edit &&
            (mode === "chuyen" ? (
              <DieuChuyenLinhKienForm
                thietBiId={thietBiId}
                khe={khe}
                onDone={() => setMode(null)}
              />
            ) : mode ? (
              <ChangeLinhKienForm
                thietBiId={thietBiId}
                khe={khe}
                isReplace={mode === "thay"}
                onDone={() => setMode(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {lk ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setMode("thay")}>
                      <Wrench className="mr-1 h-3.5 w-3.5" /> Đổi linh kiện khác
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setMode("chuyen")}>
                      <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Điều chuyển sang khe khác
                    </Button>
                    <ThaoButton thietBiId={thietBiId} khe={khe} />
                  </>
                ) : (
                  <Button size="sm" onClick={() => setMode("lap")}>
                    <PackageOpen className="mr-1 h-3.5 w-3.5" /> Lắp linh kiện
                  </Button>
                )}
              </div>
            ))}

          {/* Lý lịch khe */}
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <History className="h-3.5 w-3.5" /> Lịch sử linh kiện đã lắp
            </div>
            <KheLichSu kheId={khe.id} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ThaoButton({ thietBiId, khe }: { thietBiId: string; khe: KheLinhKienTree }) {
  const thaoMut = useThaoLinhKien(thietBiId);
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={thaoMut.isPending}
      onClick={() =>
        thaoMut.mutate(
          { kheId: khe.id, lyDo: "tháo" },
          {
            onSuccess: () => toast.success(`Đã tháo linh kiện khỏi "${khe.ten}"`),
            onError: (e) =>
              toast.error(e instanceof Error ? e.message : "Không tháo được linh kiện"),
          },
        )
      }
    >
      <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Tháo
    </Button>
  );
}

function ChangeLinhKienForm({
  thietBiId,
  khe,
  isReplace,
  onDone,
}: {
  thietBiId: string;
  khe: KheLinhKienTree;
  isReplace: boolean;
  onDone: () => void;
}) {
  const { data: ranh = [], isLoading } = useLinhKienRanh();
  const lapMut = useLapLinhKien(thietBiId);
  const thayMut = useThayTheLinhKien(thietBiId);
  const [chon, setChon] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  const options = useMemo(
    () =>
      rankEligibleUnits(ranh, khe.loai_thiet_bi_yeu_cau).map((r) => ({
        value: r.id,
        label: `${r.ma_thiet_bi}${r.ten_thiet_bi ? " · " + r.ten_thiet_bi : ""}`,
        hint: [
          r.ma_serial ? "SN " + r.ma_serial : "",
          r.trang_thai_ten ?? "",
          r.khopLoai ? "" : "khác loại",
        ]
          .filter(Boolean)
          .join(" · "),
      })),
    [ranh, khe.loai_thiet_bi_yeu_cau],
  );

  const submit = () => {
    if (!chon) {
      toast.error("Chọn linh kiện");
      return;
    }
    const onSuccess = () => {
      toast.success(isReplace ? "Đã thay thế linh kiện" : "Đã lắp linh kiện");
      onDone();
    };
    const onError = (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Thao tác thất bại");
    if (isReplace) {
      thayMut.mutate({ kheId: khe.id, linhKienMoiId: chon, ghiChu }, { onSuccess, onError });
    } else {
      lapMut.mutate({ kheId: khe.id, linhKienId: chon, ghiChu }, { onSuccess, onError });
    }
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <Label>
          {isReplace ? "Thay thế bằng linh kiện" : "Lắp linh kiện"} ({options.length} đủ điều kiện)
        </Label>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onDone} aria-label="Nút">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải danh sách linh kiện rảnh…</p>
      ) : (
        <Combobox
          options={options}
          value={chon}
          onChange={setChon}
          placeholder="Chọn linh kiện…"
          searchPlaceholder="Tìm theo mã / tên / serial…"
          emptyText="Không có linh kiện rảnh đúng loại"
        />
      )}
      <div className="space-y-1">
        <Label>Ghi chú (tuỳ chọn)</Label>
        <Textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onDone}>
          Huỷ
        </Button>
        <Button size="sm" onClick={submit} disabled={lapMut.isPending || thayMut.isPending}>
          {isReplace ? "Thay thế" : "Lắp"}
        </Button>
      </div>
    </div>
  );
}

function DieuChuyenLinhKienForm({
  thietBiId,
  khe,
  onDone,
}: {
  thietBiId: string;
  khe: KheLinhKienTree;
  onDone: () => void;
}) {
  const { data: allKhe = [], isLoading } = useKheLinhKien(thietBiId);
  const chuyenMut = useDieuChuyenLinhKien(thietBiId);
  const [chon, setChon] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const lk = khe.linhKien;

  // Khe đích hợp lệ: cùng tài sản, đang hoạt động, còn trống, khác khe hiện tại.
  const options = useMemo(
    () =>
      allKhe
        .filter((k) => k.id !== khe.id && k.trang_thai !== "ngung" && !k.linhKien)
        .map((k) => ({
          value: k.id,
          label: `${k.ten}${k.ma_khe ? " · " + k.ma_khe : ""}`,
          hint: k.bat_buoc ? "Bắt buộc" : "",
        })),
    [allKhe, khe.id],
  );

  const submit = () => {
    if (!lk) {
      toast.error("Khe chưa có linh kiện để điều chuyển");
      return;
    }
    if (!chon) {
      toast.error("Chọn khe đích");
      return;
    }
    chuyenMut.mutate(
      { linhKienId: lk.linh_kien_id, kheMoiId: chon, ghiChu },
      {
        onSuccess: () => {
          toast.success("Đã điều chuyển linh kiện sang khe khác");
          onDone();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Điều chuyển thất bại"),
      },
    );
  };

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <Label>Điều chuyển sang khe khác ({options.length} khe trống)</Label>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onDone} aria-label="Nút">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      {lk && (
        <p className="text-xs text-muted-foreground">
          Linh kiện: <span className="font-mono">{lk.ma_thiet_bi}</span>
          {lk.ma_serial ? ` · SN ${lk.ma_serial}` : ""}
        </p>
      )}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải khe đích…</p>
      ) : (
        <Combobox
          options={options}
          value={chon}
          onChange={setChon}
          placeholder="Chọn khe đích…"
          searchPlaceholder="Tìm theo tên / mã khe…"
          emptyText="Không có khe trống nào khác trong tài sản"
        />
      )}
      <div className="space-y-1">
        <Label>Ghi chú (tuỳ chọn)</Label>
        <Textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2} />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onDone}>
          Huỷ
        </Button>
        <Button size="sm" onClick={submit} disabled={chuyenMut.isPending}>
          Điều chuyển
        </Button>
      </div>
    </div>
  );
}

function KheLichSu({ kheId }: { kheId: string }) {
  const { data = [], isLoading } = useLyLichKhe(kheId);
  if (isLoading) return <p className="text-xs text-muted-foreground">Đang tải lý lịch…</p>;
  if (data.length === 0)
    return <p className="text-xs text-muted-foreground">Chưa có lịch sử lắp đặt.</p>;
  const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString("vi-VN") : "nay");
  return (
    <ol className="space-y-1.5">
      {data.map((r) => (
        <li
          key={r.gan_id}
          className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-xs"
        >
          <Cpu className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono">{r.ma_thiet_bi}</span>
          {r.ma_serial && <span className="text-muted-foreground">SN {r.ma_serial}</span>}
          <span className="text-muted-foreground">
            · {fmt(r.tu_ngay)} → {fmt(r.den_ngay)}
          </span>
          <Badge variant={r.den_ngay ? "outline" : "secondary"} className="ml-auto">
            {r.den_ngay ? r.ly_do : "Đang lắp"}
          </Badge>
        </li>
      ))}
    </ol>
  );
}

// ---- NHỊP I: form khai/sửa khe --------------------------------------------
function KheFormSheet({
  thietBiId,
  khe,
  onClose,
}: {
  thietBiId: string;
  khe?: KheLinhKien;
  onClose: () => void;
}) {
  const luuMut = useLuuKhe(thietBiId);
  const [maKhe, setMaKhe] = useState(khe?.ma_khe ?? "");
  const [ten, setTen] = useState(khe?.ten ?? "");
  const [moTa, setMoTa] = useState(khe?.mo_ta ?? "");
  const [thuTu, setThuTu] = useState(khe?.thu_tu != null ? String(khe.thu_tu) : "");
  const [batBuoc, setBatBuoc] = useState(khe?.bat_buoc ?? false);

  const submit = () => {
    if (!maKhe.trim() || !ten.trim()) {
      toast.error("Nhập mã khe và tên khe");
      return;
    }
    luuMut.mutate(
      {
        ...(khe?.id ? { id: khe.id } : {}),
        thiet_bi_id: thietBiId,
        ma_khe: maKhe.trim(),
        ten: ten.trim(),
        mo_ta: moTa.trim() || null,
        thu_tu: thuTu.trim() ? Number(thuTu) : null,
        bat_buoc: batBuoc,
      },
      {
        onSuccess: () => {
          toast.success(khe ? "Đã cập nhật khe" : "Đã thêm khe");
          onClose();
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Lưu khe thất bại"),
      },
    );
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{khe ? "Sửa khe linh kiện" : "Thêm khe linh kiện"}</SheetTitle>
          <SheetDescription>
            Khai "ổ cắm" chức năng cố định của tài sản (nhịp cấu trúc).
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <div className="space-y-1">
            <Label>Mã khe *</Label>
            <Input
              value={maKhe}
              onChange={(e) => setMaKhe(e.target.value)}
              placeholder="VD: SLOT-1"
            />
          </div>
          <div className="space-y-1">
            <Label>Tên khe *</Label>
            <Input
              value={ten}
              onChange={(e) => setTen(e.target.value)}
              placeholder="VD: Card nguồn, Module thu phát…"
            />
          </div>
          <div className="space-y-1">
            <Label>Thứ tự</Label>
            <Input
              value={thuTu}
              onChange={(e) => setThuTu(e.target.value)}
              inputMode="numeric"
              placeholder="VD: 1"
            />
          </div>
          <div className="space-y-1">
            <Label>Mô tả</Label>
            <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-2.5">
            <Label htmlFor="khe-batbuoc" className="cursor-pointer">
              Bắt buộc phải có linh kiện
            </Label>
            <Switch id="khe-batbuoc" checked={batBuoc} onCheckedChange={setBatBuoc} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button size="sm" onClick={submit} disabled={luuMut.isPending}>
              {khe ? "Lưu" : "Thêm khe"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
