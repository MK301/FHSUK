import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import express from "express";
import { createApp } from "./app.js";
import { openDatabase } from "./database.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const production = process.env.NODE_ENV === "production";
const demoEnabled =
  process.env.DEMO_MODE === "true" ||
  (!production && process.env.DEMO_MODE !== "false");
if (production && demoEnabled)
  throw new Error("Demonstrační přihlášení není povoleno v produkčním režimu.");
const db = openDatabase(
  process.env.DB_PATH || resolve(root, "data/fhs.sqlite"),
);
const app = createApp(db, {
  demoEnabled,
  production,
  publicOrigin: process.env.FHS_PUBLIC_ORIGIN || "",
});
const built = existsSync(resolve(root, "dist/index.html"));
if (
  process.argv.includes("--dev") ||
  process.env.FHS_DEV === "true" ||
  !built
) {
  if (production)
    throw new Error("Nejdříve vytvořte sestavení pomocí npm run build.");
  const { createServer } = await import("vite");
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(resolve(root, "dist")));
  app.get("/{*path}", (req, res) =>
    res.sendFile(resolve(root, "dist/index.html")),
  );
}
const port = Number(process.env.PORT || 4173);
const server = app.listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(
    `FHS HR portál: http://localhost:${port} · ${demoEnabled ? "demonstrační režim" : "demo vypnuto"}`,
  ),
);
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
