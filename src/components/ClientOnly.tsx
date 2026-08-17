import { ReactNode, useState, useEffect } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Hydration guard to prevent browser-only code from running during SSR.
 */
export function ClientOnly({ children, fallback = null }: Props) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
