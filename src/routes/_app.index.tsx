import { createFileRoute } from "@tanstack/react-router";
import { getCompletenessStats, getCompletenessOverview } from "@/lib/mirats/completeness.functions";
import { OverviewDashboard } from "@/components/mirats/dashboard/OverviewDashboard";
import { useSession } from "@/hooks/use-session";

export const Route = (createFileRoute("/_app/") as any)({
  head: () => ({
    meta: [
      { title: "Trang chủ — Tổng quan MIRATS" },
      {
        name: "description",
        content:
          "Trang chủ MIRATS hiển thị cùng bảng điều khiển tổng quan: KPI tài sản kỹ thuật, bảo trì và chất lượng dữ liệu.",
      },
      { property: "og:title", content: "Trang chủ — Tổng quan MIRATS" },
      {
        property: "og:description",
        content: "Bảng điều khiển tổng quan MIRATS cho tài sản kỹ thuật, bảo trì và chất lượng dữ liệu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Prefetch giống hệt /tong-quan để hai đường dẫn có cùng dữ liệu ban đầu.
  loader: async ({ context }: any) => {
    try {
      await Promise.all([
        context.queryClient.prefetchQuery({
          queryKey: ["completeness-stats"],
          queryFn: () => getCompletenessStats(),
        }),
        context.queryClient.prefetchQuery({
          queryKey: ["completeness-overview", 10],
          queryFn: () => getCompletenessOverview({ data: { limit: 10 } }),
        }),
      ]);
    } catch (e) {
      console.warn("Dashboard SSR prefetch skipped:", e instanceof Error ? e.message : e);
    }
  },
  component: HomeDashboardRoute,
});

function HomeDashboardRoute() {
  const { profile } = useSession();
  const ten =
    (typeof profile?.ho_ten === "string" && profile.ho_ten.trim()) ||
    profile?.email?.split("@")[0] ||
    "";

  return <OverviewDashboard title={ten ? `Chào mừng, ${ten}` : "Báo cáo Tổng quan KPI"} />;
}
