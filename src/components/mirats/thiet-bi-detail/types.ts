import { type TimelineItem } from "@/lib/mirats/record-timeline";
import { type DbDevice } from "@/lib/mirats/db-taxonomy";

export interface DeviceDetailTabProps {
  tb: DbDevice;
  ma: string;
  tenTb: string;
  refInfo?: {
    model: string;
    modelPn: string;
    nhaSanXuat: string;
    nhaCungCap: string;
    modelImg: string;
  };
  loaiMau: string | null;
  sysName: string;
  sysGpSo: string;
  sysGpHan: string;
  vaiTroList: any[];
  canEdit: boolean;
  canManage: boolean;
  timeline: TimelineItem[];
  suCo: any[];
  baoTri: any[];
  hongHoc: any[];
  banGiao: any[];
  changeEvents: any[];
}
