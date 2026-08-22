import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  UserPlus,
  KeyRound,
  Lock,
  Unlock,
  Search,
  ShieldAlert,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { AppShell } from "@/components/mirats/app-shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StandardTable } from "@/components/mirats/StandardTable";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession, type AppRole } from "@/hooks/use-session";
import {
  listUsers,
  createUser,
  updateUser,
  setUserActive,
  resetUserPassword,
} from "@/lib/admin-users.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Quản lý tài khoản — MIRATS" },
      {
        name: "description",
        content: "Tạo, khoá, gán vai trò và đơn vị cho tài khoản người dùng MIRATS.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminUsersPage,
});

const ROLES: {
  value: AppRole;
  label: string;
  tone:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "error"
    | "info";
}[] = [
  { value: "admin", label: "Admin", tone: "destructive" },
  { value: "phong_kt", label: "Phòng KT", tone: "info" },
  { value: "phu_trach_dv", label: "PT đơn vị", tone: "warning" },
  { value: "ktv", label: "KTV", tone: "success" },
  { value: "quan_ly_du_an", label: "QL dự án", tone: "info" },
  { value: "to_truong", label: "Tổ trưởng", tone: "info" },
  { value: "readonly", label: "Read-only", tone: "secondary" },
];
const DON_VI = [
  { code: "CRA", ten: "Cam Ranh" },
  { code: "CLA", ten: "Chu Lai" },
  { code: "THO", ten: "Tuy Hòa" },
  { code: "PCA", ten: "Phù Cát" },
  { code: "PBA", ten: "Phú Bài" },
  { code: "PLK", ten: "Pleiku" },
];

type UserRow = {
  id: string;
  email: string;
  ho_ten: string | null;
  don_vi: string | null;
  active: boolean;
  created_at: string;
  roles: string[];
  banned_until: string | null;
};

