import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/backend/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    
    // Fallback: If it's a TanStack specific error that shouldn't be caught by UI
    if (error instanceof Error && error.message.includes("createServerFn")) {
      throw error;
    }

    console.error("errorMiddleware caught critical error:", error);
    
    const details = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name } 
      : { message: String(error), stack: 'No stack trace available' };

    return new Response(renderErrorPage(details), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
