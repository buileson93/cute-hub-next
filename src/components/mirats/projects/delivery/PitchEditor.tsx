import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Loader2, AlertTriangle, XCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PitchEditor({ project_id, initialData, onSave }: { project_id: string; initialData?: any; onSave?: (data: any) => void }) {
  const [data, setData] = useState(initialData || {
    title: "",
    problem: "",
    appetite: "big",
    solution: "",
    rabbit_holes: "",
    no_gos: ""
  });
  const [saving, setSaving] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Shaping a Pitch</h2>
          <p className="text-sm text-slate-500">Định hình tính năng cốt lõi trước khi vào Build Cycle.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">Hủy</Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Lưu Pitch
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-none">
            <CardHeader className="pb-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase text-slate-500 font-bold">Tiêu đề Pitch</Label>
                  <Input 
                    value={data.title} 
                    onChange={e => setData({...data, title: e.target.value})}
                    placeholder="VD: Tích hợp thanh toán QR, Hệ thống báo cáo tự động..."
                    className="text-lg font-semibold mt-1"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <Label className="text-xs uppercase text-slate-500 font-bold">Appetite (Ngân sách)</Label>
                    <Select value={data.appetite} onValueChange={v => setData({...data, appetite: v})}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small Batch (1-2 tuần)</SelectItem>
                        <SelectItem value="big">Big Batch (6 tuần)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-2">
                  1. Problem
                  <Badge variant="secondary" className="font-normal text-[10px]">Evidence-based</Badge>
                </Label>
                <Textarea 
                  value={data.problem} 
                  onChange={e => setData({...data, problem: e.target.value})}
                  placeholder="Vấn đề/điểm nghẽn đã có evidence..."
                  className="min-h-[100px] text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-2">
                  2. Solution
                  <Badge variant="secondary" className="font-normal text-[10px]">Fat-marker flow</Badge>
                </Label>
                <Textarea 
                  value={data.solution} 
                  onChange={e => setData({...data, solution: e.target.value})}
                  placeholder="Breadboard hoặc flow ở mức đủ định hướng..."
                  className="min-h-[200px] text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-rose-100 bg-rose-50/30 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> 3. Rabbit Holes
              </CardTitle>
              <CardDescription className="text-xs">Rủi ro kỹ thuật, phụ thuộc, unknown và mitigation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={data.rabbit_holes} 
                onChange={e => setData({...data, rabbit_holes: e.target.value})}
                placeholder="Những thứ có thể làm chệch hướng cycle..."
                className="min-h-[120px] text-sm bg-white"
              />
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50/50 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <XCircle className="h-4 w-4" /> 4. No-Gos
              </CardTitle>
              <CardDescription className="text-xs">Nội dung cố ý không làm trong cycle.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={data.no_gos} 
                onChange={e => setData({...data, no_gos: e.target.value})}
                placeholder="Để bảo vệ appetite, chúng tôi sẽ KHÔNG..."
                className="min-h-[120px] text-sm bg-white"
              />
            </CardContent>
          </Card>

          <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 text-indigo-700">
            <div className="flex gap-2">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-[11px] leading-relaxed">
                <strong>Ghi chú:</strong> Shaping là để định hướng team, không phải PRD chi tiết. Hãy để lại không gian cho team tự chủ giải quyết vấn đề trong cycle.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
