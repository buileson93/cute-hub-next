import * as React from "react";
import { Body } from "@react-email/body";
import { Container } from "@react-email/container";
import { Head } from "@react-email/head";
import { Heading } from "@react-email/heading";
import { Hr } from "@react-email/hr";
import { Html } from "@react-email/html";
import { Preview } from "@react-email/preview";
import { Section } from "@react-email/section";
import { Text } from "@react-email/text";
import type { TemplateEntry } from "./registry";

export interface AlertRow {
  loai: string;
  tieu_de: string;
  chi_tiet?: string;
  ngay?: string;
  so_ngay_con_lai?: number | null;
}

interface Props {
  siteName: string;
  generatedAt: string;
  items: AlertRow[];
}

export const AlertsSummaryEmail = ({ siteName, generatedAt, items }: Props) => (
  <Html lang="vi" dir="ltr">
    <Head />
    <Preview>
      {items.length > 0
        ? `${items.length} cảnh báo cần chú ý — ${siteName}`
        : `Không có cảnh báo mới — ${siteName}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Tổng hợp cảnh báo</Heading>
        <Text style={sub}>
          {siteName} · {generatedAt}
        </Text>
        <Hr style={hr} />
        {items.length === 0 ? (
          <Text style={text}>Không có cảnh báo mới trong hệ thống.</Text>
        ) : (
          items.map((it, i) => (
            <Section key={i} style={row}>
              <Text style={badge}>{it.loai}</Text>
              <Text style={title}>{it.tieu_de}</Text>
              {it.chi_tiet ? <Text style={text}>{it.chi_tiet}</Text> : null}
              {it.ngay || typeof it.so_ngay_con_lai === "number" ? (
                <Text style={meta}>
                  {it.ngay ? `Hạn: ${it.ngay}` : ""}
                  {typeof it.so_ngay_con_lai === "number"
                    ? ` · Còn ${it.so_ngay_con_lai} ngày`
                    : ""}
                </Text>
              ) : null}
            </Section>
          ))
        )}
        <Hr style={hr} />
        <Text style={footer}>Email test tự động từ {siteName}. Không cần trả lời.</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: AlertsSummaryEmail,
  subject: (d) => `[${d.siteName ?? "VATM"}] ${d.items?.length ?? 0} cảnh báo cần chú ý`,
  displayName: "Tổng hợp cảnh báo",
  previewData: {
    siteName: "VATM",
    generatedAt: new Date().toISOString(),
    items: [
      { loai: "GIẤY PHÉP", tieu_de: "GP-001 sắp hết hạn", ngay: "2026-08-01", so_ngay_con_lai: 7 },
    ],
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "20px 25px", maxWidth: "600px" };
const h1 = { fontSize: "22px", fontWeight: "bold" as const, color: "#000", margin: "0 0 6px" };
const sub = { fontSize: "12px", color: "#888", margin: "0 0 12px" };
const hr = { borderColor: "#eee", margin: "16px 0" };
const row = {
  margin: "0 0 14px",
  padding: "10px 12px",
  backgroundColor: "#f7f7f8",
  borderRadius: "6px",
};
const badge = {
  fontSize: "11px",
  fontWeight: "bold" as const,
  color: "#b45309",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
};
const title = { fontSize: "14px", fontWeight: "bold" as const, color: "#111", margin: "0 0 4px" };
const text = { fontSize: "13px", color: "#444", lineHeight: "1.5", margin: "0 0 4px" };
const meta = { fontSize: "12px", color: "#666", margin: "0" };
const footer = { fontSize: "11px", color: "#999", margin: "20px 0 0" };
