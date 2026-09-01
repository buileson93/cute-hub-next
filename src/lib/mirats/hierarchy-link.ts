/**
 * Tiện ích dùng chung cho việc khai báo/liên kết dữ liệu phân cấp
 * (Hệ thống ↔ Thành phần ↔ Tài sản).
 *
 * ponytail: chỉ xử lý quan hệ cha-con dạng phẳng (id/parentId). Quan hệ
 * many-to-many được biểu diễn bằng danh sách liên kết (LinkRef), không lồng cây.
 */

export interface HierarchyRef {
  id: string;
  parentId?: string | null;
}

/** Tập hợp id của toàn bộ hậu duệ của `rootId` (không gồm chính nó). */
export function descendantIds(nodes: readonly HierarchyRef[], rootId: string): Set<string> {
  const byParent = new Map<string, string[]>();
  for (const n of nodes) {
    if (!n?.id) continue;
    const p = n.parentId ?? "";
    const arr = byParent.get(p);
    if (arr) arr.push(n.id);
    else byParent.set(p, [n.id]);
  }
  const out = new Set<string>();
  const stack = [rootId];
  let guard = 0;
  while (stack.length > 0 && guard++ < 10_000) {
    const cur = stack.pop() as string;
    for (const child of byParent.get(cur) ?? []) {
      if (child === rootId || out.has(child)) continue;
      out.add(child);
      stack.push(child);
    }
  }
  return out;
}

/**
 * Node cha có hợp lệ không: không được là chính nó, không phải hậu duệ của nó.
 * Dùng để chặn vòng lặp khi chọn vị trí trong cây phân cấp.
 */
export function isValidParent(
  nodes: readonly HierarchyRef[],
  nodeId: string,
  parentId: string | null | undefined,
): boolean {
  if (!parentId) return true; // đưa lên gốc luôn hợp lệ
  if (parentId === nodeId) return false;
  return !descendantIds(nodes, nodeId).has(parentId);
}

/** Danh sách cha hợp lệ (đã loại chính nó và hậu duệ). */
export function validParentOptions<T extends HierarchyRef>(
  nodes: readonly T[],
  nodeId: string | null | undefined,
): T[] {
  if (!nodeId) return [...nodes];
  const bad = descendantIds(nodes, nodeId);
  return nodes.filter((n) => n.id !== nodeId && !bad.has(n.id));
}

export interface LinkRef {
  /** id đối tượng được liên kết (VD: tài sản). */
  targetId: string;
  /** ngữ cảnh liên kết (VD: id thành phần). */
  contextId: string;
}

/** Loại bỏ liên kết trùng trong cùng ngữ cảnh (giữ thứ tự xuất hiện đầu). */
export function dedupeLinks<T extends LinkRef>(links: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const l of links) {
    if (!l?.targetId || !l?.contextId) continue;
    const key = `${l.contextId}::${l.targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out;
}

/** Liên kết đã tồn tại trong ngữ cảnh này chưa. */
export function hasLink(
  links: readonly LinkRef[],
  contextId: string,
  targetId: string,
): boolean {
  return links.some((l) => l.contextId === contextId && l.targetId === targetId);
}

/** Các ngữ cảnh khác đang dùng chung target (để cảnh báo "Đang liên kết với …"). */
export function otherContexts(
  links: readonly LinkRef[],
  targetId: string,
  currentContextId: string,
): string[] {
  return Array.from(
    new Set(
      links
        .filter((l) => l.targetId === targetId && l.contextId !== currentContextId)
        .map((l) => l.contextId),
    ),
  );
}
