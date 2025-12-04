const t = "undefined" == typeof __SENTRY_DEBUG__ || __SENTRY_DEBUG__,
  e = globalThis,
  n = "10.27.0";
function r() {
  return (s(e), e);
}
function s(t) {
  const e = (t.__SENTRY__ = t.__SENTRY__ || {});
  return ((e.version = e.version || n), (e[n] = e[n] || {}));
}
function o(t, r, s = e) {
  const o = (s.__SENTRY__ = s.__SENTRY__ || {}),
    i = (o[n] = o[n] || {});
  return i[t] || (i[t] = r());
}
const i = ["debug", "info", "warn", "error", "log", "assert", "trace"],
  a = {};
function c(t) {
  if (!("console" in e)) return t();
  const n = e.console,
    r = {},
    s = Object.keys(a);
  s.forEach((t) => {
    const e = a[t];
    ((r[t] = n[t]), (n[t] = e));
  });
  try {
    return t();
  } finally {
    s.forEach((t) => {
      n[t] = r[t];
    });
  }
}
function u() {
  return l().enabled;
}
function p(n, ...r) {
  t &&
    u() &&
    c(() => {
      e.console[n](`Sentry Logger [${n}]:`, ...r);
    });
}
function l() {
  return t ? o("loggerSettings", () => ({ enabled: !1 })) : { enabled: !1 };
}
const f = {
    enable: function () {
      l().enabled = !0;
    },
    disable: function () {
      l().enabled = !1;
    },
    isEnabled: u,
    log: function (...t) {
      p("log", ...t);
    },
    warn: function (...t) {
      p("warn", ...t);
    },
    error: function (...t) {
      p("error", ...t);
    },
  },
  d = "?",
  h = /\(error: (.*)\)/,
  m = /captureMessage|captureException/;
function g(...t) {
  const e = t.sort((t, e) => t[0] - e[0]).map((t) => t[1]);
  return (t, n = 0, r = 0) => {
    const s = [],
      o = t.split("\n");
    for (let i = n; i < o.length; i++) {
      let t = o[i];
      t.length > 1024 && (t = t.slice(0, 1024));
      const n = h.test(t) ? t.replace(h, "$1") : t;
      if (!n.match(/\S*Error: /)) {
        for (const t of e) {
          const e = t(n);
          if (e) {
            s.push(e);
            break;
          }
        }
        if (s.length >= 50 + r) break;
      }
    }
    return (function (t) {
      if (!t.length) return [];
      const e = Array.from(t);
      /sentryWrapped/.test(_(e).function || "") && e.pop();
      (e.reverse(),
        m.test(_(e).function || "") &&
          (e.pop(), m.test(_(e).function || "") && e.pop()));
      return e
        .slice(0, 50)
        .map((t) => ({
          ...t,
          filename: t.filename || _(e).filename,
          function: t.function || d,
        }));
    })(s.slice(r));
  };
}
function _(t) {
  return t[t.length - 1] || {};
}
const y = "<anonymous>";
function v(t) {
  try {
    return (t && "function" == typeof t && t.name) || y;
  } catch {
    return y;
  }
}
function b(t) {
  const e = t.exception;
  if (e) {
    const t = [];
    try {
      return (
        e.values.forEach((e) => {
          e.stacktrace.frames && t.push(...e.stacktrace.frames);
        }),
        t
      );
    } catch {
      return;
    }
  }
}
function E(t) {
  return "__v_isVNode" in t && t.__v_isVNode ? "[VueVNode]" : "[VueViewModel]";
}
const x = {},
  S = {};
function w(t, e) {
  ((x[t] = x[t] || []), x[t].push(e));
}
function k(e, n) {
  if (!S[e]) {
    S[e] = !0;
    try {
      n();
    } catch (r) {
      t && f.error(`Error while instrumenting ${e}`, r);
    }
  }
}
function $(e, n) {
  const r = e && x[e];
  if (r)
    for (const o of r)
      try {
        o(n);
      } catch (s) {
        t &&
          f.error(
            `Error while triggering instrumentation handler.\nType: ${e}\nName: ${v(o)}\nError:`,
            s,
          );
      }
}
let O = null;
function T() {
  ((O = e.onerror),
    (e.onerror = function (t, e, n, r, s) {
      return (
        $("error", { column: r, error: s, line: n, msg: t, url: e }),
        !!O && O.apply(this, arguments)
      );
    }),
    (e.onerror.__SENTRY_INSTRUMENTED__ = !0));
}
let D = null;
function P() {
  ((D = e.onunhandledrejection),
    (e.onunhandledrejection = function (t) {
      return ($("unhandledrejection", t), !D || D.apply(this, arguments));
    }),
    (e.onunhandledrejection.__SENTRY_INSTRUMENTED__ = !0));
}
const C = Object.prototype.toString;
function j(t) {
  switch (C.call(t)) {
    case "[object Error]":
    case "[object Exception]":
    case "[object DOMException]":
    case "[object WebAssembly.Exception]":
      return !0;
    default:
      return B(t, Error);
  }
}
function I(t, e) {
  return C.call(t) === `[object ${e}]`;
}
function A(t) {
  return I(t, "ErrorEvent");
}
function N(t) {
  return I(t, "DOMError");
}
function M(t) {
  return I(t, "String");
}
function L(t) {
  return (
    "object" == typeof t &&
    null !== t &&
    "__sentry_template_string__" in t &&
    "__sentry_template_values__" in t
  );
}
function R(t) {
  return null === t || L(t) || ("object" != typeof t && "function" != typeof t);
}
function U(t) {
  return I(t, "Object");
}
function q(t) {
  return "undefined" != typeof Event && B(t, Event);
}
function F(t) {
  return Boolean(t?.then && "function" == typeof t.then);
}
function B(t, e) {
  try {
    return t instanceof e;
  } catch {
    return !1;
  }
}
function H(t) {
  return !(
    "object" != typeof t ||
    null === t ||
    !(t.__isVue || t._isVue || t.__v_isVNode)
  );
}
const z = e;
function W(t, e = {}) {
  if (!t) return "<unknown>";
  try {
    let n = t;
    const r = 5,
      s = [];
    let o = 0,
      i = 0;
    const a = " > ",
      c = a.length;
    let u;
    const p = Array.isArray(e) ? e : e.keyAttrs,
      l = (!Array.isArray(e) && e.maxStringLength) || 80;
    for (
      ;
      n &&
      o++ < r &&
      ((u = Y(n, p)),
      !("html" === u || (o > 1 && i + s.length * c + u.length >= l)));
    )
      (s.push(u), (i += u.length), (n = n.parentNode));
    return s.reverse().join(a);
  } catch {
    return "<unknown>";
  }
}
function Y(t, e) {
  const n = t,
    r = [];
  if (!n?.tagName) return "";
  if (z.HTMLElement && n instanceof HTMLElement && n.dataset) {
    if (n.dataset.sentryComponent) return n.dataset.sentryComponent;
    if (n.dataset.sentryElement) return n.dataset.sentryElement;
  }
  r.push(n.tagName.toLowerCase());
  const s = e?.length
    ? e.filter((t) => n.getAttribute(t)).map((t) => [t, n.getAttribute(t)])
    : null;
  if (s?.length)
    s.forEach((t) => {
      r.push(`[${t[0]}="${t[1]}"]`);
    });
  else {
    n.id && r.push(`#${n.id}`);
    const t = n.className;
    if (t && M(t)) {
      const e = t.split(/\s+/);
      for (const t of e) r.push(`.${t}`);
    }
  }
  const o = ["aria-label", "type", "name", "title", "alt"];
  for (const i of o) {
    const t = n.getAttribute(i);
    t && r.push(`[${i}="${t}"]`);
  }
  return r.join("");
}
function G() {
  try {
    return z.document.location.href;
  } catch {
    return "";
  }
}
function J(e, n, r) {
  if (!(n in e)) return;
  const s = e[n];
  if ("function" != typeof s) return;
  const o = r(s);
  "function" == typeof o && V(o, s);
  try {
    e[n] = o;
  } catch {
    t && f.log(`Failed to replace method "${n}" in object`, e);
  }
}
function K(e, n, r) {
  try {
    Object.defineProperty(e, n, { value: r, writable: !0, configurable: !0 });
  } catch {
    t && f.log(`Failed to add non-enumerable property "${n}" to object`, e);
  }
}
function V(t, e) {
  try {
    const n = e.prototype || {};
    ((t.prototype = e.prototype = n), K(t, "__sentry_original__", e));
  } catch {}
}
function X(t) {
  return t.__sentry_original__;
}
function Z(t) {
  if (j(t))
    return { message: t.message, name: t.name, stack: t.stack, ...tt(t) };
  if (q(t)) {
    const e = {
      type: t.type,
      target: Q(t.target),
      currentTarget: Q(t.currentTarget),
      ...tt(t),
    };
    return (
      "undefined" != typeof CustomEvent &&
        B(t, CustomEvent) &&
        (e.detail = t.detail),
      e
    );
  }
  return t;
}
function Q(t) {
  try {
    return (
      (e = t),
      "undefined" != typeof Element && B(e, Element)
        ? W(t)
        : Object.prototype.toString.call(t)
    );
  } catch {
    return "<unknown>";
  }
  var e;
}
function tt(t) {
  if ("object" == typeof t && null !== t) {
    const e = {};
    for (const n in t)
      Object.prototype.hasOwnProperty.call(t, n) && (e[n] = t[n]);
    return e;
  }
  return {};
}
function et(t, e = 0) {
  return "string" != typeof t || 0 === e || t.length <= e
    ? t
    : `${t.slice(0, e)}...`;
}
function nt(t, e) {
  if (!Array.isArray(t)) return "";
  const n = [];
  for (let r = 0; r < t.length; r++) {
    const e = t[r];
    try {
      H(e) ? n.push(E(e)) : n.push(String(e));
    } catch {
      n.push("[value cannot be serialized]");
    }
  }
  return n.join(e);
}
function rt(t, e, n = !1) {
  return (
    !!M(t) &&
    (I(e, "RegExp") ? e.test(t) : !!M(e) && (n ? t === e : t.includes(e)))
  );
}
function st(t, e = [], n = !1) {
  return e.some((e) => rt(t, e, n));
}
let ot;
function it(
  t = (function () {
    const t = e;
    return t.crypto || t.msCrypto;
  })(),
) {
  try {
    if (t?.randomUUID) return t.randomUUID().replace(/-/g, "");
  } catch {}
  return (
    ot || (ot = [1e7] + 1e3 + 4e3 + 8e3 + 1e11),
    ot.replace(/[018]/g, (t) =>
      (t ^ (((16 * Math.random()) & 15) >> (t / 4))).toString(16),
    )
  );
}
function at(t) {
  return t.exception?.values?.[0];
}
function ct(t) {
  const { message: e, event_id: n } = t;
  if (e) return e;
  const r = at(t);
  return r
    ? r.type && r.value
      ? `${r.type}: ${r.value}`
      : r.type || r.value || n || "<unknown>"
    : n || "<unknown>";
}
function ut(t, e, n) {
  const r = (t.exception = t.exception || {}),
    s = (r.values = r.values || []),
    o = (s[0] = s[0] || {});
  (o.value || (o.value = e || ""), o.type || (o.type = "Error"));
}
function pt(t, e) {
  const n = at(t);
  if (!n) return;
  const r = n.mechanism;
  if (
    ((n.mechanism = { type: "generic", handled: !0, ...r, ...e }),
    e && "data" in e)
  ) {
    const t = { ...r?.data, ...e.data };
    n.mechanism.data = t;
  }
}
function lt(t) {
  if (
    (function (t) {
      try {
        return t.__sentry_captured__;
      } catch {}
    })(t)
  )
    return !0;
  try {
    K(t, "__sentry_captured__", !0);
  } catch {}
  return !1;
}
function ft() {
  return Date.now() / 1e3;
}
let dt;
function ht() {
  return (
    dt ??
    (dt = (function () {
      const { performance: t } = e;
      if (!t?.now || !t.timeOrigin) return ft;
      const n = t.timeOrigin;
      return () => (n + t.now()) / 1e3;
    })())
  )();
}
function mt(t) {
  const e = ht(),
    n = {
      sid: it(),
      init: !0,
      timestamp: e,
      started: e,
      duration: 0,
      status: "ok",
      errors: 0,
      ignoreDuration: !1,
      toJSON: () =>
        (function (t) {
          return {
            sid: `${t.sid}`,
            init: t.init,
            started: new Date(1e3 * t.started).toISOString(),
            timestamp: new Date(1e3 * t.timestamp).toISOString(),
            status: t.status,
            errors: t.errors,
            did:
              "number" == typeof t.did || "string" == typeof t.did
                ? `${t.did}`
                : void 0,
            duration: t.duration,
            abnormal_mechanism: t.abnormal_mechanism,
            attrs: {
              release: t.release,
              environment: t.environment,
              ip_address: t.ipAddress,
              user_agent: t.userAgent,
            },
          };
        })(n),
    };
  return (t && gt(n, t), n);
}
function gt(t, e = {}) {
  if (
    (e.user &&
      (!t.ipAddress && e.user.ip_address && (t.ipAddress = e.user.ip_address),
      t.did || e.did || (t.did = e.user.id || e.user.email || e.user.username)),
    (t.timestamp = e.timestamp || ht()),
    e.abnormal_mechanism && (t.abnormal_mechanism = e.abnormal_mechanism),
    e.ignoreDuration && (t.ignoreDuration = e.ignoreDuration),
    e.sid && (t.sid = 32 === e.sid.length ? e.sid : it()),
    void 0 !== e.init && (t.init = e.init),
    !t.did && e.did && (t.did = `${e.did}`),
    "number" == typeof e.started && (t.started = e.started),
    t.ignoreDuration)
  )
    t.duration = void 0;
  else if ("number" == typeof e.duration) t.duration = e.duration;
  else {
    const e = t.timestamp - t.started;
    t.duration = e >= 0 ? e : 0;
  }
  (e.release && (t.release = e.release),
    e.environment && (t.environment = e.environment),
    !t.ipAddress && e.ipAddress && (t.ipAddress = e.ipAddress),
    !t.userAgent && e.userAgent && (t.userAgent = e.userAgent),
    "number" == typeof e.errors && (t.errors = e.errors),
    e.status && (t.status = e.status));
}
function _t(t, e, n = 2) {
  if (!e || "object" != typeof e || n <= 0) return e;
  if (t && 0 === Object.keys(e).length) return t;
  const r = { ...t };
  for (const s in e)
    Object.prototype.hasOwnProperty.call(e, s) &&
      (r[s] = _t(r[s], e[s], n - 1));
  return r;
}
function yt() {
  return it();
}
function vt() {
  return it().substring(16);
}
const bt = "_sentrySpan";
function Et(t, e) {
  e ? K(t, bt, e) : delete t[bt];
}
function xt(t) {
  return t[bt];
}
class St {
  constructor() {
    ((this._notifyingListeners = !1),
      (this._scopeListeners = []),
      (this._eventProcessors = []),
      (this._breadcrumbs = []),
      (this._attachments = []),
      (this._user = {}),
      (this._tags = {}),
      (this._attributes = {}),
      (this._extra = {}),
      (this._contexts = {}),
      (this._sdkProcessingMetadata = {}),
      (this._propagationContext = {
        traceId: yt(),
        sampleRand: Math.random(),
      }));
  }
  clone() {
    const t = new St();
    return (
      (t._breadcrumbs = [...this._breadcrumbs]),
      (t._tags = { ...this._tags }),
      (t._attributes = { ...this._attributes }),
      (t._extra = { ...this._extra }),
      (t._contexts = { ...this._contexts }),
      this._contexts.flags &&
        (t._contexts.flags = { values: [...this._contexts.flags.values] }),
      (t._user = this._user),
      (t._level = this._level),
      (t._session = this._session),
      (t._transactionName = this._transactionName),
      (t._fingerprint = this._fingerprint),
      (t._eventProcessors = [...this._eventProcessors]),
      (t._attachments = [...this._attachments]),
      (t._sdkProcessingMetadata = { ...this._sdkProcessingMetadata }),
      (t._propagationContext = { ...this._propagationContext }),
      (t._client = this._client),
      (t._lastEventId = this._lastEventId),
      Et(t, xt(this)),
      t
    );
  }
  setClient(t) {
    this._client = t;
  }
  setLastEventId(t) {
    this._lastEventId = t;
  }
  getClient() {
    return this._client;
  }
  lastEventId() {
    return this._lastEventId;
  }
  addScopeListener(t) {
    this._scopeListeners.push(t);
  }
  addEventProcessor(t) {
    return (this._eventProcessors.push(t), this);
  }
  setUser(t) {
    return (
      (this._user = t || {
        email: void 0,
        id: void 0,
        ip_address: void 0,
        username: void 0,
      }),
      this._session && gt(this._session, { user: t }),
      this._notifyScopeListeners(),
      this
    );
  }
  getUser() {
    return this._user;
  }
  setTags(t) {
    return (
      (this._tags = { ...this._tags, ...t }),
      this._notifyScopeListeners(),
      this
    );
  }
  setTag(t, e) {
    return this.setTags({ [t]: e });
  }
  setAttributes(t) {
    return (
      (this._attributes = { ...this._attributes, ...t }),
      this._notifyScopeListeners(),
      this
    );
  }
  setAttribute(t, e) {
    return this.setAttributes({ [t]: e });
  }
  removeAttribute(t) {
    return (
      t in this._attributes &&
        (delete this._attributes[t], this._notifyScopeListeners()),
      this
    );
  }
  setExtras(t) {
    return (
      (this._extra = { ...this._extra, ...t }),
      this._notifyScopeListeners(),
      this
    );
  }
  setExtra(t, e) {
    return (
      (this._extra = { ...this._extra, [t]: e }),
      this._notifyScopeListeners(),
      this
    );
  }
  setFingerprint(t) {
    return ((this._fingerprint = t), this._notifyScopeListeners(), this);
  }
  setLevel(t) {
    return ((this._level = t), this._notifyScopeListeners(), this);
  }
  setTransactionName(t) {
    return ((this._transactionName = t), this._notifyScopeListeners(), this);
  }
  setContext(t, e) {
    return (
      null === e ? delete this._contexts[t] : (this._contexts[t] = e),
      this._notifyScopeListeners(),
      this
    );
  }
  setSession(t) {
    return (
      t ? (this._session = t) : delete this._session,
      this._notifyScopeListeners(),
      this
    );
  }
  getSession() {
    return this._session;
  }
  update(t) {
    if (!t) return this;
    const e = "function" == typeof t ? t(this) : t,
      n = e instanceof St ? e.getScopeData() : U(e) ? t : void 0,
      {
        tags: r,
        attributes: s,
        extra: o,
        user: i,
        contexts: a,
        level: c,
        fingerprint: u = [],
        propagationContext: p,
      } = n || {};
    return (
      (this._tags = { ...this._tags, ...r }),
      (this._attributes = { ...this._attributes, ...s }),
      (this._extra = { ...this._extra, ...o }),
      (this._contexts = { ...this._contexts, ...a }),
      i && Object.keys(i).length && (this._user = i),
      c && (this._level = c),
      u.length && (this._fingerprint = u),
      p && (this._propagationContext = p),
      this
    );
  }
  clear() {
    return (
      (this._breadcrumbs = []),
      (this._tags = {}),
      (this._attributes = {}),
      (this._extra = {}),
      (this._user = {}),
      (this._contexts = {}),
      (this._level = void 0),
      (this._transactionName = void 0),
      (this._fingerprint = void 0),
      (this._session = void 0),
      Et(this, void 0),
      (this._attachments = []),
      this.setPropagationContext({ traceId: yt(), sampleRand: Math.random() }),
      this._notifyScopeListeners(),
      this
    );
  }
  addBreadcrumb(t, e) {
    const n = "number" == typeof e ? e : 100;
    if (n <= 0) return this;
    const r = {
      timestamp: ft(),
      ...t,
      message: t.message ? et(t.message, 2048) : t.message,
    };
    return (
      this._breadcrumbs.push(r),
      this._breadcrumbs.length > n &&
        ((this._breadcrumbs = this._breadcrumbs.slice(-n)),
        this._client?.recordDroppedEvent("buffer_overflow", "log_item")),
      this._notifyScopeListeners(),
      this
    );
  }
  getLastBreadcrumb() {
    return this._breadcrumbs[this._breadcrumbs.length - 1];
  }
  clearBreadcrumbs() {
    return ((this._breadcrumbs = []), this._notifyScopeListeners(), this);
  }
  addAttachment(t) {
    return (this._attachments.push(t), this);
  }
  clearAttachments() {
    return ((this._attachments = []), this);
  }
  getScopeData() {
    return {
      breadcrumbs: this._breadcrumbs,
      attachments: this._attachments,
      contexts: this._contexts,
      tags: this._tags,
      attributes: this._attributes,
      extra: this._extra,
      user: this._user,
      level: this._level,
      fingerprint: this._fingerprint || [],
      eventProcessors: this._eventProcessors,
      propagationContext: this._propagationContext,
      sdkProcessingMetadata: this._sdkProcessingMetadata,
      transactionName: this._transactionName,
      span: xt(this),
    };
  }
  setSDKProcessingMetadata(t) {
    return (
      (this._sdkProcessingMetadata = _t(this._sdkProcessingMetadata, t, 2)),
      this
    );
  }
  setPropagationContext(t) {
    return ((this._propagationContext = t), this);
  }
  getPropagationContext() {
    return this._propagationContext;
  }
  captureException(e, n) {
    const r = n?.event_id || it();
    if (!this._client)
      return (
        t &&
          f.warn("No client configured on scope - will not capture exception!"),
        r
      );
    const s = new Error("Sentry syntheticException");
    return (
      this._client.captureException(
        e,
        { originalException: e, syntheticException: s, ...n, event_id: r },
        this,
      ),
      r
    );
  }
  captureMessage(e, n, r) {
    const s = r?.event_id || it();
    if (!this._client)
      return (
        t &&
          f.warn("No client configured on scope - will not capture message!"),
        s
      );
    const o = r?.syntheticException ?? new Error(e);
    return (
      this._client.captureMessage(
        e,
        n,
        { originalException: e, syntheticException: o, ...r, event_id: s },
        this,
      ),
      s
    );
  }
  captureEvent(e, n) {
    const r = n?.event_id || it();
    return this._client
      ? (this._client.captureEvent(e, { ...n, event_id: r }, this), r)
      : (t && f.warn("No client configured on scope - will not capture event!"),
        r);
  }
  _notifyScopeListeners() {
    this._notifyingListeners ||
      ((this._notifyingListeners = !0),
      this._scopeListeners.forEach((t) => {
        t(this);
      }),
      (this._notifyingListeners = !1));
  }
}
class wt {
  constructor(t, e) {
    let n, r;
    ((n = t || new St()),
      (r = e || new St()),
      (this._stack = [{ scope: n }]),
      (this._isolationScope = r));
  }
  withScope(t) {
    const e = this._pushScope();
    let n;
    try {
      n = t(e);
    } catch (r) {
      throw (this._popScope(), r);
    }
    return F(n)
      ? n.then(
          (t) => (this._popScope(), t),
          (t) => {
            throw (this._popScope(), t);
          },
        )
      : (this._popScope(), n);
  }
  getClient() {
    return this.getStackTop().client;
  }
  getScope() {
    return this.getStackTop().scope;
  }
  getIsolationScope() {
    return this._isolationScope;
  }
  getStackTop() {
    return this._stack[this._stack.length - 1];
  }
  _pushScope() {
    const t = this.getScope().clone();
    return (this._stack.push({ client: this.getClient(), scope: t }), t);
  }
  _popScope() {
    return !(this._stack.length <= 1) && !!this._stack.pop();
  }
}
function kt() {
  const t = s(r());
  return (t.stack =
    t.stack ||
    new wt(
      o("defaultCurrentScope", () => new St()),
      o("defaultIsolationScope", () => new St()),
    ));
}
function $t(t) {
  return kt().withScope(t);
}
function Ot(t, e) {
  const n = kt();
  return n.withScope(() => ((n.getStackTop().scope = t), e(t)));
}
function Tt(t) {
  return kt().withScope(() => t(kt().getIsolationScope()));
}
function Dt(t) {
  const e = s(t);
  return e.acs
    ? e.acs
    : {
        withIsolationScope: Tt,
        withScope: $t,
        withSetScope: Ot,
        withSetIsolationScope: (t, e) => Tt(e),
        getCurrentScope: () => kt().getScope(),
        getIsolationScope: () => kt().getIsolationScope(),
      };
}
function Pt() {
  return Dt(r()).getCurrentScope();
}
function Ct() {
  return Dt(r()).getIsolationScope();
}
function jt() {
  return Pt().getClient();
}
function It(t) {
  const e = t.getPropagationContext(),
    { traceId: n, parentSpanId: r, propagationSpanId: s } = e,
    o = { trace_id: n, span_id: s || vt() };
  return (r && (o.parent_span_id = r), o);
}
const At = "sentry.profile_id",
  Nt = "sentry.exclusive_time";
