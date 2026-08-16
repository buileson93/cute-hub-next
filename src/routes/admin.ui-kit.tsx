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
  VStack,
  DropdownMenu,
  DropdownMenuItem
} from "@astryxdesign/core";
import { useState } from "react";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

/**
 * UIKitLab (P5)
 * 
 * SSR-safe Component Lab for Astryx Design System.
 * Verified against @astryxdesign/core 0.4.1.
 * 
 * Final Types Sync:
 * - TextInput: 'value' prop is required.
 * - DropdownMenu: uses 'button' prop for trigger configuration in compound mode, OR data-driven 'items'.
 * - Button: variant 'danger' -> 'destructive' (per common theme mapping).
 * - DropdownMenuItem: variant 'danger' -> 'destructive'.
 */
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
        {/* Header */}
        <VStack gap={1}>
          <Heading level={1}>Astryx SSR Component Lab</Heading>
          <Text color="secondary">
            MIRATS 2.0 Design System Pilot (Phase 5)
          </Text>
        </VStack>

        <Divider />

        {/* Icons Gallery */}
        <Section title="Icon Gallery (Semantic Icons)">
          <HStack gap={2} wrap="wrap">
            {icons.map(name => (
              <VStack key={name} gap={1} align="center" className="w-24 p-2 border rounded-lg">
                <Icon icon={name as any} size="md" />
                <Text size="xsm" className="truncate w-full text-center text-secondary">{name}</Text>
              </VStack>
            ))}
          </HStack>
        </Section>

        {/* Typography */}
        <Section title="Typography & Headings">
          <VStack gap={2}>
            <Heading level={2}>H2 Heading (Section Title)</Heading>
            <Heading level={3}>H3 Heading (Sub-section)</Heading>
            <Text>
              Đây là nội dung văn bản mặc định (Body Text) sử dụng phông chữ Inter đã được cấu hình trong P4.
            </Text>
            <Text color="secondary">Văn bản phụ (Secondary Text) cho các ghi chú hoặc mô tả.</Text>
            <Text size="sm">Small text cho các nhãn nhỏ hoặc metadata.</Text>
          </VStack>
        </Section>

        {/* Buttons & Indicators */}
        <Section title="Buttons & Status">
          <HStack gap={2} wrap="wrap" align="center">
            <Button label="Primary Button" variant="primary" />
            <Button label="Secondary" variant="secondary" />
            <Button label="Danger" variant="destructive" />
            <IconButton icon="search" label="Tìm kiếm" />
            <Badge label="Active" variant="success" />
            <Badge label="Critical" variant="error" />
            <HStack gap={1} align="center">
              <StatusDot variant="success" label="Active" />
              <Text>Hệ thống ổn định</Text>
            </HStack>
            <Button label="Loading..." isLoading />
            <Button label="Disabled" isDisabled />
          </HStack>
        </Section>

        {/* Navigation & Tabs */}
        <Section title="Navigation & Tabs">
          <VStack gap={2}>
            <Breadcrumbs>
              <BreadcrumbItem href="/">Trang chủ</BreadcrumbItem>
              <BreadcrumbItem href="/admin">Quản trị</BreadcrumbItem>
              <BreadcrumbItem isCurrent>UI Kit</BreadcrumbItem>
            </Breadcrumbs>
            
            <TabList value={activeTab} onChange={setActiveTab}>
              <Tab value="overview" label="Tổng quan" />
              <Tab value="components" label="Thành phần" />
              <Tab value="docs" label="Tài liệu" />
            </TabList>
          </VStack>
        </Section>

        {/* Inputs */}
        <Section title="Forms & Inputs">
          <VStack gap={2} className="max-w-md">
            <TextInput 
              label="Tên thiết bị" 
              placeholder="Nhập mã hoặc tên..." 
              value={inputValue} 
              onChange={setInputValue} 
            />
            {/* Using data-mode for DropdownMenu to avoid complex trigger props in lab */}
            <DropdownMenu 
              button={{ label: "Chọn thao tác", variant: "secondary" }}
              items={[
                { label: "Chỉnh sửa", onClick: () => console.log("Edit") },
                { label: "Sao chép", onClick: () => console.log("Copy") },
                { label: "Xoá", variant: "destructive", onClick: () => console.log("Delete") }
              ]}
            />
          </VStack>
        </Section>

        {/* Data Display */}
        <Section title="Data & Feedback">
          <VStack gap={2}>
            <Card className="p-0 overflow-hidden border">
              <Table 
                columns={demoColumns as any} 
                data={demoData} 
              />
            </Card>

            <Pagination 
              page={page} 
              totalPages={10} 
              onChange={setPage} 
            />

            <EmptyState 
              title="Không tìm thấy dữ liệu" 
              description="Vui lòng thử lại với bộ lọc khác hoặc tạo mới tài sản."
              icon="search"
            />
            
            <VStack gap={1}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </VStack>
            
            <HStack gap={2} align="center">
              <Avatar name="Vũ Hồng Sơn" />
              <VStack gap={0}>
                <Text weight="bold">Vũ Hồng Sơn</Text>
                <Text size="sm" color="secondary">Quản trị viên</Text>
              </VStack>
            </HStack>
          </VStack>
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
