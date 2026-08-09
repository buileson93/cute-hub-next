import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getThietBiDataOccupancy = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data: devices, error } = await supabaseAdmin
      .from("thiet_bi")
      .select("*");

    if (error) throw error;
    if (!devices || devices.length === 0) return {};

    const total = devices.length;
    const occupancy: Record<string, number> = {};

    const keys = Object.keys(devices[0]);
    keys.forEach((key) => {
      const filledCount = devices.filter(
        (d) => d[key] !== null && d[key] !== "" && d[key] !== undefined
      ).length;
      occupancy[key] = (filledCount / total) * 100;
    });

    return {
      total,
      occupancy: Object.entries(occupancy)
        .sort(([, a], [, b]) => b - a)
        .reduce((r, [k, v]) => ({ ...r, [k]: v }), {}),
    };
  });
