// ============================================================================
// pdf-render.server.ts — Server-only: dựng PDF từ 1 submission bằng pdf-lib.
//
// v2: nhúng font Noto Sans (Unicode) qua @pdf-lib/fontkit → hiển thị đúng
// tiếng Việt có dấu (không chuẩn hoá ASCII nữa). Font được cache ở module
// scope để tránh fetch lại giữa các request.
//
// Ngoài ra render đầy đủ:
//  - Meta: đơn vị, kỳ, trạng thái, thời điểm nộp.
//  - Nội dung field, hỗ trợ section_repeat (lặp block trường con).
//  - Panel chữ ký + hash + link verify.
// ============================================================================
import { PDFDocument, rgb, PageSizes, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import notoRegular from "@/assets/fonts/NotoSans-Regular.ttf.asset.json";
import notoBold from "@/assets/fonts/NotoSans-Bold.ttf.asset.json";
import type { CompiledField } from "@/lib/mirats/form-schema";
import { shortHash } from "@/lib/mirats/sig-canonical";

function fmt(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) {
    if (v.length === 0) return "—";
    // section_repeat được xử lý ở nhánh riêng; ở đây chỉ format array giá trị đơn.
    return v
      .map((x) => (typeof x === "object" && x != null ? JSON.stringify(x) : String(x)))
      .join(", ");
  }
  if (typeof v === "boolean") return v ? "Có" : "Không";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export type PdfSignatureRow = {
  signer_name: string | null;
  signer_role: string;
  signed_at: string;
  content_hash: string;
  key_id: string;
};

export type PdfInput = {
  submission: {
    id: string;
    template_code: string;
    template_name: string;
    tieu_de: string | null;
    ky_bao_cao: string | null;
    don_vi_ten: string | null;
    status: string;
    submitted_at: string | null;
    signed_at: string | null;
    content_hash: string | null;
    data: Record<string, unknown>;
  };
  fields: CompiledField[];
  signatures: PdfSignatureRow[];
  verifyBaseUrl: string; // ví dụ: "https://vatm.app/verify"
};

// ---------- Font loader (fetch + cache) --------------------------------------

let cachedFonts: { regular: ArrayBuffer; bold: ArrayBuffer } | null = null;

function assetAbsoluteUrl(relative: string): string {
  const base = process.env.APP_PUBLIC_URL || "https://vatm.app";
  return base.replace(/\/$/, "") + relative;
}

async function loadFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  if (cachedFonts) return cachedFonts;
  const [r, b] = await Promise.all([
    fetch(assetAbsoluteUrl(notoRegular.url)),
    fetch(assetAbsoluteUrl(notoBold.url)),
  ]);
  if (!r.ok || !b.ok) {
    throw new Error(`Không tải được font Noto (HTTP ${r.status}/${b.status}).`);
  }
  cachedFonts = { regular: await r.arrayBuffer(), bold: await b.arrayBuffer() };
  return cachedFonts;
}

// ---------- Main renderer ----------------------------------------------------

