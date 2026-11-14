(function () {
  const parsed =
    typeof parseProductPath === "function"
      ? parseProductPath(window.location.pathname)
      : { prefix: "", slug: "", role: "", table: 0 };
  const parts = window.location.pathname.split("/").filter(Boolean);
  const isTableMenu =
    parsed.role === "menu" && (parsed.table > 0 || (parts[0] === "menu" && parts.length >= 3));
  const isLegacyKiosk = parts[0] === "kiosk" && parts.length >= 2;

  const slug = parsed.slug || (isLegacyKiosk ? parts[1] : "");
  const tableNumber = isTableMenu
    ? Number(parsed.table || parts[2] || 0)
    : Number(new URLSearchParams(window.location.search).get("table") || 0);
  const params = new URLSearchParams(window.location.search);
  const kitchenKey = isTableMenu ? "" : (params.get("key") || "");
  const apiChannel = isTableMenu ? "menu" : "kiosk";

  let bootstrap = null;
  let cart = [];
  let menuGroupFilter = "";
  let orderSubmitting = false;
  const ORDER_FETCH_TIMEOUT_MS = 15000;

  const $ = id => document.getElementById(id);

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach(el => {
      const on = el.id === id;
      el.classList.toggle("active", on);
      el.classList.toggle("hidden", !on);
    });
  }

  function showMenuView() {
    document.body.classList.remove("checkout-only");
    showScreen("screen-menu");
    updateMenuCartBar();
  }

  function showCheckoutView() {
    document.body.classList.add("checkout-only");
    renderCart();
    showScreen("screen-order");
  }

  function updateMenuCartBar() {
    const bar = $("pub-cart-bar");
    const countEl = $("pub-cart-count");
    const totalEl = $("pub-cart-total");
    const count = cart.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    if (countEl) countEl.textContent = count === 1 ? "1 artikull" : `${count} artikuj`;
    if (totalEl) totalEl.textContent = formatEuro(total);
    if (bar) bar.hidden = count === 0;
    const send = $("btn-send");
    if (send) send.disabled = count === 0;
  }

  function syncKioskLayout() {
    const screen = $("screen-order");
    const bar = $("cart-bar");
    if (!screen || !bar) return;
    const h = Math.ceil(bar.getBoundingClientRect().height);
    screen.style.setProperty("--kiosk-cart-height", `${h}px`);
    screen.style.setProperty("--cart-bar-height", `${h}px`);
  }

  function scheduleKioskLayout() {
    requestAnimationFrame(() => {
      syncKioskLayout();
      requestAnimationFrame(syncKioskLayout);
    });
  }

  function showErr(el, msg) {
    if (!msg) {
      el.classList.add("hidden");
      el.textContent = "";
      return;
    }
    el.textContent = msg;
    el.classList.remove("hidden");
  }

  function formatEuro(n) {
    return Number(n).toFixed(2) + " €";
  }

  function escapeAttr(s) {
    return String(s || "").replace(/"/g, "&quot;");
  }

  function escapeHtml(s) {
    return String(s || "").replace(/</g, "&lt;");
  }

  function apiQuery() {
    return kitchenKey ? `?key=${encodeURIComponent(kitchenKey)}` : "";
  }

  function parseApiResponse(res, data) {
    if (!res.ok || data.ok === false) {
      const msg = data.gabim || `Gabim HTTP ${res.status}`;
      if (res.status === 404 && /lokali nuk u gjet/i.test(msg)) {
        throw new Error(
          `Lokali nuk u gjet (slug: ${slug}). QR i vjetër ose POS offline — Admin → Cloud → Sinkronizo, pastaj printo QR të ri.`,
        );
      }
      throw new Error(msg);
    }
    return data;
  }

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        ...(kitchenKey ? { "x-kitchen-key": kitchenKey } : {}),
      },
      ...opts,
    });
    let data = {};
    try { data = await res.json(); } catch { /* */ }
    return parseApiResponse(res, data);
  }

  async function apiPostWithTimeout(path, body, timeoutMs = ORDER_FETCH_TIMEOUT_MS) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(kitchenKey ? { "x-kitchen-key": kitchenKey } : {}),
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      let data = {};
      try { data = await res.json(); } catch { /* */ }
      return parseApiResponse(res, data);
    } catch (e) {
      if (e.name === "AbortError") {
        throw new Error("Serveri nuk përgjigjet brenda 15 sekondave. Provoni përsëri.");
      }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }

  function updateSyncHint() {
    const hint = $("sync-hint");
    if (!hint) return;
    if (bootstrap?.synced_at) {
      hint.textContent = `Menuja u sinkronizua: ${new Date(bootstrap.synced_at).toLocaleString("sq-AL")}. Porosia shkon te kamarieri — jo faturë.`;
    } else {
      hint.textContent = "Menuja ende nuk është sinkronizuar nga POS ose pronari.";
    }
  }

  function apiPath(suffix) {
    return `/api/${apiChannel}/${encodeURIComponent(slug)}${suffix}${apiQuery()}`;
  }

  let orderTrackHandle = null;

  function stopOrderTracking() {
    if (orderTrackHandle) {
      orderTrackHandle.stop();
      orderTrackHandle = null;
    }
  }

  function startOrderTracking(orderId, trackToken) {
    stopOrderTracking();
    if (!orderId || !trackToken || typeof OrderTrack === "undefined") return;
    const statusUrl = `/api/${apiChannel}/${encodeURIComponent(slug)}/order/${encodeURIComponent(orderId)}/status`;
    orderTrackHandle = OrderTrack.start({
      statusUrl,
      trackToken,
      stepsEl: $("order-track-steps"),
      labelEl: $("order-track-label"),
      detailEl: $("order-track-detail"),
      onUpdate(data) {
        const upd = $("order-track-updated");
        if (upd && data.updated_at) {
          upd.textContent = `Përditësuar: ${new Date(data.updated_at).toLocaleTimeString("sq-AL", { hour: "2-digit", minute: "2-digit" })}`;
        }
      },
    });
    if ($("order-track-steps")) OrderTrack.renderSteps($("order-track-steps"), "pending");
  }

  function kitchenPhotoUrl(item) {
    if (!item?.photo_url) return "";
    const url = String(item.photo_url);
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/menu-stock/")) return url;
    return url + apiQuery();
  }

  /** Si paneli: kategoritë nga POS (sort_order), jo catOrder hardkoduar. */
  function orderedMenuCategories(menu) {
    const present = new Set((menu || []).map(m => String(m.category || "").trim()).filter(Boolean));
    const fromApi = (bootstrap?.categories || [])
      .map(c => String(c || "").trim())
      .filter(c => c && present.has(c));
    if (fromApi.length) {
      for (const c of present) {
        if (!fromApi.includes(c)) fromApi.push(c);
      }
      return fromApi;
    }
    return [...present];
  }

  /** Si paneli/seed: id (local_id) — Espresso… pastaj Çaj. */
  function menuSortedLikePanel(menu) {
    return (menu || []).slice().sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  }

  function renderMenu() {
    if (!window.RPublicMenuUI || !bootstrap) return;
    const wrap = $("menu-sections");
    if (!wrap) return;
    const menu = menuSortedLikePanel(bootstrap.menu || []);
    if (!menu.length) {
      wrap.innerHTML = '<p class="pub-menu-empty">Menuja është bosh. Pronari shton artikuj te Menuja në panel.</p>';
      return;
    }
    menuGroupFilter = window.RPublicMenuUI.render({
      nav: $("cat-nav"),
      wrap,
      categories: orderedMenuCategories(menu),
      menu,
      activeCategory: menuGroupFilter,
      getPhotoUrl: kitchenPhotoUrl,
      onItemClick(item) {
        window.RPublicMenuUI.openItem(item, () => {
          addToCart({ name: item.name, price: Number(item.price) });
        }, kitchenPhotoUrl);
      },
      onCategory(cat) {
        menuGroupFilter = cat;
        renderMenu();
      },
    });
  }

  async function loadBootstrap() {
    if (!slug) {
      throw new Error("URL i gabuar. Duhet /menu/[slug]/[nr-tavoline] ose /kiosk/[slug]?key=...&table=5");
    }
    if (!isTableMenu && !kitchenKey) {
      throw new Error("Mungon kodi i aksesit (?key=...) në link.");
    }
    if (!tableNumber || tableNumber < 1) {
      throw new Error(isTableMenu
        ? "Numri i tavolinës në URL është i pavlefshëm."
        : "Mungon numri i tavolinës (?table=5).");
    }

    bootstrap = await api(apiPath("/menu"));
    const venue = bootstrap.restaurant_name || "Porosi tavoline";
    const title = $("kiosk-title");
    if (title) title.textContent = venue;
    const tableLbl = $("kiosk-table-label");
    if (tableLbl) tableLbl.textContent = `T${tableNumber}`;
    const venueBar = $("kiosk-venue-name");
    if (venueBar) venueBar.textContent = venue;
    const sub = $("order-subtitle");
    if (sub) sub.textContent = `Tavolina ${tableNumber} — porosia shkon te kamarieri`;
    document.title = `${venue} — T${tableNumber}`;

    try {
      const pubRes = await fetch(`/api/r/${encodeURIComponent(slug)}`, { cache: "no-store" });
      const pub = await pubRes.json().catch(() => ({}));
      if (pubRes.ok && pub.ok) {
        if (window.RPublicTheme) window.RPublicTheme.apply(pub);
        if (window.RPublicMenuUI) {
          window.RPublicMenuUI.setLogo("menu-logo", "menu-logo-wrap", pub.logo_url, venue);
          window.RPublicMenuUI.setLogo("order-logo", null, pub.logo_url, venue);
        }
      }
    } catch { /* tema opsionale */ }

    updateSyncHint();
    renderMenu();
    renderCart();
    showMenuView();
  }

  function addToCart(item) {
    const existing = cart.find(c => c.name === item.name);
    if (existing) existing.quantity += 1;
    else cart.push({ ...item, quantity: 1 });
    renderCart();
    updateMenuCartBar();
  }

  function renderCart() {
    const lines = $("cart-lines");
    if (!lines) return;
    const countEl = $("cart-count");
    const count = cart.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    if (countEl) countEl.textContent = count === 1 ? "1 artikull" : `${count} artikuj`;
    if (!cart.length) {
      lines.innerHTML = '<p class="order-cart-empty">Shporta është bosh. Kthehuni te menuja dhe shtoni artikuj, pastaj shtypni Porosit Tani.</p>';
    } else {
      lines.innerHTML = cart.map((it, idx) => `
        <div class="order-cart-line">
          <div class="order-cart-line-name">${escapeHtml(it.name)}</div>
          <div class="order-cart-line-controls">
            <button type="button" class="qty-btn" data-minus="${idx}" aria-label="Zvogëlo">−</button>
            <span class="qty-val">${it.quantity}</span>
            <button type="button" class="qty-btn" data-plus="${idx}" aria-label="Shto">+</button>
          </div>
          <div class="order-cart-line-price">${formatEuro(it.price * it.quantity)}</div>
        </div>`).join("");
      lines.querySelectorAll("[data-minus]").forEach(b => {
        b.addEventListener("click", () => {
          const i = Number(b.dataset.minus);
          cart[i].quantity -= 1;
          if (cart[i].quantity <= 0) cart.splice(i, 1);
          renderCart();
        });
      });
      lines.querySelectorAll("[data-plus]").forEach(b => {
        b.addEventListener("click", () => {
          cart[Number(b.dataset.plus)].quantity += 1;
          renderCart();
        });
      });
    }
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalEl = $("cart-total");
    if (totalEl) totalEl.textContent = formatEuro(total);
    updateMenuCartBar();
    scheduleKioskLayout();
  }

  function bindTap(el, handler) {
    if (!el || el.dataset.tapBound) return;
    el.dataset.tapBound = "1";
    let lastFire = 0;
    let suppressClickUntil = 0;
    const fire = e => {
      const now = Date.now();
      if (now - lastFire < 400) return;
      lastFire = now;
      return handler(e);
    };
    el.addEventListener("touchend", e => {
      const touch = e.changedTouches?.[0];
      const target = touch
        ? document.elementFromPoint(touch.clientX, touch.clientY)
        : e.target;
      if (!target || !el.contains(target)) return;
      suppressClickUntil = Date.now() + 600;
      fire(e);
    }, { passive: true });
    el.addEventListener("click", e => {
      if (Date.now() < suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      fire(e);
    });
  }

  function startNewOrder() {
    stopOrderTracking();
    orderSubmitting = false;
    cart = [];
    renderCart();
    showErr($("order-err"), "");
    const sendBtn = $("btn-send");
    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.textContent = "Dërgo Porosinë";
    }
    showMenuView();
  }

  async function submitOrder() {
    if (orderSubmitting) return;
    const err = $("order-err");
    showErr(err, "");
    if (!cart.length) {
      showErr(err, "Shtoni të paktën një artikull.");
      return;
    }
    const btn = $("btn-send");
    orderSubmitting = true;
    btn.disabled = true;
    btn.textContent = "Duke dërguar...";
    try {
      const result = await apiPostWithTimeout(apiPath("/order"), {
        table_number: tableNumber,
        items: cart.map(c => ({
          name: c.name,
          quantity: c.quantity,
          price: c.price,
        })),
      });
      cart = [];
      renderCart();
      const msgEl = $("success-msg");
      if (msgEl) {
        msgEl.textContent = `Porosia juaj për T${tableNumber} u dërgua te kamarieri.`;
      }
      showScreen("screen-success");
      try {
        startOrderTracking(result.order_id || result.order?.id, result.track_token);
      } catch { /* tracking opsional — mos blloko suksesin */ }
    } catch (e) {
      showErr(err, e.message);
    } finally {
      orderSubmitting = false;
      btn.disabled = cart.length === 0;
      if ($("screen-order")?.classList.contains("active")) {
        btn.textContent = "Dërgo Porosinë";
      }
    }
  }

  bindTap($("btn-send"), submitOrder);
  bindTap($("btn-order-again"), startNewOrder);
  bindTap($("btn-porosit"), showCheckoutView);
  bindTap($("back-to-menu"), showMenuView);

  async function refreshMenu() {
    if (!bootstrap) return;
    try {
      const data = await api(apiPath("/menu"));
      bootstrap.synced_at = data.synced_at;
      bootstrap.menu = data.menu;
      bootstrap.categories = data.categories;
      updateSyncHint();
      renderMenu();
    } catch { /* ignore */ }
  }

  loadBootstrap().catch(e => {
    const el = $("error-msg");
    if (el) el.textContent = e.message;
    showScreen("screen-error");
  });
  window.addEventListener("resize", scheduleKioskLayout);
  window.addEventListener("orientationchange", scheduleKioskLayout);
  setInterval(refreshMenu, 15000);
})();
