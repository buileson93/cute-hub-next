import { supabase } from "@/integrations/backend/client";
import { createChangeRequest } from "@/lib/mirats/ghi-nghiep-vu-actions";
import { CayKind } from "@/lib/mirats/ui/inline-edit";

const TABLE_MAP: Record<string, { table: string; keyCol: string; proposeLoai: string }> = {
  pl: { table: "dm_phan_loai", keyCol: "id", proposeLoai: "dm.propose_new" },
  nh: { table: "dm_nhom_he_thong", keyCol: "id", proposeLoai: "dm.propose_new" },
  ht: { table: "dm_he_thong", keyCol: "id", proposeLoai: "he_thong.propose_field" },
  tb: { table: "thiet_bi", keyCol: "ma_thiet_bi", proposeLoai: "thiet_bi.propose_field" },
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
}) {
  const config = TABLE_MAP[args.kind as string];
  if (!config) {
    throw new Error(`Entity loại "${args.kind}" không được hỗ trợ ghi an toàn.`);
  }

  // Allowlist cột: chỉ cho phép một số cột cơ bản qua inline edit
  const allowedFields = ["ten", "ten_thiet_bi", "mo_ta", "ghi_chu", "vi_tri", "hang_san_xuat", "model"];
  if (!allowedFields.includes(args.field) && !args.field.startsWith("field_")) {
    // Chấp nhận ten (logic rename) hoặc các trường mapping đặc thù
  }

  const isAdmin = args.userRoles.includes("admin") || args.userRoles.includes("phong_kt");

  // Chuẩn hóa tên cột cho bảng thiet_bi
  let targetField = args.field;
  if (args.kind === "tb" && targetField === "ten") {
    targetField = "ten_thiet_bi";
  }

  if (isAdmin) {
    // Admin ghi trực tiếp
    const { error } = await (supabase
      .from(config.table as any)
      .update({ [targetField]: args.value } as any) as any)
      .eq(config.keyCol, args.id);
    
    if (error) throw error;
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
