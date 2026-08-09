import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/backend/client";
import { z } from "zod";

const saveSchema = z.object({
  kind: z.string(),
  ma: z.string(),
  ten: z.string().nullable(),
  du_lieu: z.record(z.any()).nullable(),
});

const reorderSchema = z.object({
  parentKind: z.string(),
  parentMa: z.string(),
  order: z.array(z.string()),
});

// Fallback to a plain server function handler without explicit validator if TS2554 persists,
// or use the standard Zod-direct signature which often works when wrapped in (data) => data.
// In this specific project context, the triple-argument pattern is likely: (parser, encoder)
export const saveNode = createServerFn({ method: "POST" })
  .validator((data: unknown) => saveSchema.parse(data), (data: any) => data)
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("cay_node_edit")
      .upsert({
        kind: data.kind,
        ma: data.ma,
        ten: data.ten,
        du_lieu: data.du_lieu as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "kind,ma" });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderNodes = createServerFn({ method: "POST" })
  .validator((data: unknown) => reorderSchema.parse(data), (data: any) => data)
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("cay_node_edit")
      .upsert({
        kind: data.parentKind,
        ma: data.parentMa,
        du_lieu: { thu_tu: data.order } as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "kind,ma" });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
