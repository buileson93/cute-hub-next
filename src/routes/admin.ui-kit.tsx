import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger 
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
              <TabsTrigger value="forms" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0074e2] data-[state=active]:bg-transparent h-8 text-[11px] uppercase font-bold tracking-wider">
                Forms & Inputs
              </TabsTrigger>
              <TabsTrigger value="cards" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0074e2] data-[state=active]:bg-transparent h-8 text-[11px] uppercase font-bold tracking-wider">
                Cards
              </TabsTrigger>
              <TabsTrigger value="status" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0074e2] data-[state=active]:bg-transparent h-8 text-[11px] uppercase font-bold tracking-wider">
                Status & Feedback
              </TabsTrigger>
              <TabsTrigger value="overlays" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0074e2] data-[state=active]:bg-transparent h-8 text-[11px] uppercase font-bold tracking-wider">
                Overlays
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

          <TabsContent value="forms" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection className="max-w-4xl">
                <ContentGrid>
                  <Card>
                    <CardHeader>
                      <CardTitle>Standard Inputs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4">
                         <div className="space-y-1.5">
                            <label className={UI_DENSITY.TEXT_LABEL}>Text Input</label>
                            <Input placeholder="Enter text..." />
                         </div>
                         <div className="space-y-1.5">
                            <label className={UI_DENSITY.TEXT_LABEL}>With Prefix/Unit</label>
                            <Input prefix={<Activity className="h-3 w-3" />} unit="kWh" placeholder="0.00" type="number" />
                         </div>
                         <div className="space-y-1.5">
                            <label className={UI_DENSITY.TEXT_LABEL}>Select Menu</label>
                            <Select defaultValue="opt1">
                              <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="opt1">Option One</SelectItem>
                                <SelectItem value="opt2">Option Two</SelectItem>
                              </SelectContent>
                            </Select>
                         </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Choices & Feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="terms" />
                        <label htmlFor="terms" className={UI_DENSITY.TEXT_BODY}>Accept terms</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="notify" />
                        <label htmlFor="notify" className={UI_DENSITY.TEXT_BODY}>Enable notifications</label>
                      </div>
                      <div className="space-y-1.5">
                        <label className={UI_DENSITY.TEXT_LABEL + " text-destructive"}>Error State</label>
                        <Input aria-invalid="true" placeholder="Invalid input..." />
                        <p className="text-[11px] text-destructive font-medium">This field is required.</p>
                      </div>
                    </CardContent>
                  </Card>
                </ContentGrid>
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

          <TabsContent value="overlays" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection>
                <ContentGrid>
                  <Card>
                    <CardHeader>
                      <CardTitle>Tooltips & Popovers</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline">Hover for Tooltip</Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Đây là thông tin bổ trợ</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">Click for Popover</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className="font-medium leading-none">Cấu hình nhanh</h4>
                              <p className="text-sm text-muted-foreground">Điều chỉnh thông số vận hành của hệ thống.</p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Dialogs & Sheets</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">Open Dialog</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Xác nhận tác vụ</DialogTitle>
                            <DialogDescription>
                              Bạn có chắc chắn muốn thực hiện thay đổi này không? Hành động này sẽ được lưu vào nhật ký hệ thống.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4 text-sm">
                            Nội dung chi tiết của hội thoại...
                          </div>
                          <DialogFooter>
                            <Button variant="outline">Hủy</Button>
                            <Button>Xác nhận</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline">Open Sheet</Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>Chi tiết tài sản</SheetTitle>
                            <SheetDescription>
                              Thông tin kỹ thuật và lịch sử bảo trì.
                            </SheetDescription>
                          </SheetHeader>
                          <div className="py-6 space-y-4">
                            <div className="h-32 rounded-xl bg-muted animate-pulse" />
                            <div className="space-y-2">
                              <div className="h-4 w-3/4 rounded bg-muted" />
                              <div className="h-4 w-1/2 rounded bg-muted" />
                            </div>
                          </div>
                          <SheetFooter>
                            <Button className="w-full">Đóng</Button>
                          </SheetFooter>
                        </SheetContent>
                      </Sheet>
                    </CardContent>
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
