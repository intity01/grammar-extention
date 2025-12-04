import { L as e, h as t } from "./chunks/dictionaryStorage-7TWGKNbx.js";
import {
  i as r,
  l as n,
  r as a,
  a as o,
  b as s,
} from "./chunks/telemetry-LsNYD_7L.js";
const c = {},
  i = function (e, t, r) {
    let n = Promise.resolve();
    if (t && t.length > 0) {
      document.getElementsByTagName("link");
      const e = document.querySelector("meta[property=csp-nonce]"),
        r = e?.nonce || e?.getAttribute("nonce");
      n = Promise.allSettled(
        t.map((e) => {
          if (
            (e = (function (e) {
              return "/" + e;
            })(e)) in c
          )
            return;
          c[e] = !0;
          const t = e.endsWith(".css"),
            n = t ? '[rel="stylesheet"]' : "";
          if (document.querySelector(`link[href="${e}"]${n}`)) return;
          const a = document.createElement("link");
          return (
            (a.rel = t ? "stylesheet" : "modulepreload"),
            t || (a.as = "script"),
            (a.crossOrigin = ""),
            (a.href = e),
            r && a.setAttribute("nonce", r),
            document.head.appendChild(a),
            t
              ? new Promise((t, r) => {
                  (a.addEventListener("load", t),
                    a.addEventListener("error", () =>
                      r(new Error(`Unable to preload CSS for ${e}`)),
                    ));
                })
              : void 0
          );
        }),
      );
    }
    function a(e) {
      const t = new Event("vite:preloadError", { cancelable: !0 });
      if (((t.payload = e), window.dispatchEvent(t), !t.defaultPrevented))
        throw e;
    }
    return n.then((t) => {
      for (const e of t || []) "rejected" === e.status && a(e.reason);
      return e().catch(a);
    });
  };
function l(t) {
  return t === e.THAI || t === e.ENGLISH || t === e.JAPANESE;
}
function u(e) {
  return (
    "object" == typeof e &&
    null !== e &&
    "boolean" == typeof e.enabled &&
    (function (e) {
      return "inline" === e || "clipboard" === e;
    })(e.correctionMode) &&
    Array.isArray(e.languages) &&
    e.languages.every(l) &&
    "number" == typeof e.debounceDelay &&
    e.debounceDelay >= 0 &&
    (function (e) {
      return "balanced" === e || "fast" === e || "accurate" === e;
    })(e.performanceMode)
  );
}
const d = {
  enabled: !0,
  correctionMode: "inline",
  languages: [e.THAI, e.ENGLISH, e.JAPANESE],
  debounceDelay: 300,
  performanceMode: "balanced",
};
async function m() {
  try {
    const e = await chrome.storage.sync.get("settings");
    return e.settings && u(e.settings) ? { ...d, ...e.settings } : d;
  } catch (e) {
    return d;
  }
}
async function f(e) {
  try {
    const t = { ...(await m()), ...e };
    if (!u(t)) throw new Error("Invalid settings: failed type validation");
    return (await chrome.storage.sync.set({ settings: t }), t);
  } catch (t) {
    throw t;
  }
}
const h = new Map();
async function y(t) {
  if (t === e.UNKNOWN) return [];
  try {
    const e = `rules/${t}.json`,
      r = await fetch(chrome.runtime.getURL(e));
    if (!r.ok) return [];
    const n = await r.json();
    return (function (e) {
      if (!e || "object" != typeof e) return !1;
      if (!e.language || !e.version || !Array.isArray(e.rules)) return !1;
      for (const t of e.rules)
        if (
          !(
            t.id &&
            t.language &&
            t.pattern &&
            t.errorType &&
            t.message &&
            t.correction &&
            t.severity &&
            "boolean" == typeof t.enabled
          )
        )
          return !1;
      return !0;
    })(n)
      ? n.rules
      : [];
  } catch (r) {
    return [];
  }
}
function w(e) {
  const t = `${e.id}:${e.pattern}`;
  let r = h.get(t);
  if (!r)
    try {
      ((r = new RegExp(e.pattern, "gu")), h.set(t, r));
    } catch (n) {
      ((r = /(?!)/), h.set(t, r));
    }
  return { ...e, compiledPattern: r };
}
r();
let g = null,
  p = 0;