function Mt(t) {
  if (t) {
    if ("object" == typeof t && "deref" in t && "function" == typeof t.deref)
      try {
        return t.deref();
      } catch {
        return;
      }
    return t;
  }
}
function Lt(t) {
  const e = t;
  return { scope: e._sentryScope, isolationScope: Mt(e._sentryIsolationScope) };
}
const Rt = /^sentry-/;
function Ut(t) {
  const e = (function (t) {
    if (!t || (!M(t) && !Array.isArray(t))) return;
    if (Array.isArray(t))
      return t.reduce((t, e) => {
        const n = qt(e);
        return (
          Object.entries(n).forEach(([e, n]) => {
            t[e] = n;
          }),
          t
        );
      }, {});
    return qt(t);
  })(t);
  if (!e) return;
  const n = Object.entries(e).reduce((t, [e, n]) => {
    if (e.match(Rt)) {
      t[e.slice(7)] = n;
    }
    return t;
  }, {});
  return Object.keys(n).length > 0 ? n : void 0;
}
function qt(t) {
  return t
    .split(",")
    .map((t) => {
      const e = t.indexOf("=");
      if (-1 === e) return [];
      return [t.slice(0, e), t.slice(e + 1)].map((t) => {
        try {
          return decodeURIComponent(t.trim());
        } catch {
          return;
        }
      });
    })
    .reduce((t, [e, n]) => (e && n && (t[e] = n), t), {});
}
const Ft = /^o(\d+)\./,
  Bt = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)([\w.-]+)(?::(\d+))?\/(.+)/;
