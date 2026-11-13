export const documents = [
  {
    id: "portal",
    title: "Jak používat portál zaměstnance",
    category: "Návody",
    updated: "2026-11-12",
    content:
      "Portál zaměstnance FHS UK\n\nNa úvodní stránce najdete přehled služeb. Dokumenty můžete hledat podle názvu a kategorie. V sekci Management jsou sdělení, ankety a schránka důvěry.\n\nDemonstrační verze používá výhradně ukázková data.",
  },
  {
    id: "onboarding",
    title: "První kroky na fakultě",
    category: "Pro nováčky",
    updated: "2026-11-12",
    content:
      "Ukázkový návod pro nováčky\n\nPřed nástupem kontaktujte personální oddělení. Přístupové údaje a oprávnění řešte s IT fakulty. Konkrétní schválené postupy doplní správce obsahu.",
  },
  {
    id: "requests",
    title: "Kontakty a vyřizování zaměstnaneckých dotazů",
    category: "Personalistika",
    updated: "2026-11-12",
    content:
      "Ukázkový dokument\n\nPro dotazy k pracovnímu vztahu kontaktujte personální oddělení. V této verzi můžete vyzkoušet odeslání podnětu, který se ukládá pouze do lokální databáze aplikace.",
  },
  {
    id: "access",
    title: "Přístupy do univerzitních systémů",
    category: "IT",
    updated: "2026-11-12",
    content:
      "Ukázkový návod k přístupům\n\nSkutečné přihlášení bude napojeno na CAS UK po registraci aplikace. V demonstrační verzi se žádná univerzitní hesla nezadávají.",
  },
];

export const contacts = [
  {
    id: 1,
    name: "Personální oddělení",
    department: "Děkanát",
    description: "Pracovní vztahy, nástup a osobní agenda",
    initials: "PO",
  },
  {
    id: 2,
    name: "IT podpora",
    department: "Provoz fakulty",
    description: "Přístupy, technická pomoc a provoz portálu",
    initials: "IT",
  },
  {
    id: 3,
    name: "Ekonomické oddělení",
    department: "Děkanát",
    description: "Ekonomická agenda a související dotazy",
    initials: "EO",
  },
  {
    id: 4,
    name: "Sekretariát děkana",
    department: "Vedení fakulty",
    description: "Organizační záležitosti a komunikace",
    initials: "SD",
  },
];

export const integrations = [
  {
    id: "cas",
    name: "CAS UK",
    purpose: "Jednotné přihlášení přes OIDC",
    status: "Čeká na registraci",
    detail:
      "Je potřeba issuer / discovery URL, registrace klienta, návratové adresy a dohoda o identifikátoru osoby.",
  },
  {
    id: "whois",
    name: "WhoIS",
    purpose: "Zaměstnanci, kontakty a pracoviště",
    status: "Čeká na rozhraní",
    detail:
      "Rozsah polí, oprávnění, stabilní identifikátory a způsob aktualizace potvrdí správce UK. Způsob přístupu k výplatním páskám je otevřený.",
  },
  {
    id: "egje",
    name: "EGJE / UIS",
    purpose: "Docházka a personální údaje",
    status: "Čeká na rozhraní",
    detail:
      "Dostupnost docházky, zůstatků a dalších osobních údajů musí potvrdit UK.",
  },
  {
    id: "meals",
    name: "Jídelní portál",
    purpose: "Jídelníček a objednávání",
    status: "Čeká na rozhraní",
    detail:
      "Je potřeba adresa služby, dokumentace rozhraní a způsob přihlášení.",
  },
];
