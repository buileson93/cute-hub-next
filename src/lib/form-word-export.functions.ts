import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import { fmtFieldValue } from "@/lib/mirats/bao-tri-form";
import {
  compileField,
  parseCompiledSchema,
  resolveSubmissionFields,
} from "@/lib/mirats/form-schema";
import { buildChecklistWordSections, CHECKLIST_WORD_HEADERS } from "@/lib/mirats/form-word";

const inputSchema = z.object({ submission_id: z.string().uuid() });

/**
 * Sinh file Word từ 1 submission. Trả về base64 để client tải xuống.
 * Chạy server-side để dùng RLS của user và ghi audit log.
 */
export const exportSubmissionToWord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1) Load submission + template + fields
    const { data: sub, error: subErr } = await supabase
      .from("form_submission")
      .select("*, template:form_template(*), don_vi:dm_don_vi(ma,ten)")
      .eq("id", data.submission_id)
      .maybeSingle();
    if (subErr || !sub) throw new Error("Không tìm thấy biên bản");

    // Ưu tiên snapshot ghim theo phiếu; fallback form_field hiện tại cho phiếu cũ.
    const { data: currentFields } = await supabase
      .from("form_field")
      .select("*")
      .eq("template_id", sub.template_id)
      .order("position");

    let versionSchema = null;
    if (sub.template_version_id) {
      const { data: ver } = await supabase
        .from("form_template_version")
        .select("compiled_schema")
        .eq("id", sub.template_version_id)
        .maybeSingle();
      versionSchema = parseCompiledSchema(ver?.compiled_schema);
    }

    const { fields } = resolveSubmissionFields({
      snapshot: parseCompiledSchema(sub.template_snapshot),
      versionSchema,
      currentFields: (currentFields ?? []).map((f: any, i: number) => compileField(f, i)),
    });

    const { data: links } = await supabase
      .from("form_submission_thiet_bi")
      .select("thiet_bi:thiet_bi(ma_thiet_bi,ten_thiet_bi,ma_serial,model)")
      .eq("submission_id", data.submission_id);

    // Mẫu bảng kiểm (checklist): kết quả đã ghim snapshot (bất biến).
    const { data: itemResults } = await supabase
      .from("form_submission_item_result")
      .select("*")
      .eq("submission_id", data.submission_id)
      .order("position");

    // Hướng dẫn (huong_dan) không lưu trong kết quả → tra từ định nghĩa mẫu.
    const huongDanByCode: Record<string, string | null> = {};
    if ((itemResults ?? []).length > 0) {
      const { data: defs } = await supabase
        .from("form_check_item")
        .select("item_code, huong_dan")
        .eq("template_id", sub.template_id);
      for (const d of defs ?? [])
        huongDanByCode[d.item_code as string] = (d.huong_dan as string) ?? null;
    }
    const checklistSections = buildChecklistWordSections(itemResults ?? [], huongDanByCode);
    const isChecklist = checklistSections.length > 0;

    let singleDevice: {
      ma_thiet_bi: string;
      ten_thiet_bi: string;
      ma_serial: string | null;
      model: string | null;
    } | null = null;
    if (sub.thiet_bi_id) {
      const { data: tb } = await supabase
        .from("thiet_bi")
        .select("ma_thiet_bi,ten_thiet_bi,ma_serial,model")
        .eq("id", sub.thiet_bi_id)
        .maybeSingle();
      singleDevice = tb ?? null;
    }

    // 2) Build docx
    const {
      Document,
      Packer,
      Paragraph,
      TextRun,
      Table,
      TableRow,
      TableCell,
      HeadingLevel,
      AlignmentType,
      WidthType,
      BorderStyle,
      ShadingType,
    } = await import("docx");

    const border = { style: BorderStyle.SINGLE, size: 4, color: "999999" };
    const cellBorders = { top: border, bottom: border, left: border, right: border };

    const fmtVal = fmtFieldValue;

    const dataObj = (sub.data ?? {}) as Record<string, unknown>;

    const contentRows: InstanceType<typeof TableRow>[] = (fields ?? []).map(
      (f) =>
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 3500, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
              children: [new Paragraph({ children: [new TextRun({ text: f.label, bold: true })] })],
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 5860, type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun(fmtVal(dataObj[f.key]))] })],
            }),
          ],
        }),
    );

    const deviceRows: InstanceType<typeof TableRow>[] = [];
    const deviceList = links?.map((l: any) => l.thiet_bi).filter(Boolean) ?? [];
    if (singleDevice) deviceList.unshift(singleDevice);
    if (deviceList.length > 0) {
      deviceRows.push(
        new TableRow({
          tableHeader: true,
          children: ["Mã TB", "Tên tài sản", "Serial", "Model"].map(
            (h) =>
              new TableCell({
                borders: cellBorders,
                shading: { fill: "E5E7EB", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
              }),
          ),
        }),
      );
      for (const d of deviceList) {
        if (!d) continue;
        deviceRows.push(
          new TableRow({
            children: [
              d.ma_thiet_bi ?? "",
              d.ten_thiet_bi ?? "",
              d.ma_serial ?? "",
              d.model ?? "",
            ].map(
              (t) =>
                new TableCell({
                  borders: cellBorders,
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: [new TextRun(String(t))] })],
                }),
            ),
          }),
        );
      }
    }

    // Bảng kiểm (checklist) theo section: mỗi section 1 tiêu đề + 1 bảng
    // STT / Hạng mục / Hướng dẫn / Giá trị / Đơn vị / Tiêu chuẩn / Kết quả / Hành động.
    const clHeaderRow = () =>
      new TableRow({
        tableHeader: true,
        children: CHECKLIST_WORD_HEADERS.map(
          (h) =>
            new TableCell({
              borders: cellBorders,
              shading: { fill: "E5E7EB", type: ShadingType.CLEAR },
              margins: { top: 60, bottom: 60, left: 80, right: 80 },
              children: [
                new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] }),
              ],
            }),
        ),
      });
    const clCol = [520, 2000, 2140, 900, 700, 1200, 900, 1000];
    const checklistBlocks: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];
    for (const [i, section] of checklistSections.entries()) {
      checklistBlocks.push(
        new Paragraph({
          children: [new TextRun({ text: `${i + 1}. ${section.ten}`, bold: true, size: 24 })],
          spacing: { before: 200, after: 80 },
        }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: clCol,
          rows: [
            clHeaderRow(),
            ...section.rows.map(
              (r) =>
                new TableRow({
                  children: [
                    String(r.stt),
                    r.ten,
                    r.huong_dan,
                    r.gia_tri,
                    r.don_vi,
                    r.tieu_chuan,
                    r.ket_qua,
                    r.hanh_dong,
                  ].map(
                    (t, ci) =>
                      new TableCell({
                        borders: cellBorders,
                        width: { size: clCol[ci], type: WidthType.DXA },
                        margins: { top: 50, bottom: 50, left: 80, right: 80 },
                        children: [
                          new Paragraph({ children: [new TextRun({ text: String(t), size: 20 })] }),
                        ],
                      }),
                  ),
                }),
            ),
          ],
        }),
      );
    }

    const sig = (label: string) =>
      new TableCell({
        borders: cellBorders,
        margins: { top: 80, bottom: 400, left: 120, right: 120 },
        width: { size: 4680, type: WidthType.DXA },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: label, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "(Ký, ghi rõ họ tên)", italics: true, size: 20 })],
          }),
        ],
      });

    const doc = new Document({
      styles: {
        default: { document: { run: { font: "Times New Roman", size: 24 } } },
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
            },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `TỔNG CÔNG TY QUẢN LÝ BAY VIỆT NAM${sub.don_vi ? ` - ${sub.don_vi.ten}` : ""}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true })],
              spacing: { after: 100 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "Độc lập - Tự do - Hạnh phúc", bold: true })],
              spacing: { after: 300 },
            }),
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: (sub.tieu_de ?? sub.template?.ten ?? "BIÊN BẢN").toUpperCase(),
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 200 },
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Mã: ${sub.template_code} · Kỳ: ${sub.ky_bao_cao ?? "—"}`,
                  italics: true,
                }),
              ],
              spacing: { after: 300 },
            }),

            ...(deviceRows.length > 0
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: "I. Tài sản liên quan", bold: true })],
                    spacing: { before: 200, after: 100 },
                  }),
                  new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [1800, 3560, 2000, 2000],
                    rows: deviceRows,
                  }),
                ]
              : []),

            new Paragraph({
              children: [
                new TextRun({
                  text: deviceRows.length > 0 ? "II. Nội dung" : "I. Nội dung",
                  bold: true,
                }),
              ],
              spacing: { before: 300, after: 100 },
            }),
            ...(isChecklist
              ? checklistBlocks
              : [
                  new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [3500, 5860],
                    rows: contentRows,
                  }),
                ]),

            ...(sub.template?.require_signature || isChecklist
              ? [
                  new Paragraph({
                    children: [new TextRun("")],
                    spacing: { before: 400 },
                  }),
                  new Table({
                    width: { size: 9360, type: WidthType.DXA },
                    columnWidths: [4680, 4680],
                    rows: [
                      new TableRow({
                        children: isChecklist
                          ? [sig("NGƯỜI THỰC HIỆN"), sig("PHỤ TRÁCH / GIÁM SÁT")]
                          : [sig("ĐẠI DIỆN ĐƠN VỊ"), sig("NGƯỜI LẬP BIÊN BẢN")],
                      }),
                    ],
                  }),
                ]
              : []),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const base64 = Buffer.from(buffer).toString("base64");

    // Ghi log xuất Word
    await supabase.rpc("log_app_event", {
      _action: "export_word_submission",
      _entity: "form_submission",
      _entity_id: data.submission_id,
      _detail: { template_code: sub.template_code, actor: userId },
    });

    const fileName = `${sub.template_code}_${(sub.tieu_de ?? sub.id).slice(0, 40).replace(/[^\w\-]/g, "_")}.docx`;
    return { base64, fileName };
  });
