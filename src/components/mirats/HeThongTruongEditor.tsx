// Trình khai báo trường dữ liệu tuỳ chỉnh — dùng cho nhiều lớp:
//   scope="he_thong"  → trường áp dụng cho mọi tài sản thuộc một hệ thống;
//   scope="thiet_bi"  → trường khai riêng cho một tài sản / thành phần tài sản.
// Lưu vào CSDL qua RPC, admin áp dụng ngay, phòng kỹ thuật gửi chờ duyệt.
// Có nút hoàn tác ở panel lịch sử thay đổi.

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Save, Loader2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useHeThongTruong, useFieldSets, useCayRpc, type FieldKind } from "@/lib/mirats/cay-reorg";
import { REFERENCE_SOURCES } from "@/lib/mirats/reference-sources";

type Row = {
  key: string; // khoá cục bộ trong React
  field_key: string;
  nhan: string;
  kieu: FieldKind;
  tuy_chon: string;
  help_text: string;
  bat_buoc: boolean;
  rb_regex: string;
  rb_min: string;
  rb_max: string;
  rb_ref: string; // nguồn bảng danh mục khi kieu = "reference"
  mac_dinh: string;
  nhom_field: string;
};

const KIEU_LABEL: Record<FieldKind, string> = {
  text: "Văn bản ngắn",
  textarea: "Văn bản dài",
  number: "Số",
  date: "Ngày",
  select: "Danh sách chọn",
  reference: "Liên kết CSDL (chọn có tìm kiếm)",
};

const NONE = "__none__";

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50) || "truong";
}

