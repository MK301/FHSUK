import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function openDatabase(filename) {
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, department TEXT NOT NULL, role TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, category TEXT NOT NULL, audience TEXT NOT NULL DEFAULT 'all', published_at TEXT NOT NULL, author TEXT NOT NULL, important INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS acknowledgments (post_id INTEGER REFERENCES posts(id), user_id TEXT REFERENCES users(id), created_at TEXT NOT NULL, PRIMARY KEY(post_id,user_id));
    CREATE TABLE IF NOT EXISTS likes (post_id INTEGER REFERENCES posts(id), user_id TEXT REFERENCES users(id), PRIMARY KEY(post_id,user_id));
    CREATE TABLE IF NOT EXISTS polls (id INTEGER PRIMARY KEY, question TEXT NOT NULL, options TEXT NOT NULL, closes_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS votes (poll_id INTEGER REFERENCES polls(id), user_id TEXT REFERENCES users(id), option_index INTEGER NOT NULL, PRIMARY KEY(poll_id,user_id));
    CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, title TEXT NOT NULL, starts_at TEXT NOT NULL, location TEXT NOT NULL, capacity INTEGER NOT NULL, description TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS registrations (event_id INTEGER REFERENCES events(id), user_id TEXT REFERENCES users(id), PRIMARY KEY(event_id,user_id));
    CREATE TABLE IF NOT EXISTS requests (id INTEGER PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Přijato');
    CREATE TABLE IF NOT EXISTS trust_reports (id INTEGER PRIMARY KEY, body TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY, user_id TEXT, action TEXT NOT NULL, entity TEXT NOT NULL, created_at TEXT NOT NULL);
  `);
  if (!db.prepare("SELECT id FROM users LIMIT 1").get()) {
    db.prepare("INSERT INTO users VALUES (?,?,?,?)").run(
      "employee",
      "Eliška Novotná",
      "Děkanát FHS",
      "employee",
    );
    db.prepare("INSERT INTO users VALUES (?,?,?,?)").run(
      "admin",
      "Jan Dvořák",
      "Správa portálu",
      "admin",
    );
    const now = new Date();
    const day = (offset) =>
      new Date(now.getTime() + offset * 86400000).toISOString();
    const insertPost = db.prepare("INSERT INTO posts VALUES (?,?,?,?,?,?,?,?)");
    insertPost.run(
      1,
      "Vítejte v novém portálu zaměstnance",
      "Vše důležité pro práci na fakultě najdete na jednom místě. Projděte si dokumenty, informace pro zaměstnance i připravované akce.\n\nToto je první demonstrační verze. Všechny osoby, údaje a události v portálu slouží k vyzkoušení aplikace. Zpětnou vazbu můžete předat prostřednictvím sekce Podněty.",
      "Fakulta",
      "all",
      day(-1),
      "Vedení fakulty",
      1,
    );
    insertPost.run(
      2,
      "Společné setkání zaměstnanců fakulty",
      "Zveme vás na společné setkání akademických i neakademických pracovníků. Prostor věnujeme novinkám na fakultě a vašim otázkám. Podrobnosti a přihlášku najdete v sekci Akce a časopis.",
      "Ze života FHS",
      "all",
      day(-2),
      "Děkanát FHS",
      0,
    );
    insertPost.run(
      3,
      "Průvodce zaměstnance má nové členění",
      "Informace jsme uspořádali podle vašich potřeb. Najdete zde nástup do zaměstnání, životní situace i přehled kroků při odchodu. Každé téma obsahuje příslušný kontakt.",
      "Pro zaměstnance",
      "all",
      day(-3),
      "Personální oddělení",
      0,
    );
    db.prepare("INSERT INTO polls VALUES (?,?,?,?)").run(
      1,
      "Kterou část portálu budete využívat nejčastěji?",
      JSON.stringify([
        "Dokumenty a návody",
        "Osobní HR informace",
        "Aktuality a akce",
        "Kontakty a pracoviště",
      ]),
      day(30),
    );
    const event = db.prepare("INSERT INTO events VALUES (?,?,?,?,?,?)");
    event.run(
      1,
      "Setkání zaměstnanců FHS",
      day(7),
      "Aula · Pátkova 2137/5",
      60,
      "Společné setkání a prostor pro otázky. Ukázková událost pro ověření přihlašování.",
    );
    event.run(
      2,
      "Seznámení s portálem",
      day(12),
      "Online",
      20,
      "Praktická ukázka práce s dokumenty a informacemi. Ukázková událost.",
    );
  }
  return db;
}
