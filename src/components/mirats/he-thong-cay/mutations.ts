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

// Use .inputValidator() to bypass the TS2554 error in .validator() for this TanStack Start version
export const saveNode = createServerFn({ method: "POST" })
  .inputValidator(saveSchema)
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
  .inputValidator(reorderSchema)
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
