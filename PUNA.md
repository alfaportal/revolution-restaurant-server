# PUNA.md — revolution-restaurant-server (gateway)

## 2026-11-18 — Faqja e re u publikua

U dërgua ndryshimi `b1456d8`. Faqja e gjallë u kontrollua: ballina ka «Pagesa», `/hotel` është faqja e re, `/privacy` `/terms` `/blog` japin faqen e vjetër, stili dhe logoja e vjetër hapen, fotoja e re hapet, `/pse-ne` nuk gjendet, hyrja e pronarit mbetet. Nuk u dërguan çelësat, skedari i databazës, as dy foto prove.

## 2026-11-18 — Faqja e re u ndërtua dhe u kopjua

`website`: `npm run build` kaloi. 20 faqe u krijuan. `website/out/` ka 207 skedarë dhe 19 faqe HTML. `public/site/` u zbraz (207 skedarët e mëparshëm) dhe u mbush nga `out/`. Përsëri 207 skedarë. `public/site-old/` mbeti 38 skedarë. `public/admin/` dhe `public/owner/` nuk u prekën. Ballina e re përmban «Pagesa». Nuk u publikua.

## 2026-11-18 — Stili i faqes së vjetër

`public/site-old/index.html` kërkon `/assets/index-BKrNrgpF.js`, `/assets/index-C__Z65xc.css` dhe `/logo-icon.svg`. Fotot janë te `/images/`. `src/server.js`: nëse skedari nuk është te `public/site/`, kërkohet te `public/site-old/`. E prova: stili, logoja dhe `images/hero.jpg` u hapën; faqja e re `udhezuesi.html` dhe një foto e re mbetën. Skedari që s’ekziston doli 404. Nuk u ndërtua. Nuk u publikua.

## 2026-11-18 — Pagesa si te faqja e vjetër

Te faqja e re, pas Çmimeve, u shtua «Pagesa»: kartë (Stripe, Visa, Mastercard, PayPal), butoni «Vazhdo me pagesë», dhe bankat TEB, Raiffeisen, NLB, BKT, ProCredit, BPB. Skedarët: `website/src/components/Pagesa.tsx`, `Pricing.tsx`, `page.tsx`, `Navbar.tsx`, `Footer.tsx`, `tekstet.ts`. Zgjedhja e pakos te Çmimet shkon te Pagesa. Kartë dhe bankë përdorin pagesën që ekziston. E pashë te faqja lokale që seksioni del. Nuk u ndërtua për publikim. Nuk u publikua.

## 2026-11-18 — Privatësia, kushtet dhe blogu nga faqja e vjetër

`src/services/seoMarketingHtml.js`. Te `public/site-old/` nuk ka `privacy.html`, `terms.html` apo `blog.html`. Ka vetëm `index.html`. `/privacy`, `/terms`, `/blog` dhe `/blog/artikull` e japin atë skedar. Faqet e reja mbeten te `public/site/`. E prova: skedari i kthyer është i njëjtë me `site-old/index.html`. Stili dhe fotot e vjetra janë te `site-old/assets` dhe `site-old/images`, jo te dosja e re. Nuk u ndërtua. Nuk u publikua.

## 2026-11-18 — Adresat e faqes së re

`src/services/seoMarketingHtml.js` tani lexon faqen e duhur nga `public/site/` (ballina dhe 16 faqet). Nuk e lexon më një faqe të vetme me `#`. `src/server.js`: u hoqën `/pse-ne`, `/si-ta-ngarkoni`, `/si-funksionon`, `/pakot`, `/kontakt`, `/pajisjet`. Adresa e pastër `/hotel`, `/market`, `/security` dhe të tjerat jep faqen e re. `/hotel/emri/...` mbetet te programi. Fotot te `pamje/` nuk i merr rruga e biznesit. E prova: 17 faqet përputhen me skedarët. Nuk u publikua.

## 2026-11-18 — Faqja e re u kopjua te dosja e faqes

`public/site/` u quajt `public/site-old/` (38 skedarë të vjetër). Pastaj `website/out/` (207 skedarë, 19 faqe HTML) u kopjua te `public/site/`. Numri përputhet. `public/admin/` dhe `public/owner/` nuk u prekën. Nuk u publikua. Serveri ende i lexon adresat e vjetra nga `public/site/index.html` përmes `src/services/seoMarketingHtml.js`.

## 2026-11-18 — Ndërtimi i faqes kaloi

`website/next.config.ts`: `cacheComponents: false`, `partialPrefetching: false`, `experimental.ppr: false`. `npm run build` kaloi. 19 faqe HTML te `website/out/`: ballina, 15 programe, udhëzuesi, dhe dy faqe «nuk u gjet». Skedarët nuk u zhvendosën. E prova: dalja e `next build` mbaroi pa gabim dhe listova HTML-të. Ende nuk është te faqja e vjetër.

