// ============================================================================
// Master-data (một nguồn sự thật): FK *_id là chuẩn, cột text chỉ là snapshot
// hiển thị. Module thuần — không phụ thuộc mạng/DB — để test dễ và tái dùng
// ở form Edit tài sản, import CSV, AI parser.
// ============================================================================

/** Chuẩn hoá tên để so khớp: trim + hạ dấu + gộp khoảng trắng thành 1 space. */
export function chuanHoaTen(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type DanhMucItem = { id: string; ten: string };

export interface ThietBiRefRow {
  nha_san_xuat?: string | null;
  nha_san_xuat_id?: string | null;
  nha_cung_cap?: string | null;
  nha_cung_cap_id?: string | null;
  model?: string | null;
  model_id?: string | null;
  phan_loai?: string | null;
  phan_loai_id?: string | null;
  vi_tri?: string | null;
  vi_tri_id?: string | null;
}

export interface DanhMucBundle {
  nsx: DanhMucItem[];
  ncc: DanhMucItem[];
  model: DanhMucItem[];
  /** Alias theo task spec — trỏ vào phan_loai. */
  loai?: DanhMucItem[];
  phan_loai?: DanhMucItem[];
  vi_tri?: DanhMucItem[];
}

export interface ResolveRefsResult {
  /** Gợi ý FK điền vào khi text có mà FK thiếu (hoặc FK không khớp text). */
  goiY: Record<string, string | null>;
  /** true nếu có bất kỳ trường nào lệch giữa text và FK hiện tại. */
  lech: boolean;
}

type Pair = {
  key: string; // tên cột FK output
  text: string | null | undefined;
  id: string | null | undefined;
  items: DanhMucItem[] | undefined;
};

/**
 * Đối chiếu các cặp (text, *_id) của một dòng tài sản với danh mục.
 * - Có text nhưng thiếu FK và match duy nhất theo tên chuẩn hoá → gợi ý FK.
 * - Text hiện có nhưng KHÔNG khớp tên FK hiện tại → đánh dấu lệch.
 * - Không tự merge khi có nhiều ứng viên trùng tên (bỏ qua, không gợi ý).
 */
export function resolveThietBiRefs(
  row: ThietBiRefRow,
  danhMuc: DanhMucBundle,
): ResolveRefsResult {
  const pl = danhMuc.phan_loai ?? danhMuc.loai ?? [];
  const pairs: Pair[] = [
    { key: "nha_san_xuat_id", text: row.nha_san_xuat, id: row.nha_san_xuat_id, items: danhMuc.nsx },
    { key: "nha_cung_cap_id", text: row.nha_cung_cap, id: row.nha_cung_cap_id, items: danhMuc.ncc },
    { key: "model_id", text: row.model, id: row.model_id, items: danhMuc.model },
    { key: "phan_loai_id", text: row.phan_loai, id: row.phan_loai_id, items: pl },
    { key: "vi_tri_id", text: row.vi_tri, id: row.vi_tri_id, items: danhMuc.vi_tri },
  ];

  const goiY: Record<string, string | null> = {};
  let lech = false;

  for (const p of pairs) {
    if (!p.items) continue;
    const textN = chuanHoaTen(String(p.text ?? ""));
    const cur = p.id ? p.items.find((i) => i.id === p.id) ?? null : null;

    // FK hiện tại: kiểm lệch với text.
    if (p.id && textN && cur && chuanHoaTen(cur.ten) !== textN) {
      lech = true;
    }

    // Có text nhưng thiếu FK → tìm gợi ý duy nhất.
    if (!p.id && textN) {
      const matches = p.items.filter((i) => chuanHoaTen(i.ten) === textN);
      if (matches.length === 1) {
        goiY[p.key] = matches[0].id;
        lech = true;
      } else {
        // 0 hoặc nhiều: không tự gán, đánh dấu lệch để review.
        lech = true;
      }
    }
  }

  return { goiY, lech };
}
