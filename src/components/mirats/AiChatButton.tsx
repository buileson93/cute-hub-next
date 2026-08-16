import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage } from "ai";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, X, Plus, Loader2, Send, Trash2, MessageSquareText, Wrench,
  MessagesSquare,
} from "lucide-react";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getAiPublicConfig } from "@/lib/ai/config.functions";
import { DirectMessagesPanel } from "@/components/mirats/DirectMessages";
import {
  listConversations,
  createConversation,
  deleteConversation,
  getMessages,
} from "@/lib/ai/conversations.functions";
import { ASK_AI_EVENT, type AskAiDetail } from "@/lib/mirats/ask-ai";
import { normalizeStoredMessages } from "@/lib/ai/message-persist";

const SUGGESTIONS = [
  "Tài sản nào sắp hết hạn bảo hành?",
  "Giấy phép sắp hết hạn trong 30 ngày?",
  "Thống kê tài sản theo trạng thái",
  "Bao nhiêu biên bản đang chờ duyệt?",
];

export function AiChatButton() {
  const { session } = useSession();
  const [open, setOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const publicCfgFn = useServerFn(getAiPublicConfig);
  const { data: cfg } = useQuery({
    queryKey: ["ai-public-config"],
    queryFn: async () => {
      try {
        return await publicCfgFn();
      } catch (err) {
        console.warn("Failed to fetch AI public config:", err);
        return { enabled: false, model: "", beta_label: "Beta" };
      }
    },
    enabled: !!session,
    staleTime: 60_000,
    retry: 1,
  });


  // Mở panel AI từ nơi khác (Bảng lệnh) kèm câu hỏi soạn sẵn
  useEffect(() => {
    const onAsk = (e: Event) => {
      const detail = (e as CustomEvent<AskAiDetail>).detail;
      if (!detail?.prompt) return;
      setPendingPrompt(detail.prompt);
      setOpen(true);
    };
    window.addEventListener(ASK_AI_EVENT, onAsk);
    return () => window.removeEventListener(ASK_AI_EVENT, onAsk);
  }, []);

  if (!session || !cfg?.enabled) return null;

  return (
    <>
      <motion.button
        type="button"
        data-tour="ai"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 400, damping: 22 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(true)}
        aria-label="Mở MIRATS AI & Tin nhắn"
        title="MIRATS AI & Tin nhắn"
        className={cn(
          "fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full lg:bottom-6 lg:right-6",
          "bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground",
          "shadow-lg shadow-primary/25 ring-1 ring-primary/20 backdrop-blur",
          "hover:shadow-xl hover:shadow-primary/20 transition-mirats-base",
        )}
      >
        <Sparkles className="h-5 w-5" strokeWidth={2} />
      </motion.button>


      <AnimatePresence>
        {open && (
          <AiChatPanel
            onClose={() => { setOpen(false); setPendingPrompt(null); }}
            betaLabel={cfg.beta_label}
            pendingPrompt={pendingPrompt}
            onConsumePrompt={() => setPendingPrompt(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AiChatPanel({ onClose, betaLabel, pendingPrompt, onConsumePrompt }: { onClose: () => void; betaLabel: string; pendingPrompt?: string | null; onConsumePrompt?: () => void }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listConversations);
  const createFn = useServerFn(createConversation);
  const deleteFn = useServerFn(deleteConversation);
  const getMsgsFn = useServerFn(getMessages);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<"ai" | "messages">("ai");

  const { data: conversations = [] } = useQuery({
    queryKey: ["ai-conversations"],
    queryFn: () => listFn(),
    staleTime: 10_000,
  });

  const createMut = useMutation({
    mutationFn: () => createFn({ data: {} }),
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["ai-conversations"] });
      setActiveId(row!.id);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: (_r, id) => {
      qc.invalidateQueries({ queryKey: ["ai-conversations"] });
      if (activeId === id) setActiveId(null);
    },
  });

  // Auto-create first conversation (chỉ khi đang ở tab AI)
  useEffect(() => {
    if (tab !== "ai") return;
    if (!activeId && conversations.length === 0 && !createMut.isPending) {
      createMut.mutate();
    } else if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [tab, conversations, activeId, createMut]);


  // Có câu hỏi soạn sẵn (từ Bảng lệnh) → luôn về tab AI
  useEffect(() => {
    if (pendingPrompt) setTab("ai");
  }, [pendingPrompt]);


  const { data: historyRows = [] } = useQuery({
    queryKey: ["ai-messages", activeId],
    queryFn: () => getMsgsFn({ data: { conversation_id: activeId! } }),
    enabled: !!activeId,
  });

  const initialMessages = useMemo<UIMessage[]>(
    () => normalizeStoredMessages(historyRows),
    [historyRows],
  );

  return (
    <motion.aside
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-border bg-background shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
            {tab === "ai" ? <Sparkles className="h-4 w-4" strokeWidth={2.2} /> : <MessagesSquare className="h-4 w-4" strokeWidth={2.2} />}
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {tab === "ai" ? "MIRATS AI" : "Tin nhắn"}
              {tab === "ai" && (
                <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-1.5 py-0 text-meta font-bold uppercase text-primary">
                  {betaLabel}
                </Badge>
              )}
            </div>
            <div className="text-meta text-muted-foreground">
              {tab === "ai" ? "Trợ lý dữ liệu MIRATS · thử nghiệm" : "Trao đổi với đồng nghiệp"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {tab === "ai" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Hội thoại AI mới"
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Đóng" aria-label="Đóng bảng">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tab switcher: Hỏi AI | Tin nhắn */}
      <div className="flex shrink-0 gap-1 border-b border-border px-3 py-2">
        <button
          type="button"
          onClick={() => setTab("ai")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            tab === "ai" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted transition-mirats-fast",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" /> Hỏi AI
        </button>
        <button
          type="button"
          onClick={() => setTab("messages")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            tab === "messages" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted transition-mirats-fast",
          )}
        >
          <MessagesSquare className="h-3.5 w-3.5" /> Tin nhắn
        </button>
      </div>

      {/* Body */}
      {tab === "messages" ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <DirectMessagesPanel />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="hidden w-[140px] shrink-0 flex-col border-r border-border bg-muted/30 py-2 sm:flex">
            <div className="px-2 pb-1 text-meta font-medium uppercase tracking-wider text-muted-foreground">Lịch sử</div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((c: any) => (
                <div key={c.id} className={cn(
                  "group flex items-center gap-1 px-1",
                  activeId === c.id && "bg-accent/60",
                )}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "flex-1 truncate rounded px-1.5 py-1.5 text-left text-meta transition-colors",
                      activeId === c.id ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground transition-colors"
                    )}
                  >
                    <MessageSquareText className="mr-1 inline h-3 w-3 opacity-60" />
                    {c.tieu_de}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMut.mutate(c.id)}
                    className="hidden text-muted-foreground hover:text-destructive group-hover:block"
                    title="Xoá"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {activeId && (
            <ChatArea
              key={activeId}
              conversationId={activeId}
              initialMessages={initialMessages}
              pendingPrompt={pendingPrompt}
              onConsumePrompt={onConsumePrompt}
            />
          )}
        </div>
      )}
    </motion.aside>

  );
}

function ChatArea({
  conversationId,
  initialMessages,
  pendingPrompt,
  onConsumePrompt,
}: {
  conversationId: string;
  initialMessages: UIMessage[];
  pendingPrompt?: string | null;
  onConsumePrompt?: () => void;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (url, init) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers = new Headers(init?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          // Inject conversation_id into body
          let body = init?.body;
          try {
            if (typeof body === "string") {
              const parsed = JSON.parse(body);
              parsed.conversation_id = conversationId;
              body = JSON.stringify(parsed);
              headers.set("Content-Type", "application/json");
            }
          } catch { /* ignore */ }
          return fetch(url, { ...init, headers, body });
        },
      }),
    [conversationId],
  );

  const { messages, sendMessage, status, error, addToolApprovalResponse } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: (e) => toast.error(e.message || "Lỗi AI"),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  const busy = status === "submitted" || status === "streaming";

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text });
  };

  // Tự gửi câu hỏi soạn sẵn từ Bảng lệnh (chỉ 1 lần)
  const sentPromptRef = useRef<string | null>(null);
  useEffect(() => {
    const text = pendingPrompt?.trim();
    if (!text || busy) return;
    if (sentPromptRef.current === text) return;
    sentPromptRef.current = text;
    void sendMessage({ text });
    onConsumePrompt?.();
  }, [pendingPrompt, busy, sendMessage, onConsumePrompt]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Sparkles className="h-8 w-8 text-primary/60" />
            <div className="text-sm font-medium text-foreground">Bạn muốn hỏi gì về MIRATS?</div>
            <div className="text-meta text-muted-foreground">Trợ lý chỉ đọc dữ liệu bạn có quyền truy cập</div>
            <div className="mt-2 grid w-full max-w-[320px] gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-left text-bodySm text-foreground transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} onApprove={addToolApprovalResponse} />
        ))}

        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang suy nghĩ…
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error.message}
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
            }}
            rows={1}
            placeholder="Hỏi về tài sản, giấy phép, biểu mẫu…"
            className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full"
            onClick={submit}
            disabled={busy || !input.trim()} aria-label="Đang tải">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
        <div className="mt-1.5 text-center text-meta text-muted-foreground">
          AI có thể sai. Luôn kiểm tra dữ liệu quan trọng.
        </div>
      </div>
    </div>
  );
}

