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
import { Text, Heading } from "@astryxdesign/core/Text";
import { Layout, LayoutHeader, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { Stack, HStack, VStack } from "@astryxdesign/core/Stack";
import { Divider } from "@astryxdesign/core/Divider";
import { Section } from "@astryxdesign/core/Section";
import { 
  Search, 
  Plus, 
  Trash2, 
  Settings, 
  Bell, 
  Home, 
  CheckCircle2,
  AlertTriangle,
  Info
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
      renderCell: (item: any) => (
        <HStack align="center" gap={2}>
          <StatusDot variant={item.status as any} label={item.status} />
          <Text>{item.status === "success" ? "Hoạt động" : item.status === "warning" ? "Cảnh báo" : "Sự cố"}</Text>
        </HStack>
      )
    },
    { key: "type", header: "Loại", width: pixel(120) },
  ];

  return (
    <Layout>
      <LayoutHeader>
        <HStack align="center" justify="between" padding={4}>
          <VStack gap={1}>
            <Breadcrumbs>
              <BreadcrumbItem startIcon={<Home size={14} />}>Admin</BreadcrumbItem>
              <BreadcrumbItem isCurrent>UI Kit (Astryx Pilot)</BreadcrumbItem>
            </Breadcrumbs>
            <Heading level={2}>
              Hệ thống thiết kế Astryx - Pilot
            </Heading>
          </VStack>
          <Button 
            label="Gửi thông báo" 
            variant="primary" 
            icon={<Bell size={16} />}
            onClick={() => toast({ body: "Thông báo đã được gửi thành công!" })}
          />
        </HStack>
        <Divider />
        <TabList value={activeTab} onChange={setActiveTab} size="md" hasDivider>
          <Tab value="buttons" label="Buttons & Indicators" />
          <Tab value="inputs" label="Inputs & Selection" />
          <Tab value="data" label="Data & Layout" />
          <Tab value="feedback" label="Feedback & Overlays" />
        </TabList>
      </LayoutHeader>

      <LayoutContent padding={6}>
        <VStack gap={8}>
          
          {/* SECTIONS BASED ON TABS */}
          {activeTab === "buttons" && (
            <Section>
              <VStack gap={6}>
                <Card padding={6}>
                  <VStack gap={4}>
                    <Heading level={3}>Buttons (Legacy: components/ui/button.tsx)</Heading>
                    <HStack gap={3} wrap="wrap">
                      <Button label="Primary" variant="primary" />
                      <Button label="Secondary" variant="secondary" />
                      <Button label="Ghost" variant="ghost" />
                      <Button label="Destructive" variant="destructive" icon={<Trash2 size={16} />} />
                      <Button label="Loading" variant="primary" isLoading />
                      <Button label="Disabled" variant="primary" isDisabled />
                    </HStack>
                  </VStack>
                </Card>

                <Card padding={6}>
                  <VStack gap={4}>
                    <Heading level={3}>Icon Buttons (Legacy: icon-only buttons)</Heading>
                    <HStack gap={3}>
                      <IconButton label="Cài đặt" icon={<Settings size={18} />} variant="secondary" tooltip="Cài đặt hệ thống" />
                      <IconButton label="Thông báo" icon={<Bell size={18} />} variant="ghost" />
                      <IconButton label="Xóa" icon={<Trash2 size={18} />} variant="destructive" />
                    </HStack>
                  </VStack>
                </Card>

                <Card padding={6}>
                  <VStack gap={4}>
                    <Heading level={3}>Badges & Status (Legacy: components/ui/badge.tsx)</Heading>
                    <HStack gap={3} align="center" wrap="wrap">
                      <Badge variant="success" label="Hoạt động" icon={<CheckCircle2 size={12} />} />
                      <Badge variant="warning" label="Bảo trì" icon={<AlertTriangle size={12} />} />
                      <Badge variant="error" label="Sự cố" icon={<Info size={12} />} />
                      <Badge variant="blue" label="VATM" />
                      <Divider orientation="vertical" />
                      <StatusDot variant="success" label="Online" isPulsing />
                      <StatusDot variant="error" label="Offline" />
                      <StatusDot variant="warning" label="Degraded" />
                    </HStack>
                  </VStack>
                </Card>
              </VStack>
            </Section>
          )}

          {activeTab === "inputs" && (
            <Section>
              <VStack gap={6}>
                <Card padding={6}>
                  <VStack gap={6} maxWidth={400}>
                    <Heading level={3}>Text Input (Legacy: components/ui/input.tsx)</Heading>
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
                  </VStack>
                </Card>

                <Card padding={6}>
                  <VStack gap={6} maxWidth={400}>
                    <Heading level={3}>Selector (Legacy: components/ui/select.tsx)</Heading>
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
                  </VStack>
                </Card>
              </VStack>
            </Section>
          )}

          {activeTab === "data" && (
            <Section>
              <VStack gap={6}>
                <Card padding={0}>
                  <VStack gap={0}>
                    <Stack padding={4}>
                      <Heading level={3}>Table (Legacy: components/mirats/StandardTable.tsx)</Heading>
                    </Stack>
                    <Table 
                      data={tableData} 
                      columns={tableColumns} 
                      density="compact" 
                      hasHover 
                      isStriped
                    />
                  </VStack>
                </Card>

                <Card padding={6}>
                  <VStack gap={4}>
                    <Heading level={3}>Skeletons (Legacy: components/ui/skeleton.tsx)</Heading>
                    <VStack gap={2}>
                      <Skeleton width="60%" height={24} />
                      <Skeleton width="100%" height={16} />
                      <Skeleton width="100%" height={16} />
                      <Skeleton width="40%" height={16} />
                    </VStack>
                  </VStack>
                </Card>
              </VStack>
            </Section>
          )}

          {activeTab === "feedback" && (
            <Section>
              <VStack gap={6}>
                <Card padding={6}>
                  <VStack gap={4} align="start">
                    <Heading level={3}>Dialog & Modals (Legacy: components/ui/dialog.tsx)</Heading>
                    <Button label="Mở Dialog Kiểm chứng" onClick={() => setIsDialogOpen(true)} />
                    
                    <Dialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} width={500}>
                      <DialogHeader title="Xác nhận cấu hình" subtitle="Vui lòng kiểm tra lại các thông số trước khi áp dụng." onOpenChange={() => setIsDialogOpen(false)} />
                      <VStack gap={4} padding={4}>
                        <Text>Bạn đang thực hiện thay đổi cấu hình cho hệ thống VHF. Hành động này sẽ được ghi nhật ký.</Text>
                        <TextInput label="Lý do thay đổi" value="" onChange={() => {}} isRequired />
                      </VStack>
                      <LayoutFooter padding={4}>
                        <HStack justify="end" gap={2}>
                          <Button label="Hủy" variant="ghost" onClick={() => setIsDialogOpen(false)} />
                          <Button label="Áp dụng" variant="primary" onClick={() => {
                            setIsDialogOpen(false);
                            toast({ body: "Cấu hình đã được áp dụng." });
                          }} />
                        </HStack>
                      </LayoutFooter>
                      </Dialog>
                    </VStack>
                  </Card>

                <Card padding={6}>
                  <VStack gap={4}>
                    <Heading level={3}>Empty State (Legacy: components/mirats/EmptyState.tsx)</Heading>
                    <EmptyState 
                      title="Chưa có dữ liệu bảo trì" 
                      description="Bắt đầu bằng cách tạo kế hoạch bảo trì đầu tiên cho thiết bị này." 
                      icon={<Plus size={48} />}
                      actions={<Button label="Tạo kế hoạch" variant="primary" />}
                      isCompact
                    />
                  </VStack>
                </Card>
              </VStack>
            </Section>
          )}

        </VStack>
      </LayoutContent>
    </Layout>
  );
}

