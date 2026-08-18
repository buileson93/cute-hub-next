/**
 * GĐ2-03 — Command Palette v2 intent parser (rule-based, offline).
 *
 * Nhận diện ý định người dùng gõ trong Cmd+K:
 *  - mount-asset:   "gán TB123 vào TPHT_045", "lắp TB123 vào TPHT_045"
 *  - unmount-asset: "tháo TB123 khỏi TPHT_045", "gỡ TB123"
 *  - close-incident:"đóng sự cố SC-12", "close SC12"
 *  - create-pm:     "tạo pm cho HT_ADSB", "pm cho HT-ADSB"
 *  - jump-to:       fallback → dùng global search hiện có
 */

export type Intent =
  | { kind: "mount-asset"; asset: string; component: string; confidence: number }
  | { kind: "unmount-asset"; asset: string; component?: string; confidence: number }
  | { kind: "close-incident"; id: string; confidence: number }
  | { kind: "create-pm"; target: string; confidence: number }
  | { kind: "logout"; confidence: number }
  | { kind: "jump-to"; query: string; confidence: number };


const ASSET_RE = "(TB[_-]?\\d+|[A-Z]{2,}\\d{2,})";
const COMP_RE = "(TPHT[_-]?\\d+|[A-Z]{3,}[_-]?\\d+)";
const INCIDENT_RE = "(SC[_-]?\\d+)";

function norm(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export function matchIntent(input: string): Intent {
  const raw = norm(input);
  const s = raw.toLowerCase();

  // mount
  const mMount = raw.match(new RegExp(`(?:gán|gan|lắp|lap|mount)\\s+${ASSET_RE}\\s+(?:vào|vao|to|into)\\s+${COMP_RE}`, "i"));
  if (mMount) return { kind: "mount-asset", asset: mMount[1].toUpperCase(), component: mMount[2].toUpperCase(), confidence: 0.95 };

  // unmount
  const mUnmount = raw.match(new RegExp(`(?:tháo|thao|gỡ|go|unmount)\\s+${ASSET_RE}(?:\\s+(?:khỏi|khoi|from)\\s+${COMP_RE})?`, "i"));
  if (mUnmount) return { kind: "unmount-asset", asset: mUnmount[1].toUpperCase(), component: mUnmount[2]?.toUpperCase(), confidence: 0.9 };

  // close incident
  const mClose = raw.match(new RegExp(`(?:đóng|dong|close)\\s+(?:sự\\s+cố|su\\s+co|incident|sc)?\\s*${INCIDENT_RE}`, "i"));
  if (mClose) return { kind: "close-incident", id: mClose[1].toUpperCase(), confidence: 0.9 };

  // create pm
  const mPm = raw.match(/^(?:tạo|tao|create)\s+pm\s+(?:cho|for)\s+(.+)$/i);
  if (mPm) return { kind: "create-pm", target: mPm[1].trim(), confidence: 0.85 };

  // logout
  if (s.includes("đăng xuất") || s.includes("logout") || s === "exit" || s === "quit") {
    return { kind: "logout", confidence: 1 };
  }

  // jump-to fallback

  return { kind: "jump-to", query: raw, confidence: s.length > 0 ? 0.3 : 0 };
}

export function describeIntent(intent: Intent): string {
  switch (intent.kind) {
    case "mount-asset": return `Gán tài sản ${intent.asset} vào thành phần ${intent.component}`;
    case "unmount-asset": return intent.component
      ? `Tháo tài sản ${intent.asset} khỏi thành phần ${intent.component}`
      : `Tháo tài sản ${intent.asset}`;
    case "close-incident": return `Đóng sự cố ${intent.id}`;
    case "create-pm": return `Tạo phiếu bảo trì cho ${intent.target}`;
    case "logout": return "Đăng xuất khỏi hệ thống";
    case "jump-to": return `Tìm kiếm "${intent.query}"`;

  }
}
