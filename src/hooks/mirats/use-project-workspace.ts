import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";

export function useProjectWorkspace(projectId: string) {
  const qc = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ["du-an", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("du_an").select("*").eq("id", projectId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const milestonesQuery = useQuery({
    queryKey: ["du-an-moc", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("du_an_moc").select("*").eq("du_an_id", projectId).order("thu_tu");
      if (error) throw error;
      return data || [];
    },
  });

  const tasksQuery = useQuery({
    queryKey: ["du-an-cv", projectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("du_an_cong_viec").select("*").eq("du_an_id", projectId).order("created_at");
      if (error) throw error;
      return data || [];
    },
  });

  const invalidateWorkspace = () => {
    qc.invalidateQueries({ queryKey: ["du-an", projectId] });
    qc.invalidateQueries({ queryKey: ["du-an-moc", projectId] });
    qc.invalidateQueries({ queryKey: ["du-an-cv", projectId] });
    qc.invalidateQueries({ queryKey: ["lean-ux-canvas", projectId] });
    qc.invalidateQueries({ queryKey: ["hill-chart", projectId] });
    qc.invalidateQueries({ queryKey: ["dossier-docs", projectId] });
    qc.invalidateQueries({ queryKey: ["cong-van", projectId] });
  };

  return {
    project: projectQuery.data,
    milestones: milestonesQuery.data,
    tasks: tasksQuery.data,
    isLoading: projectQuery.isLoading || milestonesQuery.isLoading || tasksQuery.isLoading,
    invalidateWorkspace,
  };
}
