import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ui-kit")({
  component: () => (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <h1>Plain HTML (Minimal Component Test)</h1>
      <p>If you see this, the route is functional.</p>
    </div>
  ),
});
