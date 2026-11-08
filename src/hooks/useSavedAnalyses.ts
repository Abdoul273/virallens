import { useEffect, useState } from "react";
import { useApp } from "@/app/AppContext";
import { db } from "@/services/db";
import type { SavedAnalysis } from "@/types";

/** Loads analyses from IndexedDB; reloads when `dataVersion` changes. */
export function useSavedAnalyses() {
  const { dataVersion } = useApp();
  const [items, setItems] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    db.list()
      .then((r) => alive && (setItems(r), setError(null)))
      .catch((e: Error) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [dataVersion, reloadKey]);

  return { items, loading, error, reload: () => setReloadKey((n) => n + 1) };
}
