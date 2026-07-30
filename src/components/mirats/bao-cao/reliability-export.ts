// ============================================================================
// Xuất báo cáo độ tin cậy: CSV / Excel / PDF. Tách khỏi route để phần nặng
// (xlsx, jspdf, html2canvas) chỉ nạp khi người dùng bấm xuất.
// ============================================================================
import { toast } from "sonner";
import type { Bucket, ReliabilityRow } from "./reliability-core";

export type ExportContext = {
  from: string;
  to: string;
  bucket: Bucket;
  rows: ReliabilityRow[];
  totals: { totalIncidents: number; totalClosed: number; weightedMttr: number };
  trendData: Array<{ label: string; bucket_start: string; so_su_co: number; so_dong: number; mttr_gio: number | null }>;
  heatmapGrid: number[][];
  severity: Array<{ muc_do: string; so_su_co: number; so_dong: number }>;
  paretoData: Array<{ fullName: string; so_su_co: number; cum_pct: number }>;
  paretoVital: number;
  topMttr: ReliabilityRow[];
};

export function exportReliabilityCsv({ from, to, rows }: ExportContext) {
  if (!rows.length) {
    toast.info("Không có dữ liệu để xuất");
    return;
  }
  const header = ["Mã HT", "Tên hệ thống", "Số sự cố", "Đã đóng", "MTTR (phút)", "MTBF (giờ)"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        JSON.stringify(r.ma ?? ""),
        JSON.stringify(r.ten ?? ""),
        r.so_su_co,
        r.so_dong,
        r.mttr_phut ?? "",
        r.mtbf_gio ?? "",
      ].join(","),
    ),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `do-tin-cay_${from}_${to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportReliabilityExcel(ctx: ExportContext) {
  const { from, to, bucket, rows, totals, trendData, heatmapGrid, severity, paretoData, paretoVital, topMttr } = ctx;
  if (!rows.length) {
    toast.info("Không có dữ liệu để xuất");
    return;
  }
  try {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const add = (name: string, aoa: unknown[][]) =>
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);

    add("Tổng quan", [
      ["Báo cáo độ tin cậy hệ thống"],
      ["Từ ngày", from],
      ["Đến ngày", to],
      ["Bucket", bucket],
      ["Xuất lúc", new Date().toLocaleString("vi-VN")],
      [],
      ["Tổng sự cố", totals.totalIncidents],
      ["Đã đóng", totals.totalClosed],
      ["MTTR bình quân (phút)", Number.isFinite(totals.weightedMttr) ? Number(totals.weightedMttr.toFixed(2)) : 0],
      ["Số hệ thống", rows.length],
      ["Pareto: hệ thống trọng yếu (~80%)", `${paretoVital}/${paretoData.length}`],
    ]);

    add("Theo hệ thống", [
      ["Mã HT", "Tên hệ thống", "Số sự cố", "Đã đóng", "MTTR (phút)", "MTBF (giờ)"],
      ...rows.map((r) => [r.ma ?? "", r.ten ?? "", r.so_su_co, r.so_dong, r.mttr_phut ?? "", r.mtbf_gio ?? ""]),
    ]);

    add("Xu hướng", [
      ["Mốc", "Bắt đầu", "Số sự cố", "Đã đóng", "MTTR (giờ)"],
      ...trendData.map((r) => [r.label, r.bucket_start, r.so_su_co, r.so_dong, r.mttr_gio ?? ""]),
    ]);

    const dowNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    add("Heatmap giờ×thứ", [
      ["Thứ \\ Giờ", ...Array.from({ length: 24 }, (_, h) => `${h}h`)],
      ...heatmapGrid.map((row, dow) => [dowNames[dow], ...row]),
    ]);

    add("Mức độ", [
      ["Mức độ", "Số sự cố", "Đã đóng"],
      ...severity.map((r) => [r.muc_do, r.so_su_co, r.so_dong]),
    ]);

    add("Pareto", [
      ["Hệ thống", "Số sự cố", "Luỹ kế %"],
      ...paretoData.map((r) => [r.fullName, r.so_su_co, r.cum_pct]),
    ]);

    add("Top MTTR", [
      ["Mã HT", "Tên hệ thống", "Đã đóng", "MTTR (phút)"],
      ...topMttr.map((r) => [r.ma ?? "", r.ten ?? "", r.so_dong, r.mttr_phut ?? ""]),
    ]);

    XLSX.writeFile(wb, `do-tin-cay_${from}_${to}.xlsx`);
    toast.success("Đã xuất Excel");
  } catch (e) {
    console.error(e);
    toast.error("Không xuất được Excel");
  }
}

export async function exportReliabilityPdf({ from, to, bucket, rows }: ExportContext) {
  if (!rows.length) {
    toast.info("Không có dữ liệu để xuất");
    return;
  }
  const root = document.querySelector<HTMLElement>("[data-print-root]");
  if (!root) {
    toast.error("Không tìm thấy vùng in");
    return;
  }
  const tId = toast.loading("Đang tạo PDF…");
  try {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    root.classList.add("pdf-exporting");
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      windowWidth: root.scrollWidth,
    });
    root.classList.remove("pdf-exporting");

    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 24;
    const imgW = pageW - margin * 2;
    const imgH = (canvas.height * imgW) / canvas.width;

    pdf.setFontSize(14);
    pdf.text("Bao cao do tin cay he thong", margin, margin);
    pdf.setFontSize(10);
    pdf.text(
      `Tu ${from} den ${to}  |  Bucket: ${bucket}  |  Xuat: ${new Date().toLocaleString("vi-VN")}`,
      margin,
      margin + 14,
    );

    const topOffset = margin + 24;
    const availH = pageH - topOffset - margin;

    if (imgH <= availH) {
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", margin, topOffset, imgW, imgH);
    } else {
      const pageCanvasH = Math.floor((availH * canvas.width) / imgW);
      let yOffset = 0;
      let first = true;
      while (yOffset < canvas.height) {
        const sliceH = Math.min(pageCanvasH, canvas.height - yOffset);
        const tmp = document.createElement("canvas");
        tmp.width = canvas.width;
        tmp.height = sliceH;
        const ctx = tmp.getContext("2d");
        if (!ctx) break;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, tmp.width, tmp.height);
        ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        if (!first) pdf.addPage();
        const sliceImgH = (sliceH * imgW) / canvas.width;
        pdf.addImage(tmp.toDataURL("image/jpeg", 0.9), "JPEG", margin, first ? topOffset : margin, imgW, sliceImgH);
        first = false;
        yOffset += sliceH;
      }
    }

    pdf.save(`do-tin-cay_${from}_${to}.pdf`);
    toast.success("Đã xuất PDF", { id: tId });
  } catch (e) {
    console.error(e);
    toast.error("Không xuất được PDF", { id: tId });
  }
}