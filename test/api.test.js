import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/app.js";
import { openDatabase } from "../server/database.js";

async function fixture(t, demoEnabled = true) {
  const db = openDatabase(":memory:");
  const server = createApp(db, { demoEnabled }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(() => {
          db.close();
          resolve();
        });
        server.closeAllConnections();
      }),
  );
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(
    path,
    { method = "GET", body, cookie = "", csrf = "" } = {},
  ) {
    const response = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-FHS-Client": "web",
        Cookie: cookie,
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const data = response.headers.get("content-type")?.includes("json")
      ? await response.json()
      : await response.text();
    return {
      status: response.status,
      data,
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  }
  async function login(profile) {
    const r = await request("/auth/demo", {
      method: "POST",
      body: { profile },
    });
    assert.equal(r.status, 200);
    const me = await request("/me", { cookie: r.cookie });
    return { cookie: r.cookie, csrf: me.data.csrf };
  }
  return { db, request, login };
}

test("Protected routes require a session; demo can be disabled", async (t) => {
  const f = await fixture(t, false);
  assert.equal((await f.request("/documents")).status, 401);
  assert.equal(
    (
      await f.request("/auth/demo", {
        method: "POST",
        body: { profile: "admin" },
      })
    ).status,
    403,
  );
});
test("CSRF is required and an employee cannot publish or read the trust inbox", async (t) => {
  const f = await fixture(t);
  const user = await f.login("employee");
  assert.equal(
    (
      await f.request("/requests", {
        method: "POST",
        cookie: user.cookie,
        body: {},
      })
    ).status,
    403,
  );
  assert.equal(
    (await f.request("/posts", { ...user, method: "POST", body: {} })).status,
    403,
  );
  assert.equal((await f.request("/admin/trust", user)).status, 403);
});
test("Scheduled and targeted posts are hidden until applicable; acknowledgment is idempotent", async (t) => {
  const f = await fixture(t);
  const admin = await f.login("admin");
  const user = await f.login("employee");
  const post = {
    title: "Test plánování",
    body: "Text testovacího sdělení pro ověření.",
    category: "Fakulta",
    audience: "all",
    publishedAt: "2099-01-01T00:00:00Z",
    important: true,
  };
  const created = await f.request("/posts", {
    ...admin,
    method: "POST",
    body: post,
  });
  assert.equal(created.status, 201);
  const visible = await f.request("/posts", user);
  assert.equal(
    visible.data.some((p) => p.id === created.data.id),
    false,
  );
  assert.equal(
    (
      await f.request(`/posts/${created.data.id}/acknowledge`, {
        ...user,
        method: "POST",
        body: {},
      })
    ).status,
    404,
  );
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await f.request("/posts/1/acknowledge", {
          ...user,
          method: "POST",
          body: {},
        })
      ).status,
      200,
    );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM acknowledgments").get().n,
    1,
  );
  await f.request("/posts", {
    ...admin,
    method: "POST",
    body: { ...post, publishedAt: undefined, audience: "Děkanát FHS" },
  });
  assert.equal(
    (await f.request("/posts", admin)).data.some(
      (p) => p.audience === "Děkanát FHS",
    ),
    false,
  );
  assert.equal(
    (await f.request("/posts", user)).data.some(
      (p) => p.audience === "Děkanát FHS",
    ),
    true,
  );
});
test("Poll validates choices, prevents duplicate votes and returns aggregate results", async (t) => {
  const f = await fixture(t);
  const user = await f.login("employee");
  assert.equal(
    (
      await f.request("/polls/1/vote", {
        ...user,
        method: "POST",
        body: { option: 99 },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.request("/polls/1/vote", {
        ...user,
        method: "POST",
        body: { option: 1 },
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await f.request("/polls/1/vote", {
        ...user,
        method: "POST",
        body: { option: 2 },
      })
    ).status,
    409,
  );
  const result = await f.request("/polls", user);
  assert.equal(result.data[0].counts[1], 1);
  assert.equal(result.data[0].voted, 1);
  assert.equal(JSON.stringify(result.data).includes("employee"), false);
});
test("Event registration is idempotent, respects capacity and allows cancellation", async (t) => {
  const f = await fixture(t);
  const user = await f.login("employee");
  const admin = await f.login("admin");
  f.db.prepare("UPDATE events SET capacity=1 WHERE id=1").run();
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await f.request("/events/1/register", {
          ...user,
          method: "POST",
          body: { registered: true },
        })
      ).status,
      200,
    );
  assert.equal(
    (
      await f.request("/events/1/register", {
        ...admin,
        method: "POST",
        body: { registered: true },
      })
    ).status,
    409,
  );
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM registrations").get().n,
    1,
  );
  await f.request("/events/1/register", {
    ...user,
    method: "POST",
    body: { registered: false },
  });
  assert.equal(
    f.db.prepare("SELECT COUNT(*) AS n FROM registrations").get().n,
    0,
  );
});
test("Requests remain private and trust reports do not store the author", async (t) => {
  const f = await fixture(t);
  const user = await f.login("employee");
  const admin = await f.login("admin");
  assert.equal(
    (
      await f.request("/requests", {
        ...user,
        method: "POST",
        body: {
          kind: "Dotaz na HR",
          subject: "Testovací dotaz",
          body: "Toto je pouze ukázkový podnět.",
        },
      })
    ).status,
    201,
  );
  assert.equal((await f.request("/requests", user)).data.length, 1);
  assert.equal((await f.request("/requests", admin)).data.length, 0);
  await f.request("/trust", {
    ...user,
    method: "POST",
    body: { body: "Ukázkový důvěrný podnět k ověření ochrany přístupu." },
  });
  const reports = await f.request("/admin/trust", admin);
  assert.equal(reports.data.length, 1);
  assert.equal("user_id" in reports.data[0], false);
});
