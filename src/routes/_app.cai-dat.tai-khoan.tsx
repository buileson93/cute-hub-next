import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Upload, Trash2, Loader2, Save } from "lucide-react";
import { UserAvatar } from "@/components/mirats/UserAvatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { storage } from "@/lib/storage";
import { useSession } from "@/hooks/use-session";
import { PasskeyManager } from "@/components/mirats/PasskeyManager";
import { useDensity } from "@/components/mirats/DensityToggle";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/cai-dat/tai-khoan")({
  head: () => ({
    meta: [
      { title: "Tài khoản của tôi — MIRATS 2.0" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountPage,
});

const YEAR_SECS = 60 * 60 * 24 * 365;

function AccountPage() {
  const { session, profile, refresh, loading } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [hoTen, setHoTen] = useState<string>(profile?.ho_ten ?? "");

  // Sync when profile arrives
  if (profile && hoTen === "" && profile.ho_ten) {
    setHoTen(profile.ho_ten);
  }

  async function handlePickFile() {
    fileRef.current?.click();
  }

  async function handleUpload(file: File) {
    if (!session?.user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh vượt quá 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn tệp ảnh");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `${session.user.id}/avatar-${Date.now()}.${ext}`;
      const up = await storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (up.error) throw up.error;

      const signed = await storage.from("avatars").createSignedUrl(path, YEAR_SECS);
      if (signed.error || !signed.data) throw signed.error ?? new Error("Không tạo được URL");

      const upd = await supabase
        .from("profiles")
        .update({ avatar_url: signed.data.signedUrl })
        .eq("id", session.user.id);
      if (upd.error) throw upd.error;

      toast.success("Đã cập nhật ảnh đại diện");
      refresh();
    } catch (e) {
      toast.error("Tải ảnh thất bại", { description: (e as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!session?.user) return;
    setUploading(true);
    try {
      // Xoá toàn bộ ảnh trong thư mục của user
      const list = await storage.from("avatars").list(session.user.id);
      if (list.data && list.data.length > 0) {
        await storage
          .from("avatars")
          .remove(list.data.map((f) => `${session.user.id}/${f.name}`));
      }
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", session.user.id);
      toast.success("Đã xoá ảnh đại diện");
      refresh();
    } catch (e) {
      toast.error("Xoá thất bại", { description: (e as Error).message });
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveName() {
    if (!session?.user) return;
    const value = hoTen.trim();
    if (!value) {
      toast.error("Họ tên không được để trống");
      return;
    }
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ ho_ten: value })
        .eq("id", session.user.id);
      if (error) throw error;
      toast.success("Đã lưu họ tên");
      refresh();
    } catch (e) {
      toast.error("Lưu thất bại", { description: (e as Error).message });
    } finally {
      setSavingName(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Đang tải…</div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 lg:p-6">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link to="/">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ảnh đại diện</CardTitle>
            <CardDescription>
              Hình ảnh sẽ hiển thị ở thanh điều hướng và các bình luận, thảo luận.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              <UserAvatar
                name={profile.ho_ten}
                email={profile.email}
                url={profile.avatar_url}
                className="h-20 w-20"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={handlePickFile} disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Tải ảnh lên
                </Button>
                {profile.avatar_url && (
                  <Button size="sm" variant="outline" onClick={handleRemove} disabled={uploading}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xoá ảnh
                  </Button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Định dạng ảnh (JPG/PNG/WEBP), tối đa 5MB.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
            <CardDescription>Cập nhật họ tên hiển thị của bạn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Họ và tên</Label>
              <Input
                value={hoTen}
                onChange={(e) => setHoTen(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="space-y-2">
              <Label>Đơn vị</Label>
              <Input value={profile.don_vi ?? "—"} disabled />
            </div>
            <Button size="sm" onClick={handleSaveName} disabled={savingName}>
              {savingName ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Lưu thay đổi
            </Button>
          </CardContent>
        </Card>

        <DisplayDensityCard />

        <PasskeyManager />
      </div>
    </>
  );
}

function DisplayDensityCard() {
  const [d, setD] = useDensity();
  const compact = d === "compact";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Giao diện</CardTitle>
        <CardDescription>
          Chế độ hiển thị cho toàn bộ ứng dụng. Chế độ Gọn thu nhỏ nút/icon/bảng để xem được nhiều dữ liệu hơn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={!compact ? "default" : "outline"}
            onClick={() => setD("comfortable")}
          >
            Thường
          </Button>
          <Button
            size="sm"
            variant={compact ? "default" : "outline"}
            onClick={() => setD("compact")}
          >
            Gọn
          </Button>
          <span className="ml-2 text-xs text-muted-foreground">
            Hiện tại: {compact ? "Gọn" : "Thường"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
