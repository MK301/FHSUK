import React, {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Heart,
  House,
  LayoutGrid,
  LifeBuoy,
  Link2,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  ParkingCircle,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Users,
  Utensils,
  Vote,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import "./styles.css";
import { isStaticDemo, staticDemoApi, documentUrl } from "./static-demo";

type User = {
  id: string;
  name: string;
  department: string;
  role: string;
  csrf: string;
  readOnly?: boolean;
  demo: boolean;
};
type Post = {
  id: number;
  title: string;
  body: string;
  category: string;
  author: string;
  published_at: string;
  important: number;
  acknowledged: number;
  liked: number;
  likes: number;
};
type Doc = { id: string; title: string; category: string; updated: string };
type Poll = {
  id: number;
  question: string;
  options: string[];
  closes_at: string;
  voted: number | null;
  counts: number[];
};
type Event = {
  id: number;
  title: string;
  starts_at: string;
  location: string;
  capacity: number;
  registered_count: number;
  registered: number;
  description: string;
};
type Contact = {
  id: number;
  name: string;
  department: string;
  description: string;
  initials: string;
};
type Request = {
  id: number;
  kind: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
};
type Integration = {
  id: string;
  name: string;
  purpose: string;
  status: string;
  detail: string;
};
type Data = {
  posts: Post[];
  documents: Doc[];
  polls: Poll[];
  events: Event[];
  contacts: Contact[];
  requests: Request[];
  integrations: Integration[];
};
type Service = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  group: string;
};