## 2026-11-18 — Ndërtimi i faqes dështoi përsëri

U hoq `dynamicParams` te `website/src/app/[slug]/page.tsx`. `npm run build` kaloi 21 faqe, pastaj ndaloi: `PPR cannot be enabled in export mode`. Shkaku është `cacheComponents` te `website/next.config.ts`. Dosja `website/out/` mbeti, por ndërtimi doli me gabim. Skedarët nuk u zhvendosën. NOT VERIFIED.

## 2026-11-18 — Ndërtimi i faqes dështoi

`npm run build` te `website/` dështoi. Next.js 16.4.6. Gabimi: `website/src/app/[slug]/page.tsx` rreshti 10, `dynamicParams` nuk lejohet kur `cacheComponents` është ndezur. Nuk u krijua `website/out/`. Skedarët nuk u zhvendosën. NOT VERIFIED.

## 2026-11-18 — Faqja e re gati për skedarë statikë

`website/next.config.ts` rreshti 4: `output: "export"`. Kur të ndërtohet, skedarët shkojnë te `website/out/`. Nuk u ndërtua.

U hoq faqja `/admin/manuals` dhe dy rrugët që shkarkonin udhëzuesin (`website/src/app/admin/`, `website/src/app/api/`). Ato lexonin kërkesën dhe nuk bëhen faqe statike. Te `website/src/app/[slug]/page.tsx` rreshti 10: vetëm adresat e shkruara ndërtohen. Nuk ka `getServerSideProps` dhe nuk ka `next/image`. Mbetën skedarët e vjetër të udhëzuesit te `website/src/lib/`, pa lidhje nga faqja. NOT VERIFIED. Pa build. Pa git.

## 2026-11-18 — POSTA / TAXI dhe RENTACAR te paneli

Paneli i super adminit. U shtuan POSTA / TAXI (5 lloje, Së shpejti) dhe RENTACAR (3 lloje, Së shpejti). Lista e programeve tani ka 15. Skedarët: `public/admin/dashboard.html`, `public/admin/dashboard.js`, `src/utils/businessTipi.js`, `src/utils/productLine.js`, `src/services/superAdminDashboardService.js`, `src/routes/super.js`, `src/services/licenseService.js`, `supabase/migrations/083_distributor_mjekesia_tipi.sql`. Faqja e internetit nuk u prek. SQL-ja nuk u ekzekutua. Pa build. Pa git.

## 2026-11-18 — DISTRIBUTOR dhe MJEKËSIA te paneli

Paneli i super adminit. Skedarët: `public/admin/dashboard.html`, `public/admin/dashboard.js`, `src/utils/businessTipi.js`, `src/utils/productLine.js`, `src/services/superAdminDashboardService.js`, `src/routes/super.js`, `src/services/licenseService.js`, `supabase/migrations/083_distributor_mjekesia_tipi.sql`. DISTRIBUTOR: 5 lloje dhe Pako 1 €250/vit. MJEKËSIA: 5 lloje dhe «Së shpejti». Faqja e internetit nuk u prek. SQL-ja nuk u ekzekutua në databazë. Pa build. Pa git.

## 2026-11-18 — Çmimet ndërrojnë me programin

`website/src/components/Pricing.tsx`, tekstet, dhe `website/next.config.ts`. Kur zgjedh programin, dalin paketat e atij programi dhe emri lart. Poshtë është tabela Llogaria: 1 projekt, 2 projekte, dhe sa projekte (numri). Shuma është çmimi i pakos herë sa. Mjekësia, Posta dhe Rentacar mbeten «Së shpejti». Faqja te 127.0.0.1 tani përgjigjet kur zgjedh. E prova: HOTEL doli €150, €300, €400. Pa build. Pa git.

## 2026-11-18 — Ekrani i ballinës lëviz përsëri

`website/src/components/HeroScreens.tsx`. Pamjet brenda ekranit (Arka, Ditari, Raportet e të tjerat) hyjnë përsëri me lëvizje. Ndërrohen vetë çdo pak sekonda. Pa build. Pa git.

## 2026-11-18 — Rreshti Ballina në mes

`website/src/components/Navbar.tsx`. Rreshti Ballina, Produktet, Fiskalizimi, Si Funksionon, Çmimet, Pyetjet, Kontakti, Udhëzuesi është në mes të faqes. Logoja mbetet majtas. Pa build. Pa git.

## 2026-11-18 — Security si kartat e tjera

`website/src/data/produktet.ts`, vetëm pikat e kartës te Security. Në ballinë mbetën 6: Pikat e rojes, Ndërrimet, Raporti i natës, Hyrja dhe dalja, Incidentet, Orari i rojes. Pakoja €250 mbeti e plotë. Pa build. Pa git.

