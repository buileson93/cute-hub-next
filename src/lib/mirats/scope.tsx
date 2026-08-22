import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AppRole } from "@/hooks/use-session";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import type {
  ThietBi,
  GiayPhep,
  SuCo,
  BaoTri,
  HongHocThayThe,
  BanGiao,
  SuKienThietBi,
  HeThong,
  ViTri,
  DonVi,
  NhomHeThong,
} from "@/lib/mirats/types";

/**
 * Phạm vi dữ liệu theo đơn vị.
 * - Tài khoản admin / phòng kỹ thuật: xem toàn hệ thống.
 * - Tài khoản khác: chỉ thấy dữ liệu thuộc đơn vị của mình (theo mã đơn vị trên hồ sơ).
 *
 * TỐI ƯU 10H: Loại bỏ nạp toàn bộ Devices/Operations tại root.
 * Các component cần dữ liệu lớn phải dùng route-level paged queries.
 */

const SUPER_ROLES: AppRole[] = ["admin", "phong_kt"];

export interface ScopeData {
  loading: boolean;
  scopeAll: boolean;
  donViCode: string | null;
  /** @deprecated Dùng useThietBiList cho dữ liệu lớn */
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

  // CHỈ nạp taxonomy cơ bản (Đơn vị, Hệ thống, Nhóm HT, Vị trí)
  const { data: tax, isLoading: taxLoading } = useDbTaxonomy();

  const value = useMemo<ScopeData>(() => {
    const inScope = (ma: string | null | undefined) =>
      scopeAll || (!!donViCode && ma === donViCode);

    const dvMaById = new Map((tax?.donViList ?? []).map((d) => [d.id, d.ma]));

    const allDonVi: DonVi[] = (tax?.donViList ?? []).map((d) => ({
      ma: d.ma,
      ten: d.ten,
      loai: "",
      don_vi_cha: null,
      ma_icao: null,
    }));
    const allHeThong: HeThong[] = (tax?.htList ?? []).map((h) => ({
      ma: h.ma,
      ten: h.ten,
      nhom: "",
      don_vi: dvMaById.get(h.donViId) ?? "",
      trang_thai: "",
      nam_dua_vao: 0,
    }));
    const allNhomHeThong: NhomHeThong[] = (tax?.nhomList ?? []).map((n) => ({
      ma: n.ma,
      ten: n.ten,
      linh_vuc: "",
    }));
    const allViTri: ViTri[] = (tax?.viTriList ?? []).map((v) => ({
      ma: v.ma,
      ten: v.ten,
      don_vi: "",
      loai_vi_tri: "",
    }));

    const loading = taxLoading;

    // Trả về mảng rỗng cho các tập dữ liệu lớn để tránh nạp vào bộ nhớ root
    return {
      loading,
      scopeAll,
      donViCode,
      thietBi: [],
      giayPhep: [],
      suCo: [],
      baoTri: [],
      hongHoc: [],
      banGiao: [],
      suKien: [],
      heThong: scopeAll ? allHeThong : allHeThong.filter((h) => !!donViCode && h.don_vi === donViCode),
      nhomHeThong: allNhomHeThong,
      viTri: allViTri,
      donVi: scopeAll ? allDonVi : allDonVi.filter((d) => !!donViCode && d.ma === donViCode),
      inScope,
    };
  }, [scopeAll, donViCode, tax, taxLoading]);

  return <ScopeContext.Provider value={value}>{children}</ScopeContext.Provider>;
}

export function useScope(): ScopeData {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error("useScope phải được dùng bên trong <ScopeProvider>");
  return ctx;
}
