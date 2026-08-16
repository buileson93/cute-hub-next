import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, Suspense, lazy } from "react";

// Lazy load all Astryx components to prevent SSR crashes from browser global access
const Heading = lazy(() => import("@astryxdesign/core").then(m => ({ default: m.Heading })));
const Text = lazy(() => import("@astryxdesign/core").then(m => ({ default: m.Text })));
const VStack = lazy(() => import("@astryxdesign/core").then(m => ({ default: m.VStack })));
const HStack = lazy(() => import("@astryxdesign/core").then(m => ({ default: m.HStack })));
const Button = lazy(() => import("@astryxdesign/core").then(m => ({ default: m.Button })));
const IconButton = lazy(() => import("@astryxdesign/core").then(m => ({ default: m.IconButton })));
const Badge = lazy(() => import("@astryxdesign/core").then(m => ({ default: m.Badge })));
const StatusDot = lazy(() => import("@astryxdesign/core").then(m => ({ default: m.StatusDot })));
const Divider = lazy(() => import("@astryxdesign/core").then(m => ({ default: m.Divider })));
const Icon = lazy(() => import("@astryxdesign/core").then(m => ({ default: m.Icon })));

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
        <div className="text-muted-foreground font-sans">Đang tải giao diện...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-8 font-sans">Đang tải thành phần...</div>}>
      <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen font-sans">
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
              <Button label="Primary Button" variant="primary" />
              <Button label="Secondary" variant="secondary" />
              <Button label="Destructive" variant="destructive" />
              <Button label="Ghost" variant="ghost" />
              <IconButton icon="search" label="Search" />
              <IconButton icon="search" variant="primary" label="Add" />
              <IconButton icon="search" variant="secondary" label="Edit" />
              <IconButton icon="close" variant="destructive" label="Delete" />
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
            <HStack gap={4} align="center" wrap="wrap">
              <Badge label="Neutral" variant="neutral" />
              <Badge label="Success" variant="success" />
              <Badge label="Warning" variant="warning" />
              <Badge label="Error" variant="error" />
              <Badge label="Info" variant="info" />
            </HStack>
            <HStack gap={6} align="center" wrap="wrap">
              <HStack gap={2} align="center">
                <StatusDot variant="success" label="Hoạt động" />
                <Text size="sm">Hoạt động</Text>
              </HStack>
              <HStack gap={2} align="center">
                <StatusDot variant="warning" label="Bảo trì" />
                <Text size="sm">Bảo trì</Text>
              </HStack>
              <HStack gap={2} align="center">
                <StatusDot variant="error" label="Sự cố" />
                <Text size="sm">Sự cố</Text>
              </HStack>
            </HStack>
          </VStack>

          {/* Typography */}
          <VStack gap={4} align="stretch">
            <Heading level={2}>Typography & Layout</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg bg-card shadow-sm">
                <VStack gap={3}>
                  <Heading level={3}>Heading Level 3</Heading>
                  <Text type="body">
                    Sử dụng phông chữ hệ thống để đảm bảo hiệu suất và sự ổn định trong môi trường SSR.
                    Văn bản tiếng Việt hiển thị chính xác với phông sans-serif chuẩn.
                  </Text>
                  <Text type="supporting">
                    Văn bản nhỏ hơn với màu sắc được làm mờ (supporting/secondary).
                  </Text>
                </VStack>
              </div>
              <div className="p-4 border rounded-lg bg-card shadow-sm">
                <VStack gap={3}>
                  <Heading level={3}>Thành phần Bố cục</Heading>
                  <HStack gap={2} wrap="wrap">
                    <Badge label="Thanh phần" variant="info" />
                    <Badge label="Thiết bị" variant="info" />
                    <Badge label="Vị trí" variant="info" />
                  </HStack>
                  <Divider />
                  <Text size="2xs">
                    Phần chân trang với văn bản cực nhỏ (extra small).
                  </Text>
                </VStack>
              </div>
            </div>
          </VStack>
        </VStack>
      </div>
    </Suspense>
  );
}
