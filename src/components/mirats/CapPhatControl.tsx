import { useRef, useState } from "react";
import { UserCheck, UserMinus, PackageCheck, Building2, Calendar, Loader2, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CAP_PHAT_LABEL } from "@/lib/mirats/db-smart";
import { SignaturePad, type SignaturePadHandle } from "@/components/mirats/SignaturePad";

export interface CapPhatControlProps {
  trangThai: string; // 'san_sang' | 'da_cap_phat'
  nguoiGiu?: string | null;
  donViGiuTen?: string | null;
  ngayCapPhat?: string | null;
  /** Trạng thái ký biên bản bàn giao của lần cấp phát hiện tại. */
  daKy?: boolean;
  thoiDiemKy?: string | null;
  canManage: boolean;
  donViOptions: { id: string; ten: string }[];
  pending?: boolean;
  onCapPhat: (input: { nguoiGiu: string; donViGiuId: string | null; ghiChu: string; chuKyDataUrl: string | null }) => void;
  onThuHoi: (input: { ghiChu: string }) => void;
}

/**
 * Khối cấp phát / thu hồi ở đầu trang chi tiết tài sản.
 * Thuần trình bày: mọi thao tác ghi CSDL được truyền qua onCapPhat / onThuHoi.
 */
export function CapPhatControl({
  trangThai, nguoiGiu, donViGiuTen, ngayCapPhat, daKy, canManage, donViOptions,
  pending, onCapPhat, onThuHoi,
}: CapPhatControlProps) {
  const daCapPhat = trangThai === "da_cap_phat";
  const [openCap, setOpenCap] = useState(false);
  const [openThu, setOpenThu] = useState(false);
  const [nguoi, setNguoi] = useState("");
  const [donViId, setDonViId] = useState<string>("");
  const [ghiChu, setGhiChu] = useState("");
  const sigRef = useRef<SignaturePadHandle>(null);

  const resetCap = () => { setNguoi(""); setDonViId(""); setGhiChu(""); };

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-muted/30 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <PackageCheck className={`h-4 w-4 ${daCapPhat ? "text-amber-600" : "text-emerald-600"}`} />
        <span className="text-sm font-medium">Cấp phát:</span>
        <Badge
          variant="outline"
          className={daCapPhat ? "border-amber-300 bg-amber-50 text-amber-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}
        >
          {CAP_PHAT_LABEL[trangThai] ?? trangThai}
        </Badge>
      </div>

      {daCapPhat && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {nguoiGiu && (
            <span className="flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5" /> <span className="font-medium text-foreground">{nguoiGiu}</span>
            </span>
          )}
          {donViGiuTen && (
            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {donViGiuTen}</span>
          )}
          {ngayCapPhat && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {new Date(ngayCapPhat).toLocaleDateString("vi-VN")}
            </span>
          )}
          <Badge
            variant="outline"
            className={daKy
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-300 bg-slate-50 text-slate-600"}
          >
            <PenLine className="mr-1 h-3 w-3" />
            {daKy ? "Đã ký biên bản" : "Chưa ký"}
          </Badge>
        </div>
      )}

      {canManage && (
        <div className="ml-auto flex items-center gap-2">
          {daCapPhat ? (
            <Button size="sm" variant="outline" onClick={() => setOpenThu(true)} disabled={pending}>
              {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <UserMinus className="mr-1 h-3.5 w-3.5" />}
              Thu hồi
            </Button>
          ) : (
            <Button size="sm" onClick={() => { resetCap(); setOpenCap(true); }} disabled={pending}>
              {pending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <UserCheck className="mr-1 h-3.5 w-3.5" />}
              Cấp phát
            </Button>
          )}
        </div>
      )}

      {/* Dialog cấp phát */}
      <Dialog open={openCap} onOpenChange={setOpenCap}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cấp phát tài sản</DialogTitle>
            <DialogDescription>Chọn người giữ và/hoặc đơn vị nhận tài sản.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cp-nguoi">Người giữ</Label>
              <Input id="cp-nguoi" value={nguoi} onChange={(e) => setNguoi(e.target.value)} placeholder="Họ tên người nhận" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-donvi">Đơn vị giữ</Label>
              <Select value={donViId} onValueChange={setDonViId}>
                <SelectTrigger id="cp-donvi"><SelectValue placeholder="Chọn đơn vị (tuỳ chọn)" /></SelectTrigger>
                <SelectContent>
                  {donViOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.ten}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp-ghichu">Ghi chú</Label>
              <Textarea id="cp-ghichu" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <PenLine className="h-3.5 w-3.5" /> Chữ ký người nhận
                <span className="text-xs font-normal text-muted-foreground">(tuỳ chọn)</span>
              </Label>
              <SignaturePad ref={sigRef} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenCap(false)}>Huỷ</Button>
            <Button
              onClick={() => {
                onCapPhat({
                  nguoiGiu: nguoi.trim(),
                  donViGiuId: donViId || null,
                  ghiChu: ghiChu.trim(),
                  chuKyDataUrl: sigRef.current?.getDataUrl() ?? null,
                });
                setOpenCap(false);
              }}
              disabled={!nguoi.trim() && !donViId}
            >
              Xác nhận cấp phát
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog thu hồi */}
      <Dialog open={openThu} onOpenChange={setOpenThu}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thu hồi tài sản</DialogTitle>
            <DialogDescription>Đưa tài sản về trạng thái sẵn sàng.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Thu hồi tài sản{nguoiGiu ? ` từ ${nguoiGiu}` : ""} về trạng thái sẵn sàng.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="th-ghichu">Ghi chú</Label>
              <Textarea id="th-ghichu" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenThu(false)}>Huỷ</Button>
            <Button
              variant="destructive"
              onClick={() => {
                onThuHoi({ ghiChu: ghiChu.trim() });
                setOpenThu(false);
                setGhiChu("");
              }}
            >
              Xác nhận thu hồi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
