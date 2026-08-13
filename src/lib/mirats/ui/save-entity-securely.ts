import { supabase } from "@/integrations/backend/client";
import { createChangeRequest } from "@/lib/mirats/ghi-nghiep-vu-actions";
import { CayKind } from "@/lib/mirats/ui/inline-edit";

const TABLE_MAP: Record<string, { table: string; keyCol: string; nameCol: string; proposeLoai: string }> = {
  pl: { table: "dm_phan_loai", keyCol: "id", nameCol: "ten", proposeLoai: "dm.propose_new" },
  nh: { table: "dm_nhom_he_thong", keyCol: "id", nameCol: "ten", proposeLoai: "dm.propose_new" },
  ht: { table: "dm_he_thong", keyCol: "id", nameCol: "ten", proposeLoai: "he_thong.propose_field" },
  tb: { table: "thiet_bi", keyCol: "ma_thiet_bi", nameCol: "ten_thiet_bi", proposeLoai: "thiet_bi.propose_field" },
};

/**
 * Thực hiện ghi dữ liệu an toàn cho bất kỳ entity nào trong cây hệ thống.
 * Chặn ghi nếu không có trong allowlist (chỉ cho phép các bảng danh mục và thiết bị).
 */
export async function saveEntityFieldSecurely(args: {
  kind: CayKind;
  id: string; // uuid cho pl/nh/ht, mã thiết bị cho tb
  field: string;
  value: any;
  userRoles: string[];
  isDraft?: boolean;
}) {
  const config = TABLE_MAP[args.kind as string];
  if (!config) {
    throw new Error(`Entity loại "${args.kind}" không được hỗ trợ ghi an toàn.`);
  }

  // Nếu là node nháp trên Mindmap -> Ghi thẳng vào cay_node_edit (SSoT cho nháp)
  if (args.isDraft) {
    const { error } = await supabase
      .from("cay_node_edit")
      .upsert(
        { kind: args.kind, ma: args.id, ten: String(args.value || "").trim() } as never,
        { onConflict: "kind,ma" }
      );
    if (error) throw error;
    return { success: true, mode: "draft" };
  }

  // Chuẩn hóa tên cột
  let targetField = args.field;
  if (targetField === "ten") {
    targetField = config.nameCol;
  }

  const isAdmin = args.userRoles.includes("admin") || args.userRoles.includes("phong_kt");

  if (isAdmin) {
    // Admin ghi trực tiếp vào bảng gốc
    const value = typeof args.value === 'string' ? args.value.trim() : args.value;
    if (targetField === config.nameCol && !value) {
      throw new Error("Tên không được để trống");
    }

    const { error } = await (supabase
      .from(config.table as any)
      .update({ [targetField]: value } as any) as any)
      .eq(config.keyCol, args.id);
    
    if (error) throw error;

    // QUAN TRỌNG: Nếu đổi tên cho node thật -> Xoá triệt để override ở cay_node_edit
    // để đảm bảo SSoT bảng gốc thắng khi hiển thị.
    if (targetField === config.nameCol) {
      await Promise.all([
        supabase
          .from("cay_node_edit")
          .delete()
          .eq("kind", args.kind)
          .eq("ma", args.id),
        // Nếu có key ten_mindmap trong du_lieu JSON, ta cũng nên dọn (nếu schema cho phép)
        // Hiện tại ta ưu tiên xoá bản ghi cay_node_edit trước.
      ]);
    }

    return { success: true, mode: "direct" };
  } else {
    // KTV tạo đề xuất thay đổi
    await createChangeRequest({
      loai: config.proposeLoai as "thiet_bi.propose_field" | "he_thong.propose_field" | "dm.propose_new",
      entity_id: args.id,
      noi_dung: {
        field: targetField,
        value: args.value,
      },
      ghi_chu: `Đề xuất cập nhật ${targetField} cho ${config.table} (${args.id})`,
    });

    return { success: true, mode: "proposed" };
  }
}

/** @deprecated Dùng saveEntityFieldSecurely */
export const saveCellSecurely = (args: any) => 
  saveEntityFieldSecurely({ 
    kind: "tb", 
    id: args.maThietBi, 
    field: args.field, 
    value: args.value, 
    userRoles: args.userRoles 
  });
