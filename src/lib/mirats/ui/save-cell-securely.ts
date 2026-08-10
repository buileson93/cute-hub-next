import { supabase } from "@/integrations/backend/client";
import { createChangeRequest } from "@/lib/mirats/ghi-nghiep-vu-actions";

/**
 * Hook để thực hiện ghi dữ liệu an toàn.
 * Nếu user là KTV (hoặc role thấp hơn), thay vì UPDATE trực tiếp (bị RLS chặn),
 * nó sẽ tạo một Change Request để Admin phê duyệt.
 */
export async function saveCellSecurely(args: {
  maThietBi: string;
  field: string;
  value: any;
  userRoles: string[];
}) {
  const isAdmin = args.userRoles.includes("admin") || args.userRoles.includes("phong_kt");

  if (isAdmin) {
    // Admin ghi trực tiếp
    const { error } = await supabase
      .from("thiet_bi")
      .update({ [args.field]: args.value } as any)
      .eq("ma_thiet_bi", args.maThietBi);
    
    if (error) throw error;
    return { success: true, mode: "direct" };
  } else {
    // KTV tạo đề xuất thay đổi
    await createChangeRequest({
      loai: "thiet_bi.propose_field",
      entity_id: args.maThietBi,
      noi_dung: {
        field: args.field,
        value: args.value,
      },
      ghi_chu: `Đề xuất cập nhật trường ${args.field} cho tài sản ${args.maThietBi}`,
    });

    return { success: true, mode: "proposed" };
  }
}
