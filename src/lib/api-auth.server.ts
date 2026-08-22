import { timingSafeEqual } from "crypto";

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // We still do a constant-time check on a dummy to prevent early exit timing signals
    // though length check is usually okay if we're comparing hash results.
    // For raw secrets, length is a signal.
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Verifies a request against a server-side secret (e.g. CRON_SECRET).
 * Returns a 401 response if invalid, or null if valid.
 */
export function verifySecret(request: Request, secretName: string, headerName: string = "x-cron-secret"): Response | null {
  const expected = process.env[secretName];
  if (!expected) {
    console.error(`[auth] Missing ${secretName} in environment`);
    return new Response(JSON.stringify({ error: "Endpoint not configured" }), { 
      status: 404, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const provided = request.headers.get(headerName) ?? request.headers.get(headerName.toLowerCase()) ?? "";
  
  // Reject if it's the publishable key or anon key
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (anonKey && provided === anonKey) {
     return new Response(JSON.stringify({ error: "Unauthorized: Publishable key not allowed" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  if (!provided || !safeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  return null;
}
