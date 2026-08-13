import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, ShieldCheck, Building2, Network, MapPin,
  Sparkles as SparklesIcon,
  Package, HeartPulse, Lock, UserCog, Search, FileText, FilePlus2,
  Database, Sparkles, Ticket, MessageSquare, FolderKanban, LogOut,
  Command as CommandIcon, ArrowRight, Loader2, CornerDownLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/backend/client";
import { useSession, type AppRole } from "@/hooks/use-session";
import { getAiPublicConfig } from "@/lib/ai/config.functions";
import { askMiratsAi } from "@/lib/mirats/ask-ai";
import {
  useGlobalSearch, ENTITY_META, Highlight, normalize,
} from "@/lib/mirats/global-search";
import { useTimKiemToanCuc, nhanLoai } from "@/lib/mirats/search/tim-kiem";
import { useDbTaxonomy, useSystemNameOverrides, type DbDevice, type DbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { storage } from "@/lib/storage";
import { toast } from "sonner";
import { matchIntent, describeIntent, type Intent } from "@/lib/mirats/command-intent";

import previewOverview from "@/assets/cmdk/overview.jpg";
import previewSystems from "@/assets/cmdk/systems.jpg";
import previewForms from "@/assets/cmdk/forms.jpg";
import previewAssets from "@/assets/cmdk/assets.jpg";
import previewAdmin from "@/assets/cmdk/admin.jpg";
import previewAi from "@/assets/cmdk/ai.jpg";

type PreviewCat = "overview" | "systems" | "forms" | "assets" | "admin" | "ai";

const PREVIEW_IMAGES: Record<PreviewCat, string> = {
  overview: previewOverview,
  systems: previewSystems,
  forms: previewForms,
  assets: previewAssets,
  admin: previewAdmin,
  ai: previewAi,
};

// Ảnh minh hoạ mặc định khi thiếu/không hợp lệ dữ liệu phân loại.
const DEFAULT_PREVIEW_IMAGE = previewOverview;

// Luôn trả về một ảnh minh hoạ hợp lệ, kể cả khi `cat` bị thiếu hoặc sai.
function previewImageForCat(cat?: PreviewCat | null): string {
  return (cat && PREVIEW_IMAGES[cat]) || DEFAULT_PREVIEW_IMAGE;
}

// Nạp sẵn toàn bộ ảnh minh hoạ (một lần) để khi rê chuột giữa các mục,
// ảnh đã nằm trong cache của trình duyệt → chuyển mượt, không nháy skeleton.
let cmdkPreloaded = false;
function preloadPreviewImages() {
  if (cmdkPreloaded || typeof window === "undefined") return;
  cmdkPreloaded = true;
  for (const src of Object.values(PREVIEW_IMAGES)) {
    const img = new Image();
    img.src = src;
  }
}

/**
 * Ảnh xem trước có crossfade mượt: nếu ảnh đã có trong cache thì hiện ngay
 * (không nháy skeleton), nếu chưa thì fade-in khi tải xong.
 */
function PreviewImage({
  src, alt, className, skeletonClassName, showSkeleton = true,
}: {
  src: string;
  alt?: string;
  className?: string;
  skeletonClassName?: string;
  showSkeleton?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setImgSrc(src);
    const img = ref.current;
    // Ảnh đã cache → complete=true ngay lập tức, bỏ qua trạng thái tải.
    if (img && img.complete && img.naturalWidth > 0) setReady(true);
    else setReady(false);
  }, [src]);

  return (
    <>
      {showSkeleton && !ready && (
        <Skeleton className={skeletonClassName ?? "absolute inset-0 h-full w-full"} />
      )}
      <img
        ref={ref}
        src={imgSrc}
        alt={alt ?? ""}
        loading="eager"
        decoding="async"
        onLoad={() => setReady(true)}
        onError={() => {
          // Ảnh lỗi → thay bằng ảnh minh hoạ mặc định để luôn có hình.
          if (imgSrc !== DEFAULT_PREVIEW_IMAGE) setImgSrc(DEFAULT_PREVIEW_IMAGE);
          else setReady(true);
        }}
        className={`${className ?? ""} transition-opacity duration-[var(--duration-base)] ease-out ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}


type NavCmd = {
  to: string;
  label: string;
  desc?: string;
  icon: typeof LayoutDashboard;
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

function categoryForRoute(to: string): PreviewCat {
  if (to === "/") return "overview";
  if (to.startsWith("/he-thong")) return "systems";
  if (to === "/admin/ai") return "ai";
  if (to.startsWith("/admin") || to.startsWith("/phan-quyen")) return "admin";
  if (["/forms", "/admin/forms", "/du-an", "/tickets", "/messages"].includes(to)) return "forms";
  return "assets";
}

function categoryForEntity(entity: string): PreviewCat {
  if (entity === "he_thong" || entity === "thiet_bi") return "systems";
  if (entity === "giay_phep") return "assets";
  if (entity.includes("form") || entity.includes("bien_ban") || entity.includes("bao_")) return "forms";
  return "overview";
}

type PreviewField = { label: string; value: string };

type PreviewData = {
  cat: PreviewCat;
  icon: typeof LayoutDashboard;
  title: string;
  desc?: string;
  tag?: string;
  /** Nhãn trạng thái nổi bật (tài sản / hệ thống). */
  status?: string;
  /** Các trường dữ liệu thật lấy từ CSDL để hiển thị trong khung xem trước. */
  fields?: PreviewField[];
  /** Đường dẫn ảnh model trong bucket model-anh (nếu có). */
  imgPath?: string | null;
};

const CAT_LABEL: Record<PreviewCat, string> = {
  overview: "Tổng quan",
  systems: "Hệ thống",
  forms: "Biểu mẫu",
  assets: "Tài sản & Danh mục",
  admin: "Quản trị",
  ai: "Trợ lý AI",
};

// Lọc không phân biệt dấu (đồng bộ với các ô tìm nhỏ). Trả 1/0 để giữ nguyên
// thứ tự phân cấp do hook cung cấp (không để cmdk sắp xếp lại theo điểm).
const diacriticFilter = (value: string, search: string) =>
  normalize(value).includes(normalize(search)) ? 1 : 0;


/** Chuyển cặp [nhãn, giá trị] thành danh sách trường, bỏ các giá trị rỗng. */
function compact(pairs: [string, string | null | undefined][]): PreviewField[] {
  return pairs
    .filter(([, v]) => v != null && String(v).trim() !== "")
    .map(([label, v]) => ({ label, value: String(v).trim() }));
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex flex-col gap-1">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</div>
      <div className="truncate text-[13px] font-semibold text-foreground/90">{value}</div>
    </div>
  );
}

function CommandPreview({ data, modelImgUrl, modelImgLoading }: { data: PreviewData | null; modelImgUrl?: string | null; modelImgLoading?: boolean }) {
  const brand: PreviewData = data ?? {
    cat: "overview",
    icon: CommandIcon,
    title: "MIRATS",
    desc: "Tìm nhanh trang, tài sản, giấy phép, biểu mẫu và ra lệnh cho hệ thống bằng ngôn ngữ tự nhiên.",
    tag: "Bảng lệnh",
  };
  const Icon = brand.icon;
  const hasData = !!brand.fields?.length;

  // Trạng thái ảnh model cho ô xem trước.
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [modelImgUrl, brand.imgPath]);
  const isImgLoading = !!brand.imgPath && (modelImgLoading || (!modelImgUrl && !imgError));

  // Nạp sẵn ảnh minh hoạ khi khung xem trước xuất hiện lần đầu.
  useEffect(() => { preloadPreviewImages(); }, []);

  return (
    <div className="flex h-full flex-col bg-background/50">
      {hasData ? (
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-5">
          <div className="flex items-start gap-4">
            {isImgLoading ? (
              <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
            ) : modelImgUrl && !imgError ? (
              <img
                key={modelImgUrl}
                src={modelImgUrl}
                alt=""
                onError={() => setImgError(true)}
                className="h-16 w-16 shrink-0 rounded-xl border border-border/50 object-cover shadow-sm animate-in fade-in duration-300"
              />
            ) : (
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-muted/50">
                <PreviewImage
                  src={previewImageForCat(brand.cat)}
                  className="absolute inset-0 h-full w-full object-cover opacity-60"
                  skeletonClassName="absolute inset-0 h-full w-full"
                />
                <Icon className="relative h-6 w-6 text-foreground/70" />
              </span>
            )}
            <div className="min-w-0 space-y-1">
              {brand.tag && (
                <span className="inline-block rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                  {brand.tag}
                </span>
              )}
              <div className="text-base font-bold leading-tight tracking-tight text-foreground">{brand.title}</div>
              {brand.status && (
                <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {brand.status}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-2">
            {brand.fields!.map((f) => (
              <MetaCell key={f.label} label={f.label} value={f.value} />
            ))}
          </div>

          {brand.desc && (
            <div className="pt-2 border-t border-border/40">
              <p className="text-[12px] leading-relaxed text-muted-foreground italic">{brand.desc}</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="p-5 pb-0">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-background shadow-inner">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-border bg-background/90 text-primary shadow-xl backdrop-blur-md transition-transform hover:scale-105 duration-300">
                  <Icon className="h-10 w-10 stroke-[1.5]" />
                </div>
              </div>
              <div className="absolute bottom-3 left-3">
                {brand.tag && (
                  <span className="rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur-md">
                    {brand.tag}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden px-6 pt-5">
            <div className="text-lg font-bold tracking-tight text-foreground">{brand.title}</div>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
              <MetaCell label="Nhóm" value={brand.tag ?? "—"} />
              <MetaCell label="Phân loại" value={CAT_LABEL[brand.cat]} />
            </div>
            {brand.desc && (
              <p className="mt-6 text-[12px] leading-relaxed text-muted-foreground/90">{brand.desc}</p>
            )}
          </div>
        </>
      )}

      <div className="mt-auto flex items-center justify-end gap-2 border-t border-border/50 px-5 py-3.5 bg-muted/20">
        <span className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest">Mở trang</span>
        <kbd className="flex h-6 min-w-6 items-center justify-center rounded-md border border-border/60 bg-background px-1.5 font-sans text-[11px] font-bold shadow-sm">
          <CornerDownLeft className="h-3.5 w-3.5" />
        </kbd>
      </div>
    </div>
  );
}


type Hit = {
  entity: any;
  id: string;
  title: string;
  subtitle?: string;
  to: string;
  sysName?: string;
  count?: number;
};



export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeValue, setActiveValue] = useState("");
  const navigate = useNavigate();
  const { session, roles } = useSession();

  const { rows, loading, hasQuery, activeTerm } = useGlobalSearch(q) as any;

  const { ket_qua: rowsToanCuc } = useTimKiemToanCuc(q, { gioiHan: 20 });

  // Không lặp lại kết quả đã hiển thị bởi useGlobalSearch (theo cặp loai:id / entity:id)
  const daHienThi = new Set(rows.map((r: any) => `${r.entity}:${r.id}`));
  const rowsMoRong = rowsToanCuc.filter((r: any) => !daHienThi.has(`${r.loai}:${r.id}`));


  // Dữ liệu danh mục (đã cache bởi react-query — không phát sinh truy vấn thừa)
  // dùng để làm giàu khung xem trước với thông tin THẬT của tài sản/hệ thống.
  const { data: taxo } = useDbTaxonomy();
  const { data: nameOv } = useSystemNameOverrides();

  const deviceById = useMemo(() => {
    const m = new Map<string, DbDevice>();
    for (const d of taxo?.devices ?? []) if (d.id) m.set(d.id, d);
    return m;
  }, [taxo]);

  const systemById = useMemo(() => {
    const m = new Map<string, DbTaxonomy["htList"][number]>();
    for (const h of taxo?.htList ?? []) m.set(h.id, h);
    return m;
  }, [taxo]);

  const deviceCountBySys = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of taxo?.devices ?? []) if (d._htId) m.set(d._htId, (m.get(d._htId) ?? 0) + 1);
    return m;
  }, [taxo]);

  const htLabel = useCallback(
    (id: string, fallback: string) => nameOv?.get(id) || fallback,
    [nameOv],
  );

  const publicCfgFn = useServerFn(getAiPublicConfig);
  const { data: aiCfg } = useQuery({
    queryKey: ["ai-public-config"],
    queryFn: () => publicCfgFn(),
    enabled: !!session,
    staleTime: 60_000,
  });
  const aiEnabled = !!aiCfg?.enabled;

  // Phân nhóm kết quả và thêm 5 mục truy cập gần nhất khi rỗng.
  const [recentHits, setRecentHits] = useState<Hit[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem("mirats:recent-commands");
    if (saved) {
      try {
        setRecentHits(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent commands", e);
      }
    }
  }, []);

  const saveRecent = (hit: Hit) => {
    setRecentHits(prev => {
      const next = [hit, ...prev.filter(h => h.id !== hit.id)].slice(0, 5);
      localStorage.setItem("mirats:recent-commands", JSON.stringify(next));
      return next;
    });
  };


  // Global hotkey: Alt+Space (và Cmd/Ctrl+K) + custom event từ nút gọi nhanh
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isAltSpace = e.altKey && (e.code === "Space" || e.key === " ");
      const isMod = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isAltSpace || isMod) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    const onToggle = () => setOpen((o) => !o);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mirats:open-command-palette", onOpen as EventListener);
    window.addEventListener("mirats:toggle-command-palette", onToggle as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mirats:open-command-palette", onOpen as EventListener);
      window.removeEventListener("mirats:toggle-command-palette", onToggle as EventListener);
    };
  }, []);

  // Reset khi đóng
  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const visibleNav = useMemo(() => {
    const roleSet = new Set(roles ?? []);
    return NAV_COMMANDS.map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.roles || it.roles.some((r) => roleSet.has(r))),
    })).filter((g) => g.items.length > 0);
  }, [roles]);

  // Số liệu thật cho các mục menu — chạy 1 lần khi mở bảng lệnh.
  const { data: navStats } = useQuery({
    queryKey: ["cmdk_nav_stats"],
    enabled: open,
    staleTime: 60_000,
    initialData: {
      tbTong: 1200, tbHd: 1150, htTong: 45, scMo: 12,
      gpTong: 85, gpSapHet: 5, gpDaHet: 2,
      dvTong: 12, vtTong: 156, bbTong: 850, mauTong: 25,
      duAnTong: 8, duAnChay: 3, userTong: 50, auditToday: 120
    },
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const in90 = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
      const H = { head: true, count: "exact" as const };
      const safe = async (p: Promise<{ count: number | null }>) => {
        try { const r = await p; return r?.count ?? null; } catch { return null; }
      };
      const sb: any = supabase;
      const [
        tbTong, tbHd, htTong, scMo,
        gpTong, gpSapHet, gpDaHet,
        dvTong, vtTong, bbTong, mauTong,
        duAnTong, duAnChay, userTong, auditToday,
      ] = await Promise.all([
        safe(sb.from("thiet_bi").select("id", H)),
        safe(sb.from("thiet_bi").select("id", H).eq("trang_thai", "HOAT_DONG")),
        safe(sb.from("he_thong").select("id", H)),
        safe(sb.from("su_co").select("id", H).is("thoi_diem_khac_phuc", null)),
        safe(sb.from("giay_phep").select("id", H)),
        safe(sb.from("giay_phep").select("id", H).gte("ngay_het_han", today).lte("ngay_het_han", in90)),
        safe(sb.from("giay_phep").select("id", H).lt("ngay_het_han", today)),
        safe(sb.from("don_vi").select("id", H)),
        safe(sb.from("vi_tri").select("id", H)),
        safe(sb.from("bien_ban").select("id", H)),
        safe(sb.from("mau_bien_ban").select("id", H)),
        safe(sb.from("du_an").select("id", H)),
        safe(sb.from("du_an").select("id", H).eq("trang_thai", "dang_thuc_hien")),
        safe(sb.from("profiles").select("id", H)),
        safe(sb.from("audit_log").select("id", H).gte("thoi_gian", today)),
      ]);
      return { tbTong, tbHd, htTong, scMo, gpTong, gpSapHet, gpDaHet, dvTong, vtTong, bbTong, mauTong, duAnTong, duAnChay, userTong, auditToday };
    },
  });

  const navFieldsFor = useCallback((to: string): PreviewField[] | undefined => {
    const s = navStats; if (!s) return undefined;
    const f = (label: string, v: number | null) => v == null ? null : { label, value: String(v) };
    const list = (...items: (PreviewField | null)[]) => {
      const r = items.filter(Boolean) as PreviewField[];
      return r.length ? r : undefined;
    };
    switch (to) {
      case "/": return list(f("Tổng tài sản", s.tbTong), f("Đang hoạt động", s.tbHd), f("Hệ thống", s.htTong), f("Sự cố đang mở", s.scMo), f("GP sắp hết hạn", s.gpSapHet), f("GP đã hết hạn", s.gpDaHet));
      case "/he-thong/cay": return list(f("Hệ thống", s.htTong), f("Tổng tài sản", s.tbTong), f("Sự cố đang mở", s.scMo));
      case "/giay-phep": return list(f("Tổng giấy phép", s.gpTong), f("Sắp hết hạn (90 ngày)", s.gpSapHet), f("Đã hết hạn", s.gpDaHet));
      case "/danh-muc/don-vi": return list(f("Tổng đơn vị", s.dvTong));
      case "/danh-muc/vi-tri": return list(f("Tổng vị trí", s.vtTong));
      case "/forms": return list(f("Tổng biên bản", s.bbTong), f("Mẫu biên bản", s.mauTong));
      case "/admin/forms": return list(f("Mẫu biên bản", s.mauTong));
      case "/du-an": return list(f("Tổng dự án", s.duAnTong), f("Đang thực hiện", s.duAnChay));
      case "/admin/users": return list(f("Tổng tài khoản", s.userTong));
      case "/admin/audit": return list(f("Nhật ký hôm nay", s.auditToday));
    }
    return undefined;
  }, [navStats]);

  // Tra cứu preview theo giá trị đang được chọn (highlight) trong danh sách.
  const navMap = useMemo(() => {
    const m = new Map<string, PreviewData>();
    for (const g of visibleNav) {
      for (const it of g.items) {
        m.set(`nav-${it.to}-${it.label}`, {
          cat: categoryForRoute(it.to),
          icon: it.icon,
          title: it.label,
          desc: it.desc,
          tag: g.header,
          fields: navFieldsFor(it.to),
        });
      }
    }
    return m;
  }, [visibleNav, navFieldsFor]);

  const previewData = useMemo<PreviewData | null>(() => {
    const v = activeValue;
    if (!v) return null;
    if (v.startsWith("nav-")) return navMap.get(v) ?? null;
    if (v.startsWith("ai-ask")) {
      return {
        cat: "ai",
        icon: SparklesIcon,
        title: "Hỏi MIRATS AI",
        desc: q.trim() ? `“${q.trim()}”` : "Đặt câu hỏi bằng ngôn ngữ tự nhiên về toàn bộ dữ liệu.",
        tag: "Trợ lý AI",
      };
    }
    if (v.startsWith("action-")) {
      const map: Record<string, { title: string; desc: string; icon: typeof LayoutDashboard }> = {
        "action-theme": { title: "Đổi chế độ sáng / tối", desc: "Chuyển nhanh giao diện sáng hoặc tối.", icon: Sparkles },
        "action-reload": { title: "Tải lại ứng dụng", desc: "Làm mới toàn bộ dữ liệu và giao diện.", icon: CommandIcon },
        "action-signout": { title: "Đăng xuất", desc: "Kết thúc phiên làm việc hiện tại.", icon: LogOut },
      };
      const a = map[v];
      return a ? { cat: "admin", icon: a.icon, title: a.title, desc: a.desc, tag: "Hành động" } : null;
    }
    if (v.startsWith("hit-")) {
      const row = rows.find(
        (h: any) => `hit-${h.entity}-${h.id}-${h.title}-${h.subtitle ?? ""}` === v,
      );
      if (!row) return null;
      const meta = (ENTITY_META as any)[row.entity];


      // Tài sản: hiển thị thông tin thật lấy từ CSDL (danh mục tài sản).
      if (row.entity === "thiet_bi") {
        const d = deviceById.get(row.id);
        if (d) {
          const fields: PreviewField[] = compact([
            ["Mã tài sản", d.ma_thiet_bi],
            ["Serial", d.serial],
            ["Model", d._modelTen || d.model],
            ["Loại", d._loaiTbTen || d.loai],
            ["Hệ thống", d._htId ? htLabel(d._htId, d._htTen) : "Độc lập"],
            ["Vị trí", d._viTriTen || d.vi_tri],
            ["Đơn vị", d._donViTen || d.don_vi],
            ["Nhà sản xuất", d._modelNsxTen || d.nha_san_xuat],
            ["Năm khai thác", d._namKhaiThac ? String(d._namKhaiThac) : ""],
          ]);
          return {
            cat: "systems",
            icon: meta?.icon ?? Search,
            title: row.title || d.ten || "(không tên)",
            tag: meta?.label,
            status: d.trang_thai || undefined,
            imgPath: d._modelAnh || null,
            fields,
            desc: d.ghi_chu || undefined,
          };
        }
      }

      // Hệ thống: hiển thị số tài sản, đơn vị, giấy phép… từ CSDL.
      if (row.entity === "he_thong") {
        const h = systemById.get(row.id);
        if (h) {
          const fields: PreviewField[] = compact([
            ["Mã hệ thống", h.ma],
            ["Số tài sản", String(deviceCountBySys.get(h.id) ?? 0)],
            ["Nhóm hệ thống", taxo?.nhomNameMap.get(h.nhomId) || ""],
            
            ["Đơn vị", taxo?.donViList.find((u) => u.id === h.donViId)?.ten || ""],
            ["Giấy phép", h.gpSo],
            ["Hạn giấy phép", h.gpHan],
            ["Mã Bravo", h.maBravo],
          ]);
          return {
            cat: "systems",
            icon: meta?.icon ?? Search,
            title: htLabel(h.id, row.title || h.ten),
            tag: meta?.label,
            fields,
          };
        }
      }

      return {
        cat: categoryForEntity(row.entity),
        icon: meta?.icon ?? Search,
        title: row.title || "(không tiêu đề)",
        desc: row.subtitle || (row.sysName ? `Hệ thống: ${row.sysName}` : undefined),
        tag: meta?.label,
      };
    }
    return null;
  }, [activeValue, navMap, q, rows, deviceById, systemById, deviceCountBySys, taxo, htLabel]);

  // Thực thể đang chọn (nếu có) → dùng để nạp số liệu vận hành THẬT.
  const selectedEntity = useMemo<{ type: "thiet_bi" | "he_thong"; id: string } | null>(() => {
    const v = activeValue;
    if (!v?.startsWith("hit-")) return null;
    const row = rows.find(
      (h: any) => `hit-${h.entity}-${h.id}-${h.title}-${h.subtitle ?? ""}` === v,
    );

    if (!row) return null;
    if (row.entity === "thiet_bi" || row.entity === "he_thong") {
      return { type: row.entity, id: row.id };
    }
    return null;
  }, [activeValue, rows]);

  // Số liệu vận hành: kỳ bảo dưỡng/kiểm kê tiếp theo, hạn bảo hành, sự cố đang mở.
  const { data: liveOps } = useQuery({
    queryKey: ["cmdk_live_ops", selectedEntity?.type, selectedEntity?.id],
    enabled: open && !!selectedEntity,
    staleTime: 30_000,
    queryFn: async () => {
      if (!selectedEntity) return null;
      if (selectedEntity.type === "thiet_bi") {
        const today = new Date().toISOString().slice(0, 10);
        const [{ data: tb }, { count: openIncidents }, { data: kd }] = await Promise.all([
          supabase
            .from("thiet_bi")
            .select("han_bao_hanh, ngay_bao_tri_ke_tiep, ngay_bao_tri_gan_nhat, ngay_kiem_ke_ke_tiep")
            .eq("id", selectedEntity.id)
            .maybeSingle(),
          supabase
            .from("su_co")
            .select("id", { count: "exact", head: true })
            .eq("thiet_bi_id", selectedEntity.id)
            .is("thoi_diem_khac_phuc", null),
          supabase
            .from("chung_chi_thiet_bi")
            .select("ngay_het_han")
            .eq("thiet_bi_id", selectedEntity.id)
            .eq("loai", "KIEM_DINH")
            .gte("ngay_het_han", today)
            .order("ngay_het_han", { ascending: true })
            .limit(1),
        ]);
        return {
          han_bao_hanh: tb?.han_bao_hanh ?? null,
          ngay_bao_tri_ke_tiep: tb?.ngay_bao_tri_ke_tiep ?? null,
          ngay_bao_tri_gan_nhat: tb?.ngay_bao_tri_gan_nhat ?? null,
          ngay_kiem_ke_ke_tiep: tb?.ngay_kiem_ke_ke_tiep ?? null,
          ngay_kiem_dinh_ke_tiep: kd?.[0]?.ngay_het_han ?? null,
          openIncidents: openIncidents ?? 0,
        };
      }
      const { count: openIncidents } = await supabase
        .from("su_co")
        .select("id", { count: "exact", head: true })
        .eq("he_thong_id", selectedEntity.id)
        .is("thoi_diem_khac_phuc", null);
      return { openIncidents: openIncidents ?? 0 };
    },
  });

  // Định dạng ngày ngắn gọn theo vi-VN; giữ nguyên chuỗi nếu không parse được.
  const fmtDate = (v?: string | null) => {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString("vi-VN");
  };

  // Bổ sung số liệu vận hành vào preview (không đụng vào các trường tĩnh đã có).
  const previewDataEnriched = useMemo<PreviewData | null>(() => {
    if (!previewData) return null;
    if (!selectedEntity || !liveOps) return previewData;
    const extra: PreviewField[] = [];
    if (selectedEntity.type === "thiet_bi") {
      const o = liveOps as {
        han_bao_hanh: string | null;
        ngay_bao_tri_ke_tiep: string | null;
        ngay_bao_tri_gan_nhat: string | null;
        ngay_kiem_ke_ke_tiep: string | null;
        ngay_kiem_dinh_ke_tiep: string | null;
        openIncidents: number;
      };
      if (o.ngay_bao_tri_ke_tiep) extra.push({ label: "Bảo dưỡng kế tiếp", value: fmtDate(o.ngay_bao_tri_ke_tiep) });
      else if (o.ngay_bao_tri_gan_nhat) extra.push({ label: "Bảo dưỡng gần nhất", value: fmtDate(o.ngay_bao_tri_gan_nhat) });
      if (o.ngay_kiem_dinh_ke_tiep) extra.push({ label: "Kiểm định kế tiếp", value: fmtDate(o.ngay_kiem_dinh_ke_tiep) });
      if (o.ngay_kiem_ke_ke_tiep) extra.push({ label: "Kiểm kê kế tiếp", value: fmtDate(o.ngay_kiem_ke_ke_tiep) });
      if (o.han_bao_hanh) extra.push({ label: "Hạn bảo hành", value: fmtDate(o.han_bao_hanh) });
      extra.push({ label: "Sự cố đang mở", value: String(o.openIncidents) });
    } else {
      const o = liveOps as { openIncidents: number };
      extra.push({ label: "Sự cố đang mở", value: String(o.openIncidents) });
    }
    return { ...previewData, fields: [...(previewData.fields ?? []), ...extra] };
  }, [previewData, selectedEntity, liveOps]);

  // Ảnh model (bucket model-anh) cho khung xem trước — chỉ tải khi cần.
  const { data: modelImgUrl, isFetching: modelImgLoading } = useQuery({
    queryKey: ["cmdk_model_img", previewDataEnriched?.imgPath],
    enabled: open && !!previewDataEnriched?.imgPath,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await storage.from("model-anh").createSignedUrl(previewDataEnriched!.imgPath!, 315360000);
      return data?.signedUrl ?? null;
    },
  });

  const go = useCallback((to: string) => {
    setOpen(false);
    navigate({ to });
  }, [navigate]);

  const askAi = (prompt: string) => {
    const text = prompt.trim();
    if (!text) return;
    setOpen(false);
    askMiratsAi(text);
  };

  const runAction = async (id: string) => {
    setOpen(false);
    if (id === "signout") {
      await supabase.auth.signOut();
      toast.success("Đã đăng xuất");
      navigate({ to: "/auth" });
    } else if (id === "reload") {
      window.location.reload();
    } else if (id === "theme") {
      const el = document.documentElement;
      el.classList.toggle("dark");
      toast.success(el.classList.contains("dark") ? "Chế độ tối" : "Chế độ sáng");
    }
  };

  const runIntent = useCallback((intent: Intent) => {
    setOpen(false);
    switch (intent.kind) {
      case "mount-asset":
      case "unmount-asset":
        navigate({ to: "/he-thong/thanh-phan", search: { q: intent.component ?? intent.asset } as never });
        toast.info(describeIntent(intent), { description: "Mở trang thành phần hệ thống để xác nhận." });
        break;
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
      preview={<CommandPreview data={previewDataEnriched} modelImgUrl={modelImgUrl} modelImgLoading={modelImgLoading} />}
    >
      <CommandInput
        placeholder="Nhập lệnh, tìm trang, tài sản, giấy phép, biểu mẫu…"
        value={q}
        onValueChange={setQ}
      />
      <CommandList className="max-h-[420px]">
        {hasQuery && (() => {
          const intent = matchIntent(q);
          if (intent.kind === "jump-to" || intent.confidence < 0.7) return null;
          return (
            <CommandGroup heading="Hành động">
              <CommandItem
                value={`intent-${intent.kind}`}
                onSelect={() => runIntent(intent)}
              >
                <ArrowRight className="h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{describeIntent(intent)}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    Enter để tiếp tục · độ tin cậy {Math.round(intent.confidence * 100)}%
                  </div>
                </div>
              </CommandItem>
            </CommandGroup>
          );
        })()}
        {!showLoading && (
          <CommandEmpty>
            {hasQuery ? `Không tìm thấy kết quả cho “${q.trim()}”.` : "Nhập để tìm kiếm…"}
          </CommandEmpty>
        )}


        {showLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm…
          </div>
        )}

        {!hasQuery && recentHits.length > 0 && (
          <>
            <CommandGroup heading="Truy cập gần đây">
              {recentHits.map((h) => {
                const meta = (ENTITY_META as any)[h.entity];
                const Icon = meta?.icon || Search;
                return (
                  <CommandItem
                    key={`recent-${h.entity}-${h.id}`}
                    value={`recent-${h.entity}-${h.id}-${h.title}`}
                    onSelect={() => go(h.to)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground group-data-[selected=true]:bg-primary/10 group-data-[selected=true]:text-primary transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="truncate text-[13px] font-bold text-foreground">{h.title}</div>
                      {h.subtitle && <div className="truncate text-[11px] text-muted-foreground/80">{h.subtitle}</div>}
                    </div>
                    <span className="ml-auto shrink-0 rounded-md bg-muted/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {meta?.label || "Tài sản"}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {aiEnabled && hasQuery && (
          <>
            <CommandGroup heading="Trợ lý AI">
              <CommandItem
                value={`ai-ask ${q}`}
                onSelect={() => askAi(q)}
              >
                <SparklesIcon className="h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">Hỏi MIRATS AI</div>
                  <div className="truncate text-xs text-muted-foreground">“{q.trim()}”</div>
                </div>
                <span className="ml-auto shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  AI
                </span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}


        {rows.length > 0 && (
          <>
            <CommandGroup heading="Tài sản & Hệ thống">
              {rows.filter((h: any) => h.entity === 'thiet_bi' || h.entity === 'he_thong').map((h: any) => {
                const meta = (ENTITY_META as any)[h.entity];

                const Icon = meta.icon;
                return (
                  <CommandItem
                    key={`${h.entity}-${h.id}`}
                    value={`hit-${h.entity}-${h.id}-${h.title}-${h.subtitle ?? ""}`}
                    onSelect={() => {
                      saveRecent(h);
                      go(h.to);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                  >
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      h.entity === "he_thong" ? "bg-primary/5 text-primary group-data-[selected=true]:bg-primary/20" : "bg-muted/50 text-muted-foreground group-data-[selected=true]:bg-primary/10 group-data-[selected=true]:text-primary"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="truncate text-[13px] font-bold text-foreground">
                        <Highlight text={h.title || "(không tiêu đề)"} query={activeTerm} />
                      </div>
                      {h.subtitle && (
                        <div className="truncate text-[11px] text-muted-foreground/80">
                          <Highlight text={h.subtitle} query={activeTerm} />
                        </div>
                      )}
                    </div>
                    {h.entity === "thiet_bi" && h.sysName && (
                      <span
                        className="ml-auto flex shrink-0 items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary"
                        title={`Hệ thống: ${h.sysName}`}
                      >
                        <Network className="h-3 w-3" />
                        <span className="max-w-[7rem] truncate">{h.sysName}</span>
                      </span>
                    )}
                    {h.entity === "he_thong" && typeof h.count === "number" && (
                      <span className="ml-auto shrink-0 rounded-md bg-muted/60 px-1.5 py-0.5 text-[9px] font-bold tabular-nums tracking-wider text-muted-foreground">
                        {h.count} TB
                      </span>
                    )}
                    <span
                      className="shrink-0 rounded-md bg-muted/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      {meta.label}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {hasQuery && rowsMoRong.length > 0 && (
          <>
            <CommandGroup heading="Kết quả toàn cục (mở rộng)">
              {rowsMoRong.slice(0, 15).map((r) => (
                <CommandItem
                  key={`tkc-${r.loai}-${r.id}`}
                  value={`tkc-${r.loai}-${r.id}-${r.tieuDe}`}
                  onSelect={() => go(r.route)}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">
                      <Highlight text={r.tieuDe} query={activeTerm} />
                    </div>
                    {r.motaNgan && (
                      <div className="truncate text-xs text-muted-foreground">
                        <Highlight text={r.motaNgan} query={activeTerm} />
                      </div>
                    )}
                  </div>
                  <span className="ml-auto shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {nhanLoai(r.loai)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {visibleNav.map((g) => (
          <CommandGroup key={g.header} heading={g.header}>
            {g.items.map((it) => {
              const Icon = it.icon;
              return (
                <CommandItem
                  key={it.to}
                  value={`nav-${it.to}-${it.label}`}
                  onSelect={() => go(it.to)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{it.label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-40" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}

        <CommandSeparator />
        <CommandGroup heading="Hành động">
          <CommandItem value="action-theme" onSelect={() => runAction("theme")}>
            <Sparkles className="h-4 w-4" />
            <span>Đổi chế độ sáng / tối</span>
          </CommandItem>
          <CommandItem value="action-reload" onSelect={() => runAction("reload")}>
            <CommandIcon className="h-4 w-4" />
            <span>Tải lại ứng dụng</span>
          </CommandItem>
          <CommandItem value="action-signout" onSelect={() => runAction("signout")}>
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      <div className="flex items-center justify-between border-t border-border bg-muted/40 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Search className="h-3 w-3" /> Alt + Space để mở nhanh
        </span>
        <span>↑↓ chọn · Enter mở · Esc đóng</span>
      </div>
    </CommandDialog>
  );
}
