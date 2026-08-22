import { useState, useEffect, useMemo } from "react";
import { MiniSearchAdapter, SearchResultItem } from "./engine";
import { SearchSyncManager } from "./sync";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useOcrSearch() {
  const [engine] = useState(() => new MiniSearchAdapter());
  const [syncManager] = useState(() => new SearchSyncManager(engine));
  const [isReady, setIsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const partitionKey = `default:${session.user.id}`; // Simple partition for now

      try {
        // 1. Load existing data from IndexedDB to engine
        await syncManager.loadFromLocal(partitionKey);
        if (mounted) setIsReady(true);

        // 2. Perform background sync
        setIsSyncing(true);
        await syncManager.sync(partitionKey);
      } catch (err) {
        console.error("OCR Search Init Error:", err);
        // Fallback or notification as per requirement
        toast.error("Không thể đồng bộ dữ liệu tìm kiếm offline.");
      } finally {
        if (mounted) setIsSyncing(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [syncManager]);

  const search = (query: string) => {
    if (!isReady || !query.trim()) return [];
    return engine.search(query);
  };

  return {
    search,
    isReady,
    isSyncing,
  };
}
