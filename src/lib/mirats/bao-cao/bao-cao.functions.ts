// ============================================================================
// bao-cao.functions.ts — Server function xuất báo cáo (Excel) yêu cầu đăng nhập.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import {
  buildBaoCaoLyLichThietBi,
  buildBaoCaoBaoDuongKy,
  buildBaoCaoSapHetHan,
} from "@/lib/mirats/bao-cao/build";
import { xuatBaoCaoExcel } from "@/lib/mirats/bao-cao/excel";
import type { LoaiBaoCao, NguonBaoCao } from "@/lib/mirats/bao-cao/types";
import { DEFAULT_NGAY_SAP_HET_HAN } from "@/lib/mirats/han-canh-bao";

type Input = {
  loai: LoaiBaoCao;
  thiet_bi_ma?: string;
  tu?: string;
  den?: string;
  nguong_ngay?: number;
  don_vi?: string;
};

function validate(input: unknown): Input {
  const i = (input ?? {}) as Record<string, unknown>;
  const loai = String(i.loai ?? "");
  if (!["ly_lich_thiet_bi", "bao_duong_ky", "sap_het_han"].includes(loai)) {
    throw new Error("Loại báo cáo không hợp lệ");
  }
  return {
    loai: loai as LoaiBaoCao,
    thiet_bi_ma: i.thiet_bi_ma ? String(i.thiet_bi_ma) : undefined,
    tu: i.tu ? String(i.tu) : undefined,
    den: i.den ? String(i.den) : undefined,
    nguong_ngay: typeof i.nguong_ngay === "number" ? i.nguong_ngay : undefined,
    don_vi: i.don_vi ? String(i.don_vi) : undefined,
  };
}

export const xuatBaoCao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const nguon: NguonBaoCao = {};

    if (data.loai === "ly_lich_thiet_bi") {
      if (!data.thiet_bi_ma) throw new Error("Thiếu mã tài sản");
      const { data: tb } = await supabase
        .from("thiet_bi")
        .select("id, ma_thiet_bi, ten_thiet_bi, nam_dua_vao_khai_thac, ngay_kiem_ke_ke_tiep")
        .eq("ma_thiet_bi", data.thiet_bi_ma)
        .maybeSingle() as { data: any };
      nguon.thiet_bi = tb
        ? [{
            id: tb.id,
            ma: tb.ma_thiet_bi,
            ten: tb.ten_thiet_bi ?? "",
            ngay_dua_vao: tb.nam_dua_vao_khai_thac ? String(tb.nam_dua_vao_khai_thac) : null,
            ngay_kiem_ke_ke_tiep: tb.ngay_kiem_ke_ke_tiep ?? null,
          }]
        : [];
      const tbId = tb?.id;
      if (tbId) {
        const { data: bt } = await supabase
          .from("bao_tri")
          .select("id, ngay_thuc_hien, ket_qua, trang_thai_duyet, nguoi_thuc_hien, ngay_ke_tiep")
          .eq("thiet_bi_id", tbId)
          .eq("luu_tru", false)
          .order("ngay_thuc_hien", { ascending: false });
        nguon.bao_tri = (bt ?? []).map((x: any) => ({
          id: x.id,
          thiet_bi_id: tbId,
          thiet_bi_ma: tb!.ma_thiet_bi,
          thiet_bi_ten: tb!.ten_thiet_bi,
          ngay_thuc_hien: x.ngay_thuc_hien,
          ket_qua: x.ket_qua,
          trang_thai_duyet: x.trang_thai_duyet,
          nguoi_thuc_hien: x.nguoi_thuc_hien,
          ngay_ke_tiep: x.ngay_ke_tiep,
        }));
        const { data: sc } = await supabase
          .from("su_co")
          .select("id, mo_ta, thoi_diem, mtr_phut, trang_thai")
          .eq("thiet_bi_id", tbId)
          .eq("luu_tru", false)
          .order("thoi_diem", { ascending: false });
        nguon.su_co = (sc ?? []).map((x: any) => ({ ...x, thiet_bi_id: tbId }));
      }
    }

    if (data.loai === "bao_duong_ky") {
      const tu = data.tu ?? new Date(Date.now() - 30 * 86400_000).toISOString();
      const den = data.den ?? new Date().toISOString();
      const { data: bt } = await supabase
        .from("bao_tri")
        .select("id, thiet_bi_id, ngay_thuc_hien, ket_qua, trang_thai_duyet, nguoi_thuc_hien, ngay_ke_tiep, thiet_bi:thiet_bi_id(ma_thiet_bi, ten_thiet_bi)")
        .gte("ngay_thuc_hien", tu)
        .lte("ngay_thuc_hien", den)
        .eq("luu_tru", false);
      nguon.bao_tri = (bt ?? []).map((x: any) => ({
        id: x.id,
        thiet_bi_id: x.thiet_bi_id,
        thiet_bi_ma: x.thiet_bi?.ma_thiet_bi ?? "",
        thiet_bi_ten: x.thiet_bi?.ten_thiet_bi ?? "",
        ngay_thuc_hien: x.ngay_thuc_hien,
        ket_qua: x.ket_qua,
        trang_thai_duyet: x.trang_thai_duyet,
        nguoi_thuc_hien: x.nguoi_thuc_hien,
        ngay_ke_tiep: x.ngay_ke_tiep,
      }));
    }

    if (data.loai === "sap_het_han") {
      const nguong = data.nguong_ngay ?? DEFAULT_NGAY_SAP_HET_HAN;
      const gioi_han = new Date(Date.now() + nguong * 86400_000).toISOString();
      const { data: gp } = await supabase
        .from("giay_phep_khai_thac")
        .select("id, so_gp, ten_gp, gp_han, he_thong_id, dm_he_thong:he_thong_id(ten)")
        .eq("luu_tru", false)
        .gte("gp_han", new Date().toISOString())
        .lte("gp_han", gioi_han);
      nguon.giay_phep = (gp ?? []).map((x: any) => ({
        id: x.id,
        so_gp: x.so_gp,
        ten_gp: x.ten_gp,
        han_gp: x.gp_han,
        he_thong: x.dm_he_thong?.ten ?? null,
      }));
      const { data: tb } = await supabase
        .from("thiet_bi")
        .select("id, ma_thiet_bi, ten_thiet_bi, ngay_kiem_ke_ke_tiep")
        .gte("ngay_kiem_ke_ke_tiep", new Date().toISOString())
        .lte("ngay_kiem_ke_ke_tiep", gioi_han);
      nguon.thiet_bi = (tb ?? []).map((x: any) => ({
        id: x.id,
        ma: x.ma_thiet_bi,
        ten: x.ten_thiet_bi ?? "",
        ngay_kiem_ke_ke_tiep: x.ngay_kiem_ke_ke_tiep,
      }));
    }

    let data_out;
    if (data.loai === "ly_lich_thiet_bi") data_out = buildBaoCaoLyLichThietBi(nguon, { thietBiMa: data.thiet_bi_ma });
    else if (data.loai === "bao_duong_ky") data_out = buildBaoCaoBaoDuongKy(nguon, { tu: data.tu ?? "", den: data.den ?? "", donVi: data.don_vi });
    else data_out = buildBaoCaoSapHetHan(nguon, { nguongNgay: data.nguong_ngay });

    const buf = xuatBaoCaoExcel(data_out);
    const fileName = `bao-cao-${data.loai}-${Date.now()}.xlsx`;
    return new Response(buf as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  });
