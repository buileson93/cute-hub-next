// ============================================================================
// Quản lý VỊ TRÍ CHỨC NĂNG của một hệ thống (mô hình 3 lớp).
//   - NHỊP I (cấu trúc): Khai thêm / Sửa / Ngừng vị trí — form KHÔNG có serial.
//   - NHỊP II (vận hành): Lắp / Tháo / Thay thế tài sản — ô "đang lắp" CHỈ-ĐỌC.
// ============================================================================
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, PowerOff, HardDrive, PackageOpen, Wrench, ArrowRightLeft, CircleSlash, Cpu, History, ChevronDown, RefreshCw, Trash2, ArrowUp, ArrowDown,
} from "lucide-react";
import { ChevronRight, Layers } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Combobox } from "@/components/mirats/Combobox";
import { supabase } from "@/integrations/supabase/client";
import {
  useViTriChucNang, useThietBiDangLap, useThietBiRanh,
  useLuuViTri, useNgungViTri, useXoaViTri, useXoaViTriForce, useDemLichSuThanhPhan, useDoiThuTuViTri,
  useXemTruocXoaThanhPhan, useKhoiPhucThanhPhan, useThanhPhanDaXoa,
  useLapThietBi, useThaoThietBi, useThayTheThietBi, useLyLichViTri,
  rankEligibleDevices,
  type ViTriChucNang, type ThietBiDangLap,
} from "@/lib/mirats/he-thong-thanh-phan";
import {
  buildThanhPhanTree, flattenThanhPhanTree, isDescendantOf, useMultiRoleMap,
  type ThanhPhanNode,
} from "@/lib/mirats/he-thong-thanh-phan";
import { colorForThietBi } from "@/lib/mirats/multi-role-color";
import { ThaoTaiSanDialog, type ThaoTaiSanTarget } from "@/components/mirats/ThaoTaiSanDialog";
import { sinhMaThanhPhanDuyNhat, nhanDienLoiTrungThietBi } from "@/lib/mirats/ma-thiet-bi";
import { thongDiepLoi, kickNeuHetPhien } from "@/lib/mirats/errors";
import { useMyPermissions, useCan } from "@/hooks/use-permissions";
import { useIsMutating } from "@tanstack/react-query";


function useLoaiThietBi() {
  return useQuery({
    queryKey: ["dm-loai-thiet-bi-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dm_loai_thiet_bi").select("id, ten").order("thu_tu");
      if (error) throw error;
      return (data ?? []) as Array<{ id: string; ten: string }>;
    },
  });
}

