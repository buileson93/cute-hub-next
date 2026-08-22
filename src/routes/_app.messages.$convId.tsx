import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import { freshChannel } from "@/lib/realtime/channel";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, File as FileIcon, Download, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { formatDT } from "@/lib/time";
import { cn } from "@/lib/utils";

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

type ProfileMini = { id: string; ho_ten: string | null; email: string };

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
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

export const Route = createFileRoute("/_app/messages/$convId")({
  component: ChatPane,
});

function ChatPane() {
  const { convId } = useParams({ from: "/_app/messages/$convId" });
  const { user } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileMini>>({});
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  async function ensureProfiles(ids: string[]) {
    const missing = Array.from(new Set(ids.filter((id) => id && !profiles[id])));
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
    const need = list.filter((m) => m.file_path && !signedUrls[m.file_path!]);
    for (const m of need) {
      const { data } = await storage.from("chat-files").createSignedUrl(m.file_path!, 60 * 60);
      if (data?.signedUrl) {
        setSignedUrls((prev) => ({ ...prev, [m.file_path!]: data.signedUrl }));
      }
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

    const ch = freshChannel(`msg:${convId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.find((x) => x.id === m.id) ? prev : [...prev, m]));
          ensureProfiles([m.sender_id]);
          signIfNeeded([m]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
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
          toast.error("File không hợp lệ", {
            description: "Chỉ nhận ảnh, PDF, hoặc Office; tối đa 20MB.",
          });
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
    <>
      <div className="flex-1 overflow-y-auto px-6 py-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Chưa có tin nhắn — gửi lời chào đầu tiên nhé!
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-3">
            {messages.map((m, i) => {
              const p = profiles[m.sender_id];
              const mine = m.sender_id === user?.id;
              const showHeader = i === 0 || messages[i - 1].sender_id !== m.sender_id;
              return (
                <div key={m.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
                  <div className="w-8 shrink-0">
                    {showHeader && (
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-semibold",
                          mine ? "bg-primary text-primary-foreground" : "bg-secondary",
                        )}
                      >
                        {(p?.ho_ten ?? p?.email ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={cn("min-w-0 max-w-[70%]", mine && "text-right")}>
                    {showHeader && (
                      <div className="mb-1 text-[10.5px] text-muted-foreground">
                        {p?.ho_ten ?? p?.email ?? "…"} · {formatDT(m.created_at)}
                      </div>
                    )}
                    {m.noi_dung && (
                      <div
                        className={cn(
                          "inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                          mine ? "bg-primary text-primary-foreground" : "bg-secondary",
                        )}
                      >
                        {m.noi_dung}
                      </div>
                    )}
                    {m.file_path && (
                      <div className={cn("mt-1", m.noi_dung && "mt-1.5")}>
                        <FileAttachment
                          path={m.file_path}
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

      <div className="border-t border-border bg-card p-4">
        {file && (
          <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-xs">
            <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{file.name}</span>
            <span className="text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto h-6 w-6"
              onClick={() => setFile(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Paperclip className="h-4 w-4" />
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!isAllowedFile(f)) {
                  toast.error("File không hợp lệ", {
                    description: "Chỉ nhận ảnh, PDF, Office; tối đa 20MB.",
                  });
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
            className="min-h-[40px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            onClick={send}
            disabled={sending || (!input.trim() && !file)}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            aria-label="Gửi"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mx-auto mt-1 max-w-3xl text-center text-[10px] text-muted-foreground">
          Enter để gửi · Shift+Enter xuống dòng · File tối đa 20MB (ảnh, PDF, Office)
        </div>
      </div>
    </>
  );
}

function FileAttachment({
  path,
  name,
  size,
  mime,
  signedUrl,
  mine,
}: {
  path: string;
  name: string;
  size: number;
  mime: string;
  signedUrl: string | undefined;
  mine: boolean;
}) {
  const isImage = mime.startsWith("image/");
  if (isImage && signedUrl) {
    return (
      <a href={signedUrl} target="_blank" rel="noreferrer">
        <img
          src={signedUrl}
          alt={name}
          className="max-h-72 rounded-lg border border-border object-cover"
          loading="lazy"
        />
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
        mine
          ? "border-primary/20 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-secondary/70 hover:bg-secondary",
      )}
    >
      {isImage ? <ImageIcon className="h-4 w-4" /> : <FileIcon className="h-4 w-4" />}
      <span className="max-w-[220px] truncate">{name}</span>
      <span className="text-muted-foreground">{(size / 1024).toFixed(0)} KB</span>
      <Download className="ml-1 h-3 w-3 text-muted-foreground" />
    </a>
  );
}
