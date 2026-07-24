// ============================================================================
// form-include.ts — Compiler THUẦN cho MẪU LỒNG NHAU (template include).
//
// Bài toán: một mẫu (VD phụ lục PL04) có thể "include" nội dung của mẫu khác
// (PL02 + PL03), và PL03 lại include PL01. Khi PUBLISH ta cần "biên dịch" toàn
// bộ cây include thành 1 compiled_schema DUY NHẤT (snapshot) để:
//   • Phiếu đã tạo KHÔNG đọc động mẫu con (đóng băng cấu trúc tại lúc publish).
//   • Phát hiện VÒNG LẶP (cycle) và TRÙNG LẶP (duplicate) trước khi khoá version.
//
// Module KHÔNG phụ thuộc DB → test được & dùng chung server/client.
//
// Quy tắc:
//   • Mỗi version chỉ được include ĐÚNG MỘT LẦN trong toàn cây (duplicate ⇒ lỗi).
//   • Include tạo vòng (A→B→A) ⇒ lỗi cycle.
//   • Trùng mã section (ma_section) hoặc trùng key field ⇒ lỗi duplicate.
//   • Thứ tự giải include theo `position` của cạnh include; section riêng của
//     version xếp theo `position` của section. Kết quả được đánh lại position
//     tuần tự để snapshot ổn định.
// ============================================================================

import type { CompiledField } from "@/lib/mirats/form-schema";
import type { ChecklistSection } from "@/lib/mirats/checklist";

/** Nội dung RIÊNG (chưa giải include) của 1 version. */
export type ModuleContent = {
  fields: CompiledField[];
  sections: ChecklistSection[];
};

/** 1 cạnh include: version cha include 1 version con. */
export type IncludeEdge = {
  child_version_id: string;
  position: number;
  /** Gợi ý vị trí gắn (tuỳ chọn, chỉ để hiển thị/trace). */
  section_code: string | null;
};

/** 1 node version trong đồ thị include. */
export type VersionNode = {
  version_id: string;
  /** Mã mẫu (VD PL01..PL04) — dùng để trace/preview. */
  template_code: string;
  content: ModuleContent;
  includes: IncludeEdge[];
};

/** Kết quả biên dịch: snapshot đã gộp toàn bộ cây include. */
export type CompiledModule = {
  root_version_id: string;
  fields: CompiledField[];
  sections: ChecklistSection[];
  /** Mã mẫu đã gộp theo thứ tự duyệt (gồm cả root, mỗi mã 1 lần). */
  included_codes: string[];
  /** version_id đã gộp theo thứ tự duyệt (gồm cả root). */
  included_version_ids: string[];
};

export class IncludeCycleError extends Error {
  constructor(public readonly cyclePath: string[]) {
    super(`Include tạo vòng lặp: ${cyclePath.join(" → ")}`);
    this.name = "IncludeCycleError";
  }
}

export class IncludeDuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncludeDuplicateError";
  }
}

export class IncludeMissingError extends Error {
  constructor(public readonly versionId: string) {
    super(`Không tìm thấy version include: ${versionId}`);
    this.name = "IncludeMissingError";
  }
}

function toNodeMap(
  nodes: Map<string, VersionNode> | readonly VersionNode[] | Record<string, VersionNode>,
): Map<string, VersionNode> {
  if (nodes instanceof Map) return nodes;
  const m = new Map<string, VersionNode>();
  if (Array.isArray(nodes)) {
    for (const n of nodes) m.set(n.version_id, n);
  } else {
    for (const n of Object.values(nodes as Record<string, VersionNode>)) {
      m.set(n.version_id, n);
    }
  }
  return m;
}

type Accum = {
  fields: CompiledField[];
  sections: ChecklistSection[];
  codes: string[];
  versionIds: string[];
  seenVersions: Set<string>; // để phát hiện include trùng (đúng một lần)
  seenSectionCodes: Set<string>;
  seenFieldKeys: Set<string>;
};

