import React, { useState } from "react";
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

export function LeanUXCanvas({ project_id, initialData }: { project_id: string; initialData?: CanvasData }) {
  const [data, setData] = useState<CanvasData>(initialData || {
    business_problem: "",
    business_outcomes: "",
    users_customers: "",
    user_benefits: "",
    solution_ideas: "",
    hypotheses: "",
    riskiest_assumptions: "",
    first_steps_experiments: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = data.id 
        ? await (supabase.from("lean_ux_canvases" as any) as any).update(data).eq("id", data.id)
        : await (supabase.from("lean_ux_canvases" as any) as any).insert({ ...data, project_id } as any);
      
      if (error) throw error;
      toast.success("Đã lưu Lean UX Canvas");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

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
          value={data.business_problem}
          onChange={(v) => setData({ ...data, business_problem: v })}
        />
        <CanvasSection 
          title="2. Business Outcomes" 
          description="Thay đổi hành vi đo được, baseline/target/timeframe."
          value={data.business_outcomes}
          onChange={(v) => setData({ ...data, business_outcomes: v })}
        />
        <CanvasSection 
          title="3. Users & Customers" 
          description="Nhóm người dùng chịu ảnh hưởng."
          value={data.users_customers}
          onChange={(v) => setData({ ...data, users_customers: v })}
        />
        <CanvasSection 
          title="4. User Benefits" 
          description="Nhu cầu, động lực và giá trị."
          value={data.user_benefits}
          onChange={(v) => setData({ ...data, user_benefits: v })}
        />
        <CanvasSection 
          title="5. Solution Ideas" 
          description="Ý tưởng sơ bộ, chưa biến thành cam kết build."
          value={data.solution_ideas}
          onChange={(v) => setData({ ...data, solution_ideas: v })}
        />
        <CanvasSection 
          title="6. Hypotheses" 
          description="Phát biểu có thể kiểm chứng."
          value={data.hypotheses}
          onChange={(v) => setData({ ...data, hypotheses: v })}
          placeholder="“Chúng tôi tin rằng [business outcome] sẽ đạt được nếu [users] nhận được [benefit] nhờ [solution]...”"
        />
        <CanvasSection 
          title="7. Riskiest Assumptions" 
          description="Giả định rủi ro nhất + impact/confidence/evidence."
          value={data.riskiest_assumptions}
          onChange={(v) => setData({ ...data, riskiest_assumptions: v })}
        />
        <CanvasSection 
          title="8. First Steps / Experiments" 
          description="Thử nghiệm nhỏ nhất, metric, threshold, owner, due date và result."
          value={data.first_steps_experiments}
          onChange={(v) => setData({ ...data, first_steps_experiments: v })}
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