function AdminUsersPage() {
  const nav = useNavigate();
  const { loading, session, hasRole } = useSession();

  useEffect(() => {
    if (!loading && !session) nav({ to: "/auth", search: { next: "/admin/users" } as never });
  }, [loading, session, nav]);

  if (loading)
    return (
      <AppShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  if (!session) return null;
  if (!hasRole("admin")) {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg py-20 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-4 text-xl font-semibold">Không đủ quyền</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Trang này chỉ dành cho vai trò Admin.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Về Dashboard
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell>
      <AdminUsers />
    </AppShell>
  );
}

function AdminUsers() {
  const qc = useQueryClient();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const update = useServerFn(updateUser);
  const toggle = useServerFn(setUserActive);
  const resetPw = useServerFn(resetUserPassword);

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list() as Promise<UserRow[]>,
  });

  const [q, setQ] = useState("");
  const filtered = data.filter(
    (u) =>
      !q ||
      [u.email, u.ho_ten, u.don_vi, ...u.roles].some((v) =>
        (v ?? "").toString().toLowerCase().includes(q.toLowerCase()),
      ),
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [pwFor, setPwFor] = useState<UserRow | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  type CreateInput = {
    email: string;
    password: string;
    ho_ten: string;
    don_vi: string | null;
    roles: AppRole[];
  };
  type UpdateInput = { user_id: string; ho_ten: string; don_vi: string | null; roles: AppRole[] };

  const createM = useMutation({
    mutationFn: (data: CreateInput) => create({ data }),
    onSuccess: () => {
      toast.success("Đã tạo tài khoản");
      setCreateOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateM = useMutation({
    mutationFn: (data: UpdateInput) => update({ data }),
    onSuccess: () => {
      toast.success("Đã cập nhật");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleM = useMutation({
    mutationFn: (data: { user_id: string; active: boolean }) => toggle({ data }),
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const resetM = useMutation({
    mutationFn: (data: { user_id: string; password: string }) => resetPw({ data }),
    onSuccess: () => {
      toast.success("Đã đặt lại mật khẩu");
      setPwFor(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý tài khoản</h1>
          <p className="text-sm text-muted-foreground">
            Chỉ Admin được tạo/khoá/gán vai trò. Người dùng không thể tự đăng ký.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tạo tài khoản
        </Button>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Danh sách tài khoản</CardTitle>
              <CardDescription>
                {data.length} tài khoản · {data.filter((u) => u.active).length} đang hoạt động
              </CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm email, tên, đơn vị…"
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <StandardTable<UserRow>
            tableKey="admin_users_list"
            rows={filtered}
            getRowId={(u) => u.id}
            requireFilterToShow={false}
            trangThai={{ dangTai: isLoading }}
            emptyContent={
              <div className="py-10 text-center text-muted-foreground text-sm">
                Không có tài khoản
              </div>
            }
            columns={[
              {
                key: "email",
                label: "Email · Họ tên",
                filter: "text",
                value: (u) => `${u.email} ${u.ho_ten ?? ""}`,
                cell: (u) => (
                  <div>
                    <div className="text-xs font-medium">{u.email}</div>
                    <div className="text-[10.5px] text-muted-foreground">{u.ho_ten ?? "—"}</div>
                  </div>
                ),
              },
              {
                key: "don_vi",
                label: "Đơn vị",
                filter: "cat",
                value: (u) => u.don_vi ?? "",
                cell: (u) => <span className="font-mono text-[11px]">{u.don_vi ?? "—"}</span>,
              },
              {
                key: "roles",
                label: "Vai trò",
                filter: "text",
                value: (u) => u.roles.join(", "),
                cell: (u) => (
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 ? (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    ) : (
                      u.roles.map((r) => {
                        const meta = ROLES.find((x) => x.value === r);
                        return (
                          <Badge key={r} variant={meta?.tone ?? "outline"} size="sm">
                            {meta?.label ?? r}
                          </Badge>
                        );
                      })
                    )}
                  </div>
                ),
              },
              {
                key: "trang_thai",
                label: "Trạng thái",
                filter: "cat",
                value: (u) => (u.active ? "Hoạt động" : u.banned_until ? "Đã khoá" : "Chờ duyệt"),
                cell: (u) =>
                  u.active ? (
                    <Badge variant="success" size="sm">
                      Hoạt động
                    </Badge>
                  ) : u.banned_until ? (
                    <Badge variant="error" size="sm">
                      Đã khoá
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm">
                      Chờ duyệt
                    </Badge>
                  ),
              },
              {
                key: "actions",
                label: "Thao tác",
                align: "right",
                cell: (u) => (
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditing(u)}>
                      Sửa
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPwFor(u)}>
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant={u.active ? "outline" : "default"}
                      onClick={() => toggleM.mutate({ user_id: u.id, active: !u.active })}
                      disabled={toggleM.isPending}
                    >
                      {u.active ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <UserForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo tài khoản mới"
        submitting={createM.isPending}
        onSubmit={(v) => createM.mutate(v)}
        mode="create"
      />
      {editing && (
        <UserForm
          open={!!editing}
          onClose={() => setEditing(null)}
          title={`Sửa: ${editing.email}`}
          submitting={updateM.isPending}
          initial={{
            email: editing.email,
            ho_ten: editing.ho_ten ?? "",
            don_vi: (editing.don_vi as string | null) ?? null,
            roles: (editing.roles as AppRole[]) ?? [],
          }}
          onSubmit={(v) =>
            updateM.mutate({
              user_id: editing.id,
              ho_ten: v.ho_ten,
              don_vi: v.don_vi,
              roles: v.roles,
            })
          }
          mode="edit"
        />
      )}
      {pwFor && (
        <ResetPwDialog
          user={pwFor}
          submitting={resetM.isPending}
          onClose={() => setPwFor(null)}
          onSubmit={(pw) => resetM.mutate({ user_id: pwFor.id, password: pw })}
        />
      )}
    </div>
  );
}

function UserForm({
  open,
  onClose,
  title,
  initial,
  onSubmit,
  submitting,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  submitting: boolean;
  mode: "create" | "edit";
  initial?: { email: string; ho_ten: string; don_vi: string | null; roles: AppRole[] };
  onSubmit: (v: {
    email: string;
    password: string;
    ho_ten: string;
    don_vi: string | null;
    roles: AppRole[];
  }) => void;
}) {
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [hoTen, setHoTen] = useState(initial?.ho_ten ?? "");
  const [donVi, setDonVi] = useState<string | null>(initial?.don_vi ?? null);
  const [roles, setRoles] = useState<AppRole[]>(initial?.roles ?? ["ktv"]);

  useEffect(() => {
    if (open) {
      setEmail(initial?.email ?? "");
      setPassword("");
      setHoTen(initial?.ho_ten ?? "");
      setDonVi(initial?.don_vi ?? null);
      setRoles(initial?.roles ?? ["ktv"]);
    }
  }, [open, initial]);

  function submit() {
    if (mode === "create" && (!email || !password)) {
      toast.error("Nhập email và mật khẩu");
      return;
    }
    if (!hoTen.trim()) {
      toast.error("Nhập họ tên");
      return;
    }
    if (roles.length === 0) {
      toast.error("Chọn ít nhất 1 vai trò");
      return;
    }
    onSubmit({ email, password, ho_ten: hoTen, don_vi: donVi, roles });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Người dùng sẽ đăng nhập bằng email và mật khẩu do bạn cấp."
              : "Cập nhật vai trò và đơn vị. Email không đổi được."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mode === "edit"}
              type="email"
            />
          </div>
          {mode === "create" && (
            <div className="space-y-1.5">
              <Label>Mật khẩu ban đầu</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="text"
                placeholder="Ít nhất 6 ký tự"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Họ tên</Label>
            <Input value={hoTen} onChange={(e) => setHoTen(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Đơn vị</Label>
            <Select
              value={donVi ?? "__none"}
              onValueChange={(v) => setDonVi(v === "__none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn đơn vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— Không gán —</SelectItem>
                {DON_VI.map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.code} · {d.ten}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Vai trò</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-2 rounded-md border p-2 text-xs"
                >
                  <Checkbox
                    checked={roles.includes(r.value)}
                    onCheckedChange={(c) =>
                      setRoles((prev) =>
                        c ? [...prev, r.value] : prev.filter((x) => x !== r.value),
                      )
                    }
                  />
                  <Badge variant={r.tone} size="sm">
                    {r.label}
                  </Badge>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Tạo" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPwDialog({
  user,
  onSubmit,
  onClose,
  submitting,
}: {
  user: UserRow;
  onSubmit: (pw: string) => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const [pw, setPw] = useState("");
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Đặt lại mật khẩu</DialogTitle>
          <DialogDescription>
            Cho tài khoản <span className="font-mono">{user.email}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Mật khẩu mới</Label>
          <Input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            type="text"
            placeholder="Ít nhất 6 ký tự"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            onClick={() => {
              if (pw.length < 6) {
                toast.error("Ít nhất 6 ký tự");
                return;
              }
              onSubmit(pw);
            }}
            disabled={submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Đặt lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
