import { motion, useReducedMotion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getMotionDurationSeconds, getMotionEase } from "@/lib/mirats/motion";

/**
 * Fade + subtle rise trên mỗi lần đổi route.
 * Tôn trọng prefers-reduced-motion. Dùng motion tokens (GĐ1-01).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: getMotionDurationSeconds("base"),
        ease: getMotionEase("standard"),
      }}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden"
    >
      {children}
    </motion.div>
  );
}
