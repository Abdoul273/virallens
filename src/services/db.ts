/** Tiny IndexedDB wrapper for saved analyses (no dependency). */
import type { SavedAnalysis } from "@/types";

const DB_NAME = "viralLens";
const DB_VERSION = 1;
const STORE = "analyses";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined")
      return reject(new Error("IndexedDB indisponible dans ce navigateur."));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: "id" });
        s.createIndex("createdAt", "createdAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(new Error("Impossible d’ouvrir le stockage local (navigation privée ?)."));
    };
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error("Erreur IndexedDB"));
        t.onabort = () => reject(t.error ?? new Error("Stockage plein ou transaction annulée."));
      }),
  );
}

export const db = {
  async list(): Promise<SavedAnalysis[]> {
    const all = await tx<SavedAnalysis[]>("readonly", (s) => s.getAll());
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  get: (id: string) => tx<SavedAnalysis | undefined>("readonly", (s) => s.get(id)),
  save: (a: SavedAnalysis) => tx("readwrite", (s) => s.put(a)).then(() => a),
  remove: (id: string) => tx("readwrite", (s) => s.delete(id)).then(() => undefined),
  clear: () => tx("readwrite", (s) => s.clear()).then(() => undefined),
};