## 2026-11-18 — Menyja qëndron, ballina në qoshe

Përshkrimi i ballinës u kthye majtas. Rreshti Ballina dhe Produktet mbetet poshtë logos dhe nuk qëndron mbi tekstin kur zbret faqja. Pa build. Pa git.

## 2026-11-18 — Përshkrimi në mes, më i trashë

`website/src/components/Hero.tsx`. Titulli dhe përshkrimi janë në mes, jo në qoshe. Përshkrimi është i trashë. Pa build. Pa git.

## 2026-11-18 — Ballina nuk del bosh

Teksti dhe fotoja e ballinës nisin të dukshme. Nuk mbeten të fshehura. E pashë: «Sistemi POS për çdo biznes» dhe fotoja e arkës dalin. Pa build. Pa git.

## 2026-11-18 — Fotot me përshkrime u kthyen

Kartat e Mjekësisë, Postës dhe Rentacarit kishin mbetur pa pikat nën foto. U kthyen përshkrimet. «Së shpejti» mbetet shtesë, jo në vend të tyre. Distributor mban foton me 6 përshkrimet; 18 pikat janë te pakoja. Pa build. Pa git.

## 2026-11-18 — Menyja një rresht poshtë

`website/src/components/Navbar.tsx`. Ballina dhe lidhjet pas saj zbritën një rresht, nën logon R Revolution POS. Ballina e faqes dhe faqet e produkteve fillojnë një rresht më poshtë. Pa build. Pa git.

## 2026-11-18 — Të dhënat në karta

Në ballinë dilnin pikat e vjetra. Tani Distributor tregon Pako 1, €250/vit dhe 18 pikat. Mjekësia, Posta / Taxi dhe Rentacar tregojnë «Së shpejti — Kontaktoni për më shumë». Produktet e tjera nuk u prekën. Pa build. Pa git.

## 2026-11-18 — Distributor, Mjekësia, Posta/Taxi, Rentacar

