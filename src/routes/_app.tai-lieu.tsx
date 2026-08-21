import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Search, Package, HardDrive, Download, Eye, ExternalLink } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { DataTableCore, DataTableColumn } from "@/components/mirats/DataTableCore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DocViewerDialog } from "@/components/mirats/DocViewerDialog";
import { storage } from "@/lib/storage";
import { useCanDownloadAttachments } from "@/hooks/use-can-download";
import { useOcrSearch } from "@/lib/mirats/search/ocr-index/use-ocr-search";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TaiLieuRow = {
  id: string;
  file_name: string;
  file_path: string;
  bucket: string;
  mo_ta: string | null;
  kich_thuoc: number | null;
  mime_type: string | null;
  created_at: string;
  sourceType: "thiet_bi" | "model";
  sourceName: string;
  sourceCode: string;
  to: string;
};

export const Route = createFileRoute("/_app/tai-lieu")({
  component: TaiLieuLibraryPage,
  validateSearch: (search: Record<string, unknown>) => ({
    q: (search.q as string) || "",
    doc: (search.doc as string) || "",
    filter: (search.filter as string) || "all",
  }),
});

function SnippetHighlight({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
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

function TaiLieuLibraryPage() {
  const { q: initialQ, doc: initialDoc, filter: initialFilter } = Route.useSearch();
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [selectedDocData, setSelectedDocData] = useState<{ id: string; page?: number } | null>(
    initialDoc ? { id: initialDoc } : null
  );
  const [viewerOpen, setViewerOpen] = useState(!!initialDoc);
  
  const { search: searchOcr, isReady: ocrReady } = useOcrSearch();
  
  const { data: allDocs, isLoading } = useQuery({
    queryKey: ["all_tai_lieu"],
    queryFn: async () => {
      const [thietBiTep, modelTep] = await Promise.all([
        supabase
          .from("thiet_bi_tep_dinh_kem")
          .select("*, thiet_bi:thiet_bi_id(ma_thiet_bi, ten_thiet_bi), tai_lieu_ocr(status)")
          .eq("loai", "tai_lieu")
          .order("created_at", { ascending: false }),
        supabase
          .from("model_tai_lieu")
          .select("*, model:model_id(ten, ma), tai_lieu_ocr(status)")
          .order("created_at", { ascending: false })
      ]);

      if (thietBiTep.error) throw thietBiTep.error;
      if (modelTep.error) throw modelTep.error;

      const combined: TaiLieuRow[] = [
        ...(thietBiTep.data || []).map(d => ({
          ...d,
          sourceType: "thiet_bi" as const,
          sourceName: d.thiet_bi?.ten_thiet_bi || d.thiet_bi?.ma_thiet_bi || "Tài sản",
          sourceCode: d.thiet_bi?.ma_thiet_bi || "",
          to: `/thiet-bi/${d.thiet_bi?.ma_thiet_bi}?tab=phap-ly`
        })),
        ...(modelTep.data || []).map(m => ({
          ...m,
          sourceType: "model" as const,
          sourceName: m.model?.ten || m.model?.ma || "Model",
          sourceCode: m.model?.ma || "",
          to: "#"
        }))
      ];

      return combined;
    }
  });

  const filteredDocs = useMemo(() => {
    if (!allDocs) return [];
    
    let base = allDocs;
    
    // Status filters
    if (activeFilter === 'indexed') base = base.filter(d => (d as any).tai_lieu_ocr?.some((o: any) => o.status === 'completed'));
    if (activeFilter === 'ocr_pending') base = base.filter(d => (d as any).tai_lieu_ocr?.some((o: any) => o.status === 'processing' || o.status === 'pending'));
    if (activeFilter === 'ocr_error') base = base.filter(d => (d as any).tai_lieu_ocr?.some((o: any) => o.status === 'failed'));

    if (!searchTerm.trim()) return base.map(d => ({ ...d, ocrResults: [] }));

    // Use OCR engine if ready
    if (ocrReady) {
      const ocrResults = searchOcr(searchTerm);
      // Group results by sourceId
      const grouped = new Map<string, any[]>();
      ocrResults.forEach(r => {
        if (!grouped.has(r.sourceId)) grouped.set(r.sourceId, []);
        grouped.get(r.sourceId)!.push(r);
      });

      return base.map(doc => {
        const matches = grouped.get(doc.id) || [];
        const lowerQ = searchTerm.toLowerCase();
        const metaMatch = 
          doc.file_name?.toLowerCase().includes(lowerQ) || 
          doc.mo_ta?.toLowerCase().includes(lowerQ) ||
          doc.sourceName?.toLowerCase().includes(lowerQ) ||
          doc.sourceCode?.toLowerCase().includes(lowerQ);
        
        return {
          ...doc,
          ocrResults: matches,
          isMetaMatch: metaMatch
        };
      }).filter(d => d.isMetaMatch || d.ocrResults.length > 0)
        .sort((a, b) => {
          if (a.isMetaMatch && !b.isMetaMatch) return -1;
          if (!a.isMetaMatch && b.isMetaMatch) return 1;
          return (b.ocrResults[0]?.score || 0) - (a.ocrResults[0]?.score || 0);
        });
    }

    // Fallback to basic search
    const lowerQ = searchTerm.toLowerCase();
    return base.filter(d => 
      d.file_name?.toLowerCase().includes(lowerQ) || 
      d.mo_ta?.toLowerCase().includes(lowerQ) ||
      d.sourceName?.toLowerCase().includes(lowerQ) ||
      d.sourceCode?.toLowerCase().includes(lowerQ)
    ).map(d => ({ ...d, ocrResults: [] }));
  }, [allDocs, searchTerm, activeFilter, ocrReady, searchOcr]);

  const selectedDoc = useMemo(() => 
    allDocs?.find(d => d.id === selectedDocData?.id), 
    [allDocs, selectedDocData]
  );

  const columns: DataTableColumn<TaiLieuRow>[] = [
    {
      header: "Tên tài liệu",
      key: "file_name",
      sticky: true,
      minWidth: 300,
      render: (row: any) => (
        <div className="flex flex-col py-1 gap-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-red-500 shrink-0" />
            <div className="min-w-0">
              <button 
                className="font-medium hover:underline text-left block truncate"
                onClick={() => {
                  setSelectedDocData({ id: row.id });
                  setViewerOpen(true);
                }}
              >
                {row.file_name}
              </button>
            </div>
            {row.tai_lieu_ocr?.[0]?.status === 'completed' && (
              <Badge variant="outline" className="text-[9px] h-4 px-1 bg-green-50 text-green-700 border-green-200">OCR</Badge>
            )}
          </div>
          {row.ocrResults?.length > 0 && (
            <div className="ml-6 space-y-1">
              {row.ocrResults.slice(0, 2).map((res: any, idx: number) => (
                <div 
                  key={idx} 
                  className="text-[10px] text-muted-foreground italic cursor-pointer hover:text-foreground line-clamp-1 bg-muted/30 px-1.5 py-0.5 rounded"
                  onClick={() => {
                    setSelectedDocData({ id: row.id, page: res.page });
                    setViewerOpen(true);
                  }}
                >
                  Trang {res.page}: <SnippetHighlight text={res.snippet} />
                </div>
              ))}
            </div>
          )}
          {row.mo_ta && !row.ocrResults?.length && (
            <div className="ml-6 text-[10px] text-muted-foreground truncate">{row.mo_ta}</div>
          )}
        </div>
      )
    },
    {
      header: "Nguồn gốc",
      key: "sourceName",
      width: 200,
      render: (row: TaiLieuRow) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            {row.sourceType === "thiet_bi" ? (
              <HardDrive className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Package className="h-3 w-3 text-muted-foreground" />
            )}
            <span className="text-xs">{row.sourceName}</span>
          </div>
          {row.sourceCode && (
            <span className="text-[10px] font-mono text-muted-foreground">{row.sourceCode}</span>
          )}
        </div>
      )
    },
    {
      header: "Kích thước",
      key: "kich_thuoc",
      width: 100,
      align: "right",
      render: (row: TaiLieuRow) => (
        <span className="text-[11px] text-muted-foreground">
          {row.kich_thuoc ? (row.kich_thuoc / 1024).toFixed(1) + " KB" : "-"}
        </span>
      )
    },
    {
      header: "Ngày tải",
      key: "created_at",
      width: 120,
      align: "center",
      render: (row: TaiLieuRow) => (
        <span className="text-[11px] text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString("vi-VN")}
        </span>
      )
    },
    {
      key: "actions",
      header: "Thao tác",
      type: "actions",
      width: 120,
      align: "center",
      render: (row: TaiLieuRow) => (
        <DocActions row={row} onOpenViewer={() => {
          setSelectedDocData({ id: row.id });
          setViewerOpen(true);
        }} />
      )
    }
  ];

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader 
        title="Thư viện tài liệu" 
        icon={FileText} 
        actions={
          <div className="flex items-center gap-3">
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="h-8">
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-[10px] px-2 h-7">Tất cả</TabsTrigger>
                <TabsTrigger value="indexed" className="text-[10px] px-2 h-7">Đã OCR</TabsTrigger>
                <TabsTrigger value="ocr_pending" className="text-[10px] px-2 h-7">Đang xử lý</TabsTrigger>
                <TabsTrigger value="ocr_error" className="text-[10px] px-2 h-7">Lỗi OCR</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm tên file, mô tả, nội dung..."
                className="h-8 pl-8 text-xs"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        }
      />
      
      <PageBody>
        <DataTableCore
          rows={filteredDocs}
          columns={columns}
          getRowId={(row) => row.id}
          maxHeight="calc(100vh - 12rem)"
        />
      </PageBody>

      {selectedDoc && (
        <DocViewerWrapper
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          doc={selectedDoc}
          initialPage={selectedDocData?.page}
        />
      )}
    </div>
  );
}

