import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const saveSchema = z.object({
  kind: z.string(),
  ma: z.string(),
  ten: z.string().nullable(),
  du_lieu: z.record(z.any().nullable()).nullable(),
});

const reorderSchema = z.object({
  parentKind: z.string(),
  parentMa: z.string(),
  order: z.array(z.string()),
});

export const saveNode = createServerFn({ method: "POST" })
  .inputValidator((input: any) => saveSchema.parse(input))
  .handler(async ({ data }: { data: z.infer<typeof saveSchema> }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("cay_node_edit")
      .upsert({
        kind: data.kind,
        ma: data.ma,
        ten: data.ten,
        du_lieu: data.du_lieu as any,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "kind,ma" });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderNodes = createServerFn({ method: "POST" })
  .inputValidator((input: any) => reorderSchema.parse(input))
  .handler(async ({ data }: { data: z.infer<typeof reorderSchema> }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("cay_node_edit")
      .upsert({
        kind: data.parentKind,
        ma: data.parentMa,
        du_lieu: { thu_tu: data.order } as any,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "kind,ma" });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
