export const isStaticDemo = import.meta.env.VITE_STATIC_DEMO === "true";

let entered = false;
let content: Promise<Record<string, unknown>> | undefined;

export function documentUrl(id: string) {
  return isStaticDemo
    ? `${import.meta.env.BASE_URL}demo/documents/${encodeURIComponent(id)}.txt`
    : `/api/documents/${encodeURIComponent(id)}/download`;
}

// This adapter serves a public sample, not an authenticated user session.
export async function staticDemoApi<T>(path: string, method: string, body?: unknown): Promise<T> {
  if (path === "/auth/config" && method === "GET") {
    return { demo: true, casConfigured: false, readOnly: true } as T;
  }
  if (path === "/auth/demo" && method === "POST") {
    if ((body as { profile?: string } | undefined)?.profile !== "employee") {
      throw new Error("Veřejná ukázka umožňuje pouze prohlížení zaměstnaneckého prostředí.");
    }
    entered = true;
    return { ok: true } as T;
  }
  if (path === "/auth/logout" && method === "POST") {
    entered = false;
    return { ok: true } as T;
  }
  if (!entered) throw new Error("Pro pokračování otevřete ukázku.");
  if (method !== "GET") throw new Error("Veřejná ukázka je určena pouze pro prohlížení.");
  if (path === "/me") {
    return {
      id: "employee", name: "Eliška Novotná", department: "Děkanát FHS",
      role: "viewer", readOnly: true, demo: true, csrf: "",
    } as T;
  }
  const key = path.slice(1);
  if (!["posts", "documents", "polls", "events", "contacts", "requests", "integrations"].includes(key)) {
    throw new Error("Tato funkce není ve veřejné ukázce dostupná.");
  }
  if (!content) {
    content = fetch(`${import.meta.env.BASE_URL}demo/data.json`).then(async (response) => {
      if (!response.ok) throw new Error("Ukázková data se nepodařilo načíst. Zkuste to znovu.");
      return response.json() as Promise<Record<string, unknown>>;
    }).catch((error) => { content = undefined; throw error; });
  }
  return (await content)[key] as T;
}
