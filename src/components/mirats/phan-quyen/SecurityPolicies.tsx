import { Card } from "@/components/ui/card";
import { ShieldCheck, Lock, KeyRound, FileClock, Check, Database } from "lucide-react";


export function SecurityPolicies() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { icon: KeyRound, title: "Xác thực", items: ["Tài khoản mới cần quản trị duyệt", "Khôi phục mật khẩu qua email có ghi log"] },
          { icon: FileClock, title: "Kiểm toán", items: ["Ghi log mọi thao tác thêm/sửa/xoá", "Lưu dữ liệu trước/sau để hoàn tác"] },
          { icon: Lock, title: "Bảo mật trường", items: ["Ẩn giá trị & chi phí với KTV, Read-only", "Trường nhạy cảm ghi log riêng"] },
          { icon: Database, title: "Sao lưu & toàn vẹn", items: ["Sao lưu tự động theo lịch", "Ưu tiên archive thay vì xoá cứng"] },
        ].map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.title} className="p-4 transition-all hover:border-primary/50">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4 text-primary" /> {p.title}
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {p.items.map((it) => (
                  <li key={it} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /> {it}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed p-4 bg-muted/20">
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          {[
            ["Least privilege", "Chỉ cấp quyền tối thiểu cần thiết."],
            ["Tách tạo — duyệt", "Người tạo phiếu không tự phê duyệt."],
            ["Không xoá cứng", "Lịch sử được lưu để truy vết."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-lg border bg-background/50 p-3 shadow-sm">
              <div className="mb-1 font-semibold text-foreground">{t}</div>
              {d}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
