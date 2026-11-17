const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "manuals");
const logo = path.join(root, "src", "assets", "revolution-marka.png");
const font = "C:\\Windows\\Fonts\\arial.ttf";
const fontBold = "C:\\Windows\\Fonts\\arialbd.ttf";

const per = "Revolution Invest SH.P.K. është firmë e specializuar në teknologjinë e fundit për menaxhimin e bizneseve në Kosovë. Me përvojë të gjatë dhe ekip profesional, ne krijojmë zgjidhje softuerike që përshtaten sipas nevojave të çdo biznesi. Produktet tona instalohen drejtpërdrejt në pajisjen tuaj me setup.exe, të dhënat ruhen lokalisht në kompjuterin tuaj, dhe si siguri shtesë ruhen edhe në databazën tonë cloud. Programet funksionojnë edhe pa internet — kur kthehet interneti, sinkronizohen automatikisht. Jemi të certifikuar nga ATK (Administrata Tatimore e Kosovës) dhe ofrojmë mbështetje teknike të vazhdueshme.";

const T = {
  Arka: "Këtu bëhet shitja. Zgjidhni artikullin, merrni pagesën dhe printoni kuponin për klientin.",
  Kasa: "Këtu bëhet shitja e ditës. Zgjidhni artikullin, merrni pagesën dhe printoni kuponin.",
  Pasqyra: "Këtu shihni si ka ecur dita. Dalin shitjet, paratë dhe gjërat që kërkojnë vëmendje.",
  "Kuponët": "Këtu shihni kuponët e shitjes. Mund ta hapni një kupon dhe ta printoni përsëri kur ju duhet.",
  "Kuponët / Shitjet": "Këtu shihni kuponët e shitjes. Mund ta hapni një kupon dhe ta shikoni çfarë është shitur.",
  "Blloku i letrës": "Këtu ndaloni printimin kur letra ngec ose mbaron. Kuponi ruhet dhe printohet kur letra kthehet.",
  "Bllokimi i letrës": "Këtu ndaloni printimin kur letra ngec ose mbaron. Kuponi ruhet dhe printohet kur letra kthehet.",
  "Bllok letrë": "Këtu ndaloni printimin kur letra ngec ose mbaron. Kuponi ruhet dhe printohet kur letra kthehet.",
  Produktet: "Këtu mbani listën e artikujve. Shtoni emrin, çmimin dhe barkodin e secilit.",
  "Importo Produkte": "Këtu futni shumë artikuj njëherësh nga një listë. Emrat dhe çmimet hyjnë pa i shkruar një nga një.",
  Importo: "Këtu futni shumë artikuj njëherësh nga një listë. Emrat dhe çmimet hyjnë pa i shkruar një nga një.",
  Stoku: "Këtu shihni sa copë keni në dyqan. Kur hyn mall i ri, sasia rritet.",
  Blerjet: "Këtu shënoni mallin që blini nga furnitori. Sasia hyn në stok dhe fatura mbetet e ruajtur.",
  Furnitorët: "Këtu mbani emrat e furnitorëve. Kur bëni një blerje, e lidhni me furnitorin e duhur.",
  Punonjësit: "Këtu shtoni njerëzit që punojnë. Secili hyn me emrin e vet dhe sheh vetëm punën e tij.",
  Faturat: "Këtu shihni faturat e shitjes për biznese. Mund ta hapni një faturë dhe ta printoni.",
  B2B: "Këtu shisni te biznese të tjera. Shkruani klientin, artikujt dhe nxirrni faturën.",
  Promocione: "Këtu vendosni zbritjet. Artikulli shitet me çmimin e ri derisa oferta të mbarojë.",
  "Gift Card": "Këtu bëni kartat dhuratë. Klienti paguan tani dhe e përdor vlerën më vonë.",
  Ditari: "Këtu shihni çfarë është bërë gjatë ditës. Dalin shitjet, pagesat dhe mbyllja e ndërrimit.",
  Raportet: "Këtu shihni sa është shitur në një periudhë. Zgjidhni ditën ose javën dhe lexoni totalet.",
  "Raporte të avancuara": "Këtu shihni shitjen më në detaje. Krahasoni ditët dhe shihni cilët artikuj shiten më shumë.",
  Printeri: "Këtu zgjidhni printerin e kuponit. Provoni një printim para se të fillojë puna.",
  "Fiskale & printer": "Këtu lidhni printerin e kuponit. Provoni një printim para se të fillojë puna.",
  "Printer & TVSh": "Këtu lidhni printerin dhe shkruani TVSH-në. Kuponi del me të dhënat e dyqanit.",
  "Lokal & biznesi": "Këtu shkruani emrin e dyqanit, adresën dhe numrin fiskal. Këto dalin në kupon.",
  Licenca: "Këtu shihni nëse programi është i hapur për biznesin tuaj. Pa licencë të vlefshme puna ndalet.",
  "QR Kodet": "Këtu bëni kodet që skanohen me telefon. Klienti ose punonjësi i hap me kamerën.",
  Fiskalizimi: "Këtu lidhni programin me fiskalizimin. Kuponi merr numrin që kërkon ATK.",
  Audit: "Këtu shihni kush ka ndryshuar diçka. Mbetet shënimi i veprimeve të rëndësishme.",
  Kontabilisti: "Këtu përgatiten të dhënat për kontabilistin. Shitjet dhe blerjet mblidhen në një vend.",
  AI: "Këtu pyetni programin me fjalë të thjeshta. Ju përgjigjet për shitjet dhe stokun.",
  Cilësimet: "Këtu rregulloni si punon programi. Emri i biznesit dhe zgjedhjet e përditshme qëndrojnë këtu.",
  "Cilësimet SEF": "Këtu rregulloni lidhjen fiskale. Të dhënat e biznesit dhe të printerit qëndrojnë këtu.",
  "Faqja publike": "Këtu përgatitet faqja që e sheh klienti. Vendosni çfarë dëshironi të shfaqet.",
  "Cloud & linke": "Këtu shihni lidhjen e telefonit dhe ruajtjen shtesë. Kur kthehet interneti, të dhënat bashkohen.",
  Cloud: "Këtu shihni ruajtjen shtesë. Kur kthehet interneti, të dhënat bashkohen.",
  Njoftimet: "Këtu shihni lajmërimet. Programi ju tregon gjërat që kërkojnë vëmendje.",
  "Njoftime Urgjente": "Këtu shihni lajmërimet që kërkojnë përgjigje shpejt. Hapeni dhe shihni çfarë duhet bërë.",
  Kontrollet: "Këtu kontrolloni nëse shitja, stoku dhe kuponi përputhen. Gabimet dalin para se të mbyllni ditën.",
  Menaxherët: "Këtu shtoni menaxherët. Ata hyjnë dhe shohin punën e dyqanit sipas lejes që u jepni.",
  Detyra: "Këtu lini detyra për stafin. Secili sheh çfarë i është kërkuar të bëjë.",
  Inventarizimi: "Këtu numëroni mallin në raft. Programi e krahason me sasinë që ka shënuar.",
  Klientët: "Këtu mbani emrat e klientëve. Kur shesni, e lidhni kuponin me klientin.",
  "Raporti X": "Këtu shihni totalet pa e mbyllur ditën. Arka mbetet e hapur.",
  "Raporti Z": "Këtu mbyllni ditën fiskale. Totalet ruhen dhe fillon dita tjetër.",
  Periodik: "Këtu shihni totalet për disa ditë së bashku. Zgjidhni nga data deri te data.",
  Rivendos: "Këtu ktheni një zgjedhje te gjendja e mëparshme. Përdoreni vetëm kur diçka është shkruar gabim.",
  Skadime: "Këtu shihni barnat që po u afron data. I hiqni nga rafti para se të skadojnë.",
};

