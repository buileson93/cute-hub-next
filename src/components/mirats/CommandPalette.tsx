import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, ShieldCheck, Building2, Network, MapPin,
  Package, HeartPulse, Lock, UserCog, FileText, FilePlus2,
  Database, Sparkles, Ticket, MessageSquare, FolderKanban, LogOut,
  ArrowRight, Loader2, CornerDownLeft, Search,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/backend/client";
import { useSession, type AppRole } from "@/hooks/use-session";
import { getAiPublicConfig } from "@/lib/ai/config.functions";
import {
  useGlobalSearch, normalize,
} from "@/lib/mirats/global-search";
import { useTimKiemToanCuc } from "@/lib/mirats/search/tim-kiem";
import { useDbTaxonomy, useSystemNameOverrides } from "@/lib/mirats/db-taxonomy";
import { toast } from "sonner";
import { matchIntent, describeIntent, type Intent } from "@/lib/mirats/command-intent";

type NavCmd = {
  to: string;
  label: string;
  desc?: string;
  icon: any;
  roles?: AppRole[];
};

const MANAGER: AppRole[] = ["admin", "phong_kt"];
const ADMIN: AppRole[] = ["admin"];

const NAV_COMMANDS: { header: string; items: NavCmd[] }[] = [
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

const diacriticFilter = (value: string, search: string) =>
  normalize(value).includes(normalize(search)) ? 1 : 0;

type Hit = {
  entity: any;
  id: string;
  title: string;
  subtitle?: string;
  to: string;
  sysName?: string;
  count?: number;
};

const RECENT_HITS_KEY = "mirats-recent-hits";
const getRecentHits = (): Hit[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_HITS_KEY) || "[]");
  } catch {
    return [];
  }
};
const saveRecentHit = (hit: Hit) => {
  if (typeof window === "undefined") return;
  const stored = getRecentHits();
  const next = [hit, ...stored.filter((h) => h.to !== hit.to)].slice(0, 10);
  localStorage.setItem(RECENT_HITS_KEY, JSON.stringify(next));
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeValue, setActiveValue] = useState("");
  const navigate = useNavigate();
  const { session, roles } = useSession();

  const { rows, loading, hasQuery } = useGlobalSearch(q) as any;
  const { ket_qua: rowsToanCuc } = useTimKiemToanCuc(q, { gioiHan: 20 });

  const daHienThi = new Set(rows.map((r: any) => `${r.entity}:${r.id}`));
  const rowsMoRong = rowsToanCuc.filter((r: any) => !daHienThi.has(`${r.loai}:${r.id}`));

  const publicCfgFn = useServerFn(getAiPublicConfig);
  const { data: aiCfg } = useQuery({
    queryKey: ["ai-public-config"],
    queryFn: async () => {
      try {
        return await publicCfgFn();
      } catch (err) {
        console.warn("CommandPalette: Failed to fetch AI public config:", err);
        return { enabled: false, model: "", beta_label: "Beta" };
      }
    },
    enabled: !!session,
    staleTime: 60_000,
    retry: 1,
  });

  const [recentHits, setRecentHits] = useState<Hit[]>([]);

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
        setOpen((open) => !open);
      }
    };
    
    const handleOpen = () => setOpen(true);
    const handleToggle = () => setOpen((prev) => !prev);

    document.addEventListener("keydown", down);
    window.addEventListener("mirats:open-command-palette", handleOpen);
    window.addEventListener("mirats:toggle-command-palette", handleToggle);
    
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("mirats:open-command-palette", handleOpen);
      window.removeEventListener("mirats:toggle-command-palette", handleToggle);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setRecentHits(getRecentHits().slice(0, 5));
    }
  }, [open]);

  const handleSelect = useCallback(
    (hit: Hit) => {
      setOpen(false);
      saveRecentHit(hit);
      navigate({ to: hit.to as any });
    },
    [navigate],
  );

  const runIntent = useCallback((intent: Intent) => {
    setOpen(false);
    switch (intent.kind) {
      case "close-incident":
        navigate({ to: "/su-co", search: { q: intent.id } as never });
        toast.info(describeIntent(intent), { description: "Chọn sự cố để đóng." });
        break;
      case "create-pm":
        navigate({ to: "/bao-tri/pm", search: { q: intent.target } as never });
        toast.info(describeIntent(intent));
        break;
      case "jump-to":
        break;
      default:
        toast.info(describeIntent(intent));
    }
  }, [navigate]);

  const showLoading = hasQuery && loading && rows.length === 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      filter={diacriticFilter}
      value={activeValue}
      onValueChange={setActiveValue}
    >
      <CommandInput
        placeholder="Tìm kiếm trang, tài sản, hoặc ra lệnh AI..."
        value={q}
        onValueChange={setQ}
      />
      <CommandList className="max-h-[min(70dvh,520px)] overflow-y-auto overflow-x-hidden">
        {showLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground animate-in fade-in zoom-in duration-300">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
          </div>
        )}

        {hasQuery && !loading && rows.length === 0 && rowsMoRong.length === 0 && (
          <CommandEmpty className="py-12 text-center text-[15px] font-medium text-muted-foreground animate-in fade-in zoom-in duration-300">
            Không tìm thấy kết quả phù hợp.
          </CommandEmpty>
        )}

        {hasQuery && (() => {
          const intent = matchIntent(q);
          if (intent.kind === "jump-to" || intent.confidence < 0.7) return null;
          return (
            <CommandGroup heading="Hành động AI">
              <CommandItem
                value={`intent-${intent.kind}`}
                onSelect={() => runIntent(intent)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground/60 group-data-[selected=true]:text-foreground transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="text-[14px] font-semibold text-foreground truncate">
                    {describeIntent(intent)}
                  </div>
                  <div className="text-[12px] text-muted-foreground/70 truncate italic">
                    AI Intent: {intent.kind}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="rounded-md bg-[#0074e2]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0074e2]">
                    AI
                  </span>
                </div>
              </CommandItem>
            </CommandGroup>
          );
        })()}

        {hasQuery && rows.length > 0 && (
          <CommandGroup heading="Kết quả tìm kiếm">
            {rows.map((r: any) => {
              const to = `/${r.entity.replace("_", "-")}/${r.id}`;
              const hit: Hit = { entity: r.entity, id: r.id, title: r.title, subtitle: r.subtitle, to };
              const Icon = r.entity === "thiet_bi" ? Package : r.entity === "dm_he_thong" ? Network : Search;

              return (
                <CommandItem
                  key={`${r.entity}-${r.id}`}
                  value={`${r.entity}-${r.id}-${r.title}`}
                  onSelect={() => handleSelect(hit)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  <div className="flex flex-col min-w-0">
                    <div className="text-[14px] font-semibold text-foreground truncate">{r.title}</div>
                    {r.subtitle && <div className="text-[12px] text-muted-foreground/70 truncate">{r.subtitle}</div>}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {hasQuery && rowsMoRong.length > 0 && (
          <CommandGroup heading="Kết quả mở rộng">
            {rowsMoRong.map((r: any) => {
              const to = `/${r.loai.replace("_", "-")}/${r.id}`;
              const hit: Hit = { entity: r.loai, id: r.id, title: r.ten, to };
              const Icon = r.loai === "thiet_bi" ? Package : r.loai === "dm_he_thong" ? Network : Search;

              return (
                <CommandItem
                  key={`ext-${r.loai}-${r.id}`}
                  value={`ext-${r.loai}-${r.id}-${r.ten}`}
                  onSelect={() => handleSelect(hit)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  <div className="text-[14px] font-semibold text-foreground truncate">{r.ten}</div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {!hasQuery && recentHits.length > 0 && (
          <CommandGroup heading="Gần đây">
            {recentHits.map((hit) => (
              <CommandItem
                key={`recent-${hit.to}`}
                value={`recent-${hit.to}`}
                onSelect={() => handleSelect(hit)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground/40">
                  <Search className="h-4 w-4" />
                </div>
                <div className="text-[14px] font-semibold text-foreground truncate">{hit.title}</div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!hasQuery && NAV_COMMANDS.map((group) => (
          <CommandGroup key={group.header} heading={group.header}>
            {group.items.filter(item => !item.roles || (roles && item.roles.some(r => roles.includes(r)))).map((item) => (
              <CommandItem
                key={item.to}
                value={`${group.header}-${item.label}`}
                onSelect={() => handleSelect({ entity: "nav", id: item.to, title: item.label, to: item.to })}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
              >
                <item.icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                <div className="flex flex-col min-w-0">
                  <div className="text-[14px] font-semibold text-foreground truncate">{item.label}</div>
                  {item.desc && <div className="text-[12px] text-muted-foreground/70 truncate">{item.desc}</div>}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        <CommandGroup heading="Hệ thống">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              supabase.auth.signOut().then(() => {
                window.location.href = "/auth";
              });
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <div className="text-[14px] font-semibold">Đăng xuất</div>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      <div className="mt-auto hidden sm:flex items-center justify-end gap-4 border-t border-border/50 px-5 py-2.5 bg-muted/20">
        <div className="flex items-center gap-1.5">
          <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded border border-border/60 bg-background px-1 font-sans text-[10px] font-bold text-muted-foreground/70 shadow-sm">
            ↑↓
          </kbd>
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Navigate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded border border-border/60 bg-background px-1 font-sans text-[10px] font-bold text-muted-foreground/70 shadow-sm">
            <CornerDownLeft className="h-3 w-3" />
          </kbd>
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Select</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded border border-border/60 bg-background px-1 font-sans text-[10px] font-bold text-muted-foreground/70 shadow-sm">
            Esc
          </kbd>
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">Close</span>
        </div>
      </div>
    </CommandDialog>
  );
}
