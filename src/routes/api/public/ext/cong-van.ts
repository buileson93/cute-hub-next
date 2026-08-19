import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { supabaseAdmin } from '@/integrations/backend/admin.server';

const extCongVanSchema = z.object({
  project_id: z.string().uuid(),
  so_cong_van: z.string().min(1),
  trich_yeu: z.string().optional(),
  loai: z.string().default('van_ban_den'),
  ngay_ban_hanh: z.string().optional(),
  co_quan_ban_hanh: z.string().optional(),
  file_url: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

export const Route = createFileRoute('/api/public/ext/cong-van')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = request.headers.get('x-mirats-api-key');
          if (!apiKey || apiKey !== process.env.MIRATS_EXT_API_KEY) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const body = await request.json();
          const data = extCongVanSchema.parse(body);

          const { data: inserted, error } = await supabaseAdmin
            .from('du_an_cong_van')
            .insert({
              du_an_id: data.project_id,
              so_cong_van: data.so_cong_van,
              trich_yeu: data.trich_yeu,
              loai: data.loai,
              ngay_ban_hanh: data.ngay_ban_hanh,
              co_quan_ban_hanh: data.co_quan_ban_hanh,
              metadata: data.metadata || {},
              trang_thai: 'moi'
            })
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify({ success: true, id: inserted.id }), {
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
