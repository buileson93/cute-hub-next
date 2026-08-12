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
}

const CayContext = createContext<CayContextType | undefined>(undefined);

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

  const initialSeedRef = React.useRef(false);
  React.useEffect(() => {
    if (!initialSeedRef.current && viewTree.length > 0) {
      initialSeedRef.current = true;
      setExpandedNodes(prev => {
        const next = new Set(prev);
        viewTree.forEach(pl => next.add(`pl:${pl.id}`));
        return next;
      });
    }
  }, [viewTree]);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
