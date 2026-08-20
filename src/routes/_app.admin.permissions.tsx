import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  listUsersWithScope,
  setUserScope,
  getRoleMatrix,
  setRolePermission,
  listAccessRequests,
  resolveAccessRequest,
  previewAsUser,
} from "@/lib/rbac.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShieldCheck, Users, Grid3x3, Eye, Inbox, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/admin/permissions")({
  head: () => ({ meta: [{ title: "Phân quyền & phạm vi | MIRATS" }] }),
  component: PermissionsPage,
});

const ROLES = ["admin", "phong_kt", "phu_trach_dv", "to_truong", "ktv", "quan_ly_du_an", "readonly"] as const;
const MODULES = [
  { key: "thiet_bi", label: "Tài sản" },
  { key: "he_thong", label: "Hệ thống" },
  { key: "su_co", label: "Sự cố" },
  { key: "bao_tri", label: "Bảo dưỡng" },
  { key: "kiem_ke", label: "Kiểm kê" },
  { key: "giay_phep", label: "Giấy phép" },
  { key: "so_do", label: "Sơ đồ" },
  { key: "du_an", label: "Dự án" },
  { key: "kho", label: "Kho" },
  { key: "form_template", label: "Mẫu phiếu" },
  { key: "danh_muc", label: "Danh mục" },
  { key: "admin", label: "Quản trị" },
  { key: "audit", label: "Nhật ký" },
  { key: "ai", label: "AI" },
];
const ACTIONS = ["view", "create", "edit", "delete", "force_delete", "approve", "export", "import"] as const;

function PermissionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-4">
      <PageHeader
        icon={ShieldCheck}
        title="Phân quyền & phạm vi dữ liệu"
        help="Cấp quyền theo vai trò, kiểm soát phạm vi truy cập dữ liệu và duyệt yêu cầu quyền."
      />
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Người dùng</TabsTrigger>
          <TabsTrigger value="matrix"><Grid3x3 className="w-4 h-4 mr-2" />Ma trận quyền</TabsTrigger>
          <TabsTrigger value="viewas"><Eye className="w-4 h-4 mr-2" />View as user</TabsTrigger>
          <TabsTrigger value="requests"><Inbox className="w-4 h-4 mr-2" />Yêu cầu quyền</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="matrix"><MatrixTab /></TabsContent>
        <TabsContent value="viewas"><ViewAsTab /></TabsContent>
        <TabsContent value="requests"><RequestsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------- USERS ----------
