import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { FileText } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_app/admin/forms/")({
  head: () => ({
    meta: [
      { title: "Quản lý mẫu biên bản — MIRATS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminFormsPage,
});

type Template = {
  id: string;
  code: string;
  ten: string;
  mo_ta: string | null;
  nhom: string;
  thiet_bi_mode: "none" | "single" | "multi";
  active: boolean;
  require_signature: boolean;
  version: number;
  updated_at: string;
};

function AdminFormsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { loading, hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "", ten: "", mo_ta: "",
    nhom: "bien_ban",
    thiet_bi_mode: "none" as Template["thiet_bi_mode"],
    require_signature: true,
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin-form-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_template")
        .select("id,code,ten,mo_ta,nhom,thiet_bi_mode,active,require_signature,version,updated_at")
        .order("code");
      if (error) throw error;
      return (data ?? []) as Template[];
    },
    enabled: canManage,
  });

  const createM = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("form_template")
        .insert({
          code: form.code.trim().toUpperCase(),
          ten: form.ten.trim(),
          mo_ta: form.mo_ta.trim() || null,
          nhom: form.nhom,
          thiet_bi_mode: form.thiet_bi_mode,
          require_signature: form.require_signature,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Đã tạo mẫu");
      setOpen(false);
      setForm({ code: "", ten: "", mo_ta: "", nhom: "bien_ban", thiet_bi_mode: "none", require_signature: true });
      qc.invalidateQueries({ queryKey: ["admin-form-templates"] });
      nav({ to: "/admin/forms/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleM = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("form_template").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-form-templates"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  if (!canManage) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-500" />
        <p className="mt-4 font-semibold">Chỉ admin hoặc phòng KT được quản lý mẫu.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-12">
      <div className="mb-6 flex items-center justify-between">
        <PageHeader
          icon={FileText}
          title="Mẫu biên bản"
          help="Tạo và chỉnh sửa các mẫu form đơn vị dùng để lập biên bản."
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Tạo mẫu mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tạo mẫu biên bản</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Mã mẫu (VD: BB_KIEM_TRA)</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} maxLength={40} /></div>
              <div><Label>Tên mẫu</Label>
                <Input value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} maxLength={200} /></div>
              <div><Label>Mô tả</Label>
                <Textarea value={form.mo_ta} onChange={(e) => setForm({ ...form, mo_ta: e.target.value })} rows={2} maxLength={500} /></div>
              <div><Label>Loại mẫu</Label>
                <Select value={form.nhom} onValueChange={(v) => setForm({ ...form, nhom: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bien_ban">Biên bản chung</SelectItem>
                    <SelectItem value="bao_duong">Phiếu bảo dưỡng</SelectItem>
                  </SelectContent>
                </Select>
                {form.nhom === "bao_duong" && (
                  <p className="mt-1 text-xs text-muted-foreground">Sau khi tạo, vào phần chỉnh sửa để gắn mẫu này với các hệ thống cụ thể.</p>
                )}
              </div>
              <div><Label>Chế độ liên kết tài sản</Label>
                <Select value={form.thiet_bi_mode} onValueChange={(v) => setForm({ ...form, thiet_bi_mode: v as Template["thiet_bi_mode"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không gắn tài sản</SelectItem>
                    <SelectItem value="single">1 tài sản</SelectItem>
                    <SelectItem value="multi">Nhiều tài sản</SelectItem>
                  </SelectContent>
                </Select></div>
              <div className="flex items-center gap-3">
                <div className="flex justify-center">
                  <Switch checked={form.require_signature} onCheckedChange={(v) => setForm({ ...form, require_signature: v })} />
                </div>
                <Label>Có phần chữ ký</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
              <Button onClick={() => createM.mutate()} disabled={!form.code.trim() || !form.ten.trim() || createM.isPending}>
                {createM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Tạo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Mã</TableHead><TableHead>Tên</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Tài sản</TableHead><TableHead>Chữ ký</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead><TableHead className="text-right">Hành động</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(templates ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.code}</TableCell>
                    <TableCell className="font-medium">{t.ten}</TableCell>
                    <TableCell>
                      <Badge variant={t.nhom === "bao_duong" ? "default" : "secondary"}>
                        {t.nhom === "bao_duong" ? "Bảo dưỡng" : "Biên bản"}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline">{t.thiet_bi_mode === "none" ? "—" : t.thiet_bi_mode === "single" ? "1 TB" : "Nhiều TB"}</Badge></TableCell>
                    <TableCell>{t.require_signature ? "Có" : "Không"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Switch checked={t.active} onCheckedChange={(v) => toggleM.mutate({ id: t.id, active: v })} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to="/admin/forms/$id" params={{ id: t.id }}>Chỉnh sửa</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(templates ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Chưa có mẫu nào.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
