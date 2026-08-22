import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyApiKey } from "../api-keys.functions";

// Define an interface for our mock to avoid TS errors
interface MockSupabaseAdmin {
  from: any;
  select: any;
  eq: any;
  single: any;
  insert: any;
  update: any;
}

const mockSupabaseAdmin: MockSupabaseAdmin = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
};

vi.mock("@/integrations/backend/admin.server", () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

describe("API Key Security Boundary Tests", () => {
  const pepper = "test-pepper";
  process.env.MIRATS_API_PEPPER = pepper;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock setup for successful calls
    mockSupabaseAdmin.from.mockReturnThis();
    mockSupabaseAdmin.select.mockReturnThis();
    mockSupabaseAdmin.eq.mockReturnThis();
    mockSupabaseAdmin.insert.mockReturnThis();
    mockSupabaseAdmin.update.mockReturnThis();
  });

  it("should reject expired keys", async () => {
    mockSupabaseAdmin.single.mockResolvedValue({
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
    mockSupabaseAdmin.single.mockResolvedValue({
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
    const originalPepper = process.env.MIRATS_API_PEPPER;
    const originalNodeEnv = process.env.NODE_ENV;
    
    process.env.MIRATS_API_PEPPER = "default-pepper-change-me";
    process.env.NODE_ENV = "production";

    const result = await verifyApiKey("mrt_ext_live_keyid_secret");
    expect(result.isValid).toBe(false);

    process.env.MIRATS_API_PEPPER = originalPepper;
    process.env.NODE_ENV = originalNodeEnv;
  });
});
