// ============================================================================
// Pure helpers cho tiền xử lý text pdfjs — không phụ thuộc Vite/worker,
// tái sử dụng được ở Node (test script) lẫn browser (extractPdfText).
// ============================================================================

export interface RawPdfItem {
  str?: string;
  transform?: number[];
  height?: number;
  width?: number;
}

/** Watermark chéo/dọc: sin(góc) đủ lớn ở phần tử off-diagonal của ma trận. */
export function isWatermarkItem(it: RawPdfItem): boolean {
  const t = it.transform ?? [1, 0, 0, 1, 0, 0];
  return Math.abs(t[1]) > 0.15 || Math.abs(t[2]) > 0.15;
}

/**
 * Gộp text items pdfjs thành text nhiều dòng đã tiền xử lý:
 *  1) nhóm theo Y (làm tròn theo chiều cao dòng)
 *  2) trong dòng sắp theo X, dán fragment sát cạnh không có space
 *  3) nối các dòng liền kề bị ngắt vụn
 */
export function linesFromItems(items: RawPdfItem[]): string {
  const rows = new Map<number, Array<{ x: number; s: string }>>();
  for (const it of items) {
    const s = (it.str ?? "").trim();
    if (!s) continue;
    if (isWatermarkItem(it)) continue;
    const t = it.transform ?? [1, 0, 0, 1, 0, 0];
    const h = Math.max(4, Math.round(it.height ?? Math.abs(t[3]) ?? 10));
    const y = Math.round(t[5] / Math.max(h * 0.8, 4));
    const arr = rows.get(y) ?? [];
    arr.push({ x: t[4], s });
    rows.set(y, arr);
  }
  const ys = Array.from(rows.keys()).sort((a, b) => b - a);
  const lines: string[] = [];
  for (const y of ys) {
    const parts = (rows.get(y) ?? []).sort((a, b) => a.x - b.x).map((p) => p.s);
    const merged: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (i === 0) {
        merged.push(parts[i]);
        continue;
      }
      const prev = merged[merged.length - 1];
      const cur = parts[i];
      if (
        /[A-Za-zÀ-ỹ0-9)]$/.test(prev) &&
        /^[a-zà-ỹ0-9]/.test(cur) &&
        prev.length + cur.length < 80
      ) {
        merged[merged.length - 1] = prev + cur;
      } else {
        merged.push(cur);
      }
    }
    const line = merged.join(" ").replace(/\s+/g, " ").trim();
    if (line) lines.push(line);
  }
  const joined: string[] = [];
  for (const line of lines) {
    const prev = joined[joined.length - 1];
    const isHeading = /^\s*(?:\d{1,2}\.|Điều\s|CỘNG\s|CỤC\s|Nơi nhận|KT\.|Số\s*:|Căn\s)/i.test(
      line,
    );
    if (prev && !isHeading && !/[.!?:;)"”\d]\s*$/.test(prev) && /^[a-zà-ỹ(]/i.test(line)) {
      joined[joined.length - 1] = prev + " " + line;
    } else {
      joined.push(line);
    }
  }
  return joined.join("\n");
}

/**
 * Chuẩn hoá WGS-84 DMS → decimal, ghi kèm giá trị gốc cho AI/regex dễ khớp.
 * Ví dụ: `15°24'32"N` → `15°24'32"N (15.408889°)`.
 */
export function normalizeWgs84(text: string): string {
  if (!text) return text;
  const re =
    /(\d{1,3})\s*[°º]\s*(\d{1,2})\s*['\u2032]\s*(\d{1,2}(?:[.,]\d+)?)?\s*["\u2033]?\s*([NSEWnsew])\b/g;
  return text.replace(re, (_m, d: string, m: string, s: string | undefined, hemi: string) => {
    const dec =
      parseInt(d, 10) + parseInt(m, 10) / 60 + (s ? parseFloat(s.replace(",", ".")) : 0) / 3600;
    const sign = /[SWsw]/.test(hemi) ? -1 : 1;
    const H = hemi.toUpperCase();
    return `${d}°${m}'${s ?? "0"}"${H} (${(sign * dec).toFixed(6)}°)`;
  });
}
