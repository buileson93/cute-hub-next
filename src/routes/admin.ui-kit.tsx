import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ui-kit")({
  component: () => (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <h1 className="text-2xl font-bold mb-4">MIRATS UI Kit Lab</h1>
      <p className="text-muted-foreground">Isolating SSR route stability issues...</p>
    </div>
  ),
});
