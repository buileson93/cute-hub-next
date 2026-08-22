// ============================================================================
// form-include-repo.ts — Cầu nối DB ↔ compiler THUẦN (form-include.ts).
//
// Tách 2 tầng:
//   • Mapper THUẦN: (version row + nội dung template + cạnh include) → VersionNode.
//     -> test được, không phụ thuộc DB.
//   • Server functions: đọc đồ thị include, PREVIEW biên dịch và PUBLISH.
//
// PUBLISH = biên dịch toàn bộ cây include của 1 version gốc thành 1
// compiled_schema DUY NHẤT (snapshot), ghi vào version rồi khoá (status
// chuyển 'published'). Sau publish, DB trigger khoá không cho sửa nội dung.
// Phiếu tạo về sau đọc snapshot này, KHÔNG đọc động mẫu con.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import { compileField, type CompiledField } from "@/lib/mirats/form-schema";
import { buildSections, type RawSectionRow, type RawItemRow } from "@/lib/mirats/checklist-repo";
import {
  compileVersion,
  IncludeCycleError,
  IncludeDuplicateError,
  IncludeMissingError,
  type VersionNode,
  type IncludeEdge,
  type ModuleContent,
} from "@/lib/mirats/form-include";

// ---------------------------------------------------------------------------
// MAPPER THUẦN
// ---------------------------------------------------------------------------

export type RawVersionRow = {
  version_id: string;
  template_code: string;
};

/** Dựng nội dung RIÊNG (fields + sections) của 1 version từ raw rows DB. */
export function buildModuleContent(
  fieldRows: readonly Parameters<typeof compileField>[0][] | null | undefined,
  sectionRows: readonly RawSectionRow[] | null | undefined,
  itemRows: readonly RawItemRow[] | null | undefined,
): ModuleContent {
  const fields: CompiledField[] = (fieldRows ?? []).map((f, i) => compileField(f, i));
  fields.sort((a, b) => a.position - b.position);
  const sections = buildSections(sectionRows, itemRows);
  return { fields, sections };
}