const E = new Map(),
  _ = new Map(),
  A = new Set(),
  L = new Set();
let b = null,
  T = !1;
const k = [];
let M = !1;
const S = new Map();
async function v() {
  try {
    (await chrome.contextMenus.removeAll(),
      chrome.contextMenus.create({
        id: "grammar-check-selection",
        title: "Check Grammar",
        contexts: ["selection"],
      }));
  } catch (e) {}
}
async function x(e, t) {
  const r = await new Promise((r, n) => {
    const a = "msg_" + ++p,
      o =
        (g ||
          ((g = new Worker(
            new URL("/assets/index-srflSMRx.js", import.meta.url),
            { type: "module" },
          )),
          (g.onmessage = (e) => {
            const { id: t, type: r, payload: n, error: a } = e.data;
            if (t && E.has(t)) {
              const { resolve: e, reject: o } = E.get(t);
              (E.delete(t),
                "ERROR" === r || a ? o(new Error(a || "Worker error")) : e(n));
            }
          }),
          (g.onerror = (e) => {
            (R(), (g = null));
          })),
        g);
    (E.set(a, { resolve: r, reject: n }),
      setTimeout(() => {
        E.has(a) && (E.delete(a), n(new Error("Worker timeout")));
      }, 5e3),
      o.postMessage({ type: e, payload: t, id: a }));
  });
  return (
    "LOAD_DICTIONARY" === e && r && A.add(t.language),
    "LOAD_RULES" === e && r && L.add(t.language),
    r
  );
}
function R() {
  g && (g.terminate(), (g = null), E.clear());
}
async function I(e) {
  const t = performance.now();
  try {
    const r = await x("ANALYZE", { text: e }),
      n = performance.now() - t;
    return (
      a("worker_analyze", n, {
        textLength: e.length,
        errorCount: r.errors?.length || 0,
      }),
      r
    );
  } catch (r) {
    (o(r, "analyzeTextViaWorker"), s("worker_recovery_attempt"), R());
    try {
      for (const e of A) await x("LOAD_DICTIONARY", { language: e });
      for (const e of L) await x("LOAD_RULES", { language: e });
      const r = await x("ANALYZE", { text: e });
      s("worker_recovery_success");
      const n = performance.now() - t;
      return (
        a("worker_analyze_recovered", n, {
          textLength: e.length,
          errorCount: r.errors?.length || 0,
        }),
        r
      );
    } catch (n) {
      throw (
        o(n, "analyzeTextViaWorker_recovery"),
        s("worker_recovery_failed"),
        n
      );
    }
  }
}
async function C() {
  if ("getContexts" in chrome.runtime) {
    return (
      (
        await chrome.runtime.getContexts({
          contextTypes: ["OFFSCREEN_DOCUMENT"],
        })
      ).length > 0
    );
  }
  return T;
}
async function N(e) {
  return new Promise((t, r) => {
    (k.push({ text: e, resolve: t, reject: r }), O());
  });
}
async function O() {
  if (M || 0 === k.length) return;
  M = !0;
  const e = k.shift(),
    t = performance.now();
  try {
    await (async function () {
      (await C())
        ? (T = !0)
        : (b ||
            (b = chrome.offscreen
              .createDocument({
                url: chrome.runtime.getURL("offscreen.html"),
                reasons: ["CLIPBOARD"],
                justification:
                  "Write corrected text to clipboard without user gesture",
              })
              .then(() => {
                ((T = !0), (b = null));
              })
              .catch((e) => {
                throw ((b = null), e);
              })),
          await b);
    })();
    const r = await (async function (e) {
      return new Promise((t, r) => {
        chrome.runtime.sendMessage(e, (e) => {
          chrome.runtime.lastError
            ? r(new Error(chrome.runtime.lastError.message))
            : t(e);
        });
      });
    })({ type: "WRITE_TO_CLIPBOARD", text: e.text });
    if (!r.success) throw new Error(r.error || "Failed to write to clipboard");
    const n = performance.now() - t;
    (a("clipboard_write", n, { textLength: e.text.length }),
      s("clipboard_write_success"),
      e.resolve(),
      setTimeout(async () => {
        0 !== k.length ||
          M ||
          (await (async function () {
            if (await C())
              try {
                (await chrome.offscreen.closeDocument(), (T = !1));
              } catch (e) {}
          })(),
          s("offscreen_auto_cleanup"));
      }, 3e4));
  } catch (r) {
    (o(r, "processClipboardQueue"),
      s("clipboard_write_failed"),
      e.reject(r instanceof Error ? r : new Error(String(r))));
  } finally {
    ((M = !1), k.length > 0 && O());
  }
}
async function D(e) {
  if (S.has(e)) return S.get(e);
  try {
    const t = (function (e) {
      return e.map(w);
    })(await y(e));
    return (S.set(e, t), t);
  } catch (t) {
    return [];
  }
}
(chrome.runtime.onInstalled.addListener(async (e) => {
  try {
    if ("install" === e.reason) {
      const e = { ...d };
      (await f(e), await t(), await v());
    } else if ("update" === e.reason) {
      e.previousVersion;
      await v();
    }
  } catch (r) {
    n(r, { context: "onInstalled" });
  }
}),
  chrome.runtime.onStartup.addListener(async () => {
    try {
      (await v(), await m());
    } catch (e) {}
  }),
  self.addEventListener("activate", (e) => {
    e.waitUntil(self.clients.claim());
  }),
  chrome.contextMenus.onClicked.addListener(async (e, t) => {
    if ("grammar-check-selection" === e.menuItemId && e.selectionText)
      try {
        const r = await I(e.selectionText);
        t?.id &&
          (await chrome.tabs.sendMessage(t.id, {
            type: "CONTEXT_MENU_ANALYSIS",
            payload: r,
          }));
      } catch (r) {}
  }),
  chrome.runtime.onConnect.addListener((e) => {
    if ("keep-alive" === e.name) {
      const t = e.sender?.tab?.id;
      t &&
        (_.set(t, e),
        e.onDisconnect.addListener(() => {
          _.delete(t);
        }),
        e.postMessage({ type: "KEEP_ALIVE_ACK" }));
    }
  }),
  chrome.tabs.onRemoved.addListener((e) => {
    _.has(e) && _.delete(e);
  }),
  chrome.runtime.onMessage.addListener(
    (e, t, r) => (
      (async () => {
        try {
          switch (e.type) {
            case "ANALYZE_TEXT": {
              const t = await I(e.payload.text);
              r({ success: !0, result: t });
              break;
            }
            case "GET_SETTINGS": {
              const e = await m();
              r({ success: !0, settings: e });
              break;
            }
            case "UPDATE_SETTINGS": {
              const t = await f(e.payload);
              r({ success: !0, settings: t });
              break;
            }
            case "APPLY_CORRECTION":
              "clipboard" === (await m()).correctionMode
                ? (await N(e.payload.correctedText),
                  r({ success: !0, mode: "clipboard" }))
                : r({ success: !0, mode: "inline" });
              break;
            case "GET_GRAMMAR_RULES": {
              const { language: t } = e.payload,
                n = await (async function (e) {
                  return D(e);
                })(t);
              r({ success: !0, rules: n });
              break;
            }
            case "GET_TELEMETRY": {
              const { getAllMetrics: e, getHealthStatus: t } =
                  await i(async () => {
                    const { getAllMetrics: e, getHealthStatus: t } =
                      await import("./chunks/telemetry-LsNYD_7L.js").then(
                        (e) => e.t,
                      );
                    return { getAllMetrics: e, getHealthStatus: t };
                  }, []),
                n = e(),
                a = t();
              r({ success: !0, metrics: n, health: a });
              break;
            }
            case "CLEAR_TELEMETRY": {
              const { clearMetrics: e } = await i(async () => {
                const { clearMetrics: e } =
                  await import("./chunks/telemetry-LsNYD_7L.js").then(
                    (e) => e.t,
                  );
                return { clearMetrics: e };
              }, []);
              (e(), r({ success: !0 }));
              break;
            }
            default:
              r({ success: !1, error: "Unknown message type" });
          }
        } catch (t) {
          r({ success: !1, error: t instanceof Error ? t.message : String(t) });
        }
      })(),
      !0
    ),
  ));
