import { L as e, h as t } from "./chunks/dictionaryStorage-7TWGKNbx.js";
const r = {
  enabled: !0,
  correctionMode: "inline",
  languages: [e.THAI, e.ENGLISH, e.JAPANESE],
  debounceDelay: 300,
  performanceMode: "balanced",
};
async function n() {
  try {
    const e = await chrome.storage.sync.get("settings");
    return e.settings ? { ...r, ...e.settings } : r;
  } catch (e) {
    return r;
  }
}
async function a(e) {
  try {
    const t = { ...(await n()), ...e };
    if ("inline" !== t.correctionMode && "clipboard" !== t.correctionMode)
      throw new Error(`Invalid correctionMode: ${t.correctionMode}`);
    if (
      "balanced" !== t.performanceMode &&
      "fast" !== t.performanceMode &&
      "accurate" !== t.performanceMode
    )
      throw new Error(`Invalid performanceMode: ${t.performanceMode}`);
    if (t.debounceDelay < 0)
      throw new Error("debounceDelay must be non-negative");
    return (await chrome.storage.sync.set({ settings: t }), t);
  } catch (t) {
    throw t;
  }
}
const o = new Map();
async function c(t) {
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
function s(e) {
  const t = `${e.id}:${e.pattern}`;
  let r = o.get(t);
  if (!r)
    try {
      ((r = new RegExp(e.pattern, "gu")), o.set(t, r));
    } catch (n) {
      ((r = /(?!)/), o.set(t, r));
    }
  return { ...e, compiledPattern: r };
}
let i = null,
  u = 0;
const l = new Map(),
  d = new Map();
let m = null,
  w = !1;
const f = new Map();
async function y() {
  try {
    (await chrome.contextMenus.removeAll(),
      chrome.contextMenus.create({
        id: "grammar-check-selection",
        title: "Check Grammar",
        contexts: ["selection"],
      }));
  } catch (e) {}
}
function h(e, t) {
  return new Promise((r, n) => {
    const a = "msg_" + ++u,
      o =
        (i ||
          ((i = new Worker(
            new URL("/assets/index-DJIDTDW9.js", import.meta.url),
            { type: "module" },
          )),
          (i.onmessage = (e) => {
            const { id: t, type: r, payload: n, error: a } = e.data;
            if (t && l.has(t)) {
              const { resolve: e, reject: o } = l.get(t);
              (l.delete(t),
                "ERROR" === r || a ? o(new Error(a || "Worker error")) : e(n));
            }
          }),
          (i.onerror = (e) => {
            (p(), (i = null));
          })),
        i);
    (l.set(a, { resolve: r, reject: n }),
      setTimeout(() => {
        l.has(a) && (l.delete(a), n(new Error("Worker timeout")));
      }, 5e3),
      o.postMessage({ type: e, payload: t, id: a }));
  });
}
function p() {
  i && (i.terminate(), (i = null), l.clear());
}
async function g(e) {
  try {
    return await h("ANALYZE", { text: e });
  } catch (t) {
    p();
    try {
      return await h("ANALYZE", { text: e });
    } catch (r) {
      throw r;
    }
  }
}
async function E() {
  if ("getContexts" in chrome.runtime) {
    return (
      (
        await chrome.runtime.getContexts({
          contextTypes: ["OFFSCREEN_DOCUMENT"],
        })
      ).length > 0
    );
  }
  return w;
}
async function M(e) {
  try {
    await (async function () {
      (await E())
        ? (w = !0)
        : (m ||
            (m = chrome.offscreen
              .createDocument({
                url: chrome.runtime.getURL("offscreen.html"),
                reasons: ["CLIPBOARD"],
                justification:
                  "Write corrected text to clipboard without user gesture",
              })
              .then(() => {
                ((w = !0), (m = null));
              })
              .catch((e) => {
                throw ((m = null), e);
              })),
          await m);
    })();
    const t = await (async function (e) {
      return new Promise((t, r) => {
        chrome.runtime.sendMessage(e, (e) => {
          chrome.runtime.lastError
            ? r(new Error(chrome.runtime.lastError.message))
            : t(e);
        });
      });
    })({ type: "WRITE_TO_CLIPBOARD", text: e });
    if (!t.success) throw new Error(t.error || "Failed to write to clipboard");
    setTimeout(async () => {
      await (async function () {
        if (await E())
          try {
            (await chrome.offscreen.closeDocument(), (w = !1));
          } catch (e) {}
      })();
    }, 3e4);
  } catch (t) {
    throw t;
  }
}
async function T(e) {
  if (f.has(e)) return f.get(e);
  try {
    const t = (function (e) {
      return e.map(s);
    })(await c(e));
    return (f.set(e, t), t);
  } catch (t) {
    return [];
  }
}
(chrome.runtime.onInstalled.addListener(async (e) => {
  try {
    if ("install" === e.reason) {
      const e = { ...r };
      (await a(e), await t(), await y());
    } else if ("update" === e.reason) {
      e.previousVersion;
      await y();
    }
  } catch (n) {}
}),
  chrome.runtime.onStartup.addListener(async () => {
    try {
      (await y(), await n());
    } catch (e) {}
  }),
  self.addEventListener("activate", (e) => {
    e.waitUntil(self.clients.claim());
  }),
  chrome.contextMenus.onClicked.addListener(async (e, t) => {
    if ("grammar-check-selection" === e.menuItemId && e.selectionText)
      try {
        const r = await g(e.selectionText);
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
        (d.set(t, e),
        e.onDisconnect.addListener(() => {
          d.delete(t);
        }),
        e.postMessage({ type: "KEEP_ALIVE_ACK" }));
    }
  }),
  chrome.tabs.onRemoved.addListener((e) => {
    d.has(e) && d.delete(e);
  }),
  chrome.runtime.onMessage.addListener(
    (e, t, r) => (
      (async () => {
        try {
          switch (e.type) {
            case "ANALYZE_TEXT": {
              const t = await g(e.payload.text);
              r({ success: !0, result: t });
              break;
            }
            case "GET_SETTINGS": {
              const e = await n();
              r({ success: !0, settings: e });
              break;
            }
            case "UPDATE_SETTINGS": {
              const t = await a(e.payload);
              r({ success: !0, settings: t });
              break;
            }
            case "APPLY_CORRECTION":
              "clipboard" === (await n()).correctionMode
                ? (await M(e.payload.correctedText),
                  r({ success: !0, mode: "clipboard" }))
                : r({ success: !0, mode: "inline" });
              break;
            case "GET_GRAMMAR_RULES": {
              const { language: t } = e.payload,
                n = await (async function (e) {
                  return T(e);
                })(t);
              r({ success: !0, rules: n });
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
