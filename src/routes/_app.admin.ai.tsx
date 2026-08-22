import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Save, Loader2, Info } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getAiAdminConfig, updateAiAdminConfig } from "@/lib/ai/config.functions";

export const Route = createFileRoute("/_app/admin/ai")({
  component: AdminAiPage,
});

const LOVABLE_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-pro",
  "google/gemini-3.5-flash",
  "google/gemini-3.1-flash-lite",
  "openai/gpt-5-mini",
  "openai/gpt-5-nano",
  "openai/gpt-5",
];

function AdminAiPage() {
  const nav = useNavigate();
  const { loading, hasRole } = useSession();
  const qc = useQueryClient();
  const getFn = useServerFn(getAiAdminConfig);
  const updFn = useServerFn(updateAiAdminConfig);

  useEffect(() => {
    if (!loading && !hasRole("admin")) nav({ to: "/", replace: true });
  }, [loading, hasRole, nav]);

  const { data, isLoading } = useQuery({
    queryKey: ["ai-admin-config"],
    queryFn: () => getFn(),
    enabled: !loading && hasRole("admin"),
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (payload: any) => updFn({ data: payload }),
    onSuccess: () => {
      toast.success("Đã lưu cấu hình AI");
      qc.invalidateQueries({ queryKey: ["ai-admin-config"] });
      qc.invalidateQueries({ queryKey: ["ai-public-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || isLoading || !form) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
      </div>
    );
  }

  const submit = () => {
    save.mutate({
      enabled: form.enabled,
      provider: form.provider,
      model: form.model,
      base_url: form.base_url || null,
      api_key_secret_name: form.api_key_secret_name || null,
      system_prompt: form.system_prompt,
      max_tokens: Number(form.max_tokens),
      beta_label: form.beta_label,
    });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 lg:p-8">
      <PageHeader
        icon={Sparkles}
        title="Cấu hình AI"
        help="Chọn nhà cung cấp AI, model, prompt hệ thống và giới hạn cho trợ lý MIRATS AI."
        actions={
          <Button onClick={submit} disabled={save.isPending} size="sm">
            {save.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lưu cấu hình
          </Button>
        }
      />

      <Card className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Bật trợ lý AI</Label>
            <p className="text-xs text-muted-foreground">
              Khi tắt, nút "Hỏi AI" và MCP server sẽ không hoạt động.
            </p>
          </div>
          <Switch
            checked={form.enabled}
            onCheckedChange={(v) => setForm({ ...form, enabled: v })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nhãn hiển thị</Label>
            <Input
              value={form.beta_label ?? ""}
              onChange={(e) => setForm({ ...form, beta_label: e.target.value })}
              placeholder="Beta"
              maxLength={20}
            />
            <p className="text-[11px] text-muted-foreground">
              Hiện trên nút và tiêu đề panel chat.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Giới hạn token / trả lời</Label>
            <Input
              type="number"
              value={form.max_tokens}
              onChange={(e) => setForm({ ...form, max_tokens: e.target.value })}
              min={128}
              max={16384}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nhà cung cấp</Label>
            <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lovable">Lovable AI Gateway (miễn phí)</SelectItem>
                <SelectItem value="custom">Endpoint OpenAI-compatible (tuỳ chọn)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Model</Label>
            {form.provider === "lovable" ? (
              <Select value={form.model} onValueChange={(v) => setForm({ ...form, model: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOVABLE_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="ví dụ: gpt-4o-mini"
              />
            )}
          </div>
        </div>

        {form.provider === "custom" && (
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <div className="col-span-2 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Endpoint phải tương thích OpenAI Chat Completions API. API key lưu ở dạng secret
                trên máy chủ; nhập tên biến (ví dụ <code className="font-mono">OPENAI_API_KEY</code>
                ).
              </span>
            </div>
            <div className="space-y-1.5">
              <Label>Base URL</Label>
              <Input
                value={form.base_url ?? ""}
                onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tên secret chứa API key</Label>
              <Input
                value={form.api_key_secret_name ?? ""}
                onChange={(e) => setForm({ ...form, api_key_secret_name: e.target.value })}
                placeholder="OPENAI_API_KEY"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>System prompt (chỉ dẫn AI)</Label>
          <Textarea
            value={form.system_prompt}
            onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
            rows={8}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Xác định giọng điệu, ngôn ngữ và giới hạn của trợ lý. Nên yêu cầu trả lời tiếng Việt và
            chỉ dùng dữ liệu từ tool.
          </p>
        </div>
      </Card>

      <Card className="space-y-2 border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> Tool AI được cấp
        </div>
        <ul className="ml-5 list-disc space-y-0.5 text-xs text-muted-foreground">
          <li>
            <code>search_global</code> — tìm toàn hệ thống
          </li>
          <li>
            <code>list_thiet_bi</code> / <code>get_thiet_bi</code> — tài sản
          </li>
          <li>
            <code>list_giay_phep_sap_het_han</code> — giấy phép hết hạn
          </li>
          <li>
            <code>list_form_submissions</code> — biểu mẫu
          </li>
          <li>
            <code>count_thiet_bi_by_trang_thai</code> — thống kê
          </li>
        </ul>
        <p className="text-[11px] text-muted-foreground">
          Mọi tool <b>chỉ đọc</b> và tuân RLS đơn vị của người đang chat. Cùng bộ tool này được MCP
          server phát ra tại <code>/mcp</code> để dùng với ChatGPT/Claude bên ngoài.
        </p>
      </Card>
    </div>
  );
}
