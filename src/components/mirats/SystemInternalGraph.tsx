// ============================================================================
// SystemInternalGraph — DRILL TẦNG 3 trong Toàn cảnh.
//
// Hiển thị các THÀNH PHẦN/KHE bên trong MỘT hệ thống và các liên kết giữa chúng
// (bảng `lien_ket_khe`). Ở CHẾ ĐỘ VẼ (chỉ người quản lý): kéo từ điểm nguồn sang
// điểm đích để tạo liên kết — ghi thẳng vào database, không phải hình tĩnh.
// Phạm vi: chỉ nối các thành phần thuộc CÙNG hệ thống này.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Pencil, Eye, Trash2, Cpu, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useKheDoThi, useLoaiLienKet, useThemKheLienKet, useXoaKheLienKet,
  type KheNode, type KheLink,
} from "@/lib/mirats/lien-ket";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { Link } from "@tanstack/react-router";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FGType = any;

function useForceGraphComponent(): FGType | null {
  const [Comp, setComp] = useState<FGType | null>(null);
  useEffect(() => {
    let alive = true;
    import("react-force-graph-2d").then((m) => { if (alive) setComp(() => m.default); });
    return () => { alive = false; };
  }, []);
  return Comp;
}

interface INode { id: string; ten: string; sub: string | null; hasDev: boolean; x?: number; y?: number; }
interface ILink { id: string; source: string | INode; target: string | INode; mau: string; loai_ten: string | null; }

function idOf(x: string | INode): string { return typeof x === "string" ? x : x.id; }