function nga(emrat, vec = {}) {
  return emrat.map((titulli) => {
    const teksti = vec[titulli] || T[titulli];
    if (!teksti) throw new Error("Mungon teksti: " + titulli);
    return { titulli, teksti };
  });
}

const dyqan = [
  "Arka",
  "Pasqyra",
  "Kuponët",
  "Blloku i letrës",
  "Produktet",
  "Importo Produkte",
  "Stoku",
  "Blerjet",
  "Furnitorët",
  "Punonjësit",
  "Faturat",
  "B2B",
  "Promocione",
  "Gift Card",
  "Ditari",
  "Raportet",
  "Raporte të avancuara",
  "Printeri",
  "Lokal & biznesi",
  "Licenca",
  "QR Kodet",
  "Fiskalizimi",
  "Audit",
  "Kontabilisti",
  "AI",
];

const butik = [
  "Pasqyra",
  "Produktet",
  "Stoku",
  "Blerjet",
  "Furnitorët",
  "Importo Produkte",
  "Promocione",
  "Gift Card",
  "Punonjësit",
  "Ditari",
  "Raportet",
  "Raporte të avancuara",
  "Faturat",
  "B2B",
  "Printeri",
  "Kuponët",
  "Blloku i letrës",
  "Audit",
  "QR Kodet",
  "AI",
  "Kontabilisti",
  "Licenca",
  "Lokal & biznesi",
  "Fiskalizimi",
  "Arka",
];

