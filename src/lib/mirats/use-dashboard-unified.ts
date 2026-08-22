import { useMemo } from "react";
import { useScope } from "@/lib/mirats/scope";
import { availability, mttr, mtbf } from "@/lib/mirats/reliability";
import { healthDetail } from "@/lib/mirats/metrics";
import { usePmOnTimeKpi } from "@/lib/mirats/bao-tri-kpi";

/**
 * useUnifiedDashboardStats - Hook trung tâm gom toàn bộ logic tính toán KPI
 * giúp đồng bộ số liệu giữa Dashboard (index) và Báo cáo (tong-quan).
 */
export function useUnifiedDashboardStats() {
  const scope = useScope();
  const pmKpi = usePmOnTimeKpi();

  const stats = useMemo(() => {
    const devices = scope.thietBi;
    const incidents = scope.suCo;

    // 1. Độ tin cậy (Reliability)
    // Cửa sổ 30 ngày = 720 giờ
    const reliabilityAvail = availability({
      assetCount: devices.length,
      windowHours: 720,
      incidents,
    });

    const mttrKpi = mttr(incidents);
    const mtbfKpi = mtbf(incidents);

    // 2. Phân bố sức khỏe (Health Distribution)
    const healthStats = { A: 0, B: 0, C: 0, D: 0, total: 0 };
    devices.forEach((d) => {
      const h = healthDetail(d);
      healthStats[h.xepLoai]++;
      healthStats.total++;
    });

    // 3. Phân loại tài sản (Asset Type)
    const assetTypeStats: Record<string, number> = {};
    devices.forEach((d) => {
      const type = (d as any)._loaiTbTen || d.loai || "Khác";
      assetTypeStats[type] = (assetTypeStats[type] || 0) + 1;
    });

    // 4. Danh sách thiết bị sức khỏe thấp (C/D)
    const lowHealthDevices = devices
      .map((d) => ({ device: d, health: healthDetail(d) }))
      .filter((item) => item.health.xepLoai === "C" || item.health.xepLoai === "D")
      .sort((a, b) => a.health.score - b.health.score)
      .slice(0, 5);

    return {
      reliabilityAvail,
      mttrKpi,
      mtbfKpi,
      healthStats,
      lowHealthDevices,
      assetTypeStats,
      pmKpi,
      scope,
      assetCount: devices.length,
    };
  }, [scope, pmKpi]);

  return stats;
}
