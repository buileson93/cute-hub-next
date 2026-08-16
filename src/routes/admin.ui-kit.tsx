import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ui-kit")({
  component: () => (
    <div style={{ padding: '2rem' }}>
      <h1>SSR Test</h1>
      <p>This is a plain HTML test page.</p>
    </div>
  ),
});