export function ThanhPhanManager({ heThongId, canManage }: { heThongId: string; canManage: boolean }) {
  const { data: viTri = [], isLoading } = useViTriChucNang(heThongId);
  const { data: dangLap } = useThietBiDangLap(heThongId);
  const { data: loaiList = [] } = useLoaiThietBi();
  const loaiTen = useMemo(() => new Map(loaiList.map((l) => [l.id, l.ten])), [loaiList]);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ViTriChucNang | null>(null);
  const [assignTarget, setAssignTarget] = useState<{ viTri: ViTriChucNang; dangLap?: ThietBiDangLap } | null>(null);
  const [openLichSu, setOpenLichSu] = useState<string | null>(null);
  const [thaoTarget, setThaoTarget] = useState<ThaoTaiSanTarget | null>(null);

  const ngungMut = useNgungViTri(heThongId);
  const xoaMut = useXoaViTri(heThongId);
  const xoaForceMut = useXoaViTriForce(heThongId);
  const khoiPhucMut = useKhoiPhucThanhPhan(heThongId);
  const doiThuTuMut = useDoiThuTuViTri(heThongId);
  const thaoMut = useThaoThietBi(heThongId);
  const [xoaTarget, setXoaTarget] = useState<ViTriChucNang | null>(null);
  const [xoaReason, setXoaReason] = useState("");
  const { data: perms } = useMyPermissions();
  const isAdmin = !!perms?.roles?.includes("admin");
  const canForceDelete = useCan("he_thong", "force_delete") || isAdmin;
  const { data: histCount } = useDemLichSuThanhPhan(xoaTarget?.id ?? null);
  const { data: xoaPreview } = useXemTruocXoaThanhPhan(xoaTarget?.id ?? null);
  const hasHistory = !!histCount && (histCount.gan + histCount.suCo + histCount.baoTri + histCount.hongHoc) > 0;
  const { data: daXoaList = [] } = useThanhPhanDaXoa(heThongId);
  // Bất kỳ mutation nào ĐANG chạy tại hệ thống này → chặn xoá để tránh xung đột.
  const busy =
    xoaMut.isPending || xoaForceMut.isPending || khoiPhucMut.isPending ||
    ngungMut.isPending || thaoMut.isPending || doiThuTuMut.isPending;
  const inflightAll = useIsMutating() > 0;

  const openCreate = () => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (v: ViTriChucNang) => { setEditTarget(v); setFormOpen(true); };

  const onNgung = (v: ViTriChucNang) => {
    ngungMut.mutate(v.id, {
      onSuccess: () => toast.success(`Đã ngừng thành phần "${v.ten}"`),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không ngừng được thành phần"),
    });
  };
  const onXoa = (v: ViTriChucNang, force: boolean) => {
    if (force) {
      xoaForceMut.mutate({ viTriId: v.id, lyDo: xoaReason || null as any }, {
        onSuccess: (res) => {
          const a = res?.affected;
          const parts = a ? [
            a.gan_chuc_nang_detached ? `${a.gan_chuc_nang_detached} bản ghi lắp đã đóng` : null,
            a.su_co ? `${a.su_co} sự cố` : null,
            a.bao_tri ? `${a.bao_tri} bảo dưỡng` : null,
            a.hong_hoc ? `${a.hong_hoc} hỏng hóc` : null,
          ].filter(Boolean).join(" · ") : "";
          toast.success(`Đã xoá cưỡng bức "${v.ma_thanh_phan} · ${v.ten}"`, {
            description: parts ? `Ảnh hưởng: ${parts}. Có thể khôi phục trong 30 ngày.` : "Có thể khôi phục trong 30 ngày ở mục 'Đã xoá gần đây'.",
          });
          setXoaTarget(null); setXoaReason("");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Không xoá được thành phần"),
      });
      return;
    }
    xoaMut.mutate(v.id, {
      onSuccess: () => { toast.success(`Đã xoá thành phần "${v.ten}"`); setXoaTarget(null); setXoaReason(""); },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không xoá được thành phần"),
    });
  };
  const onKhoiPhuc = (id: string, ten: string) => {
    khoiPhucMut.mutate(id, {
      onSuccess: () => toast.success(`Đã khôi phục "${ten}"`),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không khôi phục được"),
    });
  };
  const onMove = (v: ViTriChucNang, dir: -1 | 1) => {
    // Sắp theo hiển thị hiện tại; đổi chỗ v và láng giềng.
    const ordered = [...viTri];
    const idx = ordered.findIndex((x) => x.id === v.id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= ordered.length) return;
    [ordered[idx], ordered[j]] = [ordered[j], ordered[idx]];
    doiThuTuMut.mutate(ordered.map((x) => x.id), {
      onError: (e) => toast.error(e instanceof Error ? e.message : "Không đổi thứ tự được"),
    });
  };
  const onThao = (v: ViTriChucNang) => {
    setThaoTarget({
      heThongId,
      thanhPhanId: v.id,
      maThanhPhan: v.ma_thanh_phan ?? null,
      tenThanhPhan: v.ten,
      viTriHienTaiId: v.vi_tri_id ?? null,
      viTriHienTaiTen: null,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        {canManage && (
          <Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Khai thêm thành phần</Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải thành phần…</p>
      ) : viTri.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Chưa khai thành phần nào cho hệ thống này.
        </div>
      ) : (
        <div className="space-y-2">
          {viTri.map((v) => {
            const tb = dangLap?.get(v.id);
            const ngung = v.trang_thai === "ngung";
            return (
              <Card key={v.id} className={ngung ? "opacity-60" : ""}>
                <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                  <Cpu className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{v.ma_thanh_phan}</span>
                      <span className="font-medium">{v.ten}</span>
                      {ngung && <Badge variant="outline" className="border-muted-foreground/40">Đã ngừng</Badge>}
                      {!ngung && v.bat_buoc && <Badge variant="secondary">Bắt buộc</Badge>}
                    </div>
                    {v.loai_thiet_bi_yeu_cau && (
                      <div className="text-xs text-muted-foreground">Yêu cầu loại: {loaiTen.get(v.loai_thiet_bi_yeu_cau) ?? "—"}</div>
                    )}
                  </div>

                  {/* Ô "tài sản đang lắp" — CHỈ-ĐỌC */}
                  <div className="ml-auto flex items-center gap-2">
                    {tb ? (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <HardDrive className="h-3 w-3" />
                        <span className="font-mono">{tb.ma_thiet_bi}</span>
                        {tb.ma_serial && <span className="text-muted-foreground">· SN {tb.ma_serial}</span>}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-amber-400 text-amber-600">
                        <CircleSlash className="h-3 w-3" /> Chưa gán tài sản
                      </Badge>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex w-full items-center gap-1 border-t pt-2 md:w-auto md:border-0 md:pt-0">
                      {!ngung && !tb && (
                        <Button size="sm" variant="outline" onClick={() => setAssignTarget({ viTri: v })}>
                          <PackageOpen className="mr-1 h-3.5 w-3.5" /> Lắp
                        </Button>
                      )}
                      {!ngung && tb && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setAssignTarget({ viTri: v, dangLap: tb })}>
                            <Wrench className="mr-1 h-3.5 w-3.5" /> Thay thế
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onThao(v)} disabled={thaoMut.isPending}>
                            <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Tháo
                          </Button>
                        </>
                      )}
                      <span className="flex items-center">
                        <Button size="sm" variant="ghost" title="Lên trên"
                          disabled={doiThuTuMut.isPending || viTri.indexOf(v) === 0}
                          onClick={() => onMove(v, -1)}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Xuống dưới"
                          disabled={doiThuTuMut.isPending || viTri.indexOf(v) === viTri.length - 1}
                          onClick={() => onMove(v, 1)}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(v)} title="Sửa"><Pencil className="h-3.5 w-3.5" /></Button>
                      {!ngung && !tb && (
                        <Button size="sm" variant="ghost" className="text-muted-foreground" title="Ngừng thành phần" onClick={() => onNgung(v)} disabled={ngungMut.isPending}>
                          <PowerOff className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm" variant="ghost"
                        className="text-destructive opacity-100"
                        title={
                          busy || inflightAll
                            ? "Đang có thao tác lắp/tháo/cập nhật — vui lòng đợi hoàn tất"
                            : tb && !canForceDelete
                              ? "Đang có tài sản lắp — cần quyền he_thong.force_delete để xoá cưỡng bức"
                              : (canForceDelete ? "Xoá thành phần (có thể xoá cưỡng bức)" : "Xoá thành phần")
                        }
                        disabled={(tb && !canForceDelete) || busy || inflightAll}
                        onClick={() => { setXoaReason(""); setXoaTarget(v); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  <div className="w-full border-t pt-2">
                    <Button
                      size="sm" variant="ghost"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() => setOpenLichSu((cur) => (cur === v.id ? null : v.id))}
                    >
                      <History className="mr-1 h-3.5 w-3.5" /> Lý lịch thành phần
                      <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${openLichSu === v.id ? "rotate-180" : ""}`} />
                    </Button>
                    {openLichSu === v.id && <ViTriLichSu thanhPhanId={v.id} />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}


      {formOpen && (
        <ViTriFormDialog
          heThongId={heThongId}
          target={editTarget}
          loaiList={loaiList}
          viTriList={viTri}
          onClose={() => setFormOpen(false)}
        />
      )}
      {assignTarget && (
        <AssignDialog
          heThongId={heThongId}
          viTri={assignTarget.viTri}
          dangLap={assignTarget.dangLap}
          onClose={() => setAssignTarget(null)}
        />
      )}
      <AlertDialog open={!!xoaTarget} onOpenChange={(o) => !o && setXoaTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá thành phần?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {xoaTarget ? (
                <div className="space-y-2 text-sm">
                  <div>
                    Xoá vĩnh viễn thành phần <b>{xoaTarget.ten}</b>{" "}
                    (<span className="font-mono">{xoaTarget.ma_thanh_phan}</span>).
                  </div>

                  {/* Cảnh báo nếu tài sản đang được lắp — backend sẽ chặn xoá thường */}
                  {(() => {
                    const tbHere = dangLap?.get(xoaTarget.id);
                    if (!tbHere) return null;
                    return (
                      <div className="rounded-md border border-amber-400/60 bg-amber-50 p-2 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                        ⚠ Đang có tài sản <span className="font-mono">{tbHere.ma_thiet_bi}</span> lắp tại thành phần này.
                        {" "}Backend sẽ <b>tự động tháo</b> khi xoá cưỡng bức, nhưng bản ghi lắp/tháo sẽ mất liên kết đến thành phần.
                        Nên bấm <b>Tháo</b> trước, hoặc dùng <b>Ngừng</b> để giữ nguyên lý lịch.
                      </div>
                    );
                  })()}

                  {hasHistory ? (
                    canForceDelete ? (
                      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-destructive space-y-1">
                        <div>⚠ Thành phần đã có lịch sử — <b>backend chặn xoá thường</b> vì các bảng nghiệp vụ đang tham chiếu tới nó.</div>
                        <ul className="ml-4 list-disc text-xs">
                          <li>{histCount?.gan ?? 0} bản ghi lắp/tháo — sẽ được <b>đóng (khoá kết thúc)</b>, không xoá.</li>
                          <li>{histCount?.suCo ?? 0} sự cố, {histCount?.baoTri ?? 0} bảo dưỡng, {histCount?.hongHoc ?? 0} hỏng hóc — vẫn giữ, nhưng liên kết đến thành phần sẽ chỉ về bản ghi đã xoá (soft-delete).</li>
                        </ul>
                        {(() => {
                          const s: any = xoaPreview?.samples ?? {};
                          const flat = [
                            ...(s.gan ?? []).map((x: any) => ({ bang: "gan_chuc_nang", ma: x.ma_thiet_bi ?? x.id, mo_ta: x.ly_do })),
                            ...(s.su_co ?? []).map((x: any) => ({ bang: "su_co", ma: x.ma_su_co ?? x.id, mo_ta: x.tieu_de })),
                            ...(s.bao_tri ?? []).map((x: any) => ({ bang: "bao_tri", ma: x.ma_bao_tri ?? x.id, mo_ta: x.tieu_de })),
                            ...(s.hong_hoc ?? []).map((x: any) => ({ bang: "hong_hoc", ma: x.ma_hong_hoc ?? x.id, mo_ta: x.mo_ta })),
                          ];
                          if (!flat.length) return null;
                          return (
                            <details className="text-xs">
                              <summary className="cursor-pointer">Xem ví dụ bản ghi liên quan ({flat.length})</summary>
                              <ul className="ml-4 mt-1 list-disc space-y-0.5 font-mono">
                                {flat.slice(0, 8).map((it, i) => (
                                  <li key={i}>[{it.bang}] {it.ma} {it.mo_ta ? `— ${it.mo_ta}` : ""}</li>
                                ))}
                              </ul>
                            </details>
                          );
                        })()}
                        <div className="text-xs">Thao tác là <b>soft-delete</b> — có thể khôi phục trong 30 ngày.</div>
                        <div className="pt-1">
                          <label className="text-xs font-medium">Lý do xoá (ghi vào audit log):</label>
                          <input
                            type="text"
                            value={xoaReason}
                            onChange={(e) => setXoaReason(e.target.value)}
                            placeholder="VD: khai nhầm, trùng lặp với TPHT_..."
                            className="mt-1 w-full rounded border bg-background px-2 py-1 text-sm text-foreground"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border p-2 text-muted-foreground">
                        Thành phần đã có <b>{(histCount?.gan ?? 0) + (histCount?.suCo ?? 0) + (histCount?.baoTri ?? 0) + (histCount?.hongHoc ?? 0)}</b> bản ghi lịch sử.
                        Backend chặn xoá — hãy dùng <b>Ngừng</b> hoặc liên hệ người có quyền <span className="font-mono">he_thong.force_delete</span>.
                      </div>
                    )
                  ) : (
                    <div className="text-muted-foreground">Chưa có lịch sử — có thể xoá an toàn.</div>
                  )}
                </div>
              ) : <div />}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              disabled={(hasHistory && !canForceDelete) || busy}
              className={hasHistory ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
              onClick={() => xoaTarget && onXoa(xoaTarget, hasHistory)}
            >
              {hasHistory ? "Xoá cưỡng bức (soft-delete)" : "Xoá"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Đã xoá gần đây — khôi phục trong 30 ngày */}
      {daXoaList.length > 0 && (
        <div className="rounded-md border border-dashed p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            Đã xoá gần đây ({daXoaList.length}) — có thể khôi phục trong 30 ngày
          </div>
          <ul className="space-y-1">
            {daXoaList.map((d: any) => (
              <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0 truncate">
                  <span className="font-mono">{d.ma_thanh_phan}</span> · {d.ten}
                  {d.deleted_reason && <span className="text-muted-foreground"> — {d.deleted_reason}</span>}
                </div>
                <Button
                  size="sm" variant="outline"
                  disabled={khoiPhucMut.isPending}
                  onClick={() => onKhoiPhuc(d.id, d.ten)}
                >
                  Khôi phục
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ThaoTaiSanDialog target={thaoTarget} onClose={() => setThaoTarget(null)} />
    </div>
  );
}


// ---- NHỊP I: form khai/sửa vị trí (KHÔNG có ô serial) ----------------------
function ViTriFormDialog({
  heThongId, target, loaiList, viTriList, onClose,
}: {
  heThongId: string;
  target: ViTriChucNang | null;
  loaiList: Array<{ id: string; ten: string }>;
  viTriList: ViTriChucNang[];
  onClose: () => void;
}) {
  const luuMut = useLuuViTri(heThongId);
  // Mã thành phần chỉ để định danh DUY NHẤT (không mang ý nghĩa) → sinh ngẫu nhiên
  // sẵn cho thành phần mới; khi sửa thì giữ nguyên mã cũ.
  const [ma, setMa] = useState(target?.ma_thanh_phan ?? "");

  const [ten, setTen] = useState(target?.ten ?? "");
  const [loai, setLoai] = useState(target?.loai_thiet_bi_yeu_cau ?? "");
  const [cha, setCha] = useState(target?.thanh_phan_cha ?? "");
  const [batBuoc, setBatBuoc] = useState(target?.bat_buoc ?? true);
  const [thuTu, setThuTu] = useState(target?.thu_tu != null ? String(target.thu_tu) : "");
  const [moTa, setMoTa] = useState(target?.mo_ta ?? "");
  const [hlTu, setHlTu] = useState(target?.hieu_luc_tu ?? "");
  const [hlDen, setHlDen] = useState(target?.hieu_luc_den ?? "");

  const chaOptions = useMemo(
    () => viTriList.filter((v) => v.id !== target?.id).map((v) => ({ value: v.id, label: `${v.ma_thanh_phan} · ${v.ten}` })),
    [viTriList, target],
  );
  const loaiOptions = useMemo(() => loaiList.map((l) => ({ value: l.id, label: l.ten })), [loaiList]);

  const submit = async () => {
    if (!ten.trim()) { toast.error("Nhập tên thành phần"); return; }
    let maFinal = ma.trim();
    try {
      if (!maFinal) maFinal = await sinhMaThanhPhanDuyNhat();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không sinh được mã duy nhất");
      return;
    }
    luuMut.mutate(
      {
        id: target?.id,
        he_thong_id: heThongId,
        ma_thanh_phan: maFinal,
        ten: ten.trim(),
        loai_thiet_bi_yeu_cau: loai || null,
        thanh_phan_cha: cha || null,
        bat_buoc: batBuoc,
        thu_tu: thuTu.trim() ? Number(thuTu) : null,
        mo_ta: moTa.trim() || null,
        hieu_luc_tu: hlTu || null,
        hieu_luc_den: hlDen || null,
      },
      {
        onSuccess: () => { toast.success(target ? "Đã cập nhật thành phần" : "Đã khai thêm thành phần"); onClose(); },
        onError: async (e) => {
          if (await kickNeuHetPhien(e)) return;
          toast.error(thongDiepLoi(e, "Lưu thất bại"));
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{target ? "Sửa thành phần" : "Khai thêm thành phần"}</DialogTitle>
          <DialogDescription>Chỉ khai chức năng — không nhập serial. Gán tài sản cụ thể là thao tác riêng.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Mã thành phần</Label>
              <div className="flex items-center gap-1">
                <Input value={ma} onChange={(e) => setMa(e.target.value)} placeholder="TPHT_XXXXXXXX (bỏ trống → tự sinh)" className="font-mono" />
                <Button type="button" size="icon" variant="outline" className="shrink-0" title="Sinh mã ngẫu nhiên khác (đảm bảo không trùng)" onClick={async () => { try { setMa(await sinhMaThanhPhanDuyNhat()); } catch (e) { toast.error(e instanceof Error ? e.message : "Không sinh được mã duy nhất"); } }}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Thành phần hệ thống</Label>
              <Input value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Cảm biến đo hướng & tốc độ gió" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Chủng loại yêu cầu (tuỳ chọn)</Label>
            <Combobox options={loaiOptions} value={loai} onChange={setLoai} placeholder="Không ràng buộc loại" emptyText="Không có loại" />
          </div>
          <div className="space-y-1">
            <Label>Thuộc thành phần cha (tuỳ chọn)</Label>
            <Combobox options={chaOptions} value={cha} onChange={setCha} placeholder="Không có" emptyText="Chưa có thành phần khác" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Thứ tự</Label>
              <Input value={thuTu} onChange={(e) => setThuTu(e.target.value)} inputMode="numeric" placeholder="1" />
            </div>
            <div className="space-y-1">
              <Label>Hiệu lực từ</Label>
              <Input type="date" value={hlTu} onChange={(e) => setHlTu(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Hiệu lực đến</Label>
              <Input type="date" value={hlDen} onChange={(e) => setHlDen(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Mô tả</Label>
            <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={2} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={batBuoc} onCheckedChange={setBatBuoc} /> Thành phần bắt buộc
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={submit} disabled={luuMut.isPending}>{target ? "Lưu" : "Khai thêm"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- NHỊP II: dialog gán / thay thế tài sản (lọc điều kiện) ----------------
function AssignDialog({
  heThongId, viTri, dangLap, onClose,
}: {
  heThongId: string;
  viTri: ViTriChucNang;
  dangLap?: ThietBiDangLap;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: ranh = [], isLoading } = useThietBiRanh();
  const lapMut = useLapThietBi(heThongId);
  const thayMut = useThayTheThietBi(heThongId);
  const [chon, setChon] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  // Không cho tạo tài sản trực tiếp trong cây hệ thống — tài sản chỉ được khai
  // ở trang Tài sản (thiết bị), sau đó gắn vào thành phần hệ thống ở đây.

  // Xếp hạng: đúng loại yêu cầu lên đầu, nhưng vẫn cho chọn MỌI tài sản rảnh.
  const eligible = useMemo(
    () => rankEligibleDevices(ranh, viTri.loai_thiet_bi_yeu_cau),
    [ranh, viTri.loai_thiet_bi_yeu_cau],
  );
  const options = useMemo(
    () => eligible.map((r) => ({
      value: r.id,
      label: `${r.ma_thiet_bi}${r.ten_thiet_bi ? " · " + r.ten_thiet_bi : ""}`,
      hint: [
        r.ma_serial ? "SN " + r.ma_serial : "",
        r.trang_thai_ten ?? "",
        r.khopLoai ? "" : "khác loại",
        r.soLanLap > 0 ? `đang lắp ${r.soLanLap} vị trí${r.viTriHienTai ? " (vd: " + r.viTriHienTai + ")" : ""}` : "",
      ].filter(Boolean).join(" · "),
    })),
    [eligible],
  );


  const isReplace = Boolean(dangLap);
  const submit = () => {
    if (!chon) { toast.error("Chọn tài sản"); return; }
    const picked = ranh.find((d) => d.id === chon);
    const tbLabel = picked ? `${picked.ma_thiet_bi}${picked.ten_thiet_bi ? " · " + picked.ten_thiet_bi : ""}` : "tài sản";
    const viTriLabel = `${viTri.ma_thanh_phan} · ${viTri.ten}`;
    const onSuccess = () => {
      toast.success(
        isReplace ? `Đã thay thế bằng ${tbLabel} tại ${viTriLabel}` : `Đã lắp ${tbLabel} vào ${viTriLabel}`,
        { description: `Đã ghi gan_chuc_nang · thanh_phan_id=${viTri.id}${picked ? ` · thiet_bi_id=${picked.id}` : ""}` },
      );
      onClose();
    };
    const onError = (e: unknown) => toast.error(e instanceof Error ? e.message : "Thao tác thất bại");
    if (isReplace) {
      thayMut.mutate({ thanhPhanId: viTri.id, thietBiMoiId: chon, ghiChu }, { onSuccess, onError });
    } else {
      lapMut.mutate({ thanhPhanId: viTri.id, thietBiId: chon, ghiChu }, { onSuccess, onError });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isReplace ? "Thay thế tài sản" : "Lắp tài sản"} — {viTri.ten}</DialogTitle>
          <DialogDescription>
            {isReplace
              ? `Tài sản hiện tại: ${dangLap?.ma_thiet_bi}. Chọn tài sản mới thay vào (tài sản cũ sẽ được ghi lịch sử).`
              : "Chọn tài sản để gán. Một tài sản có thể đảm trách nhiều vị trí chức năng khác nhau."}
          </DialogDescription>

        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1">
            <Label>Tài sản {isReplace ? "mới" : ""} ({options.length} đủ điều kiện)</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải danh sách tài sản rảnh…</p>
            ) : (
              <Combobox
                options={options} value={chon} onChange={setChon}
                placeholder="Chọn tài sản…" searchPlaceholder="Tìm theo mã / tên / serial…"
                emptyText="Không có tài sản rảnh đúng loại"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Tài sản chỉ được khai ở trang <span className="font-medium">Tài sản</span>. Ở đây chỉ chọn tài sản đã có để gắn vào thành phần hệ thống.
            </p>
          </div>
          <div className="space-y-1">
            <Label>Ghi chú (tuỳ chọn)</Label>
            <Textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button onClick={submit} disabled={lapMut.isPending || thayMut.isPending}>
            {isReplace ? "Thay thế" : "Lắp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- BƯỚC 7: lý lịch của một vị trí chức năng (các tài sản đã/đang giữ) ----
function ViTriLichSu({ thanhPhanId }: { thanhPhanId: string }) {
  const { data = [], isLoading } = useLyLichViTri(thanhPhanId);
  if (isLoading) return <p className="mt-2 text-xs text-muted-foreground">Đang tải lý lịch…</p>;
  if (data.length === 0) return <p className="mt-2 text-xs text-muted-foreground">Chưa có lịch sử lắp đặt.</p>;
  const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString("vi-VN") : "nay");
  return (
    <ol className="mt-2 space-y-1.5">
      {data.map((r) => (
        <li key={r.gan_id} className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5 text-xs">
          <HardDrive className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono">{r.ma_thiet_bi}</span>
          {r.ma_serial && <span className="text-muted-foreground">SN {r.ma_serial}</span>}
          <span className="text-muted-foreground">· {fmt(r.tu_ngay)} → {fmt(r.den_ngay)}</span>
          <Badge variant={r.den_ngay ? "outline" : "secondary"} className="ml-auto">
            {r.den_ngay ? r.ly_do : "Đang lắp"}
          </Badge>
        </li>
      ))}
    </ol>
  );
}

