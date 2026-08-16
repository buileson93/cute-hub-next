import { createFileRoute } from "@tanstack/react-router";
import { 
  Heading, 
  Text, 
  Divider, 
  Card, 
  Button, 
  IconButton, 
  Badge, 
  StatusDot, 
  EmptyState, 
  Skeleton, 
  Avatar, 
  Breadcrumbs, 
  BreadcrumbItem,
  TabList, 
  Tab,
  Pagination, 
  Toolbar, 
  TextInput, 
  Table,
  Icon,
  HStack,
  VStack
} from "@astryxdesign/core";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

/**
 * ClientOnly
 */
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  if (!hydrated) return null;
  return <>{children}</>;
}

function UIKitLab() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [inputValue, setInputValue] = useState("");

  const demoColumns = [
    { key: "id", header: "ID", width: "10%" },
    { key: "name", header: "Tên tài sản" },
    { key: "status", header: "Trạng thái", width: "20%" },
  ];

  const demoData = [
    { id: "TB-001", name: "Đài chỉ huy Chu Lai", status: "Hoạt động" },
    { id: "TB-002", name: "Radar thứ cấp Sơn Trà", status: "Bảo trì" },
    { id: "TB-003", name: "Máy phát điện FG Wilson", status: "Hỏng hóc" },
  ];

  const icons = [
    "search", "check", "error", "warning", "info", 
    "moreHorizontal", "chevronDown", "chevronLeft", "chevronRight",
    "calendar", "clock", "externalLink", "menu", "copy", "funnel"
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto bg-background min-h-screen">
      <VStack gap={6}>
        <VStack gap={1}>
          <Heading level={1}>Astryx SSR Component Lab</Heading>
          <Text color="secondary">
            MIRATS 2.0 Design System Pilot (Phase 5)
          </Text>
        </VStack>

        <Divider />

        <Section title="Typography & Headings">
          <VStack gap={2}>
            <Heading level={2}>H2 Heading</Heading>
            <Text>Body text demonstration.</Text>
          </VStack>
        </Section>

        <Section title="Buttons & Status">
          <HStack gap={2} wrap="wrap" align="center">
            <Button label="Primary" variant="primary" />
            <Button label="Secondary" variant="secondary" />
            <IconButton icon="search" label="Tìm kiếm" />
            <Badge label="Active" variant="success" />
            <StatusDot variant="success" label="Active" />
          </HStack>
        </Section>
      </VStack>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <VStack gap={3} className="w-full">
      <Heading level={3} color="accent" className="border-b pb-2">{title}</Heading>
      {children}
    </VStack>
  );
}
