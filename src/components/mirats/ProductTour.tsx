import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Compass, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Kiểu dữ liệu                                                        */
/* ------------------------------------------------------------------ */

export type TourStep = {
  /** CSS selector trỏ tới phần tử cần highlight, vd '[data-tour="search"]' */
  selector: string;
  title: string;
  content: string;
  /** Vị trí ưu tiên của thẻ hướng dẫn quanh phần tử. Mặc định: tự động. */
  placement?: "top" | "bottom" | "left" | "right" | "auto";
  /** Nếu phần tử không tồn tại (vd theo quyền) thì bỏ qua bước này. */
  optional?: boolean;
};

type Rect = { top: number; left: number; width: number; height: number };

type TourContextValue = {
  /** Bắt đầu tour. Nếu force=false sẽ bỏ qua nếu người dùng đã xem. */
  start: (opts?: { force?: boolean }) => void;
  stop: () => void;
  isActive: boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useProductTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useProductTour phải nằm trong <ProductTourProvider>");
  return ctx;
}

const PAD = 8; // đệm quanh vùng highlight
const GAP = 16; // khoảng cách thẻ hướng dẫn với vùng highlight
const CARD_W = 340;

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

export function ProductTourProvider({
  steps,
  storageKey = "mirats-tour-done",
  children,
}: {
  steps: TourStep[];
  storageKey?: string;
  children: ReactNode;
}) {
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);

  // Lọc các bước có phần tử thực sự tồn tại trên trang khi bắt đầu
  const [runSteps, setRunSteps] = useState<TourStep[]>([]);

  const stop = useCallback(() => {
    setActive(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const start = useCallback(
    (opts?: { force?: boolean }) => {
      if (!opts?.force) {
        try {
          if (localStorage.getItem(storageKey) === "1") return;
        } catch {
          /* ignore */
        }
      }
      const available = steps.filter((s) => {
        if (!s.optional) return true;
        const el = document.querySelector(s.selector) as HTMLElement | null;
        if (!el) return false;
        // Bỏ qua bước nếu phần tử bị ẩn (vd chỉ hiện trên desktop/mobile).
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (available.length === 0) return;
      setRunSteps(available);
      setIndex(0);
      setActive(true);
    },
    [steps, storageKey],
  );

  const value = useMemo<TourContextValue>(
    () => ({ start, stop, isActive: active }),
    [start, stop, active],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {active && (
        <TourOverlay
          steps={runSteps}
          index={index}
          setIndex={setIndex}
          onClose={stop}
        />
      )}
    </TourContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Overlay + spotlight                                                */
/* ------------------------------------------------------------------ */

function TourOverlay({
  steps,
  index,
  setIndex,
  onClose,
}: {
  steps: TourStep[];
  index: number;
  setIndex: (i: number) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerWidth,
  );
  const [vh, setVh] = useState(() =>
    typeof window === "undefined" ? 0 : window.innerHeight,
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(180);

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  // Định vị phần tử mục tiêu + cuộn vào tầm nhìn
  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    setVw(window.innerWidth);
    setVh(window.innerHeight);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step]);

  // Cuộn tới phần tử trước khi đo
  useEffect(() => {
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
    const t = setTimeout(measure, 260);
    return () => clearTimeout(t);
  }, [step, measure]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  // Đo chiều cao thẻ để định vị chính xác
  useLayoutEffect(() => {
    if (cardRef.current) setCardH(cardRef.current.offsetHeight);
  }, [index, rect]);

  // Điều hướng bằng bàn phím
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") {
        if (isLast) onClose();
        else setIndex(index + 1);
      } else if (e.key === "ArrowLeft" && !isFirst) setIndex(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, isFirst, isLast, onClose, setIndex]);

  if (!step) return null;

  // Vùng highlight (có đệm), kẹp trong màn hình
  const hole = rect
    ? {
        x: Math.max(rect.left - PAD, 0),
        y: Math.max(rect.top - PAD, 0),
        w: Math.min(rect.width + PAD * 2, vw),
        h: Math.min(rect.height + PAD * 2, vh),
      }
    : null;

  // Tính vị trí thẻ hướng dẫn
  const card = computeCardPosition(hole, step.placement, vw, vh, cardH);

  const overlay = (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label="Hướng dẫn sử dụng">
      {/* Nền tối + khoét lỗ spotlight bằng SVG mask */}
      <svg className="absolute inset-0 h-full w-full" style={{ pointerEvents: "auto" }} onClick={onClose}>
        <defs>
          <mask id="tour-spotlight">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {hole && (
              <motion.rect
                initial={false}
                animate={{ x: hole.x, y: hole.y, width: hole.w, height: hole.h }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
                rx={14}
                ry={14}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(9, 11, 20, 0.72)"
          mask="url(#tour-spotlight)"
        />
      </svg>

      {/* Viền phát sáng quanh vùng highlight */}
      {hole && (
        <motion.div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-primary"
          initial={false}
          animate={{ top: hole.y, left: hole.x, width: hole.w, height: hole.h }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
          style={{ boxShadow: "0 0 0 4px color-mix(in oklab, var(--primary) 25%, transparent)" }}
        >
          {!reduce && (
            <motion.span
              className="absolute inset-0 rounded-2xl ring-2 ring-primary/50"
              animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>
      )}

      {/* Thẻ hướng dẫn */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          ref={cardRef}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="absolute w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-border bg-card p-5 shadow-2xl"
          style={{ top: card.top, left: card.left }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Compass className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Bước {index + 1}/{steps.length}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng hướng dẫn"
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="text-base font-bold text-foreground">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.content}</p>

          {/* Chấm tiến trình */}
          <div className="mt-4 flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Tới bước ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground/50",
                )}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Bỏ qua
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={() => setIndex(index - 1)}
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Quay lại
                </button>
              )}
              <button
                type="button"
                onClick={() => (isLast ? onClose() : setIndex(index + 1))}
                className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                {isLast ? (
                  <>
                    Hoàn tất
                    <Check className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Tiếp theo
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return createPortal(overlay, document.body);
}

/* ------------------------------------------------------------------ */
/* Định vị thẻ hướng dẫn quanh vùng highlight                          */
/* ------------------------------------------------------------------ */

function computeCardPosition(
  hole: { x: number; y: number; w: number; h: number } | null,
  placement: TourStep["placement"] = "auto",
  vw: number,
  vh: number,
  cardH: number,
): { top: number; left: number } {
  // Không tìm thấy phần tử: canh giữa màn hình
  if (!hole) {
    return { top: Math.max((vh - cardH) / 2, 16), left: Math.max((vw - CARD_W) / 2, 12) };
  }

  const spaceBelow = vh - (hole.y + hole.h);
  const spaceAbove = hole.y;
  const spaceRight = vw - (hole.x + hole.w);
  const spaceLeft = hole.x;

  let pick = placement;
  if (pick === "auto") {
    if (spaceBelow >= cardH + GAP) pick = "bottom";
    else if (spaceRight >= CARD_W + GAP) pick = "right";
    else if (spaceLeft >= CARD_W + GAP) pick = "left";
    else if (spaceAbove >= cardH + GAP) pick = "top";
    else pick = "bottom";
  }

  const clampX = (x: number) => Math.min(Math.max(x, 12), vw - CARD_W - 12);
  const clampY = (y: number) => Math.min(Math.max(y, 12), vh - cardH - 12);

  switch (pick) {
    case "top":
      return { top: clampY(hole.y - GAP - cardH), left: clampX(hole.x + hole.w / 2 - CARD_W / 2) };
    case "left":
      return { top: clampY(hole.y + hole.h / 2 - cardH / 2), left: clampX(hole.x - GAP - CARD_W) };
    case "right":
      return { top: clampY(hole.y + hole.h / 2 - cardH / 2), left: clampX(hole.x + hole.w + GAP) };
    case "bottom":
    default:
      return { top: clampY(hole.y + hole.h + GAP), left: clampX(hole.x + hole.w / 2 - CARD_W / 2) };
  }
}