Katër produktet ishin në listë me pako bosh («skedat nuk u lexuan»). U ndryshuan vetëm ato. Produktet e tjera mbetën. Pa build. Pa git. Nuk është live.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/data/produktet.ts` | Distributor: 1 pako €250/vit, 18 pika, spiashpejti false. Mjekësia, Posta / Taxi, Rentacar: pa pako, spiashpejti true |
| `website/src/components/FaqjaProduktit.tsx` | Kur është së shpejti: «Së shpejti — Kontaktoni për më shumë» dhe butoni Kontaktoni |
| `website/src/components/Pricing.tsx` | E njëjta gjë te çmimet. Emri POSTA / TAXI |

## 2026-11-18 — Multi Arka te pakoja e fundit

`website/src/data/produktet.ts`. Te pakoja e fundit e Hotelit, Marketit, Dyqaneve dhe Butikut u shtua «Multi Arka (çdo arkë ka POS ID të vetën)», njësoj si te Kafene. Kafene nuk u prek. Pakot e tjera nuk u prekën. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Security: vetëm emrat

`website/src/data/produktet.ts`, `slug: "security"`. Te «Çka bën» dhe te Pako 1 u hoqën shpjegimet në kllapa. Mbetën vetëm emrat: Pasqyra, Punonjësit, Lokacionet, GPS, Evidenca, Produktet, Pajisjet, Blerjet, Furnitorët, Faturat, QR Kodet, Barkodet, Raportet, Raporte të avancuara, Ditari, AI, Arka, Kuponët, Audit, Bllok letrë, Fiskalizimi, Licenca, Cilësimet, Kontabilisti, Telefoni i pronarit, Telefoni i punonjësit, SOS, Automjetet, Njoftime urgjente. Çmimi mbeti €250 në vit. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Security: veçoritë e shkurtra

`website/src/data/produktet.ts`, `slug: "security"`. «Çka bën» dhe pikat e kartës u zëvendësuan me 29 tekstet e shkurtra. Pako 1 mbeti €250 në vit. Përshkrimi, 7 veprimtaritë dhe produktet e tjera nuk u prekën. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Security: 1 pako

`website/src/data/produktet.ts`, `slug: "security"`. Hyrja u ndërrua. Veprimtaritë u bënë 7: siguri, transport, ndërtim, pastrim, mirëmbajtje, magazinim, marketing në terren. Posta nuk u shtua. Mbeti vetëm Pako 1, €250 në vit, me 24 skedat dhe telefonin, SOS, automjetet dhe njoftimin. U hoqën Roja €150, Objektet €220 dhe E plotë €300. Produktet e tjera nuk u prekën. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Kontabilisti: 1 pako

`website/src/data/produktet.ts`, `slug: "kontabilisti"`. Hyrja u ndërrua me përshkrimin e ri. Paketat u bënë vetëm Pako 1, €220 në vit: 11 skedat dhe Njoftime Urgjente. U hoqën Librat €150, Muaji €220 dhe ATK €300. Titulli, bizneset dhe produktet e tjera nuk u prekën. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Furra: 2 pako

`website/src/data/produktet.ts`, rreshtat e `slug: "furra"`, vetëm `paketat`. Pako 1 €150 në vit: Arka (Kasa), Produktet, Kuponët, Ditari, Raportet, Audit, Printer & TVSh, Punonjësit, Blloku i letrës, Licenca, Lokal & biznesi, Fiskalizimi, Pasqyra, Importo Produkte, Stoku, QR Kodet, Cloud & linke, Blerjet, Furnitorët. Pako 2 €220 në vit, më e popullarizuara: Gjithçka në Pako 1, Raporte të avancuara, Kontabilisti, AI, Faqja publike. Hyrja, bizneset dhe produktet e tjera nuk u prekën. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Dyqane dhe Barnatore: 3 pako

`website/src/data/produktet.ts`. Dyqani kaloi nga 4 pako në 3. Barnatorja kaloi nga 2 pako në 3. Çmimet: Pako 1 €150, Pako 2 €220, Pako 3 €250 në vit. Te Dyqani u shkrua butoni Vagë. Te Barnatorja u shkrua skeda Skadime dhe butoni Vagë. Skadime është te Pako 2. Produktet e tjera nuk u prekën. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Butika dhe Argjendari: 3 pako

`website/src/data/produktet.ts`. Butiku dhe Argjendaria kaluan nga 4 pako në 3: Pako 1 €150, Pako 2 €220, Pako 3 €250 në vit. Skedat janë ato që dha Naseri. Te Argjendaria u shkrua butoni Vagë te përshkrimi dhe te «Çka bën». Butiku nuk e ka. Produktet e tjera nuk u prekën. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Market: Cloud dhe linke te Pako 3

`website/src/data/produktet.ts`. Te Pako 3 e Marketit, «Cloud» u bë «Cloud dhe linke (lidh pronarin me kamarierët në telefon, faqen publike dhe porositë online)», njësoj si te Hoteli. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Market: raportet te Pako 1

`website/src/data/produktet.ts`. Te Marketi, «Raportet» u hoq nga Pako 3. Te Pako 1 u vendosën: Raporti X (Modi X), Raporti Z Fiskal, Raport Periodik, Raport i shkurtër periodik, Raporti mujor (memoria ATK), Përmbledhje Ditore. «Raporte të avancuara» mbeti te Pako 4. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Kafene dhe Hotel: 6 raportet te Pako 1

`website/src/data/produktet.ts`. Te Pako 1 e Kafenesë dhe e Hotelit u shtuan: Raporti X (Modi X), Raporti Z Fiskal, Raport Periodik, Raport i shkurtër periodik, Raporti mujor (memoria ATK), Përmbledhje Ditore. Fjala «Raportet» u hoq nga Pako 2, sepse këto gjashtë janë te Pako 1. «Raporte të avancuara» mbeti te pakoja e lartë. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Fiskalizim: 15 skedat e programit

`website/src/data/produktet.ts`, Pako 1 e Fiskalizimit. U hoqën emrat që programi nuk i ka. Mbetën 15 skedat e programit: Arka, Produktet, Kuponët, Ditari, Raporti X, Raporti Z, Periodik, Audit, Printeri, Punonjësit, Blloku i letrës, Licenca, Lokal & biznesi, Rivendos, Cilësimet SEF. Çmimi mbeti €150 në vit. Marketi nuk u prek. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Market dhe Fiskalizim: pakot

`website/src/data/produktet.ts`. Marketi tani ka 4 pako: €150, €180, €250, €350 në vit. Fiskalizimi ka vetëm Pako 1, €150 në vit. Skedat janë ato që dha Naseri. Kafene dhe Hoteli nuk u prekën. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Hotel: 3 pakot

`website/src/data/produktet.ts`. Hoteli tani ka Pako 1 €150, Pako 2 €300, Pako 3 €400 në vit. Skedat janë ato që dha Naseri. «QR Kodetloud» u nda në QR Kodet dhe Cloud dhe linke. Kafene nuk u prek. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Kafene: 4 pakot

`website/src/data/produktet.ts`. Pakot e Kafenesë u quajtën Pako 1–4. Çmimet mbetën €150, €180, €220, €250. Pikat janë skedat që dha Naseri. Hoteli nuk u prek, sepse lista e Hotelit nuk erdhi. Pa build. Pa git. Nuk është live.

## 2026-11-18 — Kafene: pikat si në foto

`website/src/data/produktet.ts` dhe `website/src/i18n/produktet-gjuhe.ts`. Pastiçeri u quajt Ëmbëltore. Katering u quajt Gjelltore. Ushqimore u hoq. U shtuan Doner / Kebab, Fish restaurant dhe Sushi bar. Emrat u rregulluan: Restorant, Bar, Lounge bar, Fast food. Pa git. Nuk është live.

## 2026-11-18 — Marketi: 8 llojet e dyqanit

`website/src/data/produktet.ts` dhe `website/src/i18n/produktet-gjuhe.ts`. Te Marketi pikat u rregulluan si në program: Mini-market, Market, Supermarket, Dyqan ushqimor, Pemë dhe Perime, Mishtore, Bulmetore, Peshkatore. Pa git. Nuk është live.

## 2026-11-18 — Butika: kategoritë nga fotoja

`website/src/data/produktet.ts` dhe `website/src/i18n/produktet-gjuhe.ts`. Te Butika u shtuan Veshje, Këpucë, Çanta, Aksesore, Bebe Shop, Kozmetikë, Parfumeri, Syze, Lëkurë, Sportive. Të vjetrat mbetën. Pa git. Nuk është live.

## 2026-11-18 — Argjendaria pa Dyqane ari dhe Stoli

`website/src/data/produktet.ts` dhe `website/src/i18n/produktet-gjuhe.ts`. Te Argjendaria u hoqën «Dyqane ari» dhe «Stoli». Mbetën Argjendari, Orë, Bizhuteri, Gurë të çmuar. Pa git. Nuk është live.

## 2026-11-17 — Dyqanet: përshkrimi dhe kategoritë

`website/src/data/produktet.ts` dhe `website/src/i18n/produktet-gjuhe.ts`. Titulli u bë «Sistemi për çdo lloj dyqani». Përshkrimi thotë se është i përgjithshëm dhe përshtatet. Pikat janë 12 kategoritë e Dyqaneve: Shtëpi & Dekor, Shtepiake, Librari & Kancelari, Teknologji & Elektronikë, Auto-Pjesë & Vegla, Mobilje, Tepih & Perde, Kioska, Sallone, Tekstil shtëpie, Bagazhë & Valixhe, Dhurata. Pa git. Nuk është live.

## 2026-11-17 — Paketat sipas kodit të programeve

Vetëm `website/src/data/produktet.ts`. Pikat e çdo pakoje u zëvendësuan me skedat që programi i hap vërtet. Çmimet mbetën. Pa build. Pa git. Nuk është live. Nuk del në telefon.

KAFENE: Basic, Standard, Pro, Full. Ditari vetëm te Full. AI nuk hapet në asnjë pako.
HOTEL: Bazik, Standard, Premium. Shërbimet dhe Promocionet nga Standard. QR, Kontabilisti, AI dhe Raportet e avancuara vetëm te Premium.
MARKET: 5 pako. Stoku nga Pako 2. Ditari nga Pako 3. AI nga Pako 4. Kontrollet dhe Detyra vetëm te Pako 5.
FURRA: dy pako. AI vetëm te Pako me AI.
DYQANE, BUTIKA, ARGJENDARI: të njëjtat 4 pako sipas skedave.
BARNATORE: Pako 1 dhe Pako 2. AI vetëm te Pako 2.
FISKALIZIM, KONTABILISTI, SECURITY: tri çmime, por kodi nuk i mbyll skedat. Të njëjtat skeda në të tria.
DISTRIBUTOR, MJEKËSIA, POSTA/TAXI, RENTACAR: nuk janë në këtë kompjuter. Nuk u shkruan skeda të shpikura.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/data/produktet.ts` | Pikat e pakove sipas kodit. Çmimet të njëjta. |

