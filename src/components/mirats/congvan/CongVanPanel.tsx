import { useMemo, useState } from "react";
import { GitBranch, ListTree, Loader2, Plus, Search, AlertTriangle } from "lucide-react";
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

  const openNew = () => { setEditing(null); setOpen(true); };
  const openCv = (cv: CongVanRow) => { setEditing(cv); setOpen(true); };

  if (error) {
    return <div className="rounded-lg border p-6 text-sm text-rose-600">Không tải được công văn: {error.message}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm số / trích yếu…"
            className="h-8 w-[230px] pl-7 text-sm" />
        </div>
        <Select value={loai} onValueChange={setLoai}>
          <SelectTrigger className="h-8 w-[160px] text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            {Object.entries(LOAI_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-[11px]">{filtered.length} công văn</Badge>
        {quaHan.length > 0 && (
          <Badge variant="outline" className="border-rose-200 bg-rose-50 text-[11px] text-rose-700">
            <AlertTriangle className="mr-1 h-3 w-3" />{quaHan.length} quá hạn phúc đáp
          </Badge>
        )}
        {canEdit && (
          <Button size="sm" className="ml-auto" onClick={openNew}>
            <Plus className="mr-1.5 h-4 w-4" /> Thêm công văn
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-lg border p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải công văn…
        </div>
      ) : (
        <Tabs defaultValue="timeline">
          <TabsList>
            <TabsTrigger value="timeline"><GitBranch className="mr-1.5 h-4 w-4" />Timeline</TabsTrigger>
            <TabsTrigger value="tree"><ListTree className="mr-1.5 h-4 w-4" />Phân cấp</TabsTrigger>
          </TabsList>
          <TabsContent value="timeline" className="mt-3">
            <CongVanTimeline congVans={filtered} links={links} teps={teps} onOpen={openCv} />
          </TabsContent>
          <TabsContent value="tree" className="mt-3">
            <CongVanTree
              congVans={[...filtered].sort((a, b) => cvMoc(a).getTime() - cvMoc(b).getTime())}
              links={links} teps={teps} onOpen={openCv}
            />
          </TabsContent>
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
    </div>
  );
}