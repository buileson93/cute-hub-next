import { describe, it, expect } from 'vitest';
import { verifyApiKey } from './api-keys.functions';

describe('API Key Verification Logic', () => {
  it('should reject invalid token formats', async () => {
    const result = await verifyApiKey('invalid_token');
    expect(result.isValid).toBe(false);
  });

  it('should reject tokens with wrong prefix', async () => {
    const result = await verifyApiKey('sb_secret_123_456');
    expect(result.isValid).toBe(false);
  });

  it('should reject tokens with wrong number of parts', async () => {
    const result = await verifyApiKey('mrt_ext_live_keyid_secret_extra');
    expect(result.isValid).toBe(false);
  });

  // Note: Database-dependent tests (hashing, lookup) require a running Supabase instance 
  // or more complex mocking of supabaseAdmin.
});
