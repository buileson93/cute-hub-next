import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2, History } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/backend/client";
import { Blockquote } from "@/components/ui/blockquote";
import { Info } from "lucide-react";

interface CanvasData {
  id?: string;
  business_problem: string;
  business_outcomes: string;
  users_customers: string;
  user_benefits: string;
  solution_ideas: string;
  hypotheses: string;
  riskiest_assumptions: string;
  first_steps_experiments: string;
}

export function LeanUXCanvas({ project_id }: { project_id: string }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["lean-ux-canvas", project_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lean_ux_canvases" as any)
        .select("*")
        .eq("project_id", project_id)
        .maybeSingle();
      if (error) throw error;
      return data as CanvasData;
    },
  });

  const [form, setForm] = useState<CanvasData>({
    business_problem: "",
    business_outcomes: "",
    users_customers: "",
    user_benefits: "",
    solution_ideas: "",
    hypotheses: "",
    riskiest_assumptions: "",
    first_steps_experiments: "",
  });

  React.useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, project_id };
      const { data: saved, error } = form.id 
        ? await supabase.from("lean_ux_canvases" as any).update(payload).eq("id", form.id).select().single()
        : await supabase.from("lean_ux_canvases" as any).insert(payload).select().single();
      
      if (error) throw error;
      setForm(saved);
      qc.invalidateQueries({ queryKey: ["lean-ux-canvas", project_id] });
      toast.success("Đã lưu Lean UX Canvas");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-4 text-xs text-slate-500">Đang tải canvas...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Lean UX Canvas</h2>
          <Blockquote className="mt-2 text-indigo-700 bg-indigo-50/50 border-indigo-200">
            <div className="flex items-center gap-2 text-[11px] italic">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>Discovery đúng vấn đề bằng Lean UX Canvas và hypothesis/experiment.</span>
            </div>
          </Blockquote>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Lưu Canvas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CanvasSection 
          title="1. Business Problem" 
          description="Khía cạnh sản phẩm/doanh nghiệp đang hoạt động kém."
          value={form.business_problem}
          onChange={(v) => setForm({ ...form, business_problem: v })}
        />
        <CanvasSection 
          title="2. Business Outcomes" 
          description="Thay đổi hành vi đo được, baseline/target/timeframe."
          value={form.business_outcomes}
          onChange={(v) => setForm({ ...form, business_outcomes: v })}
        />
        <CanvasSection 
          title="3. Users & Customers" 
          description="Nhóm người dùng chịu ảnh hưởng."
          value={form.users_customers}
          onChange={(v) => setForm({ ...form, users_customers: v })}
        />
        <CanvasSection 
          title="4. User Benefits" 
          description="Nhu cầu, động lực và giá trị."
          value={form.user_benefits}
          onChange={(v) => setForm({ ...form, user_benefits: v })}
        />
        <CanvasSection 
          title="5. Solution Ideas" 
          description="Ý tưởng sơ bộ, chưa biến thành cam kết build."
          value={form.solution_ideas}
          onChange={(v) => setForm({ ...form, solution_ideas: v })}
        />
        <CanvasSection 
          title="6. Hypotheses" 
          description="Phát biểu có thể kiểm chứng."
          value={form.hypotheses}
          onChange={(v) => setForm({ ...form, hypotheses: v })}
          placeholder="“Chúng tôi tin rằng [business outcome] sẽ đạt được nếu [users] nhận được [benefit] nhờ [solution]...”"
        />
        <CanvasSection 
          title="7. Riskiest Assumptions" 
          description="Giả định rủi r nhất + impact/confidence/evidence."
          value={form.riskiest_assumptions}
          onChange={(v) => setForm({ ...form, riskiest_assumptions: v })}
        />
        <CanvasSection 
          title="8. First Steps / Experiments" 
          description="Thử nghiệm nhỏ nhất, metric, threshold, owner, due date và result."
          value={form.first_steps_experiments}
          onChange={(v) => setForm({ ...form, first_steps_experiments: v })}
        />
      </div>
    </div>
  );
}

function CanvasSection({ title, description, value, onChange, placeholder }: { title: string; description: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Card className="border-slate-200 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Nhập nội dung..."}
          className="min-h-[120px] resize-none text-sm border-none bg-slate-50 focus-visible:ring-1 focus-visible:ring-indigo-500"
        />
      </CardContent>
    </Card>
  );
}
