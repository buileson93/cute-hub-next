import { createFileRoute } from "@tanstack/react-router";
import { 
  Heading, 
  Text,
  VStack
} from "@astryxdesign/core";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  return (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <VStack gap={4}>
        <Heading level={1}>Astryx SSR Component Lab</Heading>
        <Text>Isolating 500 error... Heading, Text, and VStack.</Text>
      </VStack>
    </div>
  );
}
