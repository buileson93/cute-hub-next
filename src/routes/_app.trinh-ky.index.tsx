import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { 
  FileCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Stamp,
  ExternalLink,
  MoreHorizontal,
  ChevronRight,
  User,
  AlertCircle,
  FileText,
  History,
  CheckCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_app/trinh-ky/")({
  component: ApprovalHubPage,
});

function ApprovalHubPage() {
  const [search, setSearch] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const qc = useQueryClient();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ["approval-queue"],
    queryFn: async () => {
      // In a real app, we'd filter by the current user's role and pending status
      const { data, error } = await supabase
        .from("dossier_documents")
        .select(`
          *,
          dossier:project_dossiers(
            project:du_an(ten)
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const signBatchMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("dossier_documents")
        .update({ 
          status: "complete",
          sign_date: new Date().toISOString().split('T')[0],
          // Simulation of electronic seal code storage
          metadata: { 
            esign_hash: Math.random().toString(36).substring(7),
            seal_code: `MIRATS-BATCH-${Date.now()}`
          } as any
        })
        .in("id", ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Đã ký số thành công ${selectedDocs.length} văn bản`);
      setSelectedDocs([]);
      qc.invalidateQueries({ queryKey: ["approval-queue"] });
    }
  });

  const toggleSelect = (id: string) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedDocs.length === queue.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(queue.map((d: any) => d.id));
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Quản lý dự án</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Trung tâm Trình ký</span>
        </div>
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Approval Hub</h1>
          {selectedDocs.length > 0 && (
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 font-bold"
              onClick={() => signBatchMutation.mutate(selectedDocs)}
              disabled={signBatchMutation.isPending}
            >
              {signBatchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Stamp className="h-4 w-4 mr-2" />
              )}
              Ký hàng loạt ({selectedDocs.length})
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-3 rounded-xl border border-dashed border-slate-200">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm văn bản, mã hồ sơ..."
            className="pl-9 text-sm h-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 font-medium">
            <Filter className="h-4 w-4 mr-2" /> Cần tôi ký
          </Button>
          <Button variant="ghost" size="sm" className="h-9 font-medium">
            Đang theo dõi
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={selectedDocs.length === queue.length && queue.length > 0} 
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="w-[30%]">Văn bản & Dự án</TableHead>
              <TableHead>Người trình</TableHead>
              <TableHead>Ngày trình</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-[100px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                 </TableCell>
               </TableRow>
            ) : queue.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-xs italic">
                    Hàng đợi trống. Không có văn bản nào đang chờ duyệt.
                 </TableCell>
               </TableRow>
            ) : queue.map((doc: any) => (
              <TableRow key={doc.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <Checkbox 
                    checked={selectedDocs.includes(doc.id)} 
                    onCheckedChange={() => toggleSelect(doc.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{doc.title}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <History className="h-3 w-3" />
                    {doc.dossier?.project?.ten || "Dự án chung"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center border">
                      <User className="h-3 w-3 text-slate-500" />
                    </div>
                    <span className="text-xs">{doc.issuing_body || "Cán bộ chuyên môn"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {doc.submit_date || "Hôm nay"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center w-fit gap-1.5 py-0.5 font-bold text-[10px]">
                    <Clock className="h-3 w-3" /> Chờ phê duyệt
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600">
                      <Stamp className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Xem tài liệu</DropdownMenuItem>
                        <DropdownMenuItem>Lịch sử trình ký</DropdownMenuItem>
                        <DropdownMenuItem className="text-rose-600">Trả lại hồ sơ</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