/** Duyệt 1 node, gộp nội dung riêng + include (đệ quy). */
function walk(
  versionId: string,
  map: Map<string, VersionNode>,
  path: string[],
  acc: Accum,
): void {
  // 1) Cycle: version đang nằm trên đường đi hiện tại.
  if (path.includes(versionId)) {
    throw new IncludeCycleError([...path, versionId]);
  }
  const node = map.get(versionId);
  if (!node) throw new IncludeMissingError(versionId);

  // 2) Duplicate: version đã được gộp ở nhánh khác ⇒ include > 1 lần.
  if (acc.seenVersions.has(versionId)) {
    throw new IncludeDuplicateError(
      `Mẫu "${node.template_code}" bị include nhiều lần trong cùng một cây.`,
    );
  }
  acc.seenVersions.add(versionId);
  acc.codes.push(node.template_code);
  acc.versionIds.push(versionId);

  const nextPath = [...path, versionId];

  // 3) Gộp field riêng (kiểm tra trùng key).
  const ownFields = [...node.content.fields].sort((a, b) => a.position - b.position);
  for (const f of ownFields) {
    if (acc.seenFieldKeys.has(f.key)) {
      throw new IncludeDuplicateError(`Trùng key trường dữ liệu: "${f.key}".`);
    }
    acc.seenFieldKeys.add(f.key);
    acc.fields.push(f);
  }

  // 4) Xếp section riêng + cạnh include theo position rồi giải tuần tự.
  type Entry =
    | { position: number; kind: "section"; section: ChecklistSection }
    | { position: number; kind: "include"; edge: IncludeEdge };
  const entries: Entry[] = [];
  for (const s of node.content.sections) {
    entries.push({ position: s.position, kind: "section", section: s });
  }
  for (const e of node.includes) {
    entries.push({ position: e.position, kind: "include", edge: e });
  }
  entries.sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    // ổn định: section trước include khi cùng position
    return a.kind === b.kind ? 0 : a.kind === "section" ? -1 : 1;
  });

  for (const en of entries) {
    if (en.kind === "section") {
      if (acc.seenSectionCodes.has(en.section.ma_section)) {
        throw new IncludeDuplicateError(
          `Trùng mã section: "${en.section.ma_section}".`,
        );
      }
      acc.seenSectionCodes.add(en.section.ma_section);
      acc.sections.push(en.section);
    } else {
      walk(en.edge.child_version_id, map, nextPath, acc);
    }
  }
}

/**
 * Biên dịch cây include của 1 version gốc thành compiled schema (snapshot).
 * Ném lỗi khi phát hiện cycle / duplicate / thiếu version.
 */
export function compileVersion(
  rootVersionId: string,
  nodes: Map<string, VersionNode> | readonly VersionNode[] | Record<string, VersionNode>,
): CompiledModule {
  const map = toNodeMap(nodes);
  const acc: Accum = {
    fields: [],
    sections: [],
    codes: [],
    versionIds: [],
    seenVersions: new Set(),
    seenSectionCodes: new Set(),
    seenFieldKeys: new Set(),
  };
  walk(rootVersionId, map, [], acc);

  // Đánh lại position tuần tự để snapshot ổn định.
  const fields = acc.fields.map((f, i) => ({ ...f, position: i }));
  const sections = acc.sections.map((s, i) => ({ ...s, position: i }));

  return {
    root_version_id: rootVersionId,
    fields,
    sections,
    included_codes: acc.codes,
    included_version_ids: acc.versionIds,
  };
}

/** Kiểm tra nhanh cây include có hợp lệ không (không ném lỗi). */
export function validateIncludeGraph(
  rootVersionId: string,
  nodes: Map<string, VersionNode> | readonly VersionNode[] | Record<string, VersionNode>,
): { ok: true } | { ok: false; error: string; kind: "cycle" | "duplicate" | "missing" } {
  try {
    compileVersion(rootVersionId, nodes);
    return { ok: true };
  } catch (e) {
    if (e instanceof IncludeCycleError) return { ok: false, error: e.message, kind: "cycle" };
    if (e instanceof IncludeDuplicateError) return { ok: false, error: e.message, kind: "duplicate" };
    if (e instanceof IncludeMissingError) return { ok: false, error: e.message, kind: "missing" };
    throw e;
  }
}
