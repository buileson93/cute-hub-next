import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Badge } from "@astryxdesign/core/Badge";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Card } from "@astryxdesign/core/Card";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Table, pixel, proportional } from "@astryxdesign/core/Table";
import { Breadcrumbs, BreadcrumbItem } from "@astryxdesign/core/Breadcrumbs";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { useToast } from "@astryxdesign/core/Toast";
import { Text } from "@astryxdesign/core/Text";
import { Layout, LayoutHeader, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { Stack } from "@astryxdesign/core/Stack";
import { Divider } from "@astryxdesign/core/Divider";
import { Section } from "@astryxdesign/core/Section";
import { 
  Search, 
  Plus, 
  Trash2, 
  Mail, 
  Settings, 
  Bell, 
  Home, 
  ChevronRight,
  Info,
  AlertTriangle,
  CheckCircle2,
  MoreVertical
} from "lucide-react";

export const Route = createFileRoute("/admin/ui-kit")({
  component: AdminUiKit,
});

function AdminUiKit() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("buttons");
  const [textValue, setTextValue] = useState("");
  const [selectorValue, setSelectorValue] = useState("option-1");

  const tableData = [
    { id: "1", name: "Hệ thống VHF", status: "success", type: "Vô tuyến" },
    { id: "2", name: "Radar S-Band", status: "warning", type: "Giám sát" },
    { id: "3", name: "Cáp quang trục", status: "error", type: "Truyền dẫn" },
  ];

  const tableColumns = [
    { key: "id", header: "ID", width: pixel(60) },
    { key: "name", header: "Tên hệ thống", width: proportional(1) },
    { 
      key: "status", 
      header: "Trạng thái", 
      width: pixel(120),
      renderCell: (val: string) => (
        <Stack direction="row" align="center" gap={2}>
          <StatusDot variant={val as any} label={val} />
          <Text>{val === "success" ? "Hoạt động" : val === "warning" ? "Cảnh báo" : "Sự cố"}</Text>
        </Stack>
      )
    },
    { key: "type", header: "Loại", width: pixel(120) },
  ];

  return (
    <Layout>
      <LayoutHeader>
        <Stack direction="row" align="center" justify="between" padding={4}>
          <Stack direction="column" gap={1}>
            <Breadcrumbs>
              <BreadcrumbItem startIcon={<Home size={14} />}>Admin</BreadcrumbItem>
              <BreadcrumbItem isCurrent>UI Kit (Astryx Pilot)</BreadcrumbItem>
            </Breadcrumbs>
            <Text variant="heading-lg" weight="bold">
              Hệ thống thiết kế Astryx - Pilot
            </Text>
          </Stack>
          <Button 
            label="Gửi thông báo" 
            variant="primary" 
            icon={<Bell size={16} />}
            onClick={() => toast({ body: "Thông báo đã được gửi thành công!" })}
          />
        </Stack>
        <Divider />
        <TabList value={activeTab} onChange={setActiveTab} size="md" hasDivider>
          <Tab value="buttons">Buttons & Indicators</Tab>
          <Tab value="inputs">Inputs & Selection</Tab>
          <Tab value="data">Data & Layout</Tab>
          <Tab value="feedback">Feedback & Overlays</Tab>
        </TabList>
      </LayoutHeader>

      <LayoutContent padding={6}>
        <Stack direction="column" gap={8}>
          
          {/* SECTIONS BASED ON TABS */}
          {activeTab === "buttons" && (
            <Section title="Buttons & Status Indicators">
              <Stack direction="column" gap={6}>
                <Card padding={6}>
                  <Stack direction="column" gap={4}>
                    <Text variant="heading-md">Buttons (Legacy: components/ui/button.tsx)</Text>
                    <Stack direction="row" gap={3} wrap>
                      <Button label="Primary" variant="primary" />
                      <Button label="Secondary" variant="secondary" />
                      <Button label="Ghost" variant="ghost" />
                      <Button label="Destructive" variant="destructive" icon={<Trash2 size={16} />} />
                      <Button label="Loading" variant="primary" isLoading />
                      <Button label="Disabled" variant="primary" isDisabled />
                    </Stack>
                  </Stack>
                </Card>

                <Card padding={6}>
                  <Stack direction="column" gap={4}>
                    <Text variant="heading-md">Icon Buttons (Legacy: icon-only buttons)</Text>
                    <Stack direction="row" gap={3}>
                      <IconButton label="Cài đặt" icon={<Settings size={18} />} variant="secondary" tooltip="Cài đặt hệ thống" />
                      <IconButton label="Thông báo" icon={<Bell size={18} />} variant="ghost" />
                      <IconButton label="Xóa" icon={<Trash2 size={18} />} variant="destructive" />
                    </Stack>
                  </Stack>
                </Card>

                <Card padding={6}>
                  <Stack direction="column" gap={4}>
                    <Text variant="heading-md">Badges & Status (Legacy: components/ui/badge.tsx)</Text>
                    <Stack direction="row" gap={3} align="center" wrap>
                      <Badge variant="success" label="Hoạt động" icon={<CheckCircle2 size={12} />} />
                      <Badge variant="warning" label="Bảo trì" icon={<AlertTriangle size={12} />} />
                      <Badge variant="error" label="Sự cố" icon={<Info size={12} />} />
                      <Badge variant="blue" label="VATM" />
                      <Divider orientation="vertical" height={20} />
                      <StatusDot variant="success" label="Online" isPulsing />
                      <StatusDot variant="error" label="Offline" />
                      <StatusDot variant="warning" label="Degraded" />
                    </Stack>
                  </Stack>
                </Card>
              </Stack>
            </Section>
          )}

          {activeTab === "inputs" && (
            <Section title="Inputs & Selection">
              <Stack direction="column" gap={6}>
                <Card padding={6}>
                  <Stack direction="column" gap={6} maxW={400}>
                    <Text variant="heading-md">Text Input (Legacy: components/ui/input.tsx)</Text>
                    <TextInput 
                      label="Tên thiết bị" 
                      value={textValue} 
                      onChange={setTextValue} 
                      placeholder="Nhập tên thiết bị..."
                      description="Tên định danh duy nhất trong hệ thống."
                      isRequired
                    />
                    <TextInput 
                      label="Tìm kiếm" 
                      value="" 
                      onChange={() => {}} 
                      startIcon={<Search size={16} />}
                      hasClear
                    />
                    <TextInput 
                      label="Mật khẩu" 
                      type="password"
                      value="password" 
                      onChange={() => {}}
                      status={{ type: "error", message: "Mật khẩu quá ngắn" }}
                    />
                  </Stack>
                </Card>

                <Card padding={6}>
                  <Stack direction="column" gap={6} maxW={400}>
                    <Text variant="heading-md">Selector (Legacy: components/ui/select.tsx)</Text>
                    <Selector 
                      label="Loại hệ thống"
                      value={selectorValue}
                      onChange={setSelectorValue}
                      options={[
                        { label: "Vô tuyến", value: "option-1" },
                        { label: "Giám sát", value: "option-2" },
                        { label: "Truyền dẫn", value: "option-3" },
                        { type: "divider" },
                        { label: "Khác", value: "other" }
                      ]}
                      hasSearch
                    />
                  </Stack>
                </Card>
              </Stack>
            </Section>
          )}

          {activeTab === "data" && (
            <Section title="Data & Layout">
              <Stack direction="column" gap={6}>
                <Card padding={0}>
                  <Stack direction="column" gap={0}>
                    <Stack padding={4}>
                      <Text variant="heading-md">Table (Legacy: components/mirats/StandardTable.tsx)</Text>
                    </Stack>
                    <Table 
                      data={tableData} 
                      columns={tableColumns} 
                      density="compact" 
                      hasHover 
                      isStriped
                    />
                  </Stack>
                </Card>

                <Card padding={6}>
                  <Stack direction="column" gap={4}>
                    <Text variant="heading-md">Skeletons (Legacy: components/ui/skeleton.tsx)</Text>
                    <Stack direction="column" gap={2}>
                      <Skeleton width="60%" height={24} />
                      <Skeleton width="100%" height={16} />
                      <Skeleton width="100%" height={16} />
                      <Skeleton width="40%" height={16} />
                    </Stack>
                  </Stack>
                </Card>
              </Stack>
            </Section>
          )}

          {activeTab === "feedback" && (
            <Section title="Feedback & Overlays">
              <Stack direction="column" gap={6}>
                <Card padding={6}>
                  <Stack direction="column" gap={4} align="start">
                    <Text variant="heading-md">Dialog & Modals (Legacy: components/ui/dialog.tsx)</Text>
                    <Button label="Mở Dialog Kiểm chứng" onClick={() => setIsDialogOpen(true)} />
                    
                    <Dialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} width={500}>
                      <DialogHeader title="Xác nhận cấu hình" subtitle="Vui lòng kiểm tra lại các thông số trước khi áp dụng." onOpenChange={() => setIsDialogOpen(false)} />
                      <Stack direction="column" gap={4} padding={4}>
                        <Text>Bạn đang thực hiện thay đổi cấu hình cho hệ thống VHF. Hành động này sẽ được ghi nhật ký.</Text>
                        <TextInput label="Lý do thay đổi" value="" onChange={() => {}} isRequired />
                      </Stack>
                      <LayoutFooter padding={4}>
                        <Stack direction="row" justify="end" gap={2}>
                          <Button label="Hủy" variant="ghost" onClick={() => setIsDialogOpen(false)} />
                          <Button label="Áp dụng" variant="primary" onClick={() => {
                            setIsDialogOpen(false);
                            toast({ body: "Cấu hình đã được áp dụng." });
                          }} />
                        </Stack>
                      </LayoutFooter>
                    </Dialog>
                  </Stack>
                </Card>

                <Card padding={6}>
                  <Stack direction="column" gap={4}>
                    <Text variant="heading-md">Empty State (Legacy: components/mirats/EmptyState.tsx)</Text>
                    <EmptyState 
                      title="Chưa có dữ liệu bảo trì" 
                      description="Bắt đầu bằng cách tạo kế hoạch bảo trì đầu tiên cho thiết bị này." 
                      icon={<Plus size={48} />}
                      actions={<Button label="Tạo kế hoạch" variant="primary" />}
                      isCompact
                    />
                  </Stack>
                </Card>
              </Stack>
            </Section>
          )}

        </Stack>
      </LayoutContent>
    </Layout>
  );
}
