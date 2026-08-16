import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Save, Loader2, Link2, AtSign, Search, X } from "lucide-react";
import { toast } from "sonner";
import { getNodeNote, upsertNodeNote, searchNotes } from "@/lib/node-notes.functions";

import {
  useHeThongPickList,
  useLoaiLienKet,
  useLienKetCuaHeThong,
  useAddLienKet,
  type HeThongOption,
} from "@/lib/mirats/lien-ket";

// -----------------------------------------------------------------------------
// NodeNoteDrawer — sổ ghi chú Markdown (Obsidian-style) cho 1 node bất kỳ.
// Cú pháp @mention: gõ `@` + tên hệ thống → chọn từ danh sách → chèn dạng
// wiki-link `[[Tên|id]]`. Khi node hiện tại là hệ thống, các mention sẽ tự
// động tạo liên kết `lien_ket_he_thong` khi lưu (bỏ qua các liên kết đã có).
// -----------------------------------------------------------------------------

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Regex bắt wiki-link `[[Tên|id]]` — id là uuid (đơn giản hoá: chuỗi ko chứa `]`).
const MENTION_RE = /\[\[([^\]|]+)\|([^\]]+)\]\]/g;

function extractMentions(md: string): { ten: string; id: string }[] {
  const out: { ten: string; id: string }[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(md)) !== null) {
    const id = m[2].trim();
    if (!seen.has(id)) {
      seen.add(id);
      out.push({ ten: m[1].trim(), id });
    }
  }
  return out;
}

// Chuyển `[[Tên|id]]` thành markdown link để ReactMarkdown render đẹp.
function mdWithMentions(src: string): string {
  return src.replace(MENTION_RE, (_all, ten, id) => `[**@${ten}**](#mirats-node-${id})`);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeType: "he_thong" | "thanh_phan" | null;
  nodeId: string | null;
  nodeTen: string | null;
  /** Cho phép nhảy sang node khác từ kết quả tìm kiếm ghi chú. */
  onJumpNode?: (n: { type: "he_thong" | "thanh_phan"; id: string; ten: string }) => void;
};

