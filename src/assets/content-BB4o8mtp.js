import {
  c as e,
  b as t,
  r as n,
  l as o,
  a as r,
} from "./chunks/telemetry-LsNYD_7L.js";
class i {
  constructor(e, t = 300) {
    ((this.observedFields = new Map()),
      (this.activeField = null),
      (this.debounceTimers = new Map()),
      (this.debounceDelay = 300),
      (this.callbacks = e),
      (this.debounceDelay = t));
  }
  observeField(e) {
    if (this.observedFields.has(e)) return;
    const t = new AbortController(),
      n = t.signal;
    ((this.isContentEditable(e) || this.isTextInput(e)) &&
      (e.addEventListener("input", this.handleInput.bind(this), { signal: n }),
      e.addEventListener("focus", this.handleFocus.bind(this), { signal: n }),
      e.addEventListener("blur", this.handleBlur.bind(this), { signal: n })),
      this.observedFields.set(e, t));
  }
  unobserveField(e) {
    const t = this.observedFields.get(e);
    t && (t.abort(), this.observedFields.delete(e));
    const n = this.debounceTimers.get(e);
    (n && (clearTimeout(n), this.debounceTimers.delete(e)),
      this.activeField === e && (this.activeField = null),
      this.callbacks.onFieldUnobserved && this.callbacks.onFieldUnobserved(e));
  }
  getActiveField() {
    return this.activeField;
  }
  extractText(e) {
    return this.isContentEditable(e)
      ? e.textContent || ""
      : (this.isTextInput(e) && e.value) || "";
  }
  setText(e, t, n) {
    if (this.isContentEditable(e))
      ((e.textContent = t), void 0 !== n && this.setCursorPosition(e, n));
    else if (this.isTextInput(e)) {
      const o = e;
      ((o.value = t),
        void 0 !== n && ((o.selectionStart = n), (o.selectionEnd = n)));
    }
  }
  handleInput(e) {
    const t = e.target;
    if (t !== this.activeField) return;
    const n = this.debounceTimers.get(t);
    n && clearTimeout(n);
    const o = window.setTimeout(() => {
      const e = this.extractText(t);
      (this.callbacks.onTextChange(e, t), this.debounceTimers.delete(t));
    }, this.debounceDelay);
    this.debounceTimers.set(t, o);
  }
  handleFocus(e) {
    const t = e.target;
    this.activeField = t;
  }
  handleBlur(e) {
    const t = e.target;
    this.activeField === t && (this.activeField = null);
  }
  isContentEditable(e) {
    return "true" === e.contentEditable || e.isContentEditable;
  }
  isTextInput(e) {
    return (
      e instanceof HTMLTextAreaElement ||
      (e instanceof HTMLInputElement &&
        ("text" === e.type ||
          "email" === e.type ||
          "search" === e.type ||
          "url" === e.type))
    );
  }
  setCursorPosition(e, t) {
    const n = document.createRange(),
      o = window.getSelection();
    if (o)
      try {
        const r = this.getTextNodeAtPosition(e, t);
        r &&
          (n.setStart(r.node, r.offset),
          n.collapse(!0),
          o.removeAllRanges(),
          o.addRange(n));
      } catch (r) {}
  }
  getTextNodeAtPosition(e, t) {
    let n = 0;
    const o = document.createTreeWalker(e, NodeFilter.SHOW_TEXT, null);
    let r;
    for (; (r = o.nextNode()); ) {
      const e = r.textContent?.length || 0;
      if (n + e >= t) return { node: r, offset: t - n };
      n += e;
    }
    return null;
  }
  dispose() {
    (this.debounceTimers.forEach((e) => clearTimeout(e)),
      this.debounceTimers.clear(),
      this.observedFields.forEach((e, t) => {
        e.abort();
      }),
      this.observedFields.clear(),
      (this.activeField = null));
  }
}
const s = [
  "box-sizing",
  "font-family",
  "font-size",
  "font-style",
  "font-variant",
  "font-weight",
  "letter-spacing",
  "line-height",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "text-indent",
  "text-transform",
  "white-space",
  "word-spacing",
  "word-wrap",
  "word-break",
  "tab-size",
  "overflow-wrap",
];
function a(e, t) {
  const n = (function (e) {
      const t = document.createElement("div"),
        n = window.getComputedStyle(e);
      return (
        s.forEach((e) => {
          t.style[e] = n.getPropertyValue(e);
        }),
        (t.style.position = "absolute"),
        (t.style.visibility = "hidden"),
        (t.style.overflow = "hidden"),
        (t.style.whiteSpace = "pre-wrap"),
        (t.style.wordWrap = "break-word"),
        (t.style.top = "0"),
        (t.style.left = "0"),
        (t.style.width = `${e.clientWidth}px`),
        (t.style.height = `${e.clientHeight}px`),
        (t.style.pointerEvents = "none"),
        document.body.appendChild(t),
        t
      );
    })(e),
    o = e.value,
    r = o.substring(0, t.start),
    i = o.substring(t.start, t.end);
  n.innerHTML = "";
  const a = document.createElement("span");
  ((a.textContent = r), n.appendChild(a));
  const c = document.createElement("span");
  ((c.textContent = i), (c.style.display = "inline"), n.appendChild(c));
  const l = e.getBoundingClientRect(),
    d = c.getBoundingClientRect(),
    u = {
      x: d.left - l.left + e.scrollLeft,
      y: d.top - l.top + e.scrollTop,
      width: d.width,
      height: d.height,
    };
  return (document.body.removeChild(n), u);
}
function c(e, t) {
  const n = document.createRange();
  const o = (function (e, t, n, o = 0) {
    let r = o,
      i = null,
      s = 0,
      a = null,
      c = 0,
      l = !1,
      d = !1;
    return (
      (function e(o) {
        if (!l || !d)
          if (o.nodeType === Node.TEXT_NODE) {
            const e = o,
              u = e.textContent?.length || 0;
            (!l && r + u >= t && ((i = e), (s = t - r), (l = !0)),
              !d && r + u >= n && ((a = e), (c = n - r), (d = !0)),
              (r += u));
          } else if (o.nodeType === Node.ELEMENT_NODE)
            for (let t = 0; t < o.childNodes.length; t++)
              if ((e(o.childNodes[t]), l && d)) return;
      })(e),
      { startNode: i, startOffset: s, endNode: a, endOffset: c, found: l && d }
    );
  })(e, t.start, t.end);
  if (!o.found || !o.startNode || !o.endNode) return null;
  try {
    return (
      n.setStart(o.startNode, o.startOffset),
      n.setEnd(o.endNode, o.endOffset),
      n
    );
  } catch (r) {
    return null;
  }
}
function l(e, t) {
  const n = c(e, t);
  if (!n) return null;
  const o = n.getBoundingClientRect(),
    r = e.getBoundingClientRect();
  return {
    x: o.left - r.left + e.scrollLeft,
    y: o.top - r.top + e.scrollTop,
    width: o.width,
    height: o.height,
  };
}
const d = new WeakMap();
function u(e) {
  const t = d.get(e);
  if (t) return t;
  const n = document.createElement("div");
  ((n.style.position = "absolute"),
    (n.style.pointerEvents = "none"),
    (n.style.zIndex = "999999"),
    (n.style.top = "0"),
    (n.style.left = "0"),
    (n.style.width = "100%"),
    (n.style.height = "100%"));
  const o = n.attachShadow({ mode: "closed" }),
    r = document.createElement("style");
  return (
    (r.textContent =
      "\n    :host {\n      all: initial;\n      display: block;\n      position: relative;\n    }\n    \n    .grammar-error-underline {\n      position: absolute;\n      border-bottom: 2px wavy #ff4444;\n      pointer-events: auto;\n      cursor: pointer;\n      box-sizing: border-box;\n    }\n    \n    .grammar-error-underline:hover {\n      background-color: rgba(255, 68, 68, 0.1);\n    }\n  "),
    o.appendChild(r),
    e.getBoundingClientRect(),
    e.offsetParent || document.body,
    ("static" !== e.style.position && e.style.position) ||
      (e.style.position = "relative"),
    e.appendChild(n),
    d.set(e, o),
    o
  );
}
function h(e, t, n) {
  const o = document.createElement("div");
  ((o.className = "grammar-error-underline"),
    (o.style.left = `${t.x}px`),
    (o.style.top = `${t.y}px`),
    (o.style.width = `${t.width}px`),
    (o.style.height = `${t.height}px`),
    o.setAttribute("data-error-start", n.start.toString()),
    o.setAttribute("data-error-end", n.end.toString()),
    o.setAttribute("data-error-type", n.type),
    o.setAttribute("data-rule-id", n.ruleId),
    e.appendChild(o));
}
function m(e) {
  e.querySelectorAll(".grammar-error-underline").forEach((e) => e.remove());
}
function p() {
  return (
    "undefined" != typeof CSS &&
    "highlights" in CSS &&
    void 0 !== CSS.highlights
  );
}
function f(e, t) {
  if (!p()) return !1;
  try {
    const n = CSS.highlights;
    n.has("grammar-error") && n.delete("grammar-error");
    const o = [];
    for (const i of t) {
      let t = null;
      if (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement)
        return !1;
      ((t = (e.isContentEditable, c(e, i))), t && o.push(t));
    }
    if (0 === o.length) return !1;
    const r = new window.Highlight(...o);
    return (
      n.set("grammar-error", r),
      (function () {
        if (g) return;
        const e = document.createElement("style");
        ((e.textContent =
          "\n    ::highlight(grammar-error) {\n      background-color: transparent;\n      text-decoration: wavy underline #ff4444;\n      text-decoration-thickness: 2px;\n    }\n  "),
          document.head.appendChild(e),
          (g = !0));
      })(),
      !0
    );
  } catch (n) {
    return !1;
  }
}
let g = !1;
function y(e, t) {
  if (0 !== t.length) {
    if (e.isContentEditable && p()) {
      if (f(e, t)) return;
    }
    e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement
      ? (function (e, t) {
          const n = u(e);
          m(n);
          for (const o of t) {
            h(n, a(e, o), o);
          }
        })(e, t)
      : (e.isContentEditable, b(e, t));
  }
}
function b(e, t) {
  const n = u(e);
  m(n);
  for (const o of t) {
    const t = l(e, o);
    t && h(n, t, o);
  }
}
function x(e) {
  if (p())
    try {
      const e = CSS.highlights;
      e.has("grammar-error") && e.delete("grammar-error");
    } catch (n) {}
  const t = d.get(e);
  t && m(t);
}
function T(e, t) {
  const { error: n, corrected: o } = t;
  e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement
    ? (function (e, t, n) {
        const o = e.value,
          r = o.substring(0, t.start),
          i = o.substring(t.end),
          s = e.selectionStart || 0;
        e.value = r + n + i;
        const a = n.length - (t.end - t.start);
        let c = s;
        s > t.end
          ? (c = s + a)
          : s >= t.start && s <= t.end && (c = t.start + n.length);
        (e.setSelectionRange(c, c), e.focus());
        const l = new Event("input", { bubbles: !0 });
        e.dispatchEvent(l);
      })(e, n, o)
    : e.isContentEditable &&
      (function (e, t, n) {
        const o = c(e, t);
        if (!o) return;
        const r = window.getSelection(),
          i = r && r.rangeCount > 0 ? r.getRangeAt(0).cloneRange() : null;
        o.deleteContents();
        const s = document.createTextNode(n);
        if ((o.insertNode(s), i)) {
          (n.length, t.end, t.start, i.startOffset, t.end);
          try {
            (r?.removeAllRanges(), r?.addRange(i));
          } catch (l) {
            const e = document.createRange();
            (e.setStartAfter(s),
              e.collapse(!0),
              r?.removeAllRanges(),
              r?.addRange(e));
          }
        }
        const a = new Event("input", { bubbles: !0 });
        e.dispatchEvent(a);
      })(e, n, o);
}
function E(e, t = "info") {
  const n = document.createElement("div");
  ((n.className = `grammar-checker-notification grammar-checker-notification-${t}`),
    (n.textContent = e),
    Object.assign(n.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "4px",
      backgroundColor:
        "success" === t ? "#4caf50" : "error" === t ? "#f44336" : "#2196f3",
      color: "white",
      fontSize: "14px",
      fontFamily: "system-ui, -apple-system, sans-serif",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      zIndex: "1000000",
      maxWidth: "300px",
      wordWrap: "break-word",
      animation: "grammar-checker-fade-in 0.3s ease-in",
    }),
    document.body.appendChild(n),
    setTimeout(() => {
      ((n.style.animation = "grammar-checker-fade-out 0.3s ease-out"),
        setTimeout(() => {
          n.parentNode && n.parentNode.removeChild(n);
        }, 300));
    }, 3e3));
}
let v = !1;
"undefined" != typeof document &&
  (function () {
    if (v) return;
    const e = document.createElement("style");
    ((e.textContent =
      "\n    @keyframes grammar-checker-fade-in {\n      from {\n        opacity: 0;\n        transform: translateY(-10px);\n      }\n      to {\n        opacity: 1;\n        transform: translateY(0);\n      }\n    }\n    \n    @keyframes grammar-checker-fade-out {\n      from {\n        opacity: 1;\n        transform: translateY(0);\n      }\n      to {\n        opacity: 0;\n        transform: translateY(-10px);\n      }\n    }\n  "),
      document.head.appendChild(e),
      (v = !0));
  })();
