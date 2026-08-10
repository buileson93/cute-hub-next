import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { EditKind, OverrideMap, HtGroup } from "./types";
import { HT_KHAC } from "@/lib/mirats/phan-loai";
import { physKeyValue } from "@/lib/mirats/editable-columns";
import { ThanhPhanManager } from "@/components/mirats/ThanhPhanManager";
import { HeThongTruongEditor } from "@/components/mirats/HeThongTruongEditor";
import { Save, Loader2, Trash2, FolderTree, Network, Plus, Cpu } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function NodeEditorSheet({
  target, onClose, plLabel, nhLabel, htLabel, tbMap,
  saving, onSave, canManage, onDelete,
  unitCodeOf, isCustomNode, isRealNode,
  plGroups, onAddGroup,
  childInfo, onAddSystem, donViList,
  physSection, submit, renamingGroupCode, groupCode, setGroupCode, onRenameGroupCode, slugMa
}: {
  target: { kind: EditKind; ma: string } | null;
  onClose: () => void;
  plLabel: (id: string) => string;
  nhLabel: (ma: string) => string;
  htLabel: (ma: string) => string;
  tbMap: Map<string, any>;
  saving: boolean;
  onSave: (payload: any) => void;
  canManage: boolean;
  onDelete: (kind: EditKind, ma: string, ten: string, label: string) => void;
  unitCodeOf: (kind: string, ma: string) => string | null;
  isCustomNode: (kind: string, ma: string) => boolean;
  isRealNode: (kind: string, ma: string) => boolean;
  plGroups: any[];
  onAddGroup: (plId: string, ten: string, ma: string) => void;
  childInfo: any;
  onAddSystem: (nhMa: string, plId: string, ten: string, donViId: string) => void;
  donViList: any[];
  physSection: React.ReactNode;
  submit: () => void;
  renamingGroupCode: boolean;
  groupCode: string;
  setGroupCode: (s: string) => void;
  onRenameGroupCode: (ma: string, newMa: string) => void;
  slugMa: (s: string) => string;
}) {
  const [ten, setTen] = useState("");
  const [tenMindmap, setTenMindmap] = useState("");
  const [newGroupTen, setNewGroupTen] = useState("");
  const [newGroupMa, setNewGroupMa] = useState("");
  const [newGroupMaTouched, setNewGroupMaTouched] = useState(false);
  const [newSystemTen, setNewSystemTen] = useState("");
  const [newSystemDonViId, setNewSystemDonViId] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingSystem, setAddingSystem] = useState(false);

  useEffect(() => {
    if (!target) return;
    const baseTen =
      target.kind === "pl" ? plLabel(target.ma)
      : target.kind === "lv" ? "Lĩnh vực" // placeholder
      : target.kind === "nh" ? nhLabel(target.ma)
      : target.kind === "ht" ? htLabel(target.ma)
      : tbMap.get(target.ma)?.ten ?? "";
    setTen(baseTen);
  }, [target, plLabel, nhLabel, htLabel, tbMap]);

  const title = target ? (
    target.kind === "pl" ? "Phân loại"
    : target.kind === "nh" ? "Nhóm hệ thống"
    : target.kind === "ht" ? "Hệ thống"
    : "Tài sản"
  ) : "";

  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>{title}</span>
            {target && unitCodeOf(target.kind, target.ma) && (
              <Badge variant="outline" className="shrink-0 border-primary/30 bg-primary/10 font-mono text-[11px] font-semibold text-primary">
                {unitCodeOf(target.kind, target.ma)}
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {canManage ? "Thay đổi được lưu vào cơ sở dữ liệu." : "Chế độ xem (chỉ đọc)."}
          </SheetDescription>
        </SheetHeader>

        <fieldset disabled={!canManage} className="flex-1 space-y-4 overflow-y-auto px-0 py-4 border-0">
          <div className="space-y-1.5">
            <Label htmlFor="edit-ten">Tên đầy đủ</Label>
            <Input id="edit-ten" value={ten} onChange={(e) => setTen(e.target.value)} />
          </div>

          {target?.kind === "nh" && canManage && target.ma !== HT_KHAC && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-group-ma" className="text-xs">Mã nhóm hệ thống</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-group-ma" value={groupCode} onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                  className="font-mono text-xs uppercase" placeholder="MÃ NHÓM"
                />
                <Button size="sm" variant="outline" onClick={() => onRenameGroupCode(target.ma, groupCode)}>
                  {renamingGroupCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đổi mã"}
                </Button>
              </div>
            </div>
          )}

          {physSection}

          {target && !isRealNode(target.kind, target.ma) && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-ten-mm">Tên hiển thị trên sơ đồ</Label>
              <Input id="edit-ten-mm" value={tenMindmap} onChange={(e) => setTenMindmap(e.target.value)} placeholder="Tên ngắn" />
            </div>
          )}

          {target?.kind === "pl" && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <FolderTree className="h-4 w-4 text-violet-600" /> Nhóm hệ thống ({plGroups.length})
              </div>
              <ul className="space-y-1">
                {plGroups.map((g) => (
                  <li key={g.ma} className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-sm">
                    <span className="truncate">{g.ten}</span>
                  </li>
                ))}
              </ul>
              {canManage && (
                <div className="space-y-2 border-t pt-3">
                  <Input value={newGroupTen} onChange={(e) => setNewGroupTen(e.target.value)} placeholder="Tên nhóm mới..." />
                  <Button size="sm" onClick={() => { onAddGroup(target.ma, newGroupTen, newGroupMa); setNewGroupTen(""); }}>
                    <Plus className="h-4 w-4 mr-1" /> Thêm
                  </Button>
                </div>
              )}
            </div>
          )}

          {target?.kind === "ht" && !isCustomNode("ht", target.ma) && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Cpu className="h-4 w-4 text-sky-600" /> Thành phần hệ thống
              </div>
              <ThanhPhanManager heThongId={physKeyValue("ht", target.ma)} canManage={canManage} />
            </div>
          )}

          {target?.kind === "ht" && <HeThongTruongEditor heThongId={target.ma} canManage={canManage} scope="he_thong" />}
          {target?.kind === "tb" && <HeThongTruongEditor heThongId={target.ma} canManage={canManage} scope="thiet_bi" />}
          {target?.kind === "tb" && (
             <div className="pt-4 border-t text-[10px] text-muted-foreground italic">
               * Nếu bạn không có quyền ghi trực tiếp, thay đổi sẽ được tạo thành đề xuất phê duyệt.
             </div>
          )}
        </fieldset>


        <div className="space-y-2 border-t pt-3">
          {canManage && (
            <Button 
              className="w-full" 
              onClick={() => {
                if (target?.kind === "tb") {
                  // Gọi saveCell cho ten_thiet_bi qua Change Request logic nếu cần
                  onSave({ ten });
                } else {
                  submit();
                }
              }} 
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />} Lưu thay đổi
            </Button>
          )}

          {target && (target.kind === "nh" || target.kind === "ht") && canManage && target.ma !== HT_KHAC && (
            <Button variant="outline" className="w-full text-destructive" onClick={() => onDelete(target.kind, target.ma, ten, title)}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Xoá {title}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