const manualet = [
  {
    slug: "kafene",
    emri: "KAFENE",
    seksionet: [
      { titulli: "Kamarieri", teksti: "Këtu kamarieri sheh tavolinat dhe shënon porosinë. Kur tavolina mbyllet, del kuponi i pagesës." },
      { titulli: "Ditari", teksti: "Këtu shihni porositë e ditës. Mbetet shënimi i asaj që është shitur dhe mbyllur." },
      { titulli: "Menuja", teksti: "Këtu mbani pijet dhe ushqimet. Shtoni emrin dhe çmimin që i sheh kamarieri." },
      { titulli: "Tavolinat", teksti: "Këtu vendosni tavolinat e lokalit. Kamarieri i përdor kur merr porosinë." },
      { titulli: "Raportet", teksti: "Këtu shihni sa është shitur. Zgjidhni ditën dhe lexoni totalet." },
      { titulli: "Stafi", teksti: "Këtu shtoni kamarierët dhe njerëzit e lokalit. Secili hyn me emrin e vet." },
      { titulli: "Licenca", teksti: "Këtu shihni nëse programi është i hapur për lokalin tuaj. Pa licencë të vlefshme puna ndalet." },
      { titulli: "Cilësimet", teksti: "Këtu shkruani emrin e lokalit dhe zgjedhjet e punës. Këto dalin edhe në kupon." },
    ],
  },
  {
    slug: "hotel",
    emri: "HOTEL",
    seksionet: [
      { titulli: "Recepsioni", teksti: "Këtu punon recepsioni. Sheh dhomat, pret mysafirin dhe e regjistron qëndrimin." },
      { titulli: "Kasa e recepsionit", teksti: "Këtu mbyllet pagesa e mysafirit. Del kuponi për shumën që është marrë." },
      { titulli: "Tavolinat Live", teksti: "Këtu shihni tavolinat e restorantit të hotelit. Porosia duket sapo shënohet." },
      { titulli: "Dhomat", teksti: "Këtu mbani dhomat. Shihni cila është e lirë, e zënë ose duhet pastruar." },
      { titulli: "Mysafirët", teksti: "Këtu shkruani emrin e mysafirit dhe qëndrimin. Të dhënat mbeten për herën tjetër." },
      { titulli: "Faqja publike", teksti: "Këtu përgatitet faqja që e sheh mysafiri. Vendosni çfarë dëshironi të shfaqet." },
      { titulli: "Llogaria", teksti: "Këtu shihni llogarinë e mysafirit. Dalin shpenzimet para se të mbyllet pagesa." },
      { titulli: "Porositë", teksti: "Këtu shihni porositë e restorantit. Mbetet çfarë është kërkuar dhe sa kushton." },
      { titulli: "Stoku", teksti: "Këtu shihni sa keni nga mallrat e hotelit. Kur hyn mall i ri, sasia rritet." },
      { titulli: "AI", teksti: "Kjo skedë del kur është e ndezur. Pyetni me fjalë të thjeshta dhe merrni një përgjigje për punën." },
      { titulli: "Raporte AI", teksti: "Kjo skedë del kur është e ndezur. Ju tregon një përmbledhje të shkurtër të punës." },
      { titulli: "Asistent AI", teksti: "Kjo skedë del kur është e ndezur. Ju ndihmon të gjeni një të dhënë pa kërkuar skedë pas skede." },
      { titulli: "Njoftimet", teksti: "Kjo skedë del kur është e ndezur. Këtu shihni lajmërimet që kërkojnë vëmendje." },
      { titulli: "Raportet", teksti: "Këtu shihni qëndrimet dhe shitjet. Zgjidhni periudhën dhe lexoni totalet." },
      { titulli: "Linqet e lokalit", teksti: "Këtu merrni lidhjet e punës për recepsionin dhe stafin. Secili hap faqen e vet." },
    ],
  },
  {
    slug: "market",
    emri: "MARKET",
    seksionet: nga(
      [
        "Pasqyra",
        "Kuponët / Shitjet",
        "Bllokimi i letrës",
        "Produktet",
        "Importo Produkte",
        "Stoku",
        "Blerjet",
        "Punonjësit",
        "Njoftimet",
        "Kontrollet",
        "Menaxherët",
        "Detyra",
        "Inventarizimi",
        "Furnitorët",
        "B2B",
        "Promocione",
        "Klientët",
        "Gift Card",
        "Ditari",
        "Raportet",
        "Raporte të avancuara",
        "Cilësimet",
        "Fiskale & printer",
        "Lokal & biznesi",
        "Licenca",
        "Cloud",
        "QR Kodet",
        "Faqja publike",
        "Fiskalizimi",
        "Audit",
        "Kontabilisti",
        "AI",
        "Kasa",
      ],
      {
        Kasa: "Këtu punon arka e marketit. Skanoni barkodin, merrni pagesën dhe printoni kuponin.",
      },
    ),
  },
  {
    slug: "furra",
    emri: "FURRA",
    seksionet: nga(
      [
        "Kasa",
        "Pasqyra",
        "Produktet",
        "Importo",
        "Stoku",
        "Punonjësit",
        "QR Kodet",
        "Raportet",
        "Ditari",
        "Raporte të avancuara",
        "Audit",
        "Bllokimi i letrës",
        "Fiskalizimi",
        "Lokal & biznesi",
        "Printer & TVSh",
        "Cloud & linke",
        "Faqja publike",
        "Licenca",
        "Blerjet",
        "Furnitorët",
        "AI",
        "Kontabilisti",
      ],
      {
        Kasa: "Këtu shitet buka dhe ëmbëlsirat. Punonjësi hyn me kodin, zgjedh artikullin dhe printon kuponin.",
        Produktet: "Këtu mbani bukën dhe ëmbëlsirat. Shkruani emrin dhe çmimin e secilës.",
        AI: "Kjo skedë del kur është e ndezur. Pyetni me fjalë të thjeshta për shitjen dhe stokun.",
      },
    ),
  },
  { slug: "dyqane", emri: "DYQANE", seksionet: nga(dyqan) },
  {
    slug: "butika",
    emri: "BUTIKA",
    seksionet: nga(butik, {
      Produktet: "Këtu mbani rrobat dhe artikujt. Shkruani emrin, çmimin, masën dhe ngjyrën.",
      Arka: "Këtu bëhet shitja në butik. Zgjidhni artikullin, merrni pagesën dhe printoni kuponin.",
    }),
  },
  { slug: "distributor", emri: "DISTRIBUTOR", mungon: true },
  {
    slug: "argjendari",
    emri: "ARGJENDARI",
    seksionet: nga(butik, {
      Produktet: "Këtu mbani stolitë. Shkruani emrin, çmimin dhe peshën kur artikulli shitet me gram.",
      Arka: "Këtu bëhet shitja e stolisë. Zgjidhni artikullin, merrni pagesën dhe printoni kuponin.",
    }),
  },
  {
    slug: "barnatore",
    emri: "BARNATORE",
    seksionet: nga(
      [
        "Arka",
        "Pasqyra",
        "Produktet",
        "Stoku",
        "Skadime",
        "Blerjet",
        "Furnitorët",
        "Importo Produkte",
        "Promocione",
        "Punonjësit",
        "Ditari",
        "Raportet",
        "Raporte të avancuara",
        "Faturat",
        "B2B",
        "Printeri",
        "Kuponët",
        "Blloku i letrës",
        "Audit",
        "QR Kodet",
        "AI",
        "Kontabilisti",
        "Licenca",
        "Lokal & biznesi",
        "Fiskalizimi",
        "Gift Card",
      ],
      {
        Produktet: "Këtu mbani barnat. Shkruani emrin, çmimin dhe datën kur skadon.",
        Arka: "Këtu bëhet shitja e barnatores. Zgjidhni barin, merrni pagesën dhe printoni kuponin.",
      },
    ),
  },
  {
    slug: "fiskalizim",
    emri: "FISKALIZIM",
    seksionet: nga([
      "Arka",
      "Produktet",
      "Kuponët",
      "Ditari",
      "Raporti X",
      "Raporti Z",
      "Periodik",
      "Audit",
      "Printeri",
      "Punonjësit",
      "Blloku i letrës",
      "Licenca",
      "Lokal & biznesi",
      "Rivendos",
      "Cilësimet SEF",
    ]),
  },
  {
    slug: "kontabilisti",
    emri: "KONTABILISTI",
    seksionet: [
      { titulli: "Pasqyra", teksti: "Këtu shihni punën e ditës. Dalin shitjet, blerjet dhe gjërat që presin." },
      { titulli: "Shitjet", teksti: "Këtu shënoni shitjet. Secila mbetet me datën, klientin dhe shumën." },
      { titulli: "Klientët B2B", teksti: "Këtu mbani bizneset që u shisni. Emri dhe të dhënat dalin në faturë." },
      { titulli: "Blerjet", teksti: "Këtu shënoni blerjet. Fatura e furnitorit mbetet e ruajtur." },
      { titulli: "Ditari", teksti: "Këtu shihni lëvizjet e ditës. Shitjet dhe blerjet qëndrojnë me radhë." },
      { titulli: "Raportet", teksti: "Këtu shihni totalet për periudhën që zgjidhni. Dalin shitjet dhe blerjet." },
      { titulli: "Kontabilisti", teksti: "Këtu mblidhen librat e punës. Shitjet dhe blerjet qëndrojnë gati për kontabilistin." },
      { titulli: "Njoftime Urgjente", teksti: "Këtu shihni lajmërimet që kërkojnë përgjigje shpejt. Hapeni dhe shihni çfarë duhet bërë." },
      { titulli: "Dërgo në ATK", teksti: "Këtu përgatitet dërgimi te Administrata Tatimore. Kontrolloni të dhënat para se t’i dërgoni." },
      { titulli: "AI", teksti: "Këtu pyetni me fjalë të thjeshta. Ju ndihmon të gjeni një shumë ose një faturë." },
      { titulli: "Licenca", teksti: "Këtu shihni nëse programi është i hapur për zyrën tuaj. Pa licencë të vlefshme puna ndalet." },
      { titulli: "Cilësimet", teksti: "Këtu shkruani emrin e zyrës dhe zgjedhjet e punës. Këto dalin në dokumentet që printoni." },
    ],
  },
  {
    slug: "security",
    emri: "SECURITY",
    seksionet: nga(
      [
        "Pasqyra",
        "Punonjësit",
        "Lokacionet",
        "GPS",
        "Evidenca",
        "Produktet",
        "Pajisjet",
        "Blerjet",
        "Furnitorët",
        "Faturat",
        "QR Kodet",
        "Barkodet",
        "Raportet",
        "Raporte të avancuara",
        "Ditari",
        "AI",
        "Arka",
        "Kuponët",
        "Audit",
        "Bllok letrë",
        "Fiskalizimi",
        "Licenca",
        "Cilësimet",
        "Kontabilisti",
      ],
      {
        Punonjësit: "Këtu mbani rojet dhe stafin. Secili hyn me emrin e vet dhe sheh punën e tij.",
        Lokacionet: "Këtu shkruani vendet ku ruhet objekti. Rojtari e sheh cili vend i takon.",
        GPS: "Këtu shihni ku ndodhet rojtari gjatë punës. Vendi duket në hartë.",
        Evidenca: "Këtu mbetet kush ka ardhur dhe kush ka dalë. Ora e hyrjes dhe e daljes ruhet.",
        Pajisjet: "Këtu mbani pajisjet e rojes. Shihni çfarë i është dhënë secilit.",
        Barkodet: "Këtu bëni barkodet e pikave të kontrollit. Rojtari i skanon kur kalon.",
        Arka: "Këtu bëhet shitja kur ka arkë. Merrni pagesën dhe printoni kuponin.",
      },
    ),
  },
  { slug: "mjekesia", emri: "MJEKËSIA", mungon: true },
  { slug: "posta-taxi", emri: "POSTA/TAXI", mungon: true },
  { slug: "rentacar", emri: "RENTACAR", mungon: true },
];

