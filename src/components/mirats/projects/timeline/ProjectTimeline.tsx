import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  Calendar, CheckCircle2, Circle, Clock, FileText, 
  History, Info, Layout, ListTodo, Milestone, 
  MoreHorizontal, Plus, User, Search, Filter, 
  ArrowUpRight, Download, Eye, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LayoutPanel } from "@/components/astryx/layout-panel";
import { useProjectEvents, ProjectEvent, ProjectEventType } from "@/hooks/mirats/use-project-events";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectTimelineProps {
  projectId: string;
}

export function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const { data: events, isLoading } = useProjectEvents(projectId);

  const filteredEvents = React.useMemo(() => {
    if (!events) return [];
    if (!searchQuery) return events;
    const lowerQuery = searchQuery.toLowerCase();
    return events.filter(e => 
      e.title.toLowerCase().includes(lowerQuery) || 
      (e.summary && e.summary.toLowerCase().includes(lowerQuery)) ||
      (e.actor?.ho_ten && e.actor.ho_ten.toLowerCase().includes(lowerQuery))
    );
  }, [events, searchQuery]);

  const groupedEvents = React.useMemo(() => {
    const groups: Record<string, typeof filteredEvents> = {};
    filteredEvents.forEach(event => {
      const date = format(new Date(event.occurred_at || new Date()), "yyyy-MM-dd");
      if (!groups[date]) groups[date] = [];
      groups[date].push(event);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredEvents]);

  const selectedEvent = events?.find(e => e.id === selectedEventId);

  return (
    <div className="flex h-[calc(100vh-280px)] overflow-hidden border border-border rounded-xl bg-background shadow-sm">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/20 gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm sự kiện..." 
              className="pl-8 h-8 text-xs bg-background" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Filter className="h-3.5 w-3.5" /> Bộ lọc
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Timeline Content */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {isLoading ? (
              <TimelineLoading />
            ) : filteredEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <History className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Không tìm thấy sự kiện nào</p>
              </div>
            ) : (
              <div className="space-y-8 relative">
                {/* Vertical axis line */}
                <div className="absolute left-[17px] top-2 bottom-0 w-[2px] bg-border z-0" />
                
                {groupedEvents.map(([date, groupEvents]) => (
                  <div key={date} className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-[36px] flex justify-center" key={date + "-marker"}>
                        <div className="h-2 w-2 rounded-full bg-border" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        {format(new Date(date), "EEEE, dd MMMM, yyyy", { locale: vi })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {groupEvents.map((event) => (
                        <TimelineItem 
                          key={event.id} 
                          event={event} 
                          isSelected={selectedEventId === event.id}
                          onClick={() => setSelectedEventId(event.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Inspector Panel */}
      {selectedEventId && (
        <div className="w-[380px] border-l bg-card flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
          <TimelineInspector 
            event={selectedEvent} 
            onClose={() => setSelectedEventId(null)} 
          />
        </div>
      )}
    </div>
  );
}

function TimelineItem({ 
  event, 
  isSelected, 
  onClick 
}: { 
  event: any; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = getEventIcon(event.event_type);
  const color = getEventColor(event.event_type);

  return (
    <div 
      className={cn(
        "group flex items-start gap-4 p-2 rounded-lg transition-colors cursor-pointer ml-[9px] relative",
        isSelected ? "bg-primary/5" : "hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "z-10 h-4 w-4 rounded-full flex items-center justify-center bg-background ring-2 ring-background border-2",
        color.border
      )}>
        <Icon className={cn("h-2.5 w-2.5", color.text)} />
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn(
            "text-sm font-medium leading-none truncate",
            isSelected ? "text-primary" : "text-foreground"
          )}>
            {event.title}
          </h4>
          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
            {format(new Date(event.occurred_at || new Date()), "HH:mm")}
          </span>
        </div>
        
        {event.summary && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            {event.summary}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-muted-foreground/60" />
            <span className="text-[10px] text-muted-foreground">
              {event.actor?.ho_ten || event.actor?.email || "System"}
            </span>
          </div>
          {event.source !== 'web' && (
            <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase tracking-tighter">
              {event.source}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineInspector({ 
  event, 
  onClose 
}: { 
  event: any; 
  onClose: () => void;
}) {
  if (!event) return null;

  const Icon = getEventIcon(event.event_type);
  const color = getEventColor(event.event_type);

  return (
    <LayoutPanel
      title="Chi tiết sự kiện"
      icon={<History className="h-4 w-4" />}
      variant="default"
      className="h-full border-none rounded-none shadow-none"
      bodyClassName="flex flex-col h-full"
      actions={
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <span className="sr-only">Đóng</span>
          <Plus className="h-4 w-4 rotate-45" />
        </Button>
      }
    >
      <div className="p-4 space-y-6 overflow-y-auto">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg border", color.bg, color.border)}>
            <Icon className={cn("h-5 w-5", color.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold leading-tight text-foreground">{event.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(event.occurred_at || new Date()), "HH:mm, dd/MM/yyyy")}</span>
            </div>
          </div>
        </div>

        {event.summary && (
          <div className="space-y-1.5">
            <h5 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Mô tả</h5>
            <div className="text-sm p-3 rounded-lg bg-muted/30 border border-border/50 text-foreground leading-relaxed">
              {event.summary}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <h5 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Người thực hiện</h5>
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="h-3 w-3 text-primary" />
              </div>
              <span className="truncate">{event.actor?.ho_ten || event.actor?.email || "Hệ thống"}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <h5 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Nguồn</h5>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="h-5 px-1.5 uppercase text-[9px] tracking-widest font-bold">
                {event.source}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h5 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Thực thể liên quan</h5>
          <div className="flex items-center justify-between p-2 rounded-md border border-border hover:bg-muted/50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-8 rounded flex items-center justify-center bg-muted shrink-0">
                <Layout className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-medium truncate">{event.entity_type}</span>
                <span className="text-[10px] text-muted-foreground font-mono truncate">{event.entity_id}</span>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </div>

        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Dữ liệu chi tiết</h5>
            <div className="p-3 rounded-md bg-muted/30 font-mono text-[11px] overflow-x-auto border border-border/40">
              <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto p-4 border-t bg-muted/10">
        <Button className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-semibold">
          <Eye className="h-4 w-4" /> Xem chi tiết
        </Button>
      </div>
    </LayoutPanel>
  );
}

function TimelineLoading() {
  return (
    <div className="space-y-8">
      {[1, 2].map(i => (
        <div key={i} className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-2 w-2 rounded-full ml-[14px]" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="space-y-4 ml-[36px]">
            {[1, 2, 3].map(j => (
              <div key={j} className="flex gap-4">
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function getEventIcon(type: ProjectEventType) {
  switch (type) {
    case 'project_created': return Plus;
    case 'project_updated': return Pencil;
    case 'milestone_created': return Milestone;
    case 'milestone_updated': return Milestone;
    case 'milestone_deleted': return Trash2;
    case 'task_created': return ListTodo;
    case 'task_completed': return CheckCircle2;
    case 'task_status_changed': return Clock;
    case 'canvas_published': return Layout;
    case 'document_uploaded': return FileText;
    case 'document_linked': return ExternalLink;
    default: return Info;
  }
}

function getEventColor(type: ProjectEventType) {
  if (type.includes('created') || type === 'task_completed') {
    return {
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    };
  }
  if (type.includes('updated') || type === 'task_status_changed') {
    return {
      text: 'text-sky-600',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
    };
  }
  if (type.includes('deleted')) {
    return {
      text: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    };
  }
  return {
    text: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  };
}
