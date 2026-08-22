import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plug,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  Play,
  Database,
  ShieldCheck,
  Users,
  Power,
  FlaskConical,
  Undo2,
  Layers,
  Pause,
  AlertTriangle,
} from "lucide-react";
import { AppShell } from "@/components/mirats/app-shell/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { chayGioiHan, type BaoCaoTuongThich, type Phien } from "@/lib/supabase-ngoai-core";
import {
  listSupabaseNgoai,
  saveSupabaseNgoai,
  deleteSupabaseNgoai,
  testSupabaseNgoai,
  kiemTraTuongThich,
  dongBoLucDo,
  taoPhienDiChuyen,
  chuyenLo,
  capNhatTrangThaiPhien,
  hoanTacPhien,
  phienGanNhat,
  migrateAuthUsers,
  setActiveSupabaseNgoai,
  type SupabaseNgoai,
} from "@/lib/supabase-ngoai.functions";

export const Route = createFileRoute("/admin/supabase-ngoai")({
  head: () => ({
    meta: [
      { title: "Kết nối Supabase ngoài — MIRATS" },
      {
        name: "description",
        content:
          "Đồng bộ lược đồ, chạy thử, di chuyển dữ liệu theo lô có tiến trình và khôi phục khi lỗi cho Supabase bên ngoài.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SupabaseNgoaiPage,
});

const CHUNK = 500;
const SONG_SONG = 4; // số bảng chạy đồng thời

function SupabaseNgoaiPage() {
  const qc = useQueryClient();
  const list = useServerFn(listSupabaseNgoai);
  const save = useServerFn(saveSupabaseNgoai);
  const del = useServerFn(deleteSupabaseNgoai);
  const test = useServerFn(testSupabaseNgoai);
  const compat = useServerFn(kiemTraTuongThich);
  const syncSchema = useServerFn(dongBoLucDo);
  const taoPhien = useServerFn(taoPhienDiChuyen);
  const lo = useServerFn(chuyenLo);
  const capNhatPhien = useServerFn(capNhatTrangThaiPhien);
  const hoanTac = useServerFn(hoanTacPhien);
  const phienCuoi = useServerFn(phienGanNhat);
  const authMig = useServerFn(migrateAuthUsers);
  const setActive = useServerFn(setActiveSupabaseNgoai);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["supabase-ngoai"],
    queryFn: () => list({ data: undefined as any }),
  });

  const [form, setForm] = useState({
    id: "",
    ten: "",
    url: "",
    publishable_key: "",
    service_role_key: "",
    ghi_chu: "",
  });
  const reset = () =>
    setForm({ id: "", ten: "", url: "", publishable_key: "", service_role_key: "", ghi_chu: "" });

  const [log, setLog] = useState<string[]>([]);
  const addLog = (s: string) => setLog((l) => [...l.slice(-400), s]);

  const saveMut = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: form.id || undefined,
          ten: form.ten,
          url: form.url,
          publishable_key: form.publishable_key || undefined,
          service_role_key: form.service_role_key || undefined,
          ghi_chu: form.ghi_chu || null,
        },
      }),
    onSuccess: () => {
      toast.success("Đã lưu cấu hình");
      reset();
      qc.invalidateQueries({ queryKey: ["supabase-ngoai"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Lưu thất bại"),
  });

  const testMut = useMutation({
    mutationFn: (id: string) => test({ data: { id } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["supabase-ngoai"] });
      r.ok
        ? toast.success(`Kết nối tốt (${r.do_tre_ms} ms)`)
        : toast.error("Kết nối chưa sẵn sàng — xem chi tiết bên dưới");
    },
    onError: (e: any) => toast.error(e?.message ?? "Kiểm tra thất bại"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Đã xoá");
      qc.invalidateQueries({ queryKey: ["supabase-ngoai"] });
    },
  });

  /* ---------------- Tương thích lược đồ ---------------- */
  const [baoCao, setBaoCao] = useState<Record<string, BaoCaoTuongThich>>({});
  const compatMut = useMutation({
    mutationFn: (id: string) => compat({ data: { id } }),
    onSuccess: (r, id) => {
      setBaoCao((b) => ({ ...b, [id]: r }));
      r.tuong_thich
        ? toast.success("Lược đồ tương thích")
        : toast.warning("Lược đồ chưa khớp — cần đồng bộ");
    },
    onError: (e: any) => toast.error(e?.message ?? "Không kiểm tra được"),
  });

  const [sqlThuCong, setSqlThuCong] = useState("");
  const syncMut = useMutation({
    mutationFn: (id: string) => syncSchema({ data: { id, ap_dung: true } }),
    onSuccess: (r, id) => {
      if (!r.ap_dung) {
        setSqlThuCong(r.sql);
        r.loi.forEach((l) => addLog(`! ${l}`));
        toast.warning("Chưa áp dụng tự động được — xem SQL cần chạy thủ công bên dưới");
        return;
      }
      addLog(`Đồng bộ lược đồ: ${r.thanh_cong}/${r.tong} câu lệnh thành công, ${r.that_bai} lỗi`);
      r.loi.forEach((l) => addLog(`✗ ${l}`));
      toast.success(`Đã đồng bộ lược đồ (${r.thanh_cong}/${r.tong})`);
      compatMut.mutate(id);
    },
    onError: (e: any) => toast.error(e?.message ?? "Đồng bộ lược đồ thất bại"),
  });

  /* ---------------- Phiên di chuyển ---------------- */
  const [phien, setPhien] = useState<Phien | null>(null);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);

  useEffect(() => {
    const dangDung = items[0];
    if (!dangDung || phien) return;
    void phienCuoi({ data: { id: dangDung.id } })
      .then((p) => p && setPhien(p))
      .catch(() => {});
    // chỉ dò một lần khi có danh sách
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  async function chayPhien(p: Phien) {
    setRunning(true);
    stopRef.current = false;
    try {
      const canChay = p.bang.filter(
        (b) => b.trang_thai !== "hoan_thanh" && b.trang_thai !== "bo_qua" && b.tong_dong > 0,
      );
      addLog(
        `Bắt đầu chuyển ${canChay.length} bảng · ${p.tong_dong.toLocaleString("vi-VN")} dòng · ${SONG_SONG} luồng`,
      );
      let hong = 0;
      await chayGioiHan(canChay, SONG_SONG, async (b) => {
        for (;;) {
          if (stopRef.current) return;
          const r = await lo({ data: { job_id: p.id, table: b.ten_bang, limit: CHUNK } });
          if (r.tam_dung) return;
          if (r.error) {
            hong++;
            addLog(`✗ ${r.error}`);
            return;
          }
          setPhien((cur) => cur && capNhatCucBo(cur, b.ten_bang, r.sent, r.done));
          if (r.done) {
            addLog(`✓ ${b.ten_bang}`);
            return;
          }
        }
      });
      const trang_thai = stopRef.current ? "tam_dung" : hong > 0 ? "that_bai" : "hoan_thanh";
      const moi = await capNhatPhien({
        data: { job_id: p.id, trang_thai, loi: hong ? `${hong} bảng lỗi` : null },
      });
      setPhien(moi);
      addLog(
        stopRef.current
          ? "Đã tạm dừng — có thể bấm “Chạy tiếp”."
          : hong
            ? `Kết thúc với ${hong} bảng lỗi.`
            : "Hoàn tất di chuyển dữ liệu.",
      );
      if (hong) toast.error(`${hong} bảng lỗi — có thể bấm “Khôi phục” để dọn dữ liệu vừa ghi`);
      else if (!stopRef.current) toast.success("Di chuyển dữ liệu hoàn tất");
    } catch (e: any) {
      addLog(`✗ ${e?.message}`);
      await capNhatPhien({
        data: { job_id: p.id, trang_thai: "that_bai", loi: e?.message ?? null },
      })
        .then(setPhien)
        .catch(() => {});
      toast.error(e?.message ?? "Di chuyển thất bại");
    } finally {
      setRunning(false);
    }
  }

  function capNhatCucBo(cur: Phien, ten: string, sent: number, done: boolean): Phien {
    return {
      ...cur,
      da_chuyen: cur.da_chuyen + sent,
      bang: cur.bang.map((x) =>
        x.ten_bang === ten
          ? {
              ...x,
              da_chuyen: x.da_chuyen + sent,
              offset_tiep: x.offset_tiep + sent,
              trang_thai: done ? "hoan_thanh" : "dang_chay",
            }
          : x,
      ),
    };
  }

  const dryRunMut = useMutation({
    mutationFn: (id: string) => taoPhien({ data: { id, che_do: "dry_run" } }),
    onSuccess: (p) => {
      setPhien(p);
      toast.success("Đã dựng bản xem trước (không ghi dữ liệu)");
    },
    onError: (e: any) => toast.error(e?.message ?? "Chạy thử thất bại"),
  });

  async function batDauThat(id: string) {
    const bc = baoCao[id] ?? (await compatMut.mutateAsync(id));
    if (
      !bc.tuong_thich &&
      !confirm("Lược đồ đích chưa khớp hoàn toàn. Vẫn tiếp tục chuyển dữ liệu?")
    )
      return;
    if (
      !confirm("Chuyển TOÀN BỘ dữ liệu sang Supabase đích? Dữ liệu trùng khoá chính sẽ bị ghi đè.")
    )
      return;
    setLog([]);
    const p = await taoPhien({ data: { id, che_do: "that" } });
    setPhien(p);
    void chayPhien(p);
  }

  const hoanTacMut = useMutation({
    mutationFn: (jobId: string) => hoanTac({ data: { job_id: jobId } }),
    onSuccess: (r) => {
      addLog(
        `Khôi phục: đã dọn ${r.da_don.length} bảng, giữ nguyên ${r.bo_qua.length} bảng có sẵn dữ liệu`,
      );
      r.loi.forEach((l) => addLog(`✗ ${l}`));
      toast.success("Đã khôi phục trạng thái trước khi chuyển");
      setPhien((p) => (p ? { ...p, trang_thai: "da_hoan_tac" } : p));
    },
    onError: (e: any) => toast.error(e?.message ?? "Khôi phục thất bại"),
  });

  const authMut = useMutation({
    mutationFn: (id: string) => authMig({ data: { id } }),
    onSuccess: (r) => {
      addLog(`Tài khoản: tạo ${r.created}, bỏ qua ${r.skipped}`);
      r.loi.forEach((l) => addLog(`✗ ${l}`));
      toast.success(`Đã chuyển ${r.created} tài khoản`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Chuyển tài khoản thất bại"),
  });

  /* ---------------- Chuyển nguồn dữ liệu ---------------- */
  const [envSnippet, setEnvSnippet] = useState("");
  const activeMut = useMutation({
    mutationFn: (v: { id: string; kich_hoat: boolean; bo_qua_canh_bao?: boolean }) =>
      setActive({ data: { ...v, bo_qua_canh_bao: v.bo_qua_canh_bao ?? false } }),
    onSuccess: (r, v) => {
      qc.invalidateQueries({ queryKey: ["supabase-ngoai"] });
      if (v.kich_hoat) setEnvSnippet(r.env);
      if (r.bao_cao) setBaoCao((b) => ({ ...b, [v.id]: r.bao_cao as BaoCaoTuongThich }));
      const it = items.find((x: SupabaseNgoai) => x.id === v.id);
      toast.success(
        v.kich_hoat
          ? `Đang chuyển ứng dụng sang ${it?.ten ?? "Supabase ngoài"}…`
          : "Đang quay lại Lovable Cloud…",
      );
      void (async () => {
        const [{ getActiveBackend }, rt] = await Promise.all([
          import("@/lib/supabase-ngoai.functions"),
          import("@/lib/backend/runtime-source"),
        ]);
        qc.clear();
        rt.applyBackendOverrideAndReload(await getActiveBackend());
      })();
    },
    onError: (e: any, v) => {
      toast.error(e?.message ?? "Không đổi được trạng thái");
      if (v.kich_hoat && String(e?.message ?? "").includes("Chặn chuyển nguồn")) {
        compatMut.mutate(v.id);
      }
    },
  });

  const [nguonHienTai, setNguonHienTai] = useState<{ url: string; ten?: string } | null>(null);
  useEffect(() => {
    void import("@/lib/backend/runtime-source").then((m) =>
      setNguonHienTai(m.readBackendOverride()),
    );
  }, []);

  const pct = phien?.tong_dong
    ? Math.min(100, Math.round((phien.da_chuyen / phien.tong_dong) * 100))
    : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Power className="h-5 w-5" /> Nguồn dữ liệu đang dùng
              </CardTitle>
              <CardDescription className="break-all">
                {nguonHienTai
                  ? `Supabase ngoài — ${nguonHienTai.ten ?? ""} · ${nguonHienTai.url}`
                  : "Lovable Cloud (mặc định)"}
              </CardDescription>
            </div>
            {nguonHienTai && (
              <Button
                variant="outline"
                disabled={activeMut.isPending}
                onClick={() => {
                  const dangDung = items.find((x: SupabaseNgoai) => x.kich_hoat);
                  if (!confirm("Quay lại dùng Lovable Cloud làm nguồn dữ liệu?")) return;
                  if (dangDung) activeMut.mutate({ id: dangDung.id, kich_hoat: false });
                  else
                    void import("@/lib/backend/runtime-source").then((m) =>
                      m.applyBackendOverrideAndReload(null),
                    );
                }}
              >
                Quay lại Lovable Cloud
              </Button>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5" /> Kết nối Supabase bên ngoài
            </CardTitle>
            <CardDescription>
              Khai báo dự án Supabase khác, kiểm tra kết nối, đồng bộ lược đồ/RLS/extension, chạy
              thử rồi chuyển toàn bộ dữ liệu và đặt làm nguồn dữ liệu. Khoá bí mật chỉ lưu ở máy
              chủ.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tên hiển thị</Label>
              <Input
                value={form.ten}
                onChange={(e) => setForm({ ...form, ten: e.target.value })}
                placeholder="Supabase sản xuất"
              />
            </div>
            <div className="space-y-2">
              <Label>Địa chỉ dự án (URL)</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://xxxx.supabase.co"
              />
            </div>
            <div className="space-y-2">
              <Label>Khoá công khai (anon / publishable)</Label>
              <Input
                value={form.publishable_key}
                onChange={(e) => setForm({ ...form, publishable_key: e.target.value })}
                placeholder={form.id ? "Để trống nếu không đổi" : "sb_publishable_… hoặc eyJ…"}
              />
            </div>
            <div className="space-y-2">
              <Label>Khoá bí mật máy chủ (service role)</Label>
              <Input
                type="password"
                value={form.service_role_key}
                onChange={(e) => setForm({ ...form, service_role_key: e.target.value })}
                placeholder={form.id ? "Để trống nếu không đổi" : "sb_secret_… hoặc eyJ…"}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Ghi chú</Label>
              <Textarea
                rows={2}
                value={form.ghi_chu}
                onChange={(e) => setForm({ ...form, ghi_chu: e.target.value })}
              />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button
                onClick={() => saveMut.mutate()}
                disabled={saveMut.isPending || !form.ten || !form.url}
              >
                {saveMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {form.id ? "Cập nhật" : "Thêm kết nối"}
              </Button>
              {form.id && (
                <Button variant="ghost" onClick={reset}>
                  Huỷ sửa
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-sm text-muted-foreground">
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            Đang tải…
          </div>
        )}

        {items.map((it: SupabaseNgoai) => {
          const kq = it.kiem_tra_ket_qua;
          const bc = baoCao[it.id];
          return (
            <Card key={it.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    {it.ten}
                    {it.kich_hoat && (
                      <Badge className="gap-1">
                        <Power className="h-3 w-3" /> Đang dùng
                      </Badge>
                    )}
                    {kq &&
                      (kq.ok ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Kết nối tốt
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" /> Lỗi kết nối
                        </Badge>
                      ))}
                    {bc &&
                      (bc.tuong_thich ? (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Lược đồ khớp
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" /> Lược đồ lệch
                        </Badge>
                      ))}
                  </CardTitle>
                  <CardDescription className="break-all">
                    {it.url} · khoá công khai {it.publishable_key_masked} · khoá bí mật{" "}
                    {it.co_service_key ? it.service_role_key_masked : "chưa có"}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testMut.mutate(it.id)}
                    disabled={testMut.isPending}
                  >
                    {testMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="mr-2 h-4 w-4" />
                    )}
                    Kiểm tra kết nối
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm({
                        id: it.id,
                        ten: it.ten,
                        url: it.url,
                        publishable_key: "",
                        service_role_key: "",
                        ghi_chu: it.ghi_chu ?? "",
                      })
                    }
                  >
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("Xoá kết nối này?")) delMut.mutate(it.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {kq && (
                  <div className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-2">
                    <div>
                      REST (khoá công khai):{" "}
                      {kq.rest?.ok ? "OK" : `Lỗi ${kq.rest?.status} ${kq.rest?.message ?? ""}`}
                    </div>
                    <div>
                      REST (khoá bí mật):{" "}
                      {kq.service?.ok
                        ? "OK"
                        : `Lỗi ${kq.service?.status} ${kq.service?.message ?? ""}`}
                    </div>
                    <div>
                      Auth Admin:{" "}
                      {kq.auth?.ok
                        ? `OK — ${kq.auth.so_tai_khoan ?? 0} tài khoản`
                        : `Lỗi ${kq.auth?.message ?? ""}`}
                    </div>
                    <div>
                      Bảng khớp: {kq.bang_co ?? 0}
                      {kq.bang_thieu?.length ? ` · thiếu ${kq.bang_thieu.length}` : ""}
                    </div>
                    <div className="sm:col-span-2 text-xs text-muted-foreground">
                      Kiểm tra lúc {kq.luc ? new Date(kq.luc).toLocaleString("vi-VN") : "—"} ·{" "}
                      {kq.do_tre_ms} ms
                    </div>
                  </div>
                )}

                {bc && (
                  <div className="space-y-1 rounded-md border p-3 text-sm">
                    <div>
                      Bảng ở nguồn: {bc.bang_nguon} · ở đích: {bc.bang_dich} · thiếu{" "}
                      {bc.thieu_bang.length} bảng, {bc.thieu_cot.length} bảng thiếu cột
                    </div>
                    {!!bc.thieu_bang.length && (
                      <div className="text-xs text-muted-foreground break-all">
                        Thiếu bảng: {bc.thieu_bang.slice(0, 25).join(", ")}
                        {bc.thieu_bang.length > 25 ? "…" : ""}
                      </div>
                    )}
                    {!!bc.thieu_cot.length && (
                      <div className="text-xs text-muted-foreground break-all">
                        Thiếu cột:{" "}
                        {bc.thieu_cot
                          .slice(0, 10)
                          .map((c) => `${c.bang}(${c.cot.join(",")})`)
                          .join("; ")}
                        {bc.thieu_cot.length > 10 ? "…" : ""}
                      </div>
                    )}
                    {bc.canh_bao.map((c, i) => (
                      <div key={i} className="text-xs text-amber-600">
                        ⚠ {c}
                      </div>
                    ))}
                  </div>
                )}

                <Separator />

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => compatMut.mutate(it.id)}
                    disabled={compatMut.isPending || !it.co_service_key}
                  >
                    {compatMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Layers className="mr-2 h-4 w-4" />
                    )}
                    Kiểm tra lược đồ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (
                        confirm(
                          "Tạo/cập nhật lược đồ, RLS, chính sách và extension trên Supabase đích?",
                        )
                      )
                        syncMut.mutate(it.id);
                    }}
                    disabled={syncMut.isPending || !it.co_service_key}
                  >
                    {syncMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Layers className="mr-2 h-4 w-4" />
                    )}
                    Đồng bộ lược đồ
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dryRunMut.mutate(it.id)}
                    disabled={dryRunMut.isPending || !it.co_service_key}
                  >
                    {dryRunMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FlaskConical className="mr-2 h-4 w-4" />
                    )}
                    Chạy thử (xem trước)
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void batDauThat(it.id)}
                    disabled={running || !it.co_service_key}
                  >
                    {running ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    Di chuyển toàn bộ dữ liệu
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => authMut.mutate(it.id)}
                    disabled={authMut.isPending || !it.co_service_key}
                  >
                    {authMut.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="mr-2 h-4 w-4" />
                    )}
                    Chuyển tài khoản đăng nhập
                  </Button>
                  <Button
                    size="sm"
                    variant={it.kich_hoat ? "secondary" : "default"}
                    disabled={activeMut.isPending}
                    onClick={() => activeMut.mutate({ id: it.id, kich_hoat: !it.kich_hoat })}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {it.kich_hoat ? "Bỏ dùng nguồn này" : "Dùng Supabase này"}
                  </Button>
                </div>
                {!it.co_service_key && (
                  <p className="text-xs text-muted-foreground">
                    Cần nhập khoá bí mật (service role) mới đồng bộ và di chuyển được.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}

        {phien && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {phien.che_do === "dry_run" ? (
                    <FlaskConical className="h-5 w-5" />
                  ) : (
                    <Database className="h-5 w-5" />
                  )}
                  {phien.che_do === "dry_run"
                    ? "Xem trước tác động (chạy thử — không ghi dữ liệu)"
                    : "Tiến trình di chuyển"}
                  <Badge variant="secondary">{phien.trang_thai}</Badge>
                </CardTitle>
                <CardDescription>
                  {phien.da_chuyen.toLocaleString("vi-VN")}/
                  {phien.tong_dong.toLocaleString("vi-VN")} dòng ·{" "}
                  {phien.bang.filter((b) => b.trang_thai === "hoan_thanh").length}/
                  {phien.bang.filter((b) => b.tong_dong > 0).length} bảng xong
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {running && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      stopRef.current = true;
                    }}
                  >
                    <Pause className="mr-2 h-4 w-4" /> Tạm dừng
                  </Button>
                )}
                {!running &&
                  phien.che_do === "that" &&
                  phien.trang_thai !== "hoan_thanh" &&
                  phien.trang_thai !== "da_hoan_tac" && (
                    <Button size="sm" onClick={() => void chayPhien(phien)}>
                      <Play className="mr-2 h-4 w-4" /> Chạy tiếp
                    </Button>
                  )}
                {!running &&
                  phien.che_do === "that" &&
                  phien.da_chuyen > 0 &&
                  phien.trang_thai !== "da_hoan_tac" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={hoanTacMut.isPending}
                      onClick={() => {
                        if (
                          confirm(
                            "Khôi phục: xoá dữ liệu vừa ghi ở Supabase đích (chỉ những bảng trước đó rỗng)?",
                          )
                        )
                          hoanTacMut.mutate(phien.id);
                      }}
                    >
                      {hoanTacMut.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Undo2 className="mr-2 h-4 w-4" />
                      )}
                      Khôi phục
                    </Button>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={pct} />
              <div className="max-h-72 overflow-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="p-2 text-left">Bảng</th>
                      <th className="p-2 text-right">Dòng nguồn</th>
                      <th className="p-2 text-right">Đã có ở đích</th>
                      <th className="p-2 text-right">Đã chuyển</th>
                      <th className="p-2 text-left">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phien.bang
                      .filter((b) => b.tong_dong > 0)
                      .map((b) => (
                        <tr key={b.ten_bang} className="border-t">
                          <td className="p-2">{b.ten_bang}</td>
                          <td className="p-2 text-right">{b.tong_dong.toLocaleString("vi-VN")}</td>
                          <td className="p-2 text-right">
                            {b.dich_dong_truoc === null
                              ? "—"
                              : b.dich_dong_truoc.toLocaleString("vi-VN")}
                          </td>
                          <td className="p-2 text-right">{b.da_chuyen.toLocaleString("vi-VN")}</td>
                          <td className="p-2">
                            {b.loi ? (
                              <span className="text-destructive">{b.loi.slice(0, 80)}</span>
                            ) : (
                              b.trang_thai
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {log.length > 0 && (
                <pre className="max-h-56 overflow-auto rounded-md bg-muted p-3 text-xs">
                  {log.join("\n")}
                </pre>
              )}
            </CardContent>
          </Card>
        )}

        {sqlThuCong && (
          <Card>
            <CardHeader>
              <CardTitle>SQL đồng bộ lược đồ (chạy thủ công ở dự án đích)</CardTitle>
              <CardDescription>
                Dự án đích chưa có hàm chạy SQL. Dán toàn bộ nội dung dưới đây vào SQL editor của
                Supabase đích, hoặc tạo hàm trợ giúp <code>public.__restore_exec(p_sql text)</code>{" "}
                để lần sau đồng bộ tự động.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(sqlThuCong);
                  toast.success("Đã sao chép SQL");
                }}
              >
                Sao chép SQL
              </Button>
              <pre className="max-h-72 overflow-auto rounded-md bg-muted p-3 text-xs">
                {sqlThuCong.slice(0, 20000)}
              </pre>
            </CardContent>
          </Card>
        )}

        {envSnippet && (
          <Card>
            <CardHeader>
              <CardTitle>Biến môi trường tương ứng</CardTitle>
              <CardDescription>
                Ứng dụng đã tự chuyển nguồn ngay lập tức. Đặt thêm các biến này cho bản triển khai
                máy chủ nếu muốn cố định lâu dài.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{envSnippet}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
