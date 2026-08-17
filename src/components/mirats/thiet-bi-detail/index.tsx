import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageBody } from "@/components/mirats/PageBody";
import { PageHeader } from "@/components/mirats/PageHeader";
import { Icon } from "@/components/mirats/ui/Icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type DbDevice } from "@/lib/mirats/db-taxonomy";
import { useOperationsData } from "@/lib/mirats/db-operations";
import { VoiceQuickLog } from "@/components/mirats/VoiceQuickLog";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { AppTooltip } from "@/components/mirats/AppTooltip";

import TabTongQuan from "./TabTongQuan";
import TabVanHanh from "./TabVanHanh";
import TabCauHinh from "./TabCauHinh";
import TabHoSoPhapLy from "./TabHoSoPhapLy";
import TabNangCao from "./TabNangCao";
import { TelemetryPanel, AllocationPanel, LifecyclePanel } from "./Panels";

interface ThietBiDetailProps {
  asset: DbDevice;
  operations: {
    suCo: any[];
    baoTri: any[];
    hongHoc: any[];
  };
  isLoading: boolean;
  initialTab?: string;
  initialDocId?: string | null;
}

export function ThietBiDetail({
  asset,
  operations,
  isLoading,
  initialTab = "tong-quan",
  initialDocId,
}: ThietBiDetailProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editMode, setEditMode] = useState(false);

  // Map data to the props required by children
  const tabProps = {
    tb: asset,
    ma: asset.ma_thiet_bi,
    tenTb: asset.ten,
    loaiMau: (asset as any)._loaiTbMau || null,
    sysName: (asset as any)._htTen || "",
    sysGpSo: "",
    sysGpHan: "",
    vaiTroList: [],
    canEdit: true,
    canManage: true,
    editMode,
    setEditMode,
    timeline: [],
    suCo: operations.suCo,
    baoTri: operations.baoTri,
    hongHoc: operations.hongHoc,
    banGiao: [],
    changeEvents: [],
    pct: (asset as any).completeness_pct || 0,
    initialDocId,
  };

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title={asset.ten}
            icon="entity.system"
          />
          <div className="flex items-center gap-2">
            <VoiceQuickLog maThietBi={asset.ma_thiet_bi} />
            <AppTooltip noiDung="Chia sẻ tài sản">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Share2 className="h-4 w-4" />
              </Button>
            </AppTooltip>
            <Badge variant="outline" className="font-mono">
              {asset.ma_thiet_bi}
            </Badge>
            {asset.trang_thai && (
              <Badge>{asset.trang_thai}</Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="tong-quan">Tổng quan</TabsTrigger>
            <TabsTrigger value="van-hanh">Vận hành</TabsTrigger>
            <TabsTrigger value="cau-hinh">Cấu hình</TabsTrigger>
            <TabsTrigger value="ho-so">Hồ sơ</TabsTrigger>
            <TabsTrigger value="nang-cao">Nâng cao</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="tong-quan">
              <TabTongQuan {...tabProps} />
            </TabsContent>
            <TabsContent value="van-hanh">
              <TabVanHanh {...tabProps} />
            </TabsContent>
            <TabsContent value="cau-hinh">
              <TabCauHinh {...tabProps} />
            </TabsContent>
            <TabsContent value="ho-so">
              <TabHoSoPhapLy {...tabProps} />
            </TabsContent>
            <TabsContent value="nang-cao">
              <TabNangCao {...tabProps} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </PageBody>
  );
}
