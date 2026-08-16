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
  Icon
} from "@astryxdesign/core";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Đang tải giao diện...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <VStack gap={8} align="stretch">
        <VStack gap={2}>
          <Heading level={1}>MIRATS Astryx UI Kit</Heading>
          <Text variant="description">Phòng thí nghiệm hợp phần giao diện SSR-safe.</Text>
        </VStack>

        <Divider />

        {/* Buttons & Icons */}
        <VStack gap={4} align="stretch">
          <Heading level={2}>Buttons & Icons</Heading>
          <HStack gap={4} align="center" wrap>
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <IconButton icon={<Icon name="search" />} aria-label="Search" />
            <IconButton icon={<Icon name="add" />} variant="primary" aria-label="Add" />
            <IconButton icon={<Icon name="edit" />} variant="secondary" aria-label="Edit" />
            <IconButton icon={<Icon name="delete" />} variant="destructive" aria-label="Delete" />
          </HStack>
          <HStack gap={4} align="center" wrap>
            <Icon name="search" size="sm" />
            <Icon name="filter" size="sm" />
            <Icon name="more" size="sm" />
            <Icon name="chevron-right" size="sm" />
            <Icon name="close" size="sm" />
            <Icon name="check" size="sm" color="success" />
            <Icon name="warning" size="sm" color="warning" />
          </HStack>
        </VStack>

        {/* Status & Badges */}
        <VStack gap={4} align="stretch">
          <Heading level={2}>Status & Indicators</Heading>
          <HStack gap={4} align="center">
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
            <Badge variant="info">Info</Badge>
          </HStack>
          <HStack gap={6} align="center">
            <HStack gap={2} align="center">
              <StatusDot status="success" />
              <Text size="sm">Hoạt động</Text>
            </HStack>
            <HStack gap={2} align="center">
              <StatusDot status="warning" />
              <Text size="sm">Bảo trì</Text>
            </HStack>
            <HStack gap={2} align="center">
              <StatusDot status="error" />
              <Text size="sm">Sự cố</Text>
            </HStack>
          </HStack>
        </VStack>

        {/* Data Display */}
        <VStack gap={4} align="stretch">
          <Heading level={2}>Data Display</Heading>
          <Card padding={4}>
            <VStack gap={3}>
              <Heading level={3}>Thành phần hệ thống</Heading>
              <Text>Thông tin chi tiết về thiết bị và lịch sử vận hành.</Text>
              <Divider />
              <HStack justify="between">
                <Text weight="medium">Trạng thái:</Text>
                <Badge variant="success">Sẵn sàng</Badge>
              </HStack>
            </VStack>
          </Card>
        </VStack>
      </VStack>
    </div>
  );
}
