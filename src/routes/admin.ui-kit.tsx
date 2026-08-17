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
  Grid
} from "@astryxdesign/core";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function StateMatrix({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <VStack gap={2} align="stretch">
      <Text weight="bold" size="sm" color="secondary">{label}</Text>
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
          <Text size="lg" color="secondary">MIRATS 2.0 Component Matrix & Page Archetypes</Text>
        </VStack>

        <Divider />

        {/* Action Controls Matrix */}
        <Section>
          <VStack gap={6} align="stretch">
            <Heading level={2}>Action Controls</Heading>
            <Grid columns={{ minWidth: 320 }} gap={8}>
              <VStack gap={6} align="stretch">
                <Heading level={3}>Buttons (Primary)</Heading>
                <StateMatrix label="Default">
                  <Button variant="primary" label="Click me" />
                  <IconButton variant="primary" icon={<Icon icon="success" />} label="Add" />
                </StateMatrix>
                <StateMatrix label="Hover / Focus">
                  <Button variant="primary" label="Hover state" className="astryx-hover" />
                  <Button variant="primary" label="Focus state" className="astryx-focus" />
                </StateMatrix>
                <StateMatrix label="Disabled / Loading">
                  <Button variant="primary" label="Disabled" isDisabled />
                  <Button variant="primary" label="Loading" isLoading />
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
                  <IconButton variant="destructive" icon={<Icon icon="error" />} label="Remove" />
                </StateMatrix>
              </VStack>
            </Grid>
          </VStack>
        </Section>

        {/* Data Archetypes */}
        <Section>
          <VStack gap={6} align="stretch">
            <Heading level={2}>Page Archetypes (Static Lab)</Heading>
            <Grid columns={{ minWidth: 400 }} gap={8}>
              {/* Dashboard Archetype */}
              <Card padding={6} variant="muted">
                <VStack gap={4} align="stretch">
                  <HStack justify="between">
                    <Heading level={4}>Dashboard Widget</Heading>
                    <IconButton variant="ghost" icon={<Icon icon="moreHorizontal" />} label="Menu" />
                  </HStack>
                  <Grid columns={{ minWidth: 150 }} gap={4}>
                    <Card padding={4} variant="default">
                      <VStack gap={1}>
                        <Text size="sm" color="secondary">Availability</Text>
                        <Text size="xl" weight="bold" hasTabularNumbers>99.8%</Text>
                      </VStack>
                    </Card>
                    <Card padding={4} variant="default">
                      <VStack gap={1}>
                        <Text size="sm" color="secondary">MTTR</Text>
                        <Text size="xl" weight="bold" hasTabularNumbers>4.2h</Text>
                      </VStack>
                    </Card>
                  </Grid>
                </VStack>
              </Card>

              {/* List Archetype */}
              <Card padding={6} variant="muted">
                <VStack gap={4} align="stretch">
                  <HStack justify="between">
                    <Heading level={4}>List/Table Row</Heading>
                    <Badge variant="success" label="Healthy" />
                  </HStack>
                  <VStack gap={2}>
                    {[1, 2, 3].map(i => (
                      <div key={i}>
                        <HStack justify="between" className="py-2">
                          <VStack gap={0}>
                            <Text weight="medium">Device-00{i}</Text>
                            <Text size="sm" color="secondary">System A - Level {i}</Text>
                          </VStack>
                          <Icon icon="chevronRight" size="sm" color="secondary" />
                        </HStack>
                        {i < 3 && <Divider />}
                      </div>
                    ))}
                  </VStack>
                </VStack>
              </Card>
            </Grid>
          </VStack>
        </Section>

        {/* Feedback Matrix */}
        <Section>
          <VStack gap={6} align="stretch">
            <Heading level={2}>Feedback & Status</Heading>
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
                  <HStack gap={2} align="center"><StatusDot variant="success" label="Online" /><Text>Online</Text></HStack>
                  <HStack gap={2} align="center"><StatusDot variant="warning" label="Away" /><Text>Away</Text></HStack>
                  <HStack gap={2} align="center"><StatusDot variant="error" label="Offline" /><Text>Offline</Text></HStack>
                </VStack>
              </VStack>
            </HStack>
          </VStack>
        </Section>

      </VStack>
    </div>
  );
}


