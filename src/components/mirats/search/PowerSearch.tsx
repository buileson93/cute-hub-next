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
        // Search for the actual UUID of the incident if ID is a code
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
        toast.success(`Đã đóng sự cố ${id}`);
        return;
      }

      if (intent.kind === "create-pm") {
        // Find system/device ID from target name
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

        // Navigate to maintenance form with pre-filled target
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

      // Default fallback or unhandled intents
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
        <div className="flex items-center gap-4 px-6 py-4 border-b border-border/40 bg-muted/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Search className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CommandInput
              placeholder="Tìm kiếm tài sản, hệ thống, tài liệu hoặc gõ lệnh AI..."
              value={q}
              onValueChange={setQ}
              className="h-12 text-[16px] font-semibold tracking-tight text-foreground/90 placeholder:text-muted-foreground/30"
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
              <TabsTrigger 
                value="all" 
                className="h-7 px-3 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-all text-[12px]"
              >
                Tất cả
              </TabsTrigger>
              <TabsTrigger 
                value="device" 
                className="h-7 px-3 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-all text-[12px]"
              >
                Tài sản
              </TabsTrigger>
              <TabsTrigger 
                value="system" 
                className="h-7 px-3 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-all text-[12px]"
              >
                Hệ thống
              </TabsTrigger>
              <TabsTrigger 
                value="document" 
                className="h-7 px-3 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-all text-[12px]"
              >
                Tài liệu
              </TabsTrigger>
              <TabsTrigger 
                value="action" 
                className="h-7 px-3 rounded-full data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-all text-[12px]"
              >
                Hành động
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row h-[min(80dvh,540px)]">
          {/* Left Column: Search Results */}
          <div className="flex-1 flex flex-col border-r border-border/30 min-w-0">
            <CommandList className="flex-1">
              {loading && q.length > 0 && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground/60">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="text-sm font-medium">Đang tìm kiếm dữ liệu...</span>
                </div>
              )}

              {!loading && q.length > 0 && filteredRows.length === 0 && (
                <CommandEmpty className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                      <Search className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Không tìm thấy kết quả</p>
                    <p className="text-xs text-muted-foreground">Thử tìm kiếm với từ khóa khác</p>
                  </div>
                </CommandEmpty>
              )}

              {/* AI Actions */}
              {hasQuery && intent.kind !== "jump-to" && intent.confidence > 0.6 && (
                <CommandGroup heading="Gợi ý thông minh">
                  <CommandItem
                    onSelect={() => handleExecuteIntent(intent)}
                    onMouseEnter={() => setFocusedRow({
                      entity: "nav" as any,
                      id: "intent",
                      title: describeIntent(intent),
                      subtitle: "Trợ lý MIRATS AI",
                      to: ""
                    })}
                    className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 group cursor-pointer"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Star className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-bold text-foreground">{describeIntent(intent)}</span>
                      <span className="text-[11px] text-muted-foreground/70 truncate italic">Xử lý bởi MIRATS AI</span>
                    </div>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Search Hits */}
              {filteredRows.length > 0 && (
                <CommandGroup heading={q ? `Kết quả (${filteredRows.length})` : "Gợi ý cho bạn"}>
                  {filteredRows.map((row) => {
                    const meta = ENTITY_META[row.entity] || { icon: Package, label: "Khác" };
                    const Icon = meta.icon;
                    return (
                      <CommandItem
                        key={`${row.entity}-${row.id}`}
                        onSelect={() => handleSelect(row)}
                        onMouseEnter={() => setFocusedRow(row)}
                        className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl group transition-all cursor-pointer"
                      >
                        <div className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                          "bg-muted/40 text-muted-foreground/60 group-hover:bg-primary/10 group-hover:text-primary"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-semibold text-foreground truncate">
                            <Highlight text={row.title} query={activeTerm} />
                          </span>
                          {row.subtitle && (
                            <span className="text-[11px] text-muted-foreground/70 truncate">
                              <Highlight text={row.subtitle} query={activeTerm} />
                            </span>
                          )}
                        </div>
                        {row.sysName && (
                          <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                            <Network className="h-3 w-3 text-primary/70" />
                            <span className="text-[10px] font-medium text-primary/70">{row.sysName}</span>
                          </div>
                        )}
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
                      onMouseEnter={() => setFocusedRow({ entity: "nav" as any, id: item.to, title: item.label, subtitle: item.desc || "", to: item.to })}
                      className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl group transition-all cursor-pointer"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground/60 group-hover:bg-primary/10 group-hover:text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-semibold text-foreground truncate">{item.label}</span>
                        {item.desc && <span className="text-[11px] text-muted-foreground/70 truncate">{item.desc}</span>}
                      </div>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4 text-primary" />
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
                    onMouseEnter={() => setFocusedRow({
                      entity: "nav" as any,
                      id: "logout",
                      title: "Đăng xuất",
                      subtitle: "Thoát khỏi phiên làm việc hiện tại",
                      to: ""
                    })}
                    className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="text-[13px] font-semibold">Đăng xuất</span>
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Recent History when no query */}
              {!q && recentItems.length > 0 && (
                <CommandGroup heading="Tìm kiếm gần đây">
                  {recentItems.map((row) => (
                    <CommandItem
                      key={`recent-${row.id}`}
                      onSelect={() => handleSelect(row)}
                      className="flex items-center gap-3 px-3 py-2 mx-2 rounded-xl group"
                    >
                      <History className="h-4 w-4 text-muted-foreground/40" />
                      <span className="text-[13px] font-medium text-foreground/80">{row.title}</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </div>

          {/* Right Column: Preview/Context */}
          <div className="hidden md:flex w-80 flex-col bg-muted/5 p-5 border-l border-border/30">
            <div className="flex-1 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">Phân tích thông minh</span>
                <div className="h-[2px] w-8 bg-primary/40 rounded-full" />
              </div>
              
              {!focusedRow ? (
                <div className="flex flex-col gap-6 py-2">
                  <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-background border border-border/40 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-[13px] font-bold">Trợ lý MIRATS</span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-muted-foreground/80">
                      Hãy thử gõ <b>"bảo trì"</b>, <b>"sự cố"</b> hoặc mã thiết bị để bắt đầu phân tích.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest px-1">Lối tắt nhanh</span>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-transparent hover:border-border/40 hover:bg-muted/30 transition-all cursor-default">
                        <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center shadow-sm text-muted-foreground">
                          <Filter className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground/80">Tab để lọc loại</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-transparent hover:border-border/40 hover:bg-muted/30 transition-all cursor-default">
                        <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center shadow-sm text-muted-foreground">
                          <Command className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground/80">Mũi tên để duyệt</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5 py-2 animate-in fade-in duration-300">
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-background border border-border/50 shadow-md relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
                    <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                      {(() => {
                        const meta = ENTITY_META[focusedRow.entity];
                        const Icon = meta?.icon || Package;
                        return <Icon className="h-8 w-8 text-primary" />;
                      })()}
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                      {ENTITY_META[focusedRow.entity]?.label || "Thông tin"}
                    </span>
                    <span className="text-sm font-bold text-foreground mt-2 text-center break-all px-2 leading-tight">
                      {focusedRow.title}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    {focusedRow.subtitle && (
                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-background border border-border/40 shadow-sm">
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-muted/30 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-medium text-muted-foreground/60">Chi tiết</span>
                          <span className="text-[12px] leading-tight text-foreground/80">{focusedRow.subtitle}</span>
                        </div>
                      </div>
                    )}

                    {focusedRow.sysName && (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border/40 shadow-sm">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-medium text-muted-foreground/60">Hệ thống</span>
                          <span className="text-[12px] font-bold text-primary flex items-center gap-1.5">
                            <Network className="h-3.5 w-3.5" />
                            {focusedRow.sysName}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {focusedRow.count !== undefined && (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border/40 shadow-sm">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-medium text-muted-foreground/60">Quy mô</span>
                          <span className="text-[12px] font-bold text-emerald-500 flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5" />
                            {focusedRow.count} tài sản
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-[11px] leading-relaxed text-primary/70 font-medium">
                      Nhấn Enter để mở {ENTITY_META[focusedRow.entity]?.label.toLowerCase() || "chi tiết"} này.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Keyboard shortcuts */}
            <div className="mt-auto pt-5 border-t border-border/40">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/40 bg-muted/20 px-2 py-1 rounded-md">
                  <kbd className="min-w-[20px] text-center">↵</kbd>
                  <span>MỞ</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/40 bg-muted/20 px-2 py-1 rounded-md">
                  <kbd className="min-w-[20px] text-center">ESC</kbd>
                  <span>ĐÓNG</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
}
