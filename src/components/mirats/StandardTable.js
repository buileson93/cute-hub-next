import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { OptimizedCell } from "./OptimizedCell";
import { TableSkeleton } from "@/components/mirats/Skeletons";
import { BP_PX } from "@/lib/mirats/ui/responsive-scope";
import { MobileRecordCard } from "@/components/mirats/ui/MobileRecordCard";
import { useColumnPrefs } from "@/lib/mirats/use-column-prefs";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo } from "react";
const MemoizedTableRow = memo(TableRow);
import { useDensity } from "@/components/mirats/DensityToggle";
import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import { HorizontalScrollRail } from "./HorizontalScrollRail";
import { normalize } from "@/lib/mirats/global-search";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { CodeBadge } from "@/components/mirats/CodeBadge";
import { MauChip } from "@/components/mirats/MauChip";
import { UserAvatar } from "@/components/mirats/UserAvatar";
import { fmtVND, fmtSo, KHONG_CO } from "@/lib/mirats/format";
export function StandardTable({ rows, columns, getRowId, selectable, selected, onSelect, onRowClick, rowClassName, toolbar, toolbarRight, emptyContent, loadingContent, errorContent, trangThai = {}, infiniteScroll, prefKey, gated, emptyText, tableKey, className, requireFilterToShow, setSelected, countUnit, bulkActions, presets, hideReorderToggle, pagination, toolbarLeft, expandable, renderExpansion, virtualizerOptions, maxHeightClass, editMode, }) {
    const [textFilters, setTextFilters] = useState({});
    const [catFilters, setCatFilters] = useState({});
    const [adaptiveOverscan, setAdaptiveOverscan] = useState(8);
    const frameCount = useRef(0);
    const lastTime = useRef(performance.now());
    useEffect(() => {
        let frameId;
        const checkFps = () => {
            frameCount.current++;
            const now = performance.now();
            if (now - lastTime.current > 1000) {
                const fps = frameCount.current;
                if (fps < 40)
                    setAdaptiveOverscan((prev) => Math.max(4, prev - 1));
                else if (fps > 55)
                    setAdaptiveOverscan((prev) => Math.min(15, prev + 1));
                frameCount.current = 0;
                lastTime.current = now;
            }
            frameId = requestAnimationFrame(checkFps);
        };
        frameId = requestAnimationFrame(checkFps);
        return () => cancelAnimationFrame(frameId);
    }, []);
    const [sort, setSort] = useState(null);
    const [expandedRows, setExpandedRows] = useState(new Set());
    const densityData = useDensity();
    const density = typeof densityData === "string" ? densityData : densityData[0];
    const prefs = useColumnPrefs(tableKey || prefKey || "standard-table", columns.map(c => c.key));
    const getRowIdInternal = useCallback((r) => {
        if (getRowId)
            return getRowId(r);
        const anyR = r;
        return anyR.id || anyR.uuid || String(Math.random());
    }, [getRowId]);
    const toggleRow = useCallback((id) => {
        if (!onSelect || !selected)
            return;
        const next = new Set(selected);
        if (next.has(id))
            next.delete(id);
        else
            next.add(id);
        onSelect?.(next);
        setSelected?.(next);
    }, [onSelect, selected, setSelected]);
    const toggleAll = useCallback(() => {
        if (!onSelect || !selected)
            return;
        if (selected.size === rows.length) {
            onSelect(new Set());
            setSelected?.(new Set());
        }
        else {
            const next = new Set(rows.map(getRowIdInternal));
            onSelect?.(next);
            setSelected?.(next);
        }
    }, [onSelect, selected, rows, getRowIdInternal, setSelected]);
    const toggleExpand = useCallback((id) => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    }, []);
    const clearSelection = useCallback(() => {
        onSelect?.(new Set());
        setSelected?.(new Set());
    }, [onSelect, setSelected]);
    const clearAllFilters = useCallback(() => {
        setTextFilters({});
        setCatFilters({});
    }, []);
    const toggleCat = useCallback((key, val) => {
        setCatFilters((prev) => {
            const next = { ...prev };
            const set = new Set(next[key] || []);
            if (set.has(val))
                set.delete(val);
            else
                set.add(val);
            next[key] = set;
            return next;
        });
    }, []);
    const clearCat = useCallback((key) => {
        setCatFilters((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);
    const renderToolbar = (toolbar, ctx) => {
        if (typeof toolbar === "function") {
            return toolbar(ctx);
        }
        return toolbar;
    };
    const selectedRows = useMemo(() => {
        if (!selected)
            return [];
        return rows.filter((r) => selected.has(getRowIdInternal(r)));
    }, [rows, selected, getRowIdInternal]);
    const colText = useCallback((col, row) => {
        const v = col.value ? col.value(row) : "";
        return v == null ? "" : String(v);
    }, []);
    const matchesFilters = useCallback((r, exceptKey) => {
        for (const c of columns) {
            if (c.key === exceptKey)
                continue;
            if (c.filter === "cat") {
                const sel = catFilters[c.key];
                const text = colText(c, r);
                if (sel && sel.size > 0 && !sel.has(text))
                    return false;
            }
            else if (c.filter === "text") {
                const val = textFilters[c.key];
                if (val) {
                    const t = normalize(val).trim();
                    const text = colText(c, r);
                    if (t && !normalize(text).includes(t))
                        return false;
                }
            }
        }
        return true;
    }, [columns, catFilters, textFilters, colText]);
    const filtered = useMemo(() => rows.filter((r) => matchesFilters(r)), [rows, matchesFilters]);
    const hasFilter = useMemo(() => {
        return columns.some((c) => c.filter === "cat"
            ? (catFilters[c.key]?.size ?? 0) > 0
            : (textFilters[c.key] ?? "").trim().length > 0);
    }, [columns, catFilters, textFilters]);
    const sorted = useMemo(() => {
        if (!sort)
            return filtered;
        const col = columns.find((c) => c.key === sort.key);
        if (!col)
            return filtered;
        const get = (r) => {
            const v = col.sortValue ? col.sortValue(r) : col.value ? col.value(r) : "";
            return v == null ? "" : v;
        };
        const dir = sort.dir === "asc" ? 1 : -1;
        return [...filtered].sort((a, b) => {
            const va = get(a), vb = get(b);
            if (typeof va === "number" && typeof vb === "number")
                return (va - vb) * dir;
            return String(va).localeCompare(String(vb), "vi", { numeric: true }) * dir;
        });
    }, [filtered, sort, columns]);
    const display = sorted;
    const fullDisplay = display;
    const scrollContainerRef = useRef(null);
    const rowVirtualizer = useVirtualizer({
        count: display.length,
        getScrollElement: () => scrollContainerRef.current,
        estimateSize: useCallback(() => (density === "compact" ? 36 : 44), [density]),
        overscan: adaptiveOverscan > 0 ? adaptiveOverscan : 5, // Reduced from 8 to 5 for better performance as per plan
        getItemKey: useCallback((index) => {
            const row = display[index];
            return row ? getRowIdInternal(row) : `row-${index}`;
        }, [display, getRowIdInternal]),
        paddingStart: 0,
        paddingEnd: 0,
    });
    useEffect(() => {
        if (!infiniteScroll?.hasNextPage || infiniteScroll?.isFetchingNextPage)
            return;
        const virtualItems = rowVirtualizer.getVirtualItems();
        if (virtualItems.length === 0)
            return;
        const lastItem = virtualItems[virtualItems.length - 1];
        // Adaptive overscan/loading: Increase buffer slightly for smoother fast scrolling
        if (lastItem.index >= display.length - 8) {
            infiniteScroll.fetchNextPage();
        }
    }, [rowVirtualizer, infiniteScroll?.hasNextPage, infiniteScroll?.isFetchingNextPage, display.length, infiniteScroll]);
    const isClient = typeof window !== "undefined";
    const useIsomorphicLayoutEffect = isClient ? React.useLayoutEffect : useEffect;
    useIsomorphicLayoutEffect(() => {
        rowVirtualizer.measure();
    }, [display.length, rowVirtualizer, density, expandedRows]);
    const totalSize = rowVirtualizer.getTotalSize();
    const virtualRows = rowVirtualizer.getVirtualItems();
    // Systematic Rail: Sync horizontal scroll to a fixed rail if needed.
    // We use the native scrollbar of the container, but style it via .mirats-table-scroll-container
    const paddingTop = virtualRows.length > 0 ? (virtualRows[0]?.start ?? 0) : 0;
    const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;
    const isDragging = useRef(null);
    const startX = useRef(0);
    const startW = useRef(0);
    const onHandleMouseMove = useCallback((e) => {
        if (!isDragging.current)
            return;
        const delta = e.pageX - startX.current;
        const nextW = Math.max(60, startW.current + delta);
        prefs.setWidth(isDragging.current, nextW);
    }, [prefs]);
    const onHandleMouseUp = useCallback(() => {
        isDragging.current = null;
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", onHandleMouseMove);
        document.removeEventListener("mouseup", onHandleMouseUp);
        rowVirtualizer.measure();
    }, [rowVirtualizer, onHandleMouseMove]);
    const onHandleMouseDown = useCallback((e, key, currentWidth) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = key;
        startX.current = e.pageX;
        startW.current = currentWidth;
        document.body.style.cursor = "col-resize";
        document.addEventListener("mousemove", onHandleMouseMove);
        document.addEventListener("mouseup", onHandleMouseUp);
    }, [onHandleMouseMove, onHandleMouseUp]);
    const renderGlobalState = useCallback(() => {
        if (trangThai.loi) {
            const err = trangThai.loi;
            if (errorContent)
                return errorContent;
            const errorInner = (<div className="py-20 flex flex-col items-center justify-center text-center gap-4 border rounded-lg bg-card">
          <div className="text-sm text-destructive font-medium">{String(err)}</div>
          {err.retry && (<Button variant="outline" size="sm" onClick={err.retry}>
              Thử lại
            </Button>)}
        </div>);
            return errorInner;
        }
        if (trangThai.dangTai) {
            if (loadingContent)
                return loadingContent;
            const loadingInner = (<div className="p-4 border rounded-lg bg-card">
          <TableSkeleton cols={columns.length} rows={6}/>
        </div>);
            return loadingInner;
        }
        if (fullDisplay.length === 0 && !trangThai.dangTai) {
            const emptyInner = emptyContent ?? (<div className="text-sm text-muted-foreground italic">
          {hasFilter ? "Không có dòng nào khớp bộ lọc" : (emptyText || "Không có dữ liệu")}
        </div>);
            const emptyContainer = (<div className="py-20 border rounded-lg bg-card text-center">
          {emptyInner}
        </div>);
            return emptyContainer;
        }
        return <div className="hidden" aria-hidden="true"/>;
    }, [trangThai.loi, trangThai.dangTai, errorContent, loadingContent, columns.length, fullDisplay.length, emptyContent, hasFilter, emptyText]);
    const isMobile = isClient && window.innerWidth < BP_PX.md;
    const shownCols = useMemo(() => columns.filter(c => !prefs.hidden.has(c.key)), [columns, prefs.hidden]);
    const exportCols = columns;
    function renderAutoCell(c, r) {
        const val = c.value?.(r);
        if (val === undefined || val === null)
            return KHONG_CO;
        switch (c.type) {
            case "id": return <CodeBadge code={String(val)} title={String(val)}/>;
            case "status": return <StatusBadge domain="thiet_bi" code={String(val)}/>;
            case "taxonomy":
                if (typeof val === "object" && val !== null) {
                    const v = val;
                    return <MauChip ten={v.ten} mau={v.mau}/>;
                }
                return <MauChip ten={String(val)}/>;
            case "user":
                if (typeof val === "object" && val !== null) {
                    const v = val;
                    return (<div className="flex items-center gap-2">
              <UserAvatar name={v.ho_ten || v.ten} email={v.email} url={v.avatar_url || v.url} className="h-6 w-6"/>
              <span className="truncate text-[12px]">{v.ho_ten || v.ten || "—"}</span>
            </div>);
                }
                return (<div className="flex items-center gap-2">
            <UserAvatar name={String(val)} className="h-6 w-6"/>
            <span className="truncate text-[12px]">{String(val)}</span>
          </div>);
            case "number": return <span className="tabular-nums font-mono text-right w-full inline-block pr-1 truncate">{fmtSo(Number(val))}</span>;
            case "currency": return <span className="tabular-nums font-mono text-right w-full inline-block pr-1 truncate">{fmtVND(Number(val))}</span>;
            default: return String(val);
        }
    }
    function renderCellContent(c, r) {
        if (c.render)
            return c.render(r);
        if (c.cell)
            return c.cell(r);
        return renderAutoCell(c, r);
    }
    const sortedColumns = shownCols;
    return (<div className={cn("flex flex-col gap-3 min-h-0 h-full w-full overflow-hidden", className)}>
      {(toolbar || toolbarRight || toolbarLeft) && (<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 shrink-0">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            {toolbarLeft}
            {toolbar && renderToolbar(toolbar, {
                filteredRows: fullDisplay,
                visibleColumns: shownCols,
                allColumns: exportCols,
                pageRows: display,
                selectedRows,
                clear: clearSelection,
            })}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <ColumnVisibilityMenu columns={columns} hidden={prefs.hidden} toggle={prefs.toggle} reset={prefs.reset}/>

            {bulkActions && renderToolbar(bulkActions, {
                filteredRows: fullDisplay,
                visibleColumns: shownCols,
                allColumns: exportCols,
                pageRows: display,
                selectedRows,
                clear: clearSelection,
            })}
            {toolbarRight && renderToolbar(toolbarRight, {
                filteredRows: fullDisplay,
                visibleColumns: shownCols,
                allColumns: exportCols,
                pageRows: display,
                selectedRows,
                clear: clearSelection,
            })}
          </div>
        </div>)}

      {isMobile ? (<div className="space-y-3">
          {fullDisplay.length === 0 ? (renderGlobalState()) : (display.map((r, idx) => {
                const rid = getRowIdInternal(r);
                return (<MobileRecordCard key={`mobile-row-${rid}-${idx}`} row={r} rowIndex={idx} rowId={rid} columns={sortedColumns} selectable={selectable} isSelected={selectable && selected?.has(rid)} isExpanded={expandedRows.has(rid)} onSelect={toggleRow} onExpand={toggleExpand} onRowClick={onRowClick} rowClassName={rowClassName} renderCellContent={renderCellContent} toolbarRight={toolbarRight}/>);
            }))}
        </div>) : (<div className="relative min-h-0 border rounded-md shadow-none bg-background astryx-table-container flex flex-col flex-1 overflow-auto mirats-scroll mirats-table-scroll-container will-change-transform" ref={scrollContainerRef} style={{
                overflowX: 'auto',
                overflowY: 'auto',
                contain: 'content',
                WebkitOverflowScrolling: 'touch',
                transform: 'translate3d(0,0,0)'
            }}>

          <Table className="border-collapse border-separate border-spacing-0 w-full mirats-standard-table-element" style={{
                tableLayout: 'fixed',
                width: 'max-content',
                minWidth: '100%'
            }}>
            <TableHeader className="sticky top-0 z-20 bg-muted/80 backdrop-blur-md">
              <TableRow className="hover:bg-transparent border-b">
                {selectable && (<TableHead className="w-[40px] px-2 text-center sticky left-0 z-30 bg-muted/80">
                    <Checkbox checked={selected?.size === rows.length && rows.length > 0} onCheckedChange={toggleAll}/>
                  </TableHead>)}
                {shownCols.map(c => (<TableHead key={c.key} style={{
                    width: prefs.widths[c.key] || 150,
                    position: c.sticky ? 'sticky' : 'relative',
                    left: c.sticky ? (selectable ? 40 : 0) : undefined,
                    zIndex: c.sticky ? 30 : 20,
                    background: 'inherit'
                }} className={cn("px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground", c.sticky && "border-r border-border/20")}>
                    <div className="flex items-center justify-between gap-2 overflow-hidden">
                      <span className="truncate">{c.header || c.label}</span>
                    </div>
                    <div onMouseDown={(e) => onHandleMouseDown(e, c.key, prefs.widths[c.key] || 150)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 z-10"/>
                  </TableHead>))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fullDisplay.length === 0 ? (<TableRow>
                  <OptimizedCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="p-0 border-0">
                    {renderGlobalState()}
                  </OptimizedCell>
                </TableRow>) : (<Fragment>
                  {paddingTop > 0 && (<TableRow style={{ height: `${paddingTop}px` }} className="hover:bg-transparent border-0">
                      <OptimizedCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="p-0 border-0"/>
                    </TableRow>)}
                  {virtualRows.map(v => {
                    const r = display[v.index];
                    const rid = getRowIdInternal(r);
                    return (<MemoizedTableRow key={rid} className={cn("group transition-colors border-b", rowClassName?.(r))} onClick={() => onRowClick?.(r)} style={{
                            willChange: 'transform',
                            contain: 'layout inline-size',
                            transform: 'translate3d(0,0,0)'
                        }}>
                        {selectable && (<OptimizedCell colKey="selection" className="px-2 text-center w-[40px] sticky left-0 z-10 bg-inherit" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={selected?.has(rid)} onCheckedChange={() => toggleRow(rid)}/>
                          </OptimizedCell>)}
                        {shownCols.map(c => (<OptimizedCell key={c.key} colKey={c.key} rowId={rid} dataHash={String(colText(c, r))} className={cn("px-3 py-2 text-[13px] truncate", c.cellClassName)} style={{
                                width: prefs.widths[c.key] || 150,
                                position: c.sticky ? 'sticky' : 'relative',
                                left: c.sticky ? (selectable ? 40 : 0) : undefined,
                                zIndex: c.sticky ? 10 : 1,
                                background: 'inherit'
                            }}>
                            {renderCellContent(c, r)}
                          </OptimizedCell>))}
                      </MemoizedTableRow>);
                })}
                  {paddingBottom > 0 && (<TableRow style={{ height: `${paddingBottom}px` }} className="hover:bg-transparent border-0">
                      <OptimizedCell colSpan={shownCols.length + (selectable ? 1 : 0)} className="p-0 border-0"/>
                    </TableRow>)}
                </Fragment>)}
            </TableBody>
          </Table>
          
          {fullDisplay.length > 0 && <HorizontalScrollRail containerRef={scrollContainerRef}/>}
        </div>)}
    </div>);
}
