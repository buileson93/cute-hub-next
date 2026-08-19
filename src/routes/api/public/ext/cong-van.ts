import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { verifyApiKey } from '@/lib/mirats/auth/api-keys.functions';

const extCongVanSchema = z.object({
  project_id: z.string().uuid(),
  so_cong_van: z.string().min(1),
  trich_yeu: z.string().optional(),
  loai: z.enum(["den", "di", "to_trinh", "bao_cao", "quyet_dinh", "khac"]).default('den'),
  ngay_ban_hanh: z.string().optional(),
  co_quan_ban_hanh: z.string().optional(),
  file_url: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});


export const Route = createFileRoute('/api/public/ext/cong-van')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid Authorization header' }), { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const token = authHeader.replace('Bearer ', '');
          const { isValid, user_id, scopes } = await verifyApiKey(token);

          if (!isValid) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid API key' }), { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // Scope check: project_correspondence:write
          if (!scopes?.includes('project_correspondence:write')) {
            return new Response(JSON.stringify({ error: 'Forbidden: Insufficient scopes' }), { 
              status: 403,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const { supabaseAdmin } = await import('@/integrations/backend/admin.server');
          const body = await request.json();
          const data = extCongVanSchema.parse(body);

          // We use user_id from the verified API key for logging or RLS if necessary, 
          // although supabaseAdmin bypasses RLS, we should still respect the user's identity.
          const { data: inserted, error } = await supabaseAdmin
            .from('du_an_cong_van' as any)
            .insert({
              du_an_id: data.project_id,
              so_cong_van: data.so_cong_van,
              trich_yeu: data.trich_yeu,
              loai: data.loai,
              ngay_ban_hanh: data.ngay_ban_hanh,
              co_quan_ban_hanh: data.co_quan_ban_hanh,
              metadata: { 
                ...(data.metadata || {}), 
                created_by_api_key: true,
                actor_user_id: user_id 
              } as any,
              trang_thai: 'moi'
            } as any)
            .select()
            .single();

          if (error) throw error;

          // Log the event
          try {
            await supabaseAdmin.rpc('fn_log_project_event', {
              p_project_id: data.project_id,
              p_event_type: 'correspondence_created',
              p_summary: `Công văn ${data.so_cong_van} được tạo qua Browser Extension`,
              p_actor_id: user_id,
              p_metadata: { correspondence_id: (inserted as any).id }
            });
          } catch (logErr) {
            console.warn('Failed to log project event:', logErr);
          }

          return new Response(JSON.stringify({ success: true, id: (inserted as any).id }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (err: any) {
          console.error('[ext-api] error:', err);
          return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
  }
});
