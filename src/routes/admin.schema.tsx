import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, ShieldAlert, Loader2, Search, RefreshCw, Plus, Trash2, Pencil,
  KeyRound, Link2, ChevronRight, ChevronDown, Database, Network,
} from "lucide-react";
import {
  ReactFlow, Background, Controls, MiniMap, MarkerType, Position, Handle, Panel,
  type Node as RFNode, type Edge as RFEdge, type NodeProps, type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { AppShell } from "@/components/mirats/app-shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSession } from "@/hooks/use-session";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DesktopOnly } from "@/components/mirats/DesktopOnly";

export const Route = createFileRoute("/admin/schema")({
  head: () => ({
    meta: [
      { title: "Sơ đồ CSDL — MIRATS 2.0" },
      { name: "description", content: "Xem cây quan hệ cơ sở dữ liệu và thêm/sửa cột cho bảng nghiệp vụ." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSchemaPage,
});

// ============ Types ============
type Col = {
  name: string; type: string; udt: string;
  nullable: boolean; default: string | null;
  position: number; is_pk: boolean;
};
type Tbl = { table_name: string; columns: Col[] };
type FK = { from_table: string; from_column: string; to_table: string; to_column: string; constraint: string };
type Schema = { tables: Tbl[]; foreign_keys: FK[] };

// ============ Human labels ============
const TABLE_LABEL: Record<string, string> = {
  thiet_bi: "Tài sản",
  thiet_bi_tep_dinh_kem: "Tệp đính kèm tài sản",
  giay_phep: "Giấy phép",
  form_template: "Mẫu biểu",
  form_field: "Trường mẫu biểu",
  form_submission: "Phiếu điền",
  form_submission_thiet_bi: "Phiếu điền × Tài sản",
  dm_don_vi: "Đơn vị",
  dm_he_thong: "Hệ thống",
  dm_nhom_he_thong: "Nhóm hệ thống",
  dm_vi_tri: "Vị trí",
  dm_loai_thiet_bi: "Chủng loại",
  dm_loai_giay_phep: "Loại giấy phép",
  dm_nha_cung_cap: "Nhà cung cấp",
  dm_nha_san_xuat: "Nhà sản xuất",
  dm_noi_cap: "Nơi cấp",
  dm_trang_thai_thiet_bi: "Trạng thái tài sản",
  du_an: "Dự án",
  du_an_cong_viec: "Công việc dự án",
  du_an_cong_viec_phoi_hop: "Người phối hợp công việc",
  du_an_moc: "Mốc dự án",
  so_do_he_thong: "Sơ đồ hệ thống",
  so_do_tep_dinh_kem: "Tệp đính kèm sơ đồ",
  so_do_thu_vien_hinh: "Thư viện hình sơ đồ",
  cay_node_edit: "Khoá chỉnh sửa cây hệ thống",
  conversations: "Cuộc trò chuyện",
  conversation_participant: "Thành viên trò chuyện",
  messages: "Tin nhắn",
  notifications: "Thông báo",
  tickets: "Yêu cầu hỗ trợ",
  ticket_comment: "Bình luận hỗ trợ",
  ai_config: "Cấu hình AI",
  ai_conversation: "Hội thoại AI",
  ai_message: "Tin nhắn AI",
  profiles: "Tài khoản",
  user_roles: "Vai trò",
  audit_log: "Nhật ký",
};
const tableVi = (t: string) => TABLE_LABEL[t] ?? t;

// Mô tả ngắn gọn, dễ hiểu cho từng bảng.
const TABLE_DESC: Record<string, string> = {
  thiet_bi: "Danh sách toàn bộ tài sản và thông số kỹ thuật của chúng.",
  thiet_bi_tep_dinh_kem: "Ảnh và tài liệu được gắn kèm cho từng tài sản.",
  giay_phep: "Giấy phép, chứng chỉ liên quan tới tài sản/hệ thống.",
  form_template: "Khuôn mẫu (biểu mẫu) dùng để tạo phiếu điền.",
  form_field: "Các ô nhập liệu bên trong một mẫu biểu.",
  form_submission: "Những phiếu đã được điền theo mẫu biểu.",
  form_submission_thiet_bi: "Bảng nối phiếu điền với tài sản liên quan.",
  dm_don_vi: "Danh mục đơn vị / phòng ban.",
  dm_he_thong: "Danh mục các hệ thống tài sản.",
  dm_nhom_he_thong: "Danh mục nhóm hệ thống.",
  dm_vi_tri: "Danh mục vị trí lắp đặt.",
  dm_loai_thiet_bi: "Danh mục phân chủng loại.",
  dm_loai_giay_phep: "Danh mục phân loại giấy phép.",
  dm_nha_cung_cap: "Danh mục nhà cung cấp.",
  dm_nha_san_xuat: "Danh mục nhà sản xuất.",
  dm_noi_cap: "Danh mục nơi cấp giấy phép.",
  dm_trang_thai_thiet_bi: "Danh mục trạng thái của tài sản.",
  du_an: "Thông tin chung của các dự án.",
  du_an_cong_viec: "Các công việc thuộc từng dự án.",
  du_an_cong_viec_phoi_hop: "Người được phân công phối hợp cho mỗi công việc.",
  du_an_moc: "Các mốc thời gian quan trọng của dự án.",
  so_do_he_thong: "Sơ đồ hệ thống do người dùng vẽ (node + đường nối).",
  so_do_tep_dinh_kem: "Tệp đính kèm cho từng sơ đồ.",
  so_do_thu_vien_hinh: "Kho hình ảnh dùng chung khi vẽ sơ đồ.",
  cay_node_edit: "Ghi nhận ai đang chỉnh sửa cây hệ thống (tránh trùng).",
  conversations: "Các cuộc trò chuyện giữa những người dùng.",
  conversation_participant: "Ai tham gia vào cuộc trò chuyện nào.",
  messages: "Nội dung tin nhắn trong các cuộc trò chuyện.",
  notifications: "Thông báo gửi tới người dùng.",
  tickets: "Yêu cầu hỗ trợ / báo sự cố cần xử lý.",
  ticket_comment: "Trao đổi qua lại trong một yêu cầu hỗ trợ.",
  ai_config: "Cấu hình trợ lý AI của hệ thống.",
  ai_conversation: "Các phiên hội thoại với trợ lý AI.",
  ai_message: "Tin nhắn trong một phiên hội thoại AI.",
  profiles: "Hồ sơ tài khoản người dùng.",
  user_roles: "Vai trò / quyền hạn của người dùng.",
  audit_log: "Nhật ký mọi thay đổi dữ liệu trong hệ thống.",
};

const GROUP_OF = (t: string): string => {
  if (t.startsWith("dm_")) return "Danh mục";
  if (t.startsWith("form_")) return "Biểu mẫu";
  if (t.startsWith("thiet_bi")) return "Tài sản";
  if (t.startsWith("giay_phep")) return "Giấy phép";
  if (t.startsWith("du_an")) return "Dự án";
  if (t.startsWith("so_do") || t === "cay_node_edit") return "Sơ đồ";
  if (["conversations", "conversation_participant", "messages", "notifications"].includes(t)) return "Trao đổi";
  if (t.startsWith("ticket")) return "Hỗ trợ";
  if (t.startsWith("ai_")) return "Trợ lý AI";
  if (["profiles", "user_roles", "audit_log"].includes(t)) return "Hệ thống";
  return "Khác";
};
const GROUP_COLOR: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  "Tài sản":  { bg: "bg-sky-50",     border: "border-sky-300",     text: "text-sky-900",     dot: "bg-sky-500" },
  "Giấy phép": { bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-900", dot: "bg-emerald-500" },
  "Biểu mẫu":  { bg: "bg-violet-50",  border: "border-violet-300",  text: "text-violet-900",  dot: "bg-violet-500" },
  "Danh mục":  { bg: "bg-amber-50",   border: "border-amber-300",   text: "text-amber-900",   dot: "bg-amber-500" },
  "Dự án":     { bg: "bg-rose-50",    border: "border-rose-300",    text: "text-rose-900",    dot: "bg-rose-500" },
  "Sơ đồ":     { bg: "bg-teal-50",    border: "border-teal-300",    text: "text-teal-900",    dot: "bg-teal-500" },
  "Trao đổi":  { bg: "bg-cyan-50",    border: "border-cyan-300",    text: "text-cyan-900",    dot: "bg-cyan-500" },
  "Hỗ trợ":    { bg: "bg-orange-50",  border: "border-orange-300",  text: "text-orange-900",  dot: "bg-orange-500" },
  "Trợ lý AI": { bg: "bg-fuchsia-50", border: "border-fuchsia-300", text: "text-fuchsia-900", dot: "bg-fuchsia-500" },
  "Hệ thống":  { bg: "bg-slate-50",   border: "border-slate-300",   text: "text-slate-900",   dot: "bg-slate-500" },
  "Khác":      { bg: "bg-slate-50",   border: "border-slate-300",   text: "text-slate-900",   dot: "bg-slate-400" },
};
const GROUP_ORDER = ["Tài sản", "Giấy phép", "Biểu mẫu", "Dự án", "Sơ đồ", "Trao đổi", "Hỗ trợ", "Danh mục", "Trợ lý AI", "Hệ thống", "Khác"];

const EDITABLE_TABLE = (t: string) =>
  /^(dm_|thiet_bi|giay_phep|form_)/.test(t) && !["audit_log", "profiles", "user_roles"].includes(t);

/** Tên kiểu dữ liệu bằng tiếng Việt dễ hiểu. */
function typeVi(col: Col): string {
  const u = (col.udt || col.type || "").toLowerCase();
  if (["text", "varchar", "bpchar", "char", "citext", "name"].includes(u)) return "Chuỗi";
  if (["int2", "int4", "integer", "smallint"].includes(u)) return "Số nguyên";
  if (["int8", "bigint"].includes(u)) return "Số nguyên lớn";
  if (["numeric", "float4", "float8", "real", "decimal"].includes(u)) return "Số thập phân";
  if (["bool", "boolean"].includes(u)) return "Đúng/Sai";
  if (u === "date") return "Ngày";
  if (u.startsWith("timestamp")) return "Ngày giờ";
  if (u.startsWith("time")) return "Giờ";
  if (u === "uuid") return "Mã định danh";
  if (u === "jsonb" || u === "json") return "JSON";
  if (col.type === "ARRAY" || u === "array" || u.startsWith("_")) return "Danh sách";
  if (col.type === "USER-DEFINED") return "Tuỳ chọn (enum)";
  return col.udt || col.type;
}

/** Diễn giải ý nghĩa của cột bằng ngôn ngữ đời thường. */
const COL_HINT: Record<string, string> = {
  created_at: "Ngày tạo", updated_at: "Ngày cập nhật", last_message_at: "Tin nhắn gần nhất",
  email: "Địa chỉ email", ho_ten: "Họ tên", active: "Đang hoạt động", role: "Vai trò",
  noi_dung: "Nội dung", tieu_de: "Tiêu đề", mo_ta: "Mô tả", trang_thai: "Trạng thái",
  ten: "Tên", ma: "Mã", so_luong: "Số lượng", tien_do: "Tiến độ (%)",
};
function colHint(col: Col, tbl: string, fks: FK[]): string {
  if (col.is_pk) return "Khoá chính — định danh mỗi dòng";
  const fk = fks.find((f) => f.from_table === tbl && f.from_column === col.name);
  if (fk) return `Liên kết → ${tableVi(fk.to_table)}`;
  const n = col.name;
  if (COL_HINT[n]) return COL_HINT[n];
  if (/^(nguoi_tao|created_by|nguoi_tao_id)$/.test(n)) return "Người tạo";
  if (/^(nguoi_xu_ly|assigned_to|quan_ly_id|user_id|sender_id)/.test(n)) return "Người phụ trách";
  if (/^ten(_|$)/.test(n)) return "Tên";
  if (/^ma(_|$)/.test(n)) return "Mã";
  if (/mo_ta/.test(n)) return "Mô tả";
  if (/trang_thai/.test(n)) return "Trạng thái";
  if (/(^ngay_|_ngay$|_at$)/.test(n)) return "Ngày";
  if (/_id$/.test(n)) return "Tham chiếu";
  if (/url$/.test(n)) return "Đường dẫn tệp";
  return "";
}

const ALLOWED_TYPES = [
  { v: "text",        label: "Chuỗi (text)" },
  { v: "integer",     label: "Số nguyên (integer)" },
  { v: "bigint",      label: "Số nguyên lớn (bigint)" },
  { v: "numeric",     label: "Số thập phân (numeric)" },
  { v: "boolean",     label: "Đúng/Sai (boolean)" },
  { v: "date",        label: "Ngày (date)" },
  { v: "timestamptz", label: "Ngày giờ (timestamptz)" },
  { v: "uuid",        label: "UUID" },
  { v: "jsonb",       label: "JSON (jsonb)" },
];

// ============ Data hook ============
function useSchema() {
  return useQuery({
    queryKey: ["admin-schema"],
    queryFn: async (): Promise<Schema> => {
      const { data, error } = await supabase.rpc("admin_list_schema");
      if (error) throw error;
      return data as unknown as Schema;
    },
    staleTime: 30_000,
  });
}

// ============ Page ============
function AdminSchemaPage() {
  const nav = useNavigate();
  const { loading, session, hasRole } = useSession();
  const isAdmin = hasRole("admin");
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <AppShell>
        <DesktopOnly 
          featureName="Sơ đồ CSDL & Quản trị Schema"
          reason="Việc quản trị lược đồ cơ sở dữ liệu và xem sơ đồ quan hệ (ERD) cần không gian màn hình lớn để hiển thị các bảng và đường nối phức tạp. Hãy thực hiện thao tác này trên máy tính để tránh sai sót dữ liệu."
        >
          <div />
        </DesktopOnly>
      </AppShell>
    );
  }

  useEffect(() => {
    if (loading) return;
    if (!session) nav({ to: "/auth", replace: true });
  }, [loading, session, nav]);

  if (loading) {
    return <AppShell><div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</div></AppShell>;
  }
  if (!isAdmin) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-600">
                <ShieldAlert className="h-5 w-5" /> Không có quyền
              </CardTitle>
              <CardDescription>Chỉ tài khoản Admin mới truy cập được sơ đồ CSDL.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline"><Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Về trang chính</Link></Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }
  if (isMobile) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-600" /> Cần màn hình lớn
              </CardTitle>
              <CardDescription>Sơ đồ CSDL dùng khung nhìn rộng, vui lòng mở trên máy tính để xem đầy đủ.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline"><Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Về trang chính</Link></Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }
  return <SchemaWorkspace />;
}

function SchemaWorkspace() {
  const qc = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useSchema();
  const [q, setQ] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("__biz__");
  const [addOpen, setAddOpen] = useState(false);
  const [addTable, setAddTable] = useState<string | null>(null);

  const tables = useMemo(() => data?.tables ?? [], [data]);
  const fks = useMemo(() => data?.foreign_keys ?? [], [data]);

  const visibleTables = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return tables.filter(t => {
      const g = GROUP_OF(t.table_name);
      if (groupFilter === "__biz__" && g === "Hệ thống") return false;
      if (groupFilter !== "__all__" && groupFilter !== "__biz__" && g !== groupFilter) return false;
      if (!kw) return true;
      if (t.table_name.toLowerCase().includes(kw)) return true;
      if (tableVi(t.table_name).toLowerCase().includes(kw)) return true;
      if (t.columns.some(c => c.name.toLowerCase().includes(kw))) return true;
      return false;
    });
  }, [tables, q, groupFilter]);

  const visibleNames = useMemo(() => new Set(visibleTables.map(t => t.table_name)), [visibleTables]);
  const visibleFks = useMemo(() => fks.filter(f => visibleNames.has(f.from_table) && visibleNames.has(f.to_table)), [fks, visibleNames]);

  return (
    <AppShell>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-600" /> Sơ đồ cơ sở dữ liệu
                </CardTitle>
                <CardDescription>
                  Xem quan hệ giữa các bảng nghiệp vụ và thêm cột khi cần. Chỉ Admin.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} /> Làm mới
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder="Tìm bảng hoặc tên cột…"
                  className="pl-9"
                />
              </div>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-full sm:w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__biz__">Chỉ bảng nghiệp vụ</SelectItem>
                  <SelectItem value="__all__">Tất cả bảng</SelectItem>
                  <SelectItem value="Tài sản">Nhóm: Tài sản</SelectItem>
                  <SelectItem value="Giấy phép">Nhóm: Giấy phép</SelectItem>
                  <SelectItem value="Biểu mẫu">Nhóm: Biểu mẫu</SelectItem>
                  <SelectItem value="Dự án">Nhóm: Dự án</SelectItem>
                  <SelectItem value="Sơ đồ">Nhóm: Sơ đồ</SelectItem>
                  <SelectItem value="Trao đổi">Nhóm: Trao đổi</SelectItem>
                  <SelectItem value="Hỗ trợ">Nhóm: Hỗ trợ</SelectItem>
                  <SelectItem value="Danh mục">Nhóm: Danh mục</SelectItem>
                  <SelectItem value="Trợ lý AI">Nhóm: Trợ lý AI</SelectItem>
                  <SelectItem value="Hệ thống">Nhóm: Hệ thống (chỉ đọc)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {Object.entries(GROUP_COLOR).map(([g, c]) => (
                <span key={g} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border">
                  <span className={cn("h-2 w-2 rounded-full", c.dot)} /> {g}
                </span>
              ))}
              <span className="text-slate-500 ml-2">{visibleTables.length} bảng · {visibleFks.length} quan hệ</span>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải lược đồ…</div>
        ) : (
          <Tabs defaultValue="graph" className="w-full">
            <TabsList>
              <TabsTrigger value="graph"><Network className="h-4 w-4 mr-1.5" />Sơ đồ</TabsTrigger>
              <TabsTrigger value="tree"><Database className="h-4 w-4 mr-1.5" />Cây bảng</TabsTrigger>
            </TabsList>

            <TabsContent value="graph" className="mt-3">
              <Card>
                <CardContent className="p-0">
                  <div className="h-[70vh] min-h-[500px] rounded-md overflow-hidden">
                    <SchemaGraph tables={visibleTables} fks={visibleFks} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tree" className="mt-3">
              <SchemaTree
                tables={visibleTables}
                fks={visibleFks}
                onAdd={(t) => { setAddTable(t); setAddOpen(true); }}
                onChanged={() => qc.invalidateQueries({ queryKey: ["admin-schema"] })}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <AddColumnDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        table={addTable}
        tables={tables.map(t => t.table_name).filter(EDITABLE_TABLE)}
        onDone={() => qc.invalidateQueries({ queryKey: ["admin-schema"] })}
      />
    </AppShell>
  );
}

