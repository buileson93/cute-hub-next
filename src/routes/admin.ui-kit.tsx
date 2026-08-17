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
          <Text>Phòng thí nghiệm hợp phần giao diện SSR-safe.</Text>
        </VStack>

        <Divider />

        {/* Buttons & Icons */}
        <VStack gap={4} align="stretch">
          <Heading level={2}>Buttons & Icons</Heading>
          <HStack gap={4} align="center" wrap="wrap">
            <Button variant="primary" label="Primary Button" />
            <Button variant="secondary" label="Secondary" />
            <Button variant="destructive" label="Destructive" />
            <Button variant="ghost" label="Ghost" />
            <IconButton icon={<Icon icon="search" />} label="Tìm kiếm" />
            <IconButton icon={<Icon icon="success" />} variant="primary" label="Thêm" />
            <IconButton icon={<Icon icon="wrench" />} variant="secondary" label="Sửa" />
            <IconButton icon={<Icon icon="error" />} variant="destructive" label="Xóa" />
          </HStack>
          <HStack gap={4} align="center" wrap="wrap">
            <Icon icon="search" size="sm" />
            <Icon icon="funnel" size="sm" />
            <Icon icon="moreHorizontal" size="sm" />
            <Icon icon="chevronRight" size="sm" />
            <Icon icon="close" size="sm" />
            <Icon icon="success" size="sm" color="success" />
            <Icon icon="warning" size="sm" color="warning" />
          </HStack>

        </VStack>

        {/* Status & Badges */}
        <VStack gap={4} align="stretch">
          <Heading level={2}>Status & Indicators</Heading>
          <HStack gap={4} align="center">
            <Badge variant="neutral" label="Neutral" />
            <Badge variant="success" label="Success" />
            <Badge variant="warning" label="Warning" />
            <Badge variant="error" label="Error" />
            <Badge variant="info" label="Info" />
          </HStack>
          <HStack gap={6} align="center">
            <HStack gap={2} align="center">
              <StatusDot variant="success" label="Hoạt động" />
              <Text>Hoạt động</Text>
            </HStack>
            <HStack gap={2} align="center">
              <StatusDot variant="warning" label="Bảo trì" />
              <Text>Bảo trì</Text>
            </HStack>
            <HStack gap={2} align="center">
              <StatusDot variant="error" label="Sự cố" />
              <Text>Sự cố</Text>
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
                <Badge variant="success" label="Sẵn sàng" />

              </HStack>
            </VStack>
          </Card>
        </VStack>
      </VStack>
    </div>
  );
}
