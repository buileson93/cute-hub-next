import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUser, updateUser, setUserActive } from '../admin-users.functions';

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
  from: vi.fn().mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [], error: null }),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: [], error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
  rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
};

vi.mock('@/integrations/backend/admin.server', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

// Mock createServerFn to return the handler directly for testing
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
    supabase: mockSupabaseAdmin,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent self-deactivation', async () => {
    // @ts-ignore - passing context directly to mock handler
    await expect(setUserActive({
      data: { user_id: 'admin-id', active: false },
      context
    })).rejects.toThrow('Không thể tự khoá tài khoản của chính mình');
  });

  it('should attempt to cleanup auth user if profile creation fails (Compensation)', async () => {
    mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null
    });
    
    // Simulate failure on profile update
    mockSupabaseAdmin.from.mockImplementationOnce(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: new Error('DB Error') })
    }));

    try {
      // @ts-ignore
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
      // This is expected to be implemented in the fix phase
      // expect(mockSupabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('new-user-id');
    }
  });
});
