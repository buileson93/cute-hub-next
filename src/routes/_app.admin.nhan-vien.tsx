import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Users, Plus, Search, Pencil, Trash2, Mail, Phone, Building2, UserCircle, Calendar } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { StandardTable } from "@/components/mirats/StandardTable";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SchemaDialog, type SchemaField } from "@/components/mirats/SchemaDialog";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";

export const Route = createFileRoute("/_app/admin/nhan-vien")({
  component: NhanVienAdminPage,
  head: () => ({
    meta: [
      { title: "Quản lý Nhân viên — Admin MIRATS" },
      { name: "description", content: "Quản lý danh sách nhân viên công ty, gán vai trò và thông tin liên lạc." },
    ],
  }),
});

const schema = z.object({
  ma_nhan_vien: z.string().trim().min(2, "Mã nhân viên tối thiểu 2 ký tự").max(40),
  ho_ten: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự").max(100),
  don_vi: z.string().trim().max(100).optional(),
  chuc_vu: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Email không hợp lệ").optional().or(z.literal("")),
  dien_thoai: z.string().trim().max(20).optional(),
  ngay_sinh: z.string().optional(),
  hoat_dong: z.boolean().default(true),
});

type Values = z.infer<typeof schema>;

function NhanVienAdminPage() {
  const { roles } = useSession();
  const isAdmin = roles.includes("admin") || roles.includes("phong_kt");
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<any | "new" | null>(null);

  const { data: nhanVien = [], isLoading } = useQuery({
    queryKey: ["nhan_vien", q],
    queryFn: async () => {
      let query = supabase.from("nhan_vien").select("*").order("ho_ten");
      if (q) {
        query = query.or(`ho_ten.ilike.%${q}%,ma_nhan_vien.ilike.%${q}%,don_vi.ilike.%${q}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (v: Values) => {
      const payload = { ...v, email: v.email || null, ngay_sinh: v.ngay_sinh || null };
      if (editing && editing !== "new") {
        const { error } = await supabase.from("nhan_vien").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("nhan_vien").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nhan_vien"] });
      toast.success(editing === "new" ? "Đã thêm nhân viên" : "Đã cập nhật thông tin");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("nhan_vien").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nhan_vien"] });
      toast.success("Đã xoá nhân viên");
    },
    onError: (e: any) => toast.error("Không thể xoá nhân viên (có thể đang được liên kết với dữ liệu khác)"),
  });

  const fields: SchemaField[] = [
    { key: "ma_nhan_vien", type: "text", label: "Mã nhân viên", required: true, placeholder: "NV001..." },
    { key: "ho_ten", type: "text", label: "Họ và tên", required: true, placeholder: "Nguyễn Văn A" },
    { key: "don_vi", type: "text", label: "Đơn vị / Phòng ban", placeholder: "Phòng Kỹ thuật" },
    { key: "chuc_vu", type: "text", label: "Chức vụ", placeholder: "Kỹ sư" },
    { key: "email", type: "text", label: "Email", placeholder: "example@vatm.vn" },
    { key: "dien_thoai", type: "text", label: "Số điện thoại", placeholder: "09..." },
    { key: "ngay_sinh", type: "date", label: "Ngày sinh" },
    { key: "hoat_dong", type: "switch", label: "Đang làm việc" },
  ];

  if (!isAdmin) return <div className="p-8 text-center text-muted-foreground">Bạn không có quyền quản trị viên.</div>;

  return (
    <div className={`space-y-4 ${UI_DENSITY.PAGE_PADDING}`}>
      <PageHeader
        icon={Users}
        title="Quản lý Nhân viên"
        subtitle={`${nhanVien.length} nhân viên trong hệ thống`}
        actions={
          <Button onClick={() => setEditing("new")} className="gap-2">
            <Plus className="h-4 w-4" /> Thêm nhân viên
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mã, đơn vị..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <StandardTable
        data={nhanVien}
        isLoading={isLoading}
        columns={[
          {
            key: "ho_ten",
            header: "Họ tên",
            render: (v, row) => (
              <div className="flex items-center gap-2">
                <UserCircle className="h-8 w-8 text-muted-foreground/50" />
                <div>
                  <div className="font-medium">{v}</div>
                  <div className="text-xs text-muted-foreground">{row.ma_nhan_vien}</div>
                </div>
              </div>
            ),
          },
          { key: "don_vi", header: "Đơn vị" },
          { key: "chuc_vu", header: "Chức vụ" },
          {
            key: "email",
            header: "Liên lạc",
            render: (v, row) => (
              <div className="space-y-1 text-xs">
                {v && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> {v}
                  </div>
                )}
                {row.dien_thoai && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {row.dien_thoai}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "hoat_dong",
            header: "Trạng thái",
            render: (v) => (
              <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {v ? "Đang làm việc" : "Nghỉ việc"}
              </div>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (_, row) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(row)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                  if (confirm(`Xoá nhân viên ${row.ho_ten}?`)) deleteMut.mutate(row.id);
                }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
      />

      <SchemaDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "new" ? "Thêm nhân viên mới" : "Sửa thông tin nhân viên"}
        fields={fields}
        schema={schema}
        defaultValues={editing === "new" ? { hoat_dong: true } : editing}
        onSubmit={(v) => saveMut.mutateAsync(v)}
      />
    </div>
  );
}
