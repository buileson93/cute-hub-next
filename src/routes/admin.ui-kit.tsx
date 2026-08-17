import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageSection } from "@/components/mirats/layout/PageSection";
import { StartPanel, EndPanel, ContentGrid, PageFooter } from "@/components/mirats/layout/PageLayouts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Plus, 
  LayoutDashboard, 
  Table as TableIcon, 
  FileText, 
  Package,
  Activity
} from "lucide-react";
import { ClientOnly } from "@/components/ClientOnly";

export const Route = createFileRoute("/admin/ui-kit")({
  component: UIKitLab,
});

function UIKitLab() {
  return (
    <ClientOnly>
      <PageFrame density="compact">
        <PageHeader
          title="Design Lab & Page Anatomy"
          subtitle="MIRATS Astryx Templates Prototype"
          breadcrumbs={[
            { label: "MIRATS", to: "/" },
            { label: "Admin", to: "/admin" },
            { label: "UI Kit" }
          ]}
          icon={Settings}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 rounded-md">
                Preview Mobile
              </Button>
              <Button size="sm" className="h-7 rounded-md bg-[#0074e2] text-white">
                <Plus className="mr-1 h-3 w-3" /> New Archetype
              </Button>
            </div>
          }
          metadata={
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-200">
                Phase: U3
              </Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="h-3 w-3" />
                <span>SSR Stable</span>
              </div>
            </div>
          }
        />

        <Tabs defaultValue="anatomy" className="flex-1 flex flex-col">
          <div className="bg-background border-b px-2 pt-1">
            <TabsList className="bg-transparent h-8 p-0 gap-4">
              <TabsTrigger 
                value="anatomy" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0074e2] data-[state=active]:bg-transparent h-8 text-[11px] uppercase font-bold tracking-wider"
              >
                Page Anatomy
              </TabsTrigger>
              <TabsTrigger 
                value="grid" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0074e2] data-[state=active]:bg-transparent h-8 text-[11px] uppercase font-bold tracking-wider"
              >
                Layout Grid
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="anatomy" className="flex-1 m-0 p-0 overflow-auto">
            <PageBody className="bg-muted/10">
              <PageSection>
                <div className="flex flex-col lg:flex-row gap-4 h-[600px]">
                  <StartPanel className="p-3 gap-2">
                    <div className="text-[10px] font-bold uppercase text-muted-foreground px-2">Navigation</div>
                    {[
                      { icon: LayoutDashboard, label: "Dashboard" },
                      { icon: TableIcon, label: "Asset List" },
                      { icon: FileText, label: "Reports" },
                      { icon: Package, label: "Inventory" },
                    ].map((item, i) => (
                      <Button key={i} variant="ghost" size="sm" className="justify-start gap-2 h-8 text-xs font-medium">
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </Button>
                    ))}
                  </StartPanel>

                  <div className="flex-1 flex flex-col gap-4 overflow-auto py-2">
                    <Card className="rounded-xl border-none shadow-sm overflow-hidden">
                      <CardHeader className="bg-muted/20 border-b py-3 px-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-tight">Main Content Area</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <ContentGrid>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="rounded-xl border shadow-none hover:border-[#0074e2]/50 transition-colors">
                              <CardContent className="p-4 flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Package className="h-4 w-4 text-primary" />
                                  </div>
                                  <Badge variant="outline" className="text-[10px]">Active</Badge>
                                </div>
                                <div className="text-sm font-bold">Asset-00{i+1}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                  Technical description of the asset with high density text.
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </ContentGrid>
                      </CardContent>
                    </Card>
                  </div>

                  <EndPanel className="p-3">
                    <div className="text-[10px] font-bold uppercase text-muted-foreground px-2 mb-2">Activities</div>
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-3 px-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-medium leading-tight">User updated status</div>
                            <div className="text-[10px] text-muted-foreground">2 hours ago</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </EndPanel>
                </div>
              </PageSection>

              <PageFooter className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs">Reset All</Button>
                <Button size="sm" className="h-8 rounded-lg bg-[#0074e2] text-white text-xs px-6">Save Changes</Button>
              </PageFooter>
            </PageBody>
          </TabsContent>

          <TabsContent value="grid" className="p-4">
            <div className="text-sm text-muted-foreground">Grid configuration tools coming in U4...</div>
          </TabsContent>
        </Tabs>
      </PageFrame>
    </ClientOnly>
  );
}
