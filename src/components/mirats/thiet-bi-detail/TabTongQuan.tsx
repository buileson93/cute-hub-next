import React, { useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { 
  FileText, Package, Factory, Truck, Tag, Building2, 
  Network, Layers, MapPin, Calendar, ShieldCheck, ExternalLink, Pencil
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MauChip } from "@/components/mirats/MauChip";
import { DeviceDetailTabProps } from "./types";
import { LyLichThietBiPanel } from "@/components/mirats/LyLichThietBiPanel";
import { useCellEditor } from "@/lib/mirats/ui/use-cell-editor";
import { Input } from "@/components/ui/input";
import { useCayMutations } from "@/components/mirats/he-thong-cay/mutations";
import { useSession } from "@/hooks/use-session";

export default function TabTongQuan({ 
  tb, ma, tenTb, refInfo, loaiMau, sysName, vaiTroList, pct, canEdit
}: DeviceDetailTabProps) {
  const mutations = useCayMutations();
  const { roles: userRoles } = useSession();
  
  const editor = useCellEditor({
    isRealFor: (kind, id) => (kind === "tb" && id === ma ? { keyVal: id } : null),
    mutations: {
      renameEntity: async (args) => mutations.renameEntity.mutateAsync({ ...args, userRoles }),
      saveCell: async (args) => mutations.saveCell.mutateAsync({ ...args, userRoles }),
      saveNode: async (args) => { /* detail không dùng saveNode */ }
    }
  });
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Cột trái: Định danh & Hình ảnh */}
      <div className="space-y-4 lg:col-span-1">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin tài sản</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {refInfo?.modelImg && (
              <div className="flex items-center justify-center overflow-hidden rounded-md border bg-muted/40 p-2">
                <img src={refInfo.modelImg} alt={refInfo.model || "Model"} className="max-h-40 w-auto object-contain" loading="lazy" />
              </div>
            )}
            <InfoRow icon={FileText} label="Mã tài sản Bravo" value={<span className="font-mono">{tb._maBravo || "—"}</span>} field="ma_tai_san_bravo" canEdit={canEdit} editor={editor} ma={ma} currentValue={tb._maBravo} />
            <InfoRow icon={Package} label="Model" value={
              (refInfo?.model || tb.model)
                ? <span className="inline-flex flex-wrap items-center gap-1.5">
                    <Link to="/danh-muc/model" search={{ q: (refInfo?.model || tb.model) as string }} className="inline-flex items-center gap-1 text-primary hover:underline">{refInfo?.model || tb.model}<ExternalLink className="h-3 w-3" /></Link>
                    {refInfo?.modelPn && <span className="font-mono text-xs text-muted-foreground">· {refInfo.modelPn}</span>}
                  </span>
                : "—"
            } field="model" canEdit={canEdit} editor={editor} ma={ma} currentValue={tb.model} />
            <InfoRow icon={FileText} label="Serial" value={<span className="font-mono">{tb.serial || "—"}</span>} field="ma_serial" canEdit={canEdit} editor={editor} ma={ma} currentValue={tb.serial} />
            <InfoRow icon={Factory} label="Nhà sản xuất" value={
              (refInfo?.nhaSanXuat || tb.nha_san_xuat)
                ? <Link to="/danh-muc/nha-san-xuat" search={{ q: (refInfo?.nhaSanXuat || tb.nha_san_xuat) as string }} className="inline-flex items-center gap-1 text-primary transition-colors hover:underline">{refInfo?.nhaSanXuat || tb.nha_san_xuat}<ExternalLink className="h-3 w-3" /></Link>
                : "—"
            } field="nha_san_xuat" canEdit={canEdit} editor={editor} ma={ma} currentValue={tb.nha_san_xuat} />
            <InfoRow icon={Truck} label="Nhà cung cấp" value={
              (refInfo?.nhaCungCap || tb.nha_cung_cap)
                ? <Link to="/danh-muc/nha-cung-cap" search={{ q: (refInfo?.nhaCungCap || tb.nha_cung_cap) as string }} className="inline-flex items-center gap-1 text-primary transition-colors hover:underline">{refInfo?.nhaCungCap || tb.nha_cung_cap}<ExternalLink className="h-3 w-3" /></Link>
                : "—"
            } field="nha_cung_cap" canEdit={canEdit} editor={editor} ma={ma} currentValue={tb.nha_cung_cap} />
            {(tb._loaiTbTen || tb.loai) && (
              <InfoRow icon={Tag} label="Chủng loại" value={
                <Link to="/danh-muc/loai-thiet-bi" search={{ q: (tb._loaiTbTen || tb.loai) as string }} className="inline-flex items-center gap-2 transition-opacity hover:opacity-80">
                  <MauChip ten={(tb._loaiTbTen || tb.loai) as string} mau={loaiMau ?? null} />
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
              } />
            )}
            <InfoRow icon={Building2} label="Đơn vị quản lý" value={
              (tb.don_vi || tb._donViTen)
                ? <Link to="/danh-muc/don-vi" search={{ f_id: tb._donViGiuId || tb.don_vi }} className="inline-flex items-center gap-1 text-primary hover:underline">{`${tb.don_vi || "—"}${tb._donViTen ? " — " + tb._donViTen : ""}`}<ExternalLink className="h-3 w-3" /></Link>
                : "—"
            } />

            <InfoRow icon={Network} label="Hệ thống" value={
              sysName
                ? <Link to="/danh-muc/he-thong" search={{ f_id: tb._htId || tb.he_thong }} className="inline-flex items-center gap-1 text-primary hover:underline">{sysName}<ExternalLink className="h-3 w-3" /></Link>
                : "—"
            } />

            <InfoRow icon={MapPin} label="Vị trí lắp đặt" value={
              tb.vi_tri
                ? <Link to="/danh-muc/vi-tri" search={{ f_id: tb._viTriId || tb.vi_tri }} className="inline-flex items-center gap-1 text-primary hover:underline">{tb.vi_tri}<ExternalLink className="h-3 w-3" /></Link>
                : "—"
            } />

          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Mã QR</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <div className="rounded-md border bg-white p-3">
              <QRCodeSVG value={`MIRATS:${ma}`} size={120} />
            </div>
            <div className="text-xs font-mono text-muted-foreground">MIRATS:{ma}</div>
          </CardContent>
        </Card>
      </div>

      {/* Cột phải: Vòng đời & Lý lịch rút gọn */}
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Vòng đời & Khai thác</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 text-sm">
              <InfoRow icon={Calendar} label="Ngày mua" value={tb.ngay_mua || "—"} field="ngay_mua" canEdit={canEdit} editor={editor} ma={ma} currentValue={tb.ngay_mua} />
              <InfoRow icon={Calendar} label="Năm khai thác" value={tb._namKhaiThac ? String(tb._namKhaiThac) : (tb.ngay_dua_vao_su_dung || "—")} field="nam_dua_vao_khai_thac" canEdit={canEdit} editor={editor} ma={ma} currentValue={tb._namKhaiThac || tb.ngay_dua_vao_su_dung} />
              <InfoRow icon={ShieldCheck} label="Hạn bảo hành" value={tb.han_bao_hanh || "—"} field="han_bao_hanh" canEdit={canEdit} editor={editor} ma={ma} currentValue={tb.han_bao_hanh} />
            </div>
            <div className="space-y-3">
              {pct != null && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Tỷ lệ tuổi thọ</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-muted">
                    <div className={`h-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
              <InfoRow icon={Tag} label="Phân loại" value={tb._phanLoai || tb._plTen || "—"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Lý lịch tài sản</CardTitle></CardHeader>
          <CardContent>
            <LyLichThietBiPanel thietBiId={tb.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ 
  icon: Icon, label, value, field, canEdit, editor, ma, currentValue 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value: React.ReactNode;
  field?: string;
  canEdit?: boolean;
  editor?: any;
  ma?: string;
  currentValue?: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(currentValue ?? "");

  const handleCommit = async () => {
    if (!field || !editor || !ma) return;
    await editor.commit({
      view: "table",
      kind: "tb",
      ma,
      field,
      value: val,
      previous: currentValue
    });
    setIsEditing(false);
  };

  return (
    <div className="flex items-start gap-3 group relative">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
          {label}
          {canEdit && field && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded transition-all"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
        <div className="break-words font-medium">
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <Input 
                autoFocus
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCommit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                className="h-7 text-xs py-1"
              />
              <button onClick={handleCommit} className="text-[10px] text-primary hover:underline">Lưu</button>
              <button onClick={() => setIsEditing(false)} className="text-[10px] text-muted-foreground hover:underline">Huỷ</button>
            </div>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );
}