export function NodeNoteDrawer(props: Props) {
  const { open, onOpenChange, nodeType, nodeId, nodeTen, onJumpNode } = props;
  const qc = useQueryClient();
  const getFn = useServerFn(getNodeNote);
  const saveFn = useServerFn(upsertNodeNote);
  const searchFn = useServerFn(searchNotes);


  const queryKey = ["node_note", nodeType, nodeId] as const;
  const noteQuery = useQuery({
    queryKey,
    enabled: !!(open && nodeType && nodeId),
    queryFn: () => getFn({ data: { node_type: nodeType!, node_id: nodeId! } }),
  });

  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- @mention state ---------------------------------------------------------
  const { heThongList } = useHeThongPickList();
  const { loaiList } = useLoaiLienKet();
  const isHeThong = nodeType === "he_thong";
  const existingLinks = useLienKetCuaHeThong(isHeThong ? nodeId ?? undefined : undefined);
  const addLienKet = useAddLienKet();

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [mentionIdx, setMentionIdx] = useState(0);

  const filteredOptions = useMemo<HeThongOption[]>(() => {
    if (mentionQuery == null) return [];
    const q = mentionQuery.toLowerCase().trim();
    return heThongList
      .filter((h) => h.id !== nodeId) // không tự trỏ vào chính mình
      .filter(
        (h) =>
          q === "" ||
          h.ten.toLowerCase().includes(q) ||
          (h.ma?.toLowerCase() ?? "").includes(q),
      )
      .slice(0, 8);
  }, [heThongList, mentionQuery, nodeId]);

  useEffect(() => {
    if (!open) return;
    const val = noteQuery.data?.noi_dung ?? "";
    setDraft(val);
    setDirty(false);
  }, [noteQuery.data, open, nodeId]);

  // Cập nhật gợi ý @ dựa trên vị trí caret.
  const onDraftChange = (val: string, caret: number) => {
    setDraft(val);
    setDirty(true);
    // Tìm token `@...` liền trước caret.
    let i = caret - 1;
    while (i >= 0 && /[^\s@]/.test(val[i])) i--;
    if (i >= 0 && val[i] === "@") {
      const token = val.slice(i + 1, caret);
      // Không kích hoạt nếu ký tự trước @ là ký tự có nghĩa (email, etc.)
      const prev = val[i - 1];
      if (!prev || /\s/.test(prev) || prev === "\n" || prev === "(") {
        setMentionStart(i);
        setMentionQuery(token);
        setMentionIdx(0);
        return;
      }
    }
    setMentionStart(-1);
    setMentionQuery(null);
  };

  const insertMention = (opt: HeThongOption) => {
    if (mentionStart < 0) return;
    const before = draft.slice(0, mentionStart);
    const ta = textareaRef.current;
    const caret = ta?.selectionStart ?? draft.length;
    const after = draft.slice(caret);
    const token = `[[${opt.ten}|${opt.id}]] `;
    const next = before + token + after;
    setDraft(next);
    setDirty(true);
    setMentionStart(-1);
    setMentionQuery(null);
    // Đưa caret về sau chuỗi vừa chèn.
    requestAnimationFrame(() => {
      if (!ta) return;
      const pos = (before + token).length;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const onKeyDownTextarea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery != null && filteredOptions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIdx((i) => (i + 1) % filteredOptions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIdx((i) => (i - 1 + filteredOptions.length) % filteredOptions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredOptions[mentionIdx]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionStart(-1);
        setMentionQuery(null);
        return;
      }
    }
  };

  const mentions = useMemo(() => extractMentions(draft), [draft]);

  // Danh sách id hệ thống đã có liên kết với node hiện tại (2 chiều).
  const existingIds = useMemo(() => {
    if (!isHeThong || !nodeId) return new Set<string>();
    const s = new Set<string>();
    for (const r of existingLinks.rows as any[]) {
      if (r.nguon_id === nodeId) s.add(r.dich_id);
      else if (r.dich_id === nodeId) s.add(r.nguon_id);
    }
    return s;
  }, [existingLinks.rows, isHeThong, nodeId]);

  const missingMentions = useMemo(
    () => mentions.filter((m) => isHeThong && m.id !== nodeId && !existingIds.has(m.id)),
    [mentions, existingIds, isHeThong, nodeId],
  );

  const saveMut = useMutation({
    mutationFn: async () => {
      await saveFn({ data: { node_type: nodeType!, node_id: nodeId!, noi_dung: draft } });
      // Tự tạo liên kết hệ thống cho các @mention mới (chỉ khi node là hệ thống).
      if (isHeThong && missingMentions.length > 0) {
        const defaultLoai = loaiList[0];
        if (!defaultLoai) {
          toast.warning("Chưa có loại liên kết mặc định — @mention chỉ ghi trong ghi chú");
        } else {
          let created = 0;
          for (const m of missingMentions) {
            try {
              await addLienKet.mutateAsync({
                he_thong_nguon_id: nodeId!,
                he_thong_dich_id: m.id,
                loai_lien_ket_id: defaultLoai.id,
                lop: "logic" as any,
                huong: "hai_chieu" as any,
                ghi_chu: "Tạo từ @mention trong ghi chú",
              });
              created++;
            } catch (err) {
              console.warn("[NodeNoteDrawer] không tạo được liên kết", m, err);
            }
          }
          if (created > 0) toast.success(`Đã tạo ${created} liên kết từ @mention`);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["noted_node_ids"] });
      qc.invalidateQueries({ queryKey: ["v_do_thi_he_thong"] });
      qc.invalidateQueries({ queryKey: ["lien_ket_he_thong_cua"] });
      setDirty(false);
      toast.success("Đã lưu ghi chú");
    },
    onError: (e: any) => toast.error(e?.message ?? "Không lưu được ghi chú"),
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && nodeType && nodeId) saveMut.mutate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dirty, nodeType, nodeId, saveMut]);

  const updatedAt = noteQuery.data?.updated_at;

  // --- Tìm ghi chú (full-text ILIKE trên nội dung Markdown) ---
  const [searchQ, setSearchQ] = useState("");
  const [searchDeb, setSearchDeb] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearchDeb(searchQ.trim()), 250);
    return () => clearTimeout(t);
  }, [searchQ]);
  const searchQuery = useQuery({
    queryKey: ["node_note_search", searchDeb],
    enabled: searchDeb.length >= 2,
    queryFn: () => searchFn({ data: { q: searchDeb } }),
    staleTime: 15_000,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl flex flex-col">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Ghi chú node
            {nodeType && (
              <Badge variant="outline" className="text-meta font-mono">
                {nodeType === "he_thong" ? "Hệ thống" : "Thành phần"}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="truncate">
            {nodeTen ?? "—"}{" "}
            {updatedAt && (
              <span className="text-xs text-muted-foreground">
                · cập nhật {fmtDateTime(updatedAt)}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="split" className="flex-1 flex flex-col mt-2 min-h-0">
          <TabsList className="w-fit">
            <TabsTrigger value="split">Soạn + Xem trước</TabsTrigger>
            <TabsTrigger value="edit">Soạn</TabsTrigger>
            <TabsTrigger value="preview">Xem trước</TabsTrigger>
            <TabsTrigger value="search"><Search className="h-3 w-3 mr-1" />Tìm ghi chú</TabsTrigger>
          </TabsList>

          {/* SPLIT VIEW — editor + live preview cạnh nhau, cuộn độc lập */}
          <TabsContent value="split" className="flex-1 min-h-0 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-full min-h-[320px]">
              <div className="relative min-h-0">
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => onDraftChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
                  onKeyDown={onKeyDownTextarea}
                  placeholder={`# ${nodeTen ?? "Ghi chú"}\n\nGõ @ để liên kết nhanh tới hệ thống khác.\nCtrl+S để lưu.`}
                  className="h-full min-h-[320px] font-mono text-sm resize-none"
                  disabled={noteQuery.isLoading}
                />
                {mentionQuery != null && filteredOptions.length > 0 && (
                  <div className="absolute left-3 bottom-3 z-20 w-[320px] max-h-[240px] overflow-auto rounded-md border bg-popover shadow-lg text-sm">
                    <div className="px-2 py-1 text-meta uppercase tracking-wide text-muted-foreground border-b flex items-center gap-1">
                      <AtSign className="h-3 w-3" /> Liên kết nhanh · ↑↓ · Enter
                    </div>
                    {filteredOptions.map((opt, i) => (
                      <button
                        type="button"
                        key={opt.id}
                        onMouseDown={(e) => { e.preventDefault(); insertMention(opt); }}
                        onMouseEnter={() => setMentionIdx(i)}
                        className={`w-full text-left px-2 py-1.5 flex items-center gap-2 ${i === mentionIdx ? "bg-accent" : ""}`}
                      >
                        <span className="font-mono text-meta text-muted-foreground w-14 truncate">{opt.ma}</span>
                        <span className="truncate">{opt.ten}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="overflow-auto rounded-md border bg-muted/20 p-3 min-h-0">
                {draft.trim() ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{mdWithMentions(draft)}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Xem trước sẽ xuất hiện ở đây khi bạn nhập nội dung.</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="flex-1 min-h-0 mt-2">
            <div className="relative h-full">
              <Textarea
                value={draft}
                onChange={(e) => onDraftChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
                onKeyDown={onKeyDownTextarea}
                placeholder={`# ${nodeTen ?? "Ghi chú"}\n\nGõ @ để liên kết nhanh tới hệ thống khác.\nCtrl+S để lưu.`}
                className="h-full min-h-[320px] font-mono text-sm resize-none"
                disabled={noteQuery.isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 min-h-0 mt-2 overflow-auto rounded-md border bg-muted/20 p-4">
            {draft.trim() ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{mdWithMentions(draft)}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Chưa có nội dung.</p>
            )}
          </TabsContent>

          {/* SEARCH — lọc node theo nội dung Markdown đã lưu */}
          <TabsContent value="search" className="flex-1 min-h-0 mt-2 flex flex-col gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Nhập từ khoá trong ghi chú (≥ 2 ký tự)…"
                className="pl-8 pr-8 h-9"
              />
              {searchQ && (
                <button
                  type="button"
                  onClick={() => setSearchQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Xoá tìm kiếm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-auto rounded-md border">
              {searchDeb.length < 2 ? (
                <p className="text-sm text-muted-foreground italic p-3">Nhập ít nhất 2 ký tự để tìm.</p>
              ) : searchQuery.isLoading ? (
                <p className="text-sm text-muted-foreground italic p-3 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tìm…
                </p>
              ) : !searchQuery.data || searchQuery.data.length === 0 ? (
                <p className="text-sm text-muted-foreground italic p-3">Không tìm thấy ghi chú nào khớp.</p>
              ) : (
                <ul className="divide-y">
                  {searchQuery.data.map((r) => (
                    <li key={`${r.node_type}:${r.node_id}`}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent flex flex-col gap-0.5"
                        onClick={() => {
                          onJumpNode?.({ type: r.node_type, id: r.node_id, ten: r.ten });
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-meta font-mono">
                            {r.node_type === "he_thong" ? "Hệ thống" : "Thành phần"}
                          </Badge>
                          <span className="text-sm font-medium truncate">{r.ten}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{r.snippet}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
        </Tabs>



        {mentions.length > 0 && (
          <div className="mt-2 rounded-md border bg-muted/20 p-2 space-y-1">
            <div className="text-meta uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <Link2 className="h-3 w-3" /> Liên kết được đề cập ({mentions.length})
              {isHeThong && missingMentions.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-meta">
                  {missingMentions.length} sẽ tạo mới khi lưu
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {mentions.map((m) => {
                const isNew = isHeThong && !existingIds.has(m.id) && m.id !== nodeId;
                return (
                  <Badge
                    key={m.id}
                    variant={isNew ? "default" : "outline"}
                    className="text-meta font-normal"
                    title={isNew ? "Chưa có liên kết — sẽ tạo khi lưu" : "Đã có liên kết"}
                  >
                    @{m.ten}
                  </Badge>
                );
              })}
            </div>
            {!isHeThong && (
              <p className="text-meta text-muted-foreground italic">
                Node hiện tại là Thành phần — @mention chỉ tạo tham chiếu trong ghi chú, không tự tạo liên kết.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {dirty ? "Có thay đổi chưa lưu" : "Đã đồng bộ"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Đóng</Button>
            <Button
              size="sm"
              onClick={() => saveMut.mutate()}
              disabled={!dirty || saveMut.isPending || !nodeType || !nodeId}
            >
              {saveMut.isPending
                ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                : <Save className="h-3.5 w-3.5 mr-1.5" />}
              Lưu ghi chú
              {isHeThong && missingMentions.length > 0 && (
                <span className="ml-1 text-meta opacity-80">+{missingMentions.length} liên kết</span>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
