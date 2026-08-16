import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  return (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <h1>Plain HTML (Static Route Test)</h1>
      <p>If you see this, the route definition is working.</p>
    </div>
  );
}
