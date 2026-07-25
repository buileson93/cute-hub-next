import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useR2ListMyFiles, useR2Upload, useR2Download, useR2Delete } from "@/lib/mirats/r2-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, Trash2, UploadCloud, RefreshCw, FileText, Image as ImageIcon, Film, File, Search, X } from "lucide-react";

export const Route = createFileRoute("/_app/tep-tin")({
  head: () => ({
    meta: [
      { title: "Tệp của tôi | VATM" },
      { name: "description", content: "Danh sách tệp tin đã upload lên kho R2, tải về qua presigned URL an toàn." },
      { property: "og:title", content: "Tệp của tôi | VATM" },
      { property: "og:description", content: "Quản lý tệp upload cá nhân trên VATM." },
    ],
  }),
  component: FilesPage,
});

function iconFor(cat?: string | null) {
  const cls = "h-4 w-4";
  if (cat === "image") return <ImageIcon className={cls} />;
  if (cat === "video") return <Film className={cls} />;
  if (cat === "pdf" || cat === "office") return <FileText className={cls} />;
  return <File className={cls} />;
}

function fmtBytes(n?: number | null) {
  if (!n && n !== 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`;
  if (n < 1024*1024*1024) return `${(n/(1024*1024)).toFixed(1)} MB`;
  return `${(n/(1024*1024*1024)).toFixed(2)} GB`;
}

function FilesPage() {
  const listFn = useR2ListMyFiles();
  const upload = useR2Upload();
  const download = useR2Download();
  const del = useR2Delete();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ name: string; percent: number } | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const q = useQuery({
    queryKey: ["r2-my-files"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: false,
  });

  const filtered = (q.data ?? []).filter((f: any) => {
    if (category !== "all" && (f.category ?? "other") !== category) return false;
    if (status !== "all" && f.status !== status) return false;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      const name = (f.original_name || "").toLowerCase();
      const key = (f.key || "").toLowerCase();
      if (!name.includes(s) && !key.includes(s)) return false;
    }
    return true;
  });
  const hasFilter = search.trim() !== "" || category !== "all" || status !== "all";

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    for (const f of Array.from(files)) {
      setProgress({ name: f.name, percent: 0 });
      try {
        await upload(f, {
          onProgress: (p) => setProgress({ name: f.name, percent: p.percent }),
        });
        toast.success(`Đã upload: ${f.name}`);
      } catch (e: any) {
        toast.error(`Upload thất bại: ${e.message}`);
      }
    }
    setProgress(null);
    q.refetch();
  };

  const handleDownload = async (key: string) => {
    try {
      const { url } = await download(key);
      window.open(url, "_blank", "noopener");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (key: string) => {
    if (!confirm("Xoá file này khỏi R2?")) return;
    try { await del(key); toast.success("Đã xoá"); q.refetch(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tệp của tôi</h1>
          <p className="text-sm text-muted-foreground">Upload / tải xuống qua presigned URL an toàn (ảnh 5', PDF 15').</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => q.refetch()}><RefreshCw className="h-4 w-4 mr-1"/>Làm mới</Button>
          <Button size="sm" onClick={() => inputRef.current?.click()}><UploadCloud className="h-4 w-4 mr-1"/>Upload</Button>
          <Input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>
      </div>

      {progress && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between text-sm mb-1"><span className="truncate">{progress.name}</span><span>{progress.percent}%</span></div>
            <Progress value={progress.percent} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-3 flex flex-col md:flex-row gap-2 md:items-center">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên file hoặc đường dẫn…"
              className="pl-8"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="md:w-44"><SelectValue placeholder="Loại" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              <SelectItem value="image">Hình ảnh</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="office">Office</SelectItem>
              <SelectItem value="other">Khác</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="md:w-44"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="ready">Đã xong</SelectItem>
              <SelectItem value="temp">Đang xử lý</SelectItem>
              <SelectItem value="error">Lỗi</SelectItem>
            </SelectContent>
          </Select>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCategory("all"); setStatus("all"); }}>
              <X className="h-4 w-4 mr-1" />Xoá lọc
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Danh sách ({filtered.length}{hasFilter && q.data ? ` / ${q.data.length}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? <div className="text-sm text-muted-foreground">Đang tải…</div> :
            !q.data?.length ? <div className="text-sm text-muted-foreground py-8 text-center">Chưa có tệp nào.</div> :
            !filtered.length ? <div className="text-sm text-muted-foreground py-8 text-center">Không có tệp nào khớp bộ lọc.</div> :
            <div className="divide-y">
              {filtered.map((f: any) => (
                <div key={f.id} className="py-2 flex items-center gap-3">
                  <div className="text-muted-foreground">{iconFor(f.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{f.original_name || f.key.split("/").pop()}</div>
                    <div className="text-xs text-muted-foreground truncate">{f.key}</div>
                  </div>
                  <div className="text-xs text-muted-foreground w-20 text-right">{fmtBytes(f.size)}</div>
                  <Badge variant={f.status === "ready" ? "default" : f.status === "temp" ? "secondary" : "destructive"} className="capitalize">
                    {f.status === "ready" ? "Đã xong" : f.status === "temp" ? "Đang xử lý" : "Lỗi"}
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => handleDownload(f.key)} disabled={f.status !== "ready"}><Download className="h-4 w-4"/></Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(f.key)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                </div>
              ))}
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
