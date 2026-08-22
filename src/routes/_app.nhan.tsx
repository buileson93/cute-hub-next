import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Search, Printer, Loader2, Check, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { cn } from "@/lib/utils";
import { useScope } from "@/lib/mirats/scope";
import { buildLabelUrl } from "@/lib/mirats/nhan-qr";

export const Route = createFileRoute("/_app/nhan")({
  head: () => ({
    meta: [
      { title: "In nhãn QR tài sản — MIRATS" },
      {
        name: "description",
        content:
          "Lọc tài sản theo đơn vị/hệ thống/trạng thái và in lưới nhãn QR theo khổ giấy chuẩn.",
      },
    ],
  }),
  component: NhanQrPage,
});

function noAccent(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

// ---------- Preset khổ tem ----------
type PresetId = "a4-30" | "a4-24" | "a4-40" | "thermal-40x20" | "thermal-60x40";
interface PresetDef {
  id: PresetId;
  ten: string;
  moTa: string;
  /** Kích thước một nhãn (mm) — dùng cho cả preview & in. */
  wMm: number;
  hMm: number;
  /** Số cột trên một trang khi in. */
  cols: number;
  /** Kích thước trang khi in (@page size). */
  pageSize: string;
  /** Kích thước QR trong nhãn (px @ 96dpi preview; in scale theo mm). */
  qrPx: number;
  /** Margin trang khi in. */
  pageMargin: string;
}

const PRESETS: PresetDef[] = [
  {
    id: "a4-30",
    ten: "A4 · 30 nhãn (3×10)",
    moTa: "70×30 mm",
    wMm: 70,
    hMm: 30,
    cols: 3,
    pageSize: "A4 portrait",
    qrPx: 68,
    pageMargin: "10mm",
  },
  {
    id: "a4-24",
    ten: "A4 · 24 nhãn (3×8)",
    moTa: "70×36 mm",
    wMm: 70,
    hMm: 36,
    cols: 3,
    pageSize: "A4 portrait",
    qrPx: 80,
    pageMargin: "10mm",
  },
  {
    id: "a4-40",
    ten: "A4 · 40 nhãn (4×10)",
    moTa: "48×25 mm",
    wMm: 48,
    hMm: 25,
    cols: 4,
    pageSize: "A4 portrait",
    qrPx: 56,
    pageMargin: "10mm",
  },
  {
    id: "thermal-40x20",
    ten: "Tem nhiệt 40×20",
    moTa: "1 nhãn / trang",
    wMm: 40,
    hMm: 20,
    cols: 1,
    pageSize: "40mm 20mm",
    qrPx: 48,
    pageMargin: "1mm",
  },
  {
    id: "thermal-60x40",
    ten: "Tem nhiệt 60×40",
    moTa: "1 nhãn / trang",
    wMm: 60,
    hMm: 40,
    cols: 1,
    pageSize: "60mm 40mm",
    qrPx: 88,
    pageMargin: "2mm",
  },
];

function NhanQrPage() {
  const { thietBi, heThong, viTri, donVi, loading } = useScope();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Bộ lọc
  const [donViMa, setDonViMa] = useState<string>("__all__");
  const [heThongMa, setHeThongMa] = useState<string>("__all__");
  const [nhomHT, setNhomHT] = useState<string>("__all__");
  const [trangThai, setTrangThai] = useState<string>("__all__");
  const [loaiTB, setLoaiTB] = useState<string>("__all__");
  const [viTriMa, setViTriMa] = useState<string>("__all__");

  // Preset + tuỳ chọn nhãn
  const [presetId, setPresetId] = useState<PresetId>("a4-30");
  const [showName, setShowName] = useState(true);
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]!;

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // Danh sách gợi ý cho bộ lọc — chỉ lấy giá trị thực sự có trong thietBi.
  const opts = useMemo(() => {
    const set = <K extends keyof (typeof thietBi)[number]>(k: K) => {
      const s = new Set<string>();
      thietBi.forEach((t) => {
        const v = t[k];
        if (typeof v === "string" && v.trim()) s.add(v);
      });
      return Array.from(s).sort();
    };
    return {
      donVi: set("don_vi"),
      heThong: set("he_thong"),
      nhomHT: set("nhom_he_thong"),
      loai: set("loai"),
      trangThai: set("trang_thai"),
      viTri: set("vi_tri"),
    };
  }, [thietBi]);

  const donViTen = (ma: string) => donVi.find((d) => d.ma === ma)?.ten ?? ma;
  const heThongTen = (ma: string) => heThong.find((h) => h.ma === ma)?.ten ?? ma;
  const viTriTen = (ma: string) => viTri.find((v) => v.ma === ma)?.ten ?? ma;

  const filtered = useMemo(() => {
    const key = noAccent(q.trim());
    return thietBi.filter((t) => {
      if (donViMa !== "__all__" && t.don_vi !== donViMa) return false;
      if (heThongMa !== "__all__" && t.he_thong !== heThongMa) return false;
      if (nhomHT !== "__all__" && t.nhom_he_thong !== nhomHT) return false;
      if (trangThai !== "__all__" && t.trang_thai !== trangThai) return false;
      if (loaiTB !== "__all__" && t.loai !== loaiTB) return false;
      if (viTriMa !== "__all__" && t.vi_tri !== viTriMa) return false;
      if (key && !noAccent(`${t.ma_thiet_bi} ${t.ten} ${t.serial ?? ""}`).includes(key))
        return false;
      return true;
    });
  }, [thietBi, q, donViMa, heThongMa, nhomHT, trangThai, loaiTB, viTriMa]);

  const shown = filtered.slice(0, 500);

  const selectedDevices = useMemo(
    () => thietBi.filter((t) => selected.has(t.ma_thiet_bi)),
    [thietBi, selected],
  );

  const activeFilters: { key: string; label: string; clear: () => void }[] = [
    donViMa !== "__all__" && {
      key: "dv",
      label: `Đơn vị: ${donViTen(donViMa)}`,
      clear: () => setDonViMa("__all__"),
    },
    heThongMa !== "__all__" && {
      key: "ht",
      label: `Hệ thống: ${heThongTen(heThongMa)}`,
      clear: () => setHeThongMa("__all__"),
    },
    nhomHT !== "__all__" && {
      key: "nht",
      label: `Nhóm HT: ${nhomHT}`,
      clear: () => setNhomHT("__all__"),
    },
    trangThai !== "__all__" && {
      key: "tt",
      label: `Trạng thái: ${trangThai}`,
      clear: () => setTrangThai("__all__"),
    },
    loaiTB !== "__all__" && {
      key: "lo",
      label: `Loại: ${loaiTB}`,
      clear: () => setLoaiTB("__all__"),
    },
    viTriMa !== "__all__" && {
      key: "vt",
      label: `Vị trí: ${viTriTen(viTriMa)}`,
      clear: () => setViTriMa("__all__"),
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const resetFilters = () => {
    setDonViMa("__all__");
    setHeThongMa("__all__");
    setNhomHT("__all__");
    setTrangThai("__all__");
    setLoaiTB("__all__");
    setViTriMa("__all__");
    setQ("");
  };

  const toggle = (ma: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ma)) next.delete(ma);
      else next.add(ma);
      return next;
    });

  const selectAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      shown.forEach((t) => next.add(t.ma_thiet_bi));
      return next;
    });

  const selectAllMatching = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((t) => next.add(t.ma_thiet_bi));
      return next;
    });

  const clearAll = () => setSelected(new Set());

  // Inject @page size + grid template theo preset (dùng khi in).
  useEffect(() => {
    const styleId = "nhan-qr-print-preset";
    let el = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = styleId;
      document.head.appendChild(el);
    }
    el.textContent = `
      @media print {
        @page { size: ${preset.pageSize}; margin: ${preset.pageMargin}; }
        .print-only.label-grid {
          grid-template-columns: repeat(${preset.cols}, ${preset.wMm}mm) !important;
          gap: 2mm !important;
          justify-content: center;
        }
        .print-only .label-card {
          width: ${preset.wMm}mm;
          height: ${preset.hMm}mm;
          padding: 1.5mm !important;
          overflow: hidden;
        }
      }
    `;
    return () => {
      // Không xoá khi unmount trang khác — để nếu người dùng in nhanh vẫn ổn.
    };
  }, [preset]);

  return (
    <div className="flex w-full flex-col gap-4 p-4 md:p-6">
      {/* Thanh công cụ — ẩn khi in */}
      <div className="no-print flex flex-col gap-4">
        <PageHeader
          icon={QrCode}
          title="In nhãn QR tài sản"
          help={
            <>
              Lọc tài sản → chọn nhãn → chọn khổ tem → bấm <b>In nhãn</b>. QR chỉ chứa link dạng{" "}
              <code className="mx-1 rounded bg-secondary px-1 text-[11px]">/q/&lt;mã&gt;</code>{" "}
              (không rò rỉ tên/đơn vị/model).
            </>
          }
        />

        {/* Bộ lọc */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Filter className="h-4 w-4" /> Bộ lọc tài sản
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                Khớp {filtered.length.toLocaleString("vi-VN")} tài sản
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <FilterSelect
              label="Đơn vị"
              value={donViMa}
              onChange={setDonViMa}
              options={opts.donVi.map((ma) => ({ value: ma, label: donViTen(ma), hint: ma }))}
            />
            <FilterSelect
              label="Nhóm hệ thống"
              value={nhomHT}
              onChange={setNhomHT}
              options={opts.nhomHT.map((v) => ({ value: v, label: v }))}
            />
            <FilterSelect
              label="Hệ thống"
              value={heThongMa}
              onChange={setHeThongMa}
              options={opts.heThong.map((ma) => ({ value: ma, label: heThongTen(ma), hint: ma }))}
            />
            <FilterSelect
              label="Trạng thái"
              value={trangThai}
              onChange={setTrangThai}
              options={opts.trangThai.map((v) => ({ value: v, label: v }))}
            />
            <FilterSelect
              label="Loại tài sản"
              value={loaiTB}
              onChange={setLoaiTB}
              options={opts.loai.map((v) => ({ value: v, label: v }))}
            />
            <FilterSelect
              label="Vị trí"
              value={viTriMa}
              onChange={setViTriMa}
              options={opts.viTri.map((ma) => ({ value: ma, label: viTriTen(ma), hint: ma }))}
            />
            {activeFilters.length > 0 && (
              <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Đang lọc:</span>
                {activeFilters.map((f) => (
                  <Badge key={f.key} variant="secondary" className="gap-1">
                    {f.label}
                    <button
                      type="button"
                      onClick={f.clear}
                      aria-label="Bỏ lọc"
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="ml-auto h-7 px-2 text-xs"
                >
                  Đặt lại
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          {/* Cột chọn tài sản */}
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Chọn tài sản</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Đã chọn {selected.size}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm mã, tên, serial…"
                  className="pl-8"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                  <Check className="mr-1 h-3.5 w-3.5" /> Chọn hiện ({shown.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllMatching}
                  disabled={filtered.length === shown.length}
                  title="Chọn toàn bộ tài sản khớp bộ lọc"
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Chọn tất cả ({filtered.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={selected.size === 0}
                  className="col-span-2"
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Bỏ chọn hết
                </Button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
                </div>
              ) : (
                <>
                  {filtered.length > shown.length && (
                    <p className="text-[11px] text-muted-foreground">
                      Hiển thị {shown.length}/{filtered.length}. Thu hẹp bộ lọc để thấy đủ hoặc dùng
                      “Chọn tất cả”.
                    </p>
                  )}
                  <ScrollArea className="h-[52vh] rounded-md border">
                    <ul className="divide-y divide-border">
                      {shown.map((t) => {
                        const on = selected.has(t.ma_thiet_bi);
                        return (
                          <li key={t.ma_thiet_bi}>
                            <label
                              className={cn(
                                "flex cursor-pointer items-start gap-2.5 px-3 py-2 transition-colors hover:bg-secondary/60",
                                on && "bg-primary/5",
                              )}
                            >
                              <Checkbox
                                checked={on}
                                onCheckedChange={() => toggle(t.ma_thiet_bi)}
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium">{t.ten}</div>
                                <div className="truncate font-mono text-[11px] text-muted-foreground">
                                  {t.ma_thiet_bi}
                                </div>
                              </div>
                            </label>
                          </li>
                        );
                      })}
                      {shown.length === 0 && (
                        <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                          Không tìm thấy tài sản khớp bộ lọc.
                        </li>
                      )}
                    </ul>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cột xem trước */}
          <Card className="flex flex-col">
            <CardHeader className="space-y-3 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm">Xem trước nhãn ({selectedDevices.length})</CardTitle>
                <Button
                  size="sm"
                  onClick={() => window.print()}
                  disabled={selectedDevices.length === 0}
                >
                  <Printer className="mr-1.5 h-4 w-4" /> In nhãn
                </Button>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                  <Label className="mb-1 block text-xs text-muted-foreground">Khổ tem</Label>
                  <Select value={presetId} onValueChange={(v) => setPresetId(v as PresetId)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESETS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="font-medium">{p.ten}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{p.moTa}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-xs">
                  <Switch checked={showName} onCheckedChange={setShowName} />
                  Hiển thị tên rút gọn
                </label>
              </div>
            </CardHeader>
            <CardContent>
              {selectedDevices.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
                  <QrCode className="h-6 w-6 opacity-50" />
                  Chọn tài sản bên trái để tạo nhãn.
                </div>
              ) : (
                <div
                  className="label-grid"
                  style={{
                    gridTemplateColumns: `repeat(auto-fill, minmax(${preset.wMm * 3.5}px, 1fr))`,
                  }}
                >
                  {selectedDevices.map((t) => (
                    <LabelCard
                      key={t.ma_thiet_bi}
                      ma={t.ma_thiet_bi}
                      ten={t.ten}
                      url={buildLabelUrl(origin, t.ma_thiet_bi)}
                      qrPx={preset.qrPx}
                      showName={showName}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vùng in: chỉ hiện khi in, chứa toàn bộ lưới nhãn */}
      <div className="print-only label-grid">
        {selectedDevices.map((t) => (
          <LabelCard
            key={t.ma_thiet_bi}
            ma={t.ma_thiet_bi}
            ten={t.ten}
            url={buildLabelUrl(origin, t.ma_thiet_bi)}
            qrPx={preset.qrPx}
            showName={showName}
          />
        ))}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
}) {
  return (
    <div>
      <Label className="mb-1 block text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder={`Tất cả ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Tất cả</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <span className="truncate">{o.label}</span>
              {o.hint && o.hint !== o.label && (
                <span className="ml-2 text-[11px] text-muted-foreground">{o.hint}</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LabelCard({
  ma,
  ten,
  url,
  qrPx,
  showName,
}: {
  ma: string;
  ten: string;
  url: string;
  qrPx: number;
  showName: boolean;
}) {
  const tenRutGon = ten.length > 24 ? `${ten.slice(0, 23)}…` : ten;
  return (
    <div className="label-card flex items-center gap-2 rounded-md border bg-white p-2 text-slate-900">
      <div className="shrink-0 rounded border border-slate-200 bg-white p-0.5">
        <QRCodeSVG value={url} size={qrPx} level="M" />
      </div>
      <div className="min-w-0 flex-1">
        {showName && (
          <div className="line-clamp-2 text-[11px] font-semibold leading-tight">{tenRutGon}</div>
        )}
        <div className={cn("truncate font-mono text-[11px] text-slate-800", showName && "mt-0.5")}>
          {ma}
        </div>
        <div className="mt-0.5 text-[8px] font-medium tracking-wide text-slate-400">
          MIRATS · VATM
        </div>
      </div>
    </div>
  );
}