export function HeThongTruongEditor({
  heThongId, canManage, scope = "he_thong",
}: {
  heThongId: string;
  canManage: boolean;
  /** Lớp áp dụng: theo hệ thống (mặc định) hoặc riêng từng tài sản/thành phần. */
  scope?: "he_thong" | "thiet_bi";
}) {
  const { data: fields, isLoading } = useHeThongTruong(heThongId);
  const { data: fieldSets } = useFieldSets();
  const { submit } = useCayRpc();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!fields) return;
    setRows(
      fields.map((f, i) => {
        const rb = f.rang_buoc ?? {};
        return {
          key: `${f.id}-${i}`,
          field_key: f.field_key,
          nhan: f.nhan,
          kieu: f.kieu,
          tuy_chon: (f.tuy_chon ?? []).join(", "),
          help_text: f.help_text ?? "",
          bat_buoc: f.bat_buoc === true,
          rb_regex: rb.regex ?? "",
          rb_min: rb.min != null ? String(rb.min) : "",
          rb_max: rb.max != null ? String(rb.max) : "",
          rb_ref: typeof rb.ref === "string" ? rb.ref : "",
          mac_dinh:
            f.mac_dinh == null
              ? ""
              : typeof f.mac_dinh === "string"
                ? f.mac_dinh
                : String(f.mac_dinh),
          nhom_field: f.nhom_field ?? "",
        };
      }),
    );
  }, [fields]);

  const addRow = () =>
    setRows((r) => [
      ...r,
      {
        key: `new-${Date.now()}-${r.length}`,
        field_key: "", nhan: "", kieu: "text", tuy_chon: "",
        help_text: "", bat_buoc: false, rb_regex: "", rb_min: "", rb_max: "",
        rb_ref: "", mac_dinh: "", nhom_field: "",
      },
    ]);
  const removeRow = (key: string) => setRows((r) => r.filter((x) => x.key !== key));
  const patch = (key: string, p: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)));

  const save = () => {
    // Chuẩn hoá: bỏ dòng trống, tự sinh field_key theo nhãn nếu chưa có.
    const used = new Set<string>();
    const payloadFields = rows
      .filter((r) => r.nhan.trim())
      .map((r, i) => {
        let fk = (r.field_key || slugify(r.nhan)).trim();
        while (used.has(fk)) fk = `${fk}_${i}`;
        used.add(fk);

        // rang_buoc: chỉ ghi khoá có giá trị hợp lệ.
        const rang_buoc: Record<string, unknown> = {};
        if (r.kieu === "number") {
          if (r.rb_min.trim() !== "" && Number.isFinite(Number(r.rb_min))) rang_buoc.min = Number(r.rb_min);
          if (r.rb_max.trim() !== "" && Number.isFinite(Number(r.rb_max))) rang_buoc.max = Number(r.rb_max);
        } else if (r.kieu === "reference") {
          if (r.rb_ref.trim()) rang_buoc.ref = r.rb_ref.trim();
        } else if (r.kieu !== "select" && r.rb_regex.trim()) {
          rang_buoc.regex = r.rb_regex.trim();
        }

        // mac_dinh (jsonb): số → number, còn lại giữ chuỗi; rỗng → null.
        let mac_dinh: unknown = null;
        if (r.mac_dinh.trim() !== "") {
          mac_dinh = r.kieu === "number" ? Number(r.mac_dinh) : r.mac_dinh.trim();
        }

        return {
          field_key: fk,
          nhan: r.nhan.trim(),
          kieu: r.kieu,
          thu_tu: i,
          tuy_chon:
            r.kieu === "select"
              ? r.tuy_chon.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          help_text: r.help_text.trim() || null,
          bat_buoc: r.bat_buoc,
          rang_buoc,
          mac_dinh,
          nhom_field: r.nhom_field.trim() || null,
        };
      });
    submit.mutate({ loai: "custom_fields", he_thong_id: heThongId, payload: { fields: payloadFields, scope } });
  };

  const changed = useMemo(() => {
    if (!fields) return rows.length > 0;
    if (fields.length !== rows.filter((r) => r.nhan.trim()).length) return true;
    return true; // đơn giản: luôn cho phép lưu khi có tương tác
  }, [fields, rows]);

  return (
    <div className="space-y-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <ListPlus className="h-4 w-4 text-amber-600" />
        {scope === "thiet_bi"
          ? "Trường dữ liệu riêng (tài sản / thành phần này)"
          : "Trường dữ liệu Tài sản (riêng hệ thống này)"}
      </div>





      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : (
        <div className="space-y-3">
          {rows.length === 0 && (
            <div className="rounded border border-dashed p-3 text-center text-xs text-muted-foreground">
              Chưa có trường tuỳ chỉnh nào.
            </div>
          )}
          {rows.map((r) => (
            <div key={r.key} className="space-y-2 rounded-md border bg-background/60 p-2.5">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[11px]">Tên trường</Label>
                  <Input
                    value={r.nhan}
                    disabled={!canManage}
                    onChange={(e) => patch(r.key, { nhan: e.target.value })}
                    placeholder="VD: Công suất phát, Tần số…"
                    className="h-8 text-xs"
                  />
                </div>
                {canManage && (
                  <button
                    className="mt-6 rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Xoá trường"
                    onClick={() => removeRow(r.key)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Kiểu dữ liệu</Label>
                  <Select value={r.kieu} disabled={!canManage} onValueChange={(v) => patch(r.key, { kieu: v as FieldKind })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(KIEU_LABEL) as FieldKind[]).map((k) => (
                        <SelectItem key={k} value={k} className="text-xs">{KIEU_LABEL[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {r.kieu === "select" && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Lựa chọn (cách nhau dấu phẩy)</Label>
                    <Input
                      value={r.tuy_chon}
                      disabled={!canManage}
                      onChange={(e) => patch(r.key, { tuy_chon: e.target.value })}
                      placeholder="Tốt, Khá, Kém"
                      className="h-8 text-xs"
                    />
                  </div>
                )}
                {r.kieu === "reference" && (
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Nguồn danh mục (CSDL)</Label>
                    <Select
                      value={r.rb_ref || undefined}
                      disabled={!canManage}
                      onValueChange={(v) => patch(r.key, { rb_ref: v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="— Chọn bảng —" /></SelectTrigger>
                      <SelectContent>
                        {REFERENCE_SOURCES.map((s) => (
                          <SelectItem key={s.key} value={s.key} className="text-xs">{s.nhan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {r.kieu === "reference" && (
                <p className="text-[10px] text-muted-foreground">
                  Người nhập sẽ chọn giá trị từ danh mục này bằng ô tìm kiếm; giá trị lưu là tên mục đã chọn.
                </p>
              )}

              {/* Ghi chú hướng dẫn hiển thị dưới ô nhập */}
              <div className="space-y-1.5">
                <Label className="text-[11px]">Ghi chú hướng dẫn (help text)</Label>
                <Input
                  value={r.help_text}
                  disabled={!canManage}
                  onChange={(e) => patch(r.key, { help_text: e.target.value })}
                  placeholder="VD: Nhập theo đơn vị W"
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Giá trị mặc định */}
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Giá trị mặc định</Label>
                  <Input
                    value={r.mac_dinh}
                    disabled={!canManage}
                    type={r.kieu === "number" ? "number" : "text"}
                    onChange={(e) => patch(r.key, { mac_dinh: e.target.value })}
                    placeholder="Để trống nếu không có"
                    className="h-8 text-xs"
                  />
                </div>
                {/* Nhóm trường / field set */}
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Nhóm trường</Label>
                  <Select
                    value={r.nhom_field || NONE}
                    disabled={!canManage}
                    onValueChange={(v) => patch(r.key, { nhom_field: v === NONE ? "" : v })}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="— Không —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE} className="text-xs">— Không —</SelectItem>
                      {(fieldSets ?? []).map((fs) => (
                        <SelectItem key={fs.id} value={fs.ten} className="text-xs">{fs.ten}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ràng buộc giá trị theo kiểu */}
              {r.kieu === "number" ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Giá trị tối thiểu</Label>
                    <Input
                      value={r.rb_min}
                      type="number"
                      disabled={!canManage}
                      onChange={(e) => patch(r.key, { rb_min: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px]">Giá trị tối đa</Label>
                    <Input
                      value={r.rb_max}
                      type="number"
                      disabled={!canManage}
                      onChange={(e) => patch(r.key, { rb_max: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              ) : r.kieu !== "select" && r.kieu !== "reference" ? (
                <div className="space-y-1.5">
                  <Label className="text-[11px]">Ràng buộc định dạng (regex)</Label>
                  <Input
                    value={r.rb_regex}
                    disabled={!canManage}
                    onChange={(e) => patch(r.key, { rb_regex: e.target.value })}
                    placeholder="VD: ^[A-Z]{2}[0-9]+$"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              ) : null}

              {/* Bắt buộc */}
              <div className="flex items-center justify-between rounded border bg-background/40 px-2.5 py-1.5">
                <Label className="text-[11px]">Bắt buộc nhập</Label>
                <Switch
                  checked={r.bat_buoc}
                  disabled={!canManage}
                  onCheckedChange={(v) => patch(r.key, { bat_buoc: v })}
                />
              </div>
            </div>
          ))}

          {canManage && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={addRow}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Thêm trường
              </Button>
              <Button size="sm" className="flex-1" onClick={save} disabled={submit.isPending || !changed}>
                {submit.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Lưu trường
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
