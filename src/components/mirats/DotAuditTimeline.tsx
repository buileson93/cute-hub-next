import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { Badge } from "@/components/ui/badge";
import { History, User } from "lucide-react";

const ACTION_META: Record<string, { label: string; color: string }> = {
  tao: { label: "Tạo hạng mục", color: "bg-slate-100 text-slate-700" },
  cap_nhat: { label: "Cập nhật", color: "bg-blue-100 text-blue-700" },
  gui_duyet: { label: "Gửi duyệt", color: "bg-amber-100 text-amber-700" },
  duyet: { label: "Đã duyệt", color: "bg-emerald-100 text-emerald-700" },
  tra_lai: { label: "Trả lại", color: "bg-rose-100 text-rose-700" },
  mo_khoa: { label: "Mở khoá", color: "bg-purple-100 text-purple-700" },
  gan_bien_ban: { label: "Gắn biên bản", color: "bg-indigo-100 text-indigo-700" },
  go_bien_ban: { label: "Gỡ biên bản", color: "bg-slate-100 text-slate-600" },
};

const FIELD_LABEL: Record<string, string> = {
  trang_thai: "Trạng thái",
  ket_qua: "Kết quả",
  duyet_trang_thai: "Phê duyệt",
  han_hoan_thanh: "Hạn",
  ton_tai: "Tồn tại",
  kien_nghi: "Kiến nghị",
};

function fmt(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  const s = String(v);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}

export function DotAuditTimeline({
  hangMucId,
  dotId,
  limit = 100,
}: {
  hangMucId?: string;
  dotId?: string;
  limit?: number;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["dbd-audit", hangMucId ?? "*", dotId ?? "*", limit],
    queryFn: async () => {
      let q = supabase
        .from("dot_bao_duong_audit_log")
        .select(
          "id, action, actor, changes, note, created_at, hang_muc_id, hang_muc:hang_muc_id(dm_he_thong:he_thong_id(ma,ten))",
        )
        .order("created_at", { ascending: false })
        .limit(limit);
      if (hangMucId) q = q.eq("hang_muc_id", hangMucId);
      else if (dotId) q = q.eq("dot_id", dotId);
      const { data, error } = await q;
      if (error) throw error;
      const actorIds = Array.from(
        new Set((data ?? []).map((r) => r.actor).filter((x): x is string => !!x)),
      );
      const profiles: Record<string, { ho_ten: string | null; email: string | null }> = {};
      if (actorIds.length) {
        const { data: ps } = await supabase
          .from("profiles")
          .select("id, ho_ten, email")
          .in("id", actorIds);
        for (const p of ps ?? []) profiles[p.id] = { ho_ten: p.ho_ten, email: p.email };
      }
      return (data ?? []).map((r) => ({ ...r, actor_profile: r.actor ? profiles[r.actor] : null }));
    },
  });

  if (isLoading) return <div className="text-xs text-muted-foreground">Đang tải nhật ký…</div>;
  if (!data || data.length === 0)
    return <div className="text-xs text-muted-foreground">Chưa có thao tác nào.</div>;

  return (
    <div className="space-y-2">
      {data.map((row) => {
        const meta = ACTION_META[row.action] ?? {
          label: row.action,
          color: "bg-slate-100 text-slate-700",
        };
        const changes = (row.changes ?? {}) as Record<string, [unknown, unknown]>;
        const actorName = row.actor_profile?.ho_ten || row.actor_profile?.email || "Hệ thống";
        const heThong = (row as { hang_muc?: { dm_he_thong?: { ma?: string; ten?: string } } })
          .hang_muc?.dm_he_thong;
        return (
          <div key={row.id} className="rounded border p-2 text-xs bg-card">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge className={meta.color} variant="secondary">
                  {meta.label}
                </Badge>
                {!hangMucId && heThong && (
                  <span className="text-muted-foreground">· {heThong.ma}</span>
                )}
              </div>
              <span className="text-muted-foreground">
                {new Date(row.created_at).toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{actorName}</span>
            </div>
            {row.note && (
              <div className="mt-1 rounded bg-muted px-2 py-1">
                <span className="font-medium">Ghi chú:</span> {row.note}
              </div>
            )}
            {Object.keys(changes).length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {Object.entries(changes).map(([k, v]) => {
                  const [oldV, newV] = Array.isArray(v) ? v : [null, v];
                  return (
                    <li key={k} className="flex flex-wrap gap-1">
                      <span className="font-medium">{FIELD_LABEL[k] ?? k}:</span>
                      <span className="text-rose-600 line-through">{fmt(oldV)}</span>
                      <span>→</span>
                      <span className="text-emerald-700">{fmt(newV)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function DotAuditTimelineHeader() {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <History className="h-4 w-4" />
      Nhật ký thao tác
    </div>
  );
}
