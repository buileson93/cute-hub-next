import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { 
  KeyRound, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  Activity,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { PageHeader } from "@/components/mirats/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/mirats/EmptyState";

import { supabase } from "@/integrations/backend/client";
import { createApiKey, revokeApiKey } from "@/lib/mirats/auth/api-keys.functions";

export const Route = createFileRoute("/_app/admin/tich-hop")({
  component: ApiKeysManagement,
});

const AVAILABLE_SCOPES = [
  { id: "projects:read", label: "Xem dự án", desc: "Cho phép đọc thông tin dự án" },
  { id: "tasks:read", label: "Xem công việc", desc: "Cho phép đọc danh sách task" },
  { id: "project_documents:write", label: "Tải lên tài liệu", desc: "Cho phép đính kèm tệp vào dự án" },
  { id: "project_correspondence:write", label: "Tạo công văn", desc: "Cho phép tạo hồ sơ công văn qua extension" },
  { id: "ocr_artifacts:publish", label: "Đóng góp OCR", desc: "Cho phép đẩy dữ liệu OCR từ máy khách" },
];

function ApiKeysManagement() {
  const queryClient = useQueryClient();
  const callCreateKey = useServerFn(createApiKey);
  const callRevokeKey = useServerFn(revokeApiKey);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["projects:read", "project_correspondence:write"]);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch keys
  const { data: keys, isLoading } = useQuery({
    queryKey: ["api_keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return await callCreateKey({ 
        data: { 
          name: newKeyName, 
          scopes: selectedScopes,
          expiresInDays: 365 // Mặc định 1 năm
        } 
      });
    },
    onSuccess: (data) => {
      setGeneratedToken(data.fullToken);
      queryClient.invalidateQueries({ queryKey: ["api_keys"] });
      toast.success("Đã tạo API key thành công");
    },
    onError: (err) => {
      toast.error("Lỗi khi tạo API key: " + err.message);
    }
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await callRevokeKey({ data: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api_keys"] });
      toast.success("Đã thu hồi API key");
    },
    onError: (err) => {
      toast.error("Lỗi khi thu hồi: " + err.message);
    }
  });

  const copyToken = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseSuccess = () => {
    setGeneratedToken(null);
    setIsCreateOpen(false);
    setNewKeyName("");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Tích hợp Browser Extension"
        description="Quản lý API Key để kết nối MIRATS với các công cụ ngoại vi một cách an toàn."
      />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          Danh sách API Key
        </h2>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Tạo Key mới
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Đang tải dữ liệu...</div>
          ) : !keys || keys.length === 0 ? (
            <EmptyState
              title="Chưa có API Key nào"
              description="Tạo API Key để bắt đầu sử dụng MIRATS Browser Extension."
              icon={KeyRound}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên / Identifier</TableHead>
                  <TableHead>Phạm vi (Scopes)</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Sử dụng cuối</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id} className={key.revoked_at ? "opacity-60 grayscale" : ""}>
                    <TableCell>
                      <div className="font-medium">{key.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        mrt_ext_live_{key.key_id}_••••
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.scopes?.map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {format(new Date(key.created_at!), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {key.last_used_at 
                        ? format(new Date(key.last_used_at), "dd/MM/yyyy HH:mm", { locale: vi })
                        : "Chưa sử dụng"}
                    </TableCell>
                    <TableCell>
                      {key.revoked_at ? (
                        <Badge variant="destructive">Đã thu hồi</Badge>
                      ) : key.expires_at && new Date(key.expires_at) < new Date() ? (
                        <Badge variant="outline">Hết hạn</Badge>
                      ) : (
                        <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                          Đang hoạt động
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!key.revoked_at && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm("Bạn có chắc chắn muốn thu hồi key này? Mọi ứng dụng đang dùng key này sẽ bị ngắt kết nối.")) {
                                    revokeMutation.mutate(key.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Thu hồi Key</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Hướng dẫn bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• <b>Tuyệt đối không</b> chia sẻ API Key cho người khác.</p>
            <p>• Key chỉ được hiển thị <b>một lần duy nhất</b> khi tạo.</p>
            <p>• Nếu nghi ngờ key bị lộ, hãy <b>Thu hồi</b> ngay lập tức và tạo key mới.</p>
            <p>• Sử dụng các scope tối thiểu cần thiết để đảm bảo an toàn.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Kết nối Extension
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>Tải và cài đặt Browser Extension từ cửa hàng ứng dụng để tự động hóa việc nhập hồ sơ, công văn và xử lý PDF.</p>
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <a href="#" target="_blank">
                Tải Extension <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialog tạo key */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => !generatedToken && setIsCreateOpen(open)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{generatedToken ? "Lưu API Key của bạn" : "Tạo API Key mới"}</DialogTitle>
            <DialogDescription>
              {generatedToken 
                ? "Đây là lần duy nhất bạn thấy key này. Hãy copy và lưu trữ nó an toàn." 
                : "Đặt tên và chọn phạm vi quyền hạn cho API Key mới."}
            </DialogDescription>
          </DialogHeader>

          {generatedToken ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all border flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Secret Token</span>
                  <Button variant="ghost" size="sm" onClick={copyToken} className="h-8 gap-2">
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Đã copy" : "Copy"}
                  </Button>
                </div>
                <div className="text-primary font-bold">{generatedToken}</div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 text-amber-600 rounded-lg text-xs">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Nếu bạn đóng cửa sổ này, bạn sẽ không bao giờ có thể xem lại key này nữa. Hãy chắc chắn đã sao chép nó.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Tên định danh (ví dụ: Chrome Extension - Laptop)</Label>
                <Input
                  id="key-name"
                  placeholder="Nhập tên để gợi nhớ..."
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label>Phạm vi quyền hạn (Scopes)</Label>
                <div className="grid grid-cols-1 gap-2 border rounded-md p-3">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <div key={scope.id} className="flex items-start space-x-3 space-y-0 py-1.5 border-b last:border-0 border-border/50">
                      <Checkbox
                        id={scope.id}
                        checked={selectedScopes.includes(scope.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedScopes([...selectedScopes, scope.id]);
                          } else {
                            setSelectedScopes(selectedScopes.filter(s => s !== scope.id));
                          }
                        }}
                      />
                      <div className="grid gap-0.5 leading-none">
                        <label
                          htmlFor={scope.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {scope.label}
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          {scope.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {generatedToken ? (
              <Button onClick={handleCloseSuccess} className="w-full">Tôi đã lưu key này</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
                <Button 
                  onClick={() => createMutation.mutate()} 
                  disabled={!newKeyName || selectedScopes.length === 0 || createMutation.isPending}
                >
                  {createMutation.isPending ? "Đang tạo..." : "Tạo API Key"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
