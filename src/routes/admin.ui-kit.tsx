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
import { StatusBadge } from "@/components/mirats/StatusBadge";
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
  Info,
  Type,
  MousePointer2,
  Layout,
  Layers,
  ShieldCheck,
  Table as TableIcon,
  Palette
} from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { TYPO } from "@/lib/mirats/ui/typography";
import { ACTION_PATTERNS } from "@/lib/mirats/ui/action-patterns";
import { STATUS_REGISTRY } from "@/lib/mirats/ui/status-registry";
import { TYPO_STATUS } from "@/lib/mirats/ui/status-tokens";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

export function UIKitLab() {
  return (
    <ClientOnly>
      <PageFrame density="compact">
        <PageHeader
          title="Hệ thống Giao diện MIRATS"
          subtitle="Nguồn sự thật duy nhất cho Typography, Action & Status (Phase U4)"
          breadcrumbs={[
            { label: "MIRATS", to: "/" },
            { label: "Quản trị", to: "/admin" },
            { label: "UI Kit" }
          ]}
          icon={Settings}
          actions={
            <div className="flex gap-2">
              <Button variant={ACTION_PATTERNS.SECONDARY} size="sm">
                Hủy bỏ
              </Button>
              <Button variant={ACTION_PATTERNS.PRIMARY} size="sm">
                <Plus className="mr-1" /> Thêm thành phần
              </Button>
            </div>
          }
        />

        <Tabs defaultValue="typography" className="flex-1 flex flex-col">
          <div className="bg-background border-b px-2 pt-1">
            <TabsList className="bg-transparent h-8 p-0 gap-4">
              <TabTrigger value="typography" label="Chữ" icon={Type} />
              <TabTrigger value="actions" label="Hành động" icon={MousePointer2} />
              <TabTrigger value="status" label="Trạng thái" icon={ShieldCheck} />
              <TabTrigger value="tables" label="Bảng & Số" icon={TableIcon} />
              <TabTrigger value="density" label="Nền & Mật độ" icon={Palette} />
              <TabTrigger value="forms" label="Biểu mẫu" icon={Layout} />
              <TabTrigger value="overlays" label="Lớp phủ" icon={Layers} />
            </TabsList>
          </div>

          <TabsContent value="typography" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection className="max-w-4xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography System</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-2 pb-4 border-b">
                      <div className={TYPO.LABEL}>Quy tắc font chữ</div>
                      <p className={TYPO.BODY}>
                        Hệ thống sử dụng <span className={TYPO.MONO}>Geist</span> làm font chữ chính. 
                        BODY compact tối thiểu 12px. LABEL tối thiểu 11px.
                      </p>
                    </div>

                    <div className="grid gap-6">
                      {Object.entries(TYPO).map(([key, className]) => (
                        <div key={key} className="space-y-1">
                          <div className={cn(TYPO.LABEL, "text-muted-foreground/60")}>{key}</div>
                          <div className={className}>
                            {key === 'DISPLAY' ? '99.8%' : 
                             key === 'MONO' ? 'Asset-ID: 8849-X2' : 
                             `MIRATS Typography - Bậc ${key}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </PageSection>
            </PageBody>
          </TabsContent>

          <TabsContent value="actions" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection className="max-w-4xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Button Hierarchy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <div className={TYPO.LABEL}>Phân cấp theo Action Patterns</div>
                      <div className="flex flex-wrap gap-4 items-center">
                        <div className="space-y-2">
                          <div className={TYPO.LABEL + " text-[10px] opacity-50"}>PRIMARY (Default)</div>
                          <Button variant={ACTION_PATTERNS.PRIMARY}>Hành động chính</Button>
                        </div>
                        <div className="space-y-2">
                          <div className={TYPO.LABEL + " text-[10px] opacity-50"}>SECONDARY (Outline)</div>
                          <Button variant={ACTION_PATTERNS.SECONDARY}>Hành động phụ</Button>
                        </div>
                        <div className="space-y-2">
                          <div className={TYPO.LABEL + " text-[10px] opacity-50"}>UTILITY (Ghost)</div>
                          <Button variant={ACTION_PATTERNS.UTILITY} size="icon" aria-label="Settings"><Settings /></Button>
                        </div>
                        <div className="space-y-2">
                          <div className={TYPO.LABEL + " text-[10px] opacity-50"}>DANGER (Destructive)</div>
                          <Button variant={ACTION_PATTERNS.DANGER}>Xóa vĩnh viễn</Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className={TYPO.LABEL}>Loading States</div>
                      <div className="flex gap-4">
                        <Button loading>Đang lưu...</Button>
                        <Button variant="outline" loading>Đang tải...</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </PageSection>
            </PageBody>
          </TabsContent>

          <TabsContent value="status" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection>
                <ContentGrid>
                  {Object.entries(STATUS_REGISTRY).slice(0, 6).map(([domain, tokens]) => (
                    <Card key={domain}>
                      <CardHeader>
                        <CardTitle className="capitalize">Domain: {domain.replace('_', ' ')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {Object.keys(tokens).map(code => (
                            <StatusBadge key={code} domain={domain as any} code={code} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Dashboard Indicators (dotOnly)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {['DANG_KHAI_THAC', 'DANG_SUA_CHUA', 'HONG', 'CHO_XU_LY'].map(code => (
                        <StatusBadge key={code} domain="thiet_bi" code={code} dotOnly label={code} />
                      ))}
                    </CardContent>
                  </Card>
                </ContentGrid>
              </PageSection>
            </PageBody>
          </TabsContent>

          <TabsContent value="tables" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection className="max-w-5xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Bảng & Dữ liệu số</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <div className={TYPO.LABEL}>Table Header & Rows</div>
                      <div className="border rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className={cn(UI_DENSITY.TABLE_HEADER_FS, UI_DENSITY.TABLE_CELL_PX, UI_DENSITY.TABLE_CELL_PY)}>Mã tài sản</th>
                              <th className={cn(UI_DENSITY.TABLE_HEADER_FS, UI_DENSITY.TABLE_CELL_PX, UI_DENSITY.TABLE_CELL_PY)}>Trạng thái</th>
                              <th className={cn(UI_DENSITY.TABLE_HEADER_FS, UI_DENSITY.TABLE_CELL_PX, UI_DENSITY.TABLE_CELL_PY, "text-right")}>Giá trị</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3].map(i => (
                              <tr key={i} className={cn(UI_DENSITY.TABLE_ROW_H, "border-b last:border-0")}>
                                <td className={cn(TYPO.MONO, UI_DENSITY.TABLE_CELL_PX)}>ASSET-00{i}</td>
                                <td className={UI_DENSITY.TABLE_CELL_PX}>
                                  <StatusBadge domain="thiet_bi" code={i === 1 ? "DANG_KHAI_THAC" : i === 2 ? "DANG_SUA_CHUA" : "HONG"} />
                                </td>
                                <td className={cn(TYPO.MONO, UI_DENSITY.TABLE_CELL_PX, "text-right")}>
                                  {i * 12500000},00
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </PageSection>
            </PageBody>
          </TabsContent>

          <TabsContent value="density" className="flex-1 m-0 overflow-auto">
            <PageBody>
              <PageSection className="max-w-4xl">
                <Card>
                  <CardHeader>
                    <CardTitle>Hệ thống Mật độ (Density)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {(['compact', 'comfortable', 'spacious'] as const).map(d => (
                        <div key={d} className="space-y-2">
                          <div className={TYPO.LABEL}>{d.toUpperCase()}</div>
                          <div data-density={d} className="p-4 border rounded-xl bg-muted/20 space-y-4">
                            <div className={UI_DENSITY.CONTROL_H + " " + UI_DENSITY.CONTROL_PX + " flex items-center border rounded bg-background"}>
                              <span className={UI_DENSITY.CONTROL_FS}>Input Height</span>
                            </div>
                            <div className="flex gap-2">
                              <div className={UI_DENSITY.ICON_MD + " bg-primary rounded-sm"} />
                              <div className={UI_DENSITY.ICON_MD + " bg-primary rounded-sm"} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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
                       <div className="space-y-1.5">
                          <label className={TYPO.LABEL}>Văn bản</label>
                          <Input placeholder="Nhập nội dung..." />
                       </div>
                       <div className="space-y-1.5">
                          <label className={TYPO.LABEL}>Số lượng & Đơn vị</label>
                          <Input prefix={<Activity className="h-3 w-3" />} unit="kWh" placeholder="0.00" type="number" />
                       </div>
                       <div className="space-y-1.5">
                          <label className={TYPO.LABEL}>Lựa chọn</label>
                          <Select defaultValue="opt1">
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="opt1">Phương án A</SelectItem>
                              <SelectItem value="opt2">Phương án B</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Điều khiển</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="terms" />
                        <label htmlFor="terms" className={TYPO.BODY}>Đồng ý điều khoản</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="notify" />
                        <label htmlFor="notify" className={TYPO.BODY}>Thông báo đẩy</label>
                      </div>
                      <div className="space-y-1.5">
                        <label className={cn(TYPO.LABEL, "text-destructive")}>Lỗi nhập liệu</label>
                        <Input aria-invalid="true" placeholder="Dữ liệu sai..." />
                        <p className="text-[11px] text-destructive font-medium italic">Trường này là bắt buộc.</p>
                      </div>
                    </CardContent>
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
                      <CardTitle>Hỗ trợ thông tin</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline">Hover Tooltip</Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Đây là thông tin bổ trợ</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline">Click Popover</Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <h4 className={TYPO.H3}>Cấu hình nhanh</h4>
                              <p className={TYPO.BODY + " text-muted-foreground"}>Điều chỉnh thông số vận hành hệ thống.</p>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </CardContent>
                  </Card>
                </ContentGrid>
              </PageSection>
            </PageBody>
          </TabsContent>
        </Tabs>
      </PageFrame>
    </ClientOnly>
  );
}

function TabTrigger({ value, label, icon: IconComp }: { value: string; label: string; icon: any }) {
  return (
    <TabsTrigger 
      value={value} 
      className={cn(
        "rounded-none border-b-2 border-transparent",
        "data-[state=active]:border-primary data-[state=active]:bg-transparent",
        "h-8 gap-2 px-3 transition-all",
        TYPO.LABEL,
        "text-[10px] sm:text-[11px]"
      )}
    >
      <IconComp className="h-3 w-3 opacity-60" />
      <span className="hidden sm:inline">{label}</span>
    </TabsTrigger>
  );
}
