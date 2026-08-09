import { useState, useMemo } from "react";
import { Plus, Trash2, ShieldCheck, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface CompatibilityItem {
  he_thong_id: string;
  phan_loai: string;
  danh_gia: string;
}

interface CompatibilityManagerProps {
  value: CompatibilityItem[];
  onChange: (value: CompatibilityItem[]) => void;
  systemOptions: { value: string; label: string }[];
}

const PHAN_LOAI_OPTS = [
  "Thay thế trực tiếp",
  "Dự phòng phụ",
  "Tương đương",
  "Khác",
];

export function CompatibilityManager({ value, onChange, systemOptions }: CompatibilityManagerProps) {
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<CompatibilityItem>({
    he_thong_id: "",
    phan_loai: "Thay thế trực tiếp",
    danh_gia: "",
  });

  const usedSystemIds = useMemo(() => new Set(value.map(v => v.he_thong_id)), [value]);
  const availableOptions = useMemo(() => 
    systemOptions.filter(opt => !usedSystemIds.has(opt.value)),
    [systemOptions, usedSystemIds]
  );

  const add = () => {
    if (!newItem.he_thong_id) return;
    onChange([...value, newItem]);
    setNewItem({ he_thong_id: "", phan_loai: "Thay thế trực tiếp", danh_gia: "" });
    setAdding(false);
  };

  const remove = (id: string) => {
    onChange(value.filter(v => v.he_thong_id !== id));
  };

  const update = (id: string, updates: Partial<CompatibilityItem>) => {
    onChange(value.map(v => v.he_thong_id === id ? { ...v, ...updates } : v));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Hệ thống có thể thay thế
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  Xác định vật tư này có thể dùng dự phòng/thay thế cho những hệ thống nào. 
                  Một vật tư có thể thay thế cho nhiều hệ thống khác nhau tùy theo đánh giá kỹ thuật.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {!adding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Thêm hệ thống
          </Button>
        )}
      </div>

      {adding && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Hệ thống</Label>
                <Combobox
                  options={availableOptions}
                  value={newItem.he_thong_id}
                  onChange={(val) => setNewItem(prev => ({ ...prev, he_thong_id: val }))}
                  placeholder="Chọn hệ thống..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Phân loại</Label>
                <Select
                  value={newItem.phan_loai}
                  onValueChange={(val) => setNewItem(prev => ({ ...prev, phan_loai: val }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHAN_LOAI_OPTS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Đánh giá khả năng thay thế</Label>
              <Input
                className="h-9"
                placeholder="VD: Có thể thay thế trực tiếp, cần cài đặt lại cấu hình..."
                value={newItem.danh_gia}
                onChange={(e) => setNewItem(prev => ({ ...prev, danh_gia: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Hủy</Button>
              <Button type="button" size="sm" disabled={!newItem.he_thong_id} onClick={add}>Xác nhận</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {value.length === 0 && !adding && (
          <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
            Chưa có thông tin hệ thống tương thích
          </div>
        )}
        {value.map((item) => {
          const sys = systemOptions.find(o => o.value === item.he_thong_id);
          return (
            <div key={item.he_thong_id} className="group relative flex flex-col sm:flex-row gap-3 p-3 rounded-lg border bg-card hover:border-emerald-500/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{sys?.label ?? "Hệ thống không xác định"}</span>
                  <Badge variant="secondary" className="text-[10px] py-0 h-5">
                    {item.phan_loai}
                  </Badge>
                </div>
                {item.danh_gia ? (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">“{item.danh_gia}”</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Chưa có đánh giá chi tiết</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => remove(item.he_thong_id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
