// ============================================================================
// GPKT Import from PDF — dùng AI để bóc tách các trường của giấy phép khai thác
// hệ thống (`giay_phep_khai_thac`) từ tệp PDF, kiểm tra trùng, gợi ý hệ thống
// và lưu bản ghi kèm đường link file trong bucket `giay-phep-khai-thac`.
// ============================================================================
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

// ---------- Types ----------
export interface GpktParsedFields {
  gp_so: string;
  gp_ngay: string; // YYYY-MM-DD nếu suy được
  gp_han: string; // YYYY-MM-DD
  gp_cu: string;
  ten_he_thong_theo_gp: string;
  nam_sx_gp: string;
  kieu_thiet_bi: string;
  so_san_xuat: string;
  noi_san_xuat: string;
  muc_dich: string;
  pham_vi: string;
  ma_dia_chi: string;
  dia_diem: string;
  thoi_gian: string;
  thanh_phan_theo_gp: string;
  don_vi: string;
  tram: string;
}

const EMPTY_FIELDS: GpktParsedFields = {
  gp_so: "",
  gp_ngay: "",
  gp_han: "",
  gp_cu: "",
  ten_he_thong_theo_gp: "",
  nam_sx_gp: "",
  kieu_thiet_bi: "",
  so_san_xuat: "",
  noi_san_xuat: "",
  muc_dich: "",
  pham_vi: "",
  ma_dia_chi: "",
  dia_diem: "",
  thoi_gian: "",
  thanh_phan_theo_gp: "",
  don_vi: "",
  tram: "",
};

function asStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

function extractJson(raw: string): Record<string, unknown> | null {
  if (!raw) return null;
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `Bạn là trợ lý bóc tách GIẤY PHÉP KHAI THÁC HỆ THỐNG CNS/ATM hàng không Việt Nam
(do Cục Hàng không Việt Nam cấp — ký hiệu "GP-CHK"). Người dùng gửi 1 file PDF.
Nhiệm vụ: đọc PDF, trả về DUY NHẤT một object JSON theo đúng khoá bên dưới,
không giải thích, không markdown. Trường nào không suy được → chuỗi rỗng "".
Ngày cấp / ngày hết hạn phải chuẩn hoá dạng YYYY-MM-DD nếu suy được.

{
  "gp_so": "Số giấy phép (vd: 622/GP-CHK)",
  "gp_ngay": "Ngày cấp YYYY-MM-DD",
  "gp_han": "Ngày hết hạn YYYY-MM-DD",
  "gp_cu": "Số giấy phép cũ được thay thế (nếu có)",
  "ten_he_thong_theo_gp": "Tên hệ thống chính xác theo giấy phép",
  "nam_sx_gp": "Năm sản xuất theo giấy phép",
  "kieu_thiet_bi": "Kiểu/model thiết bị",
  "so_san_xuat": "Số sản xuất/serial",
  "noi_san_xuat": "Nơi sản xuất/hãng",
  "muc_dich": "Mục đích khai thác",
  "pham_vi": "Phạm vi khai thác",
  "ma_dia_chi": "Mã địa chỉ ICAO/định danh (nếu có)",
  "dia_diem": "Địa điểm lắp đặt",
  "thoi_gian": "Thời gian khai thác/ca trực (nếu có)",
  "thanh_phan_theo_gp": "Danh sách thành phần hệ thống theo giấy phép, ngăn cách bằng dấu phẩy",
  "don_vi": "Đơn vị khai thác (CRA / CLA / THO / PCA / PBA ...)",
  "tram": "Trạm/vị trí (nếu có)"
}`;

// ---------- Server fn: PARSE PDF ----------
const parseSchema = z.object({
  base64: z.string().min(100, "Tệp PDF không hợp lệ"),
  filename: z.string().min(1),
  mime: z.string().default("application/pdf"),
});

export const parseGpktPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => parseSchema.parse(d))
  .handler(async ({ data }): Promise<GpktParsedFields> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Máy chủ chưa cấu hình LOVABLE_API_KEY");

    const body = {
      model: "openai/gpt-5.5",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Bóc tách các trường của giấy phép sau và trả JSON đúng khoá." },
            {
              type: "file",
              file: {
                filename: data.filename,
                file_data: `data:${data.mime};base64,${data.base64}`,
              },
            },
          ],
        },
      ],
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) throw new Error("AI Gateway đang giới hạn tốc độ, thử lại sau");
    if (res.status === 402)
      throw new Error("Hết credit AI — vui lòng nạp thêm trong Workspace Settings");
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`AI Gateway lỗi ${res.status}: ${t.slice(0, 300)}`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "";
    const obj = extractJson(content);
    if (!obj) throw new Error("AI không trả về JSON hợp lệ. Hãy thử lại hoặc nhập tay.");

    const out: GpktParsedFields = { ...EMPTY_FIELDS };
    (Object.keys(EMPTY_FIELDS) as Array<keyof GpktParsedFields>).forEach((k) => {
      out[k] = asStr(obj[k]);
    });
    return out;
  });

