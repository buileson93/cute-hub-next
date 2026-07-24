import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_app/messages/")({
  component: () => (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
      <div className="text-sm text-muted-foreground">Chọn một cuộc hội thoại hoặc tạo mới</div>
    </div>
  ),
});
