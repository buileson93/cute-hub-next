import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/mirats/ui/Icon";
import { ChevronRight } from "lucide-react";
import { type ColumnDef } from "@/components/mirats/StandardTable";

interface MobileRecordCardProps<T> {
  row: T;
  rowIndex: number;
  rowId: string;
  columns: ColumnDef<T>[];
  selectable?: boolean;
  isSelected?: boolean;
  isExpanded?: boolean;
  onSelect?: (rowId: string) => void;
  onExpand?: (rowId: string) => void;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  renderCellContent: (col: ColumnDef<T>, row: T) => React.ReactNode;
  toolbarRight?: React.ReactNode | ((ctx: any) => React.ReactNode);
}

export function MobileRecordCard<T>({
  row,
  rowId,
  columns,
  selectable,
  isSelected,
  isExpanded,
  onSelect,
  onExpand,
  onRowClick,
  rowClassName,
  renderCellContent,
  toolbarRight,
}: MobileRecordCardProps<T>) {
  const primaryCols = columns.filter((c) => c.priority === "primary");
  const secondaryCols = columns.filter((c) => c.priority === "secondary");
  const detailCols = columns.filter((c) => c.priority === "detail");

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-colors hover:bg-muted/50 overflow-hidden",
        isSelected && "border-primary bg-primary/5 shadow-sm shadow-primary/10",
        rowClassName?.(row),
      )}
      onClick={() => onRowClick?.(row)}
    >
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* Tiêu đề thẻ (Primary) */}
          <div className="flex items-start justify-between p-4 bg-muted/20 border-b border-border/40">
            <div className="flex-1 space-y-1 min-w-0 pr-6">
              {primaryCols.map((col, idx) => (
                <div
                  key={col.key}
                  className={
                    idx === 0
                      ? "font-semibold text-sm truncate"
                      : "text-[12px] text-muted-foreground truncate"
                  }
                >
                  {col.render
                    ? col.render(row)
                    : col.cell
                      ? col.cell(row)
                      : String(col.value?.(row) ?? "")}
                </div>
              ))}
              {primaryCols.length === 0 && (
                <div className="font-semibold text-sm truncate">{String(rowId)}</div>
              )}
            </div>
            {selectable && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect?.(rowId)}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="mt-1"
                aria-label={`Chọn dòng ${rowId}`}
              />
            )}
          </div>

          {/* Nội dung thẻ (Secondary) */}
          <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {secondaryCols.map((col) => (
              <div key={col.key} className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">
                  {col.header || col.label}
                </span>
                <div className={cn("text-[12px] truncate", col.cellClassName)}>
                  {renderCellContent(col, row)}
                </div>
              </div>
            ))}
          </div>

          {/* Dòng chi tiết (Detail) - Mobile Expandable */}
          {isExpanded && detailCols.length > 0 && (
            <div className="px-4 py-3 bg-muted/10 border-t border-border/20 grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-1">
              {detailCols.map((col) => (
                <div key={col.key} className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 leading-none">
                    {col.header || col.label}
                  </span>
                  <div className={cn("text-[12px] break-words", col.cellClassName)}>
                    {renderCellContent(col, row)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Hành động */}
          <div className="flex items-center justify-between p-2 bg-muted/5 border-t border-border/30 gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[12px] gap-1.5 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onExpand?.(rowId);
              }}
            >
              {isExpanded ? (
                <>
                  <Icon name="table.collapse" size="tiny" />
                  <span>Thu gọn</span>
                </>
              ) : (
                <>
                  <Icon name="table.expand" size="tiny" />
                  <span>Xem thêm ({detailCols.length})</span>
                </>
              )}
            </Button>

            {(toolbarRight || onRowClick) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-[12px] gap-1 text-primary"
                onClick={() => onRowClick?.(row)}
              >
                <span>Chi tiết</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
