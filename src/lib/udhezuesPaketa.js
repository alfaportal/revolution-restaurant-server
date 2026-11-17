const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const per =
  "Revolution Invest SH.P.K. është firmë e specializuar në teknologjinë e fundit për menaxhimin e bizneseve në Kosovë. Me përvojë të gjatë dhe ekip profesional, ne krijojmë zgjidhje softuerike që përshtaten sipas nevojave të çdo biznesi. Produktet tona instalohen drejtpërdrejt në pajisjen tuaj me setup.exe, të dhënat ruhen lokalisht në kompjuterin tuaj, dhe si siguri shtesë ruhen edhe në databazën tonë cloud. Programet funksionojnë edhe pa internet. Kur kthehet interneti, sinkronizohen automatikisht. Jemi të certifikuar nga ATK dhe ofrojmë mbështetje teknike të vazhdueshme.";

const FJALI = {
  "Arka dhe tavolinat": "Këtu bëhet shitja te tavolina. Zgjidhni artikullin, merrni pagesën dhe printoni kuponin.",
  Menuja: "Këtu mbani pijet dhe ushqimet. Shkruani emrin dhe çmimin që i sheh kamarieri.",
  Stafi: "Këtu shtoni njerëzit e lokalit. Secili hyn me emrin e vet.",
  Ditari: "Këtu shihni çfarë është bërë gjatë ditës. Dalin shitjet, pagesat dhe mbyllja.",
  Menaxherët: "Këtu shtoni menaxherët. Ata hyjnë dhe shohin punën sipas lejes që u jepni.",
  Fiskalizimi: "Këtu lidhni programin me fiskalizimin. Kuponi merr numrin që kërkon ATK.",
  "Kamarieri në lokal": "Kamarieri sheh tavolinat dhe shënon porosinë në lokal. Kur tavolina mbyllet, del kuponi.",
  "Kodet e tavolinave": "Këtu bëni kodet e tavolinave. Mysafiri ose kamarieri i hap me telefon.",
  "Lidhja e telefonit": "Këtu lidhni telefonin me programin. Porosia dhe puna shihen edhe nga telefoni.",
  "Kamarieri nga telefoni": "Kamarieri merr porosinë nga telefoni. Tavolina përditësohet sapo ruhet porosia.",
  Stoku: "Këtu shihni sa copë keni. Kur hyn mall i ri, sasia rritet.",
  Promocionet: "Këtu vendosni zbritjet. Artikulli shitet me çmimin e ri derisa oferta të mbarojë.",
  Raportet: "Këtu shihni sa është shitur në një periudhë. Zgjidhni ditën ose javën dhe lexoni totalet.",
  Blerjet: "Këtu shënoni mallin që blini. Sasia hyn në stok dhe fatura mbetet e ruajtur.",
  Rezervimet: "Këtu shënoni rezervimet e tavolinave. Shehni cila tavolinë është e zënë.",
  Kontabilisti: "Këtu përgatiten të dhënat për kontabilistin. Shitjet dhe blerjet mblidhen në një vend.",
  "Lidhja e kuzhinës": "Këtu porosia i shkon kuzhinës. Kuzhina sheh çfarë duhet përgatitur.",
  "Dhomat dhe mysafirët": "Këtu mbani dhomat dhe emrat e mysafirëve. Shihni cila dhomë është e lirë.",
  Recepsioni: "Këtu punon recepsioni. Pret mysafirin dhe e regjistron qëndrimin.",
  Porositë: "Këtu shihni porositë. Mbetet çfarë është kërkuar dhe sa kushton.",
  "Pagesa në recepsion": "Këtu mbyllet pagesa e mysafirit. Del kuponi për shumën që është marrë.",
  Shërbimet: "Këtu shënoni shërbimet që ofroni dhe çmimin e secilit.",
  Kodet: "Këtu bëni kodet që skanohen me telefon. Hapeni me kamerën.",
  "Inteligjencë Artificiale (AI)": "Kjo pako ka inteligjencën artificiale. Ju ndihmon të shihni punën pa kërkuar skedë pas skede.",
  Arka: "Këtu bëhet shitja. Zgjidhni artikullin, merrni pagesën dhe printoni kuponin.",
  Produktet: "Këtu mbani listën e artikujve. Shtoni emrin, çmimin dhe barkodin.",
  Punonjësit: "Këtu shtoni njerëzit që punojnë. Secili hyn me emrin e vet.",
  Kuponi: "Këtu del kuponi i shitjes. Mund ta hapni dhe ta printoni përsëri.",
  "Krejt skedat e hapura": "Në këtë pako janë të hapura të gjitha skedat e programit.",
  "Arka e furrës": "Këtu shitet buka dhe ëmbëlsirat. Zgjidhni artikullin dhe printoni kuponin.",
  "Blerjet dhe furnitorët": "Këtu shënoni blerjen dhe furnitorin. Sasia hyn në stok.",
  "Ditari dhe raportet": "Këtu shihni ditën dhe totalet. Zgjidhni periudhën dhe lexoni sa është shitur.",
  "Kuponi fiskal": "Këtu del kuponi me të dhënat që kërkon ATK.",
  Lokali: "Këtu shkruani emrin e dyqanit dhe të dhënat që dalin në kupon.",
  Pasqyra: "Këtu shihni si ka ecur dita. Dalin shitjet dhe gjërat që kërkojnë vëmendje.",
  Faturat: "Këtu shihni faturat e shitjes. Mund ta hapni një faturë dhe ta printoni.",
  "Shitja te biznese": "Këtu shisni te biznese të tjera. Shkruani klientin, artikujt dhe nxirrni faturën.",
  "Raporte më të gjera": "Këtu shihni shitjen më në detaje. Krahasoni ditët dhe artikujt.",
  "Madhësia dhe ngjyra": "Këtu shënoni masën dhe ngjyrën e artikullit. Shitja bëhet me variantin e duhur.",
  "Grami dhe punimi": "Këtu shënoni peshën dhe punimin. Çmimi i stolisë del sipas gramit.",
  "Klientët e shumicës": "Këtu mbani klientët që blejnë me shumicë. Secili ka çmimin e vet.",
  "Fatura e rrugës": "Këtu nxirrni faturën që shkon me mallin në rrugë.",
  "Çmimet e shumicës": "Këtu vendosni çmimet për klientët e shumicës.",
  Ngarkesa: "Këtu shënoni çfarë ngarkohet për rrugën. Mbetet lista e mallit.",
  Magazina: "Këtu shihni mallin në magazinë. Kur del malli, sasia ulet.",
  "Rruga e ditës": "Këtu shihni rrugën e ditës. Dalin klientët që duhen vizituar.",
  "Pagesat e hapura": "Këtu shihni pagesat që ende s’janë mbyllur.",
  "Raporti i javës": "Këtu shihni totalet e javës.",
  "Fatura me TVSH": "Këtu fatura del me TVSH. Shuma pa TVSH dhe TVSH-ja ndahen.",
  Skadimet: "Këtu shihni barnat që po u afron data. I hiqni nga rafti para se të skadojnë.",
  Shitja: "Këtu bëhet shitja. Zgjidhni artikullin dhe merrni pagesën.",
  "Kuponi për ATK": "Këtu kuponi del me të dhënat që kërkon ATK.",
  TVSH: "Këtu shihni TVSH-në. Shuma pa TVSH dhe TVSH-ja ndahen.",
  "Cash dhe kartë": "Këtu zgjidhni nëse pagesa është cash apo me kartë.",
  "Libri i shitjeve": "Këtu mblidhen shitjet. Çdo shitje mbetet në libër.",
  "Raporti i ditës": "Këtu shihni totalet e ditës.",
  "Dërgohet kur kthehet interneti": "Kur s’ka internet, shitja ruhet. Kur kthehet rrjeti, dërgohet vetë.",
  "Raporti X dhe Z": "Raporti X i sheh totalet pa e mbyllur ditën. Raporti Z e mbyll ditën.",
  "Blloku i letrës": "Këtu ndaloni printimin kur letra ngec. Kuponi ruhet dhe printohet kur letra kthehet.",
  "Libri i blerjeve": "Këtu mblidhen blerjet. Çdo blerje mbetet në libër.",
  "Klientët dhe furnitorët": "Këtu mbani emrat e klientëve dhe të furnitorëve.",
  Shpenzimet: "Këtu shënoni shpenzimet e biznesit.",
  "Bilanci i muajit": "Këtu shihni bilancin e muajit. Dalin shitjet, blerjet dhe TVSH-ja.",
  Raporti: "Këtu shihni përmbledhjen e punës.",
  "Dërgimi te ATK": "Këtu përgatitet dërgimi te ATK.",
  "Lidhja me arkën": "Këtu kontabilisti lidhet me arkën. Shitjet e arkës hyjnë në libër.",
  "Pikat e rojes": "Këtu shënoni pikat ku qëndron roja.",
  Ndërrimet: "Këtu shënoni kur një roje ia lë punën tjetrës.",
  "Hyrja dhe dalja": "Këtu shënoni kush hyn dhe kush del.",
  Orari: "Këtu vendosni orarin e punës.",
  Objekti: "Këtu mbani objektet që ruhen.",
  Incidentet: "Këtu shënoni një ngjarje që ka ndodhur gjatë rojes.",
  "Raporti i natës": "Këtu roja mbyll raportin e natës.",
  "Orari i rojes": "Këtu shihni kush është në roje dhe në cilën orë.",
  "Njoftimi te pronari": "Këtu pronari merr lajmërimin për punën e rojes.",
  Terminet: "Këtu caktoni terminet. Shihni orën dhe pacientin.",
  Pacienti: "Këtu mbani emrin e pacientit dhe të dhënat e vizitës.",
  "Orari i mjekut": "Këtu vendosni orarin e mjekut. Terminet zënë vend brenda këtij orari.",
  "Pagesa e vizitës": "Këtu mbyllet pagesa e vizitës.",
  Kartela: "Këtu hapet kartela e pacientit. Mbeten vizitat e mëparshme.",
  Radha: "Këtu shihni radhën e pacientëve që presin.",
  "Arka e klinikës": "Këtu bëhet pagesa në klinikë. Del kuponi për shumën e marrë.",
  Udhëtimi: "Këtu shënoni udhëtimin. Mbetet nga ku nis dhe ku mbaron.",
  "Çmimi i rrugës": "Këtu vendosni çmimin e rrugës.",
  Shoferi: "Këtu shënoni shoferin që e bën rrugën.",
  Klienti: "Këtu shënoni klientin e kësaj pune.",
  Fatura: "Këtu nxirrni faturën. Mund ta hapni dhe ta printoni.",
  "Mbyllja e ditës": "Këtu mbyllni ditën. Totalet ruhen.",
  Mjetet: "Këtu mbani veturat. Shihni cilat janë në flotë.",
  Disponueshmëria: "Këtu shihni cila veturë është e lirë dhe cila është e dhënë.",
  Kontrata: "Këtu hapet kontrata e qirasë. Shkruani klientin, mjetin dhe datat.",
  "Marrja dhe kthimi": "Këtu shënoni kur merret vetura dhe kur kthehet.",
  Kilometrat: "Këtu shënoni kilometrat në marrje dhe në kthim.",
  Pagesa: "Këtu mbyllet pagesa e qirasë.",
};

