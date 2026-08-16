// ============================================================================
// /verify/$id — Trang xác thực công khai (không cần đăng nhập).
// Hiển thị: hash hiện tại của biên bản, danh sách chữ ký, trạng thái hợp lệ.
// ============================================================================
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { verifySubmission } from "@/lib/form-signing.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Icon } from "@/components/mirats/ui/Icon";
import { shortHash } from "@/lib/mirats/sig-canonical";

export const Route = createFileRoute("/verify/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Xác thực biên bản ${params.id.slice(0, 8)} — VATM MIRATS` },
      { name: "description", content: "Xác thực chữ ký số Ed25519 cho biên bản MIRATS." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { id } = Route.useParams();
  const verifyFn = useServerFn(verifySubmission);
  const q = useQuery({
    queryKey: ["verify", id],
    queryFn: () => verifyFn({ data: { submission_id: id } }),
    retry: false,
  });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-bold">Xác thực chữ ký số</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Biên bản <code className="font-mono">{id}</code>
      </p>

      {q.isLoading && (
        <div className="flex h-40 items-center justify-center">
          <Icon name="status.loading" className="h-6 w-6" size="custom" />
        </div>
      )}

      {q.error && (
        <Card className="border-rose-300 bg-rose-50/50">
          <CardContent className="py-4 text-sm text-rose-700">
            Không xác thực được: {(q.error as Error).message}
          </CardContent>
        </Card>
      )}

      {q.data && !q.data.found && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Biên bản chưa được ký số
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900">
            Không tìm thấy chữ ký Ed25519 cho biên bản này.
          </CardContent>
        </Card>
      )}

      {q.data && q.data.found && (
        <>
          <Card className={q.data.valid ? "border-emerald-300 bg-emerald-50/50" : "border-rose-300 bg-rose-50/50"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {q.data.valid ? (
                  <><ShieldCheck className="h-5 w-5 text-emerald-600" /> Chữ ký hợp lệ &amp; nội dung khớp</>
                ) : (
                  <><ShieldX className="h-5 w-5 text-rose-600" /> Có chữ ký nhưng KHÔNG hợp lệ hoặc nội dung đã thay đổi</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-slate-700">
              <div>Hash hiện tại: <code className="font-mono break-all">{q.data.current_hash ?? "—"}</code></div>
              <div>Số chữ ký: <strong>{q.data.signatures.length}</strong></div>
              {q.data.pdf_url && (
                <div>
                  Bản PDF đã ký:{" "}
                  <a href={q.data.pdf_url} target="_blank" rel="noreferrer" className="text-primary underline">
                    Tải xuống (link hiệu lực 1 giờ)
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {q.data.meta && (
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-base">Thông tin biên bản</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-y-1 text-xs text-slate-700">
                <div className="text-muted-foreground">Mã mẫu</div><div><code className="font-mono">{q.data.meta.template_code}</code></div>
                <div className="text-muted-foreground">Tiêu đề</div><div>{q.data.meta.tieu_de || "—"}</div>
                <div className="text-muted-foreground">Đơn vị</div><div>{q.data.meta.don_vi_ten || "—"}</div>
                <div className="text-muted-foreground">Kỳ báo cáo</div><div>{q.data.meta.ky_bao_cao || "—"}</div>
                <div className="text-muted-foreground">Trạng thái</div><div>{q.data.meta.status}</div>
                <div className="text-muted-foreground">Nộp lúc</div><div>{q.data.meta.submitted_at ? new Date(q.data.meta.submitted_at).toLocaleString("vi-VN") : "—"}</div>
                <div className="text-muted-foreground">Ký lúc</div><div>{q.data.meta.signed_at ? new Date(q.data.meta.signed_at).toLocaleString("vi-VN") : "—"}</div>
              </CardContent>
            </Card>
          )}

          {q.data.canonical_preview && (
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-base">Nội dung canonical (chuỗi đã hash)</CardTitle></CardHeader>
              <CardContent>
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-md bg-slate-950/95 p-3 font-mono text-meta leading-relaxed text-emerald-200">
{q.data.canonical_preview}
                </pre>
                <p className="mt-2 text-meta text-muted-foreground">
                  SHA-256 của chuỗi này chính là hash được ký bằng Ed25519.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Danh sách chữ ký</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {q.data.signatures.map((s) => (
                  <li key={s.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium">{s.signer_name || "(không rõ)"}</div>
                      <Badge variant="outline" className="text-xs">{s.signer_role}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Ký lúc: {new Date(s.signed_at).toLocaleString("vi-VN")} · {s.alg}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <Badge variant={s.signature_valid ? "default" : "destructive"} className="text-meta">
                        Chữ ký {s.signature_valid ? "hợp lệ" : "SAI"}
                      </Badge>
                      <Badge variant={s.matches_current ? "default" : "destructive"} className="text-meta">
                        Nội dung {s.matches_current ? "khớp" : "đã đổi"}
                      </Badge>
                      <code className="font-mono text-meta text-muted-foreground">hash: {shortHash(s.content_hash)}</code>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
