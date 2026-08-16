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
import { Save, Loader2, Trash2, FolderTree, Network, Plus, Cpu, RefreshCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCayMutations } from "./mutations";
import { useCayContext } from "./CayContext";
import { useSession } from "@/hooks/use-session";

export function NodeEditorSheet({
  target, onClose, plLabel, nhLabel, htLabel, tbMap,
  canManage,
  donViList,
}: {
  target: { kind: EditKind; ma: string } | null;
  onClose: () => void;
  plLabel: (id: string) => string;
  nhLabel: (ma: string) => string;
  htLabel: (ma: string) => string;
  tbMap: Map<string, any>;
  canManage: boolean;
  donViList: any[];
}) {
  const { 
    addGroup, addSystem, deleteNode, renameEntity, saveCell, renameGroupCode 
  } = useCayMutations();
  const { setReorgOpen, viewTree, groupCode, setGroupCode } = useCayContext();
  const { roles } = useSession();

  const [ten, setTen] = useState("");
  const [tenMindmap, setTenMindmap] = useState("");
  const [tenMindmapTouched, setTenMindmapTouched] = useState(false);
  const [newGroupTen, setNewGroupTen] = useState("");
  const [newGroupMa, setNewGroupMa] = useState("");
  const [newSystemTen, setNewSystemTen] = useState("");
  const [newSystemDonViId, setNewSystemDonViId] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [addingSystem, setAddingSystem] = useState(false);

  const isReal = target ? (target.kind === "tb" || target.kind === "pl" || target.kind === "lv" || !target.ma.startsWith("custom:")) : false;

  useEffect(() => {
    if (!target) return;
    setGroupCode(target.kind === "nh" ? target.ma : "");
    const tb = tbMap.get(target.ma);
    
    const baseTen =
      target.kind === "pl" ? plLabel(target.ma)
      : target.kind === "lv" ? "Lĩnh vực" 
      : target.kind === "nh" ? nhLabel(target.ma)
      : target.kind === "ht" ? htLabel(target.ma)
      : tb?.ten ?? "";
    
    setTen(baseTen);

    // Chỉ load tenMindmap cho node nháp
    if (!isReal) {
      setTenMindmap(target.kind === "tb" ? (tb?.ten_mindmap ?? "") : (target.kind === "ht" ? htLabel(target.ma) : ""));
      setTenMindmapTouched(false);
    }
  }, [target, plLabel, nhLabel, htLabel, tbMap, isReal, setGroupCode]);

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
            {target && target.kind !== "pl" && (
              <Badge variant="outline" className="shrink-0 border-primary/30 bg-primary/10 font-mono text-meta font-semibold text-primary">
                {target.ma}
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
                <Button size="sm" variant="outline" onClick={() => renameGroupCode.mutate({ ma: target.ma, newMa: groupCode })}>
                  {renameGroupCode.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đổi mã"}
                </Button>
              </div>
            </div>
          )}

          {target?.kind === "tb" && (
            <div className="space-y-4 rounded-md border bg-muted/5 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Cpu className="h-4 w-4" /> Thuộc tính vật lý
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-meta uppercase text-muted-foreground">Số serial</Label>
                  <Input 
                    value={tbMap.get(target.ma)?.ma_serial || ""} 
                    onChange={(e) => saveCell.mutate({ ma: target.ma, col: "ma_serial", value: e.target.value, userRoles: roles })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-meta uppercase text-muted-foreground">Vị trí</Label>
                  <Input 
                    value={tbMap.get(target.ma)?.vi_tri || ""} 
                    onChange={(e) => saveCell.mutate({ ma: target.ma, col: "vi_tri", value: e.target.value, userRoles: roles })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {target && !isReal && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-ten-mm">Tên hiển thị trên sơ đồ (dành cho node nháp)</Label>
              <Input 
                id="edit-ten-mm" 
                value={tenMindmap} 
                onChange={(e) => {
                  setTenMindmap(e.target.value);
                  setTenMindmapTouched(true);
                }} 
                placeholder="Tên ngắn cho node nháp" 
              />
            </div>
          )}

          {target?.kind === "pl" && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <FolderTree className="h-4 w-4 text-violet-600" /> Nhóm hệ thống
              </div>
              {canManage && (
                <div className="space-y-2 border-t pt-3">
                  <Input value={newGroupTen} onChange={(e) => setNewGroupTen(e.target.value)} placeholder="Tên nhóm mới..." />
                  <Input value={newGroupMa} onChange={(e) => setNewGroupMa(e.target.value.toUpperCase())} placeholder="Mã nhóm..." />
                  <Button size="sm" onClick={() => { addGroup.mutate({ plId: target.ma, ten: newGroupTen, ma: newGroupMa }); setNewGroupTen(""); setNewGroupMa(""); }}>
                    <Plus className="h-4 w-4 mr-1" /> Thêm
                  </Button>
                </div>
              )}
            </div>
          )}

          {target?.kind === "nh" && (
            <div className="space-y-3 rounded-md border p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Network className="h-4 w-4 text-primary" /> Hệ thống con
              </div>
              {canManage && (
                <div className="space-y-2 border-t pt-3">
                  <Input value={newSystemTen} onChange={(e) => setNewSystemTen(e.target.value)} placeholder="Tên hệ thống mới..." />
                  <Select value={newSystemDonViId} onValueChange={setNewSystemDonViId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị..." />
                    </SelectTrigger>
                    <SelectContent>
                      {donViList.map(dv => (
                        <SelectItem key={dv.id} value={dv.id}>{dv.ten}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => { addSystem.mutate({ nhMa: target.ma, plId: "HT_KHAC", ten: newSystemTen, donViId: newSystemDonViId }); setNewSystemTen(""); }}>
                    <Plus className="h-4 w-4 mr-1" /> Thêm HT
                  </Button>
                </div>
              )}
            </div>
          )}

          {target?.kind === "ht" && (
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
             <div className="pt-4 border-t text-meta text-muted-foreground italic">
               * Nếu bạn không có quyền ghi trực tiếp, thay đổi sẽ được tạo thành đề xuất phê duyệt.
             </div>
          )}
        </fieldset>


        <div className="space-y-2 border-t pt-3">
          {canManage && (
            <Button 
              className="w-full" 
              onClick={() => {
                if (!target) return;
                
                if (target.kind === "tb") {
                  saveCell.mutate({ 
                    ma: target.ma, 
                    col: "ten", 
                    value: ten, 
                    userRoles: roles 
                  });
                  // Nếu là node nháp và có đổi tên mindmap -> lưu vào cay_node_edit
                  if (!isReal && tenMindmapTouched) {
                    renameEntity.mutate({
                      kind: target.kind,
                      id: target.ma,
                      ten: tenMindmap,
                      draft: true,
                      userRoles: roles
                    } as any);
                  }
                } else {
                  renameEntity.mutate({ 
                    kind: target.kind, 
                    id: target.ma, 
                    ten, 
                    draft: !isReal,
                    userRoles: roles 
                  } as any);
                }
              }} 
              disabled={renameEntity.isPending || saveCell.isPending}
            >
              {(renameEntity.isPending || saveCell.isPending) ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )} 
              Lưu thay đổi
            </Button>
          )}

          {target && (target.kind === "nh" || target.kind === "ht") && canManage && target.ma !== HT_KHAC && (
            <Button variant="outline" className="w-full text-destructive" onClick={() => deleteNode.mutate({ kind: target.kind, ma: target.ma, userRoles: roles })}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Xoá {title}
            </Button>
          )}

          <Button variant="outline" className="w-full" onClick={() => setReorgOpen(true)}>
            <RefreshCcw className="mr-1.5 h-4 w-4" /> Lịch sử thay đổi
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
