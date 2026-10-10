# PUNA.md — revolution-restaurant-server (gateway)

## 2026-10-10

### Çka u ndryshua (sot)

| Data | Skedar / zona | Çka | Pse | Prova | Funksionoi? |
|------|----------------|-----|-----|-------|-------------|
| 2026-10-10 | `.cursorrules`, `CLAUDE.md` | RREGULL ABSOLUT izolim pikat 1–6, pastaj sot **7–9** (PUNA.md, mos prish, mos shpik) | Leje Naseri | Lexim | PO (tekst) |
| 2026-10-10 | `public/js/owner.js`, `owner.css`, `panel.html`, `panel-hotel.html`, `owner-sales-invoice-*.js` | **Faza 1 panel pronari** (merge hotel UI) — pastaj **`git restore` + fshirje skedarësh të rinj** | Naseri: kthe mbrapsht; izolim projektesh | `git status` clean; curl `:8099` panel kafene/hotel cookie | PO (rikthim) |
| 2026-10-10 | (asgjë tjetër kod) | Hartë + plan izolimi owner (pa implementim) | Detyrë analizë | Lexim `server.js`, `auth.js`, hotel bridge | PO (dokumentim) |

### Gjendja aktuale owner (pas rikthimit)

- **Kafene:** `GET /owner/panel` → `panel.html`, `/js/owner.js?v=39`, API `/api/owner/*`.
- **Hotel (cookie `owner_portal=hotel`):** `GET /owner/panel` → **`proxyToHotel`** → upstream hotel `/owner/panel` (HTML `panel.html` hotel); asset **`/hotel/js`, `/hotel/css`**; **`GET /owner/sw.js`** → proxy hotel (jo `public/owner/sw.js` restaurant). `panel-hotel.html` **nuk përdoret** (skedar mbetet në disk).
- **Login:** `POST /api/auth/owner/login` — restaurant DB ose `hotelOwnerBridge` → hotel upstream.

| Data | Skedar | Ndryshim | Prova | Funksionoi? |
|------|--------|----------|-------|-------------|
| 2026-10-10 | `src/server.js` ~864–869 | `GET /owner/sw.js` → proxy hotel nëse `owner_portal=hotel`, else `next()` → static kafene | curl `-b owner_portal=hotel` → body `ri-pos-owner-v10`, `/hotel/icons/` | PO |
| 2026-10-10 | `src/server.js` ~924–926 | Hotel: `proxyToHotel` në vend të `panel-hotel.html`; kafene: `sendOwnerHtml(panel.html)` i njëjtë | curl hotel → title HOTEL + `/hotel/js/owner.js`; pa cookie → `/js/owner.js?v=39` | PO |

### Git log i fundit (committed)

- `e32c36d`, `280f046`, `4a6c42b`, `ae773cd`, … — proxy hotel, `/owner/panel` universal, recepsion/sherbimi, timeout AI owner.

### Çka është live

- **revolution-pos.com** = ky server (Railway). Owner flow si më sipër **nëse** deploy i fundit përputhet me `master` lokal — **verifiko** commit në prod.

### Çka pret deploy

- Vetëm ndryshimet **`.cursorrules` / `CLAUDE.md` / `PUNA.md`** (sot) — pas commit + deploy opsional; **nuk ndryshojnë** runtime derisa të mos preket kod.

### Çka nuk është provuar (sot)

- Login real kafene + hotel me llogari prod.
- Plan i ri: redirect hotel te panel hotel-server pa `panel-hotel.html` (**nuk u implementua**).