export async function renderSubmissionPdf(input: PdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const fonts = await loadFonts();
  const font = await doc.embedFont(fonts.regular, { subset: true });
  const bold = await doc.embedFont(fonts.bold, { subset: true });

  const pageW = PageSizes.A4[0];
  const pageH = PageSizes.A4[1];
  const margin = 40;
  let page = doc.addPage([pageW, pageH]);
  let y = pageH - margin;

  const drawText = (
    text: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number } = {},
  ) => {
    const size = opts.size ?? 10;
    const f: PDFFont = opts.bold ? bold : font;
    const color = opts.color ?? [0.1, 0.1, 0.15];
    const indent = opts.indent ?? 0;
    const maxWidth = pageW - margin * 2 - indent;

    // Wrap theo width thực dựa vào metrics của TTF đã embed.
    const paragraphs = String(text ?? "").split("\n");
    const lines: string[] = [];
    for (const para of paragraphs) {
      const words = para.split(/\s+/);
      let line = "";
      for (const w of words) {
        const test = line ? line + " " + w : w;
        const width = f.widthOfTextAtSize(test, size);
        if (width > maxWidth && line) {
          lines.push(line);
          line = w;
        } else line = test;
      }
      if (line) lines.push(line);
      if (para === "") lines.push("");
    }
    for (const ln of lines) {
      if (y < margin + size + 2) {
        page = doc.addPage([pageW, pageH]);
        y = pageH - margin;
      }
      page.drawText(ln, {
        x: margin + indent,
        y: y - size,
        size,
        font: f,
        color: rgb(color[0], color[1], color[2]),
      });
      y -= size + 4;
    }
  };

  const hr = () => {
    if (y < margin + 8) {
      page = doc.addPage([pageW, pageH]);
      y = pageH - margin;
    }
    page.drawLine({
      start: { x: margin, y: y - 4 },
      end: { x: pageW - margin, y: y - 4 },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.75),
    });
    y -= 10;
  };

  // ---- Header ----
  drawText("BIÊN BẢN — MIRATS / VATM", { size: 8, color: [0.4, 0.4, 0.45] });
  drawText(input.submission.tieu_de || input.submission.template_name, { size: 14, bold: true });
  drawText(
    `Mã mẫu: ${input.submission.template_code}   |   Mã biên bản: ${input.submission.id.slice(0, 8)}`,
    { size: 9, color: [0.4, 0.4, 0.45] },
  );
  y -= 6;

  // ---- Meta ----
  const meta: Array<[string, string]> = [
    ["Đơn vị", input.submission.don_vi_ten || "—"],
    ["Kỳ báo cáo", input.submission.ky_bao_cao || "—"],
    ["Trạng thái", input.submission.status],
    [
      "Nộp lúc",
      input.submission.submitted_at
        ? new Date(input.submission.submitted_at).toLocaleString("vi-VN")
        : "—",
    ],
  ];
  for (const [k, v] of meta) drawText(`${k}: ${v}`, { size: 10 });
  hr();

  // ---- Nội dung field ----
  drawText("NỘI DUNG", { size: 11, bold: true });
  y -= 2;
  const dataObj = input.submission.data ?? {};

  for (const f of input.fields) {
    if (f.kind === "heading") {
      drawText(f.label, { size: 11, bold: true });
      continue;
    }
    if (f.kind === "divider") {
      hr();
      continue;
    }
    if (f.kind === "note") {
      drawText(f.help_text ?? f.label, { size: 9, color: [0.45, 0.45, 0.5] });
      continue;
    }

    const v = dataObj[f.key];
    const label = f.label + (f.unit ? ` (${f.unit})` : "");

    // Section repeat: lặp block trường con.
    if (f.kind === "section_repeat") {
      drawText(`${label}:`, { size: 10, bold: true });
      const cols = f.columns ?? [];
      const rows = Array.isArray(v) ? (v as Array<Record<string, unknown>>) : [];
      if (rows.length === 0) {
        drawText("(không có mục)", { size: 9, indent: 12, color: [0.5, 0.5, 0.55] });
      } else {
        rows.forEach((row, i) => {
          drawText(`Mục #${i + 1}`, { size: 9, bold: true, indent: 8 });
          for (const c of cols) {
            const cl = c.label + (c.unit ? ` (${c.unit})` : "");
            drawText(`• ${cl}: ${fmt(row?.[c.key])}`, { size: 9, indent: 16 });
          }
          y -= 2;
        });
      }
      continue;
    }

    // Bảng lặp dòng đơn giản.
    if (f.kind === "table" && Array.isArray(v)) {
      drawText(`${label}:`, { size: 10, bold: true });
      const cols = f.columns ?? [];
      const rows = v as Array<Record<string, string>>;
      if (rows.length === 0) {
        drawText("(chưa có dòng)", { size: 9, indent: 12, color: [0.5, 0.5, 0.55] });
      } else {
        rows.forEach((row, i) => {
          const line = cols.map((c) => `${c.label}=${fmt(row?.[c.key])}`).join(" | ");
          drawText(`#${i + 1}  ${line}`, { size: 9, indent: 12 });
        });
      }
      continue;
    }

    drawText(`${label}:`, { size: 10, bold: true });
    drawText(fmt(v), { size: 10, indent: 12 });
  }

  // ---- Panel chữ ký ----
  y -= 8;
  hr();
  drawText("CHỮ KÝ SỐ (Ed25519)", { size: 11, bold: true });
  if (input.submission.content_hash) {
    drawText(`Hash nội dung: ${input.submission.content_hash}`, {
      size: 8,
      color: [0.35, 0.35, 0.4],
    });
  }
  y -= 4;
  if (input.signatures.length === 0) {
    drawText("(Chưa có chữ ký số)", { size: 10, color: [0.5, 0.5, 0.55] });
  } else {
    for (const s of input.signatures) {
      drawText(`— ${s.signer_name || "(không rõ)"} · ${s.signer_role}`, { size: 10, bold: true });
      drawText(`  Ký lúc: ${new Date(s.signed_at).toLocaleString("vi-VN")}`, { size: 9 });
      drawText(`  Hash: ${shortHash(s.content_hash)}   Key: ${s.key_id.slice(0, 8)}`, {
        size: 8,
        color: [0.4, 0.4, 0.45],
      });
    }
  }
  y -= 6;
  drawText(`Xác thực tại: ${input.verifyBaseUrl}/${input.submission.id}`, {
    size: 9,
    color: [0.11, 0.32, 0.88],
  });

  // ---- Footer ----
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawText(
      `Trang ${i + 1}/${pages.length} · VATM MIRATS · ${new Date().toLocaleString("vi-VN")}`,
      {
        x: margin,
        y: 16,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.55),
      },
    );
  });

  return await doc.save();
}
