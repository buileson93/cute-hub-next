import { createFileRoute } from "@tanstack/react-router";
import { 
  Heading, 
  Text,
  VStack,
  HStack,
  Button,
  IconButton,
  Badge,
  StatusDot,
  Card,
  Divider,
  Icon,
  Stack,
  Section,
  Grid,
  Box
} from "@astryxdesign/core";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function StateMatrix({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <VStack gap={2} align="stretch">
      <Text weight="bold" size="sm" color="muted">{label}</Text>
      <HStack gap={4} wrap="wrap" align="center">
        {children}
      </HStack>
    </VStack>
  );
}

function UIKitLab() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Đang tải giao diện lab...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto bg-background min-h-screen pb-24">
      <VStack gap={10} align="stretch">
        <VStack gap={2}>
          <Heading level={1}>Astryx Design Lab</Heading>
          <Text size="large" color="muted">MIRATS 2.0 Component Matrix & Page Archetypes</Text>
        </VStack>

        <Divider />

        {/* Action Controls Matrix */}
        <Section title="Action Controls">
          <Grid columns={{ initial: 1, md: 2 }} gap={8}>
            <VStack gap={6} align="stretch">
              <Heading level={3}>Buttons (Primary)</Heading>
              <StateMatrix label="Default">
                <Button variant="primary" label="Click me" />
                <IconButton variant="primary" icon={<Icon icon="plus" />} label="Add" />
              </StateMatrix>
              <StateMatrix label="Hover / Focus">
                <Button variant="primary" label="Hover state" className="astryx-hover" />
                <Button variant="primary" label="Focus state" className="astryx-focus" />
              </StateMatrix>
              <StateMatrix label="Disabled / Loading">
                <Button variant="primary" label="Disabled" disabled />
                <Button variant="primary" label="Loading" loading />
              </StateMatrix>
            </VStack>

            <VStack gap={6} align="stretch">
              <Heading level={3}>Buttons (Secondary/Ghost)</Heading>
              <StateMatrix label="Secondary">
                <Button variant="secondary" label="Cancel" />
                <Button variant="ghost" label="Dismiss" />
              </StateMatrix>
              <StateMatrix label="Destructive">
                <Button variant="destructive" label="Delete" />
                <IconButton variant="destructive" icon={<Icon icon="trash" />} label="Remove" />
              </StateMatrix>
            </VStack>
          </Grid>
        </Section>

        {/* Data Archetypes */}
        <Section title="Page Archetypes (Static Lab)">
          <Grid columns={{ initial: 1, lg: 2 }} gap={8}>
            {/* Dashboard Archetype */}
            <Card padding={6} variant="flat" className="border-2 border-dashed border-muted">
              <VStack gap={4} align="stretch">
                <HStack justify="between">
                  <Heading level={4}>Dashboard Widget</Heading>
                  <IconButton variant="ghost" icon={<Icon icon="moreVertical" />} label="Menu" />
                </HStack>
                <Grid columns={2} gap={4}>
                  <Card padding={4} className="bg-muted/5">
                    <VStack gap={1}>
                      <Text size="sm" color="muted">Availability</Text>
                      <Text size="xl" weight="bold" className="font-mono">99.8%</Text>
                    </VStack>
                  </Card>
                  <Card padding={4} className="bg-muted/5">
                    <VStack gap={1}>
                      <Text size="sm" color="muted">MTTR</Text>
                      <Text size="xl" weight="bold" className="font-mono">4.2h</Text>
                    </VStack>
                  </Card>
                </Grid>
              </VStack>
            </Card>

            {/* List Archetype */}
            <Card padding={6} variant="flat" className="border-2 border-dashed border-muted">
              <VStack gap={4} align="stretch">
                <HStack justify="between">
                  <Heading level={4}>List/Table Row</Heading>
                  <Badge variant="success" label="Healthy" />
                </HStack>
                <VStack gap={2} className="divide-y divide-border">
                  {[1, 2, 3].map(i => (
                    <HStack key={i} justify="between" className="py-2">
                      <VStack gap={0}>
                        <Text weight="medium">Device-00{i}</Text>
                        <Text size="sm" color="muted">System A - Level {i}</Text>
                      </VStack>
                      <Icon icon="chevronRight" size="sm" color="muted" />
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </Card>
          </Grid>
        </Section>

        {/* Feedback & Feedback Matrix */}
        <Section title="Feedback & Status">
          <HStack gap={10} align="start">
            <VStack gap={4} align="stretch">
              <Heading level={3}>Badges</Heading>
              <HStack gap={2} wrap="wrap">
                <Badge variant="neutral" label="Default" />
                <Badge variant="success" label="Active" />
                <Badge variant="warning" label="Pending" />
                <Badge variant="error" label="Failed" />
                <Badge variant="info" label="Update" />
              </HStack>
            </VStack>
            <VStack gap={4} align="stretch">
              <Heading level={3}>Status Dots</Heading>
              <VStack gap={2}>
                <HStack gap={2} align="center"><StatusDot variant="success" /><Text>Online</Text></HStack>
                <HStack gap={2} align="center"><StatusDot variant="warning" /><Text>Away</Text></HStack>
                <HStack gap={2} align="center"><StatusDot variant="error" /><Text>Offline</Text></HStack>
              </VStack>
            </VStack>
          </HStack>
        </Section>

      </VStack>
    </div>
  );
}

