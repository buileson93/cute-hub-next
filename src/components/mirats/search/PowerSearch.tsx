import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  FileText, 
  Settings, 
  ChevronRight, 
  Loader2, 
  History, 
  AlertCircle,
  Database
} from "lucide-react";
import { useTimKiemToanCuc, nhanLoai } from "@/lib/mirats/search/tim-kiem";
import { useOcrSearch } from "@/lib/mirats/search/ocr-index/use-ocr-search";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";

export function PowerSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { ket_qua: globalResults, dang_tai: globalLoading } = useTimKiemToanCuc(query);
  const { search: searchOcr, isReady: ocrReady, isSyncing: ocrSyncing } = useOcrSearch();

  const ocrResults = React.useMemo(() => {
    if (!query.trim()) return [];
    return searchOcr(query);
  }, [query, searchOcr]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((route: string) => {
    setOpen(false);
    navigate({ to: route as any });
  }, [navigate]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline-block">Tìm kiếm...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput 
            placeholder="Tìm tài sản, sự cố, nội dung tài liệu..." 
            value={query}
            onValueChange={setQuery}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          {ocrSyncing && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
        </div>
        <CommandList className="max-h-[42rem] overflow-y-auto overflow-x-hidden">
          <CommandEmpty>Không tìm thấy kết quả nào.</CommandEmpty>
          
          {query.trim() === "" && (
            <CommandGroup heading="Gợi ý">
              <CommandItem onSelect={() => handleSelect("/thiet-bi")}>
                <Database className="mr-2 h-4 w-4" />
                <span>Danh sách tài sản</span>
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/he-thong/cay")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Cấu trúc hệ thống</span>
              </CommandItem>
            </CommandGroup>
          )}

          {ocrResults.length > 0 && (
            <CommandGroup heading="Nội dung tài liệu (OCR)">
              {ocrResults.slice(0, 5).map((res) => (
                <CommandItem
                  key={res.id}
                  onSelect={() => handleSelect(res.route)}
                  className="flex flex-col items-start gap-1 py-3"
                >
                  <div className="flex w-full items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{res.fileName}</span>
                    <Badge variant="secondary" className="text-[10px]">Trang {res.page}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 italic">
                    {/* Snippets will be implemented in future phase */}
                    Kết quả tìm thấy trong nội dung văn bản...
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {globalResults.length > 0 && (
            <CommandGroup heading="Hệ thống">
              {globalResults.map((res) => (
                <CommandItem
                  key={res.id}
                  onSelect={() => handleSelect(res.route)}
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
        </CommandList>
      </CommandDialog>
    </>
  );
}
