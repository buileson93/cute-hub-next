// ============================================================================
// Lịch sử GÁN / CHUYỂN / GỠ tài sản khỏi hệ thống.
//
// Mọi thao tác gán/chuyển/gỡ tài sản trong Danh mục › Tài sản đều đi qua RPC
// cay_submit_change (loai = "move_device") và được ghi vào bảng cay_thay_doi:
//   payload      — { device_ma, to_ht_id }  hoặc  { device_ma, detach: true }
//   snapshot_cu  — { thiet_bi: [{ he_thong_id, … }] }  (trạng thái TRƯỚC khi đổi)
//   nguoi_tao    — ai thực hiện           created_at — lúc nào
// Hook dưới đây đọc lại lịch sử đó, suy ra hành động (gán/chuyển/gỡ) và ghép
// tên người thực hiện để hiển thị "ai làm, lúc nào, trước/sau".
// ============================================================================
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MovementAction = "gan" | "chuyen" | "go";

export interface MovementEvent {
  id: string;
  deviceMa: string;
  action: MovementAction;
  fromHtId: string | null;
  toHtId: string | null;
  actorName: string;
  createdAt: string;
  moTa: string | null;
  daHoanTac: boolean;
  daApDung: boolean;
  trangThai: string;
}

type Sb = {
  from: (t: string) => {
    select: (c: string) => {
      eq: (col: string, val: unknown) => any;
      order: (c: string, o?: { ascending: boolean }) => any;
      limit: (n: number) => any;
      in: (col: string, vals: unknown[]) => any;
    };
  };
};

function firstSnapshotHt(snapshot: unknown): string | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const tb = (snapshot as { thiet_bi?: unknown }).thiet_bi;
  if (!Array.isArray(tb) || tb.length === 0) return null;
  const row = tb[0] as { he_thong_id?: string | null };
  return row?.he_thong_id || null;
}

/**
 * Lịch sử gán/chuyển/gỡ tài sản. Truyền `deviceMa` để lọc theo một tài sản,
 * bỏ trống để lấy toàn bộ (dùng cho hộp thoại lịch sử tổng ở Danh mục).
 */
export function useDeviceMovementHistory(deviceMa?: string | null) {
  return useQuery({
    queryKey: ["device_movement_history", deviceMa ?? "__all__"],
    queryFn: async (): Promise<MovementEvent[]> => {
      const sb = supabase as unknown as Sb;

      const { data, error } = await sb
        .from("cay_thay_doi")
        .select("id, payload, snapshot_cu, mo_ta, trang_thai, da_ap_dung, da_hoan_tac, nguoi_tao, created_at")
        .eq("loai", "move_device")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);

      const rows = (data ?? []) as Array<{
        id: string;
        payload: Record<string, unknown> | null;
        snapshot_cu: unknown;
        mo_ta: string | null;
        trang_thai: string;
        da_ap_dung: boolean;
        da_hoan_tac: boolean;
        nguoi_tao: string | null;
        created_at: string;
      }>;

      // Ghép tên người thực hiện.
      const actorIds = Array.from(
        new Set(rows.map((r) => r.nguoi_tao).filter((x): x is string => !!x)),
      );
      const actorMap = new Map<string, string>();
      if (actorIds.length > 0) {
        const { data: profs } = await sb
          .from("profiles")
          .select("id, ho_ten, email")
          .in("id", actorIds);
        for (const p of (profs ?? []) as Array<{ id: string; ho_ten: string | null; email: string }>) {
          actorMap.set(p.id, p.ho_ten?.trim() || p.email || "—");
        }
      }

      const events: MovementEvent[] = [];
      for (const r of rows) {
        const payload = r.payload ?? {};
        const dv = (payload.device_ma as string) || "";
        if (!dv) continue;
        if (deviceMa && dv !== deviceMa) continue;

        const detach = payload.detach === true;
        const fromHtId = firstSnapshotHt(r.snapshot_cu);
        const toHtId = detach ? null : ((payload.to_ht_id as string) || null);

        let action: MovementAction;
        if (detach || (!toHtId && fromHtId)) action = "go";
        else if (fromHtId) action = "chuyen";
        else action = "gan";

        events.push({
          id: r.id,
          deviceMa: dv,
          action,
          fromHtId,
          toHtId,
          actorName: r.nguoi_tao ? actorMap.get(r.nguoi_tao) ?? "—" : "—",
          createdAt: r.created_at,
          moTa: r.mo_ta,
          daHoanTac: r.da_hoan_tac === true,
          daApDung: r.da_ap_dung === true,
          trangThai: r.trang_thai,
        });
      }
      return events;
    },
  });
}