const C = {
  analysisCount: 0,
  totalTime: 0,
  maxTime: 0,
  minTime: 1 / 0,
  slowAnalysisCount: 0,
  recentTimes: [],
};
function w(t, n) {
  (C.analysisCount++,
    (C.totalTime += t),
    (C.maxTime = Math.max(C.maxTime, t)),
    (C.minTime = Math.min(C.minTime, t)),
    C.recentTimes.push(t),
    C.recentTimes.length > 10 && C.recentTimes.shift(),
    t > 50 &&
      (C.slowAnalysisCount++,
      t > 100 &&
        e(`Slow grammar analysis detected: ${t.toFixed(2)}ms`, "warning", {
          timeMs: t,
          textLength: n,
          target: 50,
        })),
    C.analysisCount % 100 == 0 &&
      (function () {
        const t = (function () {
          const e = C.analysisCount > 0 ? C.totalTime / C.analysisCount : 0,
            t =
              C.recentTimes.length > 0
                ? C.recentTimes.reduce((e, t) => e + t, 0) /
                  C.recentTimes.length
                : 0,
            n =
              C.analysisCount > 0
                ? (C.slowAnalysisCount / C.analysisCount) * 100
                : 0;
          return { ...C, avgTime: e, recentAvg: t, slowPercentage: n };
        })();
        e("Performance metrics report", "info", {
          analysisCount: t.analysisCount,
          avgTime: t.avgTime.toFixed(2),
          recentAvg: t.recentAvg.toFixed(2),
          maxTime: t.maxTime.toFixed(2),
          minTime: t.minTime === 1 / 0 ? 0 : t.minTime.toFixed(2),
          slowPercentage: t.slowPercentage.toFixed(1),
          target: 50,
        });
      })());
}
async function F() {
  try {
    const e = await chrome.runtime.sendMessage({ type: "GET_TELEMETRY" });
    if (e && e.success) return { metrics: e.metrics, health: e.health };
    throw new Error("Failed to get telemetry");
  } catch (e) {
    throw e;
  }
}
"undefined" != typeof window &&
  (window.grammarCheckerTelemetry = {
    getTelemetry: F,
    clearTelemetry: async function () {
      try {
        const e = await chrome.runtime.sendMessage({ type: "CLEAR_TELEMETRY" });
        if (!e || !e.success) throw new Error("Failed to clear telemetry");
      } catch (e) {
        throw e;
      }
    },
    showTelemetrySummary: async function () {
      try {
        const e = await F(),
          { metrics: t, health: n } = e;
        if (
          (n.issues.length > 0 && n.issues.forEach((e) => {}),
          t.performance.length > 0)
        ) {
          const e = t.performance.map((e) => e.duration);
          (e.reduce((e, t) => e + t, 0),
            e.length,
            Math.min(...e),
            Math.max(...e));
        }
        if (t.usage.length > 0) {
          const e = {};
          (t.usage.forEach((t) => {
            e[t.event] = (e[t.event] || 0) + 1;
          }),
            Object.entries(e).forEach(([e, t]) => {}));
        }
        if (t.errors.length > 0) {
          const e = {};
          (t.errors.forEach((t) => {
            e[t.error] = (e[t.error] || 0) + 1;
          }),
            Object.entries(e)
              .sort((e, t) => t[1] - e[1])
              .slice(0, 5)
              .forEach(([e, t]) => {}));
        }
      } catch (e) {}
    },
    exportTelemetry: async function () {
      try {
        const e = await F();
        return JSON.stringify(e, null, 2);
      } catch (e) {
        throw e;
      }
    },
  });
