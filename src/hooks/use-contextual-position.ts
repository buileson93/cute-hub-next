// Tính vị trí floating toolbar cạnh 1 anchor rect, tự flip khi tràn viewport.
import { useEffect, useState } from "react";

export interface ContextualPos {
  top: number;
  left: number;
  placement: "below" | "above";
}

export interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function computePosition(
  anchor: AnchorRect,
  toolbar: { width: number; height: number },
  viewport: { width: number; height: number },
  gap = 8,
): ContextualPos {
  const spaceBelow = viewport.height - (anchor.top + anchor.height);
  const placement: "below" | "above" = spaceBelow >= toolbar.height + gap ? "below" : "above";

  const top =
    placement === "below" ? anchor.top + anchor.height + gap : anchor.top - toolbar.height - gap;

  let left = anchor.left + anchor.width / 2 - toolbar.width / 2;
  left = Math.max(gap, Math.min(left, viewport.width - toolbar.width - gap));

  return { top, left, placement };
}

export function useContextualPosition(
  anchor: AnchorRect | null,
  toolbarRef: React.RefObject<HTMLElement | null>,
): ContextualPos | null {
  const [pos, setPos] = useState<ContextualPos | null>(null);

  useEffect(() => {
    if (!anchor || !toolbarRef.current) {
      setPos(null);
      return;
    }
    const el = toolbarRef.current;
    const rect = el.getBoundingClientRect();
    setPos(
      computePosition(
        anchor,
        { width: rect.width || 300, height: rect.height || 40 },
        { width: window.innerWidth, height: window.innerHeight },
      ),
    );
  }, [anchor, toolbarRef]);

  return pos;
}
