import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Plus,
  Search,
  FileUp,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Blockquote } from "@/components/ui/blockquote";

interface DocumentRecord {
  id: string;
  title: string;
  abstract: string | null;
  submit_date: string | null;
  sign_date: string | null;
  format: string | null;
  copy_type: string | null;
  issuing_body: string | null;
  status: string | null;
}

export function DossierRegister({ project_id }: { project_id: string }) {
  const [search, setSearch] = useState("");

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["dossier-docs", project_id],
    queryFn: async () => {
      const { data: dossiers } = await supabase
        .from("project_dossiers")
        .select("id")
        .eq("project_id", project_id);
      const dossiersArr = (dossiers || []) as any[];
      if (!dossiersArr.length) return [];

      const dossierIds = dossiersArr.map((d) => d.id);
      const { data, error } = await supabase
        .from("dossier_documents")
        .select("*")
        .in("dossier_id", dossierIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return ((data as any) || []) as DocumentRecord[];
    },
  });

  if (isLoading)
    return (
      <div className="p-8 text-slate-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tải hồ sơ…
      </div>
    );

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
                    {doc.format === "paper" ? "Bản giấy" : "Điện tử"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {doc.copy_type === "original"
                    ? "Bản gốc"
                    : doc.copy_type === "copy"
                      ? "Bản sao"
                      : "Chứng thực"}
                </TableCell>
                <TableCell className="text-xs text-slate-600">{doc.issuing_body}</TableCell>
                <TableCell>
                  {doc.status === "complete" ? (
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
      <Blockquote className="mt-4 border-slate-200 bg-slate-50/50 text-slate-600">
        <div className="flex gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-[11px] leading-relaxed italic">
            <strong>Lưu ý:</strong> Sổ đăng ký văn bản/hồ sơ này phục vụ việc đối soát thực tế. Đảm
            bảo các bản quét (digital) khớp với bản lưu kho (paper) để duy trì tính nhất quán của
            Dossier dự án.
          </div>
        </div>
      </Blockquote>
    </div>
  );
}
