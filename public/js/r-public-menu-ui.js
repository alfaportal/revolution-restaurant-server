(function (global) {
  const ITEM_EMOJI = [
    [/coca|cola|pepsi|fanta|sprite|schweppes|mirinda/, "🥤"],
    [/red\s*bull|monster|energj/i, "⚡"],
    [/kafe|espresso|cappuccino|latte|macchiato|moka|americano/, "☕"],
    [/çaj|caj|tea|ice\s*tea|icetea/, "🍵"],
    [/ujë|uje|water|mineral/, "💧"],
    [/lëng|leng|juice|smoothie|frut/, "🧃"],
    [/birr|beer|ver[eë]|wine|whisk|rak[ij]|alkool|cocktail|mojito|spritz/, "🍺"],
    [/pizza/, "🍕"],
    [/burger|hamburger/, "🍔"],
    [/sandwich|toast|bagel/, "🥪"],
    [/pasta|spaghetti|lasagn|makaron/, "🍝"],
    [/salat|salad/, "🥗"],
    [/sup[eë]|soup|corb/, "🍲"],
    [/embelsir|dessert|akullore|ice\s*cream|tort|cake|krempit|ëmbël|embels/, "🍰"],
    [/mish|steak|qebap|kebab|grill|zgar/, "🥩"],
    [/pule|chicken|nuggets/, "🍗"],
    [/peshk|fish|salmon/, "🐟"],
    [/omlet|veze|egg/, "🍳"],
    [/patate|fries|chips/, "🍟"],
    [/sushi/, "🍣"],
    [/taco|burrito|mex/, "🌮"],
  ];

  function euro(n) {
    return Number(n || 0).toFixed(2) + " €";
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return String(s ?? "").replace(/"/g, "&quot;");
  }

  function menuSortedLikePanel(menu) {
    return (menu || []).slice().sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
  }

  function menuMotif(category) {
    const n = String(category || "").trim().toLowerCase();
    if (/nxeht|kafe|espresso|çaj|caj|coffee|tea|latte|cappuccino/.test(n)) return "steam";
    if (/ftoht|pije|drink|birra|beer|ver[eë]|wine|alkool|cola|juice/.test(n)) return "glass";
    if (/salat|salad|perime|mish|peshk|grill|tradicional|shoq|mengjes|mëngjes/.test(n)) return "leaf";
    return "swirl";
  }

  function menuItemEmoji(item) {
    const name = String(item?.name || "").trim().toLowerCase();
    for (const [re, emoji] of ITEM_EMOJI) {
      if (re.test(name)) return emoji;
    }
    return "🍽️";
  }

  function setLogo(img, wrap, url, alt) {
    const logo = typeof img === "string" ? document.getElementById(img) : img;
    const box = typeof wrap === "string" ? document.getElementById(wrap) : wrap;
    if (!logo) return;
    if (url) {
      logo.src = url;
      logo.alt = alt || "";
      logo.hidden = false;
      if (box) box.hidden = false;
    } else {
      logo.removeAttribute("src");
      logo.hidden = true;
      if (box) box.hidden = true;
    }
  }

  function renderCards(wrap, items, getPhotoUrl, onItemClick) {
    wrap.dataset.motif = menuMotif(items[0]?.category);
    wrap.innerHTML = `<div class="pub-menu-grid">${items.map((it, idx) => {
      const price = Number(it.price);
      const safePrice = Number.isFinite(price) ? price : 0;
      const gold = safePrice >= 5;
      const photoUrl = getPhotoUrl ? String(getPhotoUrl(it) || "").trim() : String(it.photo_url || "").trim();
      const desc = String(it.description || "").trim();
      const media = photoUrl
        ? `<div class="pub-menu-media"><img src="${escapeAttr(photoUrl)}" alt="" loading="lazy" width="120" height="120"></div>`
        : `<div class="pub-menu-media pub-menu-emoji" aria-hidden="true">${menuItemEmoji(it)}</div>`;
      return `
        <button type="button" class="pub-menu-card" data-idx="${idx}" aria-label="${escapeAttr(it.name)}">
          <div class="pub-menu-body">
            <h3 class="pub-menu-name">${escapeHtml(it.name)}</h3>
            ${desc ? `<p class="pub-menu-desc">${escapeHtml(desc)}</p>` : ""}
            <span class="pub-menu-price${gold ? " is-gold" : ""}">${euro(safePrice)}</span>
          </div>
          ${media}
        </button>`;
    }).join("")}</div>`;

    wrap.querySelectorAll(".pub-menu-card img").forEach(img => {
      img.addEventListener("error", () => {
        const media = img.closest(".pub-menu-media");
        if (!media) return;
        const name = img.closest(".pub-menu-card")?.getAttribute("aria-label") || "";
        media.className = "pub-menu-media pub-menu-emoji";
        media.setAttribute("aria-hidden", "true");
        media.textContent = menuItemEmoji({ name });
      }, { once: true });
    });

    wrap.querySelectorAll(".pub-menu-card").forEach(card => {
      card.addEventListener("click", () => {
        const item = items[Number(card.dataset.idx)];
        if (item && onItemClick) onItemClick(item, card);
      });
    });
  }

  function render(opts) {
    const nav = opts.nav;
    const wrap = opts.wrap;
    if (!nav || !wrap) return "";
    const list = menuSortedLikePanel(opts.menu || []);
    const cats = (opts.categories || []).filter(Boolean).length
      ? opts.categories.filter(Boolean)
      : [...new Set(list.map(i => i?.category).filter(Boolean))];
    let active = opts.activeCategory || "";
    if (!cats.length) {
      nav.innerHTML = "";
      wrap.innerHTML = '<p class="pub-menu-empty">Menuja do të publikohet së shpejti.</p>';
      return "";
    }
    if (!active || !cats.includes(active)) active = cats[0];
    nav.innerHTML = cats.map(cat => {
      const enc = encodeURIComponent(cat);
      const on = cat === active ? " active" : "";
      return `<button type="button" data-cat="${enc}" class="cat-tab${on}">${escapeHtml(cat)}</button>`;
    }).join("");
    const items = list.filter(i => i && i.category === active && i.name);
    if (!items.length) {
      wrap.dataset.motif = menuMotif(active);
      wrap.innerHTML = '<p class="pub-menu-empty">Nuk ka artikuj në këtë kategori.</p>';
    } else {
      renderCards(wrap, items, opts.getPhotoUrl, opts.onItemClick);
    }
    nav.querySelectorAll(".cat-tab").forEach(btn => {
      btn.addEventListener("click", () => {
        const next = decodeURIComponent(btn.dataset.cat || "");
        opts.onCategory?.(next);
      });
    });
    return active;
  }

  function openItem(item, onAdd, getPhotoUrl) {
    const add = () => onAdd?.(item);
    const photo = it => (getPhotoUrl ? getPhotoUrl(it) : String(it.photo_url || "").trim());
    try {
      if (global.MenuPosUI?.openItemDetailModal) {
        global.MenuPosUI.openItemDetailModal(item, {
          formatEuro: euro,
          getPhotoUrl: photo,
          theme: "dark",
          onAdd: add,
        });
        return;
      }
      if (global.MenuPosUI?.handleItemSelect) {
        global.MenuPosUI.handleItemSelect(item, null, {
          onSelect: add,
          formatEuro: euro,
          getPhotoUrl: photo,
          theme: "dark",
          alwaysModal: true,
        });
        return;
      }
    } catch { /* */ }
    add();
  }

  global.RPublicMenuUI = {
    euro,
    escapeHtml,
    escapeAttr,
    menuSortedLikePanel,
    setLogo,
    render,
    openItem,
  };
})(window);
