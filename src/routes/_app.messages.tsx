import { createFileRoute, Link, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { freshChannel } from "@/lib/realtime/channel";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, MessageSquare, Search } from "lucide-react";
import { timeAgo } from "@/lib/time";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Conversation = {
  id: string;
  kind: string;
  ten: string | null;
  last_message_at: string;
  created_at: string;
  created_by: string | null;
};

type Participant = { conversation_id: string; user_id: string };
type ProfileMini = { id: string; ho_ten: string | null; email: string };

export const Route = createFileRoute("/_app/messages")({
  component: MessagesLayout,
});

function MessagesLayout() {
  const { user } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [parts, setParts] = useState<Record<string, ProfileMini[]>>({});
  const [newOpen, setNewOpen] = useState(false);

  async function loadConvs() {
    if (!user) return;
    // conversations where I'm a participant
    const { data: myParts } = await supabase
      .from("conversation_participant")
      .select("conversation_id")
      .eq("user_id", user.id);
    const ids = (myParts ?? []).map((p) => p.conversation_id);
    if (ids.length === 0) {
      setConvs([]);
      return;
    }
    const { data: convData } = await supabase
      .from("conversations")
      .select("*")
      .in("id", ids)
      .order("last_message_at", { ascending: false });
    const list = (convData ?? []) as Conversation[];
    setConvs(list);

    // fetch participants of each conversation to display counterpart names
    const { data: allParts } = await supabase
      .from("conversation_participant")
      .select("conversation_id,user_id")
      .in("conversation_id", ids);
    const partsByConv: Record<string, string[]> = {};
    for (const p of (allParts ?? []) as Participant[]) {
      (partsByConv[p.conversation_id] ??= []).push(p.user_id);
    }
    const otherIds = Array.from(
      new Set(
        (allParts ?? [])
          .map((p) => (p as Participant).user_id)
          .filter((id) => id !== user.id),
      ),
    );
    if (otherIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,ho_ten,email")
        .in("id", otherIds);
      const byId: Record<string, ProfileMini> = {};
      for (const p of (profs ?? []) as ProfileMini[]) byId[p.id] = p;
      const map: Record<string, ProfileMini[]> = {};
      for (const [cid, uids] of Object.entries(partsByConv)) {
        map[cid] = uids.filter((u) => u !== user.id).map((u) => byId[u]).filter(Boolean);
      }
      setParts(map);
    }
  }

  useEffect(() => {
    loadConvs();
    if (!user) return;
    const ch = freshChannel("conv-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, loadConvs)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, loadConvs)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_participant", filter: `user_id=eq.${user.id}` }, loadConvs)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Conversation list */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="text-sm font-semibold">Tin nhắn</div>
          <NewConversationDialog open={newOpen} onOpenChange={setNewOpen} onCreated={loadConvs} />
        </div>
        <div className="flex-1 overflow-y-auto">
          {convs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              <div className="px-4 text-xs text-muted-foreground">
                Chưa có hội thoại. Nhấn <b>+</b> để bắt đầu.
              </div>
            </div>
          ) : (
            <ul>
              {convs.map((c) => {
                const others = parts[c.id] ?? [];
                const title =
                  c.ten ??
                  (others.length > 0
                    ? others.map((p) => p.ho_ten ?? p.email).join(", ")
                    : "Hội thoại");
                const active = pathname === `/messages/${c.id}`;
                return (
                  <li key={c.id}>
                    <Link
                      to={`/messages/${c.id}` as never}
                      className={cn(
                        "flex items-center gap-3 border-b border-border/50 px-4 py-3 transition-colors hover:bg-secondary/60",
                        active && "bg-secondary",
                      )}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {title.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{title}</div>
                        <div className="text-[11px] text-muted-foreground">{timeAgo(c.last_message_at)}</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Chat pane */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}

function NewConversationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const { user } = useSession();
  const [users, setUsers] = useState<ProfileMini[]>([]);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("profiles")
      .select("id,ho_ten,email")
      .eq("active", true)
      .neq("id", user.id)
      .limit(50)
      .then(({ data }) => setUsers((data ?? []) as ProfileMini[]));
  }, [open, user]);

  async function start(other: ProfileMini) {
    if (!user) return;
    setCreating(true);
    // Try to find an existing 1-1 conversation with this user
    const { data: mine } = await supabase
      .from("conversation_participant")
      .select("conversation_id")
      .eq("user_id", user.id);
    const myIds = (mine ?? []).map((p) => p.conversation_id);
    if (myIds.length > 0) {
      const { data: shared } = await supabase
        .from("conversation_participant")
        .select("conversation_id")
        .eq("user_id", other.id)
        .in("conversation_id", myIds);
      const existing = (shared ?? [])[0]?.conversation_id;
      if (existing) {
        setCreating(false);
        onOpenChange(false);
        window.location.assign(`/messages/${existing}`);
        return;
      }
    }
    // Create new
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({ kind: "dm", created_by: user.id })
      .select("id")
      .single();
    if (error || !conv) {
      setCreating(false);
      toast.error(error?.message ?? "Không tạo được hội thoại");
      return;
    }
    const cid = (conv as { id: string }).id;
    const { error: err2 } = await supabase.from("conversation_participant").insert([
      { conversation_id: cid, user_id: user.id },
      { conversation_id: cid, user_id: other.id },
    ]);
    setCreating(false);
    if (err2) {
      toast.error(err2.message);
      return;
    }
    onOpenChange(false);
    onCreated();
    window.location.assign(`/messages/${cid}`);
  }

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return !q || (u.ho_ten ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Thêm">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>Bắt đầu hội thoại mới</DialogTitle>
        </DialogHeader>
        <div className="border-b border-border px-4 pb-3 pt-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc email…"
              className="pl-8"
            />
          </div>
        </div>
        <ul className="max-h-[360px] overflow-y-auto">
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">Không có người dùng phù hợp</li>
          ) : (
            filtered.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => start(u)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/60 disabled:opacity-60"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {(u.ho_ten ?? u.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{u.ho_ten ?? u.email}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{u.email}</div>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