## 2026-11-17 — Udhëzuesi te Super Admini

Te Master Admini, pas Cilësimeve, u shtua Udhëzuesi. Gjeneron një udhëzues për çdo projekt dhe për çdo pako. 15 projekte, 49 pako. Pakoja e vogël nuk i merr pjesët e pakos së madhe. Pa build. Pa git. Nuk është live. Nuk del në telefon derisa të vihet serveri.

Prova: u gjeneruan 49 PDF. SECURITY Roja ka Pikat, Ndërrimet, Hyrjen dhe daljen, dhe «150 euro për vit». Nuk ka raportin e natës. KAFENE Basic ka 9 faqe. KAFENE Full ka 20 faqe dhe e ka kuzhinën.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/admin/dashboard.html` | Udhëzuesi pas Cilësimeve |
| `public/admin/dashboard.js` | Lista dhe butoni Gjenero |
| `src/lib/udhezuesPaketa.js` | Projektet, paketat, PDF |
| `src/routes/admin.js` | /api/admin/udhezues dhe PDF |
| `package.json` | Mjeti që bën PDF |

## 2026-11-17 — Ballina dhe Udhëzuesi në menu

Vetëm `website/`. Në menunë lart, Ballina është para Produkteve. Udhëzuesi është pas Kontaktit. Ballina kthen te fillimi. Udhëzuesi hap faqen me fjalinë e klientëve të licencuar. Pa build. Pa git. Nuk është live.

Prova: faqja e parë 200, rendi Ballina, Produktet, … Kontakti, Udhëzuesi. /udhezuesi 200 me fjalinë. Klikimi te Udhëzuesi e hap faqen.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/components/Navbar.tsx` | Ballina para Produkteve, Udhëzuesi pas Kontaktit |
| `website/src/i18n/tekstet.ts` | Emrat në SQ, EN, DE, SR |
| `website/src/app/udhezuesi/page.tsx` | Faqja e udhëzuesit |

