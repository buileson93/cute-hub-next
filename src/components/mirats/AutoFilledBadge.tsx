import { Sparkles, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";

interface Props {
  onUndo: () => void;
  label?: string;
}

/** Small "auto" chip shown next to an ambient-filled field, with an Undo affordance. */
export function AutoFilledBadge({ onUndo, label = "auto" }: Props) {
  return (
    <Badge
      variant="outline"
      className="ml-1 h-4 gap-1 border-primary/40 bg-primary/10 px-1.5 text-[10px] font-medium text-primary"
      data-testid="auto-badge"
    >
      <Sparkles className="h-2.5 w-2.5" />
      {label}
      <button
        type="button"
        onClick={onUndo}
        aria-label="Hoàn tác gợi ý"
        className="ml-1 inline-flex items-center rounded hover:text-primary/70"
      >
        <Undo2 className="h-2.5 w-2.5" />
      </button>
    </Badge>
  );
}

/**
 * Apply a suggested value to a controlled field exactly once, only when the
 * field is empty and the user has not typed. Returns `{isAuto, undo, onUserChange}`.
 */
export function useAmbientApply<T>(opts: {
  suggested: T | null | undefined;
  isEmpty: (v: T | null | undefined) => boolean;
  currentValue: T | null | undefined;
  apply: (v: T) => void;
  clear: () => void;
}) {
  const { suggested, isEmpty, currentValue, apply, clear } = opts;
  const [isAuto, setIsAuto] = useState(false);
  const touched = useRef(false);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current || touched.current) return;
    if (suggested == null) return;
    if (!isEmpty(currentValue)) return;
    apply(suggested);
    applied.current = true;
    setIsAuto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggested]);

  return {
    isAuto,
    undo: () => { setIsAuto(false); touched.current = true; clear(); },
    onUserChange: () => { if (isAuto) setIsAuto(false); touched.current = true; },
  };
}
