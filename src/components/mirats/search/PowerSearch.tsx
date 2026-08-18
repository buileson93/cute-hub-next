import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Network, Package, ShieldCheck, FileText, 
  Search, Loader2, ArrowRight, History, Star,
  X, Command, Filter, ExternalLink, Building2, MapPin, 
  HeartPulse, Lock, UserCog, FilePlus2, Database, Sparkles, 
  Ticket, MessageSquare, FolderKanban, LogOut, CheckCircle2
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/backend/client";
import { useGlobalSearch, Highlight, type SearchRow, ENTITY_META, TIER } from "@/lib/mirats/global-search";

import { useTimKiemToanCuc } from "@/lib/mirats/search/tim-kiem";
import { toast } from "sonner";
import { matchIntent, describeIntent, type Intent } from "@/lib/mirats/command-intent";
import { useSuCoTransition } from "@/lib/mirats/su-co-workflow-client";
import { ghiBaoDuongFull } from "@/lib/mirats/ghi-nghiep-vu-actions";

type TabValue = "all" | "device" | "system" | "document" | "action";

interface PowerSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MANAGER: any[] = ["admin", "phong_kt"];
const ADMIN: any[] = ["admin"];

const NAV_COMMANDS: { header: string; items: any[] }[] = [
  {
    header: "Vận hành",
    items: [
      { to: "/", label: "Overview", icon: LayoutDashboard, desc: "Bảng tổng quan tình trạng tài sản, cảnh báo và chỉ số vận hành." },
      { to: "/he-thong/cay", label: "Hệ Thống", icon: Network, desc: "Sơ đồ cây & danh sách toàn bộ hệ thống, tài sản theo phân cấp." },
    ],
  },
  {
    header: "Biểu mẫu & Trao đổi",
    items: [
      { to: "/forms", label: "Biên bản", icon: FileText, desc: "Tạo, ký và tra cứu biên bản bảo dưỡng, sự cố." },
      { to: "/admin/forms", label: "Mẫu biên bản", icon: FilePlus2, roles: MANAGER, desc: "Thiết kế và quản lý mẫu biểu bảo dưỡng theo hệ thống." },
      { to: "/du-an", label: "Dự án & Tiến độ", icon: FolderKanban, desc: "Theo dõi dự án, công việc và tiến độ triển khai." },
      { to: "/tickets", label: "Yêu cầu hỗ trợ", icon: Ticket, desc: "Tiếp nhận và xử lý yêu cầu hỗ trợ kỹ thuật." },
      { to: "/messages", label: "Tin nhắn", icon: MessageSquare, desc: "Trao đổi nội bộ theo thời gian thực." },
    ],
  },
  {
    header: "Tài sản & Danh mục",
    items: [
      { to: "/vat-tu", label: "Vật tư & Kho", icon: Package, desc: "Quản lý tồn kho, xuất nhập và vật tư dự phòng." },
      { to: "/tuoi-tho", label: "Tuổi thọ & Vòng đời", icon: HeartPulse, desc: "Theo dõi tuổi thọ, chu kỳ thay thế tài sản." },
      { to: "/giay-phep", label: "Giấy phép", icon: ShieldCheck, desc: "Quản lý giấy phép khai thác và hạn hiệu lực." },
      { to: "/danh-muc/don-vi", label: "Đơn vị", icon: Building2, roles: MANAGER, desc: "Danh mục đơn vị quản lý." },
      { to: "/danh-muc/vi-tri", label: "Vị trí", icon: MapPin, roles: MANAGER, desc: "Danh mục vị trí lắp đặt tài sản." },
    ],
  },
  {
    header: "Quản trị",
    items: [
      { to: "/phan-quyen", label: "Phân quyền & Bảo mật", icon: Lock, roles: MANAGER, desc: "Cấu hình vai trò, quyền truy cập và bảo mật." },
      { to: "/admin/permissions", label: "Phân quyền RBAC & phạm vi", icon: ShieldCheck, roles: ADMIN, desc: "Gán role, phạm vi tổ chức/đơn vị, ma trận quyền, view-as, yêu cầu quyền." },
      { to: "/admin/users", label: "Quản lý tài khoản", icon: UserCog, roles: ADMIN, desc: "Tạo, phân quyền và quản lý người dùng." },
      { to: "/admin/audit", label: "Nhật ký hệ thống", icon: Lock, roles: ADMIN, desc: "Nhật ký thay đổi dữ liệu và khả năng hoàn tác." },
      { to: "/admin/schema", label: "Sơ đồ CSDL", icon: Database, roles: ADMIN, desc: "Sơ đồ quan hệ cơ sở dữ liệu tương tác." },
      { to: "/admin/ai", label: "Cấu hình AI", icon: Sparkles, roles: ADMIN, desc: "Bật/tắt và cấu hình trợ lý MIRATS AI." },
    ],
  },
];

