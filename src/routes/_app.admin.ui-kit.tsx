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
  TabList, 
  Tab,
  Breadcrumbs,
  BreadcrumbItem,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  Divider,
  Switch,
  EmptyState
} from "@astryxdesign/core";
import { useDensity } from "@/components/mirats/DensityToggle";

export const Route = createFileRoute("/_app/admin/ui-kit")({
  component: UIKitPage,
});

interface DemoData extends Record<string, unknown> {
  id: number;
  name: string;
  code: string;
  value: string;
  status: string;
}

function UIKitPage() {
  const [density, setDensity] = useDensity();
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [tabValue, setTabValue] = useState("overview");
  const [textValue, setTextValue] = useState("");
  const [selectorValue, setSelectorValue] = useState("");
  const [switchValue, setSwitchValue] = useState(false);

  const toggleTheme = (checked: boolean) => {
    setIsDark(checked);
    setSwitchValue(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const tableData: DemoData[] = Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    name: `Tài sản kỹ thuật ${i + 1}`,
    code: `TB-${1000 + i}`,
    value: (Math.random() * 1000000).toFixed(0),
    status: i % 3 === 0 ? "success" : i % 3 === 1 ? "warning" : "error"
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-32">
      <HStack justify="between" align="center" className="sticky top-0 bg-background/80 backdrop-blur z-10 py-4 border-b">
        <VStack gap={1}>
          <Heading level={1}>Astryx UI Kit — VATM Foundation</Heading>
          <Text color="secondary">Trình bày các thành phần nền tảng của design system mới.</Text>
        </VStack>
        
        <HStack gap={4}>
          <HStack gap={2} align="center">
            <Text size="sm">Mật độ:</Text>
            <Selector 
              label="Mật độ"
              isLabelHidden
              value={density} 
              onChange={(v) => setDensity(v as any)}
              options={[
                { label: "Gọn", value: "compact" },
                { label: "Vừa", value: "comfortable" },
                { label: "Thoáng", value: "spacious" }
              ]}
            />
          </HStack>
          
          <HStack gap={2} align="center">
            <Text size="sm">Chế độ tối:</Text>
            <Switch 
              label="Chế độ tối"
              isLabelHidden
              value={isDark} 
              onChange={toggleTheme} 
            />
          </HStack>
        </HStack>
      </HStack>

      {/* Buttons & Icons */}
      <section className="space-y-6">
        <Heading level={2}>Buttons & Icons</Heading>
        <Card className="p-6">
          <VStack gap={6}>
            <HStack gap={4} wrap="wrap">
              <Button label="Primary Button" variant="primary" />
              <Button label="Secondary Button" variant="secondary" />
              <Button label="Ghost Button" variant="ghost" />
              <Button label="Destructive Button" variant="destructive" />
            </HStack>
            
            <HStack gap={4} wrap="wrap">
              <Button label="Small" size="sm" />
              <Button label="Medium" size="md" />
              <Button label="Large" size="lg" />
            </HStack>

            <HStack gap={4}>
              <IconButton label="Add" icon="action.add" />
              <IconButton label="Edit" icon="action.edit" variant="secondary" />
              <IconButton label="Delete" icon="action.delete" variant="destructive" />
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
              <Badge label="Blue Badge" variant="blue" />
              <Badge label="Green Badge" variant="green" />
              <Badge label="Orange Badge" variant="orange" />
              <Badge label="Red Badge" variant="red" />
              <Badge label="Neutral Badge" variant="neutral" />
            </HStack>
            
            <HStack gap={6}>
              <HStack gap={2} align="center"><StatusDot variant="accent" label="Sẵn sàng" /> <Text size="sm">Sẵn sàng</Text></HStack>
              <HStack gap={2} align="center"><StatusDot variant="success" label="Hoạt động" /> <Text size="sm">Hoạt động</Text></HStack>
              <HStack gap={2} align="center"><StatusDot variant="warning" label="Cảnh báo" /> <Text size="sm">Cảnh báo</Text></HStack>
              <HStack gap={2} align="center"><StatusDot variant="error" label="Lỗi" /> <Text size="sm">Lỗi</Text></HStack>
              <HStack gap={2} align="center"><StatusDot variant="neutral" label="Ngắt kết nối" /> <Text size="sm">Ngắt kết nối</Text></HStack>
            </HStack>
          </VStack>
        </Card>
      </section>

      {/* Forms */}
      <section className="space-y-6">
        <Heading level={2}>Forms</Heading>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Field label="Tên tài sản" inputID="asset-name">
              <TextInput 
                label="Tên tài sản"
                isLabelHidden
                placeholder="VD: VHF Radio..." 
                value={textValue}
                onChange={setTextValue}
              />
            </Field>
            
            <Field label="Trạng thái khai thác" inputID="asset-status">
              <Selector 
                label="Trạng thái khai thác"
                isLabelHidden
                placeholder="Chọn trạng thái..."
                value={selectorValue}
                onChange={setSelectorValue}
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
              { key: "id", header: "#" },
              { key: "name", header: "Tên tài sản" },
              { key: "code", header: "Mã thiết bị" },
              { 
                key: "value",
                header: "Giá trị (VNĐ)", 
                renderCell: (row) => <span className="font-mono tabular-nums">{Number(row.value).toLocaleString()}</span>
              },
              { 
                key: "status",
                header: "Trạng thái", 
                renderCell: (row) => (
                  <HStack gap={2} align="center">
                    <StatusDot variant={row.status as any} label={row.status as string} />
                    <Text size="sm">{(row.status as string).toUpperCase()}</Text>
                  </HStack>
                )
              }
            ]}
          />
        </Card>
      </section>

      {/* Navigation */}
      <section className="space-y-6">
        <Heading level={2}>Navigation</Heading>
        <Card className="p-6 space-y-8">
          <VStack gap={4}>
            <Text size="sm" color="secondary">Breadcrumbs:</Text>
            <Breadcrumbs label="Breadcrumb">
              <BreadcrumbItem href="/">Trang chủ</BreadcrumbItem>
              <BreadcrumbItem href="/admin">Admin</BreadcrumbItem>
              <BreadcrumbItem isCurrent>UI Kit</BreadcrumbItem>
            </Breadcrumbs>
          </VStack>
          
          <Divider />
          
          <VStack gap={4}>
            <Text size="sm" color="secondary">Tab List:</Text>
            <TabList value={tabValue} onChange={setTabValue}>
              <Tab value="overview" label="Tổng quan" />
              <Tab value="config" label="Cấu hình" />
              <Tab value="history" label="Lịch sử" />
            </TabList>
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
            actions={<Button label="Thêm mới" variant="primary" />}
          />
        </Card>
      </section>
    </div>
  );
}
