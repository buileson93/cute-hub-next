import { createFileRoute } from "@tanstack/react-router";
import { 
  Heading, 
  Text
} from "@astryxdesign/core";
import { useState } from "react";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  return (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <Heading level={1}>Astryx SSR Component Lab</Heading>
      <Text>Isolating 500 error...</Text>
    </div>
  );
}
