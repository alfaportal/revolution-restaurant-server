# CLAUDE.md — Revolution Restaurant Server

Hub kryesor i **Revolution POS**: `https://revolution-pos.com` (Railway), licenca online, Super Admin, proxy/bridge drejt serverave të produkteve, faqe marketing, shkarkim Setup.

## RREGULL I DETYRUESHËM — LEXO PARA ÇFARËDO PUNE

### 1. LEXO RREGULLAT
Para se të bësh ÇFARËDO ndryshimi, LEXO PLOTËSISHT këtë skedar DHE .cursorrules (nëse ekziston).
Nëse nuk i lexon — NDALO dhe lexoji. Pa përjashtim.

### 2. MOS PREK PA LEJE — TELEFONI DHE PANELI I ADMINIT
Kodet e telefonit (waiter.js, mobile, cloud waiter) DHE panelit të adminit (admin.html, admin JS, tab-et, UI admin) janë ZONA TË MBROJTURA.
NUK GUXON me bë ASNJË ndryshim në këto zona pa lejen KONKRETE dhe DYHERE të Naserit.
- Herë e parë: Naser thotë "po bëje"
- Herë e dytë: Naser konfirmon përsëri "po, vazhdo"
Pa këto dy konfirmime — MOS PREK. Edhe nëse mendon se duhet ndryshim. Edhe nëse bug-u është aty. Pyet, mos prek.

### 3. MOS BO BUILD PA LEJE
Nuk guxon me bo build përveç nëse Naser thotë qartë "build" ose "bëje build".

### 4. MOS PREK LINKAT, CLOUD, SINKRONIZIMIN DHE TELEFONIN
Linkat e telefonit, sinkronizimi cloud, URL-të e serverave, bridge-at, secrets, dhe çdo lidhje mes projekteve janë ZONA TË MBROJTURA ABSOLUTISHT.
NUK GUXON me bë ASNJË ndryshim në:
- URL të serverave (Railway, Supabase, upstream)
- Bridge-at mes telefonit dhe serverave (marketAdminBridge, hotelAdminBridge, etj.)
- Secrets / API keys (ADMIN_SECRET, SUPER_ADMIN_SECRET, etj.)
- Endpoint-et e licencës (/api/v1/license/*, /api/license/*, etj.)
- Cloud sync (sinkronizim, heartbeat, watchdog, SSE, polling)
- Lidhjet mes projekteve
PA LEJEN KONKRETE dhe DYHERE të Naserit. Pa përjashtim.

### 5. KREJT PROJEKTET SHKOJNË PËRMES revolution-pos.com
- Çdo projekt (KAFENE, MARKET, HOTEL, FURRA, FISKALIZIME, SECURITY, KONTABILISTI) ka serverin e vet
- Por krejt linkat e telefonit shkojnë përmes revolution-pos.com (revolution-restaurant-server)
- Nuk lejohet me ndryshu këtë arkitekturë
- Nuk lejohet me kriju lidhje të reja mes serverave pa leje
- Nuk lejohet me përzier projektet (klientët e njërit nuk shkojnë te tjetri)
- Çdo projekt i ri që vjen — shkon përmes revolution-pos.com njëlloj si të tjerët

---

## Kontekst i shkurtër (hub)

- **Stack:** Node.js, Express, Supabase — deploy Railway (`npm start`).
- **Faqe publike:** `marketing-blog/` → `npm run build:blog` → `public/site/`.
- **Licenca / desktop poll:** `src/routes/license.js`, `src/services/licenseService.js`.
- **Bridge / regjistrim klientësh:** `src/lib/*AdminBridge.js`, `dashboardClientRegister.js`.
- **Origin publik:** `PUBLIC_APP_ORIGIN=https://revolution-pos.com` — klientët nuk shehin `*.railway.app`.

Lexo README.md dhe `.cursorrules` për detaje shtesë para ndryshimeve në `src/server.js`.
