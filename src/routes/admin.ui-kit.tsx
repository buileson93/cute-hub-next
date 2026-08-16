import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ui-kit")({
  component: () => (
    <div className="p-8">
      <h1 className="text-2xl font-bold">SSR Baseline Test</h1>
      <p>This page uses zero external components, only standard HTML.</p>
    </div>
  ),
});
