# PUNA.md — revolution-restaurant-server (gateway)

## 2026-11-02 — Railway: UTF-8 te manuali (nixpacks)

Deploy dështoi: `Error reading public/website/manual-en-sections.js` / `stream did not contain valid UTF-8`.
Skedarët kishin shenja Windows-1252 (`« » — ë ç`) të përziera me UTF-8. U transkoduan në UTF-8 të pastër. Teksti i njëjtë.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/website/manual-en-sections.js` | « » — → UTF-8 (gabimi i Railway) |
| `public/website/manual.html` | ë ç « » — → UTF-8 |
| `public/css/menu-pos.css` | 6 × — |
| `public/owner/login.html` | ë — · (vetëm kodim, jo UI) |

Provë: `node --check` + TextDecoder fatal UTF-8 OK. Commit/push për deploy.

---

## 2026-11-02 — Super Admin: email/PW Security + Fiskale + Kontabilisti

`POST set-password` për këto tre produkte nuk prek më `users` të POS. Shkon te bridge.

| Skedar | Ndryshimi |
|--------|-----------|
| `src/routes/super.js` | degë security / fiskale / kontabilisti |
| `src/lib/securityAdminBridge.js` | `setSecurityClientOwnerPassword` → `POST /clients/:id/password` (ekzistonte) + PATCH email |
| `src/lib/fiskalizimAdminBridge.js` | `set-password` HOTEL + fallback `/password` |
| `src/lib/kontabilistiAdminBridge.js` | e njëjta |

Security server: endpoint **ekzistonte**. Fiskale/Kontabilisti: burimi **nuk** është në këtë PC — nuk u shtuan rrugë atje.

Provë: `node --check`. Commit/push/deploy te ky hap.

---

## 2026-11-02 — Super Admin HOTEL: email/fjalëkalim përmes hotelAdminBridge

Kur `product_line=hotel`, `POST /api/super/dashboard/clients/:id/set-password` **nuk** prek `users` të POS. Shkon te hotel-server si MARKET.

| Skedar | Ndryshimi |
|--------|-----------|
| `src/routes/super.js` | degë `hotel` → `setHotelClientOwnerPassword` |
| `src/lib/hotelAdminBridge.js` | `setHotelClientOwnerPassword` + `setHotelClientOwnerEmail` |

PATCH klienti HOTEL mbetet `updateHotelClient` (email i hyrjes sinkronizohet te hotel-server `updateClient`).

Provë: `node --check`. **Nuk u bë deploy/build/git.** Duhet edhe deploy i hotel-server.

**Nuk preka:** `public/admin/`, desktop HOTEL, URL/secrets, MARKET/KAFENE.

---

## 2026-11-02 — Super Admin: ndrysho email/fjalëkalim pronari

Rruga ekzistonte: `POST /api/super/dashboard/clients/:id/set-password` + `PATCH /api/admin/owners/:id`.
Bug: `setOwnerPasswordForClient` injoronte `email` kur pronari ekzistonte; `updateClient` e fshihte dështimin e sync-ut të email-it.

| Skedar | Ndryshimi |
|--------|-----------|
| `src/services/userService.js` | `setOwnerPasswordForClient` ruan email + bcrypt 12 + `clients.email` |
| `src/services/licenseService.js` | `updateClient` sync email pronari pa e fshehur gabimin |
| `src/routes/super.js` | set-password kthen 400 jo 500 për validim |
| `public/admin/dashboard.js` | fusha «Email i hyrjes» + butoni ruan email/fjalëkalimin |

Provë: `node --check` OK; live `POST set-password` pa auth → 401; fjalëkalim 3 shkronja → gabim «min. 6». Nuk u ndryshua email/PW i Te naseri.

**Nuk preka:** HOTEL, build, git, deploy.

---

## 2026-11-02 — users: super_admin në OLD Supabase

OLD `jdlypmieskgrqsfyjrul`. Tabela `users` **nuk** ishte 0: 1 rresht `supoort@ketujemi.com` (`client_admin`) — **nuk u fshi**.
U insertua `naserbuzhala189@gmail.com`, `roli=super_admin`, `aktiv=true`, `passwordi` bcryptjs cost 12 nga `SUPER_ADMIN_PASSWORD` në `.env`.
Provë: SELECT pas insert → 2 rreshta; `bcrypt.compare` mbi hash-in në DB = true.

**Nuk preka:** HOTEL, NEW Supabase, kod, keys, git, build.

---

## 2026-11-02 — KAFENE Setup web + URL Supabase

| Skedar / veprim | Ndryshimi |
|-----------------|-----------|
| Kërkim `vlvvkzzwrgreoblfdqav` | **Asnjë** referencë në RESTAURANT. `.env` tashmë OLD `jdlypmieskgrqsfyjrul`. Çelësat të paprekur. |
| `restaurant-system/KAFENE` | `node scripts/pre-build-check.js` 20/20; `node build-packages.js web` **PO** → `dist/KAFENE-Setup.exe` v1.0.507 |

**Nuk preka:** kod, keys, kitchen_key, git, NEW URL (nuk ekzistonte).

---

## 2026-10-13 — Ulje ngarkese Supabase (KAFENE cloud — pa deploy)

| Skedar | Ndryshim |
|--------|----------|
| `src/services/licenseService.js` | `patchLicenseMeta` + `last_heartbeat_at` — shkrim **1× / 5 min** për licencë+pajisje (si HOTEL); menjëherë për PC të re, `claimsLicenseDevice`, HW i ri, ndryshim `last_validation_error`. |
| `src/services/licenseTerminalService.js` | `touchTerminal` **1× / 5 min**; `clearTerminalLimitGrace` vetëm kur ka grace; roli `arka1` i paplotësuar — UPDATE menjëherë. |
| `src/lib/staffBranding.js` | Cache `pos_settings` **30 min** (pa base64 në memorie). |
| `src/services/superAdminDashboardService.js` | 🟢 online **6 min** (idle 10 min i njëjtë). |

**Provë:** `node --check` OK; mock Supabase — thirrja 1 ≈ 3 UPDATE, thirrjet 2–3 ≈ 1 UPDATE, pas 301s ≈ 3 UPDATE.

**Desktop KAFENE** (Setup i ri): `restaurant-system/KAFENE` — login 2s lokal, admin tavolina `?cached=1` 3s, watcher `lastCloudPayload`.

---

## 2026-10-10 — Fshirje `public/owner/panel-hotel.html`

### Audit (para fshirjes)
| Ku u kërkua | Rezultat |
|-------------|----------|
| `src/`, `public/` (JS/HTML), teste | **Asnjë** referencë `panel-hotel` (vetëm skedari vetë) |
| `public/owner/sw.js` PRECACHE | `/owner/manifest.json`, icons — **jo** `panel-hotel.html` |
| `src/server.js` ~924–928 | Hotel: `owner_portal=hotel` → **`proxyToHotel`**; kafene: **`sendOwnerHtml("panel.html")`** |

### Veprim
- **U fshi** `public/owner/panel-hotel.html` (~1415 rreshta) — skedar i papërdorur pas proxy.

### Verifikim
- `GET https://revolution-pos.com/owner/panel` (pa cookie) → **200**, «Revolution POS», `/js/owner.js?v=39`.
- `git diff` → vetëm fshirja + `PUNA.md`.

