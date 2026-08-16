import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Button, 
  IconButton, 
  Badge, 
  StatusDot, 
  TextInput, 
  Selector, 
  Field, 
  Table, 
  Dialog, 
  Toast, 
  Skeleton, 
  EmptyState, 
  TabList, 
  Breadcrumbs,
  Stack,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  Divider,
  Switch
} from "@astryxdesign/core";
import { cn } from "@/lib/utils";
import { useDensity } from "@/components/mirats/DensityToggle";

export const Route = createFileRoute("/_app/admin/ui-kit")({
  component: UIKitPage,
});

function UIKitPage() {
  const [density, setDensity] = useDensity();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const tableData = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    name: `Tài sản kỹ thuật ${i + 1}`,
    code: `TB-${1000 + i}`,
    value: (Math.random() * 1000000).toFixed(0),
    status: i % 3 === 0 ? "active" : i % 3 === 1 ? "warning" : "error"
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-32">
      <HStack justify="between" align="center" className="sticky top-0 bg-background/80 backdrop-blur z-10 py-4 border-b">
        <VStack gap={1}>
          <Heading level={1}>Astryx UI Kit — VATM Foundation</Heading>
          <Text variant="secondary">Trình bày các thành phần nền tảng của design system mới.</Text>
        </VStack>
        
        <HStack gap={4}>
          <HStack gap={2} align="center">
            <Text size="sm">Mật độ:</Text>
            <Selector 
              value={density} 
              onValueChange={(v: any) => setDensity(v)}
              options={[
                { label: "Gọn", value: "compact" },
                { label: "Vừa", value: "comfortable" },
                { label: "Thoáng", value: "spacious" }
              ]}
            />
          </HStack>
          
          <HStack gap={2} align="center">
            <Text size="sm">Chế độ tối:</Text>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </HStack>
        </HStack>
      </HStack>

      {/* Buttons & Icons */}
      <section className="space-y-6">
        <Heading level={2}>Buttons & Icons</Heading>
        <Card className="p-6">
          <VStack gap={6}>
            <HStack gap={4} wrap>
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
            </HStack>
            
            <HStack gap={4} wrap>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </HStack>

            <HStack gap={4}>
              <IconButton icon="action.add" aria-label="Add" />
              <IconButton icon="action.edit" aria-label="Edit" variant="secondary" />
              <IconButton icon="action.delete" aria-label="Delete" variant="danger" />
            </HStack>
          </VStack>
        </Card>
      </section>

      {/* Data Display */}
      <section className="space-y-6">
        <Heading level={2}>Data Display</Heading>
        <Card className="p-6">
          <VStack gap={6}>
            <HStack gap={4}>
              <Badge color="blue">Blue Badge</Badge>
              <Badge color="green">Green Badge</Badge>
              <Badge color="orange">Orange Badge</Badge>
              <Badge color="red">Red Badge</Badge>
              <Badge color="gray">Gray Badge</Badge>
            </HStack>
            
            <HStack gap={6}>
              <HStack gap={2} align="center"><StatusDot color="blue" /> <Text size="sm">San sàng</Text></HStack>
              <HStack gap={2} align="center"><StatusDot color="green" /> <Text size="sm">Hoạt động</Text></HStack>
              <HStack gap={2} align="center"><StatusDot color="orange" /> <Text size="sm">Cảnh báo</Text></HStack>
              <HStack gap={2} align="center"><StatusDot color="red" /> <Text size="sm">Lỗi</Text></HStack>
              <HStack gap={2} align="center"><StatusDot color="gray" /> <Text size="sm">Ngắt kết nối</Text></HStack>
            </HStack>
          </VStack>
        </Card>
      </section>

      {/* Forms */}
      <section className="space-y-6">
        <Heading level={2}>Forms</Heading>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Field label="Tên tài sản" help="Nhập tên chính thức của thiết bị.">
              <TextInput placeholder="VD: VHF Radio..." />
            </Field>
            
            <Field label="Trạng thái khai thác">
              <Selector 
                placeholder="Chọn trạng thái..."
                options={[
                  { label: "Đang sử dụng", value: "active" },
                  { label: "Dự phòng", value: "standby" },
                  { label: "Bảo trì", value: "maintenance" }
                ]}
              />
            </Field>
          </div>
        </Card>
      </section>

      {/* Table */}
      <section className="space-y-6">
        <Heading level={2}>Table (Numeric Mono)</Heading>
        <Card className="p-0 overflow-hidden">
          <Table 
            data={tableData}
            columns={[
              { header: "#", accessorKey: "id", width: 60 },
              { header: "Tên tài sản", accessorKey: "name" },
              { header: "Mã thiết bị", accessorKey: "code" },
              { 
                header: "Giá trị (VNĐ)", 
                accessorKey: "value",
                cell: (v: string) => <span className="font-mono tabular-nums">{Number(v).toLocaleString()}</span>
              },
              { 
                header: "Trạng thái", 
                accessorKey: "status",
                cell: (s: string) => (
                  <HStack gap={2} align="center">
                    <StatusDot color={s === "active" ? "green" : s === "warning" ? "orange" : "red"} />
                    <Text size="sm">{s.toUpperCase()}</Text>
                  </HStack>
                )
              }
            ]}
          />
        </Card>
      </section>

      {/* Feedback & Overlays */}
      <section className="space-y-6">
        <Heading level={2}>Feedback & Overlays</Heading>
        <Card className="p-6">
          <HStack gap={4} wrap>
            <Dialog 
              trigger={<Button variant="outline">Mở Dialog</Button>}
              title="Xác nhận thao tác"
              description="Bạn có chắc chắn muốn thực hiện hành động này không? Dữ liệu sẽ không thể khôi phục."
            >
              <HStack justify="end" gap={2}>
                <Button variant="ghost">Hủy</Button>
                <Button variant="danger">Xác nhận</Button>
              </HStack>
            </Dialog>
            
            <Toast 
              trigger={<Button variant="outline">Hiện Toast</Button>}
              title="Thành công"
              description="Dữ liệu đã được lưu trữ an toàn."
            />
            
            <Button variant="outline" onClick={() => {}}>
              <HStack gap={2} align="center">
                <Skeleton width={20} height={20} circle />
                <span>Skeleton Example</span>
              </HStack>
            </Button>
          </HStack>
        </Card>
      </section>

      {/* Navigation */}
      <section className="space-y-6">
        <Heading level={2}>Navigation</Heading>
        <Card className="p-6 space-y-8">
          <VStack gap={4}>
            <Text size="sm" variant="secondary">Breadcrumbs:</Text>
            <Breadcrumbs 
              items={[
                { label: "Trang chủ", href: "/" },
                { label: "Admin", href: "/admin" },
                { label: "UI Kit" }
              ]}
            />
          </VStack>
          
          <Divider />
          
          <VStack gap={4}>
            <Text size="sm" variant="secondary">Tab List:</Text>
            <TabList 
              items={[
                { label: "Tổng quan", value: "overview" },
                { label: "Cấu hình", value: "config" },
                { label: "Lịch sử", value: "history" }
              ]}
              defaultValue="overview"
            />
          </VStack>
        </Card>
      </section>

      {/* Empty State */}
      <section className="space-y-6">
        <Heading level={2}>Empty State</Heading>
        <Card className="p-12">
          <EmptyState 
            title="Chưa có dữ liệu"
            description="Hãy bắt đầu bằng cách thêm mới một bản ghi."
            action={<Button variant="primary">Thêm mới</Button>}
          />
        </Card>
      </section>
    </div>
  );
}