const AI_KAFE =
  "Inteligjencë Artificiale (AI) — analiza automatike, parashikime shitjesh, dhe sugjerime për menunë bazuar në të dhëna.";

function pako(id, emri, cmimi, pikat) {
  return { id, emri, cmimi, pikat };
}

const projektet = [
  {
    slug: "kafene",
    emri: "KAFENE",
    paketat: [
      pako("basic", "Basic", "€150", ["Arka dhe tavolinat", "Menuja", "Stafi", "Ditari", "Fiskalizimi", "Kamarieri në lokal"]),
      pako("standard", "Standard", "€180", ["Arka dhe tavolinat", "Menuja", "Stafi", "Ditari", "Fiskalizimi", "Kamarieri në lokal", "Kodet e tavolinave", "Lidhja e telefonit", "Kamarieri nga telefoni"]),
      pako("pro", "Pro", "€220", ["Arka dhe tavolinat", "Menuja", "Stafi", "Ditari", "Fiskalizimi", "Kamarieri në lokal", "Kodet e tavolinave", "Lidhja e telefonit", "Kamarieri nga telefoni", "Stoku", "Promocionet", "Raportet", "Blerjet", AI_KAFE]),
      pako("full", "Full", "€250", ["Arka dhe tavolinat", "Menuja", "Stafi", "Ditari", "Fiskalizimi", "Kamarieri në lokal", "Kodet e tavolinave", "Lidhja e telefonit", "Kamarieri nga telefoni", "Stoku", "Promocionet", "Raportet", "Blerjet", AI_KAFE, "Rezervimet", "Kontabilisti", "Lidhja e kuzhinës"]),
    ],
  },
  {
    slug: "hotel",
    emri: "HOTEL",
    paketat: [
      pako("bazik", "Bazik", "€150", ["Dhomat dhe mysafirët", "Recepsioni", "Porositë", "Stoku", "Pagesa në recepsion"]),
      pako("standard", "Standard", "€180", ["Dhomat dhe mysafirët", "Recepsioni", "Porositë", "Stoku", "Pagesa në recepsion", "Shërbimet", "Promocionet"]),
      pako("premium", "Premium", "€400", ["Dhomat dhe mysafirët", "Recepsioni", "Porositë", "Stoku", "Pagesa në recepsion", "Shërbimet", "Promocionet", "Kodet", "Kontabilisti", "Inteligjencë Artificiale (AI)"]),
    ],
  },
  {
    slug: "market",
    emri: "MARKET",
    paketat: [
      pako("pako-1", "Pako 1 — Bazik", "€150", ["Arka", "Produktet", "Punonjësit", "Kuponi"]),
      pako("pako-2", "Pako 2 — Standard", "€180", ["Arka", "Produktet", "Punonjësit", "Kuponi", "Kodet", "Lidhja e telefonit"]),
      pako("pako-3", "Pako 3 — Profesional", "€220", ["Arka", "Produktet", "Punonjësit", "Kuponi", "Kodet", "Lidhja e telefonit", "Stoku", "Blerjet", "Promocionet", "Raportet"]),
      pako("pako-4", "Pako 4 — Biznes + AI", "€250", ["Arka", "Produktet", "Punonjësit", "Kuponi", "Kodet", "Lidhja e telefonit", "Stoku", "Blerjet", "Promocionet", "Raportet", "Ditari", "Menaxherët", "Kontabilisti", "Inteligjencë Artificiale (AI)"]),
      pako("pako-5", "Pako 5 — Premium", "€300", ["Arka", "Produktet", "Punonjësit", "Kuponi", "Kodet", "Lidhja e telefonit", "Stoku", "Blerjet", "Promocionet", "Raportet", "Ditari", "Menaxherët", "Kontabilisti", "Inteligjencë Artificiale (AI)", "Krejt skedat e hapura"]),
    ],
  },
  {
    slug: "furra",
    emri: "FURRA",
    paketat: [
      pako("pako", "Pako", "€150", ["Arka e furrës", "Produktet", "Stoku", "Blerjet dhe furnitorët", "Ditari dhe raportet", "Kuponi fiskal"]),
      pako("pako-ai", "Pako me AI", "€220", ["Arka e furrës", "Produktet", "Stoku", "Blerjet dhe furnitorët", "Ditari dhe raportet", "Kuponi fiskal", "Inteligjencë Artificiale (AI)"]),
    ],
  },
  {
    slug: "dyqane",
    emri: "DYQANE",
    paketat: [
      pako("pako-1", "Pako 1", "€150", ["Arka", "Produktet", "Lokali", "Kuponi"]),
      pako("pako-2", "Pako 2", "€180", ["Arka", "Produktet", "Lokali", "Kuponi", "Pasqyra", "Stoku", "Blerjet", "Ditari"]),
      pako("pako-3", "Pako 3", "€220", ["Arka", "Produktet", "Lokali", "Kuponi", "Pasqyra", "Stoku", "Blerjet", "Ditari", "Faturat", "Promocionet", "Shitja te biznese", "Kodet"]),
      pako("pako-4", "Pako 4", "€250", ["Arka", "Produktet", "Lokali", "Kuponi", "Pasqyra", "Stoku", "Blerjet", "Ditari", "Faturat", "Promocionet", "Shitja te biznese", "Kodet", "Kontabilisti", "Inteligjencë Artificiale (AI)", "Raporte më të gjera"]),
    ],
  },
  {
    slug: "butika",
    emri: "BUTIKA",
    paketat: [
      pako("pako-1", "Pako 1", "€150", ["Arka", "Produktet", "Madhësia dhe ngjyra", "Kuponi"]),
      pako("pako-2", "Pako 2", "€180", ["Arka", "Produktet", "Madhësia dhe ngjyra", "Kuponi", "Pasqyra", "Stoku", "Blerjet", "Ditari"]),
      pako("pako-3", "Pako 3", "€220", ["Arka", "Produktet", "Madhësia dhe ngjyra", "Kuponi", "Pasqyra", "Stoku", "Blerjet", "Ditari", "Faturat", "Promocionet", "Shitja te biznese", "Kodet"]),
      pako("pako-4", "Pako 4", "€250", ["Arka", "Produktet", "Madhësia dhe ngjyra", "Kuponi", "Pasqyra", "Stoku", "Blerjet", "Ditari", "Faturat", "Promocionet", "Shitja te biznese", "Kodet", "Kontabilisti", "Inteligjencë Artificiale (AI)", "Raporte më të gjera"]),
    ],
  },
  {
    slug: "distributor",
    emri: "DISTRIBUTOR",
    paketat: [
      pako("nisja", "Nisja", "€150", ["Klientët e shumicës", "Fatura e rrugës", "Çmimet e shumicës"]),
      pako("rruga", "Rruga", "€220", ["Klientët e shumicës", "Fatura e rrugës", "Çmimet e shumicës", "Ngarkesa", "Magazina", "Rruga e ditës"]),
      pako("e-plote", "E plotë", "€300", ["Klientët e shumicës", "Fatura e rrugës", "Çmimet e shumicës", "Ngarkesa", "Magazina", "Rruga e ditës", "Pagesat e hapura", "Raporti i javës", "Fatura me TVSH"]),
    ],
  },
  {
    slug: "argjendari",
    emri: "ARGJENDARI",
    paketat: [
      pako("pako-1", "Pako 1", "€150", ["Arka", "Produktet", "Grami dhe punimi", "Kuponi"]),
      pako("pako-2", "Pako 2", "€180", ["Arka", "Produktet", "Grami dhe punimi", "Kuponi", "Pasqyra", "Stoku", "Blerjet", "Ditari"]),
      pako("pako-3", "Pako 3", "€220", ["Arka", "Produktet", "Grami dhe punimi", "Kuponi", "Pasqyra", "Stoku", "Blerjet", "Ditari", "Faturat", "Promocionet", "Shitja te biznese", "Kodet"]),
      pako("pako-4", "Pako 4", "€250", ["Arka", "Produktet", "Grami dhe punimi", "Kuponi", "Pasqyra", "Stoku", "Blerjet", "Ditari", "Faturat", "Promocionet", "Shitja te biznese", "Kodet", "Kontabilisti", "Inteligjencë Artificiale (AI)", "Raporte më të gjera"]),
    ],
  },
  {
    slug: "barnatore",
    emri: "BARNATORE",
    paketat: [
      pako("pako-1", "Pako 1", "€150", ["Arka", "Pasqyra", "Stoku", "Blerjet", "Ditari", "Skadimet", "Kuponi"]),
      pako("pako-2", "Pako 2", "€220", ["Arka", "Pasqyra", "Stoku", "Blerjet", "Ditari", "Skadimet", "Kuponi", "Faturat", "Promocionet", "Shitja te biznese", "Kodet", "Kontabilisti", "Inteligjencë Artificiale (AI)", "Raporte më të gjera"]),
    ],
  },
  {
    slug: "fiskalizim",
    emri: "FISKALIZIM",
    paketat: [
      pako("arka", "Arka", "€150", ["Shitja", "Kuponi për ATK", "TVSH", "Cash dhe kartë"]),
      pako("libri", "Libri", "€220", ["Shitja", "Kuponi për ATK", "TVSH", "Cash dhe kartë", "Libri i shitjeve", "Raporti i ditës", "Dërgohet kur kthehet interneti"]),
      pako("e-plote", "E plotë", "€300", ["Shitja", "Kuponi për ATK", "TVSH", "Cash dhe kartë", "Libri i shitjeve", "Raporti i ditës", "Dërgohet kur kthehet interneti", "Punonjësit", "Raporti X dhe Z", "Blloku i letrës"]),
    ],
  },
  {
    slug: "kontabilisti",
    emri: "KONTABILISTI",
    paketat: [
      pako("librat", "Librat", "€150", ["Libri i shitjeve", "Libri i blerjeve", "Klientët dhe furnitorët"]),
      pako("muaji", "Muaji", "€220", ["Libri i shitjeve", "Libri i blerjeve", "Klientët dhe furnitorët", "TVSH", "Shpenzimet", "Bilanci i muajit"]),
      pako("atk", "ATK", "€300", ["Libri i shitjeve", "Libri i blerjeve", "Klientët dhe furnitorët", "TVSH", "Shpenzimet", "Bilanci i muajit", "Raporti", "Dërgimi te ATK", "Lidhja me arkën"]),
    ],
  },
  {
    slug: "security",
    emri: "SECURITY",
    paketat: [
      pako("roja", "Roja", "€150", ["Pikat e rojes", "Ndërrimet", "Hyrja dhe dalja"]),
      pako("objektet", "Objektet", "€220", ["Pikat e rojes", "Ndërrimet", "Hyrja dhe dalja", "Orari", "Objekti", "Incidentet"]),
      pako("e-plote", "E plotë", "€300", ["Pikat e rojes", "Ndërrimet", "Hyrja dhe dalja", "Orari", "Objekti", "Incidentet", "Raporti i natës", "Orari i rojes", "Njoftimi te pronari"]),
    ],
  },
  {
    slug: "mjekesia",
    emri: "MJEKËSIA",
    paketat: [
      pako("terminet", "Terminet", "€150", ["Terminet", "Pacienti", "Orari i mjekut"]),
      pako("vizita", "Vizita", "€220", ["Terminet", "Pacienti", "Orari i mjekut", "Shërbimet", "Pagesa e vizitës", "Kartela", "Radha"]),
      pako("e-plote", "E plotë", "€300", ["Terminet", "Pacienti", "Orari i mjekut", "Shërbimet", "Pagesa e vizitës", "Kartela", "Radha", "Raporti i ditës", "Kuponi fiskal", "Arka e klinikës"]),
    ],
  },
  {
    slug: "posta-taxi",
    emri: "POSTA/TAXI",
    paketat: [
      pako("udhetimi", "Udhëtimi", "€150", ["Udhëtimi", "Çmimi i rrugës", "Shoferi", "Klienti"]),
      pako("dita", "Dita", "€220", ["Udhëtimi", "Çmimi i rrugës", "Shoferi", "Klienti", "Fatura", "Mbyllja e ditës"]),
      pako("e-plote", "E plotë", "€300", ["Udhëtimi", "Çmimi i rrugës", "Shoferi", "Klienti", "Fatura", "Mbyllja e ditës", "Raporti", "Kuponi fiskal"]),
    ],
  },
  {
    slug: "rentacar",
    emri: "RENTACAR",
    paketat: [
      pako("mjetet", "Mjetet", "€150", ["Mjetet", "Disponueshmëria", "Klienti"]),
      pako("kontrata", "Kontrata", "€220", ["Mjetet", "Disponueshmëria", "Klienti", "Kontrata", "Marrja dhe kthimi", "Kilometrat"]),
      pako("e-plote", "E plotë", "€300", ["Mjetet", "Disponueshmëria", "Klienti", "Kontrata", "Marrja dhe kthimi", "Kilometrat", "Pagesa", "Fatura"]),
    ],
  },
];

