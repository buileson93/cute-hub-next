import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/use-session";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import {
  useMaintenancePolicies,
  useSaveMaintenancePolicy,
  useDeleteMaintenancePolicy,
  useLoaiThietBi,
  type ChinhSachRow,
} from "@/lib/mirats/db-smart";
import { PageHeader } from "@/components/mirats/PageHeader";

export const Route = createFileRoute("/_app/admin/bao-tri-chinh-sach")({
  head: () => ({
    meta: [
      { title: "Chính sách bảo dưỡng theo model — MIRATS" },
      {
        name: "description",
        content: "Khai chu kỳ bảo dưỡng theo chủng loại (model): theo lịch hoặc theo giờ vận hành.",
      },
    ],
  }),
  component: ChinhSachPage,
});

const EMPTY: Partial<ChinhSachRow> & { ten: string } = {
  ten: "",
  loai_thiet_bi_id: null,
  mo_ta: "",
  chu_ky_ngay: null,
  chu_ky_gio_chay: null,
  canh_bao_truoc_ngay: 7,
  active: true,
};

function ChinhSachPage() {
  const { loading, hasRole } = useSession();
  const nav = useNavigate();
  const canManage = hasRole("admin") || hasRole("phong_kt");

  useEffect(() => {
    if (!loading && !canManage) nav({ to: "/", replace: true });
  }, [loading, canManage, nav]);

  const { data: rows = [], isLoading } = useMaintenancePolicies();
  const { data: loaiList = [] } = useLoaiThietBi();
  const saveMut = useSaveMaintenancePolicy();
  const delMut = useDeleteMaintenancePolicy();

  const [form, setForm] = useState<Partial<ChinhSachRow> & { ten: string }>(EMPTY);
  const editing = !!form.id;

  const loaiName = (id: string | null) =>
    id ? (loaiList.find((l) => l.id === id)?.ten ?? "—") : "Mọi loại";

  const reset = () => setForm(EMPTY);

  const submit = () => {
    if (!form.ten.trim()) return toast.error("Nhập tên chính sách");
    saveMut.mutate(
      {
        ...form,
        ten: form.ten.trim(),
        chu_ky_ngay: form.chu_ky_ngay ? Number(form.chu_ky_ngay) : null,
        chu_ky_gio_chay: form.chu_ky_gio_chay ? Number(form.chu_ky_gio_chay) : null,
        canh_bao_truoc_ngay: form.canh_bao_truoc_ngay ? Number(form.canh_bao_truoc_ngay) : 7,
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Đã cập nhật chính sách" : "Đã thêm chính sách");
          reset();
        },
        onError: (e: Error) => toast.error(e.message),
      },
    );
  };

  const del = (id: string) => {
    if (!confirm("Xóa chính sách này?")) return;
    delMut.mutate(id, {
      onSuccess: () => toast.success("Đã xóa"),
      onError: (e: Error) => toast.error(e.message),
    });
  };

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Đang tải…</div>;
  if (!canManage) return <AccessDenied backTo="/" backLabel="Về trang chủ" />;

  return (
    <div className="space-y-4 p-4 sm:p-6 lg:p-8">
      <PageHeader
        icon={CalendarClock}
        title="Chính sách bảo dưỡng theo model"
        help="Khai chu kỳ bảo dưỡng cho từng chủng loại: theo lịch (ngày) hoặc theo giờ vận hành. Dùng để nhắc lịch đến hạn."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              {editing ? "Sửa chính sách" : "Thêm chính sách"}
              {editing && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Tên chính sách *</Label>
              <Input
                value={form.ten}
                onChange={(e) => setForm({ ...form, ten: e.target.value })}
                placeholder="VD: Bảo dưỡng định kỳ máy phát"
              />
            </div>
            <div>
              <Label className="text-xs">Áp dụng cho chủng loại (model)</Label>
              <Select
                value={form.loai_thiet_bi_id ?? "all"}
                onValueChange={(v) =>
                  setForm({ ...form, loai_thiet_bi_id: v === "all" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mọi loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Mọi loại</SelectItem>
                  {loaiList.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.ten}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Chu kỳ (ngày)</Label>
                <Input
                  inputMode="numeric"
                  value={form.chu_ky_ngay ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      chu_ky_ngay: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="VD: 180"
                />
              </div>
              <div>
                <Label className="text-xs">Chu kỳ (giờ chạy)</Label>
                <Input
                  inputMode="decimal"
                  value={form.chu_ky_gio_chay ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      chu_ky_gio_chay: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="VD: 500"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Cảnh báo trước (ngày)</Label>
              <Input
                inputMode="numeric"
                value={form.canh_bao_truoc_ngay ?? 7}
                onChange={(e) =>
                  setForm({
                    ...form,
                    canh_bao_truoc_ngay: e.target.value === "" ? 7 : Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label className="text-xs">Mô tả</Label>
              <Textarea
                rows={2}
                value={form.mo_ta ?? ""}
                onChange={(e) => setForm({ ...form, mo_ta: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={submit} disabled={saveMut.isPending}>
              {saveMut.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1 h-4 w-4" />
              )}
              {editing ? "Lưu thay đổi" : "Thêm chính sách"}
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Danh sách chính sách ({rows.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
              </div>
            )}
            {!isLoading && rows.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Chưa có chính sách nào. Thêm ở cột bên trái.
              </p>
            )}
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{r.ten}</span>
                    <Badge variant="outline">{loaiName(r.loai_thiet_bi_id)}</Badge>
                    {!r.active && <Badge variant="secondary">Tắt</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {r.chu_ky_ngay != null && <span>Chu kỳ: {r.chu_ky_ngay} ngày</span>}
                    {r.chu_ky_gio_chay != null && (
                      <span>hoặc {r.chu_ky_gio_chay.toLocaleString("vi-VN")} giờ chạy</span>
                    )}
                    <span>Cảnh báo trước {r.canh_bao_truoc_ngay} ngày</span>
                  </div>
                  {r.mo_ta && <div className="mt-1 text-muted-foreground">{r.mo_ta}</div>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Chỉnh sửa chính sách"
                    onClick={() => setForm(r)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Xoá chính sách"
                    onClick={() => del(r.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
