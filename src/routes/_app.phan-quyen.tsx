import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Lock, FileClock, Database, Boxes, Monitor } from "lucide-react";
import { DesktopOnly } from "@/components/mirats/DesktopOnly";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/backend/client";
import { RoleOverview } from "@/components/mirats/phan-quyen/RoleOverview";
import { PermissionMatrix } from "@/components/mirats/phan-quyen/PermissionMatrix";
import { DistributionStats } from "@/components/mirats/phan-quyen/DistributionStats";
import { AuditLogViewer } from "@/components/mirats/phan-quyen/AuditLogViewer";
import { SecurityPolicies } from "@/components/mirats/phan-quyen/SecurityPolicies";
import { type Stats, type AuditRow } from "@/components/mirats/phan-quyen/types";

export const Route = createFileRoute("/_app/phan-quyen")({
  head: () => ({
    meta: [
      { title: "Phân quyền & Bảo mật — MIRATS" },
      { name: "description", content: "Vai trò, RBAC theo collection, phân bố tài khoản theo đơn vị và nhật ký kiểm toán — số liệu thật." },
    ],
  }),
  component: PhanQuyenPage,
});

function PhanQuyenPage() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile) {
    return (
      <div className="p-4">
        <PageHeader 
          icon={Monitor} 
          title="Phân quyền & Bảo mật" 
          description="Quản trị vai trò và kiểm soát truy cập."
        />
        <DesktopOnly 
          featureName="Quản trị Phân quyền"
          reason="Ma trận phân quyền với hàng chục cột và vai trò cần màn hình rộng để có cái nhìn tổng thể và cấu hình chính xác. Vui lòng sử dụng máy tính để thực hiện các thay đổi về bảo mật."
        >
          <div />
        </DesktopOnly>
      </div>
    );
  }

  const [q, setQ] = useState("");

  const statsQ = useQuery({
    queryKey: ["phan_quyen_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("phan_quyen_thong_ke");
      if (error) throw error;
      return data as unknown as Stats;
    },
    refetchOnWindowFocus: false,
  });

  const auditQ = useQuery({
    queryKey: ["phan_quyen_audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id,user_id,action,entity,entity_id,created_at")
        .order("created_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
    refetchOnWindowFocus: false,
  });

  const auditUserIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of auditQ.data ?? []) if (r.user_id) s.add(r.user_id);
    return Array.from(s);
  }, [auditQ.data]);

  const auditProfilesQ = useQuery({
    enabled: auditUserIds.length > 0,
    queryKey: ["phan_quyen_audit_profiles", auditUserIds.sort().join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,ho_ten,don_vi")
        .in("id", auditUserIds);
      if (error) throw error;
      return (data ?? []) as { id: string; ho_ten: string | null; don_vi: string | null }[];
    },
    refetchOnWindowFocus: false,
  });

  const profileMap = useMemo(
    () => new Map((auditProfilesQ.data ?? []).map((p) => [p.id, p])),
    [auditProfilesQ.data],
  );

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader
        icon={ShieldCheck}
        title="Vai trò & kiểm soát truy cập"
        description="Quản lý vai trò, phạm vi truy cập và nhật ký kiểm toán trên toàn hệ thống."
        help="Mỗi tài khoản gắn với một hoặc nhiều vai trò; phạm vi truy cập được thu hẹp theo đơn vị và dự án."
        actions={
          statsQ.data ? (
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="secondary" className="font-mono">
                <Boxes className="mr-1 h-3 w-3" /> {statsQ.data.total_accounts} tài khoản
              </Badge>
              <Badge variant="outline" className="font-mono text-emerald-600 dark:text-emerald-300">
                {statsQ.data.active_accounts} hoạt động
              </Badge>
            </div>
          ) : null
        }
      />

      <RoleOverview 
        stats={statsQ.data} 
        loading={statsQ.isLoading} 
        error={statsQ.error} 
      />

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="matrix" className="data-[state=active]:bg-background"><Lock className="mr-1.5 h-3.5 w-3.5" />Ma trận quyền</TabsTrigger>
          <TabsTrigger value="phanbo" className="data-[state=active]:bg-background"><Boxes className="mr-1.5 h-3.5 w-3.5" />Phân bố</TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-background"><FileClock className="mr-1.5 h-3.5 w-3.5" />Nhật ký</TabsTrigger>
          <TabsTrigger value="policy" className="data-[state=active]:bg-background"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />Chính sách</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="mt-0">
          <PermissionMatrix stats={statsQ.data} />
        </TabsContent>
        <TabsContent value="phanbo" className="mt-0">
          <DistributionStats stats={statsQ.data} />
        </TabsContent>
        <TabsContent value="audit" className="mt-0">
          <AuditLogViewer 
            auditLogs={auditQ.data ?? []} 
            loading={auditQ.isLoading} 
            profileMap={profileMap} 
            q={q} 
            setQ={setQ} 
          />
        </TabsContent>
        <TabsContent value="policy" className="mt-0">
          <SecurityPolicies />
        </TabsContent>
      </Tabs>
    </div>
  );
}