const RECENT_KEY = "mirats-powersearch-recent";

export function PowerSearch({ open, onOpenChange }: PowerSearchProps) {
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [focusedRow, setFocusedRow] = useState<SearchRow | null>(null);
  const navigate = useNavigate();
  const { roles } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { mutateAsync: transition } = useSuCoTransition();

  const { rows, loading, hasQuery, activeTerm } = useGlobalSearch(q);
  const { ket_qua: rowsToanCuc } = useTimKiemToanCuc(q, { gioiHan: 20 });

  // Filter rows based on active tab
  const filteredRows = useMemo(() => {
    let combined = [...rows];
    
    // Add results from global search if not already present
    const existingKeys = new Set(rows.map(r => `${r.entity}:${r.id}`));
    rowsToanCuc.forEach(r => {
      const entityMap: Record<string, any> = {
        'thiet_bi': 'thiet_bi',
        'dm_he_thong': 'he_thong',
        'tai_lieu': 'tai_lieu',
        'giay_phep_khai_thac': 'giay_phep'
      };
      const entity = entityMap[r.loai] || 'he_thong';
      const key = `${entity}:${r.id}`;
      if (!existingKeys.has(key)) {
        combined.push({
          entity,
          id: r.id,
          title: r.tieuDe,
          subtitle: r.motaNgan || "",
          to: r.route || `/${entity.replace('_', '-')}/${r.id}`
        } as SearchRow);
      }
    });

    if (activeTab === "all") return combined;
    if (activeTab === "device") return combined.filter(r => r.entity === "thiet_bi");
    if (activeTab === "system") return combined.filter(r => r.entity === "he_thong");
    if (activeTab === "document") return combined.filter(r => r.entity === "tai_lieu" || r.entity === "giay_phep");
    if (activeTab === "action") {
      const actions: SearchRow[] = [];
      NAV_COMMANDS.forEach(group => {
        group.items.forEach(item => {
          if (!item.roles || (roles && item.roles.some((r: any) => roles.includes(r)))) {
            actions.push({
              entity: "nav" as any,
              id: item.to,
              title: item.label,
              subtitle: item.desc || "",
              to: item.to
            } as SearchRow);
          }
        });
      });
      return actions;
    }
    return combined;
  }, [rows, rowsToanCuc, activeTab]);

  const recentItems = useMemo(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as SearchRow[];
    } catch {
      return [];
    }
  }, [open]);

  const saveRecent = (row: SearchRow) => {
    const next = [row, ...recentItems.filter(r => r.id !== row.id)].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  const handleSelect = (row: SearchRow) => {
    if (row.entity === ("nav" as any) || row.to) {
      saveRecent(row);
      onOpenChange(false);
      navigate({ to: row.to as any });
      return;
    }
  };

  const intent = useMemo(() => matchIntent(q), [q]);

  const handleExecuteIntent = async (intent: Intent) => {
    try {
      if (intent.kind === "logout") {
        await supabase.auth.signOut();
        onOpenChange(false);
        navigate({ to: "/auth" });
        return;
      }

      if (intent.kind === "navigate") {
        onOpenChange(false);
        navigate({ to: intent.to as any });
        toast.success(`Đã chuyển tới ${intent.label}`);
        return;
      }

      if (intent.kind === "close-incident") {
        const id = intent.id;
        const { data: sc } = await supabase
          .from("su_co")
          .select("id")
          .or(`ma_nhom_bc.eq.${id},id.eq.${id}`)
          .maybeSingle();

        if (!sc) {
          toast.error("Không tìm thấy sự cố " + id);
          return;
        }

        await transition({
          bang: "su_co",
          id: sc.id,
          den: "hoan_thanh",
          ghi_chu: "Đóng nhanh từ Command Palette",
        });
        
        onOpenChange(false);
        toast.success(`Đã xử lý sự cố ${id}`);
        return;
      }

      if (intent.kind === "create-pm") {
        const { data: ht } = await supabase
          .from("dm_he_thong")
          .select("id, ten")
          .ilike("ten", `%${intent.target}%`)
          .limit(1)
          .maybeSingle();

        if (!ht) {
          toast.error(`Không tìm thấy hệ thống "${intent.target}"`);
          return;
        }

        onOpenChange(false);
        navigate({ 
          to: "/forms", 
          search: { 
            type: "bao-tri",
            target: ht.id,
            targetName: ht.ten
          } as any 
        });
        return;
      }

      onOpenChange(false);
      toast.info(describeIntent(intent));
    } catch (err: any) {
      console.error("Intent execution error:", err);
      toast.error(err.message || "Lỗi khi thực hiện hành động");
    }
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  useEffect(() => {
    setFocusedRow(null);
  }, [q, activeTab]);

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col bg-background/98 backdrop-blur-2xl border border-border/40 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden w-full h-full ring-1 ring-white/10 dark:ring-white/5">
        {/* Header Section */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-muted/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Search className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CommandInput
              placeholder="Tìm kiếm tài sản, hệ thống, tài liệu hoặc gõ lệnh AI..."
              value={q}
              onValueChange={setQ}
              className="h-10 text-[14px] font-medium tracking-tight text-foreground/90 placeholder:text-muted-foreground/30"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/30 font-mono text-[10px] font-bold text-muted-foreground/60 shadow-sm">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-4 py-2 border-b border-border/30 bg-background/50">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList className="h-8 bg-transparent p-0 gap-1">
              {["all", "device", "system", "document", "action"].map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab} 
                  className="h-7 px-3 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-all text-[12px]"
                >
                  {tab === "all" ? "Tất cả" : tab === "device" ? "Tài sản" : tab === "system" ? "Hệ thống" : tab === "document" ? "Tài liệu" : "Hành động"}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col h-[min(70dvh,480px)]">
          {/* Search Results */}
          <CommandList className="flex-1">
            {loading && q.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground/60">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs font-medium">Đang tìm...</span>
              </div>
            )}

            {!loading && q.length > 0 && filteredRows.length === 0 && (
              <CommandEmpty className="py-12 text-center text-xs text-muted-foreground">
                Không tìm thấy kết quả
              </CommandEmpty>
            )}

            {/* AI Actions */}
            {hasQuery && intent.kind !== "jump-to" && intent.confidence > 0.6 && (
              <CommandGroup heading="Gợi ý">
                <CommandItem
                  onSelect={() => handleExecuteIntent(intent)}
                  className="flex items-center gap-2 px-3 py-2 mx-1.5 rounded-lg hover:bg-primary/5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[13px] font-medium text-foreground">{describeIntent(intent)}</span>
                </CommandItem>
              </CommandGroup>
            )}

            {/* Search Hits */}
            {filteredRows.length > 0 && (
              <CommandGroup heading={q ? "Kết quả" : "Gần đây"}>
                {filteredRows.map((row) => {
                  const meta = ENTITY_META[row.entity] || { icon: Package };
                  const Icon = meta.icon;
                  return (
                    <CommandItem
                      key={`${row.entity}-${row.id}`}
                      onSelect={() => handleSelect(row)}
                      onMouseEnter={() => setFocusedRow(row)}
                      className="flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground/70">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-medium text-foreground truncate">{row.title}</span>
                        <span className="text-[11px] text-muted-foreground/60 truncate">{row.subtitle}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Navigation Commands when no query or in action tab */}
            {(!q || activeTab === "action") && NAV_COMMANDS.map((group) => (
              <CommandGroup key={group.header} heading={group.header}>
                {group.items.filter(item => !item.roles || (roles && item.roles.some((r: any) => roles.includes(r)))).map((item) => (
                  <CommandItem
                    key={item.to}
                    onSelect={() => handleSelect({ entity: "nav" as any, id: item.to, title: item.label, subtitle: item.desc || "", to: item.to })}
                    className="flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg hover:bg-muted/50 transition-all cursor-pointer"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground/60">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-medium text-foreground truncate">{item.label}</span>
                      {item.desc && <span className="text-[11px] text-muted-foreground/60 truncate">{item.desc}</span>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            {/* Logout Action */}
            {(!q || activeTab === "action") && (
              <CommandGroup heading="Tài khoản">
                <CommandItem
                  onSelect={() => handleExecuteIntent({ kind: "logout", confidence: 1 })}
                  className="flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-destructive/10">
                    <LogOut className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[13px] font-medium">Đăng xuất</span>
                </CommandItem>
              </CommandGroup>
            )}

            {/* Recent History when no query */}
            {!q && recentItems.length > 0 && activeTab === "all" && (
              <CommandGroup heading="Tìm kiếm gần đây">
                {recentItems.map((row) => (
                  <CommandItem
                    key={`recent-${row.id}`}
                    onSelect={() => handleSelect(row)}
                    className="flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg"
                  >
                    <History className="h-3.5 w-3.5 text-muted-foreground/40" />
                    <span className="text-[13px] font-medium text-foreground/80">{row.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </div>
      </div>
    </CommandDialog>
  );
}
