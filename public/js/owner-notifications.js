/** Owner panel — Njoftimet Telegram/SMS (pako_5) */
(function () {
  function setMsg(text, ok) {
    const el = document.getElementById("notify-msg");
    if (!el) return;
    el.textContent = text || "";
    el.className = "owner-license-msg" + (text ? (ok ? " ok" : " err") : "");
  }

  function renderCapabilities(caps) {
    const el = document.getElementById("notify-capabilities");
    if (!el || !caps) return;
    const parts = [];
    parts.push(caps.telegram_configured ? "Telegram: aktiv në server" : "Telegram: mungon TELEGRAM_BOT_TOKEN");
    parts.push(caps.sms_configured ? "SMS Vonage: aktiv" : "SMS: mungon VONAGE_API_KEY");
    el.textContent = parts.join(" · ");
  }

  function fillForm(settings) {
    document.getElementById("notify-telegram-id").value = settings?.telegram_chat_id || "";
    document.getElementById("notify-sms-number").value = settings?.sms_number || "";
    document.getElementById("notify-low-stock").checked = settings?.notify_low_stock !== false;
    document.getElementById("notify-daily-report").checked = settings?.notify_daily_report !== false;
  }

  let emailPrefSlug = "";
  let emailPrefReady = false;

  function setEmailMsg(text, ok) {
    const el = document.getElementById("email-pref-msg");
    if (!el) return;
    el.textContent = text || "";
    el.className = "owner-license-msg" + (text ? (ok ? " ok" : " err") : "");
  }

  function emailPrefBody() {
    return {
      slug: emailPrefSlug,
      weekly_report: document.getElementById("email-pref-weekly").checked === true,
      low_stock_alert: document.getElementById("email-pref-stock").checked === true,
      ai_report: document.getElementById("email-pref-ai").checked === true,
    };
  }

  function fillEmailPrefs(data) {
    document.getElementById("email-pref-weekly").checked = data?.weekly_report === true;
    document.getElementById("email-pref-stock").checked = data?.low_stock_alert === true;
    document.getElementById("email-pref-ai").checked = data?.ai_report === true;
  }

  async function loadEmailPrefs() {
    emailPrefReady = false;
    setEmailMsg("", true);
    const client = await api("/api/owner/client");
    const slug = String(client?.client?.kitchen_slug || "").trim().toLowerCase();
    if (!slug) {
      setEmailMsg("Mungon slug i lokalit.", false);
      return;
    }
    emailPrefSlug = slug;
    const data = await api("/api/owner/notification-preferences?slug=" + encodeURIComponent(slug));
    fillEmailPrefs(data);
    emailPrefReady = true;
  }

  async function saveEmailPrefs() {
    await api("/api/owner/notification-preferences", {
      method: "PUT",
      body: JSON.stringify(emailPrefBody()),
    });
  }

  async function loadOwnerNotifications() {
    loadEmailPrefs().catch((err) => setEmailMsg(err.message, false));
    setMsg("Duke ngarkuar…", true);
    try {
      const data = await api("/api/owner/notification-settings");
      fillForm(data.settings);
      renderCapabilities(data.capabilities);
      setMsg("", true);
    } catch (err) {
      setMsg(err.message, false);
    }
  }

  async function saveNotifications() {
    setMsg("Duke ruajtur…", true);
    try {
      const data = await api("/api/owner/notification-settings", {
        method: "PUT",
        body: JSON.stringify({
          telegram_chat_id: document.getElementById("notify-telegram-id").value.trim(),
          sms_number: document.getElementById("notify-sms-number").value.trim(),
          notify_low_stock: document.getElementById("notify-low-stock").checked,
          notify_daily_report: document.getElementById("notify-daily-report").checked,
        }),
      });
      fillForm(data.settings);
      renderCapabilities(data.capabilities);
      setMsg("Njoftimet u ruajtën.", true);
    } catch (err) {
      setMsg(err.message, false);
    }
  }

  async function sendTest() {
    setMsg("Duke dërguar test…", true);
    try {
      await api("/api/owner/notification-settings/test", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setMsg("Mesazhi test u dërgua.", true);
    } catch (err) {
      setMsg(err.message, false);
    }
  }

  function applyNotificationsTab(data) {
    const tab = document.getElementById("tab-notifications");
    if (tab) {
      tab.removeAttribute("hidden");
      tab.classList.remove("hidden", "ai-feature-locked");
      tab.removeAttribute("aria-disabled");
      tab.removeAttribute("title");
    }
    const channels = document.getElementById("notify-channel-card");
    const showChannels = !!(data && data.enabled);
    if (channels) {
      channels.classList.toggle("hidden", !showChannels);
      if (showChannels) channels.removeAttribute("hidden");
      else channels.setAttribute("hidden", "");
    }
  }

  window.loadOwnerNotifications = loadOwnerNotifications;
  window.applyNotificationsTab = applyNotificationsTab;

  document.querySelectorAll(".email-pref-switch").forEach((input) => {
    input.addEventListener("change", () => {
      if (!emailPrefReady) return;
      const prev = !input.checked;
      saveEmailPrefs()
        .then(() => setEmailMsg("", true))
        .catch((err) => {
          input.checked = prev;
          setEmailMsg(err.message, false);
        });
    });
  });

  document.getElementById("btn-notify-save")?.addEventListener("click", () => {
    saveNotifications().catch(err => setMsg(err.message, false));
  });
  document.getElementById("btn-notify-test")?.addEventListener("click", () => {
    sendTest().catch(err => setMsg(err.message, false));
  });
})();
