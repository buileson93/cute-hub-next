import { createFileRoute } from "@tanstack/react-router";
import { 
  Heading, 
  Text,
  VStack
} from "@astryxdesign/core";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return (
      <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
        <VStack gap={4}>
          <Heading level={1}>Astryx SSR Component Lab</Heading>
          <Text>Isolating 500 error... Heading, Text, and VStack (Hydration: False).</Text>
        </VStack>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <VStack gap={4}>
        <Heading level={1}>Astryx SSR Component Lab</Heading>
        <Text>Isolating 500 error... Heading, Text, and VStack (Hydration: True).</Text>
      </VStack>
    </div>
  );
}
