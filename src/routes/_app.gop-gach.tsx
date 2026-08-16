import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { PageBody } from "@/components/mirats/PageBody";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Camera, Check, X, SkipForward, Trophy } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_app/gop-gach")({
  component: GopGachPage,
});

function GopGachPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [value, setValue] = useState("");

  const { data: nhiemVu, isLoading } = useQuery({
    queryKey: ["nhiem_vu_nhap_lieu", "current"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nhiem_vu_nhap_lieu")
        .select("*")
        .eq("trang_thai", "moi")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: userScore } = useQuery({
    queryKey: ["dong_gop_diem", "summary", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("Vui lòng đăng nhập");
      const { data, error } = await supabase
        .from("dong_gop_diem")
        .select("diem")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).reduce((acc, cur) => acc + cur.diem, 0);
    },
    enabled: !!user?.id,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Vui lòng đăng nhập");
      if (!nhiemVu) throw new Error("Không có nhiệm vụ");

      const { error: crError } = await supabase.rpc("create_change_request", {
        p_loai: (nhiemVu.entity === "thiet_bi" ? "thiet_bi.propose_field" : "he_thong.propose_field") as any,
        p_payload: {
          target_id: nhiemVu.target_id,
          field_key: nhiemVu.field_key,
          gia_tri_moi: value,
        } as any,
        p_ghi_chu: "Đóng góp từ màn hình Góp gạch",
      });
      if (crError) throw crError;

      // Cập nhật trạng thái nhiệm vụ
      await supabase
        .from("nhiem_vu_nhap_lieu")
        .update({ trang_thai: "hoan_thanh" })
        .eq("id", nhiemVu.id);
    },
    onSuccess: () => {
      toast.success("Cảm ơn bạn đã đóng góp!");
      setValue("");
      qc.invalidateQueries({ queryKey: ["nhiem_vu_nhap_lieu"] });
    },
  });

  if (isLoading) return <PageBody>Đang tìm việc cho bạn...</PageBody>;

  return (
    <PageBody className="max-w-md mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Góp gạch</h1>
          <p className="text-sm text-muted-foreground">Mỗi ngày 1 việc nhỏ, dữ liệu thêm sạch.</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-amber-600 font-bold">
            <Trophy className="size-4" />
            {userScore || 0}
          </div>
          <p className="text-meta uppercase text-muted-foreground">Điểm tích luỹ</p>
        </div>
      </div>

      {!nhiemVu ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto size-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="text-emerald-600" />
            </div>
            <p>Hôm nay bạn đã hoàn thành hết nhiệm vụ!</p>
            <Button variant="outline" onClick={() => qc.invalidateQueries({ queryKey: ["nhiem_vu_nhap_lieu"] })}>
              Kiểm tra lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Số serial (S/N) của máy này là gì?</CardTitle>
            <p className="text-xs text-muted-foreground">Tài sản: {nhiemVu.target_id}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video bg-muted rounded-md flex items-center justify-center border-2 border-dashed">
              <Button variant="ghost" className="flex flex-col gap-2 h-auto py-4">
                <Camera className="size-8" />
                <span>Chụp ảnh nhãn thiết bị</span>
              </Button>
            </div>
            <Input 
              placeholder="Nhập số serial..." 
              value={value} 
              onChange={e => setValue(e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => submit.mutate()} disabled={!value}>
              Gửi đề xuất
            </Button>
            <Button variant="ghost" size="icon" title="Bỏ qua">
              <SkipForward className="size-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span>Tiến độ đơn vị</span>
          <span>68%</span>
        </div>
        <Progress value={68} className="h-1" />
      </div>
    </PageBody>
  );
}