**Deploy:** opsional (skedari nuk ishte i servuar). Jo build/push.

---

## 2026-10-10

### Çka u ndryshua (sot)

| Data | Skedar / zona | Çka | Pse | Prova | Funksionoi? |
|------|----------------|-----|-----|-------|-------------|
| 2026-10-10 | `.cursorrules`, `CLAUDE.md` | RREGULL ABSOLUT izolim pikat 1–6, pastaj sot **7–9** (PUNA.md, mos prish, mos shpik) | Leje Naseri | Lexim | PO (tekst) |
| 2026-10-10 | `public/js/owner.js`, `owner.css`, `panel.html`, `panel-hotel.html`, `owner-sales-invoice-*.js` | **Faza 1 panel pronari** (merge hotel UI) — pastaj **`git restore` + fshirje skedarësh të rinj** | Naseri: kthe mbrapsht; izolim projektesh | `git status` clean; curl `:8099` panel kafene/hotel cookie | PO (rikthim) |
| 2026-10-10 | (asgjë tjetër kod) | Hartë + plan izolimi owner (pa implementim) | Detyrë analizë | Lexim `server.js`, `auth.js`, hotel bridge | PO (dokumentim) |

### Gjendja aktuale owner (pas rikthimit)

- **Kafene:** `GET /owner/panel` → `panel.html`, `/js/owner.js?v=39`, API `/api/owner/*`.
- **Hotel (cookie `owner_portal=hotel`):** `GET /owner/panel` → **`proxyToHotel`** → upstream hotel `/owner/panel` (HTML `panel.html` hotel); asset **`/hotel/js`, `/hotel/css`**; **`GET /owner/sw.js`** → proxy hotel (jo `public/owner/sw.js` restaurant). **`panel-hotel.html` u fshi** (2026-10-10).
- **Login:** `POST /api/auth/owner/login` — restaurant DB ose `hotelOwnerBridge` → hotel upstream.

| Data | Skedar | Ndryshim | Prova | Funksionoi? |
|------|--------|----------|-------|-------------|
| 2026-10-10 | `src/server.js` ~864–869 | `GET /owner/sw.js` → proxy hotel nëse `owner_portal=hotel`, else `next()` → static kafene | curl `-b owner_portal=hotel` → body `ri-pos-owner-v10`, `/hotel/icons/` | PO |
| 2026-10-10 | `src/server.js` ~924–926 | Hotel: `proxyToHotel` në vend të `panel-hotel.html`; kafene: `sendOwnerHtml(panel.html)` i njëjtë | curl hotel → title HOTEL + `/hotel/js/owner.js`; pa cookie → `/js/owner.js?v=39` | PO |
| 2026-10-10 | git `master` **`aa95013`** | commit + **push** `origin/master` (owner proxy + PUNA + .cursorrules/CLAUDE.md) | `git push` OK | Push **PO**; deploy Railway → verifiko `/health` `git_commit` |

### Git log i fundit (committed)

- `e32c36d`, `280f046`, `4a6c42b`, `ae773cd`, … — proxy hotel, `/owner/panel` universal, recepsion/sherbimi, timeout AI owner.

### Çka është live

- **revolution-pos.com** = ky server (Railway). Owner flow si më sipër **nëse** deploy i fundit përputhet me `master` lokal — **verifiko** commit në prod.

### Çka pret deploy

- Vetëm ndryshimet **`.cursorrules` / `CLAUDE.md` / `PUNA.md`** (sot) — pas commit + deploy opsional; **nuk ndryshojnë** runtime derisa të mos preket kod.

### Çka nuk është provuar (sot)

- Login real kafene + hotel me llogari prod.
- Plan i ri: redirect hotel te panel hotel-server pa `panel-hotel.html` (**nuk u implementua**).