function shkruaj(manual) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 64, compress: false });
    const dalja = fs.createWriteStream(path.join(outDir, `manual-${manual.slug}.pdf`));
    doc.pipe(dalja);
    doc.registerFont("T", font);
    doc.registerFont("B", fontBold);
    const gjer = doc.page.width - 128;

    doc.image(logo, (doc.page.width - 150) / 2, 170, { width: 150 });
    doc.font("B").fontSize(22).fillColor("#111111").text(`Revolution ${manual.emri} — Udhëzues Përdorimi`, 64, 390, {
      width: gjer,
      align: "center",
    });
    doc.font("T").fontSize(12).text("© Revolution Invest SH.P.K. — Ferizaj, Kosovë", 64, 740, {
      width: gjer,
      align: "center",
    });

    doc.addPage();
    doc.font("B").fontSize(20).text("Rreth Revolution", 64, 72, { width: gjer });
    doc.font("T").fontSize(12).text(per, 64, 120, { width: gjer, align: "left", lineGap: 5 });

    const seksionet = manual.mungon
      ? [
          {
            titulli: "Skedat",
            teksti:
              "Ky program nuk u gjet si dosje në kompjuterin ku u përgatit udhëzuesi. Skedat nuk janë shkruar këtu, sepse nuk janë lexuar nga programi.",
          },
        ]
      : manual.seksionet;

    for (const s of seksionet) {
      doc.addPage();
      doc.font("B").fontSize(20).text(s.titulli, 64, 72, { width: gjer });
      doc.font("T").fontSize(13).text(s.teksti, 64, 130, { width: gjer, lineGap: 5 });
    }

    doc.addPage();
    doc.font("B").fontSize(20).text("Kontakti", 64, 72, { width: gjer });
    doc.font("T").fontSize(13).text("Për mbështetje teknike kontaktoni: Revolution Invest SH.P.K.", 64, 130, { width: gjer });
    doc.text("Email: info@revolution-pos.com", 64, 190, { width: gjer });
    doc.text("Faqja: https://revolution-pos.com", 64, 220, { width: gjer });
    doc.text("Telefoni: numri që merrni me instalimin e programit.", 64, 250, { width: gjer });

    doc.end();
    dalja.on("finish", () => resolve(seksionet.length));
    dalja.on("error", reject);
  });
}

fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (const manual of manualet) {
    const n = await shkruaj(manual);
    console.log(manual.slug, n);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
