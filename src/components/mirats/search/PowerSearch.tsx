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
import { workspaces, type NavItem } from "@/lib/mirats/nav-contract";
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

  // 1. Phẳng hoá toàn bộ danh mục từ nav-contract để tìm kiếm điều hướng
  const allNavItems = useMemo(() => {
    const items: Array<{ to: string; label: string; icon: any; workspace: string }> = [];
    workspaces.forEach((ws) => {
      if (ws.roles && !ws.roles.some((r) => hasRole(r))) return;
      ws.groups.forEach((group) => {
        group.items.forEach((item) => {
          if (item.divider) return;
          if (item.roles && !item.roles.some((r) => hasRole(r))) return;
          items.push({ to: item.to, label: item.label, icon: item.icon, workspace: ws.label });
          item.children?.forEach((child) => {
            if (child.divider) return;
            if (child.roles && !child.roles.some((r) => hasRole(r))) return;
            items.push({ to: child.to, label: child.label, icon: child.icon, workspace: ws.label });
          });
        });
      });
    });
    return items;
  }, [hasRole]);

  // 2. Lọc danh mục theo query
  const filteredNavItems = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allNavItems
      .filter(
        (item) => item.label.toLowerCase().includes(q) || item.workspace.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [query, allNavItems]);

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

  const handleAction = (action: string) => {
    setIsOpen(false);
    switch (action) {
      case "qr-scan":
        window.dispatchEvent(new CustomEvent("mirats:open-qr-scanner"));
        break;
      case "logout":
        supabase.auth.signOut().then(() => {
          navigate({ to: "/auth" as any });
        });
        break;
      case "profile":
        navigate({ to: "/cai-dat/tai-khoan" as any });
        break;
      default:
        toast.info("Tính năng đang được phát triển");
    }
  };

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

          {query.trim() === "" ? (
            <>
              <CommandGroup heading="Hành động nhanh">
                <CommandItem onSelect={() => handleSelect("/su-co/moi")}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Báo cáo sự cố mới</span>
                </CommandItem>
                <CommandItem onSelect={() => handleAction("qr-scan")}>
                  <QrCode className="mr-2 h-4 w-4" />
                  <span>Quét mã QR thiết bị</span>
                </CommandItem>
                <CommandItem onSelect={() => handleSelect("/kiem-ke")}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  <span>Kiểm kê tài sản</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Gợi ý điều hướng">
                <CommandItem onSelect={() => handleSelect("/thiet-bi")}>
                  <Database className="mr-2 h-4 w-4" />
                  <span>Sổ lý lịch thiết bị</span>
                </CommandItem>
                <CommandItem onSelect={() => handleSelect("/he-thong/cay")}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  <span>Cấu trúc hệ thống</span>
                </CommandItem>
                <CommandItem onSelect={() => handleSelect("/du-an")}>
                  <FolderKanban className="mr-2 h-4 w-4" />
                  <span>Danh sách dự án</span>
                </CommandItem>
              </CommandGroup>

              <CommandSeparator />

              <CommandGroup heading="Hệ thống">
                <CommandItem onSelect={() => handleAction("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Cài đặt tài khoản</span>
                </CommandItem>
                <CommandItem onSelect={() => handleAction("logout")}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </CommandItem>
              </CommandGroup>
            </>
          ) : (
            <>
              {filteredNavItems.length > 0 && (
                <CommandGroup heading="Điều hướng">
                  {filteredNavItems.map((item, idx) => (
                    <CommandItem key={`nav-${idx}`} onSelect={() => handleSelect(item.to)}>
                      <item.icon className="mr-2 h-4 w-4 opacity-70" />
                      <div className="flex flex-col">
                        <span>{item.label}</span>
                        <span className="text-[10px] text-muted-foreground">{item.workspace}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

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
