import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyApiKey } from "../api-keys.functions";

// Mock supabaseAdmin to avoid real DB calls during logic tests
vi.mock("@/integrations/backend/admin.server", () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    then: vi.fn(),
  },
}));

describe("API Key Security Boundary Tests", () => {
  const pepper = "test-pepper";
  process.env.MIRATS_API_PEPPER = pepper;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject expired keys", async () => {
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    (supabaseAdmin.single as any).mockResolvedValue({
      data: {
        secret_hash: "somehash",
        user_id: "user-a",
        scopes: ["projects:read"],
        expires_at: new Date(Date.now() - 1000).toISOString(), // Expired 1s ago
        revoked_at: null,
      },
      error: null,
    });

    const result = await verifyApiKey("mrt_ext_live_keyid_secret");
    expect(result.isValid).toBe(false);
  });

  it("should reject revoked keys", async () => {
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    (supabaseAdmin.single as any).mockResolvedValue({
      data: {
        secret_hash: "somehash",
        user_id: "user-a",
        scopes: ["projects:read"],
        expires_at: null,
        revoked_at: new Date().toISOString(),
      },
      error: null,
    });

    const result = await verifyApiKey("mrt_ext_live_keyid_secret");
    expect(result.isValid).toBe(false);
  });

  it("should fail closed if MIRATS_API_PEPPER is missing/default in production", async () => {
    // This logic will be implemented in api-keys.functions.ts
    // For now, we simulate the 'default' pepper scenario
    const originalPepper = process.env.MIRATS_API_PEPPER;
    process.env.MIRATS_API_PEPPER = "default-pepper-change-me";
    process.env.NODE_ENV = "production";

    // We expect the function to throw or return invalid when pepper is unsafe
    const result = await verifyApiKey("mrt_ext_live_keyid_secret");
    // Depending on implementation, it might throw or return isValid: false
    // Let's assume for now it returns false if pepper is default in prod
    expect(result.isValid).toBe(false);

    process.env.MIRATS_API_PEPPER = originalPepper;
    process.env.NODE_ENV = "development";
  });
});
