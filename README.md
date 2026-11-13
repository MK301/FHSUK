# FHS UK – portál zaměstnance

První místní verze webové aplikace. React + TypeScript, Node.js 24+, Express 5 a SQLite. Vizuální podoba vychází z dodaného loga a bílé/červené identity UK. Rozhraní se přizpůsobuje počítači i telefonu.

## Spuštění

Nainstalujte Node.js 24 nebo novější podporovanou LTS verzi. Ve složce projektu spusťte:

```sh
npm install
npm run dev
```

Otevřete http://localhost:4173. Výchozí režim nabízí ukázkového zaměstnance a správce. Přístupové heslo se nezadává. V prostředí bez npm lze použít `pnpm install` a `pnpm dev`.

Pro ověření a sestavení:

```sh
npm test
npm run build
npm start
```

`npm start` obsluhuje sestavený frontend ze složky dist, pokud existuje. Příkaz `npm run dev` používá vývojový server Vite i po vytvoření sestavení.

## Co je funkční

- Dva demonstrační profily, relace v HttpOnly cookie, CSRF kontrola a ověření rolí na serveru.
- Sdělení, cílení na dvě ukázkové skupiny, naplánované zveřejnění, reakce a výslovné potvrzení seznámení.
- Anketa s ochranou před opakovaným hlasováním a souhrnnými výsledky. Hlas je spojený s účtem, anonymní hlasování zatím není implementováno.
- Knihovna ukázkových textových dokumentů se stažením přes přihlášené API.
- Přihlášení na ukázkové akce, kontrola kapacity a zrušení účasti.
- Podání personálního dotazu, návrhu nebo požadavku na podporu a vlastní historie.
- Schránka důvěry s přístupem správce. U zprávy není uložen identifikátor autora, infrastruktura a přihlašovací relace však mohou umožňovat korelaci. Nejde o ověřený anonymní oznamovací systém.
- Vyhledávání ve službách, dokumentech, sděleních a kontaktech.
- Přehled všech 12 domluvených služeb, moduly Management, HR a IT, průvodce a administrační přehled.

## Data a konfigurace

Data se uchovávají v `data/fhs.sqlite`, která není součástí Gitu. Ukázkový obsah se vloží jen do prázdné databáze. Pro zálohu použijte konzistentní SQLite backup nebo aplikaci nejprve zastavte. Běžící databáze používá režim WAL.

Proměnné prostředí:

| Název     | Výchozí hodnota    | Účel                                    |
| --------- | ------------------ | --------------------------------------- |
| PORT      | 4173               | Port HTTP serveru                       |
| HOST      | 127.0.0.1          | Místní adresa serveru                   |
| DB_PATH   | data/fhs.sqlite    | Soubor SQLite                           |
| DEMO_MODE | true mimo produkci | Zapnutí demonstračního přihlášení       |
| FHS_DEV   | false              | Vynucení vývojového frontendu           |
| NODE_ENV  | development        | Pro produkční režim nastavte production |

Produkční režim blokuje demonstrační přihlášení. Vlastní CAS přihlášení v této verzi není implementováno, takže tato verze zatím slouží k místní demonstraci. Konfigurační proměnné lze předat prostředím shellu nebo pomocí `node --env-file=.env server/index.js`. Soubor `.env` se nesmí verzovat.

## Co čeká na navazující etapu

CAS UK/OIDC potřebuje registraci aplikace, discovery/issuer, návratové adresy a dohodnuté atributy. WhoIS, EGJE/UIS a jídelní portál potřebují dokumentaci API/exportů, oprávnění, identifikátory a testovací data. Datové konektory se nyní nevolají. Parkování, reálné benefity, pracovní nabídky a časopis čekají na obsah a rozhodnutí fakulty.

Anglické rozhraní, nahrávání příloh, správa dokumentů a anket, plný anonymní režim, doručování e-mailů/push, skutečná organizační struktura, detailní analytika a editace všeho obsahu jsou další práce. Demonstrační podněty se neposílají fakultě. Používejte pouze smyšlená data.

Před produkčním nasazením je nutné doplnit skutečnou autentizaci, lifecycle uživatelských účtů, podrobnou matici oprávnění, schválené zacházení s daty, obnovu ze záloh a provozní monitoring. SQLite slouží pro první lokální verzi, pro sdílený provoz se počítá s přechodem na PostgreSQL. Aplikace neobsahuje AI funkce.

Veřejný dočasný náhled nastavíte proměnnou FHS_PUBLIC_ORIGIN na přesnou HTTPS adresu tunelu bez koncového lomítka. Na této adrese je dostupný pouze zaměstnanecký pohled pro čtení. Místní adresa localhost zachovává správu. Po změně adresy tunelu upravte proměnnou a restartujte server. Ukázka vyžaduje sestavený frontend.

## Veřejná ukázka na GitHub Pages

Repozitář MK301/FHSUK používá v Settings → Pages zdroj GitHub Actions. Workflow `.github/workflows/pages.yml` po změně větve main otestuje aplikaci, sestaví veřejné demo a zveřejní jej na https://mk301.github.io/FHSUK/.

`pnpm build:pages` vytváří samostatnou složku `dist-pages`; `pnpm preview:pages` ji otevře na http://127.0.0.1:4174/FHSUK/. Původní `pnpm build` a Express server zůstávají pro plnou místní verzi.

Veřejná ukázka je pouze pro prohlížení. Neobsahuje skutečné přihlášení ani backend. Data se při sestavení generují z nové databáze v paměti, nikdy z místní `data/fhs.sqlite`. Publikují se jen ukázková sdělení, dokumenty, anketa, akce, kontakty a popisy připravovaných integrací. Nepublikují se relace, audit, podněty ani obsah schránky důvěry. Zápisy a vstup správce jsou v ukázce vypnuté. Stažení ukázkových TXT dokumentů funguje i bez API.