export function SystemInternalGraph({
  systemId, systemName, canManage, onBack, onJumpSystem,
}: {
  systemId: string;
  systemName: string;
  canManage: boolean;
  onBack: () => void;
  /** Chuyển drill sang một hệ thống anh em ngay trong Toàn cảnh. */
  onJumpSystem?: (id: string, ten: string) => void;
}) {
  const ForceGraph = useForceGraphComponent();
  const { doThi, isLoading } = useKheDoThi(systemId);
  const { loaiList } = useLoaiLienKet();
  const themMut = useThemKheLienKet();
  const xoaMut = useXoaKheLienKet();

  const [edit, setEdit] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [delLink, setDelLink] = useState<KheLink | null>(null);

  // Hộp thoại tạo liên kết sau khi kéo xong.
  const [connect, setConnect] = useState<{ from: KheNode; to: KheNode } | null>(null);
  const [loaiId, setLoaiId] = useState("");
  const [gdNguon, setGdNguon] = useState("");
  const [gdDich, setGdDich] = useState("");

  const fgRef = useRef<FGType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 800, h: 560 });
  const didFit = useRef(false);

  // Kéo-nối: giữ node nguồn + toạ độ tạm để vẽ đường theo con trỏ.
  const dragFrom = useRef<INode | null>(null);
  const overlayRef = useRef<SVGLineElement>(null);
  const [dragging, setDragging] = useState(false);
  const hoverIdRef = useRef<string | null>(null);
  useEffect(() => { hoverIdRef.current = hoverId; }, [hoverId]);

  const nodeById = useMemo(() => new Map(doThi.nodes.map((n) => [n.id, n])), [doThi.nodes]);

  const nodeCache = useRef(new Map<string, INode>());
  const fgData = useMemo(() => {
    const alive = new Set(doThi.nodes.map((n) => n.id));
    for (const k of [...nodeCache.current.keys()]) if (!alive.has(k)) nodeCache.current.delete(k);
    const nodes: INode[] = doThi.nodes.map((n) => {
      const cached = nodeCache.current.get(n.id) ?? ({} as INode);
      Object.assign(cached, {
        id: n.id,
        ten: n.ten,
        sub: n.thiet_bi_ten,
        hasDev: !!n.thiet_bi_ten,
      });
      nodeCache.current.set(n.id, cached);
      return cached;
    });
    const links: ILink[] = doThi.links.map((l) => ({
      id: l.id, source: l.khe_nguon_id, target: l.khe_dich_id, mau: l.mau_sac, loai_ten: l.loai_ten,
    }));
    return { nodes, links };
  }, [doThi]);

  useEffect(() => { didFit.current = false; }, [systemId, fgData.nodes.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDims({ w: el.clientWidth, h: Math.max(460, el.clientHeight) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const paintNode = useCallback((node: INode, ctx: CanvasRenderingContext2D, scale: number) => {
    const r = 5;
    const isHover = node.id === hoverId;
    ctx.beginPath();
    ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI);
    ctx.fillStyle = node.hasDev ? "#16a34a" : "#94a3b8";
    ctx.fill();
    if (isHover) {
      ctx.strokeStyle = edit ? "#2563eb" : "#0f172a";
      ctx.lineWidth = 2 / scale + 0.5;
      ctx.stroke();
    }
    const fs = Math.max(3.5, 11 / scale);
    ctx.font = `600 ${fs}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#334155";
    ctx.fillText(node.ten, node.x ?? 0, (node.y ?? 0) + r + 1.5);
    if (node.sub && (isHover || scale >= 1.6)) {
      const fs2 = Math.max(3, 8.5 / scale);
      ctx.font = `${fs2}px Inter, sans-serif`;
      ctx.fillStyle = "#64748b";
      ctx.fillText(node.sub, node.x ?? 0, (node.y ?? 0) + r + 1.5 + fs + 1);
    }
  }, [hoverId, edit]);

  // Vẽ đường tạm khi kéo-nối, cập nhật qua ref (không setState mỗi pixel).
  const updateOverlay = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current, fg = fgRef.current, line = overlayRef.current;
    if (!el || !fg || !line || !dragFrom.current) return;
    const rect = el.getBoundingClientRect();
    const p = fg.graph2ScreenCoords(dragFrom.current.x ?? 0, dragFrom.current.y ?? 0);
    line.setAttribute("x1", String(p.x));
    line.setAttribute("y1", String(p.y));
    line.setAttribute("x2", String(clientX - rect.left));
    line.setAttribute("y2", String(clientY - rect.top));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!edit || e.button !== 0) return;
    const id = hoverIdRef.current;
    if (!id) return;
    const src = fgData.nodes.find((n) => n.id === id);
    if (!src) return;
    dragFrom.current = src;
    setDragging(true);
    updateOverlay(e.clientX, e.clientY);
  }, [edit, fgData.nodes, updateOverlay]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragFrom.current) updateOverlay(e.clientX, e.clientY);
  }, [updateOverlay]);

  const endDrag = useCallback(() => {
    const from = dragFrom.current;
    dragFrom.current = null;
    setDragging(false);
    if (!from) return;
    const targetId = hoverIdRef.current;
    if (!targetId || targetId === from.id) return;
    const fromNode = nodeById.get(from.id);
    const toNode = nodeById.get(targetId);
    if (!fromNode || !toNode) return;
    // Ngăn tạo trùng liên kết cùng chiều.
    const dup = doThi.links.some((l) => l.khe_nguon_id === from.id && l.khe_dich_id === targetId);
    if (dup) { toast.info("Đã có liên kết giữa hai thành phần này."); return; }
    setLoaiId(loaiList[0]?.id ?? "");
    setGdNguon(""); setGdDich("");
    setConnect({ from: fromNode, to: toNode });
  }, [nodeById, doThi.links, loaiList]);

  const onLinkClick = useCallback((l: ILink) => {
    if (!edit) return;
    const row = doThi.links.find((r) => r.id === l.id);
    if (row) setDelLink(row);
  }, [edit, doThi.links]);

  const doCreate = async () => {
    if (!connect || !loaiId) return;
    // Đóng dialog trước để cảm nhận tức thì; hook đã optimistic + toast tự lo.
    const payload = {
      he_thong_id: systemId,
      khe_nguon_id: connect.from.id,
      khe_dich_id: connect.to.id,
      loai_lien_ket_id: loaiId,
      don_vi_id_snapshot: doThi.don_vi_id,
      giao_dien_nguon: gdNguon.trim() || null,
      giao_dien_dich: gdDich.trim() || null,
    };
    setConnect(null);
    themMut.mutate(payload);
  };

  const doDelete = async () => {
    if (!delLink) return;
    const payload = { id: delLink.id, he_thong_id: systemId };
    setDelLink(null);
    xoaMut.mutate(payload);
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      {/* Thanh trên: breadcrumb + chế độ vẽ */}
      <div className="flex flex-wrap items-center gap-2 border-b p-2">
        <Button size="sm" variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" />Lùi tầng</Button>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Cpu className="h-3.5 w-3.5" />
          <span className="font-medium text-foreground">{systemName}</span>
          <span>· thành phần &amp; liên kết nội bộ</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 text-meta"><Link2 className="h-3 w-3" />{doThi.links.length} liên kết</Badge>
          {canManage && (
            <Button size="sm" variant={edit ? "default" : "outline"} onClick={() => { setEdit((v) => !v); dragFrom.current = null; setDragging(false); }}>
              {edit ? <><Eye className="mr-1 h-4 w-4" />Xem</> : <><Pencil className="mr-1 h-4 w-4" />Vẽ liên kết</>}
            </Button>
          )}
        </div>
      </div>

      {edit && (
        <div className="border-b bg-primary/5 px-3 py-1.5 text-xs text-muted-foreground">
          Kéo từ một điểm sang điểm khác để tạo liên kết. Bấm vào một đường để gỡ.
        </div>
      )}

      <div
        ref={containerRef}
        className={`relative h-[560px] w-full bg-[hsl(var(--muted)/0.25)] ${edit ? "cursor-crosshair" : ""}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={() => { if (dragFrom.current) endDrag(); }}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Đang tải thành phần…</div>
        ) : fgData.nodes.length === 0 ? (
          <EmptyStateWithSuggestions
            systemId={systemId}
            systemName={systemName}
            onJumpSystem={onJumpSystem}
          />
        ) : ForceGraph ? (
          <ForceGraph
            ref={fgRef}
            width={dims.w}
            height={dims.h}
            graphData={fgData}
            nodeId="id"
            nodeRelSize={5}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(n: INode, color: string, ctx: CanvasRenderingContext2D) => {
              ctx.fillStyle = color; ctx.beginPath();
              ctx.arc(n.x ?? 0, n.y ?? 0, 8, 0, 2 * Math.PI); ctx.fill();
            }}
            linkColor={(l: ILink) => l.mau}
            linkWidth={2}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            enableNodeDrag={!edit}
            onNodeHover={(n: INode | null) => setHoverId(n?.id ?? null)}
            onLinkHover={() => { /* noop */ }}
            onLinkClick={onLinkClick}
            onEngineStop={() => { if (!didFit.current) { fgRef.current?.zoomToFit(500, 60); didFit.current = true; } }}
            cooldownTicks={60}
            cooldownTime={4000}
            warmupTicks={12}
            d3VelocityDecay={0.5}
            d3AlphaDecay={0.06}
            enableZoomInteraction={!edit}
            enablePanInteraction={!edit}
            enableZoomPanInteraction={!edit}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Đang tải sơ đồ…</div>
        )}

        {/* Đường kéo-nối tạm */}
        {dragging && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            <line ref={overlayRef} stroke="#2563eb" strokeWidth={2} strokeDasharray="5 4" />
          </svg>
        )}
      </div>

      {/* Hộp thoại: chọn loại liên kết sau khi kéo */}
      <Dialog open={!!connect} onOpenChange={(o) => !o && setConnect(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo liên kết thành phần</DialogTitle>
            <DialogDescription>
              {connect ? `${connect.from.ten} → ${connect.to.ten}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Loại liên kết</Label>
              <Select value={loaiId} onValueChange={setLoaiId}>
                <SelectTrigger><SelectValue placeholder="Chọn loại liên kết" /></SelectTrigger>
                <SelectContent>
                  {loaiList.map((lk) => (
                    <SelectItem key={lk.id} value={lk.id}>{lk.ten}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Cổng/giao diện nguồn</Label>
                <Input value={gdNguon} onChange={(e) => setGdNguon(e.target.value)} placeholder="VD: LAN1" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cổng/giao diện đích</Label>
                <Input value={gdDich} onChange={(e) => setGdDich(e.target.value)} placeholder="VD: WAN" className="h-8 text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConnect(null)}>Huỷ</Button>
            <Button onClick={doCreate} disabled={!loaiId || themMut.isPending}>
              {themMut.isPending ? "Đang lưu…" : "Tạo liên kết"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Xác nhận gỡ liên kết */}
      <AlertDialog open={!!delLink} onOpenChange={(o) => !o && setDelLink(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ liên kết thành phần?</AlertDialogTitle>
            <AlertDialogDescription>
              {delLink ? `${nodeById.get(delLink.khe_nguon_id)?.ten ?? "?"} → ${nodeById.get(delLink.khe_dich_id)?.ten ?? "?"}${delLink.loai_ten ? ` (${delLink.loai_ten})` : ""}` : ""}
              . Thao tác này xoá liên kết khỏi database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="mr-1 h-4 w-4" />Gỡ liên kết
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trạng thái rỗng có gợi ý: khi hệ thống hiện tại chưa khai thành phần nào,
// tìm các hệ thống anh em có tên gần giống (chia sẻ token đầu tiên có nghĩa)
// và hiển thị số thành phần để người dùng biết chuyển sang đâu.
// ---------------------------------------------------------------------------
function useHeThongGoiY(systemId: string, systemName: string) {
  // Token có nghĩa: bỏ các từ chung như "Hệ", "thống", "Máy"…
  const stop = new Set(["hệ", "he", "thống", "thong", "máy", "may", "hệ thống"]);
  const firstToken = (systemName || "")
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => s && !stop.has(s.toLowerCase()))[0] ?? "";

  return useQuery({
    queryKey: ["he-thong-goi-y", firstToken, systemId],
    enabled: !!firstToken,
    staleTime: 30_000,
    queryFn: async () => {
      const { data: ds, error } = await supabase
        .from("dm_he_thong")
        .select("id, ten")
        .ilike("ten", `%${firstToken}%`)
        .neq("id", systemId)
        .limit(10);
      if (error) throw error;
      const ids = (ds ?? []).map((r) => r.id);
      if (ids.length === 0) return [] as Array<{ id: string; ten: string; count: number }>;
      const { data: tps, error: e2 } = await supabase
        .from("he_thong_thanh_phan")
        .select("he_thong_id")
        .in("he_thong_id", ids)
        .is("hieu_luc_den", null);
      if (e2) throw e2;
      const count = new Map<string, number>();
      for (const r of (tps ?? []) as Array<{ he_thong_id: string }>) {
        count.set(r.he_thong_id, (count.get(r.he_thong_id) ?? 0) + 1);
      }
      return (ds ?? [])
        .map((r) => ({ id: r.id, ten: r.ten as string, count: count.get(r.id) ?? 0 }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

function EmptyStateWithSuggestions({
  systemId, systemName, onJumpSystem,
}: {
  systemId: string;
  systemName: string;
  onJumpSystem?: (id: string, ten: string) => void;
}) {
  const { data: goiY = [] } = useHeThongGoiY(systemId, systemName);
  const coDuLieu = goiY.filter((x) => x.count > 0);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
      <Cpu className="h-8 w-8 opacity-50" />
      <div>
        <div className="font-medium text-foreground">"{systemName}" chưa khai thành phần nào.</div>
        <div className="mt-1 text-xs">
          Đây là bản ghi hệ thống rỗng trong CSDL — chưa có dòng nào trong <span className="font-mono">he_thong_thanh_phan</span>.
          Vào chi tiết hệ thống và bấm <b>Khai thêm thành phần</b> để bắt đầu.
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" variant="default" asChild>
          <Link to="/he-thong/$id" params={{ id: systemId }}>Mở chi tiết hệ thống</Link>
        </Button>
      </div>

      {coDuLieu.length > 0 && (
        <div className="mt-2 w-full max-w-md rounded-md border bg-background p-3 text-left">
          <div className="mb-2 text-xs">
            Có <b>{coDuLieu.length}</b> hệ thống tên gần giống <b>đã có thành phần</b> — có thể bạn muốn xem một trong số này:
          </div>
          <ul className="space-y-1">
            {coDuLieu.slice(0, 5).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-foreground">{s.ten}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className="text-meta">{s.count} TP</Badge>
                  {onJumpSystem ? (
                    <Button size="sm" variant="outline" onClick={() => onJumpSystem(s.id, s.ten)}>
                      Mở
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/he-thong/$id" params={{ id: s.id }}>Mở</Link>
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
