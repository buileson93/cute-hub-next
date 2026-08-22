// GĐ3-03 — Voice Quick-log: nút mic lớn cho landing card QR.
// Nhấn giữ để nói, thả để dừng; browser không hỗ trợ → textarea fallback.
// Sau khi có transcript → lưu sessionStorage rồi điều hướng /su-co/moi?voice=1.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mic, MicOff, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  createVoiceRecognition,
  isVoiceSupported,
  saveVoiceDraft,
  type VoiceController,
} from "@/lib/mirats/voice-recognition";

interface Props {
  maThietBi: string;
}

export function VoiceQuickLog({ maThietBi }: Props) {
  const navigate = useNavigate();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const ctrlRef = useRef<VoiceController | null>(null);

  useEffect(() => {
    setSupported(isVoiceSupported());
  }, []);

  function handoff(finalText: string) {
    const t = finalText.trim();
    if (t.length < 5) {
      toast.error("Nội dung quá ngắn");
      return;
    }
    saveVoiceDraft({ transcript: t, maThietBi });
    void navigate({
      to: "/su-co/moi",
      search: { thietBi: maThietBi, from: "voice", voice: "1" } as never,
    });
  }

  function startVoice() {
    if (!supported) return;
    const ctrl = createVoiceRecognition({
      lang: "vi-VN",
      interim: true,
      onTranscript: (t) => setText(t),
      onError: (msg) => {
        toast.error(`Ghi âm lỗi: ${msg}`);
        setListening(false);
      },
      onEnd: () => setListening(false),
    });
    if (!ctrl) {
      toast.error("Không khởi tạo được micro");
      return;
    }
    ctrlRef.current = ctrl;
    setText("");
    setListening(true);
    ctrl.start();
  }

  function stopVoice() {
    ctrlRef.current?.stop();
    setListening(false);
  }

  // Cleanup nếu unmount trong khi đang ghi.
  useEffect(
    () => () => {
      ctrlRef.current?.abort();
    },
    [],
  );

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Mic className="h-4 w-4 text-primary" />
        Ghi âm nhanh — báo sự cố bằng giọng nói
      </div>

      {supported ? (
        <>
          <button
            type="button"
            onPointerDown={startVoice}
            onPointerUp={stopVoice}
            onPointerLeave={() => listening && stopVoice()}
            className={`w-full h-16 rounded-lg flex items-center justify-center gap-2 text-base font-medium transition-all select-none touch-none ${
              listening
                ? "bg-destructive text-destructive-foreground animate-pulse scale-[0.98] shadow-lg shadow-destructive/20"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
            }`}
            aria-label="Nhấn giữ để ghi âm sự cố"
          >
            {listening ? (
              <>
                <MicOff className="h-6 w-6" /> Đang nghe… (thả để dừng)
              </>
            ) : (
              <>
                <Mic className="h-6 w-6" /> Nhấn giữ để nói
              </>
            )}
          </button>
          {text && (
            <div className="rounded-md border bg-muted/50 p-2 text-sm min-h-[3rem] max-h-40 overflow-y-auto whitespace-pre-wrap">
              {text}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Trình duyệt không hỗ trợ ghi âm — gõ tay mô tả sự cố:
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Mô tả ngắn: hiện tượng, thời điểm, ảnh hưởng…"
          />
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          onClick={() => handoff(text)}
          disabled={text.trim().length < 5}
        >
          {listening ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-1.5" />
          )}
          Tiếp tục lập báo cáo
        </Button>
      </div>
    </div>
  );
}
