import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <h1 className="text-2xl font-bold">MIRATS Astryx UI Kit (Isolated Test)</h1>
      <p className="mt-4">Hydrated: {hydrated ? "YES" : "NO"}</p>
      <div className="mt-8 p-4 border rounded bg-muted">
        Nếu bạn thấy trang này, lỗi 500 do các component Astryx gây ra khi SSR.
      </div>
    </div>
  );
}