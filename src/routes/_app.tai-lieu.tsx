import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Search, Package, HardDrive, Download, Eye, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { StandardTable, ColumnDef } from "@/components/mirats/StandardTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DocViewerDialog } from "@/components/mirats/DocViewerDialog";
import { storage } from "@/lib/storage";
import { useCanDownloadAttachments } from "@/hooks/use-can-download";

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
  }),
});

function TaiLieuLibraryPage() {
  const { q: initialQ, doc: initialDoc } = Route.useSearch();
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(initialDoc || null);
  const [viewerOpen, setViewerOpen] = useState(!!initialDoc);
  
  const { data: allDocs, isLoading } = useQuery({
    queryKey: ["all_tai_lieu"],
    queryFn: async () => {
      const [thietBiTep, modelTep] = await Promise.all([
        supabase
          .from("thiet_bi_tep_dinh_kem")
          .select("*, thiet_bi:thiet_bi_id(ma_thiet_bi, ten_thiet_bi)")
          .eq("loai", "tai_lieu")
          .order("created_at", { ascending: false }),
        supabase
          .from("model_tai_lieu")
          .select("*, model:model_id(ten, ma)")
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
    if (!searchTerm) return allDocs;
    const lowerQ = searchTerm.toLowerCase();
    return allDocs.filter(d => 
      d.file_name?.toLowerCase().includes(lowerQ) || 
      d.mo_ta?.toLowerCase().includes(lowerQ) ||
      d.sourceName?.toLowerCase().includes(lowerQ) ||
      d.sourceCode?.toLowerCase().includes(lowerQ)
    );
  }, [allDocs, searchTerm]);

  const selectedDoc = useMemo(() => 
    allDocs?.find(d => d.id === selectedDocId), 
    [allDocs, selectedDocId]
  );

  const columns: ColumnDef<TaiLieuRow>[] = [
    {
      header: "Tên tài liệu",
      key: "file_name",
      render: (row) => (
        <div className="flex items-center gap-2 py-1">
          <FileText className="h-4 w-4 text-red-500 shrink-0" />
          <div className="min-w-0">
            <button 
              className="font-medium hover:underline text-left block truncate"
              onClick={() => {
                setSelectedDocId(row.id);
                setViewerOpen(true);
              }}
            >
              {row.file_name}
            </button>
            {row.mo_ta && (
              <div className="text-[10px] text-muted-foreground truncate">{row.mo_ta}</div>
            )}
          </div>
        </div>
      )
    },
    {
      header: "Nguồn gốc",
      key: "sourceName",
      render: (row) => (
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
      render: (row) => (
        <span className="text-[11px] text-muted-foreground">
          {row.kich_thuoc ? (row.kich_thuoc / 1024).toFixed(1) + " KB" : "-"}
        </span>
      )
    },
    {
      header: "Ngày tải",
      key: "created_at",
      render: (row) => (
        <span className="text-[11px] text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString("vi-VN")}
        </span>
      )
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <DocActions row={row} onOpenViewer={() => {
          setSelectedDocId(row.id);
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
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm tên file, mô tả..."
                className="h-8 pl-8 text-xs"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        }
      />
      
      <PageBody>
        <StandardTable
          rows={filteredDocs}
          trangThai={{ dangTai: isLoading }}
          columns={columns as ColumnDef<unknown>[]}
        />
      </PageBody>

      {selectedDoc && (
        <DocViewerWrapper
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          doc={selectedDoc}
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

function DocViewerWrapper({ open, onOpenChange, doc }: { open: boolean, onOpenChange: (v: boolean) => void, doc: any }) {
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
    />
  );
}