// ---------- Server fn: DUPLICATE CHECK ----------
const dupSchema = z.object({
  gp_so: z.string().trim().min(1),
  he_thong_id: z.string().uuid().nullable().optional(),
});

export interface GpktDuplicate {
  id: string;
  gp_so: string | null;
  gp_han: string | null;
  he_thong_id: string | null;
  he_thong_ten: string | null;
  ten_he_thong_theo_gp: string | null;
  match: "gp_so" | "he_thong_active";
}

export const checkGpktDuplicate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => dupSchema.parse(d))
  .handler(async ({ data, context }): Promise<GpktDuplicate[]> => {
    const results: GpktDuplicate[] = [];

    // Trùng số giấy phép
    const { data: sameNo } = await context.supabase
      .from("giay_phep_khai_thac")
      .select("id, gp_so, gp_han, he_thong_id, ten_he_thong_theo_gp, dm_he_thong(ten)")
      .eq("gp_so", data.gp_so)
      .limit(10);
    for (const r of (sameNo ?? []) as Array<Record<string, unknown>>) {
      results.push({
        id: String(r.id),
        gp_so: (r.gp_so as string) ?? null,
        gp_han: (r.gp_han as string) ?? null,
        he_thong_id: (r.he_thong_id as string) ?? null,
        ten_he_thong_theo_gp: (r.ten_he_thong_theo_gp as string) ?? null,
        he_thong_ten: (r.dm_he_thong as { ten?: string } | null)?.ten ?? null,
        match: "gp_so",
      });
    }

    // Hệ thống đã có GPKT khác (còn hiệu lực hoặc chưa xác định hạn)
    if (data.he_thong_id) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: sameHt } = await context.supabase
        .from("giay_phep_khai_thac")
        .select("id, gp_so, gp_han, he_thong_id, ten_he_thong_theo_gp, dm_he_thong(ten)")
        .eq("he_thong_id", data.he_thong_id)
        .neq("gp_so", data.gp_so)
        .limit(10);
      for (const r of (sameHt ?? []) as Array<Record<string, unknown>>) {
        const han = (r.gp_han as string) ?? "";
        const stillActive = !han || han >= today;
        if (!stillActive) continue;
        results.push({
          id: String(r.id),
          gp_so: (r.gp_so as string) ?? null,
          gp_han: han || null,
          he_thong_id: (r.he_thong_id as string) ?? null,
          ten_he_thong_theo_gp: (r.ten_he_thong_theo_gp as string) ?? null,
          he_thong_ten: (r.dm_he_thong as { ten?: string } | null)?.ten ?? null,
          match: "he_thong_active",
        });
      }
    }
    return results;
  });

// ---------- Server fn: SAVE GPKT ----------
const saveSchema = z.object({
  fields: z.object({
    gp_so: z.string().trim().min(1, "Thiếu số giấy phép"),
    gp_ngay: z.string().default(""),
    gp_han: z.string().default(""),
    gp_cu: z.string().default(""),
    ten_he_thong_theo_gp: z.string().default(""),
    nam_sx_gp: z.string().default(""),
    kieu_thiet_bi: z.string().default(""),
    so_san_xuat: z.string().default(""),
    noi_san_xuat: z.string().default(""),
    muc_dich: z.string().default(""),
    pham_vi: z.string().default(""),
    ma_dia_chi: z.string().default(""),
    dia_diem: z.string().default(""),
    thoi_gian: z.string().default(""),
    thanh_phan_theo_gp: z.string().default(""),
    don_vi: z.string().default(""),
    tram: z.string().default(""),
  }),
  he_thong_id: z.string().uuid().nullable(),
  file_gpkt: z.string().url().nullable(),
  overwrite_id: z.string().uuid().nullable().optional(),
});

export const saveGpktRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => saveSchema.parse(d))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const payload = {
      ...data.fields,
      he_thong_id: data.he_thong_id,
      file_gpkt: data.file_gpkt,
      created_by: context.userId,
    };
    if (data.overwrite_id) {
      const { data: r, error } = await context.supabase
        .from("giay_phep_khai_thac")
        .update(payload)
        .eq("id", data.overwrite_id)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!r) throw new Error("Không cập nhật được bản ghi (thiếu quyền hoặc không tồn tại)");
      return { id: r.id as string };
    }
    const { data: r, error } = await context.supabase
      .from("giay_phep_khai_thac")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) throw new Error("Không tạo được bản ghi");
    return { id: r.id as string };
  });
