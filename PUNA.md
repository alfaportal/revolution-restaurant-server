# PUNA.md — revolution-restaurant-server (gateway)

## 2026-11-14 — Linqet te telefoni si te POS

Te paneli i pronarit në telefon, skeda Linqet: të njëjtat linqe si te POS (Pronari, Banak, Kamarier cloud, Kamarier WiFi, Kuzhina, Kiosk, Takeaway, Faqja publike). URL-të nuk u ndryshuan. Pa build, pa git, pa deploy.

## 2026-11-14 — 5 temat te Faqja publike e pronarit

5 temat janë te paneli i pronarit, skeda Faqja publike. Kartat tregojnë faqen e vërtetë. Zgjedh + Ruaj. Pa build, pa git, pa deploy.

## 2026-11-14 — Pamja e 5 temave, jo CSS

Hapet `http://127.0.0.1:8090/tema` me 5 faqe të vërteta (jo skedar CSS). Kartat te paneli tregojnë mini-faqe. `?theme=` ndryshon temën. Pa build, pa git, pa deploy.

## 2026-11-14 — 5 tema të plota, jo ngjyra

Te Faqja publike: u hoq zgjedhësi i një ngjyre. Pronari sheh 5 karta me pamje (header, kategori, karta). Zgjedh një, ruan, menu/takeaway/QR ndryshojnë bashkë: sfond, dekorime, karta, tekst, butona. Fotot e produkteve mbeten. Pa build, pa git, pa deploy.

| Skedar | Ndryshimi |
|--------|-----------|
| `src/lib/publicPageThemes.js` | 5 tema |
| `public/js/r-public-theme.js` | emrat + pamja e kartave |
| `public/css/r-public-menu.css` | identitet i plotë për 5 tema |
| `public/css/owner.css` | karta me preview + shenjë |
| `public/js/owner.js` | render i 5 pamjeve |
| `public/owner/panel.html` | teksti i temës |

## 2026-11-14 — Takeaway dhe QR me të njëjtën pamje

Takeaway dhe QR (skanimi i tavolinës) kanë të njëjtën pamje si faqja publike: tema, lule, kategori, karta me foto. Porosit Tani te takeaway hap formularin (emër, telefon, adresë). Te QR nuk ka formular — vetëm shporta dhe Dërgo Porosinë, numri i tavolinës vjen nga linku. CSS i njëjtë. Pa build, pa git, pa deploy.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/r-order.html` | menu si faqja publike + checkout |
| `public/js/r-order.js` | Porosit Tani → formular |
| `public/kiosk.html` | pamja publike për QR |
| `public/js/kiosk.js` | Porosit Tani pa formular |
| `public/js/r-public-menu-ui.js` | karta/kategori të përbashkëta |
| `public/css/r-public-menu.css` | CSS i përbashkët |

## 2026-11-14 — Tema e pronarit + porosia vetëm formular

Te «Faqja publike» pronari zgjedh 6 tema dhe ruan; faqja e klientit i ngarkon nga ngjyra e ruajtur. Logoja ekzistuese del lart. «Porosit Tani» hap vetëm formularin + listën e shportës, jo menunë. POST `/api/r/{slug}/order` i njëjtë. Pas dërgimit: mesazhi i konfirmimit. Commit + push + deploy.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/owner/panel.html` | zgjedhës temash 6, jo ngjyra e lirë |
| `public/js/owner.js` | ruajtja e temës |
| `public/js/r-public-theme.js` | temat + aplikimi |
| `public/js/r.js` | shporta në session, mbetet te menuja |
| `public/r-order.html` | vetëm formular + përmbledhje |
| `public/js/r-order.js` | pa menunë; shporta nga session |
| `public/css/r-public-menu.css` | 6 tema + checkout |
| `src/lib/publicPageThemes.js` | harta e temave |
| `src/services/publicPageService.js` | `page_theme` / ruajtja e hex |

## 2026-11-14 — Logo te emri lart

