import { useMemo, useState } from "react";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Waypoints, Plus, Trash2, Building2, Clock, Loader2, Network, Check, ChevronsUpDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useScope } from "@/lib/mirats/scope";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Combobox } from "@/components/mirats/Combobox";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SoDoTabs } from "@/components/mirats/SoDoTabs";

export const Route = createFileRoute("/_app/so-do/")({
  head: () => ({
    meta: [
      { title: "Sơ đồ hệ thống — Tài sản MIRATS" },
      { name: "description", content: "Vẽ sơ đồ hệ thống, gắn hệ thống/đơn vị và đính kèm bản vẽ file." },
    ],
  }),
  component: SoDoListPage,
});

type SoDo = {
  id: string;
  ten: string;
  mo_ta: string | null;
  don_vi_ma: string | null;
  he_thong_ma: string | null;
  he_thong_ten: string | null;
  updated_at: string;
};

function SoDoListPage() {
  const qc = useQueryClient();
  const { user } = useSession();
  const scope = useScope();
  const { scopeAll, donViCode } = scope;

  const listQ = useQuery({
    queryKey: ["so_do_he_thong"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("so_do_he_thong")
        .select("id,ten,mo_ta,don_vi_ma,he_thong_ma,he_thong_ten,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SoDo[];
    },
  });

  const donViMap = useMemo(() => new Map(scope.donVi.map((d) => [d.ma, d])), [scope.donVi]);

  const [open, setOpen] = useState(false);
  const [ten, setTen] = useState("");
  const [moTa, setMoTa] = useState("");
  const [donViMa, setDonViMa] = useState<string>(scopeAll ? "" : donViCode ?? "");
  const [heThongMa, setHeThongMa] = useState<string>("");

  // Hệ thống lọc theo đơn vị đang chọn (nếu có).
  const heThongOptions = useMemo(() => {
    const dv = donViMa || (!scopeAll ? donViCode : "");
    return scope.heThong.filter((h) => !dv || h.don_vi === dv);
  }, [scope.heThong, donViMa, scopeAll, donViCode]);

  const createM = useMutation({
    mutationFn: async () => {
      const dv = scopeAll ? (donViMa || null) : (donViCode ?? null);
      const ht = heThongMa ? scope.heThong.find((h) => h.ma === heThongMa) ?? null : null;
      const { data, error } = await supabase
        .from("so_do_he_thong")
        .insert({
          ten: ten.trim(),
          mo_ta: moTa.trim() || null,
          don_vi_ma: dv,
          he_thong_ma: ht?.ma ?? null,
          he_thong_ten: ht?.ten ?? null,
          created_by: user!.id,
          du_lieu: { nodes: [], edges: [] },
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so_do_he_thong"] });
      toast.success("Đã tạo sơ đồ mới");
      setOpen(false);
      setTen(""); setMoTa(""); setDonViMa(scopeAll ? "" : donViCode ?? ""); setHeThongMa("");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không tạo được sơ đồ"),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("so_do_he_thong").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so_do_he_thong"] });
      toast.success("Đã xoá sơ đồ");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không xoá được sơ đồ"),
  });

  const canCreate = ten.trim().length > 0 && (scopeAll ? true : !!donViCode);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          icon={Waypoints}
          title="Sơ đồ hệ thống"
          help="Vẽ sơ đồ, gắn hệ thống & đơn vị, liên kết phần tử tới tài sản và đính kèm file bản vẽ. Tab 'Đấu nối' là bảng dữ liệu chuẩn về kết nối vật lý/logic giữa tài sản."
        />




        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Sơ đồ mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo sơ đồ hệ thống</DialogTitle>
              <DialogDescription>Sơ đồ thuộc phạm vi đơn vị — chỉ đơn vị đó (cùng Phòng KT/Admin) xem được.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ten">Tên sơ đồ</Label>
                <Input id="ten" value={ten} onChange={(e) => setTen(e.target.value)} placeholder="VD: Sơ đồ hệ thống điện T1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mota">Mô tả</Label>
                <Textarea id="mota" value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={2} placeholder="Tuỳ chọn" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Đơn vị</Label>
                  {scopeAll ? (
                    <Combobox
                      value={donViMa}
                      onChange={(v) => { setDonViMa(v); setHeThongMa(""); }}
                      placeholder="Chọn đơn vị (tuỳ chọn)"
                      searchPlaceholder="Tìm đơn vị…"
                      options={scope.donVi.map((d) => ({ value: d.ma, label: `${d.ma} — ${d.ten}` }))}
                    />
                  ) : (
                    <Input
                      value={donViMap.get(donViCode ?? "") ? `${donViCode} — ${donViMap.get(donViCode!)!.ten}` : (donViCode ?? "Không xác định")}
                      disabled
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Hệ thống</Label>
                  <HeThongPicker
                    value={heThongMa}
                    options={heThongOptions.map((h) => ({ ma: h.ma, ten: h.ten }))}
                    onChange={setHeThongMa}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Huỷ</Button>
              <Button onClick={() => createM.mutate()} disabled={!canCreate || createM.isPending}>
                {createM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Tạo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <SoDoTabs />



      {listQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (listQ.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <Waypoints className="h-10 w-10" />
            <p>Chưa có sơ đồ nào. Bấm “Sơ đồ mới” để bắt đầu vẽ.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(listQ.data ?? []).map((sd) => {
            const dv = sd.don_vi_ma ? donViMap.get(sd.don_vi_ma) : null;
            return (
              <Card key={sd.id} className="group relative transition-shadow hover:shadow-md">
                <Link to="/so-do/$id" params={{ id: sd.id }} className="block">
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-1 pr-8 text-base">{sd.ten}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {sd.mo_ta && <p className="line-clamp-2">{sd.mo_ta}</p>}
                    {sd.he_thong_ten && (
                      <Badge variant="secondary" className="max-w-full gap-1 font-normal">
                        <Network className="h-3 w-3 shrink-0" />
                        <span className="truncate">{sd.he_thong_ten}</span>
                      </Badge>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{dv ? dv.ma : (sd.don_vi_ma || "Chung")}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(sd.updated_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </CardContent>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon" variant="ghost"
                      className="absolute right-2 top-2 h-8 w-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive" aria-label="Xoá">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xoá sơ đồ “{sd.ten}”?</AlertDialogTitle>
                      <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Huỷ</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteM.mutate(sd.id)}>Xoá</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HeThongPicker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { ma: string; ten: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.ma === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          <span className="truncate">
            {current ? `${current.ma} — ${current.ten}` : "Chọn hệ thống (tuỳ chọn)"}
          </span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm hệ thống…" />
          <CommandList>
            <CommandEmpty>Không có hệ thống phù hợp.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__none__" onSelect={() => { onChange(""); setOpen(false); }}>
                <Check className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
                Không gắn
              </CommandItem>
              {options.map((o) => (
                <CommandItem
                  key={o.ma}
                  value={`${o.ma} ${o.ten}`}
                  onSelect={() => { onChange(o.ma); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === o.ma ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{o.ma} — {o.ten}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
