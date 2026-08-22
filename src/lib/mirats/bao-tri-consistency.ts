/**
 * Kiểm tra nhất quán giữa Phiếu công việc bảo dưỡng (cong_viec_bao_tri)
 * và Biên bản bảo dưỡng (bao_tri).
 *
 * Hai loại orphan:
 *  - phieuThieuBienBan: phiếu ở trạng thái HOAN_THANH nhưng không có biên bản nào tham chiếu.
 *  - bienBanKhongThuocPhieu: biên bản có cong_viec_id = null (không thuộc phiếu công việc nào).
 */

export interface PhieuInput {
  id: string;
  trang_thai: string;
  thiet_bi_id: string;
}

export interface BienBanInput {
  id: string;
  cong_viec_id: string | null;
  thiet_bi_id: string;
}

export interface OrphanResult {
  phieuThieuBienBan: string[];
  bienBanKhongThuocPhieu: string[];
}

export function findOrphans(phieu: PhieuInput[], bienBan: BienBanInput[]): OrphanResult {
  const referencedPhieuIds = new Set<string>();
  const bienBanKhongThuocPhieu: string[] = [];

  for (const bb of bienBan) {
    if (bb.cong_viec_id == null || bb.cong_viec_id === "") {
      bienBanKhongThuocPhieu.push(bb.id);
    } else {
      referencedPhieuIds.add(bb.cong_viec_id);
    }
  }

  const phieuThieuBienBan: string[] = [];
  for (const p of phieu) {
    if (p.trang_thai === "HOAN_THANH" && !referencedPhieuIds.has(p.id)) {
      phieuThieuBienBan.push(p.id);
    }
  }

  return { phieuThieuBienBan, bienBanKhongThuocPhieu };
}
