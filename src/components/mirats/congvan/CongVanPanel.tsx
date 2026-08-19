import { useMemo, useState } from "react";
import { GitBranch, ListTree, Loader2, Plus, Search, AlertTriangle, FileText, History } from "lucide-react";
import { LayoutPanel } from "@/components/astryx/layout-panel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CongVanTimeline } from "./CongVanTimeline";
import { CongVanTree } from "./CongVanTree";
import { CongVanSheet } from "./CongVanSheet";
import { useCongVanData } from "./use-cong-van";
import { LOAI_META, type CongVanRow, cvMoc } from "./types";
import { buildGraph } from "./chains";

export function CongVanPanel({ duAnId, canEdit }: { duAnId: string; canEdit: boolean }) {
  const { congVans, links, teps, isLoading, error, refresh } = useCongVanData(duAnId);
  const [q, setQ] = useState("");
  const [loai, setLoai] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CongVanRow | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return congVans.filter((c) => {
      if (loai !== "all" && c.loai !== loai) return false;
      if (!needle) return true;
      return `${c.so_cong_van} ${c.trich_yeu ?? ""} ${c.co_quan_ban_hanh ?? ""} ${c.co_quan_nhan ?? ""}`
        .toLowerCase().includes(needle);
    });
  }, [congVans, q, loai]);

  const quaHan = useMemo(() => {
    const now = Date.now();
    return congVans.filter(
      (c) => c.han_phuc_dap && new Date(c.han_phuc_dap).getTime() < now
        && !["hoan_tat", "da_phat_hanh", "huy"].includes(c.trang_thai),
    );
  }, [congVans]);

  const soLuong = useMemo(() => buildGraph(congVans, links).chains.length, [congVans, links]);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openCv = (cv: CongVanRow) => { setEditing(cv); setOpen(true); };

  if (error) {
    return (
      <LayoutPanel variant="error" title="Lỗi tải dữ liệu">
        <div className="p-4 text-sm text-rose-600">
          Không tải được công văn: {error.message}
        </div>
      </LayoutPanel>
    );
  }

  return (
    <LayoutPanel
      title="Hồ sơ Công văn"
      icon={<FileText className="h-4 w-4" />}
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm số / trích yếu…"
              className="h-8 w-[200px] pl-7 text-sm"
            />
          </div>
          <Select value={loai} onValueChange={setLoai}>
            <SelectTrigger className="h-8 w-[140px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {Object.entries(LOAI_META).map(([k, m]) => (
                <SelectItem key={k} value={k}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canEdit && (
            <Button size="sm" onClick={openNew} className="h-8">
              <Plus className="mr-1.5 h-4 w-4" /> Thêm mới
            </Button>
          )}
        </div>
      }
      footer={
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">{filtered.length}</Badge>
            <span>văn bản</span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="h-4 px-1 text-[10px]">{soLuong}</Badge>
            <span>luồng liên kết</span>
          </div>
          {quaHan.length > 0 && (
            <div className="flex items-center gap-1 text-rose-600 font-medium">
              <AlertTriangle className="h-3 w-3" />
              <span>{quaHan.length} quá hạn</span>
            </div>
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : (
        <Tabs defaultValue="timeline" className="w-full">
          <div className="border-b px-4">
            <TabsList className="h-10 bg-transparent p-0">
              <TabsTrigger 
                value="timeline" 
                className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <GitBranch className="mr-1.5 h-4 w-4" /> Timeline
              </TabsTrigger>
              <TabsTrigger 
                value="tree"
                className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-medium text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <ListTree className="mr-1.5 h-4 w-4" /> Phân cấp
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-4">
            <TabsContent value="timeline" className="mt-0 outline-none">
              <CongVanTimeline congVans={filtered} links={links} teps={teps} onOpen={openCv} />
            </TabsContent>
            <TabsContent value="tree" className="mt-0 outline-none">
              <CongVanTree
                congVans={[...filtered].sort((a, b) => cvMoc(a).getTime() - cvMoc(b).getTime())}
                links={links} teps={teps} onOpen={openCv}
              />
            </TabsContent>
          </div>
        </Tabs>
      )}

      <CongVanSheet
        open={open}
        onOpenChange={setOpen}
        duAnId={duAnId}
        editing={editing}
        allCongVan={congVans}
        links={links}
        teps={teps}
        canEdit={canEdit}
        onDone={refresh}
      />
    </LayoutPanel>
  );
}
