import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EditKind, OverrideMap } from "./types";
import { PHYS_TABLE_BY_LAYER } from "./types";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Trash2, Plus, Save, Loader2 } from "lucide-react";

export function NodeEditorSheet({
  target, onClose, overrides, plLabel, lvLabel, nhLabel, htLabel, tbMap,
  saving, onSave, canManage, onDelete,
}: {
  target: { kind: EditKind; ma: string } | null;
  onClose: () => void;
  overrides: OverrideMap | undefined;
  plLabel: (id: string) => string;
  lvLabel: (id: string) => string;
  nhLabel: (ma: string) => string;
  htLabel: (ma: string) => string;
  tbMap: Map<string, any>;

  saving: boolean;
  onSave: (payload: { kind: EditKind; ma: string; ten: string; du_lieu?: Record<string, unknown>; phys?: Record<string, string | number | null> }) => void;
  canManage: boolean;
  onDelete: (kind: EditKind, ma: string, ten: string, label: string) => void;
}) {
  const [ten, setTen] = useState("");
  const [physVals, setPhysVals] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!target) return;
    const baseTen =
      target.kind === "pl" ? plLabel(target.ma)
      : target.kind === "lv" ? lvLabel(target.ma)
      : target.kind === "nh" ? nhLabel(target.ma)
      : target.kind === "ht" ? htLabel(target.ma)
      : tbMap.get(target.ma)?.ten ?? "";
    setTen(baseTen);
  }, [target, plLabel, lvLabel, nhLabel, htLabel, tbMap]);

  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Chỉnh sửa {target?.kind}</SheetTitle>
          <SheetDescription>Cập nhật thông tin chi tiết cho nút trong cây hệ thống.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="node-ten">Tên hiển thị</Label>
            <Input id="node-ten" value={ten} onChange={(e) => setTen(e.target.value)} />
          </div>
        </div>
        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={() => onSave({ kind: target!.kind, ma: target!.ma, ten })}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
