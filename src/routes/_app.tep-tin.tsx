import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import {
  useR2ListMyFiles,
  useR2Upload,
  useR2Download,
  useR2Delete,
  useR2AbortResumable,
  useR2InspectResumable,
  listResumableSessions,
  cleanupExpiredSessions,
  fileFingerprint,
  type ResumableSession,
} from "@/lib/mirats/r2-client";
import { supabase } from "@/integrations/backend/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Download,
  Trash2,
  UploadCloud,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Film,
  File,
  Search,
  X,
  RotateCw,
  PlayCircle,
  XCircle,
  StopCircle,
  Trash,
  Clock,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/_app/tep-tin")({
  head: () => ({
    meta: [
      { title: "Tệp của tôi | VATM" },
      {
        name: "description",
        content: "Danh sách tệp tin đã upload lên kho R2, tải về qua presigned URL an toàn.",
      },
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
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function FilesPage() {
  const listFn = useR2ListMyFiles();
  const upload = useR2Upload();
  const download = useR2Download();
  const del = useR2Delete();
  const abortResumable = useR2AbortResumable();
  const inspectResumable = useR2InspectResumable();
  const inputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const resumeTargetRef = useRef<ResumableSession | null>(null);
  const [progress, setProgress] = useState<{
    name: string;
    percent: number;
    loaded: number;
    total: number;
    startedAt: number;
    startedBytes: number;
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [failed, setFailed] = useState<{ id: string; file: File; error: string }[]>([]);
  const [sessions, setSessions] = useState<ResumableSession[]>([]);
  const [mismatchFor, setMismatchFor] = useState<string | null>(null);
  const [cleanupStats, setCleanupStats] = useState<{
    removed: number;
    kept: number;
    oldestAgeMs: number | null;
  }>({ removed: 0, kept: 0, oldestAgeMs: null });
  const refreshSessions = () => {
    const stats = cleanupExpiredSessions();
    setCleanupStats(stats);
    setSessions(listResumableSessions());
  };
  useEffect(() => {
    refreshSessions();
  }, []);
  // Dọn định kỳ mỗi 5 phút để phản ánh trạng thái quá hạn.
  useEffect(() => {
    const id = window.setInterval(refreshSessions, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);
  // Tick 1s để cập nhật ETA khi có upload đang chạy.
  useEffect(() => {
    if (!progress) return;
    const id = window.setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [progress]);

  // Trong lúc upload, poll localStorage để cập nhật % của phiên đang chạy trong panel "Có thể tiếp tục".
  useEffect(() => {
    if (!progress) return;
    const id = window.setInterval(refreshSessions, 800);
    return () => window.clearInterval(id);
  }, [progress]);
  // Đồng bộ giữa các tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "r2:resumable-sessions:v1") refreshSessions();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const q = useQuery({
    queryKey: ["r2-my-files"],
    queryFn: () => listFn(),
    refetchOnWindowFocus: false,
  });

  // Realtime: nhận thông báo khi trạng thái file đổi từ "temp" -> "ready" / "error"
  const prevStatusRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    if (!q.data) return;
    const prev = prevStatusRef.current;
    for (const f of q.data as any[]) {
      const old = prev.get(f.id);
      if (old && old !== f.status) {
        const label = f.original_name || f.key.split("/").pop();
        if (f.status === "ready") toast.success(`✓ Hoàn tất: ${label}`);
        else if (f.status === "error") toast.error(`⚠ Lỗi xử lý: ${label}`);
      }
      prev.set(f.id, f.status);
    }
  }, [q.data]);

  useEffect(() => {
    let userId: string | null = null;
    let ch: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      userId = data.user?.id ?? null;
      if (!userId) return;
      ch = supabase
        .channel(`r2-file-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "r2_file", filter: `user_id=eq.${userId}` },
          () => {
            q.refetch();
          },
        )
        .subscribe();
    });
    return () => {
      if (ch) supabase.removeChannel(ch);
    };
  }, []);

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

  const uploadOne = async (f: File) => {
    const startedAt = Date.now();
    setProgress({ name: f.name, percent: 0, loaded: 0, total: f.size, startedAt, startedBytes: 0 });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      // Ghi lại "startedBytes" ở lần onProgress đầu để tính tốc độ từ điểm nối lại (resume).
      let seededBase = false;
      await upload(f, {
        signal: controller.signal,
        onProgress: (p) =>
          setProgress((prev) => {
            const base = !seededBase ? p.loaded : (prev?.startedBytes ?? 0);
            if (!seededBase) seededBase = true;
            return {
              name: f.name,
              percent: p.percent,
              loaded: p.loaded,
              total: p.total,
              startedAt: prev?.startedAt ?? startedAt,
              startedBytes: base,
            };
          }),
      });
      toast.success(`Đã upload: ${f.name}`);
      // xoá khỏi failed nếu retry thành công
      setFailed((prev) => prev.filter((x) => x.file !== f));
      refreshSessions();
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (controller.signal.aborted) toast.message(`Đã dừng upload: ${f.name}`);
      else toast.error(`Upload thất bại: ${msg}. Bạn có thể bấm "Thử lại".`);
      setFailed((prev) => {
        const id = `${f.name}-${f.size}-${f.lastModified}-${Date.now()}`;
        // giữ duy nhất 1 entry cho mỗi file
        const cleaned = prev.filter(
          (x) =>
            !(
              x.file.name === f.name &&
              x.file.size === f.size &&
              x.file.lastModified === f.lastModified
            ),
        );
        return [...cleaned, { id, file: f, error: msg }];
      });
      refreshSessions();
    } finally {
      abortRef.current = null;
      setProgress(null);
      q.refetch();
    }
  };

  const stopCurrentUpload = () => {
    if (!abortRef.current) return;
    abortRef.current.abort();
    toast.message("Đang dừng upload… phiên vẫn được giữ để tiếp tục sau.");
  };

  const retryFromScratch = async (item: { file: File }) => {
    // "Thử lại từ đầu" AN TOÀN: giữ nguyên uploadId, mpList sẽ liệt kê part đã có trên R2 và bỏ qua để không upload trùng.
    const fp = fileFingerprint(item.file);
    const s = listResumableSessions().find((x) => x.fingerprint === fp);
    if (s) {
      try {
        const info = await inspectResumable(s);
        if (info.valid && info.partCount > 0) {
          toast.message(
            `Tận dụng ${info.partCount} part đã có trên R2 (~${fmtBytes(info.totalBytes)}), chỉ upload phần còn thiếu.`,
          );
        }
      } catch {
        /* không chặn retry */
      }
    }
    await uploadOne(item.file);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    for (const f of Array.from(files)) await uploadOne(f);
  };

  const handleResumeSelect = async (files: FileList | null) => {
    const target = resumeTargetRef.current;
    if (!files?.length || !target) return;
    const f = files[0];
    if (fileFingerprint(f) !== target.fingerprint) {
      // Giữ target để user bấm "Tải lại" chọn đúng file mà không mất phiên.
      setMismatchFor(target.fingerprint);
      toast.error(
        `File "${f.name}" không khớp phiên "${target.fileName}". Bấm "Tải lại" để chọn đúng file.`,
      );
      return;
    }
    resumeTargetRef.current = null;
    setMismatchFor(null);
    await uploadOne(f);
  };

  const askResume = (s: ResumableSession) => {
    resumeTargetRef.current = s;
    setMismatchFor(null);
    resumeInputRef.current?.click();
  };

  // "Tải lại": mở lại picker cho đúng phiên hiện tại (dùng khi vừa chọn nhầm file).
  const reloadResume = (s: ResumableSession) => {
    resumeTargetRef.current = s;
    resumeInputRef.current?.click();
  };

  const cancelResumable = async (s: ResumableSession) => {
    if (!confirm(`Huỷ phiên upload "${s.fileName}"?`)) return;
    await abortResumable(s);
    refreshSessions();
    toast.success("Đã huỷ phiên upload");
  };

  // Tính ETA từ tốc độ trung bình kể từ khi bắt đầu (hoặc điểm nối lại).
  const eta = (() => {
    if (!progress) return null;
    void nowTick;
    const elapsed = (Date.now() - progress.startedAt) / 1000;
    const delta = progress.loaded - progress.startedBytes;
    if (elapsed < 1 || delta <= 0) return { speed: 0, remainSec: null as number | null };
    const speed = delta / elapsed; // bytes/s
    const remain = Math.max(0, progress.total - progress.loaded);
    return { speed, remainSec: remain / speed };
  })();
  const fmtDuration = (s: number | null | undefined) => {
    if (s == null || !isFinite(s)) return "—";
    const sec = Math.max(0, Math.round(s));
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60),
      r = sec % 60;
    if (m < 60) return `${m}m ${r}s`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  };
  const fmtAge = (ms: number | null) => {
    if (ms == null) return "—";
    const h = Math.floor(ms / 3600000);
    if (h < 1) return `${Math.floor(ms / 60000)} phút`;
    return `${h}h`;
  };

  const handleDownload = async (key: string) => {
    try {
      const { url } = await download(key);
      window.open(url, "_blank", "noopener");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm("Xoá file này khỏi R2?")) return;
    try {
      await del(key);
      toast.success("Đã xoá");
      q.refetch();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tệp của tôi</h1>
          <p className="text-sm text-muted-foreground">
            Upload / tải xuống qua presigned URL an toàn (ảnh 5', PDF 15').
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => q.refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Làm mới
          </Button>
          <Button size="sm" onClick={() => inputRef.current?.click()}>
            <UploadCloud className="h-4 w-4 mr-1" />
            Upload
          </Button>
          <Input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      </div>

      {progress && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between text-sm mb-1 gap-2">
              <span className="truncate flex-1">{progress.name}</span>
              <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {eta?.remainSec != null ? `còn ~${fmtDuration(eta.remainSec)}` : "đang tính…"}
                {eta && eta.speed > 0 ? ` · ${fmtBytes(Math.round(eta.speed))}/s` : ""}
              </span>
              <span className="tabular-nums">{progress.percent}%</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={stopCurrentUpload}
                title="Dừng upload (giữ phiên để tiếp tục sau)"
              >
                <StopCircle className="h-4 w-4 mr-1 text-destructive" />
                Dừng
              </Button>
            </div>
            <Progress value={progress.percent} />
            <div className="text-xs text-muted-foreground mt-1 tabular-nums">
              {fmtBytes(progress.loaded)} / {fmtBytes(progress.total)}
            </div>
          </CardContent>
        </Card>
      )}

      {(sessions.length > 0 || cleanupStats.removed > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between gap-2">
              <span>Có thể tiếp tục ({sessions.length})</span>
              <span className="text-xs font-normal text-muted-foreground flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  TTL 24h · phiên cũ nhất: {fmtAge(cleanupStats.oldestAgeMs)}
                </span>
                {cleanupStats.removed > 0 && (
                  <span>Đã dọn {cleanupStats.removed} phiên quá hạn</span>
                )}
                <Button size="sm" variant="ghost" onClick={refreshSessions} title="Dọn ngay">
                  <Trash className="h-3 w-3 mr-1" />
                  Dọn
                </Button>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Các phiên upload nhiều phần đang dở dang. Chọn lại đúng file để tiếp tục phần còn
              thiếu (không upload lại từ đầu).
            </p>
            {sessions.map((s) => (
              <div key={s.fingerprint} className="rounded-md border p-2 space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground">
                    <UploadCloud className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.fileName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.key} · {fmtBytes(s.uploadedBytes ?? 0)} / {fmtBytes(s.fileSize)}
                    </div>
                  </div>
                  <span className="text-xs tabular-nums w-10 text-right">{s.percent ?? 0}%</span>
                  <Button size="sm" variant="secondary" onClick={() => askResume(s)}>
                    <PlayCircle className="h-4 w-4 mr-1" />
                    Tiếp tục
                  </Button>
                  <Button
                    size="sm"
                    variant={mismatchFor === s.fingerprint ? "default" : "outline"}
                    onClick={() => reloadResume(s)}
                    title="Chọn lại file nếu vừa chọn nhầm"
                  >
                    <RotateCw className="h-4 w-4 mr-1" />
                    Tải lại
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelResumable(s)}
                    title="Huỷ phiên: abort trên R2 và xoá khỏi localStorage"
                  >
                    <XCircle className="h-4 w-4 mr-1 text-destructive" />
                    Huỷ phiên
                  </Button>
                </div>
                <Progress value={s.percent ?? 0} className="h-1.5" />
                <div className="text-[11px] text-muted-foreground">
                  Bắt đầu: {new Date(s.createdAt).toLocaleString("vi-VN")}
                  {s.updatedAt
                    ? ` · cập nhật ${new Date(s.updatedAt).toLocaleTimeString("vi-VN")}`
                    : ""}
                </div>
                {mismatchFor === s.fingerprint && (
                  <div className="text-xs text-destructive">
                    File vừa chọn không khớp phiên. Bấm <strong>Tải lại</strong> để chọn đúng "
                    {s.fileName}" ({fmtBytes(s.fileSize)}).
                  </div>
                )}
              </div>
            ))}
            <input
              ref={resumeInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                handleResumeSelect(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </CardContent>
        </Card>
      )}

      {failed.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-destructive">
              Upload lỗi ({failed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {failed.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-2"
              >
                <div className="text-destructive">
                  <XCircle className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{it.file.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{it.error}</div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => uploadOne(it.file)}
                  title="Tiếp tục từ điểm dừng (skip part đã upload)"
                >
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Tiếp tục
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => retryFromScratch(it)}
                  title="Kiểm tra part đã có trên R2 rồi upload phần còn thiếu — tránh trùng"
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  Thử lại từ đầu
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFailed((p) => p.filter((x) => x.id !== it.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
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
            <SelectTrigger className="md:w-44">
              <SelectValue placeholder="Loại" />
            </SelectTrigger>
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
            <SelectTrigger className="md:w-44">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="ready">Đã xong</SelectItem>
              <SelectItem value="temp">Đang xử lý</SelectItem>
              <SelectItem value="error">Lỗi</SelectItem>
            </SelectContent>
          </Select>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setCategory("all");
                setStatus("all");
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Xoá lọc
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Danh sách ({filtered.length}
            {hasFilter && q.data ? ` / ${q.data.length}` : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="text-sm text-muted-foreground">Đang tải…</div>
          ) : !q.data?.length ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Chưa có tệp nào.</div>
          ) : !filtered.length ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Không có tệp nào khớp bộ lọc.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((f: any) => (
                <div key={f.id} className="py-2 flex items-center gap-3">
                  <div className="text-muted-foreground">{iconFor(f.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {f.original_name || f.key.split("/").pop()}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{f.key}</div>
                  </div>
                  <div className="text-xs text-muted-foreground w-20 text-right">
                    {fmtBytes(f.size)}
                  </div>
                  <Badge
                    variant={
                      f.status === "ready"
                        ? "default"
                        : f.status === "temp"
                          ? "secondary"
                          : "destructive"
                    }
                    className="capitalize"
                  >
                    {f.status === "ready" ? "Đã xong" : f.status === "temp" ? "Đang xử lý" : "Lỗi"}
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDownload(f.key)}
                    disabled={f.status !== "ready"}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(f.key)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
