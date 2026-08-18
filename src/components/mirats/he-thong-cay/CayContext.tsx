import React, { createContext, useContext, useState, ReactNode } from "react";
import type { SearchItem, FocusTarget, BadgeFilter, PlGroup } from "./types";

export type DisplayMode = "tree" | "table" | "mindmap" | "health" | "history";

interface CayContextType {
  display: DisplayMode;
  setDisplay: (d: DisplayMode) => void;
  editMode: boolean;
  setEditMode: (e: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  focus: FocusTarget | null;
  setFocus: (f: FocusTarget | null) => void;
  badgeFilter: BadgeFilter;
  setBadgeFilter: (f: BadgeFilter | ((prev: BadgeFilter) => BadgeFilter)) => void;
  groupMode: "phanloai" | "donvi";
  setGroupMode: (m: "phanloai" | "donvi") => void;
  groupByLoai: boolean;
  setGroupByLoai: (b: boolean) => void;
  viewTree: PlGroup[];
  setViewTree: (t: PlGroup[]) => void;
  reorgOpen: boolean;
  setReorgOpen: (b: boolean) => void;
  groupCode: string;
  setGroupCode: (s: string) => void;
}

export const CayContext = createContext<CayContextType | undefined>(undefined);

export function CayProvider({ children }: { children: ReactNode }) {
  const [display, setDisplay] = useState<DisplayMode>("tree");

  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["root"]));
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>({ status: new Set(), imp: new Set() });
  const [groupMode, setGroupMode] = useState<"phanloai" | "donvi">("phanloai");
  const [groupByLoai, setGroupByLoai] = useState(false);
  const [viewTree, setViewTree] = useState<PlGroup[]>([]);
  const [reorgOpen, setReorgOpen] = useState(false);
  const [groupCode, setGroupCode] = useState("");

  const seededTreeRef = React.useRef<string>("");
  React.useEffect(() => {
    // Generate a simple fingerprint of the tree structure to detect real changes
    const fingerprint = viewTree.map(pl => `${pl.id}:${pl.count}`).join("|");
    if (viewTree.length > 0 && seededTreeRef.current !== fingerprint) {
      seededTreeRef.current = fingerprint;
      setExpandedNodes(prev => {
        const next = new Set(prev);
        // Always ensure root and stopped are expanded
        next.add("root");
        next.add("root-stopped");
        
        viewTree.forEach(pl => {
          next.add(`pl:${pl.id}`);
          pl.fields.forEach(lv => {
            if (lv.id && lv.id !== "all") next.add(`lv:${pl.id}:${lv.id}`);
            // Expand first few groups by default to show some data
            lv.groups.slice(0, 3).forEach(nh => next.add(`nh:${pl.id}:${nh.ma}`));
          });
        });
        return next;
      });
    }
  }, [viewTree]);

  const toggleNode = React.useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <CayContext.Provider
      value={{
        display, setDisplay,
        editMode, setEditMode,
        searchQuery, setSearchQuery,
        expandedNodes, toggleNode,
        focus, setFocus,
        badgeFilter, setBadgeFilter,
        groupMode, setGroupMode,
        groupByLoai, setGroupByLoai,
        viewTree, setViewTree,
        reorgOpen, setReorgOpen,
        groupCode, setGroupCode,
      }}
    >
      {children}
    </CayContext.Provider>
  );
}

export function useCayContext() {
  const ctx = useContext(CayContext);
  if (!ctx) throw new Error("useCayContext must be used within a CayProvider");
  return ctx;
}