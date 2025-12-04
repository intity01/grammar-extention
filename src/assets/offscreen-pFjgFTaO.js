let e = null;
function r(e, r) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon48.png"),
    title: "Grammar Checker",
    message: e,
    priority: "error" === r ? 2 : 1,
  });
}
function t() {
  (e && clearTimeout(e),
    (e = setTimeout(() => {
      window.close();
    }, 3e4)));
}
chrome.runtime.onMessage.addListener((e, c, i) =>
  "WRITE_TO_CLIPBOARD" === e.type
    ? ((async function (e) {
        const r = (function (e) {
          let r = e.replace(
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            "",
          );
          return (
            (r = r.replace(/<[^>]*>/g, "")),
            (r = r.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")),
            (r = r.replace(/javascript:/gi, "")),
            r.trim()
          );
        })(e);
        try {
          await navigator.clipboard.writeText(r);
        } catch (t) {
          throw t;
        }
      })(e.text)
        .then(() => {
          (r("Corrected text copied to clipboard", "success"),
            i({ success: !0 }),
            t());
        })
        .catch((e) => {
          (r("Failed to copy to clipboard: " + e.message, "error"),
            i({ success: !1, error: e.message }),
            t());
        }),
      !0)
    : (i({ success: !1, error: "Unknown message type" }), !1),
);
