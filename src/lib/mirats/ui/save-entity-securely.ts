import { supabase } from "@/integrations/backend/client";
import { createChangeRequest } from "@/lib/mirats/ghi-nghiep-vu-actions";
import { CayKind } from "@/lib/mirats/ui/inline-edit";

const TABLE_MAP: Record<
  string,
  { table: string; keyCol: string; nameCol: string; proposeLoai: string }
> = {
  pl: { table: "dm_phan_loai", keyCol: "id", nameCol: "ten", proposeLoai: "dm.propose_new" },
  nh: { table: "dm_nhom_he_thong", keyCol: "id", nameCol: "ten", proposeLoai: "dm.propose_new" },
  ht: { table: "dm_he_thong", keyCol: "id", nameCol: "ten", proposeLoai: "he_thong.propose_field" },
  tp: {
    table: "he_thong_thanh_phan",
    keyCol: "id",
    nameCol: "ten",
    proposeLoai: "he_thong.propose_field",
  },
  tb: {
    table: "thiet_bi",
    keyCol: "ma_thiet_bi",
    nameCol: "ten_thiet_bi",
    proposeLoai: "thiet_bi.propose_field",
  },
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
      .upsert({ kind: args.kind, ma: args.id, ten: String(args.value || "").trim() } as never, {
        onConflict: "kind,ma",
      });
    if (error) throw error;
    return { success: true, mode: "draft" };
  }

  // Chuẩn hóa tên cột
  let targetField = args.field;
  if (targetField === "ten") {
    targetField = config.nameCol;
  }

  // Chuẩn hoá khoá định danh: node "ht" trên cây mang mã ghép "<NHOM>|<uuid>",
  // node "nh" mang MÃ nhóm (không phải uuid) -> phải chọn đúng cột khoá,
  // nếu không câu update sẽ khớp 0 dòng và im lặng "thành công" (sinh rác UX).
  const { keyCol, keyValue } = resolveEntityKey(args.kind as string, args.id, config.keyCol);

  const isAdmin = args.userRoles.includes("admin") || args.userRoles.includes("phong_kt");

  if (isAdmin) {
    // Admin ghi trực tiếp vào bảng gốc
    const value = typeof args.value === "string" ? args.value.trim() : args.value;
    if (targetField === config.nameCol && !value) {
      throw new Error("Tên không được để trống");
    }

    const { data, error } = await (
      supabase.from(config.table as any).update({ [targetField]: value } as any) as any
    )
      .eq(keyCol, keyValue)
      .select(keyCol);

    if (error) throw error;
    if (!data || (data as any[]).length === 0) {
      throw new Error(`Không tìm thấy bản ghi để cập nhật (${config.table}: ${keyValue})`);
    }

    // QUAN TRỌNG: Nếu đổi tên cho node thật -> Xoá triệt để override ở cay_node_edit
    // để đảm bảo SSoT bảng gốc thắng khi hiển thị.
    if (targetField === config.nameCol) {
      await supabase.from("cay_node_edit").delete().eq("kind", args.kind).eq("ma", args.id);
    }

    return { success: true, mode: "direct" };
  } else {
    // KTV tạo đề xuất thay đổi
    await createChangeRequest({
      loai: config.proposeLoai as
        | "thiet_bi.propose_field"
        | "he_thong.propose_field"
        | "dm.propose_new",
      entity_id: keyValue,
      noi_dung: {
        field: targetField,
        value: args.value,
      },
      ghi_chu: `Đề xuất cập nhật ${targetField} cho ${config.table} (${keyValue})`,
    });

    return { success: true, mode: "proposed" };
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Tách khoá thật từ mã node trên cây và chọn đúng cột khoá của bảng gốc. */
export function resolveEntityKey(
  kind: string,
  rawId: string,
  defaultKeyCol: string,
): { keyCol: string; keyValue: string } {
  if (kind === "tb") return { keyCol: defaultKeyCol, keyValue: rawId };

  let value = rawId;
  if (kind === "ht") {
    // Mã node hệ thống là "<MA_NHOM>|<id hệ thống>"
    value = parseHtSysMa(rawId).sysName || rawId;
  }
  if (kind === "nh" || kind === "ht" || kind === "pl") {
    return { keyCol: UUID_RE.test(value) ? "id" : "ma", keyValue: value };
  }
  return { keyCol: defaultKeyCol, keyValue: value };
}


/** @deprecated Dùng saveEntityFieldSecurely */
export const saveCellSecurely = (args: any) =>
  saveEntityFieldSecurely({
    kind: "tb",
    id: args.maThietBi,
    field: args.field,
    value: args.value,
    userRoles: args.userRoles,
  });
