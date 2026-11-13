import express from "express";
import helmet from "helmet";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { documents, contacts, integrations } from "./catalog.js";

const allowedKinds = ["Dotaz na HR", "Zlepšovací návrh", "Podpora portálu"];
const text = (value, min, max) =>
  typeof value === "string" &&
  value.trim().length >= min &&
  value.trim().length <= max;
const token = () => randomBytes(32).toString("hex");

export function createApp(
  db,
  { demoEnabled = false, production = false, publicOrigin = "" } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  const publicUrl = publicOrigin ? new URL(publicOrigin) : null;
  if (
    publicUrl &&
    (publicUrl.protocol !== "https:" || publicUrl.origin !== publicOrigin)
  ) {
    throw new Error(
      "FHS_PUBLIC_ORIGIN musí být přesná HTTPS origin adresa bez cesty.",
    );
  }
  app.use((req, res, next) => {
    const local =
      ["localhost", "127.0.0.1", "[::1]"].includes(req.hostname) &&
      !req.headers["cf-ray"] &&
      !req.headers["x-forwarded-for"];
    req.publicPreview = !local;
    if (!local && (!publicUrl || req.get("host") !== publicUrl.host)) {
      return res
        .status(403)
        .json({ error: "Tato veřejná adresa není povolena." });
    }
    req.expectedOrigin = local
      ? `${req.protocol}://${req.get("host")}`
      : publicOrigin;
    next();
  });
  app.use(helmet({ contentSecurityPolicy: production ? undefined : false }));
  app.use(express.json({ limit: "64kb" }));
  const audit = (user, action, entity) =>
    db
      .prepare(
        "INSERT INTO audit (user_id,action,entity,created_at) VALUES (?,?,?,?)",
      )
      .run(user, action, entity, new Date().toISOString());
  const fail = (res, status, message) =>
    res.status(status).json({ error: message });

  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.get("/api/health", (req, res) =>
    res.json({ status: "ok", demo: demoEnabled, version: "0.1.0" }),
  );
  app.get("/api/auth/config", (req, res) =>
    res.json({
      demo: demoEnabled,
      casConfigured: false,
      readOnly: req.publicPreview,
    }),
  );
  const loginAttempts = new Map();
  app.post("/api/auth/demo", (req, res) => {
    if (!demoEnabled)
      return fail(
        res,
        403,
        "Demonstrační přístup není v tomto prostředí povolen.",
      );
    if (req.headers["x-fhs-client"] !== "web")
      return fail(res, 403, "Neplatný požadavek.");
    if (req.headers.origin && req.headers.origin !== req.expectedOrigin)
      return fail(res, 403, "Nepovolený původ požadavku.");
    const key = req.ip;
    const current = loginAttempts.get(key) ?? {
      count: 0,
      until: Date.now() + 60000,
    };
    if (current.until < Date.now()) {
      current.count = 0;
      current.until = Date.now() + 60000;
    }
    if (++current.count > 30)
      return fail(res, 429, "Vyčkejte prosím minutu před dalším pokusem.");
    loginAttempts.set(key, current);
    const userId = req.body.profile;
    if (req.publicPreview && userId !== "employee")
      return fail(
        res,
        403,
        "Veřejná ukázka umožňuje pouze prohlížení zaměstnaneckého prostředí.",
      );
    if (!["employee", "admin"].includes(userId))
      return fail(res, 400, "Vyberte platný demonstrační profil.");
    db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
    const sessionId = token();
    db.prepare("INSERT INTO sessions VALUES (?,?,?,?)").run(
      sessionId,
      userId,
      token(),
      Date.now() + 8 * 3600000,
    );
    res.cookie("fhs_session", sessionId, {
      httpOnly: true,
      sameSite: "strict",
      secure: production || req.publicPreview,
      maxAge: 8 * 3600000,
      path: "/",
    });
    audit(userId, "demo_login", "session");
    res.json({ ok: true });
  });

  app.use("/api", (req, res, next) => {
    const sessionId = (req.headers.cookie ?? "")
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("fhs_session="))
      ?.slice(12);
    const session =
      sessionId &&
      db
        .prepare(
          "SELECT s.*,u.name,u.department,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND s.expires>?",
        )
        .get(sessionId, Date.now());
    if (!session) return fail(res, 401, "Pro pokračování se přihlaste.");
    req.session = session;
    req.user = {
      id: session.user_id,
      name: session.name,
      department: session.department,
      role: req.publicPreview ? "viewer" : session.role,
      readOnly: req.publicPreview,
    };
    if (
      req.publicPreview &&
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.path !== "/auth/logout"
    ) {
      return fail(res, 403, "Veřejná ukázka je určena pouze pro prohlížení.");
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const supplied = req.headers["x-csrf-token"];
      if (
        typeof supplied !== "string" ||
        !/^[a-f0-9]{64}$/.test(supplied) ||
        !timingSafeEqual(Buffer.from(supplied), Buffer.from(session.csrf))
      )
        return fail(res, 403, "Neplatné ověření požadavku. Obnovte stránku.");
      if (req.headers.origin && req.headers.origin !== req.expectedOrigin)
        return fail(res, 403, "Nepovolený původ požadavku.");
    }
    next();
  });
  const admin = (req, res, next) =>
    req.user.role === "admin"
      ? next()
      : fail(res, 403, "Tato funkce je dostupná správci.");
  app.get("/api/me", (req, res) =>
    res.json({ ...req.user, csrf: req.session.csrf, demo: demoEnabled }),
  );
  app.post("/api/auth/logout", (req, res) => {
    db.prepare("DELETE FROM sessions WHERE id=?").run(req.session.id);
    res.clearCookie("fhs_session", {
      path: "/",
      sameSite: "strict",
      secure: production || req.publicPreview,
      httpOnly: true,
    });
    res.json({ ok: true });
  });

  const visiblePost = (id, user) =>
    db
      .prepare(
        "SELECT * FROM posts WHERE id=? AND published_at<=? AND (audience='all' OR audience=?)",
      )
      .get(id, new Date().toISOString(), user.department);
  app.get("/api/posts", (req, res) => {
    const rows = db
      .prepare(
        "SELECT p.*, EXISTS(SELECT 1 FROM acknowledgments WHERE post_id=p.id AND user_id=?) AS acknowledged, EXISTS(SELECT 1 FROM likes WHERE post_id=p.id AND user_id=?) AS liked, (SELECT COUNT(*) FROM likes WHERE post_id=p.id) AS likes FROM posts p WHERE published_at<=? AND (audience='all' OR audience=?) ORDER BY important DESC,published_at DESC",
      )
      .all(
        req.user.id,
        req.user.id,
        new Date().toISOString(),
        req.user.department,
      );
    res.json(rows);
  });
  app.post("/api/posts", admin, (req, res) => {
    const { title, body, category, audience, publishedAt, important } =
      req.body;
    if (
      !text(title, 3, 150) ||
      !text(body, 10, 10000) ||
      !["Fakulta", "Pro zaměstnance", "Ze života FHS"].includes(category) ||
      !["all", "Děkanát FHS"].includes(audience)
    )
      return fail(
        res,
        400,
        "Doplňte název, text, kategorii a platnou skupinu příjemců.",
      );
    const date = publishedAt ? new Date(publishedAt) : new Date();
    if (Number.isNaN(date.getTime()))
      return fail(res, 400, "Neplatný čas zveřejnění.");
    const result = db
      .prepare(
        "INSERT INTO posts (title,body,category,audience,published_at,author,important) VALUES (?,?,?,?,?,?,?)",
      )
      .run(
        title.trim(),
        body.trim(),
        category,
        audience,
        date.toISOString(),
        req.user.name,
        important === true ? 1 : 0,
      );
    audit(req.user.id, "publish_post", String(result.lastInsertRowid));
    res.status(201).json({
      id: Number(result.lastInsertRowid),
      scheduled: date > new Date(),
    });
  });
  app.post("/api/posts/:id/acknowledge", (req, res) => {
    const post = visiblePost(req.params.id, req.user);
    if (!post) return fail(res, 404, "Sdělení není dostupné.");
    db.prepare("INSERT OR IGNORE INTO acknowledgments VALUES (?,?,?)").run(
      post.id,
      req.user.id,
      new Date().toISOString(),
    );
    audit(req.user.id, "acknowledge_post", String(post.id));
    res.json({ ok: true });
  });
  app.post("/api/posts/:id/like", (req, res) => {
    const post = visiblePost(req.params.id, req.user);
    if (!post) return fail(res, 404, "Sdělení není dostupné.");
    if (typeof req.body.liked !== "boolean")
      return fail(res, 400, "Uveďte požadovaný stav reakce.");
    if (req.body.liked)
      db.prepare("INSERT OR IGNORE INTO likes VALUES (?,?)").run(
        post.id,
        req.user.id,
      );
    else
      db.prepare("DELETE FROM likes WHERE post_id=? AND user_id=?").run(
        post.id,
        req.user.id,
      );
    res.json({ liked: req.body.liked });
  });

  app.get("/api/polls", (req, res) =>
    res.json(
      db
        .prepare("SELECT * FROM polls ORDER BY id DESC")
        .all()
        .map((p) => {
          const options = JSON.parse(p.options);
          const votes = db
            .prepare(
              "SELECT option_index, COUNT(*) AS count FROM votes WHERE poll_id=? GROUP BY option_index",
            )
            .all(p.id);
          const mine = db
            .prepare(
              "SELECT option_index FROM votes WHERE poll_id=? AND user_id=?",
            )
            .get(p.id, req.user.id);
          return {
            ...p,
            options,
            voted: mine?.option_index ?? null,
            counts: options.map((_, i) =>
              Number(votes.find((v) => v.option_index === i)?.count ?? 0),
            ),
          };
        }),
    ),
  );
  app.post("/api/polls/:id/vote", (req, res) => {
    const poll = db
      .prepare("SELECT * FROM polls WHERE id=?")
      .get(req.params.id);
    if (!poll) return fail(res, 404, "Anketa neexistuje.");
    const choice = req.body.option;
    if (new Date(poll.closes_at) <= new Date())
      return fail(res, 409, "Anketa už je uzavřená.");
    if (
      !Number.isInteger(choice) ||
      choice < 0 ||
      choice >= JSON.parse(poll.options).length
    )
      return fail(res, 400, "Vyberte jednu z možností.");
    try {
      db.prepare("INSERT INTO votes VALUES (?,?,?)").run(
        poll.id,
        req.user.id,
        choice,
      );
    } catch (error) {
      if (
        error.code?.includes("SQLITE") &&
        db
          .prepare("SELECT 1 FROM votes WHERE poll_id=? AND user_id=?")
          .get(poll.id, req.user.id)
      )
        return fail(res, 409, "V této anketě už jste hlasovali.");
      throw error;
    }
    res.status(201).json({ ok: true });
  });

  app.get("/api/documents", (req, res) =>
    res.json(documents.map(({ content, ...d }) => d)),
  );
  app.get("/api/documents/:id/download", (req, res) => {
    const document = documents.find((d) => d.id === req.params.id);
    if (!document) return fail(res, 404, "Dokument nebyl nalezen.");
    audit(req.user.id, "download_document", document.id);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="fhs-${document.id}.txt"`,
    );
    res.type("text/plain").send(document.content);
  });
  app.get("/api/contacts", (req, res) => res.json(contacts));
  app.get("/api/events", (req, res) =>
    res.json(
      db
        .prepare(
          "SELECT e.*, (SELECT COUNT(*) FROM registrations WHERE event_id=e.id) AS registered_count, EXISTS(SELECT 1 FROM registrations WHERE event_id=e.id AND user_id=?) AS registered FROM events e ORDER BY starts_at",
        )
        .all(req.user.id),
    ),
  );
  app.post("/api/events/:id/register", (req, res) => {
    const event = db
      .prepare("SELECT * FROM events WHERE id=?")
      .get(req.params.id);
    if (!event) return fail(res, 404, "Událost nebyla nalezena.");
    if (new Date(event.starts_at) <= new Date())
      return fail(res, 409, "Událost již proběhla.");
    const existing = db
      .prepare("SELECT 1 FROM registrations WHERE event_id=? AND user_id=?")
      .get(event.id, req.user.id);
    if (typeof req.body.registered !== "boolean")
      return fail(res, 400, "Uveďte požadovaný stav přihlášení.");
    if (!req.body.registered)
      db.prepare(
        "DELETE FROM registrations WHERE event_id=? AND user_id=?",
      ).run(event.id, req.user.id);
    else if (!existing) {
      const result = db
        .prepare(
          "INSERT INTO registrations SELECT ?,? WHERE (SELECT COUNT(*) FROM registrations WHERE event_id=?) < ?",
        )
        .run(event.id, req.user.id, event.id, event.capacity);
      if (!result.changes)
        return fail(res, 409, "Kapacita události je naplněna.");
    }
    audit(
      req.user.id,
      req.body.registered ? "register_event" : "cancel_registration",
      String(event.id),
    );
    res.json({ registered: req.body.registered });
  });
  app.get("/api/requests", (req, res) =>
    res.json(
      db
        .prepare(
          "SELECT id,kind,subject,body,created_at,status FROM requests WHERE user_id=? AND ?=0 ORDER BY id DESC",
        )
        .all(req.user.id, req.publicPreview ? 1 : 0),
    ),
  );
  app.post("/api/requests", (req, res) => {
    const { kind, subject, body } = req.body;
    if (
      !allowedKinds.includes(kind) ||
      !text(subject, 3, 150) ||
      !text(body, 10, 4000)
    )
      return fail(res, 400, "Vyplňte předmět a zprávu alespoň o 10 znacích.");
    const result = db
      .prepare(
        "INSERT INTO requests (user_id,kind,subject,body,created_at) VALUES (?,?,?,?,?)",
      )
      .run(
        req.user.id,
        kind,
        subject.trim(),
        body.trim(),
        new Date().toISOString(),
      );
    audit(req.user.id, "create_request", String(result.lastInsertRowid));
    res.status(201).json({ id: Number(result.lastInsertRowid) });
  });
  app.post("/api/trust", (req, res) => {
    if (!text(req.body.body, 20, 4000))
      return fail(res, 400, "Podnět musí mít alespoň 20 znaků.");
    db.prepare("INSERT INTO trust_reports (body,created_at) VALUES (?,?)").run(
      req.body.body.trim(),
      new Date().toISOString(),
    );
    res.status(201).json({ ok: true });
  });
  app.get("/api/admin/trust", admin, (req, res) =>
    res.json(db.prepare("SELECT * FROM trust_reports ORDER BY id DESC").all()),
  );
  app.get("/api/admin/stats", admin, (req, res) =>
    res.json({
      posts: db.prepare("SELECT COUNT(*) AS n FROM posts").get().n,
      acknowledgments: db
        .prepare("SELECT COUNT(*) AS n FROM acknowledgments")
        .get().n,
      reactions: db.prepare("SELECT COUNT(*) AS n FROM likes").get().n,
      requests: db.prepare("SELECT COUNT(*) AS n FROM requests").get().n,
      scheduled: db
        .prepare("SELECT COUNT(*) AS n FROM posts WHERE published_at>?")
        .get(new Date().toISOString()).n,
    }),
  );
  app.get("/api/integrations", (req, res) => res.json(integrations));
  app.use("/api", (req, res) =>
    fail(res, 404, "Požadované rozhraní neexistuje."),
  );
  app.use((error, req, res, next) => {
    if (error instanceof SyntaxError || error.type === "entity.too.large")
      return fail(res, 400, "Neplatná nebo příliš velká data.");
    console.error("Request failed:", error.code ?? error.name);
    fail(res, 500, "Požadavek se nepodařilo zpracovat. Zkuste to znovu.");
  });
  return app;
}
