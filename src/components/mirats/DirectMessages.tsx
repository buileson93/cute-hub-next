import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import { freshChannel } from "@/lib/realtime/channel";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Plus, Search, MessageSquare, Send, Paperclip,
  File as FileIcon, Image as ImageIcon, Download, X,
} from "lucide-react";
import { timeAgo, formatDT } from "@/lib/time";
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
type ProfileMini = { id: string; ho_ten: string | null; email: string };
type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  noi_dung: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  file_mime: string | null;
  created_at: string;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_PREFIXES = ["image/"];
const ALLOWED_MIME_EXACT = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];
function isAllowedFile(f: File) {
  if (f.size > MAX_FILE_SIZE) return false;
  if (ALLOWED_MIME_PREFIXES.some((p) => f.type.startsWith(p))) return true;
  return ALLOWED_MIME_EXACT.includes(f.type);
}

/** Trình nhắn tin nhúng trong panel — dạng master/detail 1 cột cho gọn. */
export function DirectMessagesPanel() {
  const [activeConv, setActiveConv] = useState<{ id: string; title: string } | null>(null);

  if (activeConv) {
    return (
      <MessageThread
        convId={activeConv.id}
        title={activeConv.title}
        onBack={() => setActiveConv(null)}
      />
    );
  }
  return <ConversationList onOpen={(id, title) => setActiveConv({ id, title })} />;
}