let S = null,
  L = null,
  M = null;
async function k() {
  try {
    if (
      (A(),
      (M = await (async function () {
        try {
          const e = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
          return e && e.settings
            ? e.settings
            : {
                enabled: !0,
                correctionMode: "inline",
                languages: [],
                debounceDelay: 300,
                performanceMode: "balanced",
              };
        } catch (e) {
          return {
            enabled: !0,
            correctionMode: "inline",
            languages: [],
            debounceDelay: 300,
            performanceMode: "balanced",
          };
        }
      })()),
      !M.enabled)
    )
      return;
    ((L = new i(
      {
        onTextChange: D,
        onFieldUnobserved: (e) => {
          (!(function (e) {
            const t = I.get(e);
            t && (e.removeEventListener("click", t), I.delete(e));
          })(e),
            x(e));
        },
      },
      M.debounceDelay,
    )),
      N(),
      (function () {
        if (!L) return;
        new MutationObserver((e) => {
          for (const t of e)
            t.addedNodes.forEach((e) => {
              if (e.nodeType === Node.ELEMENT_NODE) {
                const t = e;
                R(t) && L.observeField(t);
                const n = t.querySelectorAll("textarea"),
                  o = t.querySelectorAll(
                    'input[type="text"], input[type="email"], input[type="search"], input[type="url"], input:not([type])',
                  ),
                  r = t.querySelectorAll('[contenteditable="true"]');
                (n.forEach((e) => {
                  L.observeField(e);
                }),
                  o.forEach((e) => {
                    L.observeField(e);
                  }),
                  r.forEach((e) => {
                    L.observeField(e);
                  }));
              }
            });
        }).observe(document.body, { childList: !0, subtree: !0 });
      })());
  } catch (e) {}
}
function A() {
  try {
    ((S = chrome.runtime.connect({ name: "keep-alive" })),
      S.onDisconnect.addListener(() => {
        setTimeout(() => {
          chrome.runtime?.id && A();
        }, 1e3);
      }));
  } catch (e) {}
}
function N() {
  if (!L) return;
  const e = document.querySelectorAll("textarea"),
    t = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="search"], input[type="url"], input:not([type])',
    ),
    n = document.querySelectorAll('[contenteditable="true"]');
  (e.forEach((e) => {
    L.observeField(e);
  }),
    t.forEach((e) => {
      L.observeField(e);
    }),
    n.forEach((e) => {
      L.observeField(e);
    }));
  (e.length, t.length, n.length);
}
function R(e) {
  if (e instanceof HTMLTextAreaElement) return !0;
  if (e instanceof HTMLInputElement) {
    const t = e.type;
    return "text" === t || "email" === t || "search" === t || "url" === t || !t;
  }
  return !("true" !== e.contentEditable && !e.isContentEditable);
}
const O = new WeakMap(),
  I = new WeakMap();
