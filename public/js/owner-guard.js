(function () {
  if (window.__riOwnerGuard) return;
  window.__riOwnerGuard = true;

  function ndal() {
    if (window.__riOwnerNdalur) return;
    window.__riOwnerNdalur = true;
    window.fetch = function () {
      return Promise.reject(new Error("ndalur"));
    };
    document.documentElement.innerHTML =
      '<body style="margin:0;background:#1a1a2e;color:#fff;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:2rem"><div><h1>Ndaluar</h1><p>Mjetet e shfletuesit janë të hapura. Mbylli dhe hape panelin përsëri.</p></div></body>';
  }

  document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  document.addEventListener(
    "keydown",
    function (event) {
      const key = event.key || "";
      const ctrl = event.ctrlKey || event.metaKey;
      const block =
        key === "F12" ||
        (ctrl && event.shiftKey && /^[IJC]$/i.test(key)) ||
        (ctrl && /^u$/i.test(key));
      if (!block) return;
      event.preventDefault();
      event.stopPropagation();
      ndal();
    },
    true,
  );

  setInterval(function () {
    const dw = Math.abs((window.outerWidth || 0) - (window.innerWidth || 0));
    const dh = Math.abs((window.outerHeight || 0) - (window.innerHeight || 0));
    if (dw > 160 || dh > 320) ndal();
  }, 1500);
})();
