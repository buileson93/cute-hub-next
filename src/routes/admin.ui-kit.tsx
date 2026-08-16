import { createFileRoute } from "@tanstack/react-router";
import { 
  Heading
} from "@astryxdesign/core";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  return (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <Heading level={1}>Basic HTML Only</Heading>
    </div>
  );
}