function ConversationList({ onOpen }: { onOpen: (id: string, title: string) => void }) {
  const { user } = useSession();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [parts, setParts] = useState<Record<string, ProfileMini[]>>({});
  const [newOpen, setNewOpen] = useState(false);

  async function loadConvs() {
    if (!user) return;
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
    setConvs((convData ?? []) as Conversation[]);

    const { data: allParts } = await supabase
      .from("conversation_participant")
      .select("conversation_id,user_id")
      .in("conversation_id", ids);
    const partsByConv: Record<string, string[]> = {};
    for (const p of (allParts ?? []) as { conversation_id: string; user_id: string }[]) {
      (partsByConv[p.conversation_id] ??= []).push(p.user_id);
    }
    const otherIds = Array.from(
      new Set((allParts ?? []).map((p) => p.user_id).filter((id) => id !== user.id)),
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
    const ch = freshChannel("panel-conv-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, loadConvs)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, loadConvs)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_participant", filter: `user_id=eq.${user.id}` }, loadConvs)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function titleOf(c: Conversation) {
    const others = parts[c.id] ?? [];
    return c.ten ?? (others.length > 0 ? others.map((p) => p.ho_ten ?? p.email).join(", ") : "Hội thoại");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hội thoại</div>
        <Button size="icon" variant="ghost" className="h-8 w-8" title="Hội thoại mới" aria-label="Hội thoại mới" onClick={() => setNewOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
            <div className="px-6 text-xs text-muted-foreground">
              Chưa có hội thoại. Nhấn <b>+</b> để bắt đầu.
            </div>
          </div>
        ) : (
          <ul>
            {convs.map((c) => {
              const title = titleOf(c);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(c.id, title)}
                    className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-secondary/60"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {title.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{title}</div>
                      <div className="text-[11px] text-muted-foreground">{timeAgo(c.last_message_at)}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <NewConversationDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onStarted={(id, title) => { setNewOpen(false); onOpen(id, title); }}
      />
    </div>
  );
}

function NewConversationDialog({
  open,
  onOpenChange,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStarted: (id: string, title: string) => void;
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
    const title = other.ho_ten ?? other.email;
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
        onStarted(existing, title);
        return;
      }
    }
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
    onStarted(cid, title);
  }

  const filtered = users.filter((u) => {
    const q = query.toLowerCase();
    return !q || (u.ho_ten ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-background">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onOpenChange(false)} aria-label="Quay lại">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold">Bắt đầu hội thoại</div>
      </div>
      <div className="border-b border-border px-3 py-2">
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
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="py-6 text-center text-sm text-muted-foreground">Không có người dùng phù hợp</li>
        ) : (
          filtered.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                disabled={creating}
                onClick={() => start(u)}
                className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-secondary/60 disabled:opacity-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold">
                  {(u.ho_ten ?? u.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{u.ho_ten ?? u.email}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{u.email}</div>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function MessageThread({ convId, title, onBack }: { convId: string; title: string; onBack: () => void }) {
  const { user } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileMini>>({});
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  const profilesRef = useRef(profiles);
  profilesRef.current = profiles;
  const signedRef = useRef(signedUrls);
  signedRef.current = signedUrls;

  async function ensureProfiles(ids: string[]) {
    const missing = Array.from(new Set(ids.filter((id) => id && !profilesRef.current[id])));
    if (missing.length === 0) return;
    const { data } = await supabase.from("profiles").select("id,ho_ten,email").in("id", missing);
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of data as ProfileMini[]) next[p.id] = p;
        return next;
      });
    }
  }

  async function signIfNeeded(list: Message[]) {
    const need = list.filter((m) => m.file_path && !signedRef.current[m.file_path!]);
    for (const m of need) {
      const { data } = await storage.from("chat-files").createSignedUrl(m.file_path!, 60 * 60);
      if (data?.signedUrl) setSignedUrls((prev) => ({ ...prev, [m.file_path!]: data.signedUrl }));
    }
  }

  useEffect(() => {
    setMessages([]);
    setSignedUrls({});
    supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const list = (data ?? []) as Message[];
        setMessages(list);
        ensureProfiles(list.map((m) => m.sender_id));
        signIfNeeded(list);
      });

    if (user) {
      supabase
        .from("conversation_participant")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", convId)
        .eq("user_id", user.id)
        .then(() => {});
    }

    const ch = freshChannel(`panel-msg:${convId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.find((x) => x.id === m.id) ? prev : [...prev, m]));
          ensureProfiles([m.sender_id]);
          signIfNeeded([m]);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convId, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!user) return;
    const text = input.trim();
    if (!text && !file) return;
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      let file_path: string | null = null;
      let file_name: string | null = null;
      let file_size: number | null = null;
      let file_mime: string | null = null;
      if (file) {
        if (!isAllowedFile(file)) {
          toast.error("File không hợp lệ", { description: "Chỉ nhận ảnh, PDF, Office; tối đa 20MB." });
          setSending(false);
          return;
        }
        const path = `${user.id}/${convId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await storage.from("chat-files").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (error) {
          toast.error("Tải file thất bại", { description: error.message });
          setSending(false);
          return;
        }
        file_path = path;
        file_name = file.name;
        file_size = file.size;
        file_mime = file.type;
      }
      const { error } = await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        noi_dung: text || null,
        file_path,
        file_name,
        file_size,
        file_mime,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setInput("");
      setFile(null);
    } finally {
      setSending(false);
      sendingRef.current = false;
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-2 py-2">
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onBack} title="Quay lại" aria-label="Quay lại">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
          {title.slice(0, 2).toUpperCase()}
        </div>
        <div className="truncate text-sm font-semibold">{title}</div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            Chưa có tin nhắn — gửi lời chào đầu tiên nhé!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => {
              const p = profiles[m.sender_id];
              const mine = m.sender_id === user?.id;
              const showHeader = i === 0 || messages[i - 1].sender_id !== m.sender_id;
              return (
                <div key={m.id} className={cn("flex gap-2", mine && "flex-row-reverse")}>
                  <div className="w-7 shrink-0">
                    {showHeader && (
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-semibold",
                        mine ? "bg-primary text-primary-foreground" : "bg-secondary",
                      )}>
                        {(p?.ho_ten ?? p?.email ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={cn("min-w-0 max-w-[78%]", mine && "text-right")}>
                    {showHeader && (
                      <div className="mb-1 text-[10px] text-muted-foreground">
                        {p?.ho_ten ?? p?.email ?? "…"} · {formatDT(m.created_at)}
                      </div>
                    )}
                    {m.noi_dung && (
                      <div className={cn(
                        "inline-block whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm",
                        mine ? "bg-primary text-primary-foreground" : "bg-secondary",
                      )}>
                        {m.noi_dung}
                      </div>
                    )}
                    {m.file_path && (
                      <div className={cn(m.noi_dung && "mt-1.5")}>
                        <FileAttachment
                          name={m.file_name ?? "file"}
                          size={m.file_size ?? 0}
                          mime={m.file_mime ?? ""}
                          signedUrl={signedUrls[m.file_path]}
                          mine={mine}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        {file && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs">
            <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{file.name}</span>
            <span className="text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
            <Button size="icon" variant="ghost" className="ml-auto h-6 w-6" onClick={() => setFile(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Paperclip className="h-4 w-4" />
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!isAllowedFile(f)) {
                  toast.error("File không hợp lệ", { description: "Chỉ nhận ảnh, PDF, Office; tối đa 20MB." });
                  e.target.value = "";
                  return;
                }
                setFile(f);
                e.target.value = "";
              }}
            />
          </label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn…"
            rows={1}
            className="max-h-28 min-h-[36px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
          />
          <Button onClick={send} disabled={sending || (!input.trim() && !file)} size="icon" className="h-9 w-9 shrink-0 rounded-full" aria-label="Gửi">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function FileAttachment({
  name, size, mime, signedUrl, mine,
}: {
  name: string; size: number; mime: string; signedUrl: string | undefined; mine: boolean;
}) {
  const isImage = mime.startsWith("image/");
  if (isImage && signedUrl) {
    return (
      <a href={signedUrl} target="_blank" rel="noreferrer">
        <img src={signedUrl} alt={name} className="max-h-56 rounded-lg border border-border object-cover" loading="lazy" />
      </a>
    );
  }
  return (
    <a
      href={signedUrl ?? "#"}
      target="_blank"
      rel="noreferrer"
      download={name}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
        mine ? "border-primary/20 bg-primary/5 hover:bg-primary/10" : "border-border bg-secondary/70 hover:bg-secondary",
      )}
    >
      {isImage ? <ImageIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
      <span className="max-w-[180px] truncate">{name}</span>
      <span className="text-muted-foreground">{(size / 1024).toFixed(0)} KB</span>
      <Download className="ml-1 h-3 w-3 text-muted-foreground" />
    </a>
  );
}

