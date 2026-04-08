import { useState, useEffect, useCallback } from "react";
import {
  mockSyncRuns as baseSyncRuns,
  mockItems as baseItems,
} from "@/lib/mockData";

// Simulates real-time changes to sync stats and file metrics
export function useLiveData(pollInterval = 3000) {
  const [tick, setTick] = useState(0);
  const [liveSync, setLiveSync] = useState(baseSyncRuns.map(s => ({ ...s, stats_json: { ...s.stats_json } })));
  const [liveFileCount, setLiveFileCount] = useState(baseItems.filter(i => i.item_type === "file").length);
  const [liveTotalSize, setLiveTotalSize] = useState(baseItems.filter(i => i.item_type === "file").reduce((a, i) => a + i.size, 0));
  const [liveItemsSynced, setLiveItemsSynced] = useState(liveSync.reduce((a, s) => a + s.stats_json.items_synced, 0));

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);

      // Simulate sync progress
      setLiveSync(prev => prev.map(s => {
        if (s.status === "running") {
          const added = Math.floor(Math.random() * 5) + 1;
          return {
            ...s,
            stats_json: {
              ...s.stats_json,
              items_synced: s.stats_json.items_synced + added,
              items_added: s.stats_json.items_added + (Math.random() > 0.6 ? 1 : 0),
              items_modified: s.stats_json.items_modified + (Math.random() > 0.7 ? 1 : 0),
            },
          };
        }
        return s;
      }));

      // Simulate file count and size fluctuations
      setLiveFileCount(prev => prev + (Math.random() > 0.5 ? 1 : 0));
      setLiveTotalSize(prev => prev + Math.floor(Math.random() * 524288));
      setLiveItemsSynced(prev => prev + Math.floor(Math.random() * 8) + 1);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval]);

  return { tick, liveSync, liveFileCount, liveTotalSize, liveItemsSynced };
}