## 2026-11-17 — Fotot te faqet e programeve

Vetëm `website/`. Te çdo faqe programi, tri kartat bosh u zëvendësuan me foto që përputhen me shkrimin poshtë. 15 programe, 45 foto. Pa build. Pa git. Nuk është live. Nuk janë foto të ekranit të programit. Nuk dalin te telefoni dhe as te paneli i pronarit.

Prova: 15 faqet kthejnë 200 dhe e kanë foton e duhur. Fotoja e parë e secilit kthen 200. Te /security duken Pikat (pika e rojes), Ndërrimi (dy roje), Raporti (raporti i natës). Fjala PAMJE nuk del.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/public/pamje/` | 45 foto të reja |
| `website/src/components/Pamje.tsx` | Fotoja dhe shkrimi poshtë |
| `website/src/components/FaqjaProduktit.tsx` | Çdo shkrim lidhet me foton e vet |

## 2026-11-17 — Çmimet për vit

Vetëm `website/`. Çmimet janë për vit, jo për muaj. Te KAFENE, Ditari dhe Fiskalizimi janë në të katër paketat. AI është te Pro dhe Full. Pa build. Pa git. Nuk është live.

Prova: /kafene 200 me €150, Ditari, Fiskalizimi dhe parashikimet. /hotel ka €400. /market ka €300. /furra ka €220. Faqja e parë ka «Duke filluar nga» dhe €150. «Bazë» nuk del.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/data/produktet.ts` | Çmimet për vit, ditari, fiskalizimi, AI |
| `website/src/components/FaqjaProduktit.tsx` | Shënimi /vit |
| `website/src/components/Pricing.tsx` | Faqja e parë me paketat e programit |
| `website/src/i18n/tekstet.ts` | «Çmimi për vit» dhe «Duke filluar nga» |

## 2026-11-17 — Përshkrimet dhe paketat te faqet e programeve

Vetëm `website/`. Te faqja e çdo programi u ndryshua titulli, përshkrimi, llojet e bizneseve dhe paketat. Faqja kryesore mban çmimet e vjetra. Pa build. Pa git. Nuk është live.

Çmimet €150, €180, €220, €250 janë nga lista e firmës për Pakon 1–4. Pako 5 e MARKET nuk ka çmim të vet në atë listë, prandaj nuk iu vu shifër. Shtatë programe nuk kanë paketa në kod (DISTRIBUTOR, FISKALIZIM, KONTABILISTI, SECURITY, MJEKËSIA, POSTA/TAXI, RENTACAR): aty nivelet janë ndarje e thjeshtë, jo emra nga programi.