const services: Service[] = [
  {
    id: "posts",
    label: "Sdělení fakulty",
    description: "Aktuality a důležité informace",
    icon: Bell,
    group: "Management",
  },
  {
    id: "documents",
    label: "Dokumenty",
    description: "Směrnice, formuláře a návody",
    icon: FileText,
    group: "HR",
  },
  {
    id: "guide",
    label: "Průvodce zaměstnance",
    description: "Odpovědi pro každou situaci",
    icon: BookOpen,
    group: "HR",
  },
  {
    id: "polls",
    label: "Ankety a dotazníky",
    description: "Váš názor má své místo",
    icon: Vote,
    group: "Management",
  },
  {
    id: "trust",
    label: "Schránka důvěry",
    description: "Prostor pro důvěrné podněty",
    icon: ShieldCheck,
    group: "Management",
  },
  {
    id: "meals",
    label: "Stravování",
    description: "Jídelníček a objednávání",
    icon: Utensils,
    group: "HR",
  },
  {
    id: "benefits",
    label: "Benefity",
    description: "Výhody pro zaměstnance",
    icon: Heart,
    group: "HR",
  },
  {
    id: "hr",
    label: "Moje HR",
    description: "Docházka a výplatní pásky",
    icon: Wallet,
    group: "HR",
  },
  {
    id: "people",
    label: "Lidé a pracoviště",
    description: "Kontakty a struktura fakulty",
    icon: Users,
    group: "HR",
  },
  {
    id: "parking",
    label: "Parkování",
    description: "Informace a rezervace",
    icon: ParkingCircle,
    group: "HR",
  },
  {
    id: "events",
    label: "Akce a časopis",
    description: "Společné dění na fakultě",
    icon: CalendarDays,
    group: "Management",
  },
  {
    id: "jobs",
    label: "Volná pracovní místa",
    description: "Příležitosti na FHS",
    icon: BriefcaseBusiness,
    group: "HR",
  },
];
const nav = (page: string) => {
  window.location.hash = page;
};
const date = (value: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(
    "cs-CZ",
    options ?? { day: "numeric", month: "long" },
  ).format(new Date(value));
let csrf = "";
async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  if (isStaticDemo) return staticDemoApi<T>(path, method, body);
  const response = await fetch(`/api${path}`, {
    method,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-FHS-Client": "web",
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("session-expired"));
    throw new Error(result.error || "Požadavek se nepodařil.");
  }
  return result;
}
function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <img src={`${import.meta.env.BASE_URL}uk-logo.png`} alt="Pečeť Univerzity Karlovy" />
      <div>
        <strong>{compact ? "FHS UK" : "Univerzita Karlova"}</strong>
        <span>
          {compact ? "Portál zaměstnance" : "Fakulta humanitních studií"}
        </span>
      </div>
    </div>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement;
    const dialog = document.querySelector<HTMLDialogElement>("dialog");
    dialog?.showModal();
    return () => previouslyFocused?.focus();
  }, []);
  return (
    <dialog
      className="modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Zavřít dialog"
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Empty({
  title,
  children,
  icon: Icon = FileText,
}: {
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={29} />
      </span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function Status({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`status ${tone}`}>{children}</span>;
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [config, setConfig] = useState<{
    demo: boolean;
    casConfigured: boolean;
    readOnly?: boolean;
  }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ demo: boolean; casConfigured: boolean; readOnly?: boolean }>(
      "/auth/config",
    )
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);
  async function enter(profile: string) {
    setBusy(true);
    setError("");
    try {
      await api("/auth/demo", "POST", { profile });
      onLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <header className="login-header">
        <Brand />
        <span className="login-header-note">Zaměstnanecký portál</span>
      </header>
      <main className="login-main">
        <div className="login-intro">
          <span className="eyebrow">FAKULTA HUMANITNÍCH STUDIÍ</span>
          <h1>
            Vaše fakulta.
            <br />
            Na jednom místě.
          </h1>
          <p>
            Informace, dokumenty a služby, které vám usnadní každý pracovní den.
          </p>
          <div className="login-feature">
            <span>
              <MessageSquare size={20} />
            </span>
            <div>
              <strong>Buďte v obraze</strong>
              <p>Aktuality a sdělení pro zaměstnance fakulty.</p>
            </div>
          </div>
          <div className="login-feature">
            <span>
              <FileText size={20} />
            </span>
            <div>
              <strong>Najděte, co potřebujete</strong>
              <p>Dokumenty, praktické návody a důležité kontakty.</p>
            </div>
          </div>
          <div className="login-feature">
            <span>
              <Users size={20} />
            </span>
            <div>
              <strong>Zůstaňme ve spojení</strong>
              <p>Společné akce, podněty a zpětná vazba.</p>
            </div>
          </div>
          <div className="intro-foot">
            FHS UK <span>•</span> Pátkova 2137/5, Praha 8
          </div>
        </div>
        <section className="login-card">
          <span className="login-lock">
            <LockKeyhole size={27} />
          </span>
          <h2>Vítejte v portálu</h2>
          <p>
            Přístup k informacím a službám
            <br />
            pro zaměstnance FHS UK.
          </p>
          <div className="cas-box">
            <ShieldCheck size={23} />
            <div>
              <strong>Jednotné přihlášení UK</strong>
              <span>Centrální autentizační služba CAS</span>
            </div>
          </div>
          <button className="button primary full" disabled>
            {" "}
            Přihlásit přes CAS UK <ArrowRight size={18} />
          </button>
          <p className="small muted cas-note">
            Přihlášení bude dostupné po registraci aplikace u UK.
          </p>
          <div className="separator">
            <span>První verze aplikace</span>
          </div>
          {config?.demo ? (
            <>
              <div className="demo-label">
                <span className="dot" />
                Demonstrační prostředí · ukázková data
              </div>
              <button
                className="button secondary full"
                disabled={busy}
                onClick={() => enter("employee")}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <LayoutGrid size={18} />
                )}{" "}
                Otevřít ukázku zaměstnance
              </button>
              {!config.readOnly && (
                <button
                  className="text-button admin-login"
                  disabled={busy}
                  onClick={() => enter("admin")}
                >
                  Vyzkoušet správu portálu <ChevronRight size={15} />
                </button>
              )}
            </>
          ) : (
            <p className="notice">
              Demonstrační vstup je vypnutý. Konfiguraci přihlášení zajistí
              správce.
            </p>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <div className="login-help">
            <CircleHelp size={16} />
            <span>Univerzitní heslo se zadává na stránce CAS UK.</span>
          </div>
        </section>
      </main>
      <footer className="login-footer">
        <span>© {new Date().getFullYear()} Univerzita Karlova · FHS</span>
        <span>
          Portál zaměstnance <span className="version">v0.1</span>
        </span>
      </footer>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [data, setData] = useState<Data | null>(null);
  const [page, setPage] = useState(location.hash.slice(1) || "home");
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState("");
  const [loadError, setLoadError] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [compose, setCompose] = useState(false);
  const [support, setSupport] = useState(false);
  const [info, setInfo] = useState(false);
  async function loadUser() {
    try {
      const current = await api<User>("/me");
      csrf = current.csrf;
      setUser(current);
    } catch {
      csrf = "";
      setUser(null);
    } finally {
      setChecking(false);
    }
  }
  async function reload() {
    const [posts, documents, polls, events, contacts, requests, integrations] =
      await Promise.all([
        api<Post[]>("/posts"),
        api<Doc[]>("/documents"),
        api<Poll[]>("/polls"),
        api<Event[]>("/events"),
        api<Contact[]>("/contacts"),
        api<Request[]>("/requests"),
        api<Integration[]>("/integrations"),
      ]);
    setData({
      posts,
      documents,
      polls,
      events,
      contacts,
      requests,
      integrations,
    });
    setLoadError("");
  }
  useEffect(() => {
    void loadUser();
    const expired = () => {
      setUser(null);
      setData(null);
      csrf = "";
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  useEffect(() => {
    if (user) reload().catch((e) => setLoadError(e.message));
  }, [user]);
  useEffect(() => {
    const change = () => {
      setPage(location.hash.slice(1) || "home");
      setSearch("");
      setMenu(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  async function mutate(path: string, body: unknown, message: string) {
    await api(path, "POST", body);
    await reload();
    setToast(message);
  }
  function run(action: Promise<unknown>) {
    action.catch((e) => setToast((e as Error).message));
  }
  async function logout() {
    await api("/auth/logout", "POST", {});
    csrf = "";
    setData(null);
    setUser(null);
  }
  if (checking)
    return (
      <div className="loading-screen">
        <LoaderCircle className="spin" />
        Načítání portálu…
      </div>
    );
  if (!user) return <Login onLogin={() => void loadUser()} />;
  const service = services.find((s) => s.id === page);
  const title =
    page === "home"
      ? "Přehled"
      : page === "integrations"
        ? "Integrace systémů"
        : page === "admin"
          ? "Správa portálu"
          : (service?.label ?? "Stránka nebyla nalezena");
  const unread =
    data?.posts.filter((p) => p.important && !p.acknowledged).length ?? 0;
  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .join("");
  const q = search.toLocaleLowerCase("cs");

  return (
    <div className="app-shell">
      {menu && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMenu(false)}
          aria-label="Zavřít navigaci"
        />
      )}
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Brand compact />
          <button
            className="mobile-only icon-button"
            onClick={() => setMenu(false)}
            aria-label="Zavřít menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Hlavní navigace">
          <button
            className={`nav-item home-nav ${page === "home" ? "active" : ""}`}
            onClick={() => nav("home")}
          >
            <House size={19} />
            <span>Přehled</span>
          </button>
          {["Management", "HR", "IT"].map((group) => (
            <div className="nav-group" key={group} data-group={group}>
              <div className="nav-group-title">{group}</div>
              {services
                .filter((s) => s.group === group)
                .map((s) => (
                  <button
                    className={`nav-item ${page === s.id ? "active" : ""}`}
                    key={s.id}
                    onClick={() => nav(s.id)}
                  >
                    <s.icon size={18} />
                    <span>{s.label}</span>
                    {s.id === "posts" && unread > 0 && (
                      <b className="nav-count">{unread}</b>
                    )}
                  </button>
                ))}
              {group === "IT" && (
                <>
                  <button
                    className={`nav-item ${page === "integrations" ? "active" : ""}`}
                    onClick={() => nav("integrations")}
                  >
                    <Link2 size={18} />
                    <span>Integrace systémů</span>
                  </button>
                  {user.role === "admin" && (
                    <button
                      className={`nav-item ${page === "admin" ? "active" : ""}`}
                      onClick={() => nav("admin")}
                    >
                      <SlidersHorizontal size={18} />
                      <span>Správa portálu</span>
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setSupport(true)}>
            <LifeBuoy size={18} />
            Podpora a podněty
          </button>
          <div className="sidebar-user">
            <span className="avatar">{initials}</span>
            <div>
              <strong>{user.name}</strong>
              <span>
                {user.role === "admin" ? "Správce portálu" : "Zaměstnanec"}
              </span>
            </div>
            <button
              className="icon-button"
              onClick={() => run(logout())}
              title="Odhlásit se"
              aria-label="Odhlásit se"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-only icon-button"
            onClick={() => setMenu(true)}
            aria-label="Otevřít menu"
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            <span>Portál zaměstnance</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="top-actions">
            <label className="global-search">
              <Search size={17} />
              <input
                aria-label="Hledat v portálu"
                placeholder="Hledat v portálu…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="icon-button"
                  onClick={() => setSearch("")}
                  aria-label="Vymazat hledání"
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <button className="language-button" onClick={() => setInfo(true)}>
              CZ <ChevronDown size={13} />
            </button>
            <button
              className="notification-button icon-button"
              onClick={() => nav("posts")}
              aria-label={`Sdělení, ${unread} k potvrzení`}
            >
              <Bell size={20} />
              {unread > 0 && <span />}
            </button>
          </div>
        </header>
        <div className="demo-bar">
          <span className="dot" />
          Demonstrační verze <span className="demo-divider">/</span>
          <span>
            {user.readOnly
              ? "Veřejná ukázka pouze pro prohlížení. Změny jsou vypnuté."
              : "Ukázková data. Integrace UK zatím nejsou připojeny."}
          </span>
          <span className="demo-profile">
            {user.role === "admin" ? "Režim správce" : "Režim zaměstnance"}
          </span>
        </div>
        <main className="main-content" id="main-content">
          {loadError && (
            <div className="error retry" role="alert">
              {loadError}
              <button className="text-button" onClick={() => run(reload())}>
                Zkusit znovu
              </button>
            </div>
          )}
          {!data && !loadError && (
            <div className="loading-screen">
              <LoaderCircle className="spin" />
              Načítání dat…
            </div>
          )}
          {data && search ? (
            <>
              <PageHeading
                eyebrow="VYHLEDÁVÁNÍ"
                title={`Výsledky pro „${search}“`}
                description="Vyhledávání v modulech, sděleních, dokumentech a kontaktech."
              />
              <div className="search-results">
                {services
                  .filter((s) =>
                    (s.label + s.description)
                      .toLocaleLowerCase("cs")
                      .includes(q),
                  )
                  .map((s) => (
                    <button
                      className="result-row"
                      key={s.id}
                      onClick={() => nav(s.id)}
                    >
                      <s.icon size={22} />
                      <div>
                        <strong>{s.label}</strong>
                        <span>Modul · {s.description}</span>
                      </div>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                {data.posts
                  .filter((p) =>
                    (p.title + p.body).toLocaleLowerCase("cs").includes(q),
                  )
                  .map((p) => (
                    <button
                      className="result-row"
                      key={`p${p.id}`}
                      onClick={() => setSelectedPost(p)}
                    >
                      <Newspaper size={22} />
                      <div>
                        <strong>{p.title}</strong>
                        <span>Sdělení · {p.author}</span>
                      </div>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                {data.documents
                  .filter((d) =>
                    (d.title + d.category).toLocaleLowerCase("cs").includes(q),
                  )
                  .map((d) => (
                    <a
                      className="result-row"
                      key={d.id}
                      href={documentUrl(d.id)}
                      download
                    >
                      <FileText size={22} />
                      <div>
                        <strong>{d.title}</strong>
                        <span>Dokument · {d.category}</span>
                      </div>
                      <ArrowDownToLine size={18} />
                    </a>
                  ))}
                {data.contacts
                  .filter((c) =>
                    (c.name + c.description)
                      .toLocaleLowerCase("cs")
                      .includes(q),
                  )
                  .map((c) => (
                    <button
                      className="result-row"
                      key={`c${c.id}`}
                      onClick={() => nav("people")}
                    >
                      <Users size={22} />
                      <div>
                        <strong>{c.name}</strong>
                        <span>{c.description}</span>
                      </div>
                      <ChevronRight size={18} />
                    </button>
                  ))}
              </div>
              {![
                ...services.map((s) => s.label + s.description),
                ...data.posts.map((p) => p.title + p.body),
                ...data.documents.map((d) => d.title + d.category),
                ...data.contacts.map((c) => c.name + c.description),
              ].some((s) => s.toLocaleLowerCase("cs").includes(q)) && (
                <Empty title="Nic jsme nenašli" icon={Search}>
                  Zkuste kratší výraz nebo název služby.
                </Empty>
              )}
            </>
          ) : (
            data && (
              <>
                {page === "home" && (
                  <>
                    <section className="welcome">
                      <div>
                        <div className="eyebrow">VÍTEJTE NA FAKULTĚ</div>
                        <h1>
                          Dobrý den, {user.role === "admin" ? "Jane" : "Eliško"}
                          <span>.</span>
                        </h1>
                        <p>
                          Vše důležité pro váš pracovní den. Přehledně a na
                          jednom místě.
                        </p>
                        <button
                          className="welcome-link"
                          onClick={() => nav("guide")}
                        >
                          Otevřít průvodce zaměstnance <ArrowRight size={16} />
                        </button>
                      </div>
                      <div className="welcome-date">
                        <CalendarDays size={21} />
                        <strong>
                          {date(new Date().toISOString(), {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </strong>
                        <span>
                          {date(new Date().toISOString(), { weekday: "long" })}
                        </span>
                      </div>
                      <div className="welcome-pattern" aria-hidden="true" />
                    </section>
                    <div className="summary-grid">
                      <Summary
                        icon={Bell}
                        value={unread}
                        label="Sdělení k potvrzení"
                        onClick={() => nav("posts")}
                      />
                      <Summary
                        icon={FileText}
                        value={data.documents.length}
                        label="Dostupné dokumenty"
                        onClick={() => nav("documents")}
                      />
                      <Summary
                        icon={CalendarDays}
                        value={data.events.length}
                        label="Připravované akce"
                        onClick={() => nav("events")}
                      />
                      <Summary
                        icon={Vote}
                        value={
                          data.polls.filter((p) => p.voted === null).length
                        }
                        label="Anketa pro vás"
                        onClick={() => nav("polls")}
                      />
                    </div>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">VAŠE SLUŽBY</span>
                        <h2>Co dnes potřebujete?</h2>
                      </div>
                      <span className="muted small">
                        12 modulů pro zaměstnance
                      </span>
                    </div>
                    <div className="service-grid">
                      {services.map((s) => (
                        <button
                          key={s.id}
                          className={`service-card ${s.id === "posts" ? "accent-card" : ""}`}
                          onClick={() => nav(s.id)}
                        >
                          <div className="service-card-top">
                            <span className="service-icon">
                              <s.icon size={23} strokeWidth={1.7} />
                            </span>
                            {s.id === "posts" && unread > 0 ? (
                              <span className="service-count">{unread}</span>
                            ) : (
                              <ChevronRight className="card-arrow" size={16} />
                            )}
                          </div>
                          <strong>{s.label}</strong>
                          <span className="service-description">
                            {s.description}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="home-bottom">
                      <section className="panel">
                        <div className="panel-heading">
                          <h2>Aktuálně na fakultě</h2>
                          <button
                            className="text-button"
                            onClick={() => nav("posts")}
                          >
                            Všechna sdělení <ArrowRight size={15} />
                          </button>
                        </div>
                        {data.posts.slice(0, 3).map((p) => (
                          <button
                            key={p.id}
                            className="news-row"
                            onClick={() => setSelectedPost(p)}
                          >
                            <span
                              className={`news-icon ${p.important ? "important" : ""}`}
                            >
                              <Newspaper size={20} />
                            </span>
                            <div>
                              <span className="meta">
                                {p.category} <span>·</span>{" "}
                                {date(p.published_at)}
                              </span>
                              <strong>{p.title}</strong>
                            </div>
                            <ChevronRight size={17} />
                          </button>
                        ))}
                      </section>
                      <section className="panel upcoming">
                        <div className="panel-heading">
                          <h2>Potkáme se</h2>
                          <CalendarDays size={20} />
                        </div>
                        {data.events.map((e) => (
                          <button
                            className="event-mini"
                            key={e.id}
                            onClick={() => nav("events")}
                          >
                            <span className="date-square">
                              <strong>{new Date(e.starts_at).getDate()}</strong>
                              <span>
                                {date(e.starts_at, { month: "short" })}
                              </span>
                            </span>
                            <div>
                              <strong>{e.title}</strong>
                              <span>{e.location}</span>
                            </div>
                            <ChevronRight size={16} />
                          </button>
                        ))}
                      </section>
                    </div>
                  </>
                )}
                {page === "posts" && (
                  <>
                    <PageHeading
                      eyebrow="MANAGEMENT"
                      title="Sdělení fakulty"
                      description="Aktuality, oznámení a důležité informace pro vaši práci."
                      action={
                        user.role === "admin" ? (
                          <button
                            className="button primary"
                            onClick={() => setCompose(true)}
                          >
                            <Plus size={18} />
                            Nové sdělení
                          </button>
                        ) : undefined
                      }
                    />
                    <div className="post-grid">
                      {data.posts.map((p) => (
                        <article className="post-card" key={p.id}>
                          <div className="post-meta">
                            <Status tone={p.important ? "red" : ""}>
                              {p.important ? "Důležité sdělení" : p.category}
                            </Status>
                            <span>{date(p.published_at)}</span>
                          </div>
                          <h2>
                            <button onClick={() => setSelectedPost(p)}>
                              {p.title}
                            </button>
                          </h2>
                          <p>{p.body.slice(0, 180)}…</p>
                          <footer>
                            <span>{p.author}</span>
                            <button
                              className="text-button"
                              onClick={() => setSelectedPost(p)}
                            >
                              Přečíst <ArrowRight size={16} />
                            </button>
                          </footer>
                          {p.important && (
                            <div
                              className={`ack-status ${p.acknowledged ? "done" : ""}`}
                            >
                              <CheckCheck size={16} />
                              {p.acknowledged
                                ? "Seznámení potvrzeno"
                                : "Čeká na vaše potvrzení"}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </>
                )}
                {page === "documents" && (
                  <Documents documents={data.documents} />
                )}
                {page === "guide" && <Guide />}
                {page === "polls" && (
                  <>
                    <PageHeading
                      eyebrow="MANAGEMENT"
                      title="Ankety a dotazníky"
                      description="Pomozte nám utvářet prostředí, ve kterém pracujeme."
                    />
                    {data.polls.map((p) => (
                      <PollCard
                        key={p.id}
                        poll={p}
                        readOnly={user.readOnly}
                        onVote={(option) =>
                          mutate(
                            `/polls/${p.id}/vote`,
                            { option },
                            "Děkujeme za váš hlas.",
                          )
                        }
                      />
                    ))}
                  </>
                )}
                {page === "trust" && (
                  <Trust
                    readOnly={user.readOnly}
                    onSubmit={(body) =>
                      mutate(
                        "/trust",
                        { body },
                        "Podnět byl uložen do demonstrační schránky.",
                      )
                    }
                  />
                )}
                {page === "events" && (
                  <>
                    <PageHeading
                      eyebrow="MANAGEMENT"
                      title="Akce a časopis"
                      description="Setkání, sdílené zkušenosti a dění na fakultě."
                    />
                    <div className="events-grid">
                      {data.events.map((e) => (
                        <article className="panel event-card" key={e.id}>
                          <span className="event-banner">
                            <CalendarDays size={33} />
                            <span>ZE ŽIVOTA FAKULTY</span>
                          </span>
                          <div className="event-body">
                            <Status>Ukázková akce</Status>
                            <h2>{e.title}</h2>
                            <p>{e.description}</p>
                            <div className="event-detail">
                              <Clock3 size={17} />
                              {date(e.starts_at, {
                                day: "numeric",
                                month: "long",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="event-detail">
                              <Building2 size={17} />
                              {e.location}
                            </div>
                            <div className="event-footer">
                              <span>
                                {e.registered_count} / {e.capacity} přihlášených
                              </span>
                              <button
                                className={`button ${e.registered ? "secondary" : "primary"}`}
                                disabled={user.readOnly}
                                onClick={() =>
                                  run(
                                    mutate(
                                      `/events/${e.id}/register`,
                                      { registered: !e.registered },
                                      e.registered
                                        ? "Přihlášení bylo zrušeno."
                                        : "Vaše místo je rezervované.",
                                    ),
                                  )
                                }
                              >
                                {e.registered ? (
                                  <>
                                    <Check size={16} />
                                    Zrušit účast
                                  </>
                                ) : (
                                  <>
                                    Přihlásit se <ArrowRight size={16} />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="panel magazine">
                      <Newspaper size={29} />
                      <div>
                        <h3>Fakultní časopis</h3>
                        <p>Aktuální vydání a archiv doplní správce obsahu.</p>
                      </div>
                    </div>
                  </>
                )}
                {page === "people" && <People contacts={data.contacts} />}
                {page === "benefits" && <Benefits />}
                {page === "hr" && (
                  <>
                    <PageHeading
                      eyebrow="HR"
                      title="Moje HR"
                      description="Vaše osobní agenda na jednom místě."
                    />
                    <div className="two-columns">
                      <IntegrationPlaceholder
                        title="Výplatní pásky"
                        icon={Wallet}
                        integration="WhoIS / úložiště pásek"
                        description="Po připojení se zde zobrazí vaše dostupné výplatní pásky a archiv. Způsob předávání dokumentů potvrdí správce UK."
                      />
                      <IntegrationPlaceholder
                        title="Docházka a dovolená"
                        icon={Clock3}
                        integration="EGJE / UIS"
                        description="Přehled odpracované doby, nepřítomností a nároků doplníme podle rozsahu dostupného rozhraní."
                      />
                    </div>
                    <div className="panel support-strip">
                      <CircleHelp size={23} />
                      <div>
                        <h3>Potřebujete vyřešit personální dotaz?</h3>
                        <p>
                          Vyzkoušejte podání dotazu v místním demonstračním
                          prostředí.
                        </p>
                      </div>
                      <button
                        className="button secondary"
                        onClick={() => setSupport(true)}
                      >
                        Odeslat dotaz <ArrowRight size={16} />
                      </button>
                    </div>
                    <RequestList requests={data.requests} />
                  </>
                )}
                {page === "meals" && (
                  <>
                    <PageHeading
                      eyebrow="HR"
                      title="Stravování"
                      description="Jídelníček a služby stravovacího portálu."
                    />
                    <IntegrationPlaceholder
                      title="Jídelní portál"
                      icon={Utensils}
                      integration="Čeká na propojení"
                      description="Aktuální nabídku jídel a možnost objednávání zpřístupníme po získání rozhraní a pravidel přihlášení. V této verzi nejsou načítány skutečné jídelníčky."
                    />
                  </>
                )}
                {page === "parking" && (
                  <>
                    <PageHeading
                      eyebrow="HR"
                      title="Parkování"
                      description="Informace k parkování a případným rezervacím."
                    />
                    <IntegrationPlaceholder
                      title="Parkovací služby"
                      icon={ParkingCircle}
                      integration="Čeká na podklady fakulty"
                      description="Správce fakulty doplní podmínky využívání míst a případný odkaz nebo rozhraní pro rezervace."
                    />
                  </>
                )}
                {page === "jobs" && (
                  <>
                    <PageHeading
                      eyebrow="HR"
                      title="Volná pracovní místa"
                      description="Příležitosti pro nové kolegy na fakultě."
                    />
                    <div className="panel">
                      <Empty
                        title="Nabídky zatím nebyly vloženy"
                        icon={BriefcaseBusiness}
                      >
                        Aktuální pracovní pozice doplní personální oddělení.
                        Způsob jejich načítání bude součástí dalšího propojení.
                      </Empty>
                    </div>
                  </>
                )}
                {page === "integrations" && (
                  <>
                    <PageHeading
                      eyebrow="IT"
                      title="Integrace systémů"
                      description="Přehled připravovaných propojení s univerzitními službami."
                    />
                    <div className="integration-grid">
                      {data.integrations.map((i) => (
                        <article className="panel integration-card" key={i.id}>
                          <span className="service-icon">
                            <Link2 size={23} />
                          </span>
                          <Status tone="amber">{i.status}</Status>
                          <h2>{i.name}</h2>
                          <strong>{i.purpose}</strong>
                          <p>{i.detail}</p>
                        </article>
                      ))}
                    </div>
                    <p className="notice">
                      Tento přehled popisuje stav první verze. Aplikace nyní
                      neposílá požadavky do systémů UK a neukládá jejich
                      přístupové údaje.
                    </p>
                  </>
                )}
                {page === "admin" && user.role === "admin" && (
                  <Admin data={data} onCompose={() => setCompose(true)} />
                )}
                {![
                  "home",
                  "integrations",
                  "admin",
                  ...services.map((s) => s.id),
                ].includes(page) && (
                  <Empty title="Stránka nebyla nalezena">
                    Vraťte se na{" "}
                    <button className="text-button" onClick={() => nav("home")}>
                      přehled portálu
                    </button>
                    .
                  </Empty>
                )}
              </>
            )
          )}
          <footer className="page-footer">
            <span>Fakulta humanitních studií · Univerzita Karlova</span>
            <button className="text-button" onClick={() => setSupport(true)}>
              Potřebujete pomoc? <ArrowRight size={14} />
            </button>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CircleHelp size={18} />
          {toast}
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Zavřít oznámení"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {selectedPost && (
        <Modal title="Sdělení fakulty" onClose={() => setSelectedPost(null)}>
          <div className="modal-content">
            <Status tone={selectedPost.important ? "red" : ""}>
              {selectedPost.category}
            </Status>
            <h2 className="article-title">{selectedPost.title}</h2>
            <p className="meta">
              {selectedPost.author} · {date(selectedPost.published_at)}
            </p>
            <p className="article-body">{selectedPost.body}</p>
            <div className="modal-actions">
              <button
                className="button secondary"
                disabled={user.readOnly}
                onClick={() =>
                  run(
                    mutate(
                      `/posts/${selectedPost.id}/like`,
                      { liked: !selectedPost.liked },
                      "Reakce byla upravena.",
                    ).then(() => setSelectedPost(null)),
                  )
                }
              >
                <Heart
                  size={17}
                  fill={selectedPost.liked ? "currentColor" : "none"}
                />
                {selectedPost.liked ? "Zrušit reakci" : "Líbí se mi"} (
                {selectedPost.likes})
              </button>
              {selectedPost.important && (
                <button
                  className="button primary"
                  disabled={!!selectedPost.acknowledged || user.readOnly}
                  onClick={() =>
                    run(
                      mutate(
                        `/posts/${selectedPost.id}/acknowledge`,
                        {},
                        "Potvrzení seznámení bylo uloženo.",
                      ).then(() => setSelectedPost(null)),
                    )
                  }
                >
                  <CheckCheck size={18} />
                  {selectedPost.acknowledged
                    ? "Seznámení potvrzeno"
                    : "Potvrdit seznámení"}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
      {compose && (
        <Modal title="Nové sdělení" onClose={() => setCompose(false)}>
          <Compose
            onSubmit={async (body) => {
              const result = await api<{ scheduled: boolean }>(
                "/posts",
                "POST",
                body,
              );
              await reload();
              setToast(
                result.scheduled
                  ? "Sdělení bylo naplánováno."
                  : "Sdělení bylo zveřejněno.",
              );
              setCompose(false);
            }}
          />
        </Modal>
      )}
      {support && (
        <Modal title="Podpora a podněty" onClose={() => setSupport(false)}>
          <RequestForm
            readOnly={user.readOnly}
            onSubmit={async (body) => {
              await mutate(
                "/requests",
                body,
                "Podnět byl uložen. Najdete ho v sekci Moje HR.",
              );
              setSupport(false);
            }}
          />
        </Modal>
      )}
      {info && (
        <Modal title="Jazyk portálu" onClose={() => setInfo(false)}>
          <div className="modal-content">
            <p>
              První verze je dostupná v češtině. Anglickou verzi ovládání a
              schválené překlady obsahu doplníme v další etapě.
            </p>
            <button className="button primary" onClick={() => setInfo(false)}>
              <Check size={17} />
              Čeština
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function Summary({
  icon: Icon,
  value,
  label,
  onClick,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="summary" onClick={onClick}>
      <span className="summary-icon">
        <Icon size={21} />
      </span>
      <div>
        <strong>{value.toString().padStart(2, "0")}</strong>
        <span>{label}</span>
      </div>
      <ChevronRight size={16} />
    </button>
  );
}
function Documents({ documents }: { documents: Doc[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Vše");
  const filtered = documents.filter(
    (d) =>
      (category === "Vše" || d.category === category) &&
      d.title.toLocaleLowerCase("cs").includes(query.toLocaleLowerCase("cs")),
  );
  return (
    <>
      <PageHeading
        eyebrow="HR"
        title="Dokumenty"
        description="Důležité podklady, návody a formuláře přehledně na jednom místě."
      />
      <div className="filter-bar">
        <div className="tabs">
          {["Vše", ...new Set(documents.map((d) => d.category))].map((c) => (
            <button
              className={category === c ? "selected" : ""}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="inline-search">
          <Search size={17} />
          <input
            aria-label="Hledat dokument"
            placeholder="Hledat dokument…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <div className="panel document-list">
        <div className="document-table-head">
          <span>Název dokumentu</span>
          <span>Aktualizováno</span>
          <span>Stažení</span>
        </div>
        {filtered.map((d) => (
          <div className="document-row" key={d.id}>
            <span className="doc-icon">
              <FileText size={23} />
            </span>
            <div>
              <strong>{d.title}</strong>
              <span>{d.category} · Ukázkový dokument · TXT</span>
            </div>
            <span className="doc-date">{date(d.updated)}</span>
            <a
              className="icon-button"
              href={documentUrl(d.id)}
                      download
              aria-label={`Stáhnout ${d.title}`}
            >
              <ArrowDownToLine size={19} />
            </a>
          </div>
        ))}
        {filtered.length === 0 && (
          <Empty title="Žádné dokumenty">
            Změňte kategorii nebo hledaný výraz.
          </Empty>
        )}
      </div>
    </>
  );
}
const guideTopics = [
  {
    title: "Jsem na fakultě nový",
    icon: Sparkles,
    description: "První den, kontakty a přístupy",
    body: "Začněte u svého pracoviště a personálního oddělení. Domluvte si předání vybavení a potřebných přístupů s IT. Ve složce Dokumenty najdete ukázkový návod První kroky na fakultě.",
  },
  {
    title: "Životní situace",
    icon: Heart,
    description: "Rodičovství, péče a další změny",
    body: "Pro individuální řešení rodičovství, péče o blízké nebo změny pracovního vztahu kontaktujte personální oddělení. Schválené postupy a formuláře doplní fakulta.",
  },
  {
    title: "Informace podle témat",
    icon: BookOpen,
    description: "Personalistika, IT a provoz",
    body: "Dokumenty jsou členěny do kategorií. Pracovní kontakty najdete v sekci Lidé a pracoviště, technické informace v sekci Integrace systémů.",
  },
  {
    title: "Odchod ze zaměstnání",
    icon: BriefcaseBusiness,
    description: "Předání agendy a uzavření přístupů",
    body: "Postup předání agendy, vybavení a dokumentů domluvte se svým vedoucím a personálním oddělením. Odebrání přístupů musí být koordinováno se správci příslušných služeb.",
  },
];
function Guide() {
  const [topic, setTopic] = useState<number | null>(null);
  return (
    <>
      <PageHeading
        eyebrow="HR"
        title="Průvodce zaměstnance"
        description="Praktické informace pro každou etapu vašeho působení na fakultě."
      />
      <div className="guide-grid">
        {guideTopics.map((t, i) => (
          <button
            className="guide-card panel"
            key={t.title}
            onClick={() => setTopic(i)}
          >
            <span className="guide-icon">
              <t.icon size={26} />
            </span>
            <h2>{t.title}</h2>
            <p>{t.description}</p>
            <span className="text-button">
              Otevřít téma <ArrowRight size={17} />
            </span>
          </button>
        ))}
      </div>
      <div className="notice">
        Obsah průvodce je ukázkový. Závazné informace a vlastníky jednotlivých
        témat doplní fakulta.
      </div>
      {topic !== null && (
        <Modal title={guideTopics[topic].title} onClose={() => setTopic(null)}>
          <div className="modal-content">
            <p>{guideTopics[topic].body}</p>
            <button
              className="button primary"
              onClick={() => {
                setTopic(null);
                nav("documents");
              }}
            >
              Přejít k dokumentům <ArrowRight size={17} />
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function PollCard({
  readOnly = false,
  poll,
  onVote,
}: {
  poll: Poll;
  readOnly?: boolean;
  onVote: (option: number) => Promise<void>;
}) {
  const [choice, setChoice] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const total = poll.counts.reduce((a, b) => a + b, 0);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (choice === null) return;
    setBusy(true);
    try {
      await onVote(choice);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel poll-card">
      <Status tone="red">
        {poll.voted === null ? "Otevřená anketa" : "Váš hlas byl uložen"}
      </Status>
      <h2>{poll.question}</h2>
      <p className="muted">
        Hlasovat můžete do {date(poll.closes_at)}. Výsledky jsou zobrazené
        souhrnně.
      </p>
      <form onSubmit={submit}>
        <fieldset disabled={poll.voted !== null || busy || readOnly}>
          <legend className="sr-only">Vyberte jednu odpověď</legend>
          {poll.options.map((o, i) => (
            <label
              className={`poll-option ${choice === i || poll.voted === i ? "chosen" : ""}`}
              key={o}
            >
              {poll.voted === null ? (
                <input
                  type="radio"
                  name={`poll${poll.id}`}
                  checked={choice === i}
                  onChange={() => setChoice(i)}
                />
              ) : (
                <Check
                  size={18}
                  className={poll.voted === i ? "" : "invisible"}
                />
              )}
              <span>
                {o}
                {poll.voted !== null && (
                  <span className="poll-track">
                    <span
                      style={{
                        width: `${total ? (poll.counts[i] / total) * 100 : 0}%`,
                      }}
                    />
                  </span>
                )}
              </span>
              {poll.voted !== null && (
                <strong>
                  {total ? Math.round((poll.counts[i] / total) * 100) : 0} %
                </strong>
              )}
            </label>
          ))}
        </fieldset>
        {poll.voted === null && (
          <button
            className="button primary"
            disabled={choice === null || busy || readOnly}
          >
            {busy ? "Ukládání…" : "Odeslat hlas"}
            <ArrowRight size={17} />
          </button>
        )}
      </form>
      <p className="small muted">
        {total}{" "}
        {total === 1 ? "hlas" : total >= 2 && total <= 4 ? "hlasy" : "hlasů"} ·
        V demonstrační verzi se hlas ukládá s vazbou na účet kvůli zabránění
        opakovanému hlasování. Anonymní režim zde zatím není implementován.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </section>
  );
}
function Trust({
  onSubmit,
  readOnly = false,
}: {
  onSubmit: (body: string) => Promise<void>;
  readOnly?: boolean;
}) {
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(body);
      setBody("");
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="MANAGEMENT"
        title="Schránka důvěry"
        description="Prostor pro podněty, které si zaslouží diskrétní zacházení."
      />
      <div className="panel trust-panel">
        <span className="empty-icon">
          <ShieldCheck size={30} />
        </span>
        {sent ? (
          <>
            <h2>Děkujeme za váš podnět</h2>
            <p>
              Podnět byl uložen v místní demonstrační databázi a je dostupný
              pouze profilu správce.
            </p>
            <button className="button secondary" onClick={() => setSent(false)}>
              Napsat další podnět
            </button>
          </>
        ) : (
          <>
            <h2>Co nám chcete sdělit?</h2>
            <p>
              V tomto demu se k podnětu neukládá uživatelský identifikátor.
              Přihlášení a infrastruktura však zpracovávají provozní údaje.
              Nevkládejte skutečné citlivé informace.
            </p>
            <form onSubmit={submit}>
              <label>
                Váš podnět
                <textarea
                  required
                  minLength={20}
                  maxLength={4000}
                  rows={7}
                  disabled={readOnly}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Popište situaci a případně navrhněte řešení…"
                />
              </label>
              <div className="form-footer">
                <span className="small muted">{body.length} / 4 000 znaků</span>
                <button className="button primary" disabled={busy || readOnly}>
                  {busy ? "Ukládání…" : "Odeslat podnět"}
                  <ArrowRight size={17} />
                </button>
              </div>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </>
  );
}
function People({ contacts }: { contacts: Contact[] }) {
  const [tab, setTab] = useState("Kontakty");
  return (
    <>
      <PageHeading
        eyebrow="HR"
        title="Lidé a pracoviště"
        description="Najděte správné pracoviště pro svůj dotaz."
      />
      <div className="tabs standalone">
        {["Kontakty", "Organizační struktura"].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="notice">
        Ukázkový přehled pracovišť. Jména, kontaktní údaje a skutečnou strukturu
        doplní synchronizace WhoIS.
      </p>
      {tab === "Kontakty" ? (
        <div className="contact-grid">
          {contacts.map((c) => (
            <article className="panel contact-card" key={c.id}>
              <span className="contact-avatar">{c.initials}</span>
              <Status>{c.department}</Status>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              <span className="small muted">
                Kontakt čeká na import z WhoIS
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel organization">
          <Building2 size={29} />
          <h2>Fakulta humanitních studií</h2>
          <p className="muted">Ilustrační členění pro demonstraci zobrazení</p>
          <div className="org-branches">
            {["Vedení fakulty", "Děkanát", "Provoz fakulty"].map((d) => (
              <div key={d}>
                <strong>{d}</strong>
                {contacts
                  .filter((c) => c.department === d)
                  .map((c) => (
                    <span key={c.id}>{c.name}</span>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
function Benefits() {
  return (
    <>
      <PageHeading
        eyebrow="HR"
        title="Benefity"
        description="Výhody a možnosti pro zaměstnance fakulty."
      />
      <div className="guide-grid">
        {[
          {
            icon: Utensils,
            title: "Stravování",
            body: "Podmínky příspěvku a dostupné služby doplní fakulta.",
            page: "meals",
          },
          {
            icon: BookOpen,
            title: "Vzdělávání a rozvoj",
            body: "Přehled vzdělávacích možností a podmínky účasti čekají na doplnění.",
            page: "guide",
          },
        ].map((b) => (
          <button
            className="panel guide-card"
            key={b.title}
            onClick={() => nav(b.page)}
          >
            <span className="guide-icon">
              <b.icon size={26} />
            </span>
            <h2>{b.title}</h2>
            <p>{b.body}</p>
            <span className="text-button">
              Zobrazit související informace <ArrowRight size={16} />
            </span>
          </button>
        ))}
      </div>
      <p className="notice">
        Ukázkové kategorie. Nároky ani finanční částky nejsou v této verzi
        stanoveny.
      </p>
    </>
  );
}
function IntegrationPlaceholder({
  title,
  icon: Icon,
  integration,
  description,
}: {
  title: string;
  icon: LucideIcon;
  integration: string;
  description: string;
}) {
  return (
    <div className="panel integration-placeholder">
      <span className="empty-icon">
        <Icon size={31} />
      </span>
      <Status tone="amber">{integration}</Status>
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="text-button" onClick={() => nav("integrations")}>
        Zobrazit stav integrací <ArrowRight size={16} />
      </button>
    </div>
  );
}
function RequestList({ requests }: { requests: Request[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Moje podané podněty</h2>
        <Status>{requests.length}</Status>
      </div>
      {requests.length ? (
        requests.map((r) => (
          <details className="request-row" key={r.id}>
            <summary>
              <div>
                <strong>{r.subject}</strong>
                <span>
                  {r.kind} · {date(r.created_at)}
                </span>
              </div>
              <Status>{r.status}</Status>
            </summary>
            <p>{r.body}</p>
          </details>
        ))
      ) : (
        <Empty title="Zatím tu nejsou žádné podněty" icon={MessageSquare}>
          Odeslané dotazy a návrhy zde zůstanou dostupné.
        </Empty>
      )}
    </section>
  );
}
function RequestForm({
  onSubmit,
  readOnly = false,
}: {
  readOnly?: boolean;
  onSubmit: (body: unknown) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await onSubmit(Object.fromEntries(f));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <form className="modal-content form-stack" onSubmit={submit}>
      <p className="notice">
        Podání se ukládá lokálně do této ukázky. Zpráva se neodesílá pracovníkům
        fakulty.
      </p>
      <label>
        Typ podnětu
        <select name="kind" disabled={readOnly}>
          <option>Dotaz na HR</option>
          <option>Zlepšovací návrh</option>
          <option>Podpora portálu</option>
        </select>
      </label>
      <label>
        Předmět
        <input
          disabled={readOnly}
          name="subject"
          required
          minLength={3}
          maxLength={150}
          placeholder="Čeho se váš podnět týká?"
        />
      </label>
      <label>
        Zpráva
        <textarea
          disabled={readOnly}
          name="body"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          placeholder="Popište svůj dotaz nebo návrh…"
        />
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy || readOnly}>
        {busy ? "Ukládání…" : "Odeslat podnět"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
function Compose({ onSubmit }: { onSubmit: (body: unknown) => Promise<void> }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await onSubmit({
        ...Object.fromEntries(f),
        important: f.get("important") === "on",
      });
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <form className="modal-content form-stack" onSubmit={submit}>
      <label>
        Název sdělení
        <input
          name="title"
          required
          minLength={3}
          maxLength={150}
          placeholder="Stručný a výstižný nadpis"
        />
      </label>
      <label>
        Text sdělení
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={10000}
          rows={5}
          placeholder="Co potřebují zaměstnanci vědět?"
        />
      </label>
      <div className="two-columns">
        <label>
          Kategorie
          <select name="category">
            <option>Fakulta</option>
            <option>Pro zaměstnance</option>
            <option>Ze života FHS</option>
          </select>
        </label>
        <label>
          Příjemci
          <select name="audience">
            <option value="all">Všichni zaměstnanci</option>
            <option value="Děkanát FHS">Děkanát FHS</option>
          </select>
        </label>
      </div>
      <label>
        Zveřejnit později{" "}
        <span className="muted small">(nepovinné, místní čas)</span>
        <input name="publishedAt" type="datetime-local" />
      </label>
      <label className="checkbox-label">
        <input name="important" type="checkbox" />
        Vyžadovat potvrzení seznámení
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Ukládání…" : "Uložit sdělení"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
function Admin({ data, onCompose }: { data: Data; onCompose: () => void }) {
  const [stats, setStats] = useState<Record<string, number>>();
  const [reports, setReports] =
    useState<{ id: number; body: string; created_at: string }[]>();
  const [error, setError] = useState("");
  useEffect(() => {
    api<Record<string, number>>("/admin/stats")
      .then(setStats)
      .catch((e) => setError(e.message));
  }, [data]);
  return (
    <>
      <PageHeading
        eyebrow="IT · ADMINISTRACE"
        title="Správa portálu"
        description="Publikování obsahu a přehled aktivity v demonstračním prostředí."
        action={
          <button className="button primary" onClick={onCompose}>
            <Plus size={17} />
            Nové sdělení
          </button>
        }
      />
      {stats && (
        <div className="summary-grid">
          {[
            [stats.posts, "Sdělení"],
            [stats.acknowledgments, "Potvrzení seznámení"],
            [stats.reactions, "Reakce"],
            [stats.scheduled, "Naplánovaná sdělení"],
          ].map(([value, label]) => (
            <div className="summary" key={label}>
              <span className="summary-icon">
                <ChartNoAxesCombined size={21} />
              </span>
              <div>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="panel admin-section">
        <h2>Schránka důvěry</h2>
        <p className="muted">
          Přístup k této části ověřuje backend podle role správce.
        </p>
        <button
          className="button secondary"
          onClick={() =>
            api<{ id: number; body: string; created_at: string }[]>(
              "/admin/trust",
            )
              .then(setReports)
              .catch((e) => setError(e.message))
          }
        >
          <ShieldCheck size={17} />
          Načíst podněty
        </button>
        {reports &&
          (reports.length ? (
            reports.map((r) => (
              <div className="report" key={r.id}>
                <span className="meta">
                  Podnět #{r.id} · {date(r.created_at)}
                </span>
                <p>{r.body}</p>
              </div>
            ))
          ) : (
            <p>Schránka zatím neobsahuje žádné podněty.</p>
          ))}
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="notice">
        Zprávy s budoucím datem zveřejnění se zaměstnancům zobrazí až v určený
        čas. Statistiky v této verzi zachycují potvrzení a reakce.
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