function Ht(t, e = !1) {
  const {
    host: n,
    path: r,
    pass: s,
    port: o,
    projectId: i,
    protocol: a,
    publicKey: c,
  } = t;
  return `${a}://${c}${e && s ? `:${s}` : ""}@${n}${o ? `:${o}` : ""}/${r ? `${r}/` : r}${i}`;
}
function zt(t) {
  return {
    protocol: t.protocol,
    publicKey: t.publicKey || "",
    pass: t.pass || "",
    host: t.host,
    port: t.port || "",
    path: t.path || "",
    projectId: t.projectId,
  };
}
function Wt(t) {
  const e = t.getOptions(),
    { host: n } = t.getDsn() || {};
  let r;
  return (
    e.orgId
      ? (r = String(e.orgId))
      : n &&
        (r = (function (t) {
          const e = t.match(Ft);
          return e?.[1];
        })(n)),
    r
  );
}
function Yt(e) {
  const n =
    "string" == typeof e
      ? (function (t) {
          const e = Bt.exec(t);
          if (!e) return void c(() => {});
          const [n, r, s = "", o = "", i = "", a = ""] = e.slice(1);
          let u = "",
            p = a;
          const l = p.split("/");
          if (
            (l.length > 1 && ((u = l.slice(0, -1).join("/")), (p = l.pop())), p)
          ) {
            const t = p.match(/^\d+/);
            t && (p = t[0]);
          }
          return zt({
            host: o,
            pass: s,
            path: u,
            projectId: p,
            port: i,
            protocol: n,
            publicKey: r,
          });
        })(e)
      : zt(e);
  if (
    n &&
    (function (e) {
      if (!t) return !0;
      const { port: n, projectId: r, protocol: s } = e;
      return !(
        ["protocol", "publicKey", "host", "projectId"].find(
          (t) => !e[t] && (f.error(`Invalid Sentry Dsn: ${t} missing`), !0),
        ) ||
        (r.match(/^\d+$/)
          ? (function (t) {
              return "http" === t || "https" === t;
            })(s)
            ? n &&
              isNaN(parseInt(n, 10)) &&
              (f.error(`Invalid Sentry Dsn: Invalid port ${n}`), 1)
            : (f.error(`Invalid Sentry Dsn: Invalid protocol ${s}`), 1)
          : (f.error(`Invalid Sentry Dsn: Invalid projectId ${r}`), 1))
      );
    })(n)
  )
    return n;
}
let Gt = !1;
function Jt(t) {
  const { spanId: e, traceId: n, isRemote: r } = t.spanContext(),
    s = r ? e : Zt(t).parent_span_id,
    o = Lt(t).scope;
  return {
    parent_span_id: s,
    span_id: r ? o?.getPropagationContext().propagationSpanId || vt() : e,
    trace_id: n,
  };
}
function Kt(t) {
  return t && t.length > 0
    ? t.map(
        ({
          context: { spanId: t, traceId: e, traceFlags: n, ...r },
          attributes: s,
        }) => ({
          span_id: t,
          trace_id: e,
          sampled: 1 === n,
          attributes: s,
          ...r,
        }),
      )
    : void 0;
}
function Vt(t) {
  return "number" == typeof t
    ? Xt(t)
    : Array.isArray(t)
      ? t[0] + t[1] / 1e9
      : t instanceof Date
        ? Xt(t.getTime())
        : ht();
}
function Xt(t) {
  return t > 9999999999 ? t / 1e3 : t;
}
function Zt(t) {
  if (
    (function (t) {
      return "function" == typeof t.getSpanJSON;
    })(t)
  )
    return t.getSpanJSON();
  const { spanId: e, traceId: n } = t.spanContext();
  if (
    (function (t) {
      const e = t;
      return !!(e.attributes && e.startTime && e.name && e.endTime && e.status);
    })(t)
  ) {
    const {
      attributes: r,
      startTime: s,
      name: o,
      endTime: i,
      status: a,
      links: c,
    } = t;
    return {
      span_id: e,
      trace_id: n,
      data: r,
      description: o,
      parent_span_id:
        "parentSpanId" in t
          ? t.parentSpanId
          : "parentSpanContext" in t
            ? t.parentSpanContext?.spanId
            : void 0,
      start_timestamp: Vt(s),
      timestamp: Vt(i) || void 0,
      status: Qt(a),
      op: r["sentry.op"],
      origin: r["sentry.origin"],
      links: Kt(c),
    };
  }
  return { span_id: e, trace_id: n, start_timestamp: 0, data: {} };
}
function Qt(t) {
  if (t && 0 !== t.code)
    return 1 === t.code ? "ok" : t.message || "internal_error";
}
function te(t) {
  return t._sentryRootSpan || t;
}
function ee() {
  Gt || (c(() => {}), (Gt = !0));
}
function ne(t) {
  f.log(
    `Ignoring span ${t.op} - ${t.description} because it matches \`ignoreSpans\`.`,
  );
}
function re(e, n) {
  if (!n?.length || !e.description) return !1;
  for (const r of n) {
    if (oe(r)) {
      if (rt(e.description, r)) return (t && ne(e), !0);
      continue;
    }
    if (!r.name && !r.op) continue;
    const n = !r.name || rt(e.description, r.name),
      s = !r.op || (e.op && rt(e.op, r.op));
    if (n && s) return (t && ne(e), !0);
  }
  return !1;
}
function se(t, e) {
  const n = e.parent_span_id,
    r = e.span_id;
  if (n) for (const s of t) s.parent_span_id === r && (s.parent_span_id = n);
}
function oe(t) {
  return "string" == typeof t || t instanceof RegExp;
}
const ie = "production";
function ae(t, e) {
  const n = e.getOptions(),
    { publicKey: r } = e.getDsn() || {},
    s = {
      environment: n.environment || ie,
      release: n.release,
      public_key: r,
      trace_id: t,
      org_id: Wt(e),
    };
  return (e.emit("createDsc", s), s);
}
function ce(t) {
  const e = jt();
  if (!e) return {};
  const n = te(t),
    r = Zt(n),
    s = r.data,
    o = n.spanContext().traceState,
    i =
      o?.get("sentry.sample_rate") ??
      s["sentry.sample_rate"] ??
      s["sentry.previous_trace_sample_rate"];
  function a(t) {
    return (
      ("number" != typeof i && "string" != typeof i) ||
        (t.sample_rate = `${i}`),
      t
    );
  }
  const c = n._frozenDsc;
  if (c) return a(c);
  const u = o?.get("sentry.dsc"),
    p = u && Ut(u);
  if (p) return a(p);
  const l = ae(t.spanContext().traceId, e),
    f = s["sentry.source"],
    d = r.description;
  return (
    "url" !== f && d && (l.transaction = d),
    (function () {
      if ("boolean" == typeof __SENTRY_TRACING__ && !__SENTRY_TRACING__)
        return !1;
      const t = jt()?.getOptions();
      return !(!t || (null == t.tracesSampleRate && !t.tracesSampler));
    })() &&
      ((l.sampled = String(
        (function (t) {
          const { traceFlags: e } = t.spanContext();
          return 1 === e;
        })(n),
      )),
      (l.sample_rand =
        o?.get("sentry.sample_rand") ??
        Lt(n).scope?.getPropagationContext().sampleRand.toString())),
    a(l),
    e.emit("createDsc", l, n),
    l
  );
}
function ue(t, e = 100, n = 1 / 0) {
  try {
    return le("", t, e, n);
  } catch (r) {
    return { ERROR: `**non-serializable** (${r})` };
  }
}
function pe(t, e = 3, n = 102400) {
  const r = ue(t, e);
  return (
    (s = r),
    (function (t) {
      return ~-encodeURI(t).split(/%..|./).length;
    })(JSON.stringify(s)) > n
      ? pe(t, e - 1, n)
      : r
  );
  var s;
}
function le(
  t,
  e,
  n = 1 / 0,
  r = 1 / 0,
  s = (function () {
    const t = new WeakSet();
    function e(e) {
      return !!t.has(e) || (t.add(e), !1);
    }
    function n(e) {
      t.delete(e);
    }
    return [e, n];
  })(),
) {
  const [o, i] = s;
  if (
    null == e ||
    ["boolean", "string"].includes(typeof e) ||
    ("number" == typeof e && Number.isFinite(e))
  )
    return e;
  const a = (function (t, e) {
    try {
      if ("domain" === t && e && "object" == typeof e && e._events)
        return "[Domain]";
      if ("domainEmitter" === t) return "[DomainEmitter]";
      if ("undefined" != typeof global && e === global) return "[Global]";
      if ("undefined" != typeof window && e === window) return "[Window]";
      if ("undefined" != typeof document && e === document) return "[Document]";
      if (H(e)) return E(e);
      if (
        U((n = e)) &&
        "nativeEvent" in n &&
        "preventDefault" in n &&
        "stopPropagation" in n
      )
        return "[SyntheticEvent]";
      if ("number" == typeof e && !Number.isFinite(e)) return `[${e}]`;
      if ("function" == typeof e) return `[Function: ${v(e)}]`;
      if ("symbol" == typeof e) return `[${String(e)}]`;
      if ("bigint" == typeof e) return `[BigInt: ${String(e)}]`;
      const r = (function (t) {
        const e = Object.getPrototypeOf(t);
        return e?.constructor ? e.constructor.name : "null prototype";
      })(e);
      return /^HTML(\w*)Element$/.test(r)
        ? `[HTMLElement: ${r}]`
        : `[object ${r}]`;
    } catch (r) {
      return `**non-serializable** (${r})`;
    }
    var n;
  })(t, e);
  if (!a.startsWith("[object ")) return a;
  if (e.__sentry_skip_normalization__) return e;
  const c =
    "number" == typeof e.__sentry_override_normalization_depth__
      ? e.__sentry_override_normalization_depth__
      : n;
  if (0 === c) return a.replace("object ", "");
  if (o(e)) return "[Circular ~]";
  const u = e;
  if (u && "function" == typeof u.toJSON)
    try {
      return le("", u.toJSON(), c - 1, r, s);
    } catch {}
  const p = Array.isArray(e) ? [] : {};
  let l = 0;
  const f = Z(e);
  for (const d in f) {
    if (!Object.prototype.hasOwnProperty.call(f, d)) continue;
    if (l >= r) {
      p[d] = "[MaxProperties ~]";
      break;
    }
    const t = f[d];
    ((p[d] = le(d, t, c - 1, r, s)), l++);
  }
  return (i(e), p);
}
function fe(t, e = []) {
  return [t, e];
}
function de(t, e) {
  const [n, r] = t;
  return [n, [...r, e]];
}
function he(t, e) {
  const n = t[1];
  for (const r of n) {
    if (e(r, r[0].type)) return !0;
  }
  return !1;
}
function me(t) {
  const n = s(e);
  return n.encodePolyfill ? n.encodePolyfill(t) : new TextEncoder().encode(t);
}
function ge(t) {
  const [e, n] = t;
  let r = JSON.stringify(e);
  function s(t) {
    "string" == typeof r
      ? (r = "string" == typeof t ? r + t : [me(r), t])
      : r.push("string" == typeof t ? me(t) : t);
  }
  for (const o of n) {
    const [t, e] = o;
    if (
      (s(`\n${JSON.stringify(t)}\n`),
      "string" == typeof e || e instanceof Uint8Array)
    )
      s(e);
    else {
      let t;
      try {
        t = JSON.stringify(e);
      } catch {
        t = JSON.stringify(ue(e));
      }
      s(t);
    }
  }
  return "string" == typeof r
    ? r
    : (function (t) {
        const e = t.reduce((t, e) => t + e.length, 0),
          n = new Uint8Array(e);
        let r = 0;
        for (const s of t) (n.set(s, r), (r += s.length));
        return n;
      })(r);
}
function _e(t) {
  const e = "string" == typeof t.data ? me(t.data) : t.data;
  return [
    {
      type: "attachment",
      length: e.length,
      filename: t.filename,
      content_type: t.contentType,
      attachment_type: t.attachmentType,
    },
    e,
  ];
}
const ye = {
  session: "session",
  sessions: "session",
  attachment: "attachment",
  transaction: "transaction",
  event: "error",
  client_report: "internal",
  user_report: "default",
  profile: "profile",
  profile_chunk: "profile",
  replay_event: "replay",
  replay_recording: "replay",
  check_in: "monitor",
  feedback: "feedback",
  span: "span",
  raw_security: "security",
  log: "log_item",
  metric: "metric",
  trace_metric: "metric",
};
function ve(t) {
  return ye[t];
}
function be(t) {
  if (!t?.sdk) return;
  const { name: e, version: n } = t.sdk;
  return { name: e, version: n };
}
function Ee(t, e, n, r) {
  const s = be(n),
    o = t.type && "replay_event" !== t.type ? t.type : "event";
  !(function (t, e) {
    if (!e) return t;
    const n = t.sdk || {};
    t.sdk = {
      ...n,
      name: n.name || e.name,
      version: n.version || e.version,
      integrations: [...(t.sdk?.integrations || []), ...(e.integrations || [])],
      packages: [...(t.sdk?.packages || []), ...(e.packages || [])],
      settings:
        t.sdk?.settings || e.settings
          ? { ...t.sdk?.settings, ...e.settings }
          : void 0,
    };
  })(t, n?.sdk);
  const i = (function (t, e, n, r) {
    const s = t.sdkProcessingMetadata?.dynamicSamplingContext;
    return {
      event_id: t.event_id,
      sent_at: new Date().toISOString(),
      ...(e && { sdk: e }),
      ...(!!n && r && { dsn: Ht(r) }),
      ...(s && { trace: s }),
    };
  })(t, s, r, e);
  delete t.sdkProcessingMetadata;
  return fe(i, [[{ type: o }, t]]);
}
function xe(t) {
  return new we((e) => {
    e(t);
  });
}
function Se(t) {
  return new we((e, n) => {
    n(t);
  });
}
class we {
  constructor(t) {
    ((this._state = 0), (this._handlers = []), this._runExecutor(t));
  }
  then(t, e) {
    return new we((n, r) => {
      (this._handlers.push([
        !1,
        (e) => {
          if (t)
            try {
              n(t(e));
            } catch (s) {
              r(s);
            }
          else n(e);
        },
        (t) => {
          if (e)
            try {
              n(e(t));
            } catch (s) {
              r(s);
            }
          else r(t);
        },
      ]),
        this._executeHandlers());
    });
  }
  catch(t) {
    return this.then((t) => t, t);
  }
  finally(t) {
    return new we((e, n) => {
      let r, s;
      return this.then(
        (e) => {
          ((s = !1), (r = e), t && t());
        },
        (e) => {
          ((s = !0), (r = e), t && t());
        },
      ).then(() => {
        s ? n(r) : e(r);
      });
    });
  }
  _executeHandlers() {
    if (0 === this._state) return;
    const t = this._handlers.slice();
    ((this._handlers = []),
      t.forEach((t) => {
        t[0] ||
          (1 === this._state && t[1](this._value),
          2 === this._state && t[2](this._value),
          (t[0] = !0));
      }));
  }
  _runExecutor(t) {
    const e = (t, e) => {
        0 === this._state &&
          (F(e)
            ? e.then(n, r)
            : ((this._state = t), (this._value = e), this._executeHandlers()));
      },
      n = (t) => {
        e(1, t);
      },
      r = (t) => {
        e(2, t);
      };
    try {
      t(n, r);
    } catch (s) {
      r(s);
    }
  }
}
function ke(t, e, n, r = 0) {
  try {
    const s = $e(e, n, t, r);
    return F(s) ? s : xe(s);
  } catch (s) {
    return Se(s);
  }
}
function $e(e, n, r, s) {
  const o = r[s];
  if (!e || !o) return e;
  const i = o({ ...e }, n);
  return (
    t && null === i && f.log(`Event processor "${o.id || "?"}" dropped event`),
    F(i) ? i.then((t) => $e(t, n, r, s + 1)) : $e(i, n, r, s + 1)
  );
}
function Oe(t, e) {
  const {
    fingerprint: n,
    span: r,
    breadcrumbs: s,
    sdkProcessingMetadata: o,
  } = e;
  (!(function (t, e) {
    const {
      extra: n,
      tags: r,
      user: s,
      contexts: o,
      level: i,
      transactionName: a,
    } = e;
    Object.keys(n).length && (t.extra = { ...n, ...t.extra });
    Object.keys(r).length && (t.tags = { ...r, ...t.tags });
    Object.keys(s).length && (t.user = { ...s, ...t.user });
    Object.keys(o).length && (t.contexts = { ...o, ...t.contexts });
    i && (t.level = i);
    a && "transaction" !== t.type && (t.transaction = a);
  })(t, e),
    r &&
      (function (t, e) {
        ((t.contexts = { trace: Jt(e), ...t.contexts }),
          (t.sdkProcessingMetadata = {
            dynamicSamplingContext: ce(e),
            ...t.sdkProcessingMetadata,
          }));
        const n = te(e),
          r = Zt(n).description;
        r && !t.transaction && "transaction" === t.type && (t.transaction = r);
      })(t, r),
    (function (t, e) {
      ((t.fingerprint = t.fingerprint
        ? Array.isArray(t.fingerprint)
          ? t.fingerprint
          : [t.fingerprint]
        : []),
        e && (t.fingerprint = t.fingerprint.concat(e)));
      t.fingerprint.length || delete t.fingerprint;
    })(t, n),
    (function (t, e) {
      const n = [...(t.breadcrumbs || []), ...e];
      t.breadcrumbs = n.length ? n : void 0;
    })(t, s),
    (function (t, e) {
      t.sdkProcessingMetadata = { ...t.sdkProcessingMetadata, ...e };
    })(t, o));
}
function Te(t, e) {
  const {
    extra: n,
    tags: r,
    user: s,
    contexts: o,
    level: i,
    sdkProcessingMetadata: a,
    breadcrumbs: c,
    fingerprint: u,
    eventProcessors: p,
    attachments: l,
    propagationContext: f,
    transactionName: d,
    span: h,
  } = e;
  (De(t, "extra", n),
    De(t, "tags", r),
    De(t, "user", s),
    De(t, "contexts", o),
    (t.sdkProcessingMetadata = _t(t.sdkProcessingMetadata, a, 2)),
    i && (t.level = i),
    d && (t.transactionName = d),
    h && (t.span = h),
    c.length && (t.breadcrumbs = [...t.breadcrumbs, ...c]),
    u.length && (t.fingerprint = [...t.fingerprint, ...u]),
    p.length && (t.eventProcessors = [...t.eventProcessors, ...p]),
    l.length && (t.attachments = [...t.attachments, ...l]),
    (t.propagationContext = { ...t.propagationContext, ...f }));
}
function De(t, e, n) {
  t[e] = _t(t[e], n, 1);
}
let Pe, Ce, je, Ie;
function Ae(t, n, r, s, i, a) {
  const { normalizeDepth: c = 3, normalizeMaxBreadth: u = 1e3 } = t,
    p = {
      ...n,
      event_id: n.event_id || r.event_id || it(),
      timestamp: n.timestamp || ft(),
    },
    l = r.integrations || t.integrations.map((t) => t.name);
  (!(function (t, e) {
    const { environment: n, release: r, dist: s, maxValueLength: o } = e;
    ((t.environment = t.environment || n || ie),
      !t.release && r && (t.release = r));
    !t.dist && s && (t.dist = s);
    const i = t.request;
    i?.url && o && (i.url = et(i.url, o));
    o &&
      t.exception?.values?.forEach((t) => {
        t.value && (t.value = et(t.value, o));
      });
  })(p, t),
    (function (t, e) {
      e.length > 0 &&
        ((t.sdk = t.sdk || {}),
        (t.sdk.integrations = [...(t.sdk.integrations || []), ...e]));
    })(p, l),
    i && i.emit("applyFrameMetadata", n),
    void 0 === n.type &&
      (function (t, n) {
        const r = (function (t) {
          const n = e._sentryDebugIds,
            r = e._debugIds;
          if (!n && !r) return {};
          const s = n ? Object.keys(n) : [],
            o = r ? Object.keys(r) : [];
          if (Ie && s.length === Ce && o.length === je) return Ie;
          ((Ce = s.length), (je = o.length), (Ie = {}), Pe || (Pe = {}));
          const i = (e, n) => {
            for (const r of e) {
              const e = n[r],
                s = Pe?.[r];
              if (s && Ie && e) ((Ie[s[0]] = e), Pe && (Pe[r] = [s[0], e]));
              else if (e) {
                const n = t(r);
                for (let t = n.length - 1; t >= 0; t--) {
                  const s = n[t],
                    o = s?.filename;
                  if (o && Ie && Pe) {
                    ((Ie[o] = e), (Pe[r] = [o, e]));
                    break;
                  }
                }
              }
            }
          };
          return (n && i(s, n), r && i(o, r), Ie);
        })(n);
        t.exception?.values?.forEach((t) => {
          t.stacktrace?.frames?.forEach((t) => {
            t.filename && (t.debug_id = r[t.filename]);
          });
        });
      })(p, t.stackParser));
  const f = (function (t, e) {
    if (!e) return t;
    const n = t ? t.clone() : new St();
    return (n.update(e), n);
  })(s, r.captureContext);
  r.mechanism && pt(p, r.mechanism);
  const d = i ? i.getEventProcessors() : [],
    h = o("globalScope", () => new St()).getScopeData();
  if (a) {
    Te(h, a.getScopeData());
  }
  if (f) {
    Te(h, f.getScopeData());
  }
  const m = [...(r.attachments || []), ...h.attachments];
  (m.length && (r.attachments = m), Oe(p, h));
  return ke([...d, ...h.eventProcessors], p, r).then(
    (t) => (
      t &&
        (function (t) {
          const e = {};
          if (
            (t.exception?.values?.forEach((t) => {
              t.stacktrace?.frames?.forEach((t) => {
                t.debug_id &&
                  (t.abs_path
                    ? (e[t.abs_path] = t.debug_id)
                    : t.filename && (e[t.filename] = t.debug_id),
                  delete t.debug_id);
              });
            }),
            0 === Object.keys(e).length)
          )
            return;
          ((t.debug_meta = t.debug_meta || {}),
            (t.debug_meta.images = t.debug_meta.images || []));
          const n = t.debug_meta.images;
          Object.entries(e).forEach(([t, e]) => {
            n.push({ type: "sourcemap", code_file: t, debug_id: e });
          });
        })(t),
      "number" == typeof c && c > 0
        ? (function (t, e, n) {
            if (!t) return null;
            const r = {
              ...t,
              ...(t.breadcrumbs && {
                breadcrumbs: t.breadcrumbs.map((t) => ({
                  ...t,
                  ...(t.data && { data: ue(t.data, e, n) }),
                })),
              }),
              ...(t.user && { user: ue(t.user, e, n) }),
              ...(t.contexts && { contexts: ue(t.contexts, e, n) }),
              ...(t.extra && { extra: ue(t.extra, e, n) }),
            };
            t.contexts?.trace &&
              r.contexts &&
              ((r.contexts.trace = t.contexts.trace),
              t.contexts.trace.data &&
                (r.contexts.trace.data = ue(t.contexts.trace.data, e, n)));
            t.spans &&
              (r.spans = t.spans.map((t) => ({
                ...t,
                ...(t.data && { data: ue(t.data, e, n) }),
              })));
            t.contexts?.flags &&
              r.contexts &&
              (r.contexts.flags = ue(t.contexts.flags, 3, n));
            return r;
          })(t, c, u)
        : t
    ),
  );
}
function Ne(t) {
  if (t)
    return (function (t) {
      return t instanceof St || "function" == typeof t;
    })(t) ||
      (function (t) {
        return Object.keys(t).some((t) => Me.includes(t));
      })(t)
      ? { captureContext: t }
      : t;
}
const Me = [
  "user",
  "level",
  "extra",
  "contexts",
  "tags",
  "fingerprint",
  "propagationContext",
];
function Le(t, e) {
  return Pt().captureException(t, Ne(e));
}
function Re(t, e) {
  return Pt().captureEvent(t, e);
}
function Ue(t) {
  const n = Ct(),
    r = Pt(),
    { userAgent: s } = e.navigator || {},
    o = mt({
      user: r.getUser() || n.getUser(),
      ...(s && { userAgent: s }),
      ...t,
    }),
    i = n.getSession();
  return (
    "ok" === i?.status && gt(i, { status: "exited" }),
    qe(),
    n.setSession(o),
    o
  );
}
function qe() {
  const t = Ct(),
    e = Pt().getSession() || t.getSession();
  (e &&
    (function (t) {
      let e = {};
      ("ok" === t.status && (e = { status: "exited" }), gt(t, e));
    })(e),
    Fe(),
    t.setSession());
}
function Fe() {
  const t = Ct(),
    e = jt(),
    n = t.getSession();
  n && e && e.captureSession(n);
}
function Be(t = !1) {
  t ? qe() : Fe();
}
function He(t, e, n) {
  return (
    e ||
    `${(function (t) {
      return `${(function (t) {
        const e = t.protocol ? `${t.protocol}:` : "",
          n = t.port ? `:${t.port}` : "";
        return `${e}//${t.host}${n}${t.path ? `/${t.path}` : ""}/api/`;
      })(t)}${t.projectId}/envelope/`;
    })(t)}?${(function (t, e) {
      const n = { sentry_version: "7" };
      return (
        t.publicKey && (n.sentry_key = t.publicKey),
        e && (n.sentry_client = `${e.name}/${e.version}`),
        new URLSearchParams(n).toString()
      );
    })(t, n)}`
  );
}
const ze = [];
function We(t) {
  const e = t.defaultIntegrations || [],
    n = t.integrations;
  let r;
  if (
    (e.forEach((t) => {
      t.isDefaultInstance = !0;
    }),
    Array.isArray(n))
  )
    r = [...e, ...n];
  else if ("function" == typeof n) {
    const t = n(e);
    r = Array.isArray(t) ? t : [t];
  } else r = e;
  return (function (t) {
    const e = {};
    return (
      t.forEach((t) => {
        const { name: n } = t,
          r = e[n];
        (r && !r.isDefaultInstance && t.isDefaultInstance) || (e[n] = t);
      }),
      Object.values(e)
    );
  })(r);
}
function Ye(t, e) {
  for (const n of e) n?.afterAllSetup && n.afterAllSetup(t);
}
function Ge(e, n, r) {
  if (r[n.name])
    t &&
      f.log(`Integration skipped because it was already installed: ${n.name}`);
  else {
    if (
      ((r[n.name] = n),
      ze.includes(n.name) ||
        "function" != typeof n.setupOnce ||
        (n.setupOnce(), ze.push(n.name)),
      n.setup && "function" == typeof n.setup && n.setup(e),
      "function" == typeof n.preprocessEvent)
    ) {
      const t = n.preprocessEvent.bind(n);
      e.on("preprocessEvent", (n, r) => t(n, r, e));
    }
    if ("function" == typeof n.processEvent) {
      const t = n.processEvent.bind(n),
        r = Object.assign((n, r) => t(n, r, e), { id: n.name });
      e.addEventProcessor(r);
    }
    t && f.log(`Integration installed: ${n.name}`);
  }
}
function Je(t, e) {
  const n =
    e ??
    (function (t) {
      return Ke().get(t);
    })(t) ??
    [];
  if (0 === n.length) return;
  const r = t.getOptions(),
    s = (function (t, e, n, r) {
      const s = {};
      return (
        e?.sdk && (s.sdk = { name: e.sdk.name, version: e.sdk.version }),
        n && r && (s.dsn = Ht(r)),
        fe(s, [
          ((o = t),
          [
            {
              type: "log",
              item_count: o.length,
              content_type: "application/vnd.sentry.items.log+json",
            },
            { items: o },
          ]),
        ])
      );
      var o;
    })(n, r._metadata, r.tunnel, t.getDsn());
  (Ke().set(t, []), t.emit("flushLogs"), t.sendEnvelope(s));
}
function Ke() {
  return o("clientToLogBufferMap", () => new WeakMap());
}
function Ve(t, e) {
  const n =
    e ??
    (function (t) {
      return Xe().get(t);
    })(t) ??
    [];
  if (0 === n.length) return;
  const r = t.getOptions(),
    s = (function (t, e, n, r) {
      const s = {};
      return (
        e?.sdk && (s.sdk = { name: e.sdk.name, version: e.sdk.version }),
        n && r && (s.dsn = Ht(r)),
        fe(s, [
          ((o = t),
          [
            {
              type: "trace_metric",
              item_count: o.length,
              content_type: "application/vnd.sentry.items.trace-metric+json",
            },
            { items: o },
          ]),
        ])
      );
      var o;
    })(n, r._metadata, r.tunnel, t.getDsn());
  (Xe().set(t, []), t.emit("flushMetrics"), t.sendEnvelope(s));
}
function Xe() {
  return o("clientToMetricBufferMap", () => new WeakMap());
}
const Ze = Symbol.for("SentryBufferFullError");
function Qe(t = 100) {
  const e = new Set();
  function n(t) {
    e.delete(t);
  }
  return {
    get $() {
      return Array.from(e);
    },
    add: function (r) {
      if (!(e.size < t)) return Se(Ze);
      const s = r();
      return (
        e.add(s),
        s.then(
          () => n(s),
          () => n(s),
        ),
        s
      );
    },
    drain: function (t) {
      if (!e.size) return xe(!0);
      const n = Promise.allSettled(Array.from(e)).then(() => !0);
      if (!t) return n;
      const r = [n, new Promise((e) => setTimeout(() => e(!1), t))];
      return Promise.race(r);
    },
  };
}
function tn(t, { statusCode: e, headers: n }, r = Date.now()) {
  const s = { ...t },
    o = n?.["x-sentry-rate-limits"],
    i = n?.["retry-after"];
  if (o)
    for (const a of o.trim().split(",")) {
      const [t, e, , , n] = a.split(":", 5),
        o = parseInt(t, 10),
        i = 1e3 * (isNaN(o) ? 60 : o);
      if (e)
        for (const a of e.split(";"))
          ("metric_bucket" === a && n && !n.split(";").includes("custom")) ||
            (s[a] = r + i);
      else s.all = r + i;
    }
  else
    i
      ? (s.all =
          r +
          (function (t, e = Date.now()) {
            const n = parseInt(`${t}`, 10);
            if (!isNaN(n)) return 1e3 * n;
            const r = Date.parse(`${t}`);
            return isNaN(r) ? 6e4 : r - e;
          })(i, r))
      : 429 === e && (s.all = r + 6e4);
  return s;
}
function en(e, n, r = Qe(e.bufferSize || 64)) {
  let s = {};
  return {
    send: function (o) {
      const i = [];
      if (
        (he(o, (t, n) => {
          const r = ve(n);
          !(function (t, e, n = Date.now()) {
            return (
              (function (t, e) {
                return t[e] || t.all || 0;
              })(t, e) > n
            );
          })(s, r)
            ? i.push(t)
            : e.recordDroppedEvent("ratelimit_backoff", r);
        }),
        0 === i.length)
      )
        return Promise.resolve({});
      const a = fe(o[0], i),
        c = (t) => {
          he(a, (n, r) => {
            e.recordDroppedEvent(t, ve(r));
          });
        };
      return r
        .add(() =>
          n({ body: ge(a) }).then(
            (e) => (
              void 0 !== e.statusCode &&
                (e.statusCode < 200 || e.statusCode >= 300) &&
                t &&
                f.warn(
                  `Sentry responded with status code ${e.statusCode} to sent event.`,
                ),
              (s = tn(s, e)),
              e
            ),
            (e) => {
              throw (
                c("network_error"),
                t && f.error("Encountered error running transport request:", e),
                e
              );
            },
          ),
        )
        .then(
          (t) => t,
          (e) => {
            if (e === Ze)
              return (
                t && f.error("Skipped sending event because buffer is full."),
                c("queue_overflow"),
                Promise.resolve({})
              );
            throw e;
          },
        );
    },
    flush: (t) => r.drain(t),
  };
}
function nn(t) {
  const e = [];
  t.message && e.push(t.message);
  try {
    const n = t.exception.values[t.exception.values.length - 1];
    n?.value && (e.push(n.value), n.type && e.push(`${n.type}: ${n.value}`));
  } catch {}
  return e;
}
const rn = "Not capturing exception because it's already been captured.",
  sn = "Discarded session because of missing or non-string release",
  on = Symbol.for("SentryInternalError"),
  an = Symbol.for("SentryDoNotSendEventError");
