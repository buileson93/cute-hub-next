import { Laptop, ShieldCheck, CheckCircle2, XCircle, AlertCircle, Info, Download, Filter, Search, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/thong-ke/laptop")({
  component: LaptopStatsPage,
  head: () => ({
    meta: [
      { title: "Thống kê Laptop & Bản quyền — MIRATS" },
      { name: "description", content: "Thống kê chi tiết máy tính laptop theo nhân viên và tình trạng bản quyền phần mềm." },
    ],
  }),
});

type LaptopStatsRow = {
  id: string;
  ma_nhan_vien: string;
  ho_ten: string;
  don_vi: string | null;
  chuc_vu: string | null;
  laptops: Array<{
    id: string;
    ma_thiet_bi: string;
    ten_thiet_bi: string;
    ma_serial: string | null;
    model: string | null;
    software: Array<{
      id: string;
      ten_phan_mem: string;
      ma_ban_quyen: string;
      so_ghe: number | null;
      ghe_da_dung: number;
    }>;
  }>;
};

function LaptopStatsPage() {
  const [q, setQ] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");

  const { data: stats = [], isLoading } = useQuery({
    queryKey: ["stats", "laptop-employee"],
    queryFn: async (): Promise<LaptopStatsRow[]> => {
      // 1. Lấy danh sách nhân viên
      const { data: employees, error: empErr } = await supabase
        .from("nhan_vien")
        .select("id, ma_nhan_vien, ho_ten, don_vi, chuc_vu")
        .order("ho_ten");
      
      if (empErr) throw empErr;

      // 2. Lấy danh sách laptop và phần mềm cấp phát
      const { data: assets, error: assetErr } = await supabase
        .from("thiet_bi")
        .select(`
          id, ma_thiet_bi, ten_thiet_bi, ma_serial, nhan_vien_id,
          dm_loai_thiet_bi!inner(la_may_tinh),
          dm_model(ten),
          phan_mem_ban_quyen_cap_phat(
            id, ngay_thu_hoi,
            phan_mem_ban_quyen(id, ten_phan_mem, ma_ban_quyen, so_ghe)
          )
        `)
        .eq("dm_loai_thiet_bi.la_may_tinh", true);
      
      if (assetErr) throw assetErr;

      // Type cast to any because of complex joins not fully typed in Supabase client
      const rawAssets = (assets as any) || [];

      // 3. Lấy số lượng ghế đã dùng cho mỗi bản quyền để tính ghế trống
      const { data: capPhatCount, error: countErr } = await supabase
        .from("phan_mem_ban_quyen_cap_phat")
        .select("ban_quyen_id")
        .is("ngay_thu_hoi", null);
      
      if (countErr) throw countErr;

      const usageMap = new Map<string, number>();
      (capPhatCount || []).forEach(cp => {
        usageMap.set(cp.ban_quyen_id, (usageMap.get(cp.ban_quyen_id) || 0) + 1);
      });

      // 4. Map dữ liệu
      return (employees || []).map(emp => {
        const empLaptops = rawAssets
          .filter((a: any) => a.nhan_vien_id === emp.id)
          .map((a: any) => ({
            id: a.id,
            ma_thiet_bi: a.ma_thiet_bi,
            ten_thiet_bi: a.ten_thiet_bi,
            ma_serial: a.ma_serial,
            model: a.dm_model?.ten || null,
            software: (a.phan_mem_ban_quyen_cap_phat || [])
              .filter((cp: any) => !cp.ngay_thu_hoi)
              .map((cp: any) => ({
                id: cp.phan_mem_ban_quyen.id,
                ten_phan_mem: cp.phan_mem_ban_quyen.ten_phan_mem,
                ma_ban_quyen: cp.phan_mem_ban_quyen.ma_ban_quyen,
                so_ghe: cp.phan_mem_ban_quyen.so_ghe,
                ghe_da_dung: usageMap.get(cp.phan_mem_ban_quyen.id) || 0
              }))
          }));

        return {
          id: emp.id,
          ma_nhan_vien: emp.ma_nhan_vien,
          ho_ten: emp.ho_ten,
          don_vi: emp.don_vi,
          chuc_vu: emp.chuc_vu,
          laptops: empLaptops
        };
      });
    }
  });

  const filteredStats = useMemo(() => {
    return stats.filter(row => {
      const matchText = !q || row.ho_ten.toLowerCase().includes(q.toLowerCase()) || row.ma_nhan_vien.toLowerCase().includes(q.toLowerCase());
      const matchUnit = unitFilter === "all" || row.don_vi === unitFilter;
      return matchText && matchUnit;
    });
  }, [stats, q, unitFilter]);

  const units = useMemo(() => {
    const set = new Set(stats.map(s => s.don_vi).filter(Boolean));
    return Array.from(set).sort();
  }, [stats]);

  const kpis = useMemo(() => {
    let assignedLaptops = 0;
    let totalSoftware = 0;
    let employeesWithLaptop = 0;

    filteredStats.forEach(s => {
      if (s.laptops.length > 0) {
        employeesWithLaptop++;
        assignedLaptops += s.laptops.length;
        s.laptops.forEach(l => {
          totalSoftware += l.software.length;
        });
      }
    });

    return { assignedLaptops, totalSoftware, employeesWithLaptop };
  }, [filteredStats]);

  const columns: StdColumn<LaptopStatsRow>[] = [
    {
      key: "ho_ten",
      label: "Nhân viên",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sm">{row.ho_ten}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-mono">{row.ma_nhan_vien}</div>
          </div>
        </div>
      )
    },
    { key: "don_vi", label: "Đơn vị", filter: "cat" },
    {
      key: "laptops",
      label: "Máy tính & Bản quyền",
      cell: (row) => (
        <div className="space-y-2 py-1">
          {row.laptops.length === 0 ? (
            <span className="text-xs text-muted-foreground italic">— Chưa gán máy tính —</span>
          ) : (
            row.laptops.map(l => (
              <div key={l.id} className="rounded-lg border bg-muted/30 p-2 text-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Laptop className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold">{l.ten_thiet_bi}</span>
                    <span className="text-muted-foreground font-mono">({l.ma_thiet_bi})</span>
                  </div>
                  {l.ma_serial && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">SN: {l.ma_serial}</Badge>}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {l.software.length === 0 ? (
                    <Badge variant="destructive" className="gap-1 text-[9px] px-1.5 py-0 h-5">
                      <XCircle className="h-2.5 w-2.5" /> Chưa có bản quyền
                    </Badge>
                  ) : (
                    l.software.map(sw => {
                      const gheTrong = sw.so_ghe === null ? null : sw.so_ghe - sw.ghe_da_dung;
                      const hetGhe = gheTrong !== null && gheTrong <= 0;
                      return (
                        <Badge key={sw.id} variant="outline" className="gap-1 bg-background text-[9px] px-1.5 py-0 flex flex-col items-start h-auto py-1">
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                            <span className="font-medium">{sw.ten_phan_mem}</span>
                          </div>
                          <div className={`text-[8px] ${hetGhe ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                            {sw.so_ghe === null ? "Ghế: ∞" : `Còn ${gheTrong}/${sw.so_ghe} ghế`}
                          </div>
                        </Badge>
                      );
                    })
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )
    }
  ];

  return (
    <div className={`space-y-6 ${UI_DENSITY.PAGE_PADDING}`}>
      <PageHeader
        icon={Laptop}
        title="Thống kê Máy tính & Bản quyền"
        subtitle="Quản lý chi tiết tình trạng cấp phát thiết bị và phần mềm theo nhân sự"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 shadow-sm">
              <Download className="h-4 w-4" /> Xuất Excel
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-primary/10 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">Nhân viên có máy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{kpis.employeesWithLaptop}</div>
            <div className="text-[10px] text-muted-foreground font-medium mt-1">Trong tổng số {filteredStats.length} nhân viên (theo bộ lọc)</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-emerald-100 bg-emerald-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-700">Tổng máy tính đã gán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700">{kpis.assignedLaptops}</div>
            <div className="text-[10px] text-muted-foreground font-medium mt-1">Laptop/PC đang được nhân viên phụ trách</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-amber-100 bg-amber-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-700">Bản quyền đã cấp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-700">{kpis.totalSoftware}</div>
            <div className="text-[10px] text-muted-foreground font-medium mt-1">Giấy phép phần mềm đang hoạt động trên máy</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-end">
        <div className="w-full md:max-w-sm space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tìm kiếm nhân viên</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tên hoặc mã nhân viên..."
              className="pl-9 bg-background shadow-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-64 space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Lọc đơn vị</label>
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger className="bg-background shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Tất cả đơn vị" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả đơn vị</SelectItem>
              {units.map(u => (
                <SelectItem key={u} value={u || "khac"}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-sm border-muted/60 overflow-hidden">
        <CardContent className="p-0">
          <StandardTable
            tableKey="laptop_stats"
            columns={columns}
            rows={filteredStats}
            getRowId={(r) => r.id}
            trangThai={{ dangTai: isLoading }}
            requireFilterToShow={false}
            autoFit={true}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4">
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-bold text-blue-900">Mẹo vận hành</div>
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            Sử dụng chức năng này để rà soát các máy tính laptop chưa được cài đặt phần mềm bản quyền cần thiết hoặc các bản quyền đã hết "ghế" (seats) để có kế hoạch gia hạn kịp thời.
          </p>
        </div>
      </div>
    </div>
  );
}