async function D(e, i) {
  if (!e || 0 === e.trim().length) return (x(i), void O.delete(i));
  try {
    t("text_analyzed", { textLength: e.length });
    const o = performance.now(),
      s = await chrome.runtime.sendMessage({ type: "ANALYZE_TEXT", text: e }),
      a = performance.now() - o;
    if (
      (w(a, e.length),
      n("analyze", a, {
        textLength: e.length,
        errorCount: s.result?.errors?.length || 0,
      }),
      s && s.result)
    ) {
      const e = s.result;
      (O.set(i, e),
        x(i),
        e.errors.length > 0 &&
          (y(i, e.errors),
          (function (e) {
            const n = I.get(e);
            n && e.removeEventListener("click", n);
            const o = (n) => {
              const o = n,
                i = O.get(e);
              if (!i) return;
              const s = (function (e, t, n) {
                if (n.length > 0) return n[0];
                return null;
              })(0, 0, i.errors);
              if (s) {
                const n = i.corrections.find((e) => e.error === s);
                n &&
                  (function (e, n, o, i) {
                    const s = document.createElement("div");
                    ((s.className = "grammar-checker-correction-popup"),
                      Object.assign(s.style, {
                        position: "fixed",
                        left: `${i.clientX}px`,
                        top: `${i.clientY + 10}px`,
                        backgroundColor: "white",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "12px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                        zIndex: "1000001",
                        maxWidth: "300px",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: "14px",
                      }));
                    const a = document.createElement("div");
                    ((a.textContent = n.message),
                      (a.style.marginBottom = "8px"),
                      (a.style.color = "#333"),
                      s.appendChild(a));
                    const c = document.createElement("div");
                    c.style.marginBottom = "8px";
                    const l = document.createElement("span");
                    ((l.textContent = o.original),
                      (l.style.textDecoration = "line-through"),
                      (l.style.color = "#f44336"),
                      (l.style.marginRight = "8px"));
                    const d = document.createElement("span");
                    ((d.textContent = "→"), (d.style.marginRight = "8px"));
                    const u = document.createElement("span");
                    ((u.textContent = o.corrected),
                      (u.style.color = "#4caf50"),
                      (u.style.fontWeight = "bold"),
                      c.appendChild(l),
                      c.appendChild(d),
                      c.appendChild(u),
                      s.appendChild(c));
                    const h = document.createElement("button");
                    ((h.textContent =
                      "clipboard" === M?.correctionMode
                        ? "Copy to Clipboard"
                        : "Apply Correction"),
                      Object.assign(h.style, {
                        backgroundColor: "#2196f3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: "13px",
                        marginRight: "8px",
                      }),
                      h.addEventListener("click", async () => {
                        (await (async function (e, o) {
                          if (!M) return;
                          try {
                            if (
                              (t("correction_accepted", {
                                mode: M.correctionMode,
                                errorType: o.error.type,
                              }),
                              "inline" === M.correctionMode)
                            ) {
                              T(e, o);
                              const t = L?.extractText(e) || "";
                              await D(t, e);
                            } else if ("clipboard" === M.correctionMode) {
                              const t = L?.extractText(e) || "",
                                r = t.substring(0, o.error.start),
                                i = t.substring(o.error.end),
                                s = r + o.corrected + i;
                              await (async function (e) {
                                try {
                                  const t = await chrome.runtime.sendMessage({
                                    type: "WRITE_TO_CLIPBOARD",
                                    text: e,
                                  });
                                  t && t.success
                                    ? E(
                                        "Corrected text copied to clipboard",
                                        "success",
                                      )
                                    : E(
                                        `Failed to copy to clipboard: ${t?.error || "Unknown error"}`,
                                        "error",
                                      );
                                } catch (n) {
                                  E("Failed to copy to clipboard", "error");
                                }
                              })(s);
                            }
                          } catch (n) {
                            (E("Failed to apply correction", "error"),
                              r(n, "handleCorrectionAccepted"));
                          }
                        })(e, o),
                          document.body.removeChild(s));
                      }),
                      s.appendChild(h));
                    const m = document.createElement("button");
                    ((m.textContent = "Dismiss"),
                      Object.assign(m.style, {
                        backgroundColor: "#f5f5f5",
                        color: "#333",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }),
                      m.addEventListener("click", () => {
                        document.body.removeChild(s);
                      }),
                      s.appendChild(m),
                      document.body.appendChild(s),
                      setTimeout(() => {
                        s.parentNode && document.body.removeChild(s);
                      }, 1e4));
                    const p = (e) => {
                      s.contains(e.target) ||
                        (s.parentNode && document.body.removeChild(s),
                        document.removeEventListener("click", p));
                    };
                    setTimeout(() => {
                      document.addEventListener("click", p);
                    }, 100);
                  })(e, s, n, o);
              }
            };
            (e.addEventListener("click", o), I.set(e, o));
          })(i)));
    }
  } catch (s) {
    (o(s, { context: "handleTextChange", textLength: e.length }),
      r(s, "handleTextChange"));
  }
}
(chrome.storage.onChanged.addListener((e, t) => {
  if ("sync" === t && e.settings) {
    const t = e.settings.newValue;
    ((M = t),
      L &&
        t.debounceDelay !== M?.debounceDelay &&
        (L.dispose(), (L = new i({ onTextChange: D }, t.debounceDelay)), N()));
  }
}),
  window.addEventListener("beforeunload", () => {
    (L && L.dispose(), S && S.disconnect());
  }),
  "loading" === document.readyState
    ? document.addEventListener("DOMContentLoaded", k)
    : k());