function cn(t) {
  return { message: t, [on]: !0 };
}
function un(t) {
  return { message: t, [an]: !0 };
}
function pn(t) {
  return !!t && "object" == typeof t && on in t;
}
function ln(t) {
  return !!t && "object" == typeof t && an in t;
}
function fn(t, e, n, r, s) {
  let o,
    i = 0,
    a = !1;
  (t.on(n, () => {
    ((i = 0), clearTimeout(o), (a = !1));
  }),
    t.on(e, (e) => {
      ((i += r(e)),
        i >= 8e5
          ? s(t)
          : a ||
            ((a = !0),
            (o = setTimeout(() => {
              s(t);
            }, 5e3))));
    }),
    t.on("flush", () => {
      s(t);
    }));
}
class dn {
  constructor(e) {
    if (
      ((this._options = e),
      (this._integrations = {}),
      (this._numProcessing = 0),
      (this._outcomes = {}),
      (this._hooks = {}),
      (this._eventProcessors = []),
      (this._promiseBuffer = Qe(e.transportOptions?.bufferSize ?? 64)),
      e.dsn
        ? (this._dsn = Yt(e.dsn))
        : t && f.warn("No DSN provided, client will not send events."),
      this._dsn)
    ) {
      const t = He(this._dsn, e.tunnel, e._metadata ? e._metadata.sdk : void 0);
      this._transport = e.transport({
        tunnel: this._options.tunnel,
        recordDroppedEvent: this.recordDroppedEvent.bind(this),
        ...e.transportOptions,
        url: t,
      });
    }
    ((this._options.enableLogs =
      this._options.enableLogs ?? this._options._experiments?.enableLogs),
      this._options.enableLogs &&
        fn(this, "afterCaptureLog", "flushLogs", yn, Je));
    (this._options.enableMetrics ??
      this._options._experiments?.enableMetrics ??
      !0) &&
      fn(this, "afterCaptureMetric", "flushMetrics", _n, Ve);
  }
  captureException(e, n, r) {
    const s = it();
    if (lt(e)) return (t && f.log(rn), s);
    const o = { event_id: s, ...n };
    return (
      this._process(
        () =>
          this.eventFromException(e, o)
            .then((t) => this._captureEvent(t, o, r))
            .then((t) => t),
        "error",
      ),
      o.event_id
    );
  }
  captureMessage(t, e, n, r) {
    const s = { event_id: it(), ...n },
      o = L(t) ? t : String(t),
      i = R(t),
      a = i ? this.eventFromMessage(o, e, s) : this.eventFromException(t, s);
    return (
      this._process(
        () => a.then((t) => this._captureEvent(t, s, r)),
        i ? "unknown" : "error",
      ),
      s.event_id
    );
  }
  captureEvent(e, n, r) {
    const s = it();
    if (n?.originalException && lt(n.originalException))
      return (t && f.log(rn), s);
    const o = { event_id: s, ...n },
      i = e.sdkProcessingMetadata || {},
      a = i.capturedSpanScope,
      c = i.capturedSpanIsolationScope,
      u = hn(e.type);
    return (
      this._process(() => this._captureEvent(e, o, a || r, c), u),
      o.event_id
    );
  }
  captureSession(t) {
    (this.sendSession(t), gt(t, { init: !1 }));
  }
  getDsn() {
    return this._dsn;
  }
  getOptions() {
    return this._options;
  }
  getSdkMetadata() {
    return this._options._metadata;
  }
  getTransport() {
    return this._transport;
  }
  async flush(t) {
    const e = this._transport;
    if (!e) return !0;
    this.emit("flush");
    const n = await this._isClientDoneProcessing(t),
      r = await e.flush(t);
    return n && r;
  }
  async close(t) {
    const e = await this.flush(t);
    return ((this.getOptions().enabled = !1), this.emit("close"), e);
  }
  getEventProcessors() {
    return this._eventProcessors;
  }
  addEventProcessor(t) {
    this._eventProcessors.push(t);
  }
  init() {
    (this._isEnabled() ||
      this._options.integrations.some(({ name: t }) =>
        t.startsWith("Spotlight"),
      )) &&
      this._setupIntegrations();
  }
  getIntegrationByName(t) {
    return this._integrations[t];
  }
  addIntegration(t) {
    const e = this._integrations[t.name];
    (Ge(this, t, this._integrations), e || Ye(this, [t]));
  }
  sendEvent(t, e = {}) {
    this.emit("beforeSendEvent", t, e);
    let n = Ee(t, this._dsn, this._options._metadata, this._options.tunnel);
    for (const r of e.attachments || []) n = de(n, _e(r));
    this.sendEnvelope(n).then((e) => this.emit("afterSendEvent", t, e));
  }
  sendSession(e) {
    const { release: n, environment: r = ie } = this._options;
    if ("aggregates" in e) {
      const s = e.attrs || {};
      if (!s.release && !n) return void (t && f.warn(sn));
      ((s.release = s.release || n),
        (s.environment = s.environment || r),
        (e.attrs = s));
    } else {
      if (!e.release && !n) return void (t && f.warn(sn));
      ((e.release = e.release || n), (e.environment = e.environment || r));
    }
    this.emit("beforeSendSession", e);
    const s = (function (t, e, n, r) {
      const s = be(n);
      return fe(
        {
          sent_at: new Date().toISOString(),
          ...(s && { sdk: s }),
          ...(!!r && e && { dsn: Ht(e) }),
        },
        [
          "aggregates" in t
            ? [{ type: "sessions" }, t]
            : [{ type: "session" }, t.toJSON()],
        ],
      );
    })(e, this._dsn, this._options._metadata, this._options.tunnel);
    this.sendEnvelope(s);
  }
  recordDroppedEvent(e, n, r = 1) {
    if (this._options.sendClientReports) {
      const s = `${e}:${n}`;
      (t && f.log(`Recording outcome: "${s}"${r > 1 ? ` (${r} times)` : ""}`),
        (this._outcomes[s] = (this._outcomes[s] || 0) + r));
    }
  }
  on(t, e) {
    const n = (this._hooks[t] = this._hooks[t] || new Set()),
      r = (...t) => e(...t);
    return (
      n.add(r),
      () => {
        n.delete(r);
      }
    );
  }
  emit(t, ...e) {
    const n = this._hooks[t];
    n && n.forEach((t) => t(...e));
  }
  async sendEnvelope(e) {
    if ((this.emit("beforeEnvelope", e), this._isEnabled() && this._transport))
      try {
        return await this._transport.send(e);
      } catch (n) {
        return (t && f.error("Error while sending envelope:", n), {});
      }
    return (t && f.error("Transport disabled"), {});
  }
  _setupIntegrations() {
    const { integrations: t } = this._options;
    ((this._integrations = (function (t, e) {
      const n = {};
      return (
        e.forEach((e) => {
          e && Ge(t, e, n);
        }),
        n
      );
    })(this, t)),
      Ye(this, t));
  }
  _updateSessionFromEvent(t, e) {
    let n = "fatal" === e.level,
      r = !1;
    const s = e.exception?.values;
    if (s) {
      ((r = !0), (n = !1));
      for (const t of s)
        if (!1 === t.mechanism?.handled) {
          n = !0;
          break;
        }
    }
    const o = "ok" === t.status;
    ((o && 0 === t.errors) || (o && n)) &&
      (gt(t, {
        ...(n && { status: "crashed" }),
        errors: t.errors || Number(r || n),
      }),
      this.captureSession(t));
  }
  async _isClientDoneProcessing(t) {
    let e = 0;
    for (; !t || e < t; ) {
      if ((await new Promise((t) => setTimeout(t, 1)), !this._numProcessing))
        return !0;
      e++;
    }
    return !1;
  }
  _isEnabled() {
    return !1 !== this.getOptions().enabled && void 0 !== this._transport;
  }
  _prepareEvent(t, e, n, r) {
    const s = this.getOptions(),
      o = Object.keys(this._integrations);
    return (
      !e.integrations && o?.length && (e.integrations = o),
      this.emit("preprocessEvent", t, e),
      t.type || r.setLastEventId(t.event_id || e.event_id),
      Ae(s, t, e, n, this, r).then((t) => {
        if (null === t) return t;
        (this.emit("postprocessEvent", t, e),
          (t.contexts = { trace: It(n), ...t.contexts }));
        const r = (function (t, e) {
          const n = e.getPropagationContext();
          return n.dsc || ae(n.traceId, t);
        })(this, n);
        return (
          (t.sdkProcessingMetadata = {
            dynamicSamplingContext: r,
            ...t.sdkProcessingMetadata,
          }),
          t
        );
      })
    );
  }
  _captureEvent(e, n = {}, r = Pt(), s = Ct()) {
    return (
      t &&
        mn(e) &&
        f.log(`Captured error event \`${nn(e)[0] || "<unknown>"}\``),
      this._processEvent(e, n, r, s).then(
        (t) => t.event_id,
        (e) => {
          t &&
            (ln(e) ? f.log(e.message) : pn(e) ? f.warn(e.message) : f.warn(e));
        },
      )
    );
  }
  _processEvent(t, e, n, r) {
    const s = this.getOptions(),
      { sampleRate: o } = s,
      i = gn(t),
      a = mn(t),
      c = `before send for type \`${t.type || "error"}\``,
      u =
        void 0 === o
          ? void 0
          : (function (t) {
              if ("boolean" == typeof t) return Number(t);
              const e = "string" == typeof t ? parseFloat(t) : t;
              return "number" != typeof e || isNaN(e) || e < 0 || e > 1
                ? void 0
                : e;
            })(o);
    if (a && "number" == typeof u && Math.random() > u)
      return (
        this.recordDroppedEvent("sample_rate", "error"),
        Se(
          un(
            `Discarding event because it's not included in the random sample (sampling rate = ${o})`,
          ),
        )
      );
    const p = hn(t.type);
    return this._prepareEvent(t, e, n, r)
      .then((t) => {
        if (null === t)
          throw (
            this.recordDroppedEvent("event_processor", p),
            un("An event processor returned `null`, will not send event.")
          );
        if (e.data && !0 === e.data.__sentry__) return t;
        const n = (function (t, e, n, r) {
          const {
            beforeSend: s,
            beforeSendTransaction: o,
            beforeSendSpan: i,
            ignoreSpans: a,
          } = e;
          let c = n;
          if (mn(c) && s) return s(c, r);
          if (gn(c)) {
            if (i || a) {
              const e = (function (t) {
                const {
                  trace_id: e,
                  parent_span_id: n,
                  span_id: r,
                  status: s,
                  origin: o,
                  data: i,
                  op: a,
                } = t.contexts?.trace ?? {};
                return {
                  data: i ?? {},
                  description: t.transaction,
                  op: a,
                  parent_span_id: n,
                  span_id: r ?? "",
                  start_timestamp: t.start_timestamp ?? 0,
                  status: s,
                  timestamp: t.timestamp,
                  trace_id: e ?? "",
                  origin: o,
                  profile_id: i?.[At],
                  exclusive_time: i?.[Nt],
                  measurements: t.measurements,
                  is_segment: !0,
                };
              })(c);
              if (a?.length && re(e, a)) return null;
              if (i) {
                const t = i(e);
                t
                  ? (c = _t(n, {
                      type: "transaction",
                      timestamp: (u = t).timestamp,
                      start_timestamp: u.start_timestamp,
                      transaction: u.description,
                      contexts: {
                        trace: {
                          trace_id: u.trace_id,
                          span_id: u.span_id,
                          parent_span_id: u.parent_span_id,
                          op: u.op,
                          status: u.status,
                          origin: u.origin,
                          data: {
                            ...u.data,
                            ...(u.profile_id && { [At]: u.profile_id }),
                            ...(u.exclusive_time && { [Nt]: u.exclusive_time }),
                          },
                        },
                      },
                      measurements: u.measurements,
                    }))
                  : ee();
              }
              if (c.spans) {
                const e = [],
                  n = c.spans;
                for (const t of n)
                  if (a?.length && re(t, a)) se(n, t);
                  else if (i) {
                    const n = i(t);
                    n ? e.push(n) : (ee(), e.push(t));
                  } else e.push(t);
                const r = c.spans.length - e.length;
                (r && t.recordDroppedEvent("before_send", "span", r),
                  (c.spans = e));
              }
            }
            if (o) {
              if (c.spans) {
                const t = c.spans.length;
                c.sdkProcessingMetadata = {
                  ...n.sdkProcessingMetadata,
                  spanCountBeforeProcessing: t,
                };
              }
              return o(c, r);
            }
          }
          var u;
          return c;
        })(this, s, t, e);
        return (function (t, e) {
          const n = `${e} must return \`null\` or a valid event.`;
          if (F(t))
            return t.then(
              (t) => {
                if (!U(t) && null !== t) throw cn(n);
                return t;
              },
              (t) => {
                throw cn(`${e} rejected with ${t}`);
              },
            );
          if (!U(t) && null !== t) throw cn(n);
          return t;
        })(n, c);
      })
      .then((s) => {
        if (null === s) {
          if ((this.recordDroppedEvent("before_send", p), i)) {
            const e = 1 + (t.spans || []).length;
            this.recordDroppedEvent("before_send", "span", e);
          }
          throw un(`${c} returned \`null\`, will not send event.`);
        }
        const o = n.getSession() || r.getSession();
        if ((a && o && this._updateSessionFromEvent(o, s), i)) {
          const t =
            (s.sdkProcessingMetadata?.spanCountBeforeProcessing || 0) -
            (s.spans ? s.spans.length : 0);
          t > 0 && this.recordDroppedEvent("before_send", "span", t);
        }
        const u = s.transaction_info;
        if (i && u && s.transaction !== t.transaction) {
          const t = "custom";
          s.transaction_info = { ...u, source: t };
        }
        return (this.sendEvent(s, e), s);
      })
      .then(null, (t) => {
        if (ln(t) || pn(t)) throw t;
        throw (
          this.captureException(t, {
            mechanism: { handled: !1, type: "internal" },
            data: { __sentry__: !0 },
            originalException: t,
          }),
          cn(
            `Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.\nReason: ${t}`,
          )
        );
      });
  }
  _process(t, e) {
    (this._numProcessing++,
      this._promiseBuffer.add(t).then(
        (t) => (this._numProcessing--, t),
        (t) => (
          this._numProcessing--,
          t === Ze && this.recordDroppedEvent("queue_overflow", e),
          t
        ),
      ));
  }
  _clearOutcomes() {
    const t = this._outcomes;
    return (
      (this._outcomes = {}),
      Object.entries(t).map(([t, e]) => {
        const [n, r] = t.split(":");
        return { reason: n, category: r, quantity: e };
      })
    );
  }
  _flushOutcomes() {
    t && f.log("Flushing outcomes...");
    const e = this._clearOutcomes();
    if (0 === e.length) return void (t && f.log("No outcomes to send"));
    if (!this._dsn)
      return void (t && f.log("No dsn provided, will not send outcomes"));
    t && f.log("Sending outcomes:", e);
    const n =
      ((r = e),
      fe((s = this._options.tunnel && Ht(this._dsn)) ? { dsn: s } : {}, [
        [{ type: "client_report" }, { timestamp: ft(), discarded_events: r }],
      ]));
    var r, s;
    this.sendEnvelope(n);
  }
}
function hn(t) {
  return "replay_event" === t ? "replay" : t || "error";
}
function mn(t) {
  return void 0 === t.type;
}
function gn(t) {
  return "transaction" === t.type;
}
function _n(t) {
  let e = 0;
  return (t.name && (e += 2 * t.name.length), (e += 8), e + vn(t.attributes));
}
function yn(t) {
  let e = 0;
  return (t.message && (e += 2 * t.message.length), e + vn(t.attributes));
}
function vn(t) {
  if (!t) return 0;
  let e = 0;
  return (
    Object.values(t).forEach((t) => {
      Array.isArray(t)
        ? (e += t.length * bn(t[0]))
        : R(t)
          ? (e += bn(t))
          : (e += 100);
    }),
    e
  );
}
function bn(t) {
  return "string" == typeof t
    ? 2 * t.length
    : "number" == typeof t
      ? 8
      : "boolean" == typeof t
        ? 4
        : 0;
}
function En(e, n) {
  !0 === n.debug && (t ? f.enable() : c(() => {}));
  Pt().update(n.initialScope);
  const r = new e(n);
  return (
    (function (t) {
      Pt().setClient(t);
    })(r),
    r.init(),
    r
  );
}
function xn(t) {
  if (!t) return {};
  const e = t.match(
    /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/,
  );
  if (!e) return {};
  const n = e[6] || "",
    r = e[8] || "";
  return {
    host: e[4],
    path: e[5],
    protocol: e[2],
    search: n,
    hash: r,
    relative: e[5] + n + r,
  };
}
function Sn(t) {
  "aggregates" in t
    ? void 0 === t.attrs?.ip_address &&
      (t.attrs = { ...t.attrs, ip_address: "{{auto}}" })
    : void 0 === t.ipAddress && (t.ipAddress = "{{auto}}");
}
const wn = 100;
function kn(t, e) {
  const n = jt(),
    r = Ct();
  if (!n) return;
  const { beforeBreadcrumb: s = null, maxBreadcrumbs: o = wn } = n.getOptions();
  if (o <= 0) return;
  const i = { timestamp: ft(), ...t },
    a = s ? c(() => s(i, e)) : i;
  null !== a &&
    (n.emit && n.emit("beforeAddBreadcrumb", a, e), r.addBreadcrumb(a, o));
}
let $n;
const On = new WeakMap(),
  Tn = () => ({
    name: "FunctionToString",
    setupOnce() {
      $n = Function.prototype.toString;
      try {
        Function.prototype.toString = function (...t) {
          const e = X(this),
            n = On.has(jt()) && void 0 !== e ? e : this;
          return $n.apply(n, t);
        };
      } catch {}
    },
    setup(t) {
      On.set(t, !0);
    },
  }),
  Dn = [
    /^Script error\.?$/,
    /^Javascript error: Script error\.? on line 0$/,
    /^ResizeObserver loop completed with undelivered notifications.$/,
    /^Cannot redefine property: googletag$/,
    /^Can't find variable: gmo$/,
    /^undefined is not an object \(evaluating 'a\.[A-Z]'\)$/,
    'can\'t redefine non-configurable property "solana"',
    "vv().getRestrictions is not a function. (In 'vv().getRestrictions(1,a)', 'vv().getRestrictions' is undefined)",
    "Can't find variable: _AutofillCallbackHandler",
    /^Non-Error promise rejection captured with value: Object Not Found Matching Id:\d+, MethodName:simulateEvent, ParamCount:\d+$/,
    /^Java exception was raised during method invocation$/,
  ],
  Pn = (e = {}) => {
    let n;
    return {
      name: "EventFilters",
      setup(t) {
        const r = t.getOptions();
        n = jn(e, r);
      },
      processEvent(r, s, o) {
        if (!n) {
          const t = o.getOptions();
          n = jn(e, t);
        }
        return (function (e, n) {
          if (e.type) {
            if (
              "transaction" === e.type &&
              (function (t, e) {
                if (!e?.length) return !1;
                const n = t.transaction;
                return !!n && st(n, e);
              })(e, n.ignoreTransactions)
            )
              return (
                t &&
                  f.warn(
                    `Event dropped due to being matched by \`ignoreTransactions\` option.\nEvent: ${ct(e)}`,
                  ),
                !0
              );
          } else {
            if (
              (function (t, e) {
                if (!e?.length) return !1;
                return nn(t).some((t) => st(t, e));
              })(e, n.ignoreErrors)
            )
              return (
                t &&
                  f.warn(
                    `Event dropped due to being matched by \`ignoreErrors\` option.\nEvent: ${ct(e)}`,
                  ),
                !0
              );
            if (
              (function (t) {
                if (!t.exception?.values?.length) return !1;
                return (
                  !t.message &&
                  !t.exception.values.some(
                    (t) =>
                      t.stacktrace || (t.type && "Error" !== t.type) || t.value,
                  )
                );
              })(e)
            )
              return (
                t &&
                  f.warn(
                    `Event dropped due to not having an error message, error type or stacktrace.\nEvent: ${ct(e)}`,
                  ),
                !0
              );
            if (
              (function (t, e) {
                if (!e?.length) return !1;
                const n = In(t);
                return !!n && st(n, e);
              })(e, n.denyUrls)
            )
              return (
                t &&
                  f.warn(
                    `Event dropped due to being matched by \`denyUrls\` option.\nEvent: ${ct(e)}.\nUrl: ${In(e)}`,
                  ),
                !0
              );
            if (
              !(function (t, e) {
                if (!e?.length) return !0;
                const n = In(t);
                return !n || st(n, e);
              })(e, n.allowUrls)
            )
              return (
                t &&
                  f.warn(
                    `Event dropped due to not being matched by \`allowUrls\` option.\nEvent: ${ct(e)}.\nUrl: ${In(e)}`,
                  ),
                !0
              );
          }
          return !1;
        })(r, n)
          ? null
          : r;
      },
    };
  },
  Cn = (t = {}) => ({ ...Pn(t), name: "InboundFilters" });