Prova: /kafene 200 me «Sistemi i Plotë për Lokale Gastronomike», Basic, Full, «Më i Popullarizuar», pa «Bazë». /hotel ka Bazik dhe Premium. /market ka Pako 1 dhe Pako 5. /furra ka «Pako me AI».

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/data/produktet.ts` | Titujt, llojet, paketat |
| `website/src/components/FaqjaProduktit.tsx` | Shenjat dhe paketat e programit |
| `website/src/i18n/produktet-gjuhe.ts` | Të njëjtat në EN, DE, SR |
| `website/src/i18n/tekstet.ts` | Shënimi «Më i Popullarizuar» |

## 2026-11-17 — Udhëzuesit e 15 programeve

Vetëm `website/`. 15 udhëzues në shqip, një link që hapet një herë, dhe një fjali te faqja e çdo programi. Pa build. Pa git. Nuk është live.

Katër programe nuk janë në këtë kompjuter: DISTRIBUTOR, MJEKËSIA, POSTA/TAXI, RENTACAR. Te ato udhëzuesi thotë se skedat nuk janë lexuar. Nuk u shpik numër telefoni.

Prova: faqja /kafene, /hotel, /rentacar kthejnë 200 dhe e kanë fjalinë e klientëve të licencuar, pa link shkarkimi. Link i gabuar kthen 410 me «Ky link ka skaduar ose është përdorur tashmë». Link i ri shkarkon PDF-në një herë, hera e dytë 410. Fjalëkalimi i gabuar kthen 401. /admin/manuals kthen 200. Titulli i MARKET është «Revolution MARKET — Udhëzues Përdorimi».

| Skedar | Ndryshimi |
|--------|-----------|
| `website/public/manuals/manual-*.pdf` | 15 udhëzues |
| `website/scripts/gjenero-manualet.js` | Si u shkruan udhëzuesit |
| `website/src/app/api/download-manual/route.ts` | Linku një herë |
| `website/src/app/api/admin/manuals/route.ts` | Krijimi i linkut |
| `website/src/app/admin/manuals/page.tsx` | Faqja ku krijohen linket |
| `website/src/lib/manualet.ts` | Leximi i listës së linkeve |
| `website/src/lib/manualet-lista.ts` | 15 programet |
| `website/data/manual-tokens.json` | Linket |
| `website/src/components/FaqjaProduktit.tsx` | Fjalia për klientët e licencuar |
| `website/package.json` | U shtua pdfkit |

## 2026-11-17 — Shkrimi Revolution POS pranë R-së

Vetëm `website/`. Shenja R mbetet pa katror. Pranë saj u kthye shkrimi «Revolution POS», lart dhe poshtë. Pa build. Pa git.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/components/Navbar.tsx` | Shkrimi pranë logos |
| `website/src/components/Footer.tsx` | Shkrimi pranë logos |

## 2026-11-17 — Vetëm shenja R, më e madhe

Vetëm `website/`. U hoq katrori dhe shkrimi «Revolution POS» nga fotografia. Mbetet shenja R, më e madhe, lart dhe poshtë. Pa build. Pa git.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/assets/revolution-marka.png` | Vetëm R-ja, pa katror |
| `website/src/components/Navbar.tsx` | Logo më e madhe lart |
| `website/src/components/Footer.tsx` | Logo më e madhe poshtë |

## 2026-11-17 — Logoja e re në faqe

Vetëm `website/`. Logoja e re (R dhe Revolution POS) te menuja dhe te fundi i faqes. Pa build. Pa git. Nuk është live.

Prova: faqja lokale kthen 200 dhe e mban `revolution-pos-logo`. E hapa në shfletues.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/assets/revolution-pos-logo.jpg` | Logoja e re |
| `website/src/components/Navbar.tsx` | Logoja lart |
| `website/src/components/Footer.tsx` | Logoja poshtë |

## 2026-11-17 — Katër gjuhë në faqen lokale

Vetëm `website/`. SQ, EN, DE, SR. Butonat janë lart djathtas. Serbishtja është me shkronja latine. Emrat e programeve mbeten. Çmimet mbeten. Pa build. Pa git. Nuk është live.

