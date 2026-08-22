// GĐ3-03 — Wrap Web Speech API (SpeechRecognition) cho voice quick-log.
// Trả về controller với start/stop + callbacks; tự chọn webkit prefix.
// Không dùng ở SSR — chỉ gọi trong effect/event handler ở client.

type SR = typeof globalThis extends { SpeechRecognition: infer T } ? T : unknown;

interface SRLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: unknown) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface Ctor {
  new (): SRLike;
}

function getCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceSupported(): boolean {
  return !!getCtor();
}

export interface VoiceController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export interface VoiceOptions {
  lang?: string;
  interim?: boolean;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (message: string) => void;
  onEnd?: () => void;
}

export function createVoiceRecognition(opts: VoiceOptions): VoiceController | null {
  const Ctor = getCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = opts.lang ?? "vi-VN";
  rec.continuous = true;
  rec.interimResults = opts.interim ?? true;

  rec.onresult = (e: unknown) => {
    const ev = e as {
      results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
    };
    let finalText = "";
    let interim = "";
    for (let i = 0; i < ev.results.length; i++) {
      const r = ev.results[i];
      const chunk = r[0]?.transcript ?? "";
      if (r.isFinal) finalText += chunk;
      else interim += chunk;
    }
    const combined = (finalText + " " + interim).trim();
    opts.onTranscript(combined, !!finalText && !interim);
  };
  rec.onerror = (e: unknown) => {
    const err = e as { error?: string; message?: string };
    opts.onError?.(err.error ?? err.message ?? "voice-error");
  };
  rec.onend = () => opts.onEnd?.();

  return {
    start: () => {
      try {
        rec.start();
      } catch {
        /* already started */
      }
    },
    stop: () => {
      try {
        rec.stop();
      } catch {
        /* not running */
      }
    },
    abort: () => {
      try {
        rec.abort();
      } catch {
        /* noop */
      }
    },
  };
}

/** Khóa sessionStorage cho transcript chuyển tiếp giữa /q/:ma và /su-co/moi. */
export const VOICE_DRAFT_KEY = "mirats:voice-draft";

export interface VoiceDraft {
  transcript: string;
  maThietBi?: string;
  savedAt: number;
}

export function saveVoiceDraft(d: Omit<VoiceDraft, "savedAt">): void {
  if (typeof sessionStorage === "undefined") return;
  const payload: VoiceDraft = { ...d, savedAt: Date.now() };
  try {
    sessionStorage.setItem(VOICE_DRAFT_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function popVoiceDraft(): VoiceDraft | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(VOICE_DRAFT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(VOICE_DRAFT_KEY);
    return JSON.parse(raw) as VoiceDraft;
  } catch {
    return null;
  }
}