function jn(t = {}, e = {}) {
  return {
    allowUrls: [...(t.allowUrls || []), ...(e.allowUrls || [])],
    denyUrls: [...(t.denyUrls || []), ...(e.denyUrls || [])],
    ignoreErrors: [
      ...(t.ignoreErrors || []),
      ...(e.ignoreErrors || []),
      ...(t.disableErrorDefaults ? [] : Dn),
    ],
    ignoreTransactions: [
      ...(t.ignoreTransactions || []),
      ...(e.ignoreTransactions || []),
    ],
  };
}
function In(e) {
  try {
    const t = [...(e.exception?.values ?? [])]
        .reverse()
        .find(
          (t) =>
            void 0 === t.mechanism?.parent_id && t.stacktrace?.frames?.length,
        ),
      n = t?.stacktrace?.frames;
    return n
      ? (function (t = []) {
          for (let e = t.length - 1; e >= 0; e--) {
            const n = t[e];
            if (
              n &&
              "<anonymous>" !== n.filename &&
              "[native code]" !== n.filename
            )
              return n.filename || null;
          }
          return null;
        })(n)
      : null;
  } catch {
    return (t && f.error(`Cannot extract url for event ${ct(e)}`), null);
  }
}
function An(t, e, n, r, s, o) {
  if (!s.exception?.values || !o || !B(o.originalException, Error)) return;
  const i =
    s.exception.values.length > 0
      ? s.exception.values[s.exception.values.length - 1]
      : void 0;
  i &&
    (s.exception.values = Nn(
      t,
      e,
      r,
      o.originalException,
      n,
      s.exception.values,
      i,
      0,
    ));
}
function Nn(t, e, n, r, s, o, i, a) {
  if (o.length >= n + 1) return o;
  let c = [...o];
  if (B(r[s], Error)) {
    Mn(i, a);
    const o = t(e, r[s]),
      u = c.length;
    (Ln(o, s, u, a), (c = Nn(t, e, n, r[s], s, [o, ...c], o, u)));
  }
  return (
    Array.isArray(r.errors) &&
      r.errors.forEach((r, o) => {
        if (B(r, Error)) {
          Mn(i, a);
          const u = t(e, r),
            p = c.length;
          (Ln(u, `errors[${o}]`, p, a),
            (c = Nn(t, e, n, r, s, [u, ...c], u, p)));
        }
      }),
    c
  );
}
function Mn(t, e) {
  t.mechanism = {
    handled: !0,
    type: "auto.core.linked_errors",
    ...t.mechanism,
    ...("AggregateError" === t.type && { is_exception_group: !0 }),
    exception_id: e,
  };
}
function Ln(t, e, n, r) {
  t.mechanism = {
    handled: !0,
    ...t.mechanism,
    type: "chained",
    source: e,
    exception_id: n,
    parent_id: r,
  };
}
function Rn() {
  "console" in e &&
    i.forEach(function (t) {
      t in e.console &&
        J(e.console, t, function (n) {
          return (
            (a[t] = n),
            function (...n) {
              $("console", { args: n, level: t });
              const r = a[t];
              r?.apply(e.console, n);
            }
          );
        });
    });
}
function Un(t) {
  return "warn" === t
    ? "warning"
    : ["fatal", "error", "warning", "log", "info", "debug"].includes(t)
      ? t
      : "log";
}
const qn = () => {
  let e;
  return {
    name: "Dedupe",
    processEvent(n) {
      if (n.type) return n;
      try {
        if (
          (function (t, e) {
            if (!e) return !1;
            if (
              (function (t, e) {
                const n = t.message,
                  r = e.message;
                if (!n && !r) return !1;
                if ((n && !r) || (!n && r)) return !1;
                if (n !== r) return !1;
                if (!Bn(t, e)) return !1;
                if (!Fn(t, e)) return !1;
                return !0;
              })(t, e)
            )
              return !0;
            if (
              (function (t, e) {
                const n = Hn(e),
                  r = Hn(t);
                if (!n || !r) return !1;
                if (n.type !== r.type || n.value !== r.value) return !1;
                if (!Bn(t, e)) return !1;
                if (!Fn(t, e)) return !1;
                return !0;
              })(t, e)
            )
              return !0;
            return !1;
          })(n, e)
        )
          return (
            t &&
              f.warn(
                "Event dropped due to being a duplicate of previously captured event.",
              ),
            null
          );
      } catch {}
      return (e = n);
    },
  };
};
function Fn(t, e) {
  let n = b(t),
    r = b(e);
  if (!n && !r) return !0;
  if ((n && !r) || (!n && r)) return !1;
  if (r.length !== n.length) return !1;
  for (let s = 0; s < r.length; s++) {
    const t = r[s],
      e = n[s];
    if (
      t.filename !== e.filename ||
      t.lineno !== e.lineno ||
      t.colno !== e.colno ||
      t.function !== e.function
    )
      return !1;
  }
  return !0;
}
function Bn(t, e) {
  let n = t.fingerprint,
    r = e.fingerprint;
  if (!n && !r) return !0;
  if ((n && !r) || (!n && r)) return !1;
  try {
    return !(n.join("") !== r.join(""));
  } catch {
    return !1;
  }
}
function Hn(t) {
  return t.exception?.values?.[0];
}
function zn(t) {
  return void 0 === t
    ? void 0
    : t >= 400 && t < 500
      ? "warning"
      : t >= 500
        ? "error"
        : void 0;
}
const Wn = e;
function Yn(t) {
  return (
    t && /^function\s+\w+\(\)\s+\{\s+\[native code\]\s+\}$/.test(t.toString())
  );
}
function Gn() {
  if ("string" == typeof EdgeRuntime) return !0;
  if (
    !(function () {
      if (!("fetch" in Wn)) return !1;
      try {
        return (new Headers(), new Request("data:,"), new Response(), !0);
      } catch {
        return !1;
      }
    })()
  )
    return !1;
  if (Yn(Wn.fetch)) return !0;
  let e = !1;
  const n = Wn.document;
  if (n && "function" == typeof n.createElement)
    try {
      const t = n.createElement("iframe");
      ((t.hidden = !0),
        n.head.appendChild(t),
        t.contentWindow?.fetch && (e = Yn(t.contentWindow.fetch)),
        n.head.removeChild(t));
    } catch (r) {
      t &&
        f.warn(
          "Could not create sandbox iframe for pure fetch check, bailing to window.fetch: ",
          r,
        );
    }
  return e;
}
function Jn(t, n) {
  const r = "fetch";
  (w(r, t),
    k(r, () =>
      (function (t, n = !1) {
        if (n && !Gn()) return;
        J(e, "fetch", function (t) {
          return function (...n) {
            const r = new Error(),
              { method: s, url: o } = (function (t) {
                if (0 === t.length) return { method: "GET", url: "" };
                if (2 === t.length) {
                  const [e, n] = t;
                  return {
                    url: Vn(e),
                    method: Kn(n, "method")
                      ? String(n.method).toUpperCase()
                      : "GET",
                  };
                }
                const e = t[0];
                return {
                  url: Vn(e),
                  method: Kn(e, "method")
                    ? String(e.method).toUpperCase()
                    : "GET",
                };
              })(n),
              i = {
                args: n,
                fetchData: { method: s, url: o },
                startTimestamp: 1e3 * ht(),
                virtualError: r,
                headers: Xn(n),
              };
            return (
              $("fetch", { ...i }),
              t.apply(e, n).then(
                async (t) => (
                  $("fetch", { ...i, endTimestamp: 1e3 * ht(), response: t }),
                  t
                ),
                (t) => {
                  if (
                    ($("fetch", { ...i, endTimestamp: 1e3 * ht(), error: t }),
                    j(t) &&
                      void 0 === t.stack &&
                      ((t.stack = r.stack), K(t, "framesToPop", 1)),
                    t instanceof TypeError &&
                      ("Failed to fetch" === t.message ||
                        "Load failed" === t.message ||
                        "NetworkError when attempting to fetch resource." ===
                          t.message))
                  )
                    try {
                      const e = new URL(i.fetchData.url);
                      t.message = `${t.message} (${e.host})`;
                    } catch {}
                  throw t;
                },
              )
            );
          };
        });
      })(0, n),
    ));
}
function Kn(t, e) {
  return !!t && "object" == typeof t && !!t[e];
}
function Vn(t) {
  return "string" == typeof t
    ? t
    : t
      ? Kn(t, "url")
        ? t.url
        : t.toString
          ? t.toString()
          : ""
      : "";
}
function Xn(t) {
  const [e, n] = t;
  try {
    if ("object" == typeof n && null !== n && "headers" in n && n.headers)
      return new Headers(n.headers);
    if (((r = e), "undefined" != typeof Request && B(r, Request)))
      return new Headers(e.headers);
  } catch {}
  var r;
}
const Zn = e;
let Qn = 0;
function tr() {
  return Qn > 0;
}
function er(t, e = {}) {
  if (
    !(function (t) {
      return "function" == typeof t;
    })(t)
  )
    return t;
  try {
    const e = t.__sentry_wrapped__;
    if (e) return "function" == typeof e ? e : t;
    if (X(t)) return t;
  } catch {
    return t;
  }
  const n = function (...n) {
    try {
      const r = n.map((t) => er(t, e));
      return t.apply(this, r);
    } catch (s) {
      throw (
        Qn++,
        setTimeout(() => {
          Qn--;
        }),
        (function (...t) {
          const e = Dt(r());
          if (2 === t.length) {
            const [n, r] = t;
            return n ? e.withSetScope(n, r) : e.withScope(r);
          }
          e.withScope(t[0]);
        })((t) => {
          (t.addEventProcessor(
            (t) => (
              e.mechanism && (ut(t, void 0), pt(t, e.mechanism)),
              (t.extra = { ...t.extra, arguments: n }),
              t
            ),
          ),
            Le(s));
        }),
        s
      );
    }
  };
  try {
    for (const e in t)
      Object.prototype.hasOwnProperty.call(t, e) && (n[e] = t[e]);
  } catch {}
  (V(n, t), K(t, "__sentry_wrapped__", n));
  try {
    Object.getOwnPropertyDescriptor(n, "name").configurable &&
      Object.defineProperty(n, "name", { get: () => t.name });
  } catch {}
  return n;
}
function nr(t, e) {
  const n = or(t, e),
    r = { type: cr(e), value: ur(e) };
  return (
    n.length && (r.stacktrace = { frames: n }),
    void 0 === r.type &&
      "" === r.value &&
      (r.value = "Unrecoverable error caught"),
    r
  );
}
function rr(t, e, n, r) {
  const s = jt(),
    o = s?.getOptions().normalizeDepth,
    i = (function (t) {
      for (const e in t)
        if (Object.prototype.hasOwnProperty.call(t, e)) {
          const n = t[e];
          if (n instanceof Error) return n;
        }
      return;
    })(e),
    a = { __serialized__: pe(e, o) };
  if (i) return { exception: { values: [nr(t, i)] }, extra: a };
  const c = {
    exception: {
      values: [
        {
          type: q(e) ? e.constructor.name : r ? "UnhandledRejection" : "Error",
          value: fr(e, { isUnhandledRejection: r }),
        },
      ],
    },
    extra: a,
  };
  if (n) {
    const e = or(t, n);
    e.length && (c.exception.values[0].stacktrace = { frames: e });
  }
  return c;
}
function sr(t, e) {
  return { exception: { values: [nr(t, e)] } };
}
function or(t, e) {
  const n = e.stacktrace || e.stack || "",
    r = (function (t) {
      if (t && ir.test(t.message)) return 1;
      return 0;
    })(e),
    s = (function (t) {
      if ("number" == typeof t.framesToPop) return t.framesToPop;
      return 0;
    })(e);
  try {
    return t(n, r, s);
  } catch {}
  return [];
}
const ir = /Minified React error #\d+;/i;
function ar(t) {
  return (
    "undefined" != typeof WebAssembly &&
    void 0 !== WebAssembly.Exception &&
    t instanceof WebAssembly.Exception
  );
}
function cr(t) {
  const e = t?.name;
  if (!e && ar(t)) {
    return t.message && Array.isArray(t.message) && 2 == t.message.length
      ? t.message[0]
      : "WebAssembly.Exception";
  }
  return e;
}
function ur(t) {
  const e = t?.message;
  return ar(t)
    ? Array.isArray(t.message) && 2 == t.message.length
      ? t.message[1]
      : "wasm exception"
    : e
      ? e.error && "string" == typeof e.error.message
        ? e.error.message
        : e
      : "No error message";
}
function pr(t, e, n, r, s) {
  let o;
  if (A(e) && e.error) {
    return sr(t, e.error);
  }
  if (N(e) || I(e, "DOMException")) {
    const s = e;
    if ("stack" in e) o = sr(t, e);
    else {
      const e = s.name || (N(s) ? "DOMError" : "DOMException"),
        i = s.message ? `${e}: ${s.message}` : e;
      ((o = lr(t, i, n, r)), ut(o, i));
    }
    return (
      "code" in s && (o.tags = { ...o.tags, "DOMException.code": `${s.code}` }),
      o
    );
  }
  if (j(e)) return sr(t, e);
  if (U(e) || q(e)) {
    return ((o = rr(t, e, n, s)), pt(o, { synthetic: !0 }), o);
  }
  return ((o = lr(t, e, n, r)), ut(o, `${e}`), pt(o, { synthetic: !0 }), o);
}
function lr(t, e, n, r) {
  const s = {};
  if (r && n) {
    const r = or(t, n);
    (r.length &&
      (s.exception = { values: [{ value: e, stacktrace: { frames: r } }] }),
      pt(s, { synthetic: !0 }));
  }
  if (L(e)) {
    const { __sentry_template_string__: t, __sentry_template_values__: n } = e;
    return ((s.logentry = { message: t, params: n }), s);
  }
  return ((s.message = e), s);
}
function fr(t, { isUnhandledRejection: e }) {
  const n = (function (t) {
      const e = Object.keys(Z(t));
      return (e.sort(), e[0] ? e.join(", ") : "[object has no keys]");
    })(t),
    r = e ? "promise rejection" : "exception";
  if (A(t))
    return `Event \`ErrorEvent\` captured as ${r} with message \`${t.message}\``;
  if (q(t)) {
    return `Event \`${(function (t) {
      try {
        const e = Object.getPrototypeOf(t);
        return e ? e.constructor.name : void 0;
      } catch {}
    })(t)}\` (type=${t.type}) captured as ${r}`;
  }
  return `Object captured as ${r} with keys: ${n}`;
}
class dr extends dn {
  constructor(t) {
    const e =
      ((r = t),
      {
        release:
          "string" == typeof __SENTRY_RELEASE__
            ? __SENTRY_RELEASE__
            : Zn.SENTRY_RELEASE?.id,
        sendClientReports: !0,
        parentSpanIsAlwaysRootSpan: !0,
        ...r,
      });
    var r;
    (!(function (t, e, r = [e], s = "npm") {
      const o = t._metadata || {};
      (o.sdk ||
        (o.sdk = {
          name: `sentry.javascript.${e}`,
          packages: r.map((t) => ({ name: `${s}:@sentry/${t}`, version: n })),
          version: n,
        }),
        (t._metadata = o));
    })(e, "browser", ["browser"], Zn.SENTRY_SDK_SOURCE || "npm"),
      e._metadata?.sdk &&
        (e._metadata.sdk.settings = {
          infer_ip: e.sendDefaultPii ? "auto" : "never",
          ...e._metadata.sdk.settings,
        }),
      super(e));
    const {
        sendDefaultPii: s,
        sendClientReports: o,
        enableLogs: i,
        _experiments: a,
        enableMetrics: c,
      } = this._options,
      u = c ?? a?.enableMetrics ?? !0;
    (Zn.document &&
      (o || i || u) &&
      Zn.document.addEventListener("visibilitychange", () => {
        "hidden" === Zn.document.visibilityState &&
          (o && this._flushOutcomes(), i && Je(this), u && Ve(this));
      }),
      s && this.on("beforeSendSession", Sn));
  }
  eventFromException(t, e) {
    return (function (t, e, n, r) {
      const s = pr(t, e, n?.syntheticException || void 0, r);
      return (
        pt(s),
        (s.level = "error"),
        n?.event_id && (s.event_id = n.event_id),
        xe(s)
      );
    })(this._options.stackParser, t, e, this._options.attachStacktrace);
  }
  eventFromMessage(t, e = "info", n) {
    return (function (t, e, n = "info", r, s) {
      const o = lr(t, e, r?.syntheticException || void 0, s);
      return ((o.level = n), r?.event_id && (o.event_id = r.event_id), xe(o));
    })(this._options.stackParser, t, e, n, this._options.attachStacktrace);
  }
  _prepareEvent(t, e, n, r) {
    return (
      (t.platform = t.platform || "javascript"),
      super._prepareEvent(t, e, n, r)
    );
  }
}
const hr = "undefined" == typeof __SENTRY_DEBUG__ || __SENTRY_DEBUG__,
  mr = e;
