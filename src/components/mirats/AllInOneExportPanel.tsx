// ============================================================================
// XUẤT FILE ALL-IN-ONE CÓ CHỌN PHẠM VI: mỗi lớp chọn "Tất cả / Không xuất /
// Chọn cụ thể" (ví dụ chỉ Nhóm 1/2/3). Cascade tự thu hẹp hệ thống & tài sản
// theo phân loại đã chọn; danh mục phụ thuộc (NSX/Mẫu/Loại…) tự kèm đầy đủ.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import {
  Download, Loader2, ChevronDown, ChevronRight, Search, Layers, Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/mirats/InfoHint";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  exportAllInOneXlsx, loadAllInOnePickerData,
  type PickerLayer, type LayerPick,
} from "@/lib/mirats/allinone-template";

type Mode = "all" | "none" | "some";
type PickState = { mode: Mode; ids: Set<string> };

export function AllInOneExportPanel() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<PickerLayer[]>([]);
  const [picks, setPicks] = useState<Record<string, PickState>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState<Record<string, string>>({});
  const [autoDeps, setAutoDeps] = useState(true);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await loadAllInOnePickerData();
        setData(d);
        const init: Record<string, PickState> = {};
        for (const l of d) init[l.table] = { mode: "all", ids: new Set() };
        setPicks(init);
      } catch (e) {
        toast.error("Không nạp được danh sách: " + (e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setMode(table: string, mode: Mode) {
    setPicks((p) => ({ ...p, [table]: { ...p[table], mode } }));
    if (mode === "some") setExpanded(table);
  }
  function toggleId(table: string, id: string) {
    setPicks((p) => {
      const cur = new Set(p[table].ids);
      cur.has(id) ? cur.delete(id) : cur.add(id);
      return { ...p, [table]: { mode: "some", ids: cur } };
    });
  }
  function selectAllVisible(table: string, ids: string[], on: boolean) {
    setPicks((p) => {
      const cur = new Set(p[table].ids);
      for (const id of ids) on ? cur.add(id) : cur.delete(id);
      return { ...p, [table]: { mode: "some", ids: cur } };
    });
  }

  const summary = useMemo(() => {
    let full = 0, some = 0, none = 0;
    for (const l of data) {
      const m = picks[l.table]?.mode ?? "all";
      if (m === "all") full++; else if (m === "some") some++; else none++;
    }
    return { full, some, none };
  }, [data, picks]);

  async function doExport() {
    setBusy(true);
    try {
      const out: Record<string, LayerPick> = {};
      for (const l of data) {
        const st = picks[l.table];
        if (!st || st.mode === "all") continue;
        out[l.table] = st.mode === "none" ? { mode: "none" } : { mode: "some", ids: [...st.ids] };
      }
      await exportAllInOneXlsx({ withData: true, picks: out, autoDeps, compact });
      toast.success(compact ? "Đã tải mẫu rút gọn theo phạm vi đã chọn" : "Đã tải file all-in-one theo phạm vi đã chọn");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" /> Xuất dữ liệu hiện có (chọn phạm vi)
          <InfoHint>
            Mỗi lớp chọn <b>Tất cả</b> / <b>Không xuất</b> / <b>Chọn cụ thể</b> (ví dụ chỉ Nhóm 1/2/3).
            Chọn Phân loại/Nhóm hệ thống thì Hệ thống & Tài sản tự thu hẹp theo; danh mục liên quan (NSX, Mẫu, Loại…) tự kèm đầy đủ.
          </InfoHint>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang nạp danh sách dữ liệu…
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline">Tất cả: {summary.full}</Badge>
              <Badge variant="outline">Chọn cụ thể: {summary.some}</Badge>
              <Badge variant="outline">Bỏ qua: {summary.none}</Badge>
            </div>

            <div className="divide-y rounded-md border">
              {data.map((l) => {
                const st = picks[l.table] ?? { mode: "all" as Mode, ids: new Set<string>() };
                const q = (search[l.table] ?? "").toLowerCase();
                const filtered = q
                  ? l.records.filter((r) => (r.ma + " " + r.ten).toLowerCase().includes(q))
                  : l.records;
                const isOpen = expanded === l.table;
                return (
                  <div key={l.table} className="p-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-1.5 text-left text-sm font-medium"
                        onClick={() => setExpanded(isOpen ? null : l.table)}
                      >
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {l.sheet}
                        <span className="text-xs font-normal text-muted-foreground">({l.count})</span>
                        {st.mode === "some" && (
                          <Badge className="ml-1 bg-primary/90 text-meta">{st.ids.size} chọn</Badge>
                        )}
                      </button>
                      <div className="flex gap-1">
                        {(["all", "some", "none"] as Mode[]).map((m) => (
                          <Button
                            key={m}
                            size="sm"
                            variant={st.mode === m ? "default" : "outline"}
                            className="h-7 px-2 text-xs"
                            onClick={() => setMode(l.table, m)}
                          >
                            {m === "all" ? "Tất cả" : m === "some" ? "Chọn cụ thể" : "Không xuất"}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {isOpen && st.mode === "some" && (
                      <div className="mt-2 space-y-2 rounded-md bg-muted/30 p-2">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={search[l.table] ?? ""}
                              onChange={(e) => setSearch((s) => ({ ...s, [l.table]: e.target.value }))}
                              placeholder="Tìm mã/tên…"
                              className="h-7 pl-7 text-xs"
                            />
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => selectAllVisible(l.table, filtered.map((r) => r.id), true)}>
                            Chọn hết ({filtered.length})
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => selectAllVisible(l.table, filtered.map((r) => r.id), false)}>
                            Bỏ chọn
                          </Button>
                        </div>
                        <div className="max-h-52 space-y-0.5 overflow-auto">
                          {filtered.length === 0 ? (
                            <p className="py-2 text-center text-xs text-muted-foreground">Không có bản ghi</p>
                          ) : filtered.map((r) => (
                            <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-background">
                              <Checkbox checked={st.ids.has(r.id)} onCheckedChange={() => toggleId(l.table, r.id)} />
                              <span className="font-mono text-meta text-muted-foreground">{r.ma}</span>
                              <span className="truncate">{r.ten}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs">
              <Checkbox checked={autoDeps} onCheckedChange={(v) => setAutoDeps(!!v)} className="mt-0.5" />
              <span className="text-muted-foreground">
                <b className="text-foreground">Tự động kèm danh mục liên quan đầy đủ</b> — khi xuất Hệ thống/Tài sản,
                các Nhà sản xuất, Model, Chủng loại… mà chúng dùng sẽ được xuất kèm để nhập lại không bị thiếu liên kết.
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-2 rounded-md border border-amber-400/30 bg-amber-50/60 p-2.5 text-xs dark:bg-amber-500/10">
              <Checkbox checked={compact} onCheckedChange={(v) => setCompact(!!v)} className="mt-0.5" />
              <span className="text-muted-foreground">
                <b className="text-foreground">Mẫu rút gọn</b> — chỉ giữ các cột <b>bắt buộc</b> và <b>hay dùng</b> (Mã, Tên, Hệ thống,
                Lắp vào vị trí, Serial, Model…). Giảm số cột phải nhập; các trường còn lại vẫn khai được bằng mẫu đầy đủ.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={doExport} disabled={busy}>
                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
                Xuất file .xlsx theo phạm vi
              </Button>
              <span className="flex items-center gap-1 text-meta text-muted-foreground">
                <Info className="h-3 w-3" /> Giữ cột <b>mã</b> để nhập lại là cập nhật, không nhân bản.
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
