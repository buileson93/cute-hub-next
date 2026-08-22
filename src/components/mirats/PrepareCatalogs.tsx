// ============================================================================
// Bước 0 — Chuẩn bị danh mục trước khi nhập Tài sản hàng loạt.
//   * Hệ thống đích: chọn hệ thống có sẵn (gắn sẵn Phân loại Nhóm 1/2/3) HOẶC
//     tạo mới ngay tại đây. Khi chọn, mọi dòng tài sản sẽ tự gắn vào hệ thống
//     này (kế thừa Phân loại/Nhóm) — không cần khai ở từng dòng.
//   * Vị trí cha: các phòng mới trong file tự chui vào dưới cấp cha này.
//   * Model: chọn mẫu có sẵn hoặc tạo mới để dòng "Model" link được.
// Dùng supabase client (RLS: cần quyền quản lý tài sản để tạo mới).
// ============================================================================
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoHint } from "@/components/mirats/InfoHint";
import {
  Server,
  MapPin,
  Boxes,
  Plus,
  Check,
  Loader2,
  Search,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

function noAccent(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}
function randCode(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

type Row = { id: string; ma: string | null; ten: string; extra?: string };

interface Props {
  systemMa: string;
  onPickSystem: (ma: string) => void;
  modelMa: string;
  onPickModel: (ma: string) => void;
  viTriParentId: string;
  onPickViTriParent: (id: string) => void;
}

export function PrepareCatalogs({
  systemMa,
  onPickSystem,
  modelMa,
  onPickModel,
  viTriParentId,
  onPickViTriParent,
}: Props) {
  const [open, setOpen] = useState(true);

  // ---- Dữ liệu danh mục ----
  const [systems, setSystems] = useState<Row[]>([]);
  const [phanLoai, setPhanLoai] = useState<Row[]>([]);
  const [models, setModels] = useState<Row[]>([]);
  const [nsx, setNsx] = useState<Row[]>([]);
  const [viTri, setViTri] = useState<Array<{ id: string; label: string }>>([]);

  const [busy, setBusy] = useState(false);

  async function loadAll() {
    const [s, p, m, n, v] = await Promise.all([
      supabase
        .from("dm_he_thong")
        .select("id, ma, ten, phan_loai_id, dm_phan_loai(ten)")
        .eq("active", true)
        .order("ten"),
      supabase.from("dm_phan_loai").select("id, ma, ten").eq("active", true).order("thu_tu"),
      supabase
        .from("dm_model")
        .select("id, ma, ten, p_n, dm_nha_san_xuat(ten)")
        .eq("active", true)
        .order("ten"),
      supabase.from("dm_nha_san_xuat").select("id, ma, ten").eq("active", true).order("ten"),
      supabase.from("dm_vi_tri").select("id, ten, parent_id"),
    ]);
    setSystems(
      (s.data ?? []).map((r: any) => ({
        id: r.id,
        ma: r.ma,
        ten: r.ten,
        extra: r.dm_phan_loai?.ten,
      })),
    );
    setPhanLoai((p.data ?? []).map((r: any) => ({ id: r.id, ma: r.ma, ten: r.ten })));
    setModels(
      (m.data ?? []).map((r: any) => ({
        id: r.id,
        ma: r.ma,
        ten: r.ten,
        extra: [r.p_n, r.dm_nha_san_xuat?.ten].filter(Boolean).join(" · "),
      })),
    );
    setNsx((n.data ?? []).map((r: any) => ({ id: r.id, ma: r.ma, ten: r.ten })));
    // Cây vị trí có thụt cấp
    const data = v.data ?? [];
    const byId = new Map(data.map((r: any) => [r.id, r]));
    const depth = (r: any): number => {
      let d = 0,
        cur = r;
      while (cur?.parent_id && byId.get(cur.parent_id)) {
        d++;
        cur = byId.get(cur.parent_id);
        if (d > 8) break;
      }
      return d;
    };
    setViTri(
      [...data]
        .sort((a: any, b: any) => (a.ten ?? "").localeCompare(b.ten ?? ""))
        .map((r: any) => ({ id: r.id, label: `${"— ".repeat(depth(r))}${r.ten}` })),
    );
  }
  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="rounded-lg border border-primary/25 bg-primary/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-primary" />
        ) : (
          <ChevronRight className="h-4 w-4 text-primary" />
        )}
        <span className="text-sm font-semibold">
          Bước 0 — Chuẩn bị danh mục (chọn có sẵn hoặc tạo mới)
        </span>
        <InfoHint>
          Nếu file thiếu <b>Hệ thống / Vị trí cha / Mẫu</b>, chọn sẵn ở đây — giá trị áp cho mọi
          dòng bỏ trống. Chọn <b>Hệ thống</b> Nhóm 3 thì mọi tài sản tự kế thừa Nhóm 3.
        </InfoHint>
        <span className="ml-auto flex items-center gap-1.5">
          {systemMa && (
            <Badge variant="secondary" className="text-[10px]">
              HT ✓
            </Badge>
          )}
          {viTriParentId && (
            <Badge variant="secondary" className="text-[10px]">
              Vị trí ✓
            </Badge>
          )}
          {modelMa && (
            <Badge variant="secondary" className="text-[10px]">
              Mẫu ✓
            </Badge>
          )}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-primary/15 p-3">
          {/* ---- Hệ thống đích ---- */}
          <SystemPicker
            systems={systems}
            phanLoai={phanLoai}
            value={systemMa}
            busy={busy}
            setBusy={setBusy}
            onPick={onPickSystem}
            onCreated={loadAll}
          />

          {/* ---- Vị trí cha ---- */}
          <div className="space-y-1.5 rounded-md border bg-background/60 p-3">
            <Label className="flex items-center gap-1 text-xs font-semibold">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Vị trí cha mặc định
              <InfoHint>
                Phòng mới trong file (vd <i>Tower, Phòng Tài sản</i>) sẽ nằm dưới cấp cha này (vd{" "}
                <i>Đài KSKL Phú Bài</i>).
              </InfoHint>
            </Label>
            <Select
              value={viTriParentId || "none"}
              onValueChange={(v) => onPickViTriParent(v === "none" ? "" : v)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="— Không (vị trí mới ở cấp gốc) —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Không (cấp gốc) —</SelectItem>
                {viTri.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-[11px] text-muted-foreground">
              Phòng mới trong file (vd <i>Tower, Phòng Tài sản</i>) sẽ nằm dưới cấp cha này (vd{" "}
              <i>Đài KSKL Phú Bài</i>).
            </p>
          </div>

          {/* ---- Model ---- */}
          <ModelPicker
            models={models}
            nsx={nsx}
            value={modelMa}
            busy={busy}
            setBusy={setBusy}
            onPick={onPickModel}
            onCreated={loadAll}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Hệ thống ------------------------------- */
function SystemPicker({
  systems,
  phanLoai,
  value,
  busy,
  setBusy,
  onPick,
  onCreated,
}: {
  systems: Row[];
  phanLoai: Row[];
  value: string;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onPick: (ma: string) => void;
  onCreated: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [ten, setTen] = useState("");
  const [ploai, setPloai] = useState("");

  const picked = useMemo(() => systems.find((s) => s.ma === value), [systems, value]);
  const filtered = useMemo(() => {
    const n = noAccent(q);
    return systems
      .filter((s) => !n || noAccent(`${s.ten} ${s.ma} ${s.extra ?? ""}`).includes(n))
      .slice(0, 40);
  }, [systems, q]);

  async function create() {
    if (!ten.trim()) {
      toast.error("Nhập tên hệ thống");
      return;
    }
    setBusy(true);
    try {
      const ma = randCode("HT");
      const { error } = await supabase.from("dm_he_thong").insert({
        ma,
        ten: ten.trim(),
        phan_loai_id: ploai || null,
        active: true,
        thu_tu: 0,
      } as any);
      if (error) throw new Error(error.message);
      toast.success(`Đã tạo hệ thống "${ten.trim()}"`);
      await onCreated();
      onPick(ma);
      setCreating(false);
      setTen("");
      setPloai("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border bg-background/60 p-3">
      <Label className="flex items-center gap-1.5 text-xs font-semibold">
        <Server className="h-3.5 w-3.5 text-primary" /> Hệ thống đích
      </Label>

      {picked ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-2.5 py-1.5">
          <span className="flex items-center gap-1.5 text-xs">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <b>{picked.ten}</b>
            {picked.extra && (
              <Badge variant="outline" className="text-[10px]">
                {picked.extra}
              </Badge>
            )}
            <span className="font-mono text-[10px] text-muted-foreground">{picked.ma}</span>
          </span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onPick("")}>
            <X className="mr-1 h-3.5 w-3.5" /> Bỏ chọn
          </Button>
        </div>
      ) : creating ? (
        <div className="space-y-2 rounded-md border border-dashed p-2.5">
          <Input
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            placeholder="Tên hệ thống (vd: Hệ thống Camera PBA)"
            className="h-8 text-xs"
          />
          <Select value={ploai || "none"} onValueChange={(v) => setPloai(v === "none" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Phân loại (Nhóm 1/2/3)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Chưa phân loại —</SelectItem>
              {phanLoai.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.ten}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" className="h-8 flex-1 text-xs" onClick={create} disabled={busy}>
              {busy ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1 h-3.5 w-3.5" />
              )}{" "}
              Tạo & chọn
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setCreating(false)}
            >
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm hệ thống có sẵn…"
              className="h-8 pl-7 text-xs"
            />
          </div>
          {q && (
            <div className="max-h-40 overflow-auto rounded-md border">
              {filtered.length === 0 ? (
                <p className="px-2.5 py-2 text-[11px] text-muted-foreground">
                  Không thấy — có thể tạo mới bên dưới.
                </p>
              ) : (
                filtered.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      onPick(s.ma ?? "");
                      setQ("");
                    }}
                    className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-xs hover:bg-muted/60"
                  >
                    <b className="truncate">{s.ten}</b>
                    {s.extra && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {s.extra}
                      </Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={() => setCreating(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Tạo hệ thống mới
          </Button>
        </>
      )}
    </div>
  );
}

/* ------------------------------ Model ----------------------------- */
function ModelPicker({
  models,
  nsx,
  value,
  busy,
  setBusy,
  onPick,
  onCreated,
}: {
  models: Row[];
  nsx: Row[];
  value: string;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onPick: (ma: string) => void;
  onCreated: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [ten, setTen] = useState("");
  const [pn, setPn] = useState("");
  const [nsxId, setNsxId] = useState("");

  const picked = useMemo(() => models.find((m) => m.ma === value), [models, value]);
  const filtered = useMemo(() => {
    const n = noAccent(q);
    return models
      .filter((m) => !n || noAccent(`${m.ten} ${m.ma} ${m.extra ?? ""}`).includes(n))
      .slice(0, 40);
  }, [models, q]);

  async function create() {
    if (!ten.trim()) {
      toast.error("Nhập tên mẫu");
      return;
    }
    setBusy(true);
    try {
      const ma = randCode("MD");
      const { error } = await supabase.from("dm_model").insert({
        ma,
        ten: ten.trim(),
        p_n: pn.trim() || null,
        nha_san_xuat_id: nsxId || null,
        active: true,
        thu_tu: 0,
      } as any);
      if (error) throw new Error(error.message);
      toast.success(`Đã tạo mẫu "${ten.trim()}"`);
      await onCreated();
      onPick(ma);
      setCreating(false);
      setTen("");
      setPn("");
      setNsxId("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border bg-background/60 p-3">
      <Label className="flex items-center gap-1.5 text-xs font-semibold">
        <Boxes className="h-3.5 w-3.5 text-primary" /> Model mặc định{" "}
        <span className="font-normal text-muted-foreground">(tùy chọn)</span>
      </Label>

      {picked ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-2.5 py-1.5">
          <span className="flex items-center gap-1.5 text-xs">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <b>{picked.ten}</b>
            {picked.extra && (
              <span className="text-[10px] text-muted-foreground">{picked.extra}</span>
            )}
          </span>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onPick("")}>
            <X className="mr-1 h-3.5 w-3.5" /> Bỏ chọn
          </Button>
        </div>
      ) : creating ? (
        <div className="space-y-2 rounded-md border border-dashed p-2.5">
          <Input
            value={ten}
            onChange={(e) => setTen(e.target.value)}
            placeholder="Tên mẫu (vd: P5635E MK II)"
            className="h-8 text-xs"
          />
          <Input
            value={pn}
            onChange={(e) => setPn(e.target.value)}
            placeholder="P/N (tùy chọn)"
            className="h-8 text-xs"
          />
          <Select value={nsxId || "none"} onValueChange={(v) => setNsxId(v === "none" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Nhà sản xuất (tùy chọn)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Không —</SelectItem>
              {nsx.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  {n.ten}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button size="sm" className="h-8 flex-1 text-xs" onClick={create} disabled={busy}>
              {busy ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="mr-1 h-3.5 w-3.5" />
              )}{" "}
              Tạo & chọn
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setCreating(false)}
            >
              Hủy
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm mẫu có sẵn…"
              className="h-8 pl-7 text-xs"
            />
          </div>
          {q && (
            <div className="max-h-40 overflow-auto rounded-md border">
              {filtered.length === 0 ? (
                <p className="px-2.5 py-2 text-[11px] text-muted-foreground">
                  Không thấy — có thể tạo mới bên dưới.
                </p>
              ) : (
                filtered.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onPick(m.ma ?? "");
                      setQ("");
                    }}
                    className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-xs hover:bg-muted/60"
                  >
                    <b className="truncate">{m.ten}</b>
                    {m.extra && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">{m.extra}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={() => setCreating(true)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Tạo mẫu mới
          </Button>
        </>
      )}
    </div>
  );
}
