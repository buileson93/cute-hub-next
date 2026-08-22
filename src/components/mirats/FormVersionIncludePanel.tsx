// ============================================================================
// FormVersionIncludePanel — UI TỐI THIỂU cho phiên bản mẫu + include + publish.
//
// Cho phép Admin/Phòng KT:
//   • Tạo phiên bản NHÁP (draft) từ mẫu hiện tại.
//   • Với version draft: gắn/tháo INCLUDE (mẫu con), PREVIEW biên dịch, PUBLISH.
//   • Version đã publish bị KHOÁ (DB trigger) — chỉ xem.
//
// Không thay đổi bố cục route; đây là 1 card thêm vào trang sửa mẫu.
// ============================================================================

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Rocket, Eye, Link2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/backend/client";
import { previewFormVersion, publishFormVersion } from "@/lib/mirats/form-include-repo";

type VersionRow = { id: string; version: number; status: string };
type IncludeRow = {
  id: string;
  child_version_id: string;
  position: number;
  section_code: string | null;
};
type ChildOption = { version_id: string; label: string };

const STATUS_LABEL: Record<string, string> = {
  draft: "Nháp",
  published: "Đã phát hành",
  retired: "Thu hồi",
};

export function FormVersionIncludePanel({ templateId }: { templateId: string }) {
  const qc = useQueryClient();
  const preview = useServerFn(previewFormVersion);
  const publish = useServerFn(publishFormVersion);
  const [selectedVer, setSelectedVer] = useState<string | null>(null);
  const [childToAdd, setChildToAdd] = useState<string>("");
  const [previewMsg, setPreviewMsg] = useState<string | null>(null);

  // Danh sách phiên bản của mẫu này.
  const { data: versions } = useQuery({
    queryKey: ["form-versions", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_template_version")
        .select("id, version, status")
        .eq("template_id", templateId)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data ?? []) as VersionRow[];
    },
  });

  const activeVer = useMemo(
    () => (versions ?? []).find((v) => v.id === selectedVer) ?? null,
    [versions, selectedVer],
  );

  // Các version của mẫu KHÁC để chọn làm include (chỉ published — mẫu con ổn định).
  const { data: childOptions } = useQuery({
    queryKey: ["include-child-options", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_template_version")
        .select("id, version, status, template_id, form_template:template_id(code, ten)")
        .neq("template_id", templateId)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(
        (r): ChildOption => ({
          version_id: r.id as string,
          label: `${(r.form_template?.code as string) ?? ""} — ${(r.form_template?.ten as string) ?? ""} (v${r.version})`,
        }),
      );
    },
  });

  // Includes của version đang chọn.
  const { data: includes } = useQuery({
    queryKey: ["form-version-includes", selectedVer],
    enabled: !!selectedVer,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_template_include")
        .select("id, child_version_id, position, section_code")
        .eq("parent_version_id", selectedVer!)
        .order("position");
      if (error) throw error;
      return (data ?? []) as IncludeRow[];
    },
  });

  const createDraft = useMutation({
    mutationFn: async () => {
      const nextVersion = ((versions ?? [])[0]?.version ?? 0) + 1;
      const { data, error } = await supabase
        .from("form_template_version")
        .insert({
          template_id: templateId,
          version: nextVersion,
          status: "draft",
          compiled_schema: {},
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      toast.success("Đã tạo phiên bản nháp");
      setSelectedVer(id);
      qc.invalidateQueries({ queryKey: ["form-versions", templateId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addInclude = useMutation({
    mutationFn: async () => {
      if (!selectedVer || !childToAdd) return;
      const pos = (includes ?? []).length;
      const { error } = await supabase
        .from("form_template_include")
        .insert({ parent_version_id: selectedVer, child_version_id: childToAdd, position: pos });
      if (error) throw error;
    },
    onSuccess: () => {
      setChildToAdd("");
      qc.invalidateQueries({ queryKey: ["form-version-includes", selectedVer] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeInclude = useMutation({
    mutationFn: async (incId: string) => {
      const { error } = await supabase.from("form_template_include").delete().eq("id", incId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form-version-includes", selectedVer] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const previewM = useMutation({
    mutationFn: async () => {
      if (!selectedVer) return null;
      return preview({ data: { versionId: selectedVer } });
    },
    onSuccess: (res) => {
      if (!res) return;
      if (res.ok) {
        setPreviewMsg(
          `✓ Hợp lệ — gộp ${res.included_codes.length} mẫu: ${res.included_codes.join(", ")} · ${res.field_count} trường · ${res.section_count} khu vực`,
        );
      } else {
        setPreviewMsg(`✗ ${res.error}`);
      }
    },
    onError: (e: Error) => setPreviewMsg(`✗ ${e.message}`),
  });

  const publishM = useMutation({
    mutationFn: async () => {
      if (!selectedVer) return;
      return publish({ data: { versionId: selectedVer } });
    },
    onSuccess: (res) => {
      if (res)
        toast.success(
          `Đã phát hành — gộp ${res.included_codes.length} mẫu, ${res.field_count} trường`,
        );
      qc.invalidateQueries({ queryKey: ["form-versions", templateId] });
      qc.invalidateQueries({ queryKey: ["include-child-options"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const childLabel = (vid: string) =>
    (childOptions ?? []).find((c) => c.version_id === vid)?.label ?? vid.slice(0, 8);
  const isDraft = activeVer?.status === "draft";

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Phiên bản & Mẫu lồng nhau (include)
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => createDraft.mutate()}
          disabled={createDraft.isPending}
        >
          {createDraft.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Tạo phiên bản nháp
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Publish sẽ biên dịch cây include thành 1 snapshot cố định. Phiếu tạo về sau đọc snapshot
          này, không đổi khi mẫu con thay đổi.
        </p>

        {/* Chọn phiên bản */}
        <div className="flex flex-wrap gap-2">
          {(versions ?? []).length === 0 && (
            <span className="text-sm text-muted-foreground">Chưa có phiên bản nào.</span>
          )}
          {(versions ?? []).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setSelectedVer(v.id);
                setPreviewMsg(null);
              }}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition ${
                selectedVer === v.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-secondary"
              }`}
            >
              <span className="font-mono">v{v.version}</span>
              <Badge
                variant={v.status === "draft" ? "secondary" : "outline"}
                className="text-[10px]"
              >
                {v.status !== "draft" && <Lock className="mr-1 h-2.5 w-2.5" />}
                {STATUS_LABEL[v.status] ?? v.status}
              </Badge>
            </button>
          ))}
        </div>

        {activeVer && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Include của phiên bản v{activeVer.version}
              </span>
              {!isDraft && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Đã khoá (chỉ xem)
                </span>
              )}
            </div>

            {/* Danh sách include */}
            <div className="space-y-1">
              {(includes ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">Chưa include mẫu con nào.</p>
              )}
              {(includes ?? []).map((inc) => (
                <div
                  key={inc.id}
                  className="flex items-center justify-between rounded bg-secondary/50 px-2 py-1.5 text-sm"
                >
                  <span>{childLabel(inc.child_version_id)}</span>
                  {isDraft && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => removeInclude.mutate(inc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Thêm include (chỉ draft) */}
            {isDraft && (
              <div className="flex gap-2">
                <Select value={childToAdd} onValueChange={setChildToAdd}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Chọn mẫu con (đã publish)…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(childOptions ?? []).length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        Không có mẫu con đã publish.
                      </div>
                    )}
                    {(childOptions ?? []).map((c) => (
                      <SelectItem key={c.version_id} value={c.version_id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => addInclude.mutate()}
                  disabled={!childToAdd || addInclude.isPending}
                >
                  <Plus className="mr-1 h-4 w-4" /> Gắn
                </Button>
              </div>
            )}

            {previewMsg && (
              <div
                className={`rounded-md px-3 py-2 text-sm ${previewMsg.startsWith("✓") ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/10 text-rose-700 dark:text-rose-400"}`}
              >
                {previewMsg}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => previewM.mutate()}
                disabled={previewM.isPending}
              >
                {previewM.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                Xem trước biên dịch
              </Button>
              {isDraft && (
                <Button size="sm" onClick={() => publishM.mutate()} disabled={publishM.isPending}>
                  {publishM.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="mr-2 h-4 w-4" />
                  )}
                  Phát hành (khoá phiên bản)
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
