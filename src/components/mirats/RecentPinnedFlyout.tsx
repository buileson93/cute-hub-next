import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  BookmarkPlus,
  BookmarkMinus,
  Clock,
  X,
  Search,
  CheckSquare,
  Trash2,
  ArrowDownUp,
} from "lucide-react";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type RecentRow = { path: string; label: string; viewed_at: string };
type PinnedRow = { path: string; label: string; order: number };

type RecentSort = "viewed_desc" | "viewed_asc" | "label_asc";
type PinnedSort = "order" | "label_asc" | "label_desc";

function usePinned(userId: string | null) {
  return useQuery({
    queryKey: ["user-pinned", userId ?? "guest"],
    enabled: !!userId,
    queryFn: async (): Promise<PinnedRow[]> => {
      const { data, error } = await supabase
        .from("user_pinned")
        .select("path,label,order")
        .order("order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PinnedRow[];
    },
  });
}

function useRecent(userId: string | null) {
  return useQuery({
    queryKey: ["user-recent", userId ?? "guest"],
    enabled: !!userId,
    queryFn: async (): Promise<RecentRow[]> => {
      const { data, error } = await supabase
        .from("user_recent")
        .select("path,label,viewed_at")
        .order("viewed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as RecentRow[];
    },
    refetchOnWindowFocus: false,
  });
}

export function RecentPinnedPanel({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user } = useSession();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const { data: pinned = [] } = usePinned(userId);
  const { data: recent = [] } = useRecent(userId);

  const [query, setQuery] = useState("");
  const [pinnedSort, setPinnedSort] = useState<PinnedSort>("order");
  const [recentSort, setRecentSort] = useState<RecentSort>("viewed_desc");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedPinned, setSelectedPinned] = useState<Set<string>>(new Set());
  const [selectedRecent, setSelectedRecent] = useState<Set<string>>(new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel = useMemo(() => {
    if (typeof document === "undefined") return path;
    return document.title.replace(/\s*[—|·-]\s*MIRATS.*$/i, "").trim() || path;
  }, [path]);

  const isCurrentPinned = pinned.some((p) => p.path === path);

  const filteredPinned = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = pinned.filter(
      (p) => !q || p.label.toLowerCase().includes(q) || p.path.toLowerCase().includes(q),
    );
    if (pinnedSort === "label_asc") list = [...list].sort((a, b) => a.label.localeCompare(b.label));
    else if (pinnedSort === "label_desc")
      list = [...list].sort((a, b) => b.label.localeCompare(a.label));
    return list;
  }, [pinned, query, pinnedSort]);

  const filteredRecent = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = recent.filter(
      (r) => !q || r.label.toLowerCase().includes(q) || r.path.toLowerCase().includes(q),
    );
    if (recentSort === "viewed_asc")
      list = [...list].sort((a, b) => a.viewed_at.localeCompare(b.viewed_at));
    else if (recentSort === "label_asc")
      list = [...list].sort((a, b) => a.label.localeCompare(b.label));
    return list.slice(0, 20);
  }, [recent, query, recentSort]);

  // Flat list of items for keyboard nav: pinned then recent
  const flatItems = useMemo(
    () => [
      ...filteredPinned.map((p) => ({ kind: "pinned" as const, path: p.path, label: p.label })),
      ...filteredRecent.map((r) => ({ kind: "recent" as const, path: r.path, label: r.label })),
    ],
    [filteredPinned, filteredRecent],
  );

  useEffect(() => {
    if (activeIdx >= flatItems.length) setActiveIdx(Math.max(0, flatItems.length - 1));
  }, [flatItems.length, activeIdx]);

  async function togglePinCurrent() {
    if (!userId) return;
    if (isCurrentPinned) {
      const { error } = await supabase.from("user_pinned").delete().eq("path", path);
      if (error) return toast.error("Bỏ ghim thất bại", { description: error.message });
      toast.success("Đã bỏ ghim");
    } else {
      const nextOrder = (pinned[pinned.length - 1]?.order ?? -1) + 1;
      const { error } = await supabase.from("user_pinned").insert({
        user_id: userId,
        path,
        label: currentLabel,
        order: nextOrder,
      });
      if (error) return toast.error("Ghim thất bại", { description: error.message });
      toast.success("Đã ghim trang này");
    }
    await qc.invalidateQueries({ queryKey: ["user-pinned", userId] });
  }

  async function unpin(p: string) {
    if (!userId) return;
    const { error } = await supabase.from("user_pinned").delete().eq("path", p);
    if (error) return toast.error("Bỏ ghim thất bại", { description: error.message });
    await qc.invalidateQueries({ queryKey: ["user-pinned", userId] });
  }

  async function removeRecent(p: string) {
    if (!userId) return;
    await supabase.from("user_recent").delete().eq("path", p);
    await qc.invalidateQueries({ queryKey: ["user-recent", userId] });
  }

  async function bulkDelete() {
    if (!userId) return;
    const pinPaths = Array.from(selectedPinned);
    const recPaths = Array.from(selectedRecent);
    if (pinPaths.length === 0 && recPaths.length === 0) {
      toast.info("Chưa chọn mục nào");
      return;
    }
    const tasks: Promise<unknown>[] = [];
    if (pinPaths.length)
      tasks.push(Promise.resolve(supabase.from("user_pinned").delete().in("path", pinPaths)));
    if (recPaths.length)
      tasks.push(Promise.resolve(supabase.from("user_recent").delete().in("path", recPaths)));
    await Promise.all(tasks);
    toast.success(`Đã xoá ${pinPaths.length + recPaths.length} mục`);
    setSelectedPinned(new Set());
    setSelectedRecent(new Set());
    setSelectMode(false);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["user-pinned", userId] }),
      qc.invalidateQueries({ queryKey: ["user-recent", userId] }),
    ]);
  }

  function toggleSel(set: Set<string>, setSet: (s: Set<string>) => void, key: string) {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSet(next);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (flatItems.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flatItems.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      const it = flatItems[activeIdx];
      if (it) {
        e.preventDefault();
        onNavigate?.();
        navigate({ to: it.path as never });
      }
    } else if (e.key === "Delete" || e.key === "Backspace") {
      const it = flatItems[activeIdx];
      if (it) {
        e.preventDefault();
        if (it.kind === "pinned") void unpin(it.path);
        else void removeRecent(it.path);
      }
    }
  }

  if (!userId) return null;

  const pinnedOffset = 0;
  const recentOffset = filteredPinned.length;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="w-80 space-y-2 outline-none"
    >
      {/* Toolbar */}
      <div className="space-y-1.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên trang…"
            className="h-8 pl-7 text-[12.5px]"
          />
        </div>
        <div className="flex items-center justify-between gap-1">
          <Button
            size="sm"
            variant={selectMode ? "secondary" : "ghost"}
            className="h-7 gap-1 px-2 text-[11px]"
            onClick={() => {
              setSelectMode((v) => !v);
              setSelectedPinned(new Set());
              setSelectedRecent(new Set());
            }}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            {selectMode ? "Xong" : "Chọn nhiều"}
          </Button>
          {selectMode && (
            <Button
              size="sm"
              variant="destructive"
              className="h-7 gap-1 px-2 text-[11px]"
              disabled={selectedPinned.size + selectedRecent.size === 0}
              onClick={bulkDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xoá ({selectedPinned.size + selectedRecent.size})
            </Button>
          )}
        </div>
      </div>

      {/* Ghim */}
      <div>
        <div className="mb-1 flex items-center justify-between gap-1 px-1">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Ghim
          </span>
          <div className="flex items-center gap-1">
            <Select value={pinnedSort} onValueChange={(v) => setPinnedSort(v as PinnedSort)}>
              <SelectTrigger className="h-6 w-auto gap-1 border-0 bg-transparent px-1 text-[10.5px] text-muted-foreground hover:text-foreground">
                <ArrowDownUp className="h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="order">Thứ tự tuỳ chỉnh</SelectItem>
                <SelectItem value="label_asc">Tên A→Z</SelectItem>
                <SelectItem value="label_desc">Tên Z→A</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 gap-1 px-1.5 text-[10.5px]"
              onClick={togglePinCurrent}
              title={isCurrentPinned ? "Bỏ ghim trang này" : "Ghim trang này"}
            >
              {isCurrentPinned ? (
                <BookmarkMinus className="h-3.5 w-3.5" />
              ) : (
                <BookmarkPlus className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        {filteredPinned.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-3 text-center text-[11.5px] text-muted-foreground">
            {query ? "Không có kết quả phù hợp." : "Chưa có trang nào được ghim."}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filteredPinned.map((p, idx) => {
              const flatIdx = pinnedOffset + idx;
              const isActive = flatIdx === activeIdx;
              return (
                <li
                  key={p.path}
                  className={cn(
                    "group flex items-center gap-1 rounded-md",
                    isActive && "bg-accent/60 ring-1 ring-primary/30",
                  )}
                >
                  {selectMode && (
                    <Checkbox
                      className="ml-1.5"
                      checked={selectedPinned.has(p.path)}
                      onCheckedChange={() => toggleSel(selectedPinned, setSelectedPinned, p.path)}
                    />
                  )}
                  <Link
                    to={p.path as never}
                    onClick={(e) => {
                      if (selectMode) {
                        e.preventDefault();
                        toggleSel(selectedPinned, setSelectedPinned, p.path);
                        return;
                      }
                      onNavigate?.();
                    }}
                    onMouseEnter={() => setActiveIdx(flatIdx)}
                    className={cn(
                      "flex-1 truncate rounded-md px-2 py-1.5 text-[12.5px] hover:bg-secondary",
                      p.path === path && "bg-accent text-primary",
                    )}
                    title={p.path}
                  >
                    <Bookmark className="mr-1.5 inline h-3 w-3 -translate-y-px text-primary/70" />
                    {p.label}
                  </Link>
                  {!selectMode && (
                    <button
                      type="button"
                      aria-label="Bỏ ghim"
                      onClick={() => unpin(p.path)}
                      className="grid h-6 w-6 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Gần đây */}
      <div>
        <div className="mb-1 flex items-center justify-between gap-1 px-1">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Gần đây
          </span>
          <Select value={recentSort} onValueChange={(v) => setRecentSort(v as RecentSort)}>
            <SelectTrigger className="h-6 w-auto gap-1 border-0 bg-transparent px-1 text-[10.5px] text-muted-foreground hover:text-foreground">
              <ArrowDownUp className="h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="viewed_desc">Mới nhất</SelectItem>
              <SelectItem value="viewed_asc">Cũ nhất</SelectItem>
              <SelectItem value="label_asc">Tên A→Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filteredRecent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-3 text-center text-[11.5px] text-muted-foreground">
            {query ? "Không có kết quả phù hợp." : "Chưa có lịch sử."}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filteredRecent.map((r, idx) => {
              const flatIdx = recentOffset + idx;
              const isActive = flatIdx === activeIdx;
              return (
                <li
                  key={r.path}
                  className={cn(
                    "group flex items-center gap-1 rounded-md",
                    isActive && "bg-accent/60 ring-1 ring-primary/30",
                  )}
                >
                  {selectMode && (
                    <Checkbox
                      className="ml-1.5"
                      checked={selectedRecent.has(r.path)}
                      onCheckedChange={() => toggleSel(selectedRecent, setSelectedRecent, r.path)}
                    />
                  )}
                  <Link
                    to={r.path as never}
                    onClick={(e) => {
                      if (selectMode) {
                        e.preventDefault();
                        toggleSel(selectedRecent, setSelectedRecent, r.path);
                        return;
                      }
                      onNavigate?.();
                    }}
                    onMouseEnter={() => setActiveIdx(flatIdx)}
                    className={cn(
                      "flex-1 truncate rounded-md px-2 py-1.5 text-[12.5px] hover:bg-secondary",
                      r.path === path && "bg-accent text-primary",
                    )}
                    title={r.path}
                  >
                    <Clock className="mr-1.5 inline h-3 w-3 -translate-y-px text-muted-foreground/70" />
                    {r.label}
                  </Link>
                  {!selectMode && (
                    <button
                      type="button"
                      aria-label="Xoá khỏi lịch sử"
                      onClick={() => removeRecent(r.path)}
                      className="grid h-6 w-6 place-items-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border/50 px-1 pt-1.5 text-[10px] text-muted-foreground">
        ↑/↓ chọn · Enter mở · Del bỏ ghim/xoá
      </div>
    </div>
  );
}
