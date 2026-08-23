import React, { useMemo, useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { StandardTable } from "./StandardTable";
import { THANH_PHAN_PRESETS } from "@/lib/mirats/ui/tp-presets";
import { ThanhPhanRow } from "./ThanhPhanTable";
import type { KeysetCursor } from "@/lib/mirats/db/keyset";

interface ComponentTablePanelProps {
  q: string;
  tableKey: string;
  editMode: boolean;
  allowEdit: boolean;
  bulkBusy: boolean;
  bulkTrangThai: (ids: string[], tt: string, clear: () => void) => void;
  copyCodes: (codes: string[]) => void;
  setSelectedTp: (ctx: { row: ThanhPhanRow; heThongId: string } | null) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  hideHeader?: boolean;
}

export const ComponentTablePanel = React.memo(({
  q,
  tableKey,
  editMode,
  allowEdit,
  bulkBusy,
  bulkTrangThai,
  copyCodes,
  setSelectedTp,
  selectedIds,
  setSelectedIds,
  hideHeader,
}: ComponentTablePanelProps) => {
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["thanh-phan-infinite", q],
    staleTime: 60_000,
    initialPageParam: null as KeysetCursor | null,
    queryFn: async ({ pageParam, signal }) => {
      const { fetchKeyset } = await import("@/lib/mirats/db/keyset-supabase");
      return fetchKeyset<ThanhPhanRow>(supabase, {
        bang: "v_thanh_phan_toan_cuc",
        cot: [
          "id", "ma", "ten", "nhomHeThong", "phanLoai", "heThong", "heThongId",
          "viTriId", "loaiYeuCau", "viTri", "trangThai", "thietBiMa", "thietBiTen",
          "thietBiSerial", "model", "modelId", "chungLoai", "nhaSanXuat",
          "nhaCungCap", "daLap", "soThanhPhanCuaTaiSan", "taiSanTrangThai",
          "namSanXuat", "namKhaiThac", "ngayMua", "hanBaoHanh", "pN",
          "maTaiSanBravo", "tyLeTuoiTho", "tinhTrangKyThuat", "ngayBaoTriGanNhat",
          "ngayBaoTriKeTiep", "cheDoKdHc", "taiSanViTri", "taiSanDonViQuanLy", "anomalyScore"
        ],
        sortField: "ten",
        dir: "asc",
        cursor: pageParam,
        kichThuoc: 100,
        signal,
        filters: (query) => {
          if (q) {
            return query.or(`ma.ilike.%${q}%,ten.ilike.%${q}%,thietBiMa.ilike.%${q}%,thietBiSerial.ilike.%${q}%`);
          }
          return query;
        }
      });
    },
    getNextPageParam: (lastPage) => (lastPage.ket ? undefined : lastPage.cursor),
  });

  const rows = useMemo(() => data?.pages.flatMap((p) => p.rows) ?? [], [data]);
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  return (
    <StandardTable<ThanhPhanRow>
      className="astryx-table"
      tableKey={tableKey}
      rows={rows}
      trangThai={{ dangTai: isLoading, loi: error }}
      infiniteScroll={{
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
        totalCount,
      }}
      getRowId={(r) => r.id}
      selected={selectedIds}
      setSelected={setSelectedIds}
      requireFilterToShow={false}
      emptyText="Không có thành phần hệ thống phù hợp."
      countUnit="thành phần"
      maxHeightClass={hideHeader ? "min-h-0 flex-1" : undefined}
      selectable
      editMode={editMode}
      presets={THANH_PHAN_PRESETS}
      onRowClick={(r) => setSelectedTp({ row: r, heThongId: r.heThongId })}
      // ... (Rest of bulkActions logic would be passed or kept consistent)
    />
  );
});