Te faqja publike, ku shkruhej emri, tani del si logo (filxhan + emri i artë). Nëse pronari ngarkon logo te paneli «Faqja publike», del ajo. Pa build, pa deploy, pa git.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/r.html` | shenja e logos |
| `public/css/r-public-menu.css` | emri si logo e artë |

## 2026-11-14 — Mapa/Telefoni/Orari drejt dhe të gjerë

Poshtë: të treja në një vijë, më të hapura, më të theksuara. Pa build, pa deploy, pa git.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/css/r-public-menu.css` | rresht, hapësirë, theks |

## 2026-11-14 — Mapa dhe Telefoni poshtë

Te fundi i faqes publike dalin Mapa, Telefoni dhe Orari. Trus dhe hapen. Pa build, pa deploy, pa git.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/r.html` | Mapa + Telefoni poshtë |
| `public/js/r.js` | Mapa/Telefoni dalin gjithmonë poshtë |

## 2026-11-14 — Lule më të rralla, jo në mes

Lulet e arta mbeten anash, më të dobëta. Në mes (te kartat) u hoqën. Pa build, pa deploy, pa git.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/css/r-public-menu.css` | mes i errët, lule vetëm anash |

## 2026-11-14 — Sfond lulesh të arta

Fotoja e luleve të arta u vu vetëm si prapavijë e faqes publike. Kartat dhe porosia nuk u prekën. Pa build, pa deploy, pa git.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/img/pub-floral-gold.jpg` | fotoja e sfondit |
| `public/css/r-public-menu.css` | sfond me atë foto |

## 2026-11-14 — Dekorime prapa kartave

Faqja publike: dritë e artë lart, vizatime të lehta (avull/gjethe/gotë) prapa produkteve. Kategoria ndërron dekorimin. Kartat mbeten të lexueshme. Pa build, pa deploy, pa git.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/css/r-public-menu.css` | sfond + dekorime SVG |
| `public/js/r.js` | motif sipas kategorisë |
| `public/r.html` | shtresa e dritës |

## 2026-11-14 — Adresa/telefoni/orari vetëm me klik

Në fund të faqes publike, Adresa, Telefoni dhe Orari dalin vetëm si fjalë. Teksti hapet kur i trus. Nëse s’ka adresë ose telefon, ajo fjalë nuk del fare. Pa build, pa deploy, pa git.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/r.html` | Adresa/Telefoni/Orari me hapje |
| `public/js/r.js` | Orari fshihet nëse s’ka orar |
| `public/css/r-public-menu.css` | kutitë bosh nuk dalin |

## 2026-11-14 — Faqja publike: pa boshllëk + sfond + Porosit poshtë

Hapësira e madhe mes emrit dhe kategorive u hoq. Renditja: emri lart → MENUJA → kategori → karta. Adresa/orari shkojnë në fund. Butoni «Porosit online» është pas produkteve, jo mbi to. Kategoritë ngelen lart kur rrëshqet, pa shirit. Sfond i ngrohtë. Porosia e njëjtë (klik → takeaway). Pa build, pa deploy, pa git.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/r.html` | hero i shkurtër; order-bar pas menusë; adresa në footer |
| `public/css/r-public-menu.css` | pa boshllëk, sfond, sticky, pa scrollbar kategori |
| `public/r-order.html` | CSS v=4 |

## 2026-11-14 — Faqja publike si IN Caffe

Pamja e `/piceri/{slug}` (dhe e njëjta faqe për çdo lokal POS) u bë e errët e ngrohtë: logo/emër lart, adresa dhe orari, kategori të rrëshqitshme, karta me foto/emër/përshkrim/çmim, fundi me rrjete. Porosia: klik → takeaway → shporta → POST `/api/r/{slug}/order` te POS. Nuk u prek waiter, URL, API. Nuk u bë build. Nuk u bë deploy. Nuk u bë git.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/r.html` | struktura e re, ID e vjetra |
| `public/r-order.html` | e njëjta pamje te porosia |
| `public/css/r-public-menu.css` | stili |
| `public/js/r.js` | karta me përshkrim |
| `public/js/r-order.js` | karta + logo |

## 2026-11-10 — Çelësat e email-it te Njoftimet

Në panelin e pronarit, skeda «Njoftimet» (telefoni) tani hapet për çdo pronar. Në krye të skedës, karta «Njoftimet me email» ka tre çelës: Raport javor, Stok i ulët, Raport AI. Hapja lexon GET `/api/owner/notification-preferences`. Çdo ndryshim bën PUT me slug-un e lokalit. Nisjen e kanë të fikur. Telegram/SMS mbetet poshtë dhe duket vetëm kur pakoja AI është aktive. Nuk u deploy-ua.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/owner/panel.html` | Karta dhe skeda |
| `public/js/owner-notifications.js` | GET dhe PUT |
| `public/js/owner.js` | Skeda nuk fshihet kur AI dështon |
| `public/css/owner.css` | Çelësi on/off |

