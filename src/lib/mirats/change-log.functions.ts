import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Proxy function to fetch change log.
 * In a real scenario, this would import from db-smart.server.ts
 * and handle Supabase auth/admin access.
 */
export const getChangeLog = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      entity: z.string(),
      entityId: z.string().nullable(),
    }),
  )
  .handler(async ({ data }) => {
    // This is a placeholder for the actual server-side logic
    // Implementation should be moved to a .server.ts file
    return [];
  });