const WRITE_TOOL_LABELS: Record<string, string> = {
  add_su_co: "Thêm sự cố",
  add_bao_tri: "Thêm bảo dưỡng",
  add_hong_hoc: "Thêm hỏng hóc",
  add_kiem_ke: "Thêm kiểm kê",
};

function MessageBubble({
  message,
  onApprove,
}: {
  message: UIMessage;
  onApprove: (opts: { id: string; approved: boolean }) => void;
}) {
  const isUser = message.role === "user";
  const textParts = message.parts.filter((p) => p.type === "text") as Array<{ type: "text"; text: string }>;
  const toolParts = message.parts.filter((p) => p.type.startsWith("tool-"));

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-foreground",
        )}
      >
        {toolParts.map((p, i) => {
          const anyP = p as Record<string, unknown>;
          const toolName = p.type.replace("tool-", "");
          const label = WRITE_TOOL_LABELS[toolName] ?? toolName;
          const approvalId =
            (anyP.approval as { approvalId?: string; id?: string } | undefined)?.approvalId ??
            (anyP.approval as { id?: string } | undefined)?.id ??
            (anyP.approvalId as string | undefined);
          const isApprovalRequested = anyP.state === "approval-requested" && approvalId;
          const input = anyP.input as Record<string, unknown> | undefined;

          if (isApprovalRequested) {
            return (
              <div
                key={i}
                className="mb-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-foreground"
              >
                <div className="mb-1 flex items-center gap-1.5 text-bodySm font-semibold">
                  <Wrench className="h-3.5 w-3.5" /> Xác nhận ghi dữ liệu: {label}
                </div>
                {input && (
                  <div className="mb-2 space-y-0.5 text-meta text-muted-foreground">
                    {Object.entries(input)
                      .filter(([, v]) => v != null && v !== "")
                      .map(([k, v]) => (
                        <div key={k}>
                          <span className="font-medium text-foreground">{k}:</span> {String(v)}
                        </div>
                      ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-bodySm"
                    onClick={() => onApprove({ id: approvalId as string, approved: true })}
                  >
                    Đồng ý ghi
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-bodySm"
                    onClick={() => onApprove({ id: approvalId as string, approved: false })}
                  >
                    Huỷ
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div key={i} className="mb-1.5 flex items-center gap-1.5 text-meta text-muted-foreground">
              <Wrench className="h-3 w-3" />
              <span className="font-mono">{label}</span>
            </div>
          );
        })}
        {textParts.map((p, i) => (
          <div key={i} className={cn("prose prose-sm max-w-none", isUser ? "prose-invert" : "dark:prose-invert")}>
            <ReactMarkdown>{p.text}</ReactMarkdown>
          </div>
        ))}
      </div>
    </div>
  );
}
