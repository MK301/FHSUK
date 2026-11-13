import { test } from "node:test";
import { request as httpRequest } from "node:http";
import assert from "node:assert/strict";
import { createApp } from "../server/app.js";
import { openDatabase } from "../server/database.js";

test("Public preview permits only the configured origin and read-only employee sessions", async (t) => {
  const origin = "https://preview.example.com";
  const db = openDatabase(":memory:");
  const server = createApp(db, {
    demoEnabled: true,
    publicOrigin: origin,
  }).listen(0, "127.0.0.1");
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
  async function call(
    path,
    {
      method = "GET",
      body,
      cookie = "",
      csrf = "",
      host = "preview.example.com",
      requestOrigin = origin,
    } = {},
  ) {
    return new Promise((resolve, reject) => {
      const req = httpRequest(base + path, {
        method,
        headers: { Host: host, Origin: requestOrigin, "Content-Type": "application/json", "X-FHS-Client": "web", Cookie: cookie, "X-CSRF-Token": csrf }
      }, response => {
        let content = "";
        response.setEncoding("utf8");
        response.on("data", chunk => { content += chunk; });
        response.on("end", () => resolve({ status: response.statusCode, data: JSON.parse(content), cookie: response.headers["set-cookie"]?.[0] }));
      });
      req.on("error", reject);
      req.end(body ? JSON.stringify(body) : undefined);
    });
  }
  assert.equal((await call("/auth/config")).data.readOnly, true);
  assert.equal(
    (await call("/auth/config", { host: "unknown.example.com" })).status,
    403,
  );
  assert.equal(
    (
      await call("/auth/demo", {
        method: "POST",
        body: { profile: "employee" },
        requestOrigin: "https://attacker.example.com",
      })
    ).status,
    403,
  );
  assert.equal(
    (await call("/auth/demo", { method: "POST", body: { profile: "admin" } }))
      .status,
    403,
  );
  const login = await call("/auth/demo", {
    method: "POST",
    body: { profile: "employee" },
  });
  assert.equal(login.status, 200);
  assert.match(login.cookie, /Secure/);
  const cookie = login.cookie.split(";")[0];
  const me = await call("/me", { cookie });
  assert.equal(me.data.readOnly, true);
  assert.equal(me.data.role, "viewer");
  const access = { cookie, csrf: me.data.csrf };
  for (const path of [
    "/requests",
    "/trust",
    "/polls/1/vote",
    "/events/1/register",
    "/posts/1/like",
    "/posts/1/acknowledge",
  ]) {
    assert.equal(
      (await call(path, { ...access, method: "POST", body: {} })).status,
      403,
      path,
    );
  }
  assert.equal((await call("/admin/trust", access)).status, 403);
  assert.deepEqual((await call("/requests", access)).data, []);
  assert.equal((await call("/posts", access)).status, 200);
  assert.equal(
    (await call("/auth/logout", { ...access, method: "POST", body: {} }))
      .status,
    200,
  );
});

