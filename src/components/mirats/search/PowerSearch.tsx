import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Network, Package, ShieldCheck, FileText, 
  Search, Loader2, ArrowRight, History, Star,
  X, Command, Filter, ExternalLink, Building2, MapPin, 
  HeartPulse, Lock, UserCog, FilePlus2, Database, Sparkles, 
  Ticket, MessageSquare, FolderKanban, LogOut
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalSearch, Highlight, type SearchRow, ENTITY_META, TIER } from "@/lib/mirats/global-search";

import { useTimKiemToanCuc } from "@/lib/mirats/search/tim-kiem";
import { toast } from "sonner";
import { matchIntent, describeIntent, type Intent } from "@/lib/mirats/command-intent";

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { roles } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (activeTab === "action") return []; // Actions handled separately
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
    saveRecent(row);
    onOpenChange(false);
    navigate({ to: row.to as any });
  };

  const intent = useMemo(() => matchIntent(q), [q]);

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
    setSelectedIndex(0);
  }, [q, activeTab]);

  return (
    <CommandDialog 
      open={open} 
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-muted/20">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CommandInput
              placeholder="Tìm kiếm thông minh: tài sản, hệ thống, tài liệu..."
              value={q}
              onValueChange={setQ}
              className="h-10 text-[15px] font-medium"
            />
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40 border border-border/40 font-mono text-[10px] text-muted-foreground/70">
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
        <div className="flex flex-col md:flex-row h-[min(80dvh,600px)]">
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
                    onSelect={() => {
                      if (intent.kind === "logout") {
                        supabase.auth.signOut().then(() => {
                          onOpenChange(false);
                          navigate({ to: "/auth" });
                        });
                        return;
                      }
                      if (intent.kind === "navigate") {
                        onOpenChange(false);
                        navigate({ to: intent.to as any });
                        toast.success(`Đã chuyển tới ${intent.label}`);
                        return;
                      }
                      onOpenChange(false);
                      toast.info(describeIntent(intent));
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 group"
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
                  {filteredRows.map((row, idx) => {
                    const meta = ENTITY_META[row.entity] || { icon: Package, label: "Khác" };
                    const Icon = meta.icon;
                    return (
                      <CommandItem
                        key={`${row.entity}-${row.id}`}
                        onSelect={() => handleSelect(row)}
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
                    onSelect={() => {
                      supabase.auth.signOut().then(() => {
                        onOpenChange(false);
                        navigate({ to: "/auth" });
                      });
                    }}
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
          <div className="hidden md:flex w-72 flex-col bg-muted/10 p-4">
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Phân tích nhanh</span>
                <div className="h-px bg-border/40" />
              </div>
              
              {/* Contextual Stats or Help */}
              {!q ? (
                <div className="flex flex-col gap-6 py-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Star className="h-4 w-4" />
                      <span className="text-[13px] font-bold">Mẹo tìm kiếm</span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-muted-foreground/80">
                      Bạn có thể tìm theo <b>Mã thiết bị</b>, <b>Tên hệ thống</b> hoặc sử dụng lệnh AI như <i>"Tạo biên bản bảo trì"</i>.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 text-primary">
                      <Filter className="h-4 w-4" />
                      <span className="text-[12px] font-bold">Lọc kết quả</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/70">
                      Sử dụng các tab phía trên để thu hẹp phạm vi tìm kiếm của bạn.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-background border border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                      <LayoutDashboard className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground/50 uppercase">Đang phân tích</span>
                    <span className="text-sm font-bold text-foreground mt-1">"{q}"</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-background border border-border/40 flex flex-col gap-1">
                      <span className="text-[10px] font-medium text-muted-foreground">Phân loại</span>
                      <span className="text-[12px] font-bold text-primary">Tự động</span>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-border/40 flex flex-col gap-1">
                      <span className="text-[10px] font-medium text-muted-foreground">Độ khớp</span>
                      <span className="text-[12px] font-bold text-emerald-500">Cao</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Keyboard shortcuts */}
            <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-border/40">
              <div className="flex items-center justify-center text-[10px] font-medium text-muted-foreground/50">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded border border-border bg-background">Enter</kbd>
                  Mở
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
}