/** Dựng 1 VersionNode từ version row + nội dung template + cạnh include. */
export function buildVersionNode(
  version: RawVersionRow,
  content: ModuleContent,
  includes: readonly IncludeEdge[],
): VersionNode {
  return {
    version_id: version.version_id,
    template_code: version.template_code,
    content,
    includes: [...includes].sort((a, b) => a.position - b.position),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertCanManage(supabase: any, userId: string): Promise<void> {
  const [{ data: isAdmin }, { data: isKt }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.rpc("has_role", { _user_id: userId, _role: "phong_kt" }),
  ]);
  if (!isAdmin && !isKt) {
    throw new Error("Forbidden: chỉ Admin / Phòng Kỹ thuật được publish mẫu");
  }
}

type IncludeRow = {
  parent_version_id: string;
  child_version_id: string;
  position: number;
  section_code: string | null;
};

/** Nạp toàn bộ dữ liệu cần thiết để dựng node map cho cây include của root. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadGraph(supabase: any, rootVersionId: string) {
  // 1) Nạp toàn bộ cạnh include (bảng nhỏ) rồi BFS thu các version reachable.
  const { data: allEdges, error: eEdges } = await supabase
    .from("form_template_include")
    .select("parent_version_id, child_version_id, position, section_code");
  if (eEdges) throw new Error(eEdges.message);
  const edges = (allEdges ?? []) as IncludeRow[];

  const byParent = new Map<string, IncludeRow[]>();
  for (const e of edges) {
    const list = byParent.get(e.parent_version_id) ?? [];
    list.push(e);
    byParent.set(e.parent_version_id, list);
  }

  const reachable = new Set<string>();
  const queue = [rootVersionId];
  while (queue.length) {
    const v = queue.shift()!;
    if (reachable.has(v)) continue;
    reachable.add(v);
    for (const e of byParent.get(v) ?? []) queue.push(e.child_version_id);
  }
  const versionIds = [...reachable];

  // 2) Nạp version rows + mã template.
  const { data: verRows, error: eVer } = await supabase
    .from("form_template_version")
    .select("id, template_id, form_template:template_id(code)")
    .in("id", versionIds);
  if (eVer) throw new Error(eVer.message);

  const versionMeta = new Map<string, RawVersionRow & { template_id: string }>();
  const templateIds = new Set<string>();
  for (const r of verRows ?? []) {
    const code = (r.form_template?.code as string) ?? "";
    versionMeta.set(r.id as string, {
      version_id: r.id as string,
      template_code: code,
      template_id: r.template_id as string,
    });
    templateIds.add(r.template_id as string);
  }

  // 3) Nạp nội dung (field + section + item) cho các template liên quan.
  const tids = [...templateIds];
  const [fRes, sRes, iRes] = await Promise.all([
    supabase.from("form_field").select("*").in("template_id", tids),
    supabase.from("form_section").select("*").in("template_id", tids),
    supabase.from("form_check_item").select("*").in("template_id", tids),
  ]);
  if (fRes.error) throw new Error(fRes.error.message);
  if (sRes.error) throw new Error(sRes.error.message);
  if (iRes.error) throw new Error(iRes.error.message);

  const groupBy = <T extends { template_id: string }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) {
      const l = m.get(r.template_id) ?? [];
      l.push(r);
      m.set(r.template_id, l);
    }
    return m;
  };
  const fieldsByT = groupBy((fRes.data ?? []) as Array<{ template_id: string }>);
  const secsByT = groupBy((sRes.data ?? []) as Array<{ template_id: string }>);
  const itemsByT = groupBy((iRes.data ?? []) as Array<{ template_id: string }>);

  // 4) Dựng node map.
  const nodes: VersionNode[] = [];
  for (const vid of versionIds) {
    const meta = versionMeta.get(vid);
    if (!meta) continue;
    const content = buildModuleContent(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fieldsByT.get(meta.template_id) ?? []) as any,
      (secsByT.get(meta.template_id) ?? []) as unknown as RawSectionRow[],
      (itemsByT.get(meta.template_id) ?? []) as unknown as RawItemRow[],
    );
    const includes: IncludeEdge[] = (byParent.get(vid) ?? []).map((e) => ({
      child_version_id: e.child_version_id,
      position: e.position,
      section_code: e.section_code,
    }));
    nodes.push(buildVersionNode(meta, content, includes));
  }

  return { nodes, versionMeta };
}

function compileError(e: unknown): { error: string; kind: string } | null {
  if (e instanceof IncludeCycleError) return { error: e.message, kind: "cycle" };
  if (e instanceof IncludeDuplicateError) return { error: e.message, kind: "duplicate" };
  if (e instanceof IncludeMissingError) return { error: e.message, kind: "missing" };
  return null;
}

// ---------------------------------------------------------------------------
// SERVER FUNCTIONS
// ---------------------------------------------------------------------------

/** PREVIEW: biên dịch thử cây include (không ghi DB). Báo lỗi cycle/duplicate. */
export const previewFormVersion = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ versionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { nodes } = await loadGraph(context.supabase, data.versionId);
    try {
      const compiled = compileVersion(data.versionId, nodes);
      return {
        ok: true as const,
        included_codes: compiled.included_codes,
        field_count: compiled.fields.length,
        section_count: compiled.sections.length,
        compiled,
      };
    } catch (e) {
      const ce = compileError(e);
      if (ce) return { ok: false as const, ...ce };
      throw e;
    }
  });

/** PUBLISH: biên dịch + ghi compiled_schema + chuyển status 'published' (khoá). */
export const publishFormVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ versionId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertCanManage(context.supabase, context.userId);

    // Chỉ publish được từ draft.
    const { data: cur, error: eCur } = await context.supabase
      .from("form_template_version")
      .select("status")
      .eq("id", data.versionId)
      .maybeSingle();
    if (eCur) throw new Error(eCur.message);
    if (!cur) throw new Error("Không tìm thấy version");
    if (cur.status !== "draft") {
      throw new Error(`Chỉ publish được version đang draft (hiện: ${cur.status}).`);
    }

    const { nodes } = await loadGraph(context.supabase, data.versionId);

    let compiled;
    try {
      compiled = compileVersion(data.versionId, nodes);
    } catch (e) {
      const ce = compileError(e);
      if (ce) throw new Error(`Không thể publish: ${ce.error}`);
      throw e;
    }

    const { error: eUpd } = await context.supabase
      .from("form_template_version")
      .update({
        compiled_schema: compiled,
        status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.versionId);
    if (eUpd) throw new Error(eUpd.message);

    return {
      ok: true as const,
      included_codes: compiled.included_codes,
      field_count: compiled.fields.length,
      section_count: compiled.sections.length,
    };
  });