Prova: tsc kaloi. Në shfletues EN «The POS system», DE «Das Kassensystem», SR «POS sistem». Faqja /kafene në SR «Restorani i kafići», pastaj SQ «Restorante dhe kafene».

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/i18n/tekstet.ts` | Tekstet e faqes |
| `website/src/i18n/produktet-gjuhe.ts` | Tekstet e 15 programeve |
| `website/src/i18n/gjuha.tsx` | Zgjedhja e gjuhës |
| `website/src/app/layout.tsx` | Mbështjellësi i gjuhës |
| `website/src/components/*.tsx` | Tekstet nga gjuha |

## 2026-11-17 — Pajisjet te përparësia

Vetëm `website/`. Në fund të përparësisë: Windows, Android, iPhone/iPad, Mac. Klikimi zgjedh pajisjen dhe të çon te demo. Pa build. Pa git. Nuk është live.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/components/Perparesia.tsx` | Katër pajisjet në fund |

## 2026-11-17 — Foto dhe pika te kartat

Vetëm `website/`. Çdo kartë ka foto të veprimtarisë dhe gjashtë pika. KAFENE: pasqyra, raporte, telefon për kamarier. Pa build. Pa git. Nuk është live.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/public/veprimtari/*.jpg` | 15 foto |
| `website/src/data/produktet.ts` | Fotoja dhe pikat e veçanta |
| `website/src/components/Products.tsx` | Foto në vend të kutisë bosh |

## 2026-11-17 — Përparësia, ballina dhe produktet

Vetëm `website/`. Katër pika pas ballinës. Te çdo produkt, «Pse Revolution?» para çmimeve. Pa build. Pa git. Nuk është live.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/components/Perparesia.tsx` | Katër pikat |
| `website/src/app/page.tsx` | Pjesa pas ballinës |
| `website/src/components/FaqjaProduktit.tsx` | Versioni i shkurtër para çmimeve |
| `website/package.json` | Ikona lucide-react |

## 2026-11-17 — Faqet e 15 produkteve

Vetëm `website/`. Kartat e ballinës hapin faqen e produktit. Menuja ka listën. Pa build. Pa git. Nuk është live.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/data/produktet.ts` | 15 produktet, grupet, çmimet |
| `website/src/components/Products.tsx` | Kartë me pamje dhe lidhje |
| `website/src/components/Navbar.tsx` | Lista Produktet |
| `website/src/components/Footer.tsx` | Lidhjet shkojnë te faqja e produktit |
| `website/src/components/FaqjaProduktit.tsx` | Pamja e njëjtë për çdo produkt |
| `website/src/app/[slug]/page.tsx` | 15 rrugët |

## 2026-11-17 — Ballina lokale website/

Vetëm `website/`. Tema e errët mbeti. 15 produkte, kupon shembull, çmim që ndryshon, pyetje, demo. Pa build. Pa git. Nuk është live.

| Skedar | Ndryshimi |
|--------|-----------|
| `website/src/app/page.tsx` | Renditja e re e ballinës |
| `website/src/components/Hero.tsx` | 15 produkte, pika, kornizë e ekranit |
| `website/src/components/Products.tsx` | 15 karta |
| `website/src/components/Fiskal.tsx` | Kupon shembull dhe 5 hapa |
| `website/src/components/HowItWorks.tsx` | 4 hapa |
| `website/src/components/Pricing.tsx` | Llogaritësi |
| `website/src/components/Faq.tsx` | Pyetjet |
| `website/src/components/Contact.tsx` | Kërkesa për demo |
| `website/src/components/Navbar.tsx` `Footer.tsx` | Lidhje të gjalla, 15 produkte |

## 2026-11-17 — Tipi i biznesit te Butik, Argjendari, Dyqan

Te klienti i ri, kur zgjidhet Butik, Argjendari ose Dyqan, del lista e kategorive. Zgjedhja ruhet te licenca. Barnatorja mbetet pa listë. Pa build. Pa git. Live jo.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/admin/dashboard.html` | Tri lista |
| `public/admin/dashboard.js` | Lista hapet sipas programit dhe dërgohet kategoria |
| `src/lib/dedicatedLicenseBridge.js` | Kategoria ruhet pas regjistrimit |

## 2026-11-17 — Dera për Butik, Dyqan, Barnatore, Argjendari

Dera i çon `/butika`, `/dyqanet`, `/barnatore`, `/argjendari` te serveri i secilit. Adresa merret nga env. Pa env kthen «Mungon …_UPSTREAM». Rrugët e vjetra nuk u prekën. Pa build. Pa git. Live jo.

| Skedar | Ndryshimi |
|--------|-----------|
| `src/server.js` | Katër porta të reja, rruga e plotë si te Fiskalizimi |

## 2026-11-16 — Dosja website (Next.js)

U krijua `website/` në rrënjë. Next.js 16.4.6 (jo 14 — komanda ishte @latest), TypeScript, Tailwind 4, App Router, `src/`, alias `@/*`. U instalua `framer-motion` ^14.14.0. Pa build, pa server, pa git. Serveri i vjetër, marketing-blog dhe public nuk u prekën.

## 2026-11-14 — URL revolution-pos.com poshtë Powered by

Poshtë «Powered by Revolution POS» shkruhet `https://revolution-pos.com` — faqja publike, takeaway, QR tavoline. Pa waiter, pa build.

| Skedar | Ndryshimi |
|--------|-----------|
| `public/r.html` `r-order.html` `kiosk.html` | URL poshtë Powered by |
| `public/css/r-public-menu.css` | rreshti i URL-së |

## 2026-11-14 — Foto rrota/kafe te blu, e bardhë, e gjelbër

Te temat Blu Nate, E Bardhë e Pastër dhe E Gjelbër Natyrale: e njëjta foto (rrota + mulli kafeje) në prapavijë, me ngjyrën e temës. Kafe Klasike dhe Elegante e Zezë mbeten me lule. `/img/` u shtua te rrugët e rezervuara që fotoja të dalë live. Commit + push + deploy.

## 2026-11-14 — Deploy live 231471a

Commit + push + deploy. `/health` git_commit `231471a`. Linqet te telefoni, 5 temat, takeaway/QR.

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

## 2026-11-18 — Emrat e pakove në panel

- `public/admin/dashboard.js`: u hoqën Bazik, Standard, Premium. MARKET ka Pako 1–4. HOTEL ka Pako 1–3. DYQANE, BUTIKA, ARGJENDARI, BARNATORE kanë Pako 1–3. SECURITY, KONTABILISTI, FISKALIZIM kanë vetëm Pako 1.
- `src/lib/packages.js`: emrat e shkurtër janë Pako 1, Pako 2, Pako 3, Pako 4.
- Paneli i ri del vetëm pas deploy. Nuk u bë deploy.
