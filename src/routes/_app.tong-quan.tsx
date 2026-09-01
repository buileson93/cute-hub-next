import { createFileRoute } from "@tanstack/react-router";
import { getCompletenessStats, getCompletenessOverview } from "@/lib/mirats/completeness.functions";
import { OverviewDashboard } from "@/components/mirats/dashboard/OverviewDashboard";

export const Route = createFileRoute("/_app/tong-quan")({
  head: () => ({
    meta: [
      { title: "Tổng quan KPI — MIRATS" },
      {
        name: "description",
        content:
          "Bảng điều khiển tổng quan MIRATS: KPI tài sản kỹ thuật, tiến độ bảo trì và chất lượng dữ liệu theo thời gian thực.",
      },
      { property: "og:title", content: "Tổng quan KPI — MIRATS" },
      {
        property: "og:description",
        content: "Theo dõi KPI tài sản, bảo trì và chất lượng dữ liệu trên một bảng điều khiển duy nhất.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
      console.warn("Overview report prefetch skipped:", e instanceof Error ? e.message : e);
    }
  },
  component: OverviewReportRoute,
});

function OverviewReportRoute() {
  return <OverviewDashboard title="Báo cáo Tổng quan KPI" />;
}
