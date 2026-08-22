import { useEffect, useState, useCallback } from "react";
import { ScanFace, Loader2, Trash2, Plus, ShieldCheck, Smartphone } from "lucide-react";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getRegistrationOptions,
  verifyRegistration,
  listPasskeys,
  deletePasskey,
} from "@/lib/passkey.functions";

type Passkey = {
  id: string;
  device_name: string | null;
  device_type: string | null;
  backed_up: boolean | null;
  created_at: string;
  last_used_at: string | null;
};

export function PasskeyManager() {
  const [supported, setSupported] = useState(true);
  const [keys, setKeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPasskeys();
      setKeys(data as Passkey[]);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRegister() {
    setRegistering(true);
    try {
      const optionsJSON = await getRegistrationOptions();
      let attResp;
      try {
        attResp = await startRegistration({ optionsJSON });
      } catch (e) {
        const err = e as Error;
        if (err.name === "InvalidStateError") {
          toast.error("Tài sản này đã được đăng ký passkey.");
        } else if (err.name === "NotAllowedError") {
          toast.info("Bạn đã hủy đăng ký sinh trắc học.");
        } else {
          toast.error("Tài sản không hỗ trợ hoặc bị lỗi.", { description: err.message });
        }
        return;
      }
      const deviceName = /iPhone|iPad/i.test(navigator.userAgent)
        ? "iPhone/iPad (FaceID / TouchID)"
        : /Android/i.test(navigator.userAgent)
          ? "Android (Vân tay / Khuôn mặt)"
          : /Mac/i.test(navigator.userAgent)
            ? "Mac (TouchID)"
            : "Trình duyệt này";
      const result = await verifyRegistration({ data: { response: attResp, deviceName } });
      if (result.success) {
        toast.success("Đã đăng ký đăng nhập sinh trắc học!");
        refresh();
      } else {
        toast.error(result.error ?? "Đăng ký thất bại");
      }
    } finally {
      setRegistering(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const result = await deletePasskey({ data: { id } });
      if (result.success) {
        toast.success("Đã xóa passkey");
        setKeys((prev) => prev.filter((k) => k.id !== id));
      } else {
        toast.error(result.error ?? "Xóa thất bại");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanFace className="h-5 w-5 text-primary" />
          Đăng nhập sinh trắc học (FaceID / Vân tay)
        </CardTitle>
        <CardDescription>
          Liên kết khuôn mặt hoặc vân tay của tài sản để đăng nhập không cần mật khẩu. Khóa bí mật
          nằm an toàn trong chip bảo mật của máy, không bao giờ rời khỏi tài sản.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!supported && (
          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Trình duyệt/tài sản này không hỗ trợ passkey. Hãy dùng điện thoại có FaceID/vân tay hoặc
            trình duyệt mới hơn.
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
          </div>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có passkey nào được đăng ký.</p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Smartphone className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{k.device_name ?? "Tài sản"}</div>
                    <div className="text-xs text-muted-foreground">
                      Đăng ký {new Date(k.created_at).toLocaleDateString("vi-VN")}
                      {k.last_used_at &&
                        ` · Dùng gần nhất ${new Date(k.last_used_at).toLocaleDateString("vi-VN")}`}
                      {k.backed_up && (
                        <span className="ml-1 inline-flex items-center gap-0.5 text-primary">
                          <ShieldCheck className="h-3 w-3" /> Đồng bộ đám mây
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(k.id)}
                  disabled={deletingId === k.id}
                  aria-label="Xóa passkey"
                >
                  {deletingId === k.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Button onClick={handleRegister} disabled={!supported || registering} size="sm">
          {registering ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Thêm passkey trên tài sản này
        </Button>
      </CardContent>
    </Card>
  );
}
