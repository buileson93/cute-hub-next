import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  Search, 
  Filter, 
  Settings2, 
  Play, 
  Pause, 
  Square, 
  ChevronRight, 
  Database,
  Cpu,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  HardDrive,
  Monitor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ocrRepository } from "@/lib/mirats/document-ocr/repository";
import { getUnprocessedDocuments } from "@/lib/mirats/document-ocr/ocr-admin.functions";
import { OcrBatchProcessor, BatchStatus, BatchConfig } from "@/lib/mirats/document-ocr/batch-processor";
import { OcrStatus, UnprocessedPdfItem } from "@/lib/mirats/document-ocr/types";

export const Route = createFileRoute("/_app/admin/ocr")({
  component: OcrAdminPage,
});

function OcrAdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [filter, setFilter] = useState({
    status: "" as string,
    sourceType: "" as any,
    search: ""
  });
  
  const [batchConfig, setBatchConfig] = useState<BatchConfig>({
    concurrency: 1,
    qualityProfile: "balanced",
    pauseOnHidden: true,
    pauseOnResourcePressure: true,
    maxPagesPerSession: 50
  });

  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Queries
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["ocr-stats"],
    queryFn: () => ocrRepository.getOcrStats()
  });

  const { data: documents, isLoading, refetch: refetchDocs } = useQuery({
    queryKey: ["unprocessed-docs", filter],
    queryFn: () => getUnprocessedDocuments({ 
      data: {
        limit: 100, 
        status: filter.status === "all" ? undefined : (filter.status || undefined),
        sourceType: filter.sourceType === "all" ? undefined : (filter.sourceType || undefined)
      }
    })
  });


  // Batch Processor
  const processor = useMemo(() => {
    return new OcrBatchProcessor(batchConfig, (status) => {
      setBatchStatus(status);
      if (!status.isProcessing && status.processed > 0) {
        refetchStats();
        refetchDocs();
      }
    });
  }, [batchConfig]);

  useEffect(() => {
    return () => processor.dispose();
  }, [processor]);

  const filteredDocs = useMemo(() => {
    if (!documents) return [];
    return documents.filter(doc => 
      doc.file_name.toLowerCase().includes(filter.search.toLowerCase()) ||
      doc.model_ma?.toLowerCase().includes(filter.search.toLowerCase()) ||
      doc.thiet_bi_ma?.toLowerCase().includes(filter.search.toLowerCase())
    );
  }, [documents, filter.search]);

  const handleStartBatch = () => {
    if (selectedIds.size === 0) {
      toast.error("Vui lòng chọn ít nhất một tài liệu.");
      return;
    }

    const itemsToProcess = filteredDocs
      .filter(doc => selectedIds.has(doc.source_id))
      .map(doc => ({
        sourceType: doc.source_type,
        sourceId: doc.source_id,
        fileName: doc.file_name
      }));

    processor.setQueue(itemsToProcess);
    processor.start();
    setActiveTab("processing");
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocs.map(d => d.source_id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quản trị OCR</h1>
          <p className="text-xs text-muted-foreground">Xử lý nội dung PDF cũ trên client-side</p>
        </div>
        <div className="flex items-center gap-2">
          {batchStatus?.isProcessing && (
             <Badge variant="info" className="animate-pulse">
                Đang xử lý: {batchStatus.currentItem}
             </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchDocs(); }}>
            <RefreshCw className="h-3.5 w-3.5 mr-2" /> Làm mới
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-fit grid-cols-3 mb-4">
            <TabsTrigger value="dashboard">Bảng điều khiển</TabsTrigger>
            <TabsTrigger value="documents">Tài liệu ({filteredDocs.length})</TabsTrigger>
            <TabsTrigger value="processing">Tiến trình {batchStatus?.isProcessing ? "●" : ""}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="flex-1 overflow-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatsCard 
                title="Tổng PDF" 
                value={stats?.totalDocs || 0} 
                icon={<FileText className="h-4 w-4 text-blue-500" />} 
              />
              <StatsCard 
                title="Đã hoàn thành" 
                value={stats?.completed || 0} 
                icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} 
                description={`${Math.round(((stats?.completed || 0) / (stats?.totalDocs || 1)) * 100)}%`}
              />
              <StatsCard 
                title="Đang xử lý/Partial" 
                value={(stats?.pending || 0) + (stats?.partial || 0)} 
                icon={<Clock className="h-4 w-4 text-amber-500" />} 
              />
              <StatsCard 
                title="Lỗi" 
                value={stats?.failed || 0} 
                icon={<AlertCircle className="h-4 w-4 text-red-500" />} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cấu hình xử lý</CardTitle>
                  <CardDescription>Cài đặt an toàn cho thiết bị</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quality" className="text-xs">Chất lượng (Provider)</Label>
                    <Select 
                      value={batchConfig.qualityProfile} 
                      onValueChange={(v: any) => setBatchConfig(prev => ({ ...prev, qualityProfile: v }))}
                    >
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eco">Tiết kiệm (Eco)</SelectItem>
                        <SelectItem value="balanced">Cân bằng (Balanced)</SelectItem>
                        <SelectItem value="quality">Chất lượng (High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs">Tự dừng khi ẩn tab</Label>
                      <p className="text-[10px] text-muted-foreground">Khuyên dùng để tránh browser kill process</p>
                    </div>
                    <Switch 
                      checked={batchConfig.pauseOnHidden}
                      onCheckedChange={(v) => setBatchConfig(prev => ({ ...prev, pauseOnHidden: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs">Giám sát bộ nhớ</Label>
                      <p className="text-[10px] text-muted-foreground">Tự dừng nếu thiết bị quá nóng/đầy RAM</p>
                    </div>
                    <Switch 
                      checked={batchConfig.pauseOnResourcePressure}
                      onCheckedChange={(v) => setBatchConfig(prev => ({ ...prev, pauseOnResourcePressure: v }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <Label>Giới hạn trang/phiên</Label>
                      <span className="font-mono">{batchConfig.maxPagesPerSession} trang</span>
                    </div>
                    <Input 
                      type="number" 
                      value={batchConfig.maxPagesPerSession}
                      onChange={(e) => setBatchConfig(prev => ({ ...prev, maxPagesPerSession: parseInt(e.target.value) }))}
                      className="h-8 text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Yêu cầu hệ thống</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                      <Cpu className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-medium text-blue-900">Xử lý tại Client</p>
                        <p className="text-blue-700">Tiến trình này sử dụng CPU/RAM của máy bạn. Hãy cắm sạc nếu là Laptop.</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                      <Monitor className="h-4 w-4 text-amber-500 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-medium text-amber-900">Giữ tab luôn mở</p>
                        <p className="text-amber-700">Trình duyệt có thể tạm dừng các tác vụ tốn tài nguyên nếu tab bị ẩn hoặc thu nhỏ.</p>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="flex-1 flex flex-col overflow-hidden gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Tìm theo tên file, model hoặc tài sản..." 
                  className="pl-8 h-9 text-xs"
                  value={filter.search}
                  onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              <Select 
                value={filter.status} 
                onValueChange={(v) => setFilter(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="not_started">Chưa bắt đầu</SelectItem>
                  <SelectItem value="failed">Lỗi</SelectItem>
                  <SelectItem value="partial">Một phần</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleStartBatch} 
                className="h-9 px-4" 
                disabled={selectedIds.size === 0 || batchStatus?.isProcessing}
              >
                <Play className="h-3.5 w-3.5 mr-2" /> Xử lý ({selectedIds.size})
              </Button>
            </div>

            <div className="flex-1 border rounded-md overflow-hidden bg-card">
              <ScrollArea className="h-full">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-muted z-10 border-b">
                    <tr>
                      <th className="p-3 w-10">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.size === filteredDocs.length && filteredDocs.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="p-3 font-medium">Tài liệu</th>
                      <th className="p-3 font-medium">Nguồn</th>
                      <th className="p-3 font-medium">Dung lượng</th>
                      <th className="p-3 font-medium">Trạng thái</th>
                      <th className="p-3 font-medium text-right">Ngày tải</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Đang tải...</td></tr>
                    ) : filteredDocs.length === 0 ? (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Không tìm thấy tài liệu phù hợp</td></tr>
                    ) : (
                      filteredDocs.map(doc => (
                        <tr key={doc.source_id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-3">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(doc.source_id)}
                              onChange={() => toggleSelect(doc.source_id)}
                            />
                          </td>
                          <td className="p-3">
                            <div className="font-medium truncate max-w-[250px]" title={doc.file_name}>
                              {doc.file_name}
                            </div>
                            {doc.error_code && (
                              <div className="text-[10px] text-red-500 mt-0.5">Lỗi: {doc.error_code}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px]">
                              {doc.model_ma || doc.thiet_bi_ma || "Global"}
                            </Badge>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : '--'}
                          </td>
                          <td className="p-3">
                            <StatusBadge status={doc.status} />
                          </td>
                          <td className="p-3 text-right text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString("vi-VN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="processing" className="flex-1 space-y-6 overflow-auto">
            {batchStatus ? (
              <div className="space-y-6 max-w-2xl mx-auto py-4">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Trạng thái Batch</CardTitle>
                      <Badge variant={batchStatus.isProcessing ? "info" : "outline"}>
                        {batchStatus.isProcessing ? "Đang chạy" : batchStatus.isPaused ? "Tạm dừng" : "Đã xong"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Tiến trình tổng quát</span>
                        <span>{batchStatus.processed} / {batchStatus.total}</span>
                      </div>
                      <Progress value={(batchStatus.processed / batchStatus.total) * 100} />
                      <div className="flex gap-4 text-[11px]">
                         <span className="text-green-600">Thành công: {batchStatus.succeeded}</span>
                         <span className="text-red-500">Thất bại: {batchStatus.failed}</span>
                         <span className="text-blue-500">Trang: {batchStatus.pagesInSession}</span>
                      </div>
                    </div>

                    {batchStatus.isProcessing && (
                      <div className="p-4 rounded-lg bg-muted space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                            <span className="truncate max-w-[300px]">{batchStatus.currentItem}</span>
                          </div>
                          {batchStatus.currentPage && (
                             <span className="text-[10px]">Trang {batchStatus.currentPage}</span>
                          )}
                        </div>
                        <Progress value={0} className="h-1" />
                      </div>
                    )}

                    <div className="flex justify-center gap-3">
                      {batchStatus.isProcessing ? (
                        <Button variant="outline" size="sm" onClick={() => processor.pause()}>
                          <Pause className="h-3.5 w-3.5 mr-2" /> Tạm dừng
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => processor.start()}
                          disabled={batchStatus.processed >= batchStatus.total}
                        >
                          <Play className="h-3.5 w-3.5 mr-2" /> Tiếp tục
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => processor.stop()}>
                        <Square className="h-3.5 w-3.5 mr-2" /> Hủy bỏ
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                   <h3 className="text-xs font-semibold px-1">Nhật ký phiên xử lý</h3>
                   <div className="border rounded-md bg-card p-4 h-[200px] font-mono text-[10px] space-y-1 overflow-auto">
                      <div className="text-muted-foreground">[{new Date().toLocaleTimeString()}] Bắt đầu phiên làm việc...</div>
                      {batchStatus.isProcessing && (
                        <div className="text-blue-500">[{new Date().toLocaleTimeString()}] Đang xử lý {batchStatus.currentItem}...</div>
                      )}
                      {batchStatus.isPaused && (
                         <div className="text-amber-500">[{new Date().toLocaleTimeString()}] Phiên bị tạm dừng.</div>
                      )}
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-3">
                <Play className="h-12 w-12 opacity-10" />
                <p className="text-sm">Chưa có tiến trình nào đang chạy.</p>
                <Button variant="outline" size="sm" onClick={() => setActiveTab("documents")}>
                  Chọn tài liệu ngay
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, description }: { title: string, value: number, icon: React.ReactNode, description?: string }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[11px] font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-lg font-bold">{value}</div>
        {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed": return <Badge variant="success">Hoàn thành</Badge>;
    case "failed": return <Badge variant="destructive">Lỗi</Badge>;
    case "partial": return <Badge variant="warning">Một phần</Badge>;
    case "ocr_running": return <Badge variant="info">Đang chạy</Badge>;
    case "queued": return <Badge variant="secondary">Hàng đợi</Badge>;
    default: return <Badge variant="outline">Chưa có</Badge>;
  }
}
