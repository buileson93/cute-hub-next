import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import fullDefault from "@/assets/vatm-mirats-full.svg.asset.json";
import compactDefault from "@/assets/vatm-mirats-compact.svg.asset.json";

/**
 * Thương hiệu (logo) đọc từ bảng app_cai_dat.
 * - Khoá "logo_full": logo đầy đủ (trang đăng nhập).
 * - Khoá "logo_compact": logo thu gọn (thanh bên).
 * Giá trị lưu dạng data URI (SVG/PNG) hoặc URL. Nếu chưa cấu hình → dùng mặc định.
 */

export const LOGO_FULL_KEY = "logo_full";
export const LOGO_COMPACT_KEY = "logo_compact";

/** Yêu cầu về file logo — dùng để hiển thị hướng dẫn và kiểm tra khi tải lên. */
export const LOGO_RULES = {
  formats: ["image/svg+xml", "image/png", "image/webp"],
  formatLabel: "SVG (khuyến nghị), PNG hoặc WebP nền trong suốt",
  maxBytes: 5 * 1024 * 1024, // 5 MB
  maxLabel: "5 MB",
  svgMaxBytes: 1 * 1024 * 1024, // 1 MB cho SVG
  svgMaxLabel: "1 MB",

  ratioHint: "Tỉ lệ ngang (khuyến nghị ~4:1 cho logo đầy đủ, ~1:1 cho logo thu gọn)",
} as const;

export type BrandingSettings = {
  logoFull: string;
  logoCompact: string;
  hasCustomFull: boolean;
  hasCustomCompact: boolean;
};

async function fetchBranding(): Promise<BrandingSettings> {
  const { data } = await supabase
    .from("app_cai_dat")
    .select("khoa, gia_tri")
    .in("khoa", [LOGO_FULL_KEY, LOGO_COMPACT_KEY]);

  const map = new Map<string, string>();
  for (const r of data ?? []) {
    if (r.gia_tri && r.gia_tri.trim()) map.set(r.khoa, r.gia_tri.trim());
  }
  const full = map.get(LOGO_FULL_KEY);
  const compact = map.get(LOGO_COMPACT_KEY);
  return {
    logoFull: full || fullDefault.url,
    logoCompact: compact || compactDefault.url,
    hasCustomFull: !!full,
    hasCustomCompact: !!compact,
  };
}

export function useBranding() {
  return useQuery({
    queryKey: ["app-branding"],
    queryFn: fetchBranding,
    staleTime: 5 * 60 * 1000,
  });
}

/** Kiểm tra file tải lên có hợp lệ không. Trả về thông báo lỗi hoặc null nếu hợp lệ. */
export function validateLogoFile(file: File): string | null {
  const isSvg = file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  if (!(LOGO_RULES.formats as readonly string[]).includes(file.type) && !isSvg) {
    return `Định dạng không hỗ trợ. Chỉ chấp nhận ${LOGO_RULES.formatLabel}.`;
  }
  if (isSvg && file.size > LOGO_RULES.svgMaxBytes) {
    return `File SVG vượt quá ${LOGO_RULES.svgMaxLabel} (hiện ${(file.size / 1024).toFixed(0)} KB).`;
  }
  if (file.size > LOGO_RULES.maxBytes) {
    return `File vượt quá ${LOGO_RULES.maxLabel} (hiện ${(file.size / 1024).toFixed(0)} KB).`;
  }
  return null;
}

/** Đọc file thành data URI để lưu vào CSDL. */
export function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
