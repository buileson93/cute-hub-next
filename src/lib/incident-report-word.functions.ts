import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";

const inputSchema = z.object({ ma_nhom_bc: z.string().min(1) });

interface KipTrucVien { ho_ten: string; chuc_vu: string; nang_dinh: string }
interface BaoCaoBanDau {
  kinh_gui: string;
  he_thong_dich_vu: string;
  tom_tat: string;
  thoi_gian_bat_dau: string;
  dia_diem: string;
  kip_truc: KipTrucVien[];
  tinh_hinh_hien_tai: string;
  ket_qua_khac_phuc: string;
  phan_loai: string;
  thiet_bi_list: string[];
}

/**
 * Sinh file Word "BÁO CÁO BAN ĐẦU" từ nhóm phiếu sự cố (ma_nhom_bc). Trả về base64.
 * Chạy server-side theo RLS của user.
 */
export const exportBaoCaoBanDauToWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: rows, error } = await supabase
      .from("su_co")
      .select("*")
      .eq("ma_nhom_bc", data.ma_nhom_bc)
      .order("ma_su_co");
    if (error) throw error;
    if (!rows || rows.length === 0) throw new Error("Không tìm thấy báo cáo sự cố");

    const first = rows[0];
    const bc = (first.bao_cao_ban_dau ?? {}) as Partial<BaoCaoBanDau>;

    // Tên đầy đủ các tài sản bị ảnh hưởng
    const maList = Array.from(new Set(rows.map((r: any) => r.thiet_bi).filter(Boolean))) as string[];
    const tenMap = new Map<string, string>();
    if (maList.length) {
      const { data: tbs } = await supabase
        .from("thiet_bi")
        .select("ma_thiet_bi,ten_thiet_bi")
        .in("ma_thiet_bi", maList);
      for (const t of tbs ?? []) tenMap.set(t.ma_thiet_bi, t.ten_thiet_bi ?? "");
    }

    const {
      Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
      AlignmentType, WidthType, BorderStyle, HeadingLevel,
    } = await import("docx");

    const border = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
    const cellBorders = { top: border, bottom: border, left: border, right: border };

    const P = (text: string, opts?: { bold?: boolean; italics?: boolean; align?: unknown }) =>
      new Paragraph({
        alignment: opts?.align as never,
        spacing: { after: 120 },
        children: [new TextRun({ text, bold: opts?.bold, italics: opts?.italics })],
      });

    const labelValue = (label: string, value: string) =>
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: `${label} `, bold: true }),
          new TextRun({ text: value || "…" }),
        ],
      });

    const phanLoai = (bc.phan_loai ?? "").toUpperCase();

    const kip = Array.isArray(bc.kip_truc) ? bc.kip_truc : [];
    const kipTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ["STT", "HỌ VÀ TÊN", "CHỨC VỤ", "NĂNG ĐỊNH"].map(
            (h) =>
              new TableCell({
                borders: cellBorders,
                margins: { top: 40, bottom: 40, left: 80, right: 80 },
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
              }),
          ),
        }),
        ...kip.map(
          (k, i) =>
            new TableRow({
              children: [
                String(i + 1), k.ho_ten ?? "", k.chuc_vu ?? "", k.nang_dinh ?? "",
              ].map(
                (c) =>
                  new TableCell({
                    borders: cellBorders,
                    margins: { top: 40, bottom: 40, left: 80, right: 80 },
                    children: [new Paragraph({ children: [new TextRun(c)] })],
                  }),
              ),
            }),
        ),
      ],
    });

    const doc = new Document({
      styles: { default: { document: { run: { font: "Times New Roman", size: 26 } } } },
      sections: [
        {
          properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 } } },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
              children: [new TextRun({ text: "BÁO CÁO BAN ĐẦU", bold: true, size: 32 })],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
              children: [new TextRun({ text: first.hien_tuong ?? "", bold: true, italics: true })],
            }),

            labelValue("Kính gửi:", bc.kinh_gui ?? ""),
            labelValue("Hệ thống tài sản/Dịch vụ bị sự cố:", bc.he_thong_dich_vu ?? ""),

            ...(maList.length
              ? [
                  new Paragraph({
                    spacing: { after: 60 },
                    children: [new TextRun({ text: "Tài sản bị ảnh hưởng:", bold: true })],
                  }),
                  ...maList.map(
                    (m) =>
                      new Paragraph({
                        bullet: { level: 0 },
                        children: [new TextRun(`${m}${tenMap.get(m) ? " — " + tenMap.get(m) : ""}`)],
                      }),
                  ),
                ]
              : []),

            P("Tóm tắt sự việc xảy ra:", { bold: true }),
            ...(bc.tom_tat ?? "").split("\n").map((line) => P(line)),

            labelValue("Thời gian, địa điểm xảy ra sự cố:", `${bc.thoi_gian_bat_dau ?? ""}${bc.dia_diem ? " · " + bc.dia_diem : ""}`),

            P("Thành phần kíp trực:", { bold: true }),
            kipTable,
            new Paragraph({ spacing: { after: 120 }, children: [] }),




            labelValue("Tình hình hiện tại:", bc.tinh_hinh_hien_tai ?? ""),
            labelValue("Kết quả hoặc phương án khắc phục:", bc.ket_qua_khac_phuc ?? ""),
            labelValue("Đánh giá phân loại sự cố (Mức A/B/C/D/E):", phanLoai ? `Sự cố loại ${phanLoai}` : "…"),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const base64 = Buffer.from(buffer).toString("base64");

    await supabase.rpc("log_app_event", {
      _action: "export_word_bao_cao_ban_dau",
      _entity: "su_co",
      _entity_id: data.ma_nhom_bc,
      _detail: { actor: userId, so_thiet_bi: maList.length },
    });

    const fileName = `BaoCaoBanDau_${data.ma_nhom_bc}.docx`;
    return { base64, fileName };
  });
