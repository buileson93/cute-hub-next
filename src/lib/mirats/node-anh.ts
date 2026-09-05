/**
 * Ảnh đại diện cho node Cây/Sơ đồ hệ thống (phân loại, nhóm, hệ thống, tài sản).
 *
 * Không tạo bảng mới: đường dẫn ảnh được lưu trong `cay_node_edit.du_lieu.anh_url`
 * (bảng ghi đè node đã tồn tại), file nằm trong bucket `thiet-bi-hinh-anh` dùng
 * chung với ảnh tài sản. Ảnh là bucket riêng tư nên UI đọc bằng signed URL.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";

export type NodeAnhKind = "pl" | "lv" | "nh" | "ht" | "tb";

export const NODE_ANH_BUCKET = "thiet-bi-hinh-anh";
export const NODE_ANH_MAX_BYTES = 10 * 1024 * 1024; // 10MB — khớp giới hạn bucket
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export function nodeAnhKey(kind: string, ma: string): string {
  return `${kind}:${ma}`;
}

/** Kiểm tra file trước khi tải lên. Trả về thông báo lỗi tiếng Việt, hoặc null nếu hợp lệ. */
export function validateNodeAnh(file: { type: string; size: number }): string | null {
  if (!ALLOWED_MIME.includes(file.type)) {
    return "Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF hoặc AVIF.";
  }
  if (file.size > NODE_ANH_MAX_BYTES) {
    return "Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.";
  }
  if (file.size === 0) return "Tệp ảnh rỗng.";
  return null;
}

interface NodeAnhRow {
  kind: string;
  ma: string;
  du_lieu: unknown;
}

function readAnhPath(du_lieu: unknown): string | null {
  if (!du_lieu || typeof du_lieu !== "object") return null;
  const v = (du_lieu as Record<string, unknown>)["anh_url"];
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

/**
 * Bản đồ `kind:ma` -> signed URL của ảnh node. Ảnh thiếu/hỏng sẽ vắng mặt trong map
 * để UI tự rơi về biểu tượng mặc định.
 */
export function useNodeAnhMap() {
  return useQuery({
    queryKey: ["cay_node_edit", "anh"],
    staleTime: 60_000,
    queryFn: async (): Promise<Map<string, string>> => {
      const { data, error } = await supabase
        .from("cay_node_edit")
        .select("kind, ma, du_lieu")
        .limit(5000);
      if (error) throw error;

      const paths: { key: string; path: string }[] = [];
      for (const r of (data ?? []) as NodeAnhRow[]) {
        const p = readAnhPath(r?.du_lieu);
        if (r?.kind && r?.ma && p) paths.push({ key: nodeAnhKey(r.kind, r.ma), path: p });
      }
      const map = new Map<string, string>();
      if (!paths.length) return map;

      const { data: signed } = await storage
        .from(NODE_ANH_BUCKET)
        .createSignedUrls(paths.map((p) => p.path), 3600);
      (signed ?? []).forEach((s, i) => {
        const entry = paths[i];
        if (entry && s?.signedUrl && !s.error) map.set(entry.key, s.signedUrl);
      });
      return map;
    },
  });
}

/** Tải ảnh lên và gắn vào node; hoặc gỡ ảnh khỏi node. */
export function useNodeAnhMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
  };

  const upload = useMutation({
    mutationFn: async ({
      kind,
      ma,
      ten,
      file,
    }: {
      kind: NodeAnhKind;
      ma: string;
      ten?: string | null;
      file: File;
    }) => {
      const loi = validateNodeAnh(file);
      if (loi) throw new Error(loi);

      const safe = file.name.replace(/[^\w.-]+/g, "_");
      const path = `cay-node/${kind}/${encodeURIComponent(ma)}/${crypto.randomUUID()}-${safe}`;
      const up = await storage
        .from(NODE_ANH_BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (up.error) throw up.error;

      const { data: cu } = await supabase
        .from("cay_node_edit")
        .select("id, du_lieu")
        .eq("kind", kind)
        .eq("ma", ma)
        .maybeSingle();

      const duLieuCu =
        cu?.du_lieu && typeof cu.du_lieu === "object"
          ? (cu.du_lieu as Record<string, unknown>)
          : {};
      const anhCu = readAnhPath(duLieuCu);

      const { error } = await supabase
        .from("cay_node_edit")
        .upsert(
          { kind, ma, ten: ten ?? null, du_lieu: { ...duLieuCu, anh_url: path } },
          { onConflict: "kind,ma" },
        );
      if (error) {
        // Ghi DB hỏng → dọn file mồ côi để storage không rác.
        await storage.from(NODE_ANH_BUCKET).remove([path]);
        throw error;
      }
      if (anhCu && anhCu !== path) await storage.from(NODE_ANH_BUCKET).remove([anhCu]);
      return path;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async ({ kind, ma }: { kind: NodeAnhKind; ma: string }) => {
      const { data: cu } = await supabase
        .from("cay_node_edit")
        .select("du_lieu")
        .eq("kind", kind)
        .eq("ma", ma)
        .maybeSingle();
      const duLieuCu =
        cu?.du_lieu && typeof cu.du_lieu === "object"
          ? (cu.du_lieu as Record<string, unknown>)
          : {};
      const anhCu = readAnhPath(duLieuCu);
      const con = { ...duLieuCu };
      delete con["anh_url"];

      const { error } = await supabase
        .from("cay_node_edit")
        .update({ du_lieu: con })
        .eq("kind", kind)
        .eq("ma", ma);
      if (error) throw error;
      if (anhCu) await storage.from(NODE_ANH_BUCKET).remove([anhCu]);
    },
    onSuccess: invalidate,
  });

  return { upload, remove };
}
