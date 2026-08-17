import React, { useState } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, Plus, Search, FileUp, Filter, MoreHorizontal, CheckCircle2, AlertCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface DocumentRecord {
  id: string;
  title: string;
  abstract: string;
  submit_date: string;
  sign_date: string;
  format: 'paper' | 'digital';
  copy_type: 'original' | 'copy' | 'certified';
  issuing_body: string;
  status: 'complete' | 'incomplete';
}

export function DossierRegister({ dossier_id }: { dossier_id: string }) {
  const [search, setSearch] = useState("");
  
  // Mock data for demonstration
  const [docs] = useState<DocumentRecord[]>([
    {
      id: "1",
      title: "Quyết định phê duyệt dự án",
      abstract: "V/v phê duyệt đầu tư xây dựng hạ tầng MIRATS",
      submit_date: "2026-08-01",
      sign_date: "2026-08-05",
      format: "digital",
      copy_type: "original",
      issuing_body: "Ban Giám đốc",
      status: "complete"
    },
    {
      id: "2",
      title: "Hợp đồng kinh tế số 123/HĐ",
      abstract: "Cung cấp thiết bị mạng và server",
      submit_date: "2026-08-10",
      sign_date: "",
      format: "paper",
      copy_type: "copy",
      issuing_body: "Công ty Cổ phần MIRATS",
      status: "incomplete"
    }
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Tìm hồ sơ, trích yếu, số hiệu..." 
            className="pl-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" /> Bộ lọc
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" /> Thêm hồ sơ
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[30%]">Tên & Trích yếu</TableHead>
              <TableHead>Ngày trình/ký</TableHead>
              <TableHead>Hình thức</TableHead>
              <TableHead>Giá trị bản</TableHead>
              <TableHead>Cơ quan phát hành</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((doc) => (
              <TableRow key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="font-medium text-slate-900">{doc.title}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">{doc.abstract}</div>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  <div className="flex flex-col">
                    <span>Trình: {doc.submit_date || "—"}</span>
                    <span>Ký: {doc.sign_date || "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                    {doc.format === 'paper' ? 'Bản giấy' : 'Điện tử'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {doc.copy_type === 'original' ? 'Bản gốc' : doc.copy_type === 'copy' ? 'Bản sao' : 'Chứng thực'}
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {doc.issuing_body}
                </TableCell>
                <TableCell>
                  {doc.status === 'complete' ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đầy đủ
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 text-[11px] font-medium">
                      <AlertCircle className="h-3.5 w-3.5" /> Cần bổ sung
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                      <DropdownMenuItem>Tải tệp đính kèm</DropdownMenuItem>
                      <DropdownMenuItem>Sửa metadata</DropdownMenuItem>
                      <DropdownMenuItem className="text-rose-600">Xoá bản ghi</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