function DocActions({ row, onOpenViewer }: { row: TaiLieuRow, onOpenViewer: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const canDownload = useCanDownloadAttachments();

  useMemo(() => {
    storage.from(row.bucket).createSignedUrl(row.file_path, 3600).then(({ data }) => {
      setUrl(data?.signedUrl ?? null);
    });
  }, [row.bucket, row.file_path]);

  return (
    <div className="flex items-center gap-1 justify-end">
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onOpenViewer}>
        <Eye className="h-3.5 w-3.5" />
      </Button>
      {url && (
        <>
          <Button asChild size="icon" variant="ghost" className="h-7 w-7">
            <a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
          </Button>
          {canDownload && (
            <Button asChild size="icon" variant="ghost" className="h-7 w-7">
              <a href={url} download={row.file_name}><Download className="h-3.5 w-3.5" /></a>
            </Button>
          )}
        </>
      )}
    </div>
  );
}

function DocViewerWrapper({ open, onOpenChange, doc, initialPage }: { open: boolean, onOpenChange: (v: boolean) => void, doc: any, initialPage?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useMemo(() => {
    setLoading(true);
    storage.from(doc.bucket).createSignedUrl(doc.file_path, 3600).then(({ data }) => {
      setUrl(data?.signedUrl ?? null);
      setLoading(false);
    });
  }, [doc.bucket, doc.file_path]);

  return (
    <DocViewerDialog
      open={open}
      onOpenChange={onOpenChange}
      url={url}
      fileName={doc.file_name}
      mimeType={doc.mime_type}
      isLoading={loading}
      initialPage={initialPage}
    />
  );
}
