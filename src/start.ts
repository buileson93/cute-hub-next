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
    
    if (error instanceof Error && error.message.includes("createServerFn")) {
      throw error;
    }

    console.error("CRITICAL SERVER ERROR:", error);
    
    // Attempt to stringify if it's not a standard Error
    let details = { message: 'Unknown error', stack: 'No stack', name: 'Error' };
    if (error instanceof Error) {
      details = { message: error.message, stack: error.stack || '', name: error.name };
    } else {
      try {
        details.message = JSON.stringify(error);
      } catch {
        details.message = String(error);
      }
    }

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
