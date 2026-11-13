import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { openDatabase } from "../server/database.js";
import { documents, contacts, integrations } from "../server/catalog.js";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "FHSUK";
assert.match(repository, /^[A-Za-z0-9_.-]+$/);
const base = `/${repository}/`;
const output = resolve("dist-pages");
execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"], { stdio: "inherit" });
execFileSync(process.execPath, ["node_modules/vite/bin/vite.js", "build", "--base", base, "--outDir", output], {
  stdio: "inherit", env: { ...process.env, VITE_STATIC_DEMO: "true" },
});

// A fresh in-memory database ensures local records can never enter the public build.
const db = openDatabase(":memory:");
try {
  const data = {
    posts: db.prepare("SELECT id,title,body,category,author,published_at,important FROM posts ORDER BY important DESC,published_at DESC").all()
      .map((post) => ({ ...post, acknowledged: 0, liked: 0, likes: 0 })),
    documents: documents.map(({ content, ...document }) => document),
    polls: db.prepare("SELECT id,question,options,closes_at FROM polls ORDER BY id DESC").all().map((poll) => {
      const options = JSON.parse(poll.options);
      return { ...poll, options, voted: null, counts: options.map(() => 0) };
    }),
    events: db.prepare("SELECT id,title,starts_at,location,capacity,description FROM events ORDER BY starts_at").all()
      .map((event) => ({ ...event, registered: 0, registered_count: 0 })),
    contacts, requests: [], integrations,
  };
  mkdirSync(resolve(output, "demo/documents"), { recursive: true });
  writeFileSync(resolve(output, "demo/data.json"), JSON.stringify(data));
  for (const document of documents) {
    assert.match(document.id, /^[a-z0-9-]+$/);
    const content = document.id === "requests"
      ? "Ukázkový dokument\n\nPro dotazy k pracovnímu vztahu kontaktujte personální oddělení. Veřejná ukázka portálu slouží pouze k prohlížení; podněty se zde neodesílají."
      : document.content;
    writeFileSync(resolve(output, "demo/documents", `${document.id}.txt`), content);
  }
  writeFileSync(resolve(output, ".nojekyll"), "");
  const html = readFileSync(resolve(output, "index.html"), "utf8");
  assert.ok(html.includes(`${base}assets/`), "Assets must use the repository subpath");
  assert.ok(html.includes(`${base}uk-logo.png`), "Favicon must use the repository subpath");
  assert.ok(existsSync(resolve(output, "uk-logo.png")));
  assert.equal(data.requests.length, 0);
  assert.deepEqual(Object.keys(data).sort(), ["contacts", "documents", "events", "integrations", "polls", "posts", "requests"]);
  console.log(`Public sample ready in dist-pages for ${base}; local database was not read.`);
} finally { db.close(); }
