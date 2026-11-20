(function (root) {
  const DB_NAME = "revolution-arka-offline";
  const STORES = ["categories", "products", "pending_sales", "pending_fiscal", "pending_prints", "tables"];

  function openDb() {
    return new Promise(function (resolve, reject) {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () {
        const db = req.result;
        STORES.forEach(function (name) {
          if (!db.objectStoreNames.contains(name)) {
            const key = name === "categories" || name === "tables" ? "slug" : name === "products" ? "key" : "local_id";
            db.createObjectStore(name, { keyPath: key });
          }
        });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function txDone(tx) {
    return new Promise(function (resolve, reject) {
      tx.oncomplete = function () { resolve(); };
      tx.onerror = function () { reject(tx.error); };
      tx.onabort = function () { reject(tx.error); };
    });
  }

  async function put(store, value) {
    const db = await openDb();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    await txDone(tx);
    db.close();
  }

  async function get(store, key) {
    const db = await openDb();
    const tx = db.transaction(store, "readonly");
    const row = await new Promise(function (resolve, reject) {
      const req = tx.objectStore(store).get(key);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { reject(req.error); };
    });
    db.close();
    return row;
  }

  async function all(store) {
    const db = await openDb();
    const tx = db.transaction(store, "readonly");
    const rows = await new Promise(function (resolve, reject) {
      const req = tx.objectStore(store).getAll();
      req.onsuccess = function () { resolve(req.result || []); };
      req.onerror = function () { reject(req.error); };
    });
    db.close();
    return rows;
  }

  async function remove(store, key) {
    const db = await openDb();
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    await txDone(tx);
    db.close();
  }

  function uuid() {
    let raw = "";
    if (root.crypto && root.crypto.randomUUID) raw = root.crypto.randomUUID();
    else {
      raw = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        return (c === "x" ? r : (r & 3 | 8)).toString(16);
      });
    }
    return "local-" + raw;
  }

  function jsonResponse(status, data) {
    return new Response(JSON.stringify(data), {
      status: status,
      headers: { "Content-Type": "application/json", "X-Arka-Offline": "1" },
    });
  }

  function bySlug(rows, slug) {
    return rows.filter(function (row) { return row.slug === slug; }).sort(function (a, b) {
      return (a.created || 0) - (b.created || 0);
    });
  }

  async function saveTables(slug, data, session) {
    const prev = await get("tables", slug);
    await put("tables", {
      slug: slug,
      data: data,
      staff: (session && session.staff) || (prev && prev.staff) || null,
      business: (session && session.business) || (prev && prev.business) || "",
    });
  }

  async function saveSession(slug, session) {
    const prev = await get("tables", slug);
    await put("tables", {
      slug: slug,
      data: (prev && prev.data) || null,
      staff: session.staff || null,
      business: session.business || "",
    });
  }

  async function saveCategories(slug, list) {
    await put("categories", { slug: slug, list: list || [] });
  }

  async function saveProducts(slug, list) {
    const rows = list || [];
    const db = await openDb();
    const tx = db.transaction("products", "readwrite");
    const store = tx.objectStore("products");
    rows.forEach(function (item) {
      if (!item || !item.id) return;
      store.put({
        key: slug + ":" + item.id,
        slug: slug,
        id: item.id,
        name: item.name,
        price: item.price,
        barcode: item.barcode || "",
        category_id: item.category_id || null,
        low_stock: !!item.low_stock,
        sold_by_weight: false,
      });
    });
    await txDone(tx);
    db.close();
  }

  async function productsFor(slug, categoryId) {
    const rows = await all("products");
    return rows.filter(function (row) {
      return row.slug === slug && (!categoryId || String(row.category_id) === String(categoryId));
    });
  }

  async function queue(store, slug, extra) {
    const localId = uuid();
    await put(store, Object.assign({ local_id: localId, slug: slug, created: Date.now() }, extra));
    return localId;
  }

  async function handle(slug, path, opts) {
    const method = String((opts && opts.method) || "GET").toUpperCase();
    const clean = String(path || "").split("?")[0];
    let body = {};
    if (opts && opts.body) {
      try { body = JSON.parse(opts.body); } catch (e) { body = {}; }
    }
    if (method === "GET" && clean === "/session") {
      const row = await get("tables", slug);
      if (row && row.staff) {
        return jsonResponse(200, { ok: true, kycu: true, business: row.business || "", staff: row.staff });
      }
      return jsonResponse(503, { ok: false, gabim: "Pa internet — hyni një herë me internet." });
    }
    if (method === "GET" && clean === "/tables") {
      const row = await get("tables", slug);
      if (row && row.data) return jsonResponse(200, row.data);
      return jsonResponse(503, { ok: false, gabim: "Pa internet — tavolinat nuk janë ruajtur ende." });
    }
    if (method === "GET" && clean === "/categories") {
      const row = await get("categories", slug);
      return jsonResponse(200, { ok: true, categories: (row && row.list) || [] });
    }
    if (method === "GET" && clean.indexOf("/products/search/") === 0) {
      const q = decodeURIComponent(clean.slice("/products/search/".length)).toLowerCase();
      const rows = await productsFor(slug);
      const found = rows.filter(function (row) {
        return String(row.name || "").toLowerCase().indexOf(q) >= 0 || String(row.barcode || "") === q;
      }).slice(0, 40);
      return jsonResponse(200, { ok: true, products: found });
    }
    if (method === "GET" && clean.indexOf("/products/") === 0) {
      const id = decodeURIComponent(clean.slice("/products/".length));
      const rows = await productsFor(slug, id);
      return jsonResponse(200, { ok: true, products: rows });
    }
    if (method === "POST" && clean === "/sale") {
      const localId = await queue("pending_sales", slug, { body: body });
      return jsonResponse(200, { ok: true, sale_id: localId, offline: true });
    }
    if (method === "POST" && clean === "/fiscal") {
      const localId = await queue("pending_fiscal", slug, {
        local_sale_id: body.sale_id || "",
        sale_id: body.sale_id || "",
        body: body,
      });
      return jsonResponse(200, {
        ok: false,
        queued: true,
        offline: true,
        local_id: localId,
        gabim: "Pa internet. Kuponi do dërgohet kur kthehet.",
      });
    }
    if (method === "POST" && clean === "/print") {
      const localId = await queue("pending_prints", slug, {
        local_sale_id: body.sale_id || "",
        sale_id: body.sale_id || "",
        body: body,
      });
      return jsonResponse(200, { ok: true, id: localId, offline: true, status: "pending" });
    }
    if (method === "GET" && clean.indexOf("/print/job/") === 0) {
      return jsonResponse(200, { ok: true, status: "pending", offline: true });
    }
    return jsonResponse(503, { ok: false, gabim: "Pa internet — shitjet ruhen lokalisht" });
  }

  async function pending(store, slug) {
    return bySlug(await all(store), slug);
  }

  async function retarget(slug, localSaleId, serverSaleId) {
    const fiscals = await pending("pending_fiscal", slug);
    const prints = await pending("pending_prints", slug);
    for (const row of fiscals) {
      if (row.local_sale_id === localSaleId || row.sale_id === localSaleId) {
        row.sale_id = serverSaleId;
        row.body = Object.assign({}, row.body, { sale_id: serverSaleId });
        await put("pending_fiscal", row);
      }
    }
    for (const row of prints) {
      if (row.local_sale_id === localSaleId || row.sale_id === localSaleId) {
        row.sale_id = serverSaleId;
        row.body = Object.assign({}, row.body, { sale_id: serverSaleId });
        await put("pending_prints", row);
      }
    }
  }

  async function attachFiscal(slug, localSaleId, fiscal) {
    const prints = await pending("pending_prints", slug);
    for (const row of prints) {
      if (row.local_sale_id !== localSaleId && row.sale_id !== localSaleId) continue;
      row.body = Object.assign({}, row.body, {
        fiscal_number: (fiscal && fiscal.fiscal_number) || row.body.fiscal_number || "",
        nuikf: (fiscal && fiscal.nuikf) || row.body.nuikf || "",
      });
      await put("pending_prints", row);
    }
  }

  root.ArkaOffline = {
    handle: handle,
    saveTables: saveTables,
    saveSession: saveSession,
    saveCategories: saveCategories,
    saveProducts: saveProducts,
    pending: pending,
    remove: remove,
    retarget: retarget,
    attachFiscal: attachFiscal,
  };
})(typeof self !== "undefined" ? self : this);