function UsersTab() {
  const fn = useServerFn(listUsersWithScope);
  const q = useQuery({ queryKey: ["rbac", "users-scope"], queryFn: () => fn() as any });
  const [editUserId, setEditUserId] = useState<string | null>(null);

  if (q.isLoading) return <div className="p-8 text-center text-muted-foreground">Đang tải…</div>;
  const data = q.data as any;
  const editUser = data?.users.find((u: any) => u.id === editUserId);

  return (
    <Card>
      <CardHeader><CardTitle>Danh sách tài khoản</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên / Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Phạm vi dữ liệu</TableHead>
              <TableHead className="w-32">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.ho_ten || "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell className="space-x-1">
                  {u.roles.length === 0 ? <span className="text-muted-foreground text-sm">—</span> :
                    u.roles.map((r: string) => <Badge key={r} variant="secondary">{r}</Badge>)}
                </TableCell>
                <TableCell>
                  <ScopeSummary scopes={u.scopes} toChuc={data.toChuc} donVi={data.donVi} />
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => setEditUserId(u.id)}>Chỉnh phạm vi</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Sheet open={!!editUser} onOpenChange={(o) => !o && setEditUserId(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader><SheetTitle>Phạm vi truy cập: {editUser?.ho_ten || editUser?.email}</SheetTitle></SheetHeader>
          {editUser && <ScopeEditor user={editUser} toChuc={data.toChuc} donVi={data.donVi} onClose={() => setEditUserId(null)} />}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function ScopeSummary({ scopes, toChuc, donVi }: any) {
  if (!scopes.length) return <span className="text-destructive text-sm">Chưa cấp</span>;
  const isGlobal = scopes.some((s: any) => !s.to_chuc_id && !s.don_vi_id);
  if (isGlobal) return <Badge>Toàn cục</Badge>;
  return (
    <div className="flex flex-wrap gap-1">
      {scopes.map((s: any, i: number) => {
        const t = toChuc.find((x: any) => x.id === s.to_chuc_id);
        const d = donVi.find((x: any) => x.id === s.don_vi_id);
        return <Badge key={i} variant="outline">{d?.ma || t?.ma || "?"}</Badge>;
      })}
    </div>
  );
}

function ScopeEditor({ user, toChuc, donVi, onClose }: any) {
  const [scopes, setScopes] = useState<Array<{ to_chuc_id: string | null; don_vi_id: string | null }>>(
    user.scopes.map((s: any) => ({ to_chuc_id: s.to_chuc_id, don_vi_id: s.don_vi_id })),
  );
  const fn = useServerFn(setUserScope);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => fn({ data: { user_id: user.id, scopes } }) as any,
    onSuccess: () => {
      toast.success("Đã cập nhật phạm vi");
      qc.invalidateQueries({ queryKey: ["rbac", "users-scope"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-3 mt-4">
      <div className="text-sm text-muted-foreground">
        Bỏ trống cả 2 cột = toàn cục. Chỉ Tổ chức = mọi đơn vị thuộc tổ chức. Chỉ Đơn vị = duy nhất đơn vị đó.
      </div>
      <Button size="sm" variant="outline" onClick={() => setScopes([...scopes, { to_chuc_id: null, don_vi_id: null }])}>
        <Plus className="w-4 h-4 mr-1" />Thêm phạm vi
      </Button>
      {scopes.map((s, i) => (
        <div key={i} className="flex gap-2 items-center border rounded p-2">
          <Select value={s.to_chuc_id ?? "__none__"} onValueChange={(v) => {
            const next = [...scopes]; next[i].to_chuc_id = v === "__none__" ? null : v; setScopes(next);
          }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Tổ chức" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Tổ chức —</SelectItem>
              {toChuc.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.ma}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={s.don_vi_id ?? "__none__"} onValueChange={(v) => {
            const next = [...scopes]; next[i].don_vi_id = v === "__none__" ? null : v; setScopes(next);
          }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Đơn vị" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Đơn vị —</SelectItem>
              {donVi.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.ma}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="icon" variant="ghost" onClick={() => setScopes(scopes.filter((_, j) => j !== i))}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <div className="pt-2 flex gap-2">
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>Lưu</Button>
        <Button variant="outline" onClick={onClose}>Hủy</Button>
      </div>
    </div>
  );
}

// ---------- MATRIX ----------
function MatrixTab() {
  const fn = useServerFn(getRoleMatrix);
  const setFn = useServerFn(setRolePermission);
  const q = useQuery({ queryKey: ["rbac", "matrix"], queryFn: () => fn() as any });
  const [role, setRole] = useState<string>("ktv");
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (v: { module: string; action: string; allowed: boolean }) =>
      setFn({ data: { role: role as any, ...v } }) as any,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rbac", "matrix"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const matrix = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const r of (q.data as any[]) ?? []) m.set(`${r.role}|${r.module}|${r.action}`, r.allowed);
    return m;
  }, [q.data]);

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <CardTitle>Ma trận vai trò × module × hành động</CardTitle>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Module</TableHead>
              {ACTIONS.map((a) => <TableHead key={a} className="text-center capitalize">{a}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {MODULES.map((m) => (
              <TableRow key={m.key}>
                <TableCell className="font-medium">{m.label}</TableCell>
                {ACTIONS.map((a) => {
                  const allowed = matrix.get(`${role}|${m.key}|${a}`) ?? false;
                  return (
                    <TableCell key={a} className="text-center">
                      <Switch
                        checked={allowed}
                        disabled={role === "admin"}
                        onCheckedChange={(v) => mut.mutate({ module: m.key, action: a, allowed: !!v })}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {role === "admin" && <p className="text-xs text-muted-foreground mt-2">Admin có toàn quyền — không thể chỉnh sửa.</p>}
      </CardContent>
    </Card>
  );
}

// ---------- VIEW AS ----------
function ViewAsTab() {
  const listFn = useServerFn(listUsersWithScope);
  const previewFn = useServerFn(previewAsUser);
  const users = useQuery({ queryKey: ["rbac", "users-scope"], queryFn: () => listFn() as any });
  const [uid, setUid] = useState<string | null>(null);
  const preview = useQuery({
    queryKey: ["rbac", "preview", uid],
    queryFn: () => previewFn({ data: { user_id: uid! } }) as any,
    enabled: !!uid,
  });

  return (
    <Card>
      <CardHeader><CardTitle>Xem quyền của tài khoản khác</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Select value={uid ?? ""} onValueChange={setUid}>
          <SelectTrigger className="w-80"><SelectValue placeholder="Chọn tài khoản để xem quyền" /></SelectTrigger>
          <SelectContent>
            {(users.data as any)?.users.map((u: any) => (
              <SelectItem key={u.id} value={u.id}>{u.ho_ten || u.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {preview.data && (
          <div className="border-2 border-warning bg-warning/10 rounded p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-semibold">Đang xem quyền của user này (chỉ preview, không thay đổi session).</span>
            </div>
            <div><span className="text-sm text-muted-foreground">Vai trò: </span>
              {(preview.data as any).roles.map((r: string) => <Badge key={r} className="mr-1">{r}</Badge>)}
            </div>
            <div><span className="text-sm text-muted-foreground">Phạm vi: </span>
              {(preview.data as any).isGlobal ? <Badge>Toàn cục</Badge> :
                (preview.data as any).scope.map((s: any, i: number) =>
                  <Badge key={i} variant="outline">{s.don_vi_id ? "DV:" + s.don_vi_id.slice(0, 8) : s.to_chuc_id ? "TC:" + s.to_chuc_id.slice(0, 8) : "?"}</Badge>)}
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium">Quyền hiệu lực:</div>
              <Table>
                <TableBody>
                  {MODULES.map((m) => {
                    const acts = (preview.data as any).permissions[m.key] ?? [];
                    return (
                      <TableRow key={m.key}>
                        <TableCell className="w-40">{m.label}</TableCell>
                        <TableCell>
                          {acts.length === 0 ? <span className="text-muted-foreground text-sm">—</span> :
                            acts.map((a: string) => <Badge key={a} variant="secondary" className="mr-1 capitalize">{a}</Badge>)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- REQUESTS ----------
function RequestsTab() {
  const fn = useServerFn(listAccessRequests);
  const resolve = useServerFn(resolveAccessRequest);
  const q = useQuery({ queryKey: ["rbac", "access-req"], queryFn: () => fn() as any });
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (v: { id: string; approve: boolean }) => resolve({ data: v }) as any,
    onSuccess: () => {
      toast.success("Đã xử lý");
      qc.invalidateQueries({ queryKey: ["rbac", "access-req"] });
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle>Yêu cầu cấp quyền tạm thời</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Module / Hành động</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>TTL</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((q.data as any[]) ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("vi-VN")}</TableCell>
                <TableCell className="text-xs">{r.user_id.slice(0, 8)}</TableCell>
                <TableCell><Badge variant="outline">{r.module}</Badge> <Badge>{r.action}</Badge></TableCell>
                <TableCell className="max-w-xs truncate">{r.reason || "—"}</TableCell>
                <TableCell>{r.ttl_minutes}p</TableCell>
                <TableCell><Badge variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"}>{r.status}</Badge></TableCell>
                <TableCell className="space-x-1">
                  {r.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => mut.mutate({ id: r.id, approve: true })}>Duyệt</Button>
                      <Button size="sm" variant="outline" onClick={() => mut.mutate({ id: r.id, approve: false })}>Từ chối</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
