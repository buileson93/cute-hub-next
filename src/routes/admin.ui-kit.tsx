import { createFileRoute } from "@tanstack/react-router";
import { 
  Heading, 
  Text
} from "@astryxdesign/core";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  return (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <Heading level={1}>Heading Only</Heading>
      <Text>Hydration: {hydrated ? "True" : "False"}</Text>
    </div>
  );
}