let gr, _r, yr, vr;
function br() {
  if (!mr.document) return;
  const t = $.bind(null, "dom"),
    e = Er(t, !0);
  (mr.document.addEventListener("click", e, !1),
    mr.document.addEventListener("keypress", e, !1),
    ["EventTarget", "Node"].forEach((e) => {
      const n = mr,
        r = n[e]?.prototype;
      r?.hasOwnProperty?.("addEventListener") &&
        (J(r, "addEventListener", function (e) {
          return function (n, r, s) {
            if ("click" === n || "keypress" == n)
              try {
                const r = (this.__sentry_instrumentation_handlers__ =
                    this.__sentry_instrumentation_handlers__ || {}),
                  o = (r[n] = r[n] || { refCount: 0 });
                if (!o.handler) {
                  const r = Er(t);
                  ((o.handler = r), e.call(this, n, r, s));
                }
                o.refCount++;
              } catch {}
            return e.call(this, n, r, s);
          };
        }),
        J(r, "removeEventListener", function (t) {
          return function (e, n, r) {
            if ("click" === e || "keypress" == e)
              try {
                const n = this.__sentry_instrumentation_handlers__ || {},
                  s = n[e];
                s &&
                  (s.refCount--,
                  s.refCount <= 0 &&
                    (t.call(this, e, s.handler, r),
                    (s.handler = void 0),
                    delete n[e]),
                  0 === Object.keys(n).length &&
                    delete this.__sentry_instrumentation_handlers__);
              } catch {}
            return t.call(this, e, n, r);
          };
        }));
    }));
}
function Er(t, e = !1) {
  return (n) => {
    if (!n || n._sentryCaptured) return;
    const r = (function (t) {
      try {
        return t.target;
      } catch {
        return null;
      }
    })(n);
    if (
      (function (t, e) {
        return (
          "keypress" === t &&
          (!e?.tagName ||
            ("INPUT" !== e.tagName &&
              "TEXTAREA" !== e.tagName &&
              !e.isContentEditable))
        );
      })(n.type, r)
    )
      return;
    (K(n, "_sentryCaptured", !0), r && !r._sentryId && K(r, "_sentryId", it()));
    const s = "keypress" === n.type ? "input" : n.type;
    if (
      !(function (t) {
        if (t.type !== _r) return !1;
        try {
          if (!t.target || t.target._sentryId !== yr) return !1;
        } catch {}
        return !0;
      })(n)
    ) {
      (t({ event: n, name: s, global: e }),
        (_r = n.type),
        (yr = r ? r._sentryId : void 0));
    }
    (clearTimeout(gr),
      (gr = mr.setTimeout(() => {
        ((yr = void 0), (_r = void 0));
      }, 1e3)));
  };
}
function xr(t) {
  const e = "history";
  (w(e, t), k(e, Sr));
}
function Sr() {
  function t(t) {
    return function (...e) {
      const n = e.length > 2 ? e[2] : void 0;
      if (n) {
        const r = vr,
          s = (function (t) {
            try {
              return new URL(t, mr.location.origin).toString();
            } catch {
              return t;
            }
          })(String(n));
        if (((vr = s), r === s)) return t.apply(this, e);
        $("history", { from: r, to: s });
      }
      return t.apply(this, e);
    };
  }
  (mr.addEventListener("popstate", () => {
    const t = mr.location.href,
      e = vr;
    if (((vr = t), e === t)) return;
    $("history", { from: e, to: t });
  }),
    "history" in Wn &&
      Wn.history &&
      (J(mr.history, "pushState", t), J(mr.history, "replaceState", t)));
}
const wr = {};
const kr = "__sentry_xhr_v3__";
function $r() {
  if (!mr.XMLHttpRequest) return;
  const t = XMLHttpRequest.prototype;
  ((t.open = new Proxy(t.open, {
    apply(t, e, n) {
      const r = new Error(),
        s = 1e3 * ht(),
        o = M(n[0]) ? n[0].toUpperCase() : void 0,
        i = (function (t) {
          if (M(t)) return t;
          try {
            return t.toString();
          } catch {}
          return;
        })(n[1]);
      if (!o || !i) return t.apply(e, n);
      ((e[kr] = { method: o, url: i, request_headers: {} }),
        "POST" === o &&
          i.match(/sentry_key/) &&
          (e.__sentry_own_request__ = !0));
      const a = () => {
        const t = e[kr];
        if (t && 4 === e.readyState) {
          try {
            t.status_code = e.status;
          } catch {}
          $("xhr", {
            endTimestamp: 1e3 * ht(),
            startTimestamp: s,
            xhr: e,
            virtualError: r,
          });
        }
      };
      return (
        "onreadystatechange" in e && "function" == typeof e.onreadystatechange
          ? (e.onreadystatechange = new Proxy(e.onreadystatechange, {
              apply: (t, e, n) => (a(), t.apply(e, n)),
            }))
          : e.addEventListener("readystatechange", a),
        (e.setRequestHeader = new Proxy(e.setRequestHeader, {
          apply(t, e, n) {
            const [r, s] = n,
              o = e[kr];
            return (
              o && M(r) && M(s) && (o.request_headers[r.toLowerCase()] = s),
              t.apply(e, n)
            );
          },
        })),
        t.apply(e, n)
      );
    },
  })),
    (t.send = new Proxy(t.send, {
      apply(t, e, n) {
        const r = e[kr];
        if (!r) return t.apply(e, n);
        void 0 !== n[0] && (r.body = n[0]);
        return (
          $("xhr", { startTimestamp: 1e3 * ht(), xhr: e }),
          t.apply(e, n)
        );
      },
    })));
}
function Or(
  t,
  e = (function (t) {
    const e = wr[t];
    if (e) return e;
    let n = mr[t];
    if (Yn(n)) return (wr[t] = n.bind(mr));
    const r = mr.document;
    if (r && "function" == typeof r.createElement)
      try {
        const e = r.createElement("iframe");
        ((e.hidden = !0), r.head.appendChild(e));
        const s = e.contentWindow;
        (s?.[t] && (n = s[t]), r.head.removeChild(e));
      } catch (s) {
        hr &&
          f.warn(
            `Could not create sandbox iframe for ${t} check, bailing to window.${t}: `,
            s,
          );
      }
    return n ? (wr[t] = n.bind(mr)) : n;
  })("fetch"),
) {
  let n = 0,
    r = 0;
  return en(
    t,
    async function (s) {
      const o = s.body.length;
      ((n += o), r++);
      const i = {
        body: s.body,
        method: "POST",
        referrerPolicy: "strict-origin",
        headers: t.headers,
        keepalive: n <= 6e4 && r < 15,
        ...t.fetchOptions,
      };
      try {
        const n = await e(t.url, i);
        return {
          statusCode: n.status,
          headers: {
            "x-sentry-rate-limits": n.headers.get("X-Sentry-Rate-Limits"),
            "retry-after": n.headers.get("Retry-After"),
          },
        };
      } catch (a) {
        throw ((wr["fetch"] = void 0), a);
      } finally {
        ((n -= o), r--);
      }
    },
    Qe(t.bufferSize || 40),
  );
}
const Tr = "undefined" == typeof __SENTRY_DEBUG__ || __SENTRY_DEBUG__;
function Dr(t, e, n, r) {
  const s = { filename: t, function: "<anonymous>" === e ? d : e, in_app: !0 };
  return (void 0 !== n && (s.lineno = n), void 0 !== r && (s.colno = r), s);
}
const Pr = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i,
  Cr =
    /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i,
  jr = /\((\S*)(?::(\d+))(?::(\d+))\)/,
  Ir = /at (.+?) ?\(data:(.+?),/,
  Ar =
    /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i,
  Nr = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i,
  Mr = g(
    ...[
      [
        30,
        (t) => {
          const e = t.match(Ir);
          if (e) return { filename: `<data:${e[2]}>`, function: e[1] };
          const n = Pr.exec(t);
          if (n) {
            const [, t, e, r] = n;
            return Dr(t, d, +e, +r);
          }
          const r = Cr.exec(t);
          if (r) {
            if (r[2] && 0 === r[2].indexOf("eval")) {
              const t = jr.exec(r[2]);
              t && ((r[2] = t[1]), (r[3] = t[2]), (r[4] = t[3]));
            }
            const [t, e] = Lr(r[1] || d, r[2]);
            return Dr(e, t, r[3] ? +r[3] : void 0, r[4] ? +r[4] : void 0);
          }
        },
      ],
      [
        50,
        (t) => {
          const e = Ar.exec(t);
          if (e) {
            if (e[3] && e[3].indexOf(" > eval") > -1) {
              const t = Nr.exec(e[3]);
              t &&
                ((e[1] = e[1] || "eval"),
                (e[3] = t[1]),
                (e[4] = t[2]),
                (e[5] = ""));
            }
            let t = e[3],
              n = e[1] || d;
            return (
              ([n, t] = Lr(n, t)),
              Dr(t, n, e[4] ? +e[4] : void 0, e[5] ? +e[5] : void 0)
            );
          }
        },
      ],
    ],
  ),
  Lr = (t, e) => {
    const n = -1 !== t.indexOf("safari-extension"),
      r = -1 !== t.indexOf("safari-web-extension");
    return n || r
      ? [
          -1 !== t.indexOf("@") ? t.split("@")[0] : d,
          n ? `safari-extension:${e}` : `safari-web-extension:${e}`,
        ]
      : [t, e];
  },
  Rr = 1024,
  Ur = (t = {}) => {
    const e = {
      console: !0,
      dom: !0,
      fetch: !0,
      history: !0,
      sentry: !0,
      xhr: !0,
      ...t,
    };
    return {
      name: "Breadcrumbs",
      setup(t) {
        var n;
        (e.console &&
          (function (t) {
            const e = "console";
            (w(e, t), k(e, Rn));
          })(
            (function (t) {
              return function (e) {
                if (jt() !== t) return;
                const n = {
                  category: "console",
                  data: { arguments: e.args, logger: "console" },
                  level: Un(e.level),
                  message: nt(e.args, " "),
                };
                if ("assert" === e.level) {
                  if (!1 !== e.args[0]) return;
                  ((n.message = `Assertion failed: ${nt(e.args.slice(1), " ") || "console.assert"}`),
                    (n.data.arguments = e.args.slice(1)));
                }
                kn(n, { input: e.args, level: e.level });
              };
            })(t),
          ),
          e.dom &&
            ((n = (function (t, e) {
              return function (n) {
                if (jt() !== t) return;
                let r,
                  s,
                  o = "object" == typeof e ? e.serializeAttribute : void 0,
                  i =
                    "object" == typeof e && "number" == typeof e.maxStringLength
                      ? e.maxStringLength
                      : void 0;
                (i &&
                  i > Rr &&
                  (Tr &&
                    f.warn(
                      `\`dom.maxStringLength\` cannot exceed 1024, but a value of ${i} was configured. Sentry will use 1024 instead.`,
                    ),
                  (i = Rr)),
                  "string" == typeof o && (o = [o]));
                try {
                  const t = n.event,
                    e = (function (t) {
                      return !!t && !!t.target;
                    })(t)
                      ? t.target
                      : t;
                  ((r = W(e, { keyAttrs: o, maxStringLength: i })),
                    (s = (function (t) {
                      if (!z.HTMLElement) return null;
                      let e = t;
                      for (let n = 0; n < 5; n++) {
                        if (!e) return null;
                        if (e instanceof HTMLElement) {
                          if (e.dataset.sentryComponent)
                            return e.dataset.sentryComponent;
                          if (e.dataset.sentryElement)
                            return e.dataset.sentryElement;
                        }
                        e = e.parentNode;
                      }
                      return null;
                    })(e)));
                } catch {
                  r = "<unknown>";
                }
                if (0 === r.length) return;
                const a = { category: `ui.${n.name}`, message: r };
                (s && (a.data = { "ui.component_name": s }),
                  kn(a, { event: n.event, name: n.name, global: n.global }));
              };
            })(t, e.dom)),
            w("dom", n),
            k("dom", br)),
          e.xhr &&
            (function (t) {
              (w("xhr", t), k("xhr", $r));
            })(
              (function (t) {
                return function (e) {
                  if (jt() !== t) return;
                  const { startTimestamp: n, endTimestamp: r } = e,
                    s = e.xhr[kr];
                  if (!n || !r || !s) return;
                  const { method: o, url: i, status_code: a, body: c } = s,
                    u = { method: o, url: i, status_code: a },
                    p = {
                      xhr: e.xhr,
                      input: c,
                      startTimestamp: n,
                      endTimestamp: r,
                    },
                    l = {
                      category: "xhr",
                      data: u,
                      type: "http",
                      level: zn(a),
                    };
                  (t.emit("beforeOutgoingRequestBreadcrumb", l, p), kn(l, p));
                };
              })(t),
            ),
          e.fetch &&
            Jn(
              (function (t) {
                return function (e) {
                  if (jt() !== t) return;
                  const { startTimestamp: n, endTimestamp: r } = e;
                  if (
                    r &&
                    (!e.fetchData.url.match(/sentry_key/) ||
                      "POST" !== e.fetchData.method)
                  )
                    if ((e.fetchData.method, e.fetchData.url, e.error)) {
                      const s = e.fetchData,
                        o = {
                          data: e.error,
                          input: e.args,
                          startTimestamp: n,
                          endTimestamp: r,
                        },
                        i = {
                          category: "fetch",
                          data: s,
                          level: "error",
                          type: "http",
                        };
                      (t.emit("beforeOutgoingRequestBreadcrumb", i, o),
                        kn(i, o));
                    } else {
                      const s = e.response,
                        o = { ...e.fetchData, status_code: s?.status };
                      (e.fetchData.request_body_size,
                        e.fetchData.response_body_size);
                      const i = {
                          input: e.args,
                          response: s,
                          startTimestamp: n,
                          endTimestamp: r,
                        },
                        a = {
                          category: "fetch",
                          data: o,
                          type: "http",
                          level: zn(o.status_code),
                        };
                      (t.emit("beforeOutgoingRequestBreadcrumb", a, i),
                        kn(a, i));
                    }
                };
              })(t),
            ),
          e.history &&
            xr(
              (function (t) {
                return function (e) {
                  if (jt() !== t) return;
                  let n = e.from,
                    r = e.to;
                  const s = xn(Zn.location.href);
                  let o = n ? xn(n) : void 0;
                  const i = xn(r);
                  (o?.path || (o = s),
                    s.protocol === i.protocol &&
                      s.host === i.host &&
                      (r = i.relative),
                    s.protocol === o.protocol &&
                      s.host === o.host &&
                      (n = o.relative),
                    kn({ category: "navigation", data: { from: n, to: r } }));
                };
              })(t),
            ),
          e.sentry &&
            t.on(
              "beforeSendEvent",
              (function (t) {
                return function (e) {
                  jt() === t &&
                    kn(
                      {
                        category:
                          "sentry." +
                          ("transaction" === e.type ? "transaction" : "event"),
                        event_id: e.event_id,
                        level: e.level,
                        message: ct(e),
                      },
                      { event: e },
                    );
                };
              })(t),
            ));
      },
    };
  };
const qr = [
    "EventTarget",
    "Window",
    "Node",
    "ApplicationCache",
    "AudioTrackList",
    "BroadcastChannel",
    "ChannelMergerNode",
    "CryptoOperation",
    "EventSource",
    "FileReader",
    "HTMLUnknownElement",
    "IDBDatabase",
    "IDBRequest",
    "IDBTransaction",
    "KeyOperation",
    "MediaController",
    "MessagePort",
    "ModalWindow",
    "Notification",
    "SVGElementInstance",
    "Screen",
    "SharedWorker",
    "TextTrack",
    "TextTrackCue",
    "TextTrackList",
    "WebSocket",
    "WebSocketWorker",
    "Worker",
    "XMLHttpRequest",
    "XMLHttpRequestEventTarget",
    "XMLHttpRequestUpload",
  ],
  Fr = (t = {}) => {
    const e = {
      XMLHttpRequest: !0,
      eventTarget: !0,
      requestAnimationFrame: !0,
      setInterval: !0,
      setTimeout: !0,
      unregisterOriginalCallbacks: !1,
      ...t,
    };
    return {
      name: "BrowserApiErrors",
      setupOnce() {
        (e.setTimeout && J(Zn, "setTimeout", Br),
          e.setInterval && J(Zn, "setInterval", Br),
          e.requestAnimationFrame && J(Zn, "requestAnimationFrame", Hr),
          e.XMLHttpRequest &&
            "XMLHttpRequest" in Zn &&
            J(XMLHttpRequest.prototype, "send", zr));
        const t = e.eventTarget;
        if (t) {
          (Array.isArray(t) ? t : qr).forEach((t) =>
            (function (t, e) {
              const n = Zn,
                r = n[t]?.prototype;
              if (!r?.hasOwnProperty?.("addEventListener")) return;
              (J(r, "addEventListener", function (n) {
                return function (r, s, o) {
                  try {
                    "function" == typeof s.handleEvent &&
                      (s.handleEvent = er(s.handleEvent, {
                        mechanism: {
                          data: { handler: v(s), target: t },
                          handled: !1,
                          type: "auto.browser.browserapierrors.handleEvent",
                        },
                      }));
                  } catch {}
                  return (
                    e.unregisterOriginalCallbacks &&
                      (function (t, e, n) {
                        t &&
                          "object" == typeof t &&
                          "removeEventListener" in t &&
                          "function" == typeof t.removeEventListener &&
                          t.removeEventListener(e, n);
                      })(this, r, s),
                    n.apply(this, [
                      r,
                      er(s, {
                        mechanism: {
                          data: { handler: v(s), target: t },
                          handled: !1,
                          type: "auto.browser.browserapierrors.addEventListener",
                        },
                      }),
                      o,
                    ])
                  );
                };
              }),
                J(r, "removeEventListener", function (t) {
                  return function (e, n, r) {
                    try {
                      const s = n.__sentry_wrapped__;
                      s && t.call(this, e, s, r);
                    } catch {}
                    return t.call(this, e, n, r);
                  };
                }));
            })(t, e),
          );
        }
      },
    };
  };
function Br(t) {
  return function (...e) {
    const n = e[0];
    return (
      (e[0] = er(n, {
        mechanism: {
          handled: !1,
          type: `auto.browser.browserapierrors.${v(t)}`,
        },
      })),
      t.apply(this, e)
    );
  };
}
function Hr(t) {
  return function (e) {
    return t.apply(this, [
      er(e, {
        mechanism: {
          data: { handler: v(t) },
          handled: !1,
          type: "auto.browser.browserapierrors.requestAnimationFrame",
        },
      }),
    ]);
  };
}
function zr(t) {
  return function (...e) {
    const n = this;
    return (
      ["onload", "onerror", "onprogress", "onreadystatechange"].forEach((t) => {
        t in n &&
          "function" == typeof n[t] &&
          J(n, t, function (e) {
            const n = {
                mechanism: {
                  data: { handler: v(e) },
                  handled: !1,
                  type: `auto.browser.browserapierrors.xhr.${t}`,
                },
              },
              r = X(e);
            return (r && (n.mechanism.data.handler = v(r)), er(e, n));
          });
      }),
      t.apply(this, e)
    );
  };
}
const Wr = () => ({
    name: "BrowserSession",
    setupOnce() {
      void 0 !== Zn.document
        ? (Ue({ ignoreDuration: !0 }),
          Be(),
          xr(({ from: t, to: e }) => {
            void 0 !== t && t !== e && (Ue({ ignoreDuration: !0 }), Be());
          }))
        : Tr &&
          f.warn(
            "Using the `browserSessionIntegration` in non-browser environments is not supported.",
          );
    },
  }),
  Yr = (t = {}) => {
    const e = { onerror: !0, onunhandledrejection: !0, ...t };
    return {
      name: "GlobalHandlers",
      setupOnce() {
        Error.stackTraceLimit = 50;
      },
      setup(t) {
        (e.onerror &&
          (!(function (t) {
            !(function (t) {
              const e = "error";
              (w(e, t), k(e, T));
            })((e) => {
              const { stackParser: n, attachStacktrace: r } = Jr();
              if (jt() !== t || tr()) return;
              const { msg: s, url: o, line: i, column: a, error: c } = e,
                u = (function (t, e, n, r) {
                  const s = (t.exception = t.exception || {}),
                    o = (s.values = s.values || []),
                    i = (o[0] = o[0] || {}),
                    a = (i.stacktrace = i.stacktrace || {}),
                    c = (a.frames = a.frames || []),
                    u = r,
                    p = n,
                    l =
                      (function (t) {
                        if (!M(t) || 0 === t.length) return;
                        if (t.startsWith("data:")) {
                          const e = t.match(/^data:([^;]+)/);
                          return `<data:${e ? e[1] : "text/javascript"}${t.includes("base64,") ? ",base64" : ""}>`;
                        }
                        return t;
                      })(e) ?? G();
                  0 === c.length &&
                    c.push({
                      colno: u,
                      filename: l,
                      function: d,
                      in_app: !0,
                      lineno: p,
                    });
                  return t;
                })(pr(n, c || s, void 0, r, !1), o, i, a);
              ((u.level = "error"),
                Re(u, {
                  originalException: c,
                  mechanism: {
                    handled: !1,
                    type: "auto.browser.global_handlers.onerror",
                  },
                }));
            });
          })(t),
          Gr("onerror")),
          e.onunhandledrejection &&
            (!(function (t) {
              !(function (t) {
                const e = "unhandledrejection";
                (w(e, t), k(e, P));
              })((e) => {
                const { stackParser: n, attachStacktrace: r } = Jr();
                if (jt() !== t || tr()) return;
                const s = (function (t) {
                    if (R(t)) return t;
                    try {
                      if ("reason" in t) return t.reason;
                      if ("detail" in t && "reason" in t.detail)
                        return t.detail.reason;
                    } catch {}
                    return t;
                  })(e),
                  o = R(s)
                    ? {
                        exception: {
                          values: [
                            {
                              type: "UnhandledRejection",
                              value: `Non-Error promise rejection captured with value: ${String(s)}`,
                            },
                          ],
                        },
                      }
                    : pr(n, s, void 0, r, !0);
                ((o.level = "error"),
                  Re(o, {
                    originalException: s,
                    mechanism: {
                      handled: !1,
                      type: "auto.browser.global_handlers.onunhandledrejection",
                    },
                  }));
              });
            })(t),
            Gr("onunhandledrejection")));
      },
    };
  };
function Gr(t) {
  Tr && f.log(`Global Handler attached: ${t}`);
}
function Jr() {
  const t = jt();
  return t?.getOptions() || { stackParser: () => [], attachStacktrace: !1 };
}
const Kr = () => ({
    name: "HttpContext",
    preprocessEvent(t) {
      if (!Zn.navigator && !Zn.location && !Zn.document) return;
      const e = (function () {
          const t = G(),
            { referrer: e } = Zn.document || {},
            { userAgent: n } = Zn.navigator || {};
          return {
            url: t,
            headers: {
              ...(e && { Referer: e }),
              ...(n && { "User-Agent": n }),
            },
          };
        })(),
        n = { ...e.headers, ...t.request?.headers };
      t.request = { ...e, ...t.request, headers: n };
    },
  }),
  Vr = (t = {}) => {
    const e = t.limit || 5,
      n = t.key || "cause";
    return {
      name: "LinkedErrors",
      preprocessEvent(t, r, s) {
        An(nr, s.getOptions().stackParser, n, e, t, r);
      },
    };
  };
function Xr() {
  return (
    !!(function () {
      if (void 0 === Zn.window) return !1;
      const t = Zn;
      if (t.nw) return !1;
      const e = t.chrome || t.browser;
      if (!e?.runtime?.id) return !1;
      const n = G(),
        r = [
          "chrome-extension",
          "moz-extension",
          "ms-browser-extension",
          "safari-web-extension",
        ];
      return !(Zn === Zn.top && r.some((t) => n.startsWith(`${t}://`)));
    })() && (Tr && c(() => {}), !0)
  );
}
function Zr(t = {}) {
  const e = !t.skipBrowserExtensionCheck && Xr();
  let n =
    null == t.defaultIntegrations
      ? [Cn(), Tn(), Fr(), Ur(), Yr(), Vr(), qn(), Kr(), Wr()]
      : t.defaultIntegrations;
  const r = {
    ...t,
    enabled: !e && t.enabled,
    stackParser: ((s = t.stackParser || Mr), Array.isArray(s) ? g(...s) : s),
    integrations: We({ integrations: t.integrations, defaultIntegrations: n }),
    transport: t.transport || Or,
  };
  var s;
  return En(dr, r);
}
var Qr = {};
function ts() {
  try {
    Zr({
      dsn: Qr.SENTRY_DSN || "",
      environment: "production",
      release: `grammar-checker@${chrome.runtime.getManifest().version}`,
      tracesSampleRate: 0.1,
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "Non-Error promise rejection captured",
        "NetworkError",
        "Failed to fetch",
      ],
      beforeSend: (t, e) => (
        (t.contexts = {
          ...t.contexts,
          extension: {
            version: chrome.runtime.getManifest().version,
            id: chrome.runtime.id,
          },
        }),
        t
      ),
    });
  } catch (t) {}
}
function es(t, e) {
  Le(t, { extra: e });
}
function ns(t, e = "info", n) {
  !(function (t, e) {
    const n = "string" == typeof e ? e : void 0,
      r = "string" != typeof e ? { captureContext: e } : void 0;
    Pt().captureMessage(t, n, r);
  })(t, { level: e, extra: n });
}
const rs = [],
  ss = [],
  os = [];
