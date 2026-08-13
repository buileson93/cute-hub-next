import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AppRole } from "@/hooks/use-session";
import { useOperationsData } from "@/lib/mirats/db-operations";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { useLicensesData, type LicenseRow } from "@/lib/mirats/db-licenses";
import type {
  ThietBi, GiayPhep, SuCo, BaoTri, HongHocThayThe, BanGiao,
  SuKienThietBi, HeThong, ViTri, DonVi,
} from "@/lib/mirats/types";

/**
 * Phạm vi dữ liệu theo đơn vị.
 * - Tài khoản admin / phòng kỹ thuật: xem toàn hệ thống.
 * - Tài khoản khác: chỉ thấy dữ liệu thuộc đơn vị của mình (theo mã đơn vị trên hồ sơ).
 *
 * TẤT CẢ dữ liệu (tài sản, giấy phép, đơn vị, hệ thống, vị trí, vận hành) được
 * đọc THẬT từ CSDL — không còn dùng dữ liệu mẫu tĩnh.
 */

const SUPER_ROLES: AppRole[] = ["admin", "phong_kt"];

export interface ScopeData {
  /** true khi đang tải dữ liệu thật từ CSDL. */
  loading: boolean;
  scopeAll: boolean;
  donViCode: string | null;
  thietBi: ThietBi[];
  giayPhep: GiayPhep[];
  suCo: SuCo[];
  baoTri: BaoTri[];
  hongHoc: HongHocThayThe[];
  banGiao: BanGiao[];
  suKien: SuKienThietBi[];
  heThong: HeThong[];
  nhomHeThong: NhomHeThong[];
  viTri: ViTri[];
  donVi: DonVi[];
  /** true nếu bản ghi thuộc phạm vi của người dùng hiện tại (dùng cho trang chi tiết). */
  inScope: (donViMa: string | null | undefined) => boolean;
}

const ScopeContext = createContext<ScopeData | null>(null);

export function ScopeProvider({
  roles,
  donViCode,
  children,
}: {
  roles: AppRole[];
  donViCode: string | null;
  children: ReactNode;
}) {
  const scopeAll = roles.some((r) => SUPER_ROLES.includes(r));

  // Toàn bộ dữ liệu THẬT từ CSDL.
  const { data: tax, isLoading: taxLoading } = useDbTaxonomy();
  const { licenses, isLoading: licLoading } = useLicensesData();
  const { ops, isLoading: opsLoading } = useOperationsData();

  const value = useMemo<ScopeData>(() => {
    const inScope = (ma: string | null | undefined) =>
      scopeAll || (!!donViCode && ma === donViCode);

    const dvMaById = new Map((tax?.donViList ?? []).map((d) => [d.id, d.ma]));

    const allThietBi = (tax?.devices ?? []) as ThietBi[];
    const allDonVi: DonVi[] = (tax?.donViList ?? []).map((d) => ({
      ma: d.ma, ten: d.ten, loai: "", don_vi_cha: null, ma_icao: null,
    }));
    const allHeThong: HeThong[] = (tax?.htList ?? []).map((h) => ({
      ma: h.ma, ten: h.ten, nhom: "",
      don_vi: dvMaById.get(h.donViId) ?? "", trang_thai: "", nam_dua_vao: 0,
    }));
    const allNhomHeThong: NhomHeThong[] = (tax?.nhomHtList ?? []).map((n) => ({
      ma: n.ma, ten: n.ten, linh_vuc: "",
    }));
    const allViTri: ViTri[] = (tax?.viTriList ?? []).map((v) => ({
      ma: v.ma, ten: v.ten, don_vi: "", loai_vi_tri: "",
    }));
    const allGiayPhep = licenses as GiayPhep[];

    const loading = taxLoading || licLoading || opsLoading;

    if (scopeAll) {
      return {
        loading,
        scopeAll: true,
        donViCode,
        thietBi: allThietBi,
        giayPhep: allGiayPhep,
        suCo: ops.suCo,
        baoTri: ops.baoTri,
        hongHoc: ops.hongHoc,
        banGiao: ops.banGiao,
        suKien: [],
        heThong: allHeThong,
        nhomHeThong: allNhomHeThong,
        viTri: allViTri,
        donVi: allDonVi,
        inScope,
      };
    }

    const u = donViCode;
    const unitTen = allDonVi.find((d) => d.ma === u)?.ten ?? "";
    const thietBi = allThietBi.filter((t) => !!u && t.don_vi === u);
    const deviceSet = new Set(thietBi.map((t) => t.ma_thiet_bi));
    const matchUnitLicense = (g: LicenseRow) => {
      // Strict code match aligns license scope with asset scope (BUG-B-DASHBOARD).
      // Chỉ dùng match theo tên đơn vị làm dự phòng khi hàng dữ liệu chưa có mã đơn vị.
      if (g.donViReal) return g.donViReal === u;
      return !!unitTen && !!g.donViTen && g.donViTen.includes(unitTen);
    };

    return {
      loading,
      scopeAll: false,
      donViCode,
      thietBi,
      giayPhep: allGiayPhep.filter((g) => matchUnitLicense(g as LicenseRow)),
      suCo: ops.suCo.filter((s) => !!u && s.don_vi === u),
      baoTri: ops.baoTri.filter((b) => !!u && b.don_vi === u),
      hongHoc: ops.hongHoc.filter((h) => deviceSet.has(h.thiet_bi_hong) || (!!u && h.don_vi_thuc_hien === u)),
      banGiao: ops.banGiao.filter((b) => deviceSet.has(b.thiet_bi) || (!!u && b.don_vi_nhan === u)),
      suKien: [],
      heThong: allHeThong.filter((h) => !!u && h.don_vi === u),
      nhomHeThong: allNhomHeThong,
      viTri: allViTri,
      donVi: allDonVi.filter((d) => !!u && d.ma === u),
      inScope,
    };
  }, [scopeAll, donViCode, tax, licenses, ops, taxLoading, licLoading, opsLoading]);

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope(): ScopeData {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error("useScope phải được dùng bên trong <ScopeProvider>");
  return ctx;
}
