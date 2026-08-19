import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

// Local definition to match DB enum until sync completes
export type ProjectEventType = 
  | 'project_created' | 'project_updated'
  | 'milestone_created' | 'milestone_updated' | 'milestone_deleted'
  | 'task_created' | 'task_updated' | 'task_status_changed' | 'task_completed'
  | 'canvas_published' | 'pitch_created'
  | 'document_uploaded' | 'document_linked'
  | 'correspondence_created'
  | 'delivery_update' | 'operations_update';

export interface ProjectEvent {
  id: string;
  du_an_id: string | null;
  event_type: ProjectEventType;
  entity_type: string;
  entity_id: string;
  title: string;
  summary: string | null;
  actor_id: string | null;
  occurred_at: string | null;
  metadata: any;
  source: string | null;
  created_at: string | null;
}

export function useProjectEvents(projectId: string, filters?: {
  eventType?: ProjectEventType;
  actorId?: string;
  startDate?: string;
  endDate?: string;
  entityType?: string;
  hasDocs?: boolean;
}) {
  return useQuery({
    queryKey: ["project-events", projectId, filters],
    queryFn: async () => {
      let query = supabase
        .from("du_an_su_kien")
        .select(`
          *,
          actor:profiles(id, ho_ten, email)
        `)
        .eq("du_an_id", projectId)
        .order("occurred_at", { ascending: false });

      if (filters?.eventType) query = query.eq("event_type", filters.eventType as any);
      if (filters?.actorId) query = query.eq("actor_id", filters.actorId);
      if (filters?.startDate) query = query.gte("occurred_at", filters.startDate);
      if (filters?.endDate) query = query.lte("occurred_at", filters.endDate);
      if (filters?.entityType) query = query.eq("entity_type", filters.entityType);

      const { data, error } = await query;
      if (error) throw error;
      
      // Map data to ensure required fields for components are present even if null in DB
      // Cast to any to bypass strict enum check until types.ts is regenerated
      const events = (data || []).map(item => ({
        ...item,
        occurred_at: item.occurred_at || new Date().toISOString()
      })) as any[];

      return events as (ProjectEvent & { actor: { id: string; ho_ten: string | null; email: string } | null })[];
    },
  });
}
