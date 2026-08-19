import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  FileText, 
  Settings, 
  ChevronRight, 
  Loader2, 
  History, 
  AlertCircle,
  Database,
  Type
} from "lucide-react";
import { useTimKiemToanCuc, nhanLoai } from "@/lib/mirats/search/tim-kiem";
import { useOcrSearch } from "@/lib/mirats/search/ocr-index/use-ocr-search";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { DocViewerDialog } from "../DocViewerDialog";
import { storage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";

export function PowerSearch({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [query, setQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<{ url: string; fileName: string; page: number } | null>(null);
  const navigate = useNavigate();

  const { ket_qua: globalResults, dang_tai: globalLoading } = useTimKiemToanCuc(query);
  const { search: searchOcr, isReady: ocrReady, isSyncing: ocrSyncing } = useOcrSearch();

  const ocrResults = React.useMemo(() => {
    if (!query.trim()) return [];
    // Deduplicate and rank
    const raw = searchOcr(query);
    const unique = new Map<string, any>();
    raw.forEach(r => {
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
  }, [setIsOpen]);

  const handleSelect = useCallback(async (res: any) => {
    if (res.page !== undefined) {
      try {
        const table = res.sourceType === 'thiet_bi' ? 'thiet_bi_tep_dinh_kem' : 'model_tai_lieu';
        const { data: doc, error } = await (supabase.from(table as any)
          .select('bucket, file_path')
          .eq('id', res.sourceId)
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
      }
    }
    setIsOpen(false);
    navigate({ to: res.route as any });
  }, [navigate, setIsOpen]);

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
              {ocrResults.slice(0, 10).map((res) => (
                <CommandItem
                  key={res.id}
                  onSelect={() => handleSelect(res)}
                  className="flex flex-col items-start gap-1 py-3"
                >
                  <div className="flex w-full items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-medium truncate flex-1">{res.fileName}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0 border-blue-200 bg-blue-50 text-blue-700">Trang {res.page}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 italic w-full">
                    {res.snippet}
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