## 2026-11-10 — Pronari zgjedh cilat email-e dalin

Tabela `owner_notification_preferences` krijohet në nisje nëse mungon. Të trija (`weekly_report`, `low_stock_alert`, `ai_report`) nisin false. GET/PUT `/api/owner/notification-preferences` kërkon pronarin dhe slug-un e lokalit të tij. Raporti javor (e hënë 08:00) dhe raporti AI (23:59) nisen përsëri, por email-i anashkalohet në heshtje nëse preferenca është false ose mungon. E njëjta për stokun e ulët dhe stokun kritik. Offline 48 orë, siguria, prova, licenca, furnizimi dhe CSV mbeten si ishin. Nuk u deploy-ua. Git nuk u prek.

| Skedar | Ndryshimi |
|--------|-----------|
| `src/services/ownerNotificationPreferences.js` | Tabela, leximi, ruajtja |
| `src/routes/owner.js` | GET dhe PUT |
| `src/server.js` | Krijimi në nisje |
| `src/jobs/aiDailyReports.js` | Nisja e raportit AI |
| `src/jobs/aiWeeklyReports.js` | Nisja e raportit javor |
| `src/services/aiDailyReportService.js` | Email vetëm me `ai_report` |
| `src/services/aiWeeklyReportService.js` | Email vetëm me `weekly_report` |
| `src/services/stockService.js` | Email vetëm me `low_stock_alert` |
| `src/services/aiStockPredictService.js` | Email kritik vetëm me `low_stock_alert` |

## 2026-11-10 — Email-et automatike u ndalën

Cron-et që dërgonin email (offline çdo orë, provë, licencë, AI, furnizim, CSV) nuk nisen më. «KAFENE Siguri» / DevTools nuk dërgon email. Mbetet një kontroll që ruan në memorie `last_seen_online` dhe `offline_email_sent` për çdo slug me arkë fiskale aktive: një email pas 48 orëve, pastaj asnjë derisa lokali të kthehet online dhe të rrijë prapë 48 orë offline. Prova e vendimit: skip, online, send, wait, online, send. Nuk u deploy-ua. Git nuk u prek.

| Skedar | Ndryshimi |
|--------|-----------|
| `src/services/offlineNotificationService.js` | Logjika 48 orë |
| `src/jobs/offlineNotifications.js` | Kontrolli, jo email çdo orë |
| `src/jobs/trialNotifications.js` | Pa nisje |
| `src/jobs/licenseOwnerNotifications.js` | Pa nisje |
| `src/jobs/aiDailyReports.js` | Pa nisje |
| `src/jobs/aiWeeklyReports.js` | Pa nisje |
| `src/jobs/supplySuggestions.js` | Pa nisje |
| `src/jobs/weeklyDataExport.js` | Pa nisje automatike |
| `src/services/licenseSecurityAlertService.js` | Pa email sigurie |

## 2026-11-09 — TVSH 8% llogaritej si 18%

E njëjta gabim si MARKET: «8» te cloud bëhej A (18%). Tani 8 → B. Katalogu merr TVSH. Git KAFENE NUK u prek (i ngrirë). Duhet deploy kur Naseri thotë.

| Skedar | Ndryshimi |
|--------|-----------|
| `src/lib/vatCategories.js` | 8 → B |
| `src/services/posSyncService.js` | TVSH te katalogu |

## 2026-11-06 — Dil te kamarieri

`public/waiter.html`: butoni i daljes «Kyçu» → «Dil». Nuk u bë push.



## 2026-11-06 — 16 vende online si HOTEL

`buildOnlineSlotLayout` kthen Online 1–16. Porosia e 17-të nuk merr kartë. Prova: 0 porosi → 16 të lira; 20 takeaway → 16 të zëna. Nuk u bë git.

