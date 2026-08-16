import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  return (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <h1>Plain HTML Heading - No Astryx Imports</h1>
      <p>Isolating 500 error... no Astryx components here.</p>
    </div>
  );
}
