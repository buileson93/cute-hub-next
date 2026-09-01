import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  FileText,
  Settings,
  ChevronRight,
  Loader2,
  History,
  AlertCircle,
  Database,
  Type,
  Plus,
  QrCode,
  LogOut,
  User,
  Moon,
  Sun,
  LayoutGrid,
  ClipboardCheck,
  FolderKanban,
} from "lucide-react";
import { useTimKiemToanCuc, nhanLoai } from "@/lib/mirats/search/tim-kiem";
import { useOcrSearch } from "@/lib/mirats/search/ocr-index/use-ocr-search";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { DocViewerDialog } from "../DocViewerDialog";
import { storage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import {
  buildCommands,
  filterByRole,
  groupCommands,
  pushRecentId,
  rankCommands,
  readRecentIds,
  writeRecentIds,
  type AppCommand,
} from "@/lib/mirats/command-palette/registry";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

function SnippetHighlight({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <span key={i} className="bg-yellow-200 text-yellow-900 font-medium px-0.5 rounded">
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}

export function PowerSearch({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [query, setQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<{
    url: string;
    fileName: string;
    page: number;
  } | null>(null);
  const navigate = useNavigate();

  const { ket_qua: globalResults, dang_tai: globalLoading } = useTimKiemToanCuc(query);
  const { search: searchOcr, isReady: ocrReady, isSyncing: ocrSyncing } = useOcrSearch();
  const { hasRole } = useSession();

  // 1. Toàn bộ lệnh của hệ thống (điều hướng lấy từ nav-contract) đã lọc quyền.
  const commands = useMemo(() => filterByRole(buildCommands(), hasRole), [hasRole]);

  // 2. Lịch sử lệnh gần đây (localStorage, chịu lỗi khi bị chặn).
  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => {
    if (isOpen) setRecentIds(readRecentIds(typeof window === "undefined" ? null : localStorage));
  }, [isOpen]);

  const recentCommands = useMemo(
    () =>
      recentIds
        .map((id) => commands.find((c) => c.id === id))
        .filter((c): c is AppCommand => Boolean(c))
        .map((c) => ({ ...c, group: "recent" as const })),
    [recentIds, commands],
  );

  const matchedCommands = useMemo(
    () => (query.trim() ? rankCommands(commands, query, 12) : []),
    [commands, query],
  );

  const commandGroups = useMemo(
    () => groupCommands(query.trim() ? matchedCommands : [...recentCommands, ...commands]),
    [query, matchedCommands, recentCommands, commands],
  );

  const ocrResults = React.useMemo(() => {
    if (!query.trim()) return [];
    // Deduplicate and rank
    const raw = searchOcr(query);
    const unique = new Map<string, any>();
    raw.forEach((r) => {
      const key = `${r.sourceType}-${r.sourceId}-${r.page || 0}`;
      if (!unique.has(key) || unique.get(key).score < r.score) {
        unique.set(key, r);
      }
    });
    return Array.from(unique.values()).sort((a, b) => b.score - a.score);
  }, [query, searchOcr]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setIsOpen, isOpen]);

  const handleSelect = useCallback(
    async (res: any) => {
      // Nếu truyền chuỗi trực tiếp (vd: route)
      if (typeof res === "string") {
        setIsOpen(false);
        navigate({ to: res as any });
        return;
      }

      // Xử lý tài liệu OCR
      if (res.page !== undefined) {
        try {
          const table = res.sourceType === "thiet_bi" ? "thiet_bi_tep_dinh_kem" : "model_tai_lieu";
          const { data: doc, error } = await (supabase
            .from(table as any)
            .select("bucket, file_path")
            .eq("id", res.sourceId)
            .single() as any);

          if (doc && !error) {
            const { data } = await storage.from(doc.bucket).createSignedUrl(doc.file_path, 3600);
            if (data?.signedUrl) {
              setSelectedDoc({ url: data.signedUrl, fileName: res.fileName, page: res.page });
              return;
            }
          }
        } catch (err) {
          console.error("Failed to open document", err);
          toast.error("Không thể mở tài liệu");
        }
      }

      // Xử lý kết quả từ timKiemToanCuc hoặc NavItem
      const route = res.route || res.to;
      if (route) {
        setIsOpen(false);
        navigate({ to: route as any });
      }
    },
    [navigate, setIsOpen],
  );

  const [pendingCommand, setPendingCommand] = useState<AppCommand | null>(null);

  const executeCommand = useCallback(
    (cmd: AppCommand) => {
      setRecentIds((prev) => {
        const next = pushRecentId(prev, cmd.id);
        writeRecentIds(typeof window === "undefined" ? null : localStorage, next);
        return next;
      });
      setIsOpen(false);
      if (cmd.target.kind === "navigate") {
        navigate({ to: cmd.target.to as string });
        return;
      }
      if (cmd.target.action === "qr-scan") {
        window.dispatchEvent(new CustomEvent("mirats:open-qr-scanner"));
        return;
      }
      // Đăng xuất: dùng đúng luồng auth hiện có.
      void supabase.auth
        .signOut()
        .then(() => navigate({ to: "/auth" }))
        .catch(() => toast.error("Không thể đăng xuất, vui lòng thử lại"));
    },
    [navigate, setIsOpen],
  );

  /** Lệnh có hậu quả phải qua bước xác nhận, không chạy do bấm nhầm. */
  const runCommand = useCallback(
    (cmd: AppCommand) => {
      if (cmd.confirm) {
        setIsOpen(false);
        setPendingCommand(cmd);
        return;
      }
      executeCommand(cmd);
    },
    [executeCommand, setIsOpen],
  );


  return (
    <>
      {!isControlled && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline-block">Tìm kiếm...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      )}

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center border-b px-4 bg-muted/20 gap-3">
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <CommandInput
            placeholder="Tìm tài sản, sự cố, nội dung tài liệu..."
            value={query}
            onValueChange={setQuery}
            className="flex h-12 w-full bg-transparent py-3 text-[14px] outline-none border-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {ocrSyncing && <Loader2 className="h-4 w-4 animate-spin opacity-50 shrink-0" />}
        </div>
        <CommandList className="max-h-[42rem] overflow-y-auto overflow-x-hidden">
          <CommandEmpty>Không tìm thấy kết quả nào.</CommandEmpty>

          {commandGroups.map((group) => (
            <CommandGroup key={group.group} heading={group.label}>
              {group.items.map((cmd) => (
                <CommandItem
                  key={`${group.group}-${cmd.id}`}
                  value={`${cmd.title} ${cmd.description ?? ""} ${(cmd.keywords ?? []).join(" ")}`}
                  onSelect={() => runCommand(cmd)}
                >
                  <cmd.icon className="mr-2 h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{cmd.title}</span>
                    {cmd.description ? (
                      <span className="truncate text-[10px] text-muted-foreground">
                        {cmd.description}
                      </span>
                    ) : null}
                  </div>
                  {cmd.shortcut ? (
                    <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:inline-block">
                      {cmd.shortcut}
                    </kbd>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}

          {query.trim() !== "" && (
            <>
              {(globalLoading || ocrSyncing) && (
                <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Đang tìm trong dữ liệu hệ thống…
                </div>
              )}

              {globalError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 px-4 py-3 text-xs text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  Không tải được kết quả dữ liệu. Lệnh điều hướng phía trên vẫn dùng được.
                </div>
              ) : null}

              {ocrResults.length > 0 && (
                <CommandGroup heading="Nội dung tài liệu (OCR)">
                  {ocrResults.slice(0, 10).map((res) => (
                    <CommandItem
                      key={res.id}
                      onSelect={() => handleSelect(res)}
                      className="flex flex-col items-start gap-1 py-3"
                    >
                      <div className="flex w-full items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span className="font-medium truncate flex-1">{res.fileName}</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0 border-blue-200 bg-blue-50 text-blue-700"
                        >
                          Trang {res.page}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2 italic w-full">
                        <SnippetHighlight text={res.snippet} />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {globalResults.length > 0 && (
                <CommandGroup heading="Dữ liệu hệ thống">
                  {globalResults.map((res) => (
                    <CommandItem
                      key={res.id}
                      onSelect={() => handleSelect(res)}
                      className="flex items-center gap-2"
                    >
                      <ChevronRight className="h-4 w-4 opacity-50" />
                      <div className="flex flex-col">
                        <span>{res.tieuDe}</span>
                        <span className="text-xs text-muted-foreground">{nhanLoai(res.loai)}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>

      {selectedDoc && (
        <DocViewerDialog
          open={!!selectedDoc}
          onOpenChange={(open) => !open && setSelectedDoc(null)}
          url={selectedDoc.url}
          fileName={selectedDoc.fileName}
          initialPage={selectedDoc.page}
        />
      )}
    </>
  );
}