## 2026-11-06 — Paneli: Ruaj/Rifresko te serveri i produktit

MARKET, BUTIKA, DYQANE, ARGJENDARI dhe BARNATORE nuk shkruhen më te databaza e KAFENE. SECURITY dhe FISKALE e kishin urën; Rifresko tani ruan edhe ID-në e pajisjes. FURRA krijohet te i njëjti server që pyet programi (`product_line` furra).

| Skedar | Ndryshimi |
|--------|-----------|
| `src/lib/dedicatedLicenseBridge.js` | urë e re për 4 produktet |
| `src/lib/marketAdminBridge.js` | PATCH + rotate-key |
| `src/lib/securityAdminBridge.js` | Rifresko ruan `hardware_id` |
| `src/lib/fiskalizimAdminBridge.js` | Rifresko ruan `hardware_id` |
| `src/routes/super.js` | degët e produkteve |
| `src/services/dashboardClientRegister.js` | regjistrimi me pronar |
| `src/services/superAdminDashboardService.js` | lista |
| `src/utils/productLine.js` | emrat e produkteve |
| `public/admin/dashboard.html` + `dashboard.js` | skedat |

`node --check` kaloi. Nuk u bë push. Nuk u bë deploy. Desktop-i KAFENE nuk u prek.



## 2026-11-06 — Paneli: licenca HOTEL shkon te serveri HOTEL

Ruaj dhe Rifresko për produktin `hotel` nuk shkruajnë më te databaza e KAFENE. Dërgohen te serveri HOTEL, bashkë me ID e pajisjes. Licenca KAFENE mbetet te databaza e vet.

| Skedar | Ndryshimi |
|--------|-----------|
| `src/lib/hotelAdminBridge.js` | `updateHotelLicense`, `rotateHotelLicenseKey` |
| `src/routes/super.js` | degë `product === "hotel"` te PATCH dhe rotate-key |
| `public/admin/dashboard.js` | Rifresko dërgon edhe `hardware_id` |

`node --check` kaloi. Nuk u bë push. Nuk u bë deploy. Nuk u prek desktop-i KAFENE.



## 2026-11-03 — QR te kamarieri, jo banak

QR e papranuar nuk shfaqet te `/bar/tables/live`. Teksti i menysë: «te kamarieri». `sent_to: waiter`. PRANO cloud mbetet `/api/waiter/.../orders/:id/accept` (PIN).

| Skedar | Ndryshimi |
|--------|-----------|
| `src/routes/kds.js` | live banak: `accept_pending` → tavolinë e lirë |
| `src/services/kioskService.js` | `sent_to: waiter` |
| `public/js/kiosk.js` + `public/kiosk.html` | teksti kamarier |

**Nuk u prek waiter.js / admin. Commit/push/deploy te ky hap.**

## 2026-11-03 — public_enabled default true + Te naseri

Seed/INSERT tani shkruajnë `public_enabled: true`. SQL default i vjetër `false` u kthye `true`. Live: `te-naseri` `pos_settings.public_enabled` false → true. GET `/api/r/te-naseri` 200.

| Skedar | Ndryshimi |
|--------|-----------|
| `src/services/receiptService.js` | seed `public_enabled: true` |
| `src/services/menuService.js` | insert i ri `public_enabled: true` |
| `src/services/dashboardClientRegister.js` | seed meta `public_enabled: true` |
| `src/services/posSyncService.js` | INSERT PG `TRUE`, pa overwrite në UPDATE |
| `supabase/MIGRATE_OLD_TO_MATCH_NEW.sql` | DEFAULT true |
| `supabase/migrations/082_pos_settings_public_enabled_default_true.sql` | ALTER DEFAULT true |

**Nuk u bë build/git/deploy.**

## 2026-11-02 — ENABLE_RLS.sql (vetëm skedar, pa ekzekutim)

| Skedar | Ndryshimi |
|--------|-----------|
| `supabase/ENABLE_RLS.sql` | ENABLE RLS + REVOKE anon/authenticated për 52 tabela live (`jdlypmieskgrqsfyjrul`) |

**Nuk u ekzekutua** SQL. Nuk u bë build/git.

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