function gjej(slug, id) {
  const projekti = projektet.find((p) => p.slug === String(slug || ""));
  const pakoja = projekti?.paketat.find((p) => p.id === String(id || ""));
  if (!projekti || !pakoja) {
    const gabim = new Error("Projekti ose pakoja nuk u gjet.");
    gabim.code = "NOT_FOUND";
    throw gabim;
  }
  return { projekti, pakoja };
}

function copa(pika) {
  if (pika === AI_KAFE) {
    return {
      titulli: "Inteligjencë Artificiale (AI)",
      teksti: "Analiza automatike, parashikime shitjesh, dhe sugjerime për menunë bazuar në të dhëna.",
    };
  }
  if (pika === "Inteligjencë Artificiale (AI)") {
    return { titulli: pika, teksti: FJALI[pika] };
  }
  const teksti = FJALI[pika];
  if (!teksti) {
    const gabim = new Error("Mungon teksti: " + pika);
    gabim.code = "TEKST";
    throw gabim;
  }
  return { titulli: pika, teksti };
}

function listo() {
  return projektet.map((p) => ({
    slug: p.slug,
    emri: p.emri,
    paketat: p.paketat.map((pk) => ({ id: pk.id, emri: pk.emri, cmimi: pk.cmimi })),
  }));
}

