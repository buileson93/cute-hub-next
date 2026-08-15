import { createFileRoute } from "@tanstack/react-router";
import { ThietBiDetail } from "@/components/mirats/thiet-bi-detail";
import { useDbTaxonomy } from "@/lib/mirats/db-taxonomy";
import { useOperationsData } from "@/lib/mirats/db-operations";

export const Route = createFileRoute("/_app/thiet-bi/$maThietBi")({
  component: ThietBiDetailRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string | undefined) || "tong-quan",
    doc: (search.doc as string | undefined) || undefined,
    q: (search.q as string | undefined) || "",
  }),
});

function ThietBiDetailRoute() {
  const { maThietBi: ma } = Route.useParams();
  const { tab, doc: initialDocId } = Route.useSearch();
  const { getAssetByCode } = useDbTaxonomy();
  const asset = getAssetByCode(ma);

  const { suCo, baoTri, hongHoc, isLoading } = useOperationsData({
    maThietBi: ma,
  });

  if (!asset) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Không tìm thấy thiết bị "{ma}"
      </div>
    );
  }

  return (
    <ThietBiDetail
      asset={asset}
      operations={{
        suCo: suCo || [],
        baoTri: baoTri || [],
        hongHoc: hongHoc || [],
      }}
      isLoading={isLoading}
      initialTab={tab}
      initialDocId={initialDocId || null}
    />
  );
}
