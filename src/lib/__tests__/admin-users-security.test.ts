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

// Mock createServerFn to capture the handler
let capturedHandlers: Record<string, any> = {};

vi.mock('@tanstack/react-start', () => ({
  createServerFn: (options: any) => {
    const fn: any = {
      middleware: vi.fn().mockReturnThis(),
      inputValidator: vi.fn().mockReturnThis(),
      handler: (handler: any) => {
        fn._handler = handler;
        return fn;
      }
    };
    return fn;
  }
}));

// We need to re-import or use a trick because the module already loaded in previous attempts
// In Vitest, we can use vi.resetModules() but it's easier to just access the hidden _handler we added in the mock above.

describe('Admin User Management Security', () => {
  const context = {
    userId: 'admin-id',
    supabase: mockSupabaseAdmin as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prevent self-deactivation', async () => {
    const handler = (setUserActive as any)._handler;
    await expect(handler({
      data: { user_id: 'admin-id', active: false },
      context
    })).rejects.toThrow('Không thể tự khoá tài khoản của chính mình');
  });

  it('should have createUser compensation logic', async () => {
    mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null
    });
    
    // Simulate failure on RPC
    mockSupabaseAdmin.rpc.mockResolvedValue({ error: new Error('DB Error') });

    const handler = (createUser as any)._handler;
    try {
      await handler({
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
      expect(mockSupabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('new-user-id');
    }
  });

  it('should use update_user_full RPC for updateUser', async () => {
    const handler = (updateUser as any)._handler;
    await handler({
      data: {
        user_id: 'target-id',
        ho_ten: 'Updated Name',
        roles: ['admin']
      },
      context
    });
    
    expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('update_user_full', expect.objectContaining({
      target_uid: 'target-id'
    }));
  });
});
