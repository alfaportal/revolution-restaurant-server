export type LlojLigjor = "privatesia" | "kushtet" | "cookies";

const email = "revolutioninvest05@gmail.com";

export const ligjore: Record<LlojLigjor, Record<"sq" | "en", { titulli: string; data: string; html: string }>> = {
  privatesia: {
    sq: {
      titulli: "Politika e privatësisë",
      data: "Përditësuar: qershor 2026",
      html: `
        <p>Kjo politikë shpjegon si <strong>Revolution Invest POS</strong> mbledh, përdor dhe mbron të dhënat kur bizneset përdorin platformën.</p>
        <h2>1. Kush jemi ne</h2>
        <p>Shërbimin e ofron Revolution Invest SH.P.K., Ferizaj, Kosovë. Për pyetje: <a href="mailto:${email}">${email}</a>.</p>
        <h2>2. Cilat të dhëna mbledhim</h2>
        <ul>
          <li><strong>Të dhëna biznesi:</strong> emri, adresa, telefoni, email, NUI kur kërkohet, logo.</li>
          <li><strong>Llogari:</strong> emri, email, telefoni, roli dhe hyrjet në sistem.</li>
          <li><strong>Teknike:</strong> pajisja, shfletuesi dhe adresa IP, për siguri.</li>
          <li><strong>Kontakt:</strong> mesazhet që na dërgoni nga forma e kontaktit.</li>
        </ul>
        <h2>3. Si i përdorim</h2>
        <ul>
          <li>Për të mbajtur programin, licencën dhe mbështetjen.</li>
          <li>Për detyrimet ligjore, përfshirë evidencën fiskale kur përdoret moduli i ATK-së.</li>
        </ul>
        <p>Nuk i shesim të dhënat për marketing të palëve të treta.</p>
        <h2>4. Ruajtja dhe ndarja</h2>
        <p>Të dhënat kalojnë me HTTPS. Aksesi është i kufizuar. I ndajmë vetëm me shërbimet që ju zgjidhni, me strehimin e nevojshëm, ose kur e kërkon ligji.</p>
        <h2>5. Afati</h2>
        <p>Ruhen sa kohë që llogaria është aktive. Pas mbylljes fshihen ose anonimizohen brenda një afati të arsyeshëm, përveç kur ligji kërkon ruajtje më të gjatë.</p>
        <h2>6. Të drejtat tuaja</h2>
        <p>Mund të kërkoni kopje, ndreqje ose fshirje. Shkruani te <a href="mailto:${email}">${email}</a>. Përgjigjemi brenda 30 ditëve.</p>
        <h2>7. Cookies</h2>
        <p>Përdoren vetëm cookies të nevojshme për hyrjen, gjuhën dhe sesionin. Nuk ka cookies reklamash dhe nuk ka analitikë të palëve të treta. Më shumë te <a href="/cookies">Politika e cookies</a>.</p>
      `,
    },
    en: {
      titulli: "Privacy policy",
      data: "Updated: June 2026",
      html: `
        <p>This policy explains how <strong>Revolution Invest POS</strong> collects, uses and protects data when businesses use the platform.</p>
        <h2>1. Who we are</h2>
        <p>The service is provided by Revolution Invest SH.P.K., Ferizaj, Kosovo. Questions: <a href="mailto:${email}">${email}</a>.</p>
        <h2>2. What we collect</h2>
        <ul>
          <li><strong>Business data:</strong> name, address, phone, email, tax number when required, logo.</li>
          <li><strong>Accounts:</strong> name, email, phone, role and sign-ins.</li>
          <li><strong>Technical:</strong> device, browser and IP address, for security.</li>
          <li><strong>Contact:</strong> messages sent from the contact form.</li>
        </ul>
        <h2>3. How we use it</h2>
        <ul>
          <li>To run the program, the licence and support.</li>
          <li>For legal duties, including fiscal records when the tax module is used.</li>
        </ul>
        <p>We do not sell data for third-party marketing.</p>
        <h2>4. Storage and sharing</h2>
        <p>Data moves over HTTPS. Access is limited. We share it only with services you choose, with the hosting we need, or when the law requires it.</p>
        <h2>5. How long</h2>
        <p>Data stays while the account is active. After closure it is deleted or anonymised within a reasonable time, unless the law requires longer storage.</p>
        <h2>6. Your rights</h2>
        <p>You can ask for a copy, a correction or deletion. Write to <a href="mailto:${email}">${email}</a>. We reply within 30 days.</p>
        <h2>7. Cookies</h2>
        <p>Only cookies needed for sign-in, language and the session are used. There are no advertising cookies and no third-party analytics. More on the <a href="/cookies">cookie policy</a>.</p>
      `,
    },
  },
  kushtet: {
    sq: {
      titulli: "Kushtet e përdorimit",
      data: "Përditësuar: qershor 2026",
      html: `
        <p>Duke përdorur <strong>Revolution POS</strong>, pranoni këto kushte.</p>
        <h2>1. Çfarë ofrohet</h2>
        <p>Programi për arkën, kuponin fiskal dhe raportet. Çka përfshihet varet nga pakoja që zgjidhni te çmimet.</p>
        <h2>2. Llogaria juaj</h2>
        <ul>
          <li>Ju përgjigjeni për saktësinë e të dhënave të biznesit.</li>
          <li>Fjalëkalimet dhe hyrja e stafit janë në kujdesin tuaj.</li>
          <li>Nuk lejohet përdorimi për punë të paligjshme.</li>
        </ul>
        <h2>3. Prova dhe pagesa</h2>
        <p>Prova falas është 7 ditë, siç shkruan te çmimet. Pas saj shërbimi vazhdon me pagesë. Pagesa e vonuar mund ta ndalë hyrjen derisa të sqarohet.</p>
        <h2>4. Licenca</h2>
        <p>Programi mbetet i Revolution Invest SH.P.K. Ju merrni të drejtë përdorimi për biznesin tuaj, për kohën që është paguar. Nuk kopjohet, nuk shitet dhe nuk ndahet te një vend tjetër pa marrëveshje.</p>
        <h2>5. Mbyllja</h2>
        <p>Mund ta ndalni duke na shkruar. Hyrja mbaron në fund të kohës së paguar. Raportet mund të merren brenda një afati të arsyeshëm.</p>
        <h2>6. Përgjegjësia</h2>
        <p>Ju mbani përgjegjësinë për saktësinë e kuponëve dhe të raporteve që nxirrni. Të dhënat rregullohen nga <a href="/privatesia">Politika e privatësisë</a>.</p>
        <h2>7. Ligji</h2>
        <p>Vlejnë ligjet e Republikës së Kosovës. Kontakt: <a href="mailto:${email}">${email}</a>.</p>
      `,
    },
    en: {
      titulli: "Terms of use",
      data: "Updated: June 2026",
      html: `
        <p>By using <strong>Revolution POS</strong>, you accept these terms.</p>
        <h2>1. What is offered</h2>
        <p>The program for the till, the fiscal receipt and the reports. What is included depends on the package you choose on the pricing page.</p>
        <h2>2. Your account</h2>
        <ul>
          <li>You are responsible for the accuracy of the business data.</li>
          <li>Passwords and staff access are your responsibility.</li>
          <li>Use for unlawful work is not allowed.</li>
        </ul>
        <h2>3. Trial and payment</h2>
        <p>The free trial is 7 days, as written on the pricing page. After that the service continues with payment. A late payment can stop access until it is settled.</p>
        <h2>4. Licence</h2>
        <p>The program remains the property of Revolution Invest SH.P.K. You receive a right to use it for your business, for the time that is paid. It is not copied, sold, or shared to another site without an agreement.</p>
        <h2>5. Closing</h2>
        <p>You can stop by writing to us. Access ends at the end of the paid time. Reports can be taken within a reasonable period.</p>
        <h2>6. Responsibility</h2>
        <p>You remain responsible for the accuracy of the receipts and reports you issue. Data is covered by the <a href="/privatesia">privacy policy</a>.</p>
        <h2>7. Law</h2>
        <p>The laws of the Republic of Kosovo apply. Contact: <a href="mailto:${email}">${email}</a>.</p>
      `,
    },
  },
  cookies: {
    sq: {
      titulli: "Politika e cookies",
      data: "Përditësuar: qershor 2026",
      html: `
        <p>Faqja ruan vetëm atë që duhet që të punojë.</p>
        <h2>Çka ruhet</h2>
        <ul>
          <li>Gjuha që zgjidhni, që të hapet e njëjta herën tjetër.</li>
          <li>Hyrja në llogari dhe sesioni, te paneli, që të qëndroni brenda.</li>
        </ul>
        <h2>Çka nuk përdoret</h2>
        <p>Nuk ka cookies reklamash. Nuk ka analitikë të palëve të treta në këtë faqe.</p>
        <p>Pyetje: <a href="mailto:${email}">${email}</a>. Më shumë te <a href="/privatesia">Politika e privatësisë</a>.</p>
      `,
    },
    en: {
      titulli: "Cookie policy",
      data: "Updated: June 2026",
      html: `
        <p>The site stores only what it needs in order to work.</p>
        <h2>What is stored</h2>
        <ul>
          <li>The language you choose, so the same one opens next time.</li>
          <li>Sign-in and the session, on the panel, so you stay signed in.</li>
        </ul>
        <h2>What is not used</h2>
        <p>There are no advertising cookies. There is no third-party analytics on this site.</p>
        <p>Questions: <a href="mailto:${email}">${email}</a>. More in the <a href="/privatesia">privacy policy</a>.</p>
      `,
    },
  },
};