// ============ Graph ============
const NODE_W = 264;
const COLLAPSED_H = 96;
const HEAD_H = 66;
const ROW_H = 24;
const EXPANDED_MAX = 340;

function nodeHeight(colCount: number, expanded: boolean) {
  if (!expanded) return COLLAPSED_H;
  return Math.min(HEAD_H + colCount * ROW_H + 10, EXPANDED_MAX);
}

type GNodeData = {
  group: string;
  viName: string;
  rawName: string;
  colCount: number;
  fkCount: number;
  expanded: boolean;
  onToggle: () => void;
  columns: Col[];
  fkColSet: Set<string>;
  colorDot: string;
  colorBorder: string;
};

function TableGraphNode({ data, selected }: NodeProps) {
  const d = data as unknown as GNodeData;
  return (
    <div
      className={cn(
        "rounded-lg border-2 bg-white shadow-sm overflow-hidden transition-shadow",
        d.colorBorder,
        selected && "ring-2 ring-indigo-400",
      )}
      style={{ width: NODE_W }}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-slate-400" />
      <button
        type="button"
        onClick={d.onToggle}
        className="w-full text-left px-3 py-2 hover:bg-slate-50/80"
      >
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full shrink-0", d.colorDot)} />
          <span className="text-[10px] uppercase tracking-wider text-slate-500 truncate">{d.group}</span>
          {d.expanded
            ? <ChevronDown className="ml-auto h-3.5 w-3.5 text-slate-400 shrink-0" />
            : <ChevronRight className="ml-auto h-3.5 w-3.5 text-slate-400 shrink-0" />}
        </div>
        <div className="font-semibold text-sm leading-tight truncate">{d.viName}</div>
        <div className="text-[11px] font-mono text-slate-500 truncate">{d.rawName}</div>
        <div className="mt-0.5 text-[11px] text-slate-500">{d.colCount} cột · {d.fkCount} liên kết</div>
      </button>
      {d.expanded && (
        <div className="border-t bg-slate-50/40 overflow-auto" style={{ maxHeight: EXPANDED_MAX - HEAD_H }}>
          {d.columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center gap-1.5 px-3 py-1 text-[11px] border-b border-slate-100 last:border-b-0"
              title={typeVi(col)}
            >
              {col.is_pk && <KeyRound className="h-3 w-3 text-amber-600 shrink-0" />}
              {d.fkColSet.has(col.name) && <Link2 className="h-3 w-3 text-sky-600 shrink-0" />}
              <span className="font-mono truncate">{col.name}</span>
              <span className="ml-auto text-slate-400 shrink-0">{typeVi(col)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const schemaNodeTypes: NodeTypes = { table: TableGraphNode };

function layoutWithDagre(
  rawNodes: RFNode[],
  rawEdges: RFEdge[],
  heightOf: (id: string) => number,
) {
  const g = new dagre.graphlib.Graph({ multigraph: true });
  g.setGraph({
    rankdir: "LR",
    nodesep: 34,
    ranksep: 120,
    edgesep: 18,
    marginx: 24,
    marginy: 24,
  });
  g.setDefaultEdgeLabel(() => ({}));
  rawNodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: heightOf(n.id) }));
  rawEdges.forEach((e) => g.setEdge(e.source, e.target, {}, e.id));
  dagre.layout(g);
  const nodes = rawNodes.map((n) => {
    const p = g.node(n.id);
    const h = heightOf(n.id);
    return {
      ...n,
      position: { x: p.x - NODE_W / 2, y: p.y - h / 2 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
  return { nodes, edges: rawEdges };
}

function SchemaGraph({ tables, fks }: { tables: Tbl[]; fks: FK[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  const setAll = useCallback((on: boolean, names: string[]) => {
    setExpanded(on ? new Set(names) : new Set());
  }, []);

  const { nodes, edges } = useMemo(() => {
    const tableSet = new Set(tables.map((t) => t.table_name));
    const rawNodes: RFNode[] = tables.map((t) => {
      const g = GROUP_OF(t.table_name);
      const c = GROUP_COLOR[g] ?? GROUP_COLOR.Khác;
      const fkColSet = new Set(fks.filter((f) => f.from_table === t.table_name).map((f) => f.from_column));
      const fkCount = fks.filter((f) => f.from_table === t.table_name || f.to_table === t.table_name).length;
      const data: GNodeData = {
        group: g,
        viName: tableVi(t.table_name),
        rawName: t.table_name,
        colCount: t.columns.length,
        fkCount,
        expanded: expanded.has(t.table_name),
        onToggle: () => toggle(t.table_name),
        columns: t.columns,
        fkColSet,
        colorDot: c.dot,
        colorBorder: c.border,
      };
      return {
        id: t.table_name,
        type: "table",
        position: { x: 0, y: 0 },
        data: data as unknown as Record<string, unknown>,
      };
    });

    const rawEdges: RFEdge[] = fks
      .filter((f) => tableSet.has(f.from_table) && tableSet.has(f.to_table) && f.from_table !== f.to_table)
      .map((f, i) => ({
        id: `${f.constraint}-${i}`,
        source: f.from_table,
        target: f.to_table,
        type: "smoothstep",
        label: f.from_column,
        labelStyle: { fontSize: 10, fill: "#475569" },
        labelBgStyle: { fill: "#fff", fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
        style: { stroke: "#94a3b8", strokeWidth: 1.5 },
      }));

    return layoutWithDagre(rawNodes, rawEdges, (id) => {
      const t = tables.find((x) => x.table_name === id);
      return nodeHeight(t?.columns.length ?? 0, expanded.has(id));
    });
  }, [tables, fks, expanded, toggle]);

  const names = useMemo(() => tables.map((t) => t.table_name), [tables]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={schemaNodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.15}
      maxZoom={1.5}
      nodesDraggable
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{ type: "smoothstep" }}
    >
      <Panel position="top-right">
        <div className="flex items-center gap-1 rounded-md border bg-white/95 p-1 shadow-sm backdrop-blur">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAll(true, names)} disabled={expanded.size === names.length && names.length > 0}>
            Mở tất cả
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAll(false, names)} disabled={expanded.size === 0}>
            Thu gọn
          </Button>
        </div>
      </Panel>
      <Panel position="top-left">
        <div className="rounded-md border bg-white/95 px-2 py-1 text-[11px] text-slate-500 shadow-sm backdrop-blur">
          Bấm vào khối để mở/đóng danh sách cột
        </div>
      </Panel>
      <Background gap={20} />
      <Controls showInteractive={false} />
      <MiniMap pannable zoomable style={{ height: 90 }} />
    </ReactFlow>
  );
}


// ============ Tree view ============
function SchemaTree({
  tables, fks, onAdd, onChanged,
}: {
  tables: Tbl[]; fks: FK[]; onAdd: (t: string) => void; onChanged: () => void;
}) {
  const grouped = useMemo(() => {
    const m: Record<string, Tbl[]> = {};
    for (const t of tables) (m[GROUP_OF(t.table_name)] ??= []).push(t);
    return m;
  }, [tables]);
  const order = GROUP_ORDER;

  return (
    <div className="space-y-3">
      {order.filter(g => grouped[g]?.length).map(g => (
        <Card key={g}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-full", GROUP_COLOR[g].dot)} />
              {g} <span className="text-slate-400 font-normal">· {grouped[g].length} bảng</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {grouped[g].sort((a, b) => a.table_name.localeCompare(b.table_name)).map(t => (
              <TableNode key={t.table_name} tbl={t} fks={fks} onAdd={onAdd} onChanged={onChanged} />
            ))}
          </CardContent>
        </Card>
      ))}
      {tables.length === 0 && <div className="text-sm text-slate-500 p-4">Không có bảng nào phù hợp bộ lọc.</div>}
    </div>
  );
}

function TableNode({
  tbl, fks, onAdd, onChanged,
}: { tbl: Tbl; fks: FK[]; onAdd: (t: string) => void; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const outFk = fks.filter(f => f.from_table === tbl.table_name);
  const inFk = fks.filter(f => f.to_table === tbl.table_name);
  const editable = EDITABLE_TABLE(tbl.table_name);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn("rounded-md border bg-white", open && "shadow-sm")}>
        <div className="flex items-center gap-2 p-2 sm:p-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 flex-1 min-w-0 text-left">
              {open ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{tableVi(tbl.table_name)}</div>
                <div className="text-[11px] font-mono text-slate-500 truncate">{tbl.table_name}</div>
              </div>
            </button>
          </CollapsibleTrigger>
          <Badge variant="outline" className="hidden sm:inline-flex">{tbl.columns.length} cột</Badge>
          {(outFk.length + inFk.length) > 0 && (
            <Badge variant="outline" className="hidden md:inline-flex bg-slate-50">
              <Link2 className="h-3 w-3 mr-1" />{outFk.length + inFk.length}
            </Badge>
          )}
          {editable && (
            <Button size="sm" variant="outline" onClick={() => onAdd(tbl.table_name)}>
              <Plus className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Thêm cột</span>
            </Button>
          )}
        </div>
        <CollapsibleContent>
          <div className="border-t p-3 space-y-3">
            {TABLE_DESC[tbl.table_name] && (
              <p className="text-xs text-slate-600 bg-slate-50 rounded-md p-2 leading-relaxed">
                {TABLE_DESC[tbl.table_name]}
              </p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500">
                    <th className="py-1.5 pr-3">Cột</th>
                    <th className="py-1.5 pr-3">Ý nghĩa</th>
                    <th className="py-1.5 pr-3">Kiểu</th>
                    <th className="py-1.5 pr-3">Bắt buộc</th>
                    <th className="py-1.5 pr-3">Mặc định</th>
                    <th className="py-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {tbl.columns.map(col => (
                    <ColumnRow key={col.name} tbl={tbl.table_name} col={col} fks={fks} editable={editable} onChanged={onChanged} />
                  ))}
                </tbody>
              </table>
            </div>
            {(outFk.length > 0 || inFk.length > 0) && (
              <div className="grid gap-3 md:grid-cols-2 text-xs">
                {outFk.length > 0 && (
                  <div className="rounded-md border bg-sky-50/50 p-2">
                    <div className="font-medium text-slate-700 mb-1.5">Bảng này liên kết tới ({outFk.length})</div>
                    <ul className="space-y-1">
                      {outFk.map(f => (
                        <li key={f.constraint} className="flex items-center gap-1.5">
                          <span className="text-slate-500">Mỗi {tableVi(tbl.table_name).toLowerCase()} gắn với một</span>
                          <span className="font-medium">{tableVi(f.to_table)}</span>
                          <span className="font-mono text-slate-400 text-[10px]">({f.from_column})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {inFk.length > 0 && (
                  <div className="rounded-md border bg-emerald-50/50 p-2">
                    <div className="font-medium text-slate-700 mb-1.5">Được các bảng khác dùng ({inFk.length})</div>
                    <ul className="space-y-1">
                      {inFk.map(f => (
                        <li key={f.constraint} className="flex items-center gap-1.5">
                          <span className="font-medium">{tableVi(f.from_table)}</span>
                          <span className="text-slate-500">tham chiếu đến bảng này</span>
                          <span className="font-mono text-slate-400 text-[10px]">({f.from_column})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ColumnRow({
  tbl, col, fks, editable, onChanged,
}: { tbl: string; col: Col; fks: FK[]; editable: boolean; onChanged: () => void }) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [newName, setNewName] = useState(col.name);
  const isCore = ["id", "created_at", "updated_at"].includes(col.name);
  const isFk = fks.some(f => f.from_table === tbl && f.from_column === col.name);
  const canModify = editable && !isCore && !col.is_pk;

  const rename = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_rename_column", {
        _table: tbl, _old: col.name, _new: newName.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(`Đã đổi tên "${col.name}" → "${newName}"`); setRenameOpen(false); onChanged(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const drop = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_drop_column", { _table: tbl, _column: col.name });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(`Đã xoá cột "${col.name}"`); setDropOpen(false); onChanged(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <tr className="border-t">
      <td className="py-1.5 pr-3">
        <div className="flex items-center gap-1.5">
          {col.is_pk && <KeyRound className="h-3 w-3 text-amber-600" />}
          {isFk && <Link2 className="h-3 w-3 text-sky-600" />}
          <span className="font-mono">{col.name}</span>
        </div>
      </td>
      <td className="py-1.5 pr-3 text-xs text-slate-600">{colHint(col, tbl, fks) || "—"}</td>
      <td className="py-1.5 pr-3 text-xs text-slate-600" title={col.udt || col.type}>{typeVi(col)}</td>
      <td className="py-1.5 pr-3 text-xs">
        {col.nullable ? <span className="text-slate-400">không</span> : <span className="text-rose-600 font-medium">có</span>}
      </td>
      <td className="py-1.5 pr-3 font-mono text-xs text-slate-500 max-w-[220px] truncate" title={col.default ?? ""}>
        {col.default ?? "—"}
      </td>
      <td className="py-1.5 text-right">
        {canModify && !isFk && (
          <div className="inline-flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setNewName(col.name); setRenameOpen(true); }} aria-label="Đổi tên cột">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600 hover:text-rose-700" onClick={() => setDropOpen(true)} aria-label="Xoá cột">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </td>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tên cột</DialogTitle>
            <DialogDescription>
              Đổi tên cột <span className="font-mono">{col.name}</span> trong bảng <span className="font-mono">{tbl}</span>.
              Lưu ý: code phía frontend đang dùng tên cũ sẽ bị lỗi cho đến khi cập nhật.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Tên mới</Label>
            <Input value={newName} onChange={e => setNewName(e.target.value.toLowerCase())} placeholder="ten_cot_moi" />
            <p className="text-xs text-slate-500">Chỉ dùng chữ thường, số, và dấu gạch dưới.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Huỷ</Button>
            <Button onClick={() => rename.mutate()} disabled={rename.isPending || !newName || newName === col.name}>
              {rename.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Đổi tên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={dropOpen} onOpenChange={setDropOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá cột "{col.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Toàn bộ dữ liệu trong cột này của bảng <span className="font-mono">{tbl}</span> sẽ bị xoá vĩnh viễn.
              Thao tác này không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700" onClick={(e) => { e.preventDefault(); drop.mutate(); }}>
              {drop.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Xoá cột
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </tr>
  );
}

// ============ Add column dialog ============
function AddColumnDialog({
  open, onOpenChange, table, tables, onDone,
}: {
  open: boolean; onOpenChange: (b: boolean) => void;
  table: string | null; tables: string[]; onDone: () => void;
}) {
  const [tbl, setTbl] = useState<string>("");
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [nullable, setNullable] = useState(true);
  const [def, setDef] = useState("");

  useEffect(() => {
    if (open) {
      setTbl(table ?? tables[0] ?? "");
      setName(""); setType("text"); setNullable(true); setDef("");
    }
  }, [open, table, tables]);

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_add_column", {
        _table: tbl, _column: name.trim(), _type: type,
        _nullable: nullable, _default: def.trim() || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(`Đã thêm cột "${name}" vào ${tableVi(tbl)}`); onOpenChange(false); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const nameValid = /^[a-z_][a-z0-9_]*$/.test(name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Thêm cột mới</DialogTitle>
          <DialogDescription>Cột sẽ được thêm ngay vào bảng. Nên đặt "cho phép rỗng" hoặc có giá trị mặc định nếu bảng đã có dữ liệu.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Bảng</Label>
            <Select value={tbl} onValueChange={setTbl}>
              <SelectTrigger><SelectValue placeholder="Chọn bảng…" /></SelectTrigger>
              <SelectContent>
                {tables.sort().map(t => (
                  <SelectItem key={t} value={t}>{tableVi(t)} <span className="text-slate-400 font-mono ml-2">{t}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Tên cột</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value.toLowerCase())}
                placeholder="vi_du_ten_cot"
              />
              {name && !nameValid && <p className="text-xs text-rose-600 mt-1">Chỉ dùng chữ thường, số, gạch dưới; bắt đầu bằng chữ.</p>}
            </div>
            <div>
              <Label>Kiểu dữ liệu</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALLOWED_TYPES.map(t => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Cho phép rỗng (NULL)</div>
              <div className="text-xs text-slate-500">Tắt nếu cột này bắt buộc có giá trị.</div>
            </div>
            <Switch checked={nullable} onCheckedChange={setNullable} />
          </div>

          <div>
            <Label>Giá trị mặc định (tuỳ chọn)</Label>
            <Input value={def} onChange={e => setDef(e.target.value)} placeholder="VD: '' cho text, 0 cho số, false, now(), gen_random_uuid()" />
            <p className="text-xs text-slate-500 mt-1">
              Nhập biểu thức SQL. Ví dụ: <code className="font-mono">'chưa xác định'</code>, <code className="font-mono">0</code>,
              <code className="font-mono"> false</code>, <code className="font-mono">now()</code>.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={() => add.mutate()} disabled={!tbl || !nameValid || add.isPending}>
            {add.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Thêm cột
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
