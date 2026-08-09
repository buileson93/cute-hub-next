import { getThietBiDataOccupancy } from "./src/lib/mirats/analysis.functions";

async function runAnalysis() {
  try {
    const result = await getThietBiDataOccupancy();
    console.log("=== Tỷ lệ điền dữ liệu (Occupancy) ===");
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Analysis failed:", e);
  }
}

runAnalysis();
