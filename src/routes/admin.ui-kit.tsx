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
  Stack,
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
 */
function UIKitLab() {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");

  const demoColumns = [
    { key: "id", header: "ID", width: 80 },
    { key: "name", header: "Tên tài sản" },
    { key: "status", header: "Trạng thái", width: 120 },
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
      <VStack gap={32}>
        {/* Header */}
        <VStack gap={8}>
          <Heading level={1}>Astryx SSR Component Lab</Heading>
          <Text variant="secondary">
            MIRATS 2.0 Design System Pilot (Phase 5)
          </Text>
        </VStack>

        <Divider />

        {/* Icons Gallery */}
        <Section title="Icon Gallery (Semantic Icons)">
          <HStack gap={16} wrap="wrap">
            {icons.map(name => (
              <VStack key={name} gap={4} align="center" className="w-24 p-2 border rounded-lg">
                <Icon icon={name} size={24} />
                <Text variant="caption" className="truncate w-full text-center">{name}</Text>
              </VStack>
            ))}
          </HStack>
        </Section>

        {/* Typography */}
        <Section title="Typography & Headings">
          <VStack gap={16}>
            <Heading level={2}>H2 Heading (Section Title)</Heading>
            <Heading level={3}>H3 Heading (Sub-section)</Heading>
            <Text>
              Đây là nội dung văn bản mặc định (Body Text) sử dụng phông chữ Inter đã được cấu hình trong P4.
            </Text>
            <Text variant="secondary">Văn bản phụ (Secondary Text) cho các ghi chú hoặc mô tả.</Text>
            <Text variant="caption">Caption text (12px) cho các nhãn nhỏ hoặc metadata.</Text>
          </VStack>
        </Section>

        {/* Buttons & Indicators */}
        <Section title="Buttons & Status">
          <HStack gap={16} wrap="wrap" align="center">
            <Button label="Primary Button" variant="primary" />
            <Button label="Secondary" variant="secondary" />
            <Button label="Danger" variant="danger" />
            <IconButton icon="search" aria-label="Tìm kiếm" />
            <Badge label="Active" variant="success" />
            <Badge label="Critical" variant="danger" />
            <HStack gap={8} align="center">
              <StatusDot variant="success" />
              <Text>Hệ thống ổn định</Text>
            </HStack>
            <Button label="Loading..." loading />
            <Button label="Disabled" disabled />
          </HStack>
        </Section>

        {/* Navigation & Tabs */}
        <Section title="Navigation & Tabs">
          <VStack gap={16}>
            <Breadcrumbs>
              <BreadcrumbItem label="Trang chủ" href="/" />
              <BreadcrumbItem label="Quản trị" href="/admin" />
              <BreadcrumbItem label="UI Kit" active />
            </Breadcrumbs>
            
            <TabList activeItem={activeTab} onItemChange={setActiveTab}>
              <Tab id="overview" label="Tổng quan" />
              <Tab id="components" label="Thành phần" />
              <Tab id="docs" label="Tài liệu" />
            </TabList>
          </VStack>
        </Section>

        {/* Inputs */}
        <Section title="Forms & Inputs">
          <VStack gap={16} className="max-w-md">
            <TextInput label="Tên thiết bị" placeholder="Nhập mã hoặc tên..." />
            <TextInput label="Mô tả" placeholder="Thông tin chi tiết..." prefixIcon="info" />
            <DropdownMenu trigger={<Button label="Chọn thao tác" icon="chevronDown" />}>
              <DropdownMenuItem label="Chỉnh sửa" icon="edit" />
              <DropdownMenuItem label="Sao chép" icon="copy" />
              <DropdownMenuItem label="Xoá" variant="danger" icon="delete" />
            </DropdownMenu>
          </VStack>
        </Section>

        {/* Data Display */}
        <Section title="Data & Feedback">
          <VStack gap={16}>
            <Card className="p-0 overflow-hidden">
              <Table 
                columns={demoColumns} 
                data={demoData} 
              />
            </Card>

            <Pagination 
              currentPage={page} 
              totalPages={10} 
              onPageChange={setPage} 
            />

            <EmptyState 
              title="Không tìm thấy dữ liệu" 
              description="Vui lòng thử lại với bộ lọc khác hoặc tạo mới tài sản."
              icon="search"
            />
            
            <VStack gap={8}>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </VStack>
            
            <HStack gap={12} align="center">
              <Avatar name="Vũ Hồng Sơn" src="https://i.pravatar.cc/150?u=son" />
              <VStack gap={0}>
                <Text weight="bold">Vũ Hồng Sơn</Text>
                <Text variant="caption">Quản trị viên</Text>
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
    <VStack gap={16} className="w-full">
      <Heading level={3} className="text-accent border-b pb-2">{title}</Heading>
      {children}
    </VStack>
  );
}
