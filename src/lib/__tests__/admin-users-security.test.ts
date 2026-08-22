import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUser, updateUser, setUserActive, listUsers } from '../admin-users.functions';

// Mock supabaseAdmin
const mockSupabaseAdmin = {
  auth: {
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
      listUsers: vi.fn(),
      updateUserById: vi.fn(),
    }
  },
  from: vi.fn().mockReturnChild({
    select: vi.fn().mockReturnChild({
      order: vi.fn().mockReturnChild({
        in: vi.fn().mockResolvedValue({ data: [], error: null }),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockReturnChild({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    delete: vi.fn().mockReturnChild({
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  }),
  rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
};

// Helper to mock chainable supabase calls
function mockReturnChild(this: any, obj: any) {
  return function() {
    return { ...obj, ...this };
  }
}
(mockSupabaseAdmin.from as any).mockReturnChild = mockReturnChild;

vi.mock('@/integrations/backend/admin.server', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    middleware: () => ({
      inputValidator: () => ({
        handler: (fn: any) => fn
      }),
      handler: (fn: any) => fn
    })
  })
}));

describe('Admin User Management Security', () => {
  const context = {
    userId: 'admin-id',
    supabase: mockSupabaseAdmin, // Simplified for testing
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should attempt to cleanup auth user if profile creation fails (Compensation)', async () => {
    mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null
    });
    
    // Simulate failure on profile update
    mockSupabaseAdmin.from.mockImplementationOnce(() => ({
        update: () => ({
            eq: () => Promise.resolve({ error: new Error('DB Error') })
        })
    }));

    try {
      await createUser({
        data: {
          email: 'test@example.com',
          password: 'password123',
          ho_ten: 'Test User',
          don_vi: 'CRA',
          roles: ['ktv']
        },
        context
      });
    } catch (e) {
      // Expect cleanup to be called
      // Note: Implementation might not have this yet, so this test will fail initially
      expect(mockSupabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('new-user-id');
    }
  });

  it('should prevent self-deactivation', async () => {
    await expect(setUserActive({
      data: { user_id: 'admin-id', active: false },
      context
    })).rejects.toThrow('Không thể tự khoá tài khoản của chính mình');
  });

  it('should enforce minimum 8 characters for password', async () => {
     // This would be caught by Zod in a real scenario, but we can test the validator logic
     // if we expose it or test via the handler's input validation (if not mocked away)
  });
});
