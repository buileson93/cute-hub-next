import React from "react";
import { Table2, History, PencilLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThietBiAllFields } from "@/components/mirats/ThietBiAllFields";
import { ChangeLogPanel } from "@/components/mirats/ChangeLogPanel";
import { DeviceDetailTabProps } from "./types";

export default function TabNangCao({ 
  ma, tb, canEdit, LifecyclePanel, editMode
}: DeviceDetailTabProps & { LifecyclePanel?: any }) {
  return (
    <Tabs defaultValue="fields" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto gap-1 bg-muted/50 p-1">
        <TabsTrigger value="fields" className="text-xs py-1.5">
          <Table2 className="mr-1 h-3 w-3" /> Toàn bộ trường
        </TabsTrigger>
        <TabsTrigger value="lifecycle" className="text-xs py-1.5">
          <History className="mr-1 h-3 w-3" /> Vòng đời thô
        </TabsTrigger>
        {canEdit && (
          <TabsTrigger value="changelog" className="text-xs py-1.5">
            <PencilLine className="mr-1 h-3 w-3" /> Nhật ký thay đổi
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="fields" className="mt-4">
        <ThietBiAllFields maThietBi={ma} />
      </TabsContent>

      <TabsContent value="lifecycle" className="mt-4">
        {LifecyclePanel ? (
          <LifecyclePanel thietBiId={tb.id} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground italic">Component LifecyclePanel chưa sẵn sàng.</p>
        )}
      </TabsContent>

      {canEdit && (
        <TabsContent value="changelog" className="mt-4">
          <ChangeLogPanel entity="thiet_bi" entityId={tb.id} />
        </TabsContent>
      )}
    </Tabs>
  );
}
