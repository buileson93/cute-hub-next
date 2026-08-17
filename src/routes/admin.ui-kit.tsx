import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { ContentGrid } from "@/components/mirats/layout/PageLayouts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/mirats/ui/StatusDot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Plus, 
  Activity,
  Package,
  AlertTriangle,
  CheckCircle2,
  Info
} from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  return (
    <ClientOnly>
      <PageFrame density="compact">
        <PageHeader
          title="Core Visual Families"
          subtitle="MIRATS Phase U4: Standards for Typography, Actions & Status"
          breadcrumbs={[
            { label: "MIRATS", to: "/" },
            { label: "Admin", to: "/admin" },
            { label: "UI Kit" }
          ]}
          icon={Settings}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Cancel
              </Button>
              <Button size="sm">
                <Plus className="mr-1" /> New Component
              </Button>
            </div>
          }
        />

        <Tabs defaultValue="typography" className="flex-1 flex flex-col">
          <div className="bg-background border-b px-2 pt-1">
            <TabsList className="bg-transparent h-8 p-0 gap-4">
              <TabsTrigger value="typography" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0074e2] data-[state=active]:bg-transparent h-8 text-[11px] uppercase font-bold tracking-wider">
                Typography
              </TabsTrigger>
              <TabsTrigger value="actions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0074e2] data-[state=active]:bg-transparent h-8 text-[11px] uppercase font-bold tracking-wider">
                Actions
              </TabsTrigger>
              <TabsTrigger value="cards" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0074e2] data-[state=active]:bg-transparent h-8 text-[11px] uppercase font-bold tracking-wider">
                Cards
              </TabsTrigger>
              <TabsTrigger value="status" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0074e2] data-[state=active]:bg-transparent h-8 text-[11px] uppercase font-bold tracking-wider">
                Status & Feedback
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="typography" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection className="max-w-4xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography System</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className={UI_DENSITY.TEXT_LABEL}>Body Text (12px+)</div>
                      <p className={UI_DENSITY.TEXT_BODY}>
                        Hệ thống MIRATS 2.0 sử dụng Figtree làm font chữ chính cho phần nội dung. 
                        Mọi văn bản phần thân trang phải đạt kích thước tối thiểu 12px để đảm bảo khả năng đọc.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className={UI_DENSITY.TEXT_LABEL}>Tabular Numbers (Plex Mono)</div>
                      <div className="flex gap-8 items-end">
                        <div className="flex flex-col gap-1">
                          <div className={cn(UI_DENSITY.TEXT_MONO, "text-3xl font-bold text-[#0074e2]")}>99.85%</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Availability</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className={cn(UI_DENSITY.TEXT_MONO, "text-2xl font-semibold")}>1,486</div>
                          <div className="text-[10px] text-muted-foreground uppercase">Total Assets</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className={UI_DENSITY.TEXT_LABEL}>Status Labels</div>
                      <div className="flex flex-wrap gap-4">
                        <span className="text-green-600 font-bold uppercase tracking-widest text-[10px]">Hoạt động</span>
                        <span className="text-red-600 font-bold uppercase tracking-widest text-[10px]">Hỏng hóc</span>
                        <span className="text-yellow-600 font-bold uppercase tracking-widest text-[10px]">Bảo trì</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </PageSection>
            </PageBody>
          </TabsContent>

          <TabsContent value="actions" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Button Families</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className={UI_DENSITY.TEXT_LABEL}>Primary & Secondary</div>
                        <div className="flex gap-3 items-center">
                          <Button>Primary Action</Button>
                          <Button variant="outline">Secondary</Button>
                          <Button variant="ghost">Ghost</Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className={UI_DENSITY.TEXT_LABEL}>Loading State (Stable Width)</div>
                        <div className="flex gap-3 items-center">
                          <Button loading>Save Changes</Button>
                          <Button variant="outline" loading>Refreshing</Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className={UI_DENSITY.TEXT_LABEL}>Icon Action (Tooltips)</div>
                        <div className="flex gap-3 items-center">
                          <Button size="icon" variant="ghost" tooltip="Add New Asset"><Plus /></Button>
                          <Button size="icon" variant="ghost" tooltip="View Settings"><Settings /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </PageSection>
            </PageBody>
          </TabsContent>

          <TabsContent value="cards" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection>
                <ContentGrid>
                  <Card>
                    <CardHeader>
                      <CardTitle>Passive Card</CardTitle>
                    </CardHeader>
                    <CardContent>No hover effect. Used for simple data display.</CardContent>
                  </Card>
                  
                  <Card variant="clickable">
                    <CardHeader>
                      <CardTitle>Clickable Card</CardTitle>
                    </CardHeader>
                    <CardContent>Has hover lift and active scale effect.</CardContent>
                  </Card>

                  <Card variant="selectable" selected>
                    <CardHeader>
                      <CardTitle>Selected Card</CardTitle>
                    </CardHeader>
                    <CardContent>Uses primary border to represent selection.</CardContent>
                  </Card>
                </ContentGrid>
              </PageSection>
            </PageBody>
          </TabsContent>

          <TabsContent value="status" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Badges & Status Dots</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="space-y-4">
                        <div className={UI_DENSITY.TEXT_LABEL}>Semantic Badges</div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>Hoạt động</Badge>
                          <Badge variant="error" icon={<AlertTriangle className="h-3 w-3" />}>Hỏng hóc</Badge>
                          <Badge variant="warning" icon={<AlertTriangle className="h-3 w-3" />}>Bảo trì</Badge>
                          <Badge variant="info" icon={<Info className="h-3 w-3" />}>Thông tin</Badge>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className={UI_DENSITY.TEXT_LABEL}>Status Dots (Dashboard)</div>
                        <div className="grid grid-cols-2 gap-4">
                          <StatusDot variant="success" label="Hệ thống ổn định" />
                          <StatusDot variant="error" label="Cảnh báo mức cao" />
                          <StatusDot variant="warning" label="Đang kiểm tra" />
                          <StatusDot variant="default" label="Không xác định" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </PageSection>
            </PageBody>
          </TabsContent>
        </Tabs>
      </PageFrame>
    </ClientOnly>
  );
}