function emriSkedarit(slug, id) {
  return `udhezues-${String(slug || "projekt")}-${String(id || "pako")}.pdf`;
}

function gjenero(slug, id) {
  const { projekti, pakoja } = gjej(slug, id);
  const logo = path.join(__dirname, "..", "..", "website", "src", "assets", "revolution-marka.png");
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 64, compress: false });
    const copat = [];
    doc.on("data", (c) => copat.push(c));
    doc.on("end", () => resolve(Buffer.concat(copat)));
    doc.on("error", reject);
    const gjer = doc.page.width - 128;
    if (fs.existsSync(logo)) doc.image(logo, (doc.page.width - 150) / 2, 170, { width: 150 });
    doc.font("Helvetica-Bold").fontSize(22).fillColor("#111111").text(`Revolution ${projekti.emri}`, 64, 390, { width: gjer, align: "center" });
    doc.font("Helvetica").fontSize(16).text(`Udhëzuesi - ${pakoja.emri.replace(/—/g, "-")}`, 64, 440, { width: gjer, align: "center" });
    doc.fontSize(13).text(`${String(pakoja.cmimi).replace("€", "")} euro për vit`, 64, 480, { width: gjer, align: "center" });
    doc.fontSize(12).text("© Revolution Invest SH.P.K. - Ferizaj, Kosovë", 64, 740, { width: gjer, align: "center" });
    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(20).text("Rreth Revolution", 64, 72, { width: gjer });
    doc.font("Helvetica").fontSize(12).text(per, 64, 120, { width: gjer, lineGap: 5 });
    for (const pika of pakoja.pikat) {
      const s = copa(pika);
      doc.addPage();
      doc.font("Helvetica-Bold").fontSize(20).text(s.titulli.replace(/—/g, "-"), 64, 72, { width: gjer });
      doc.font("Helvetica").fontSize(13).text(s.teksti, 64, 130, { width: gjer, lineGap: 5 });
    }
    doc.addPage();
    doc.font("Helvetica-Bold").fontSize(20).text("Kontakti", 64, 72, { width: gjer });
    doc.font("Helvetica").fontSize(13).text("Për mbështetje teknike kontaktoni: Revolution Invest SH.P.K.", 64, 130, { width: gjer });
    doc.text("Email: info@revolution-pos.com", 64, 190, { width: gjer });
    doc.text("Faqja: https://revolution-pos.com", 64, 220, { width: gjer });
    doc.text("Telefoni: numri që merrni me instalimin e programit.", 64, 250, { width: gjer });
    doc.end();
  });
}

module.exports = { listo, gjenero, emriSkedarit, projektet };
