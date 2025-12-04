class e {
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
      this.activeField === e && (this.activeField = null));
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
const t = [
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
function n(e, n) {
  const o = (function (e) {
      const n = document.createElement("div"),
        o = window.getComputedStyle(e);
      return (
        t.forEach((e) => {
          n.style[e] = o.getPropertyValue(e);
        }),
        (n.style.position = "absolute"),
        (n.style.visibility = "hidden"),
        (n.style.overflow = "hidden"),
        (n.style.whiteSpace = "pre-wrap"),
        (n.style.wordWrap = "break-word"),
        (n.style.top = "0"),
        (n.style.left = "0"),
        (n.style.width = `${e.clientWidth}px`),
        (n.style.height = `${e.clientHeight}px`),
        (n.style.pointerEvents = "none"),
        document.body.appendChild(n),
        n
      );
    })(e),
    r = e.value,
    i = r.substring(0, n.start),
    s = r.substring(n.start, n.end);
  o.innerHTML = "";
  const a = document.createElement("span");
  ((a.textContent = i), o.appendChild(a));
  const c = document.createElement("span");
  ((c.textContent = s), (c.style.display = "inline"), o.appendChild(c));
  const d = e.getBoundingClientRect(),
    l = c.getBoundingClientRect(),
    u = {
      x: l.left - d.left + e.scrollLeft,
      y: l.top - d.top + e.scrollTop,
      width: l.width,
      height: l.height,
    };
  return (document.body.removeChild(o), u);
}
function o(e, t) {
  const n = document.createRange();
  const o = (function (e, t, n, o = 0) {
    let r = o,
      i = null,
      s = 0,
      a = null,
      c = 0,
      d = !1,
      l = !1;
    return (
      (function e(o) {
        if (!d || !l)
          if (o.nodeType === Node.TEXT_NODE) {
            const e = o,
              u = e.textContent?.length || 0;
            (!d && r + u >= t && ((i = e), (s = t - r), (d = !0)),
              !l && r + u >= n && ((a = e), (c = n - r), (l = !0)),
              (r += u));
          } else if (o.nodeType === Node.ELEMENT_NODE)
            for (let t = 0; t < o.childNodes.length; t++)
              if ((e(o.childNodes[t]), d && l)) return;
      })(e),
      { startNode: i, startOffset: s, endNode: a, endOffset: c, found: d && l }
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
function r(e, t) {
  const n = o(e, t);
  if (!n) return null;
  const r = n.getBoundingClientRect(),
    i = e.getBoundingClientRect();
  return {
    x: r.left - i.left + e.scrollLeft,
    y: r.top - i.top + e.scrollTop,
    width: r.width,
    height: r.height,
  };
}
const i = new WeakMap();
function s(e) {
  const t = i.get(e);
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
    i.set(e, o),
    o
  );
}
function a(e, t, n) {
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
function c(e) {
  e.querySelectorAll(".grammar-error-underline").forEach((e) => e.remove());
}
function d() {
  return (
    "undefined" != typeof CSS &&
    "highlights" in CSS &&
    void 0 !== CSS.highlights
  );
}
function l(e, t) {
  if (!d()) return !1;
  try {
    const n = CSS.highlights;
    n.has("grammar-error") && n.delete("grammar-error");
    const r = [];
    for (const s of t) {
      let t = null;
      if (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement)
        return !1;
      ((t = (e.isContentEditable, o(e, s))), t && r.push(t));
    }
    if (0 === r.length) return !1;
    const i = new window.Highlight(...r);
    return (
      n.set("grammar-error", i),
      (function () {
        if (u) return;
        const e = document.createElement("style");
        ((e.textContent =
          "\n    ::highlight(grammar-error) {\n      background-color: transparent;\n      text-decoration: wavy underline #ff4444;\n      text-decoration-thickness: 2px;\n    }\n  "),
          document.head.appendChild(e),
          (u = !0));
      })(),
      !0
    );
  } catch (n) {
    return !1;
  }
}
let u = !1;
function p(e, t) {
  if (0 !== t.length) {
    if (e.isContentEditable && d()) {
      if (l(e, t)) return;
    }
    e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement
      ? (function (e, t) {
          const o = s(e);
          c(o);
          for (const r of t) {
            a(o, n(e, r), r);
          }
        })(e, t)
      : (e.isContentEditable, h(e, t));
  }
}
function h(e, t) {
  const n = s(e);
  c(n);
  for (const o of t) {
    const t = r(e, o);
    t && a(n, t, o);
  }
}
function f(e) {
  if (d())
    try {
      const e = CSS.highlights;
      e.has("grammar-error") && e.delete("grammar-error");
    } catch (n) {}
  const t = i.get(e);
  t && c(t);
}
function m(e, t) {
  const { error: n, corrected: r } = t;
  e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement
    ? (function (e, t, n) {
        const o = e.value,
          r = o.substring(0, t.start),
          i = o.substring(t.end),
          s = e.selectionStart || 0;
        e.value = r + n + i;
        const a = n.length - (t.end - t.start);
        let c = s;
        s > t.end ? (c = s + a) : s >= t.start && (c = t.start + n.length);
        (e.setSelectionRange(c, c), e.focus());
        const d = new Event("input", { bubbles: !0 });
        e.dispatchEvent(d);
      })(e, n, r)
    : e.isContentEditable &&
      (function (e, t, n) {
        const r = o(e, t);
        if (!r) return;
        const i = window.getSelection(),
          s = i && i.rangeCount > 0 ? i.getRangeAt(0).cloneRange() : null;
        r.deleteContents();
        const a = document.createTextNode(n);
        if ((r.insertNode(a), s)) {
          (n.length, t.end, t.start, s.startOffset, t.end);
          try {
            (i?.removeAllRanges(), i?.addRange(s));
          } catch (d) {
            const e = document.createRange();
            (e.setStartAfter(a),
              e.collapse(!0),
              i?.removeAllRanges(),
              i?.addRange(e));
          }
        }
        const c = new Event("input", { bubbles: !0 });
        e.dispatchEvent(c);
      })(e, n, r);
}
function g(e, t = "info") {
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
let b = !1;
"undefined" != typeof document &&
  (function () {
    if (b) return;
    const e = document.createElement("style");
    ((e.textContent =
      "\n    @keyframes grammar-checker-fade-in {\n      from {\n        opacity: 0;\n        transform: translateY(-10px);\n      }\n      to {\n        opacity: 1;\n        transform: translateY(0);\n      }\n    }\n    \n    @keyframes grammar-checker-fade-out {\n      from {\n        opacity: 1;\n        transform: translateY(0);\n      }\n      to {\n        opacity: 0;\n        transform: translateY(-10px);\n      }\n    }\n  "),
      document.head.appendChild(e),
      (b = !0));
  })();
let y = null,
  x = null,
  E = null;
async function v() {
  try {
    if (
      (C(),
      (E = await (async function () {
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
      !E.enabled)
    )
      return;
    ((x = new e({ onTextChange: F }, E.debounceDelay)),
      w(),
      (function () {
        if (!x) return;
        new MutationObserver((e) => {
          for (const t of e)
            t.addedNodes.forEach((e) => {
              if (e.nodeType === Node.ELEMENT_NODE) {
                const t = e;
                T(t) && x.observeField(t);
                const n = t.querySelectorAll("textarea"),
                  o = t.querySelectorAll(
                    'input[type="text"], input[type="email"], input[type="search"], input[type="url"], input:not([type])',
                  ),
                  r = t.querySelectorAll('[contenteditable="true"]');
                (n.forEach((e) => {
                  x.observeField(e);
                }),
                  o.forEach((e) => {
                    x.observeField(e);
                  }),
                  r.forEach((e) => {
                    x.observeField(e);
                  }));
              }
            });
        }).observe(document.body, { childList: !0, subtree: !0 });
      })());
  } catch (t) {}
}
function C() {
  try {
    ((y = chrome.runtime.connect({ name: "keep-alive" })),
      y.onDisconnect.addListener(() => {
        setTimeout(() => {
          chrome.runtime?.id && C();
        }, 1e3);
      }));
  } catch (e) {}
}
function w() {
  if (!x) return;
  const e = document.querySelectorAll("textarea"),
    t = document.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="search"], input[type="url"], input:not([type])',
    ),
    n = document.querySelectorAll('[contenteditable="true"]');
  (e.forEach((e) => {
    x.observeField(e);
  }),
    t.forEach((e) => {
      x.observeField(e);
    }),
    n.forEach((e) => {
      x.observeField(e);
    }));
  (e.length, t.length, n.length);
}
function T(e) {
  if (e instanceof HTMLTextAreaElement) return !0;
  if (e instanceof HTMLInputElement) {
    const t = e.type;
    return "text" === t || "email" === t || "search" === t || "url" === t || !t;
  }
  return !("true" !== e.contentEditable && !e.isContentEditable);
}
const S = new WeakMap();
async function F(e, t) {
  if (!e || 0 === e.trim().length) return (f(t), void S.delete(t));
  try {
    const n = performance.now(),
      o = await chrome.runtime.sendMessage({ type: "ANALYZE_TEXT", text: e });
    performance.now();
    if (o && o.result) {
      const e = o.result;
      (S.set(t, e),
        f(t),
        e.errors.length > 0 &&
          (p(t, e.errors),
          (function (e) {
            const t = (t) => {
              const n = t,
                o = S.get(e);
              if (!o) return;
              const r = (function (e, t, n) {
                if (n.length > 0) return n[0];
                return null;
              })(0, 0, o.errors);
              if (r) {
                const t = o.corrections.find((e) => e.error === r);
                t &&
                  (function (e, t, n, o) {
                    const r = document.createElement("div");
                    ((r.className = "grammar-checker-correction-popup"),
                      Object.assign(r.style, {
                        position: "fixed",
                        left: `${o.clientX}px`,
                        top: `${o.clientY + 10}px`,
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
                    const i = document.createElement("div");
                    ((i.textContent = t.message),
                      (i.style.marginBottom = "8px"),
                      (i.style.color = "#333"),
                      r.appendChild(i));
                    const s = document.createElement("div");
                    s.style.marginBottom = "8px";
                    const a = document.createElement("span");
                    ((a.textContent = n.original),
                      (a.style.textDecoration = "line-through"),
                      (a.style.color = "#f44336"),
                      (a.style.marginRight = "8px"));
                    const c = document.createElement("span");
                    ((c.textContent = "→"), (c.style.marginRight = "8px"));
                    const d = document.createElement("span");
                    ((d.textContent = n.corrected),
                      (d.style.color = "#4caf50"),
                      (d.style.fontWeight = "bold"),
                      s.appendChild(a),
                      s.appendChild(c),
                      s.appendChild(d),
                      r.appendChild(s));
                    const l = document.createElement("button");
                    ((l.textContent =
                      "clipboard" === E?.correctionMode
                        ? "Copy to Clipboard"
                        : "Apply Correction"),
                      Object.assign(l.style, {
                        backgroundColor: "#2196f3",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: "13px",
                        marginRight: "8px",
                      }),
                      l.addEventListener("click", async () => {
                        (await (async function (e, n) {
                          if (!E) return;
                          try {
                            if ("inline" === E.correctionMode) {
                              m(e, n);
                              const t = x?.extractText(e) || "";
                              await F(t, e);
                            } else if ("clipboard" === E.correctionMode) {
                              const o = x?.extractText(e) || "",
                                r = o.substring(0, n.error.start),
                                i = o.substring(n.error.end),
                                s = r + n.corrected + i;
                              await (async function (e) {
                                try {
                                  const t = await chrome.runtime.sendMessage({
                                    type: "WRITE_TO_CLIPBOARD",
                                    text: e,
                                  });
                                  t && t.success
                                    ? g(
                                        "Corrected text copied to clipboard",
                                        "success",
                                      )
                                    : g(
                                        `Failed to copy to clipboard: ${t?.error || "Unknown error"}`,
                                        "error",
                                      );
                                } catch (t) {
                                  g("Failed to copy to clipboard", "error");
                                }
                              })(s);
                            }
                          } catch (t) {
                            g("Failed to apply correction", "error");
                          }
                        })(e, n),
                          document.body.removeChild(r));
                      }),
                      r.appendChild(l));
                    const u = document.createElement("button");
                    ((u.textContent = "Dismiss"),
                      Object.assign(u.style, {
                        backgroundColor: "#f5f5f5",
                        color: "#333",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: "13px",
                      }),
                      u.addEventListener("click", () => {
                        document.body.removeChild(r);
                      }),
                      r.appendChild(u),
                      document.body.appendChild(r),
                      setTimeout(() => {
                        r.parentNode && document.body.removeChild(r);
                      }, 1e4));
                    const p = (e) => {
                      r.contains(e.target) ||
                        (r.parentNode && document.body.removeChild(r),
                        document.removeEventListener("click", p));
                    };
                    setTimeout(() => {
                      document.addEventListener("click", p);
                    }, 100);
                  })(e, r, t, n);
              }
            };
            e.addEventListener("click", t);
          })(t)));
    }
  } catch (n) {}
}
(chrome.storage.onChanged.addListener((t, n) => {
  if ("sync" === n && t.settings) {
    const n = t.settings.newValue;
    ((E = n),
      x &&
        n.debounceDelay !== E?.debounceDelay &&
        (x.dispose(), (x = new e({ onTextChange: F }, n.debounceDelay)), w()));
  }
}),
  window.addEventListener("beforeunload", () => {
    (x && x.dispose(), y && y.disconnect());
  }),
  "loading" === document.readyState
    ? document.addEventListener("DOMContentLoaded", v)
    : v());