function is(t, e, n) {
  const r = { timestamp: Date.now(), operation: t, duration: e, ...n };
  (rs.push(r), rs.length > 100 && rs.shift());
}
function as(t, e) {
  const n = { timestamp: Date.now(), event: t, metadata: e };
  (ss.push(n), ss.length > 100 && ss.shift());
}
function cs(t, e) {
  const n = {
    timestamp: Date.now(),
    error: t.message,
    context: e,
    stack: t.stack,
  };
  (os.push(n), os.length > 100 && os.shift());
}
function us(t) {
  const e = t ? rs.filter((e) => e.operation === t) : rs;
  if (0 === e.length)
    return {
      count: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      p95Duration: 0,
      p99Duration: 0,
    };
  const n = e.map((t) => t.duration).sort((t, e) => t - e),
    r = n.reduce((t, e) => t + e, 0),
    s = Math.floor(0.95 * n.length),
    o = Math.floor(0.99 * n.length);
  return {
    count: e.length,
    avgDuration: r / e.length,
    minDuration: n[0],
    maxDuration: n[n.length - 1],
    p95Duration: n[s] || 0,
    p99Duration: n[o] || 0,
  };
}
function ps(t) {
  const e = os;
  if (0 === e.length)
    return {
      count: 0,
      uniqueErrors: 0,
      mostCommonError: null,
      errorFrequency: {},
    };
  const n = {};
  e.forEach((t) => {
    n[t.error] = (n[t.error] || 0) + 1;
  });
  const r = Object.entries(n).sort((t, e) => e[1] - t[1])[0];
  return {
    count: e.length,
    uniqueErrors: Object.keys(n).length,
    mostCommonError: r ? r[0] : null,
    errorFrequency: n,
  };
}
const ls = Object.freeze(
  Object.defineProperty(
    {
      __proto__: null,
      clearMetrics: function () {
        ((rs.length = 0), (ss.length = 0), (os.length = 0));
      },
      getAllMetrics: function () {
        return { performance: [...rs], usage: [...ss], errors: [...os] };
      },
      getErrorStats: ps,
      getHealthStatus: function () {
        const t = [],
          e = us("analyze");
        ps();
        const n = e.avgDuration;
        n > 100 && t.push(`High average analysis time: ${n.toFixed(2)}ms`);
        const r = rs.length,
          s = r > 0 ? os.length / r : 0;
        s > 0.05 && t.push(`High error rate: ${(100 * s).toFixed(2)}%`);
        const o = rs.filter((t) => t.duration > 100).length;
        o > 0.1 * r && t.push(`Many slow operations: ${o} out of ${r}`);
        let i = "healthy";
        return (
          t.length > 0 && (i = t.length > 2 ? "unhealthy" : "degraded"),
          {
            status: i,
            issues: t,
            metrics: { avgAnalysisTime: n, errorRate: s, slowOperations: o },
          }
        );
      },
      getPerformanceStats: us,
      recordError: cs,
      recordPerformance: is,
      recordUsage: as,
    },
    Symbol.toStringTag,
    { value: "Module" },
  ),
);
export { cs as a, as as b, ns as c, ts as i, es as l, is as r, ls as t };
