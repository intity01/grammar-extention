var t = ((t) => (
  (t.THAI = "th"),
  (t.ENGLISH = "en"),
  (t.JAPANESE = "ja"),
  (t.UNKNOWN = "unknown"),
  t
))(t || {});
const e = "dictionaries";
const r = new (class {
  constructor() {
    ((this.db = null), (this.initPromise = null));
  }
  async init() {
    if (!this.db)
      return (
        this.initPromise ||
          (this.initPromise = new Promise((t, r) => {
            const i = indexedDB.open("GrammarCheckerDB", 1);
            ((i.onerror = () => {
              r(new Error(`Failed to open IndexedDB: ${i.error}`));
            }),
              (i.onsuccess = () => {
                ((this.db = i.result), t());
              }),
              (i.onupgradeneeded = (t) => {
                const r = t.target.result;
                if (!r.objectStoreNames.contains(e)) {
                  const t = r.createObjectStore(e, { keyPath: "language" });
                  (t.createIndex("version", "version", { unique: !1 }),
                    t.createIndex("lastUpdated", "metadata.lastUpdated", {
                      unique: !1,
                    }));
                }
              }));
          })),
        this.initPromise
      );
  }
  async storeDictionary(t) {
    return (
      await this.init(),
      new Promise((r, i) => {
        if (!this.db) return void i(new Error("Database not initialized"));
        const n = this.db.transaction([e], "readwrite").objectStore(e).put(t);
        ((n.onsuccess = () => r()),
          (n.onerror = () =>
            i(new Error(`Failed to store dictionary: ${n.error}`))));
      })
    );
  }
  async loadDictionary(t) {
    return (
      await this.init(),
      new Promise((r, i) => {
        if (!this.db) return void i(new Error("Database not initialized"));
        const n = this.db.transaction([e], "readonly").objectStore(e).get(t);
        ((n.onsuccess = () => {
          r(n.result || null);
        }),
          (n.onerror = () =>
            i(new Error(`Failed to load dictionary: ${n.error}`))));
      })
    );
  }
  async hasDictionary(t) {
    return null !== (await this.loadDictionary(t));
  }
  async getDictionaryMetadata(t) {
    const e = await this.loadDictionary(t);
    return e ? e.metadata : null;
  }
  async deleteDictionary(t) {
    return (
      await this.init(),
      new Promise((r, i) => {
        if (!this.db) return void i(new Error("Database not initialized"));
        const n = this.db
          .transaction([e], "readwrite")
          .objectStore(e)
          .delete(t);
        ((n.onsuccess = () => r()),
          (n.onerror = () =>
            i(new Error(`Failed to delete dictionary: ${n.error}`))));
      })
    );
  }
  async listDictionaries() {
    return (
      await this.init(),
      new Promise((t, r) => {
        if (!this.db) return void r(new Error("Database not initialized"));
        const i = this.db.transaction([e], "readonly").objectStore(e).getAll();
        ((i.onsuccess = () => {
          const e = i.result;
          t(e.map((t) => t.metadata));
        }),
          (i.onerror = () =>
            r(new Error(`Failed to list dictionaries: ${i.error}`))));
      })
    );
  }
  async clearAll() {
    return (
      await this.init(),
      new Promise((t, r) => {
        if (!this.db) return void r(new Error("Database not initialized"));
        const i = this.db.transaction([e], "readwrite").objectStore(e).clear();
        ((i.onsuccess = () => t()),
          (i.onerror = () =>
            r(new Error(`Failed to clear dictionaries: ${i.error}`))));
      })
    );
  }
  close() {
    this.db && (this.db.close(), (this.db = null), (this.initPromise = null));
  }
})();
async function i() {
  const e = [t.THAI, t.ENGLISH, t.JAPANESE],
    i = "1.0.0";
  for (const t of e) {
    if (!(await r.hasDictionary(t)))
      try {
        const e = `dictionaries/${t}.dat.br`,
          n = await fetch(chrome.runtime.getURL(e));
        if (!n.ok) throw new Error(`Failed to fetch ${e}: ${n.statusText}`);
        const a = await n.arrayBuffer(),
          o = new Response(
            new Response(a).body.pipeThrough(new DecompressionStream("br")),
          ),
          s = await o.arrayBuffer(),
          c = {
            language: t,
            version: i,
            data: s,
            metadata: {
              language: t,
              version: i,
              size: s.byteLength,
              lastUpdated: Date.now(),
            },
          };
        await r.storeDictionary(c);
      } catch (n) {}
  }
}
async function n(t) {
  const e = await r.loadDictionary(t);
  return e ? e.data : null;
}
export { t as L, i as h, n as l };
