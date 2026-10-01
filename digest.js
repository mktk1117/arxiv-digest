// ホームページと共通の枠（ナビ・フッター・ダーク表示）と、日本語 / English の切り替え。
// index.html と paper.html の両方が読む。ページ側は Digest.onLang(render) で描き直しを登録する。
(() => {
  const SITE = "/";  // takahiromiki.com のトップ（GitHub Pages の同じホスト）
  const NAV = [
    ["Home", ""], ["Projects", "projects.html"], ["Papers", "papers.html"],
    ["CV", "cv.html"], ["Gallery", "gallery.html"],
  ];
  const FOOT = [
    ["Google Scholar", "https://scholar.google.com/citations?user=nOl83tYAAAAJ&hl=en"],
    ["GitHub", "https://github.com/mktk1117"],
    ["X / Twitter", "https://twitter.com/ki_ki_ki1"],
    ["YouTube", "https://www.youtube.com/@takahiromiki8642"],
  ];
  // ホームページの日本語版は /ja/ の下にある
  const NAV_JA = { Home: "ホーム", Projects: "プロジェクト", Papers: "論文", CV: "CV", Gallery: "ギャラリー" };
  const KEY = "digest-lang";
  const root = document.documentElement;
  const listeners = [];

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // 優先順: URL の ?lang= → 前回選んだ言語 → ブラウザの言語
  function initialLang() {
    const q = new URLSearchParams(location.search).get("lang");
    if (q === "ja" || q === "en") return q;
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "ja" || saved === "en") return saved;
    } catch (e) {}
    return (navigator.languages || [navigator.language || ""]).some((l) => /^ja\b/i.test(l)) ? "ja" : "en";
  }

  const Digest = {
    lang: initialLang(),
    esc,
    // { ja: "...", en: "..." } から今の言語の文字列を選ぶ
    t: (pair) => pair[Digest.lang] ?? pair.ja,
    onLang(fn) { listeners.push(fn); },
    setLang(lang) {
      if (lang === Digest.lang) return;
      Digest.lang = lang;
      try { localStorage.setItem(KEY, lang); } catch (e) {}
      const url = new URL(location.href);
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url);
      apply();
      listeners.forEach((fn) => fn(lang));
    },
    // 同じ言語のまま別ページへ行くリンク
    href(path) {
      const [base, hash] = path.split("#");
      const sep = base.includes("?") ? "&" : "?";
      return `${base}${sep}lang=${Digest.lang}${hash ? `#${hash}` : ""}`;
    },
  };
  window.Digest = Digest;

  function apply() {
    root.lang = Digest.lang;
    for (const b of document.querySelectorAll(".lang button"))
      b.setAttribute("aria-pressed", String(b.dataset.lang === Digest.lang));
    for (const el of document.querySelectorAll("[data-ja]"))
      el.textContent = Digest.lang === "en" ? el.dataset.en : el.dataset.ja;
    for (const a of document.querySelectorAll(".nav a[data-page]"))
      a.href = `${SITE}${Digest.lang === "ja" ? "ja/" : ""}${a.dataset.page}`;
    for (const el of document.querySelectorAll("[data-ja-placeholder]"))
      el.placeholder = Digest.lang === "en" ? el.dataset.enPlaceholder : el.dataset.jaPlaceholder;
  }

  function chrome() {
    const nav = document.createElement("nav");
    nav.className = "nav";
    nav.setAttribute("aria-label", "Main");
    nav.innerHTML = `
      <a class="name" href="${SITE}" data-page="" data-ja="三木 崇弘" data-en="Takahiro Miki">Takahiro Miki</a>
      <button class="menu-btn mono" type="button" aria-expanded="false" aria-label="Menu" data-ja="メニュー" data-en="Menu">Menu</button>
      <ul>${NAV.map(([t, f]) => `<li><a href="${SITE}${f}" data-page="${f}" data-ja="${NAV_JA[t]}" data-en="${t}">${t}</a></li>`).join("")}
        <li><a href="./" aria-current="page" data-ja="ダイジェスト" data-en="Digest">Digest</a></li></ul>
      <div class="nav-tools">
        <div class="lang" role="group" aria-label="Language">
          <button type="button" data-lang="en" aria-pressed="false">EN</button>
          <button type="button" data-lang="ja" aria-pressed="false">日本語</button>
        </div>
        <button class="mode-btn" type="button" aria-label="Switch to dark mode">
          <svg class="moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
          <svg class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
        </button>
      </div>`;
    document.body.prepend(nav);

    const footer = document.createElement("footer");
    footer.className = "mono";
    footer.innerHTML = `<span data-ja="© 三木崇弘 · ロボティクス研究" data-en="© Takahiro Miki · Robotics research">© Takahiro Miki · Robotics research</span>
      <span class="foot-links">${FOOT.map(([t, u]) => `<a href="${esc(u)}">${esc(t)}</a>`).join("")}</span>`;
    document.body.append(footer);

    const menu = nav.querySelector(".menu-btn");
    menu.addEventListener("click", () => {
      menu.setAttribute("aria-expanded", String(nav.classList.toggle("open")));
    });
    nav.querySelector(".lang").addEventListener("click", (ev) => {
      const b = ev.target.closest("button[data-lang]");
      if (b) Digest.setLang(b.dataset.lang);
    });

    // ダーク表示はホームページと同じキー（同じホストなので選択が共有される）
    const mode = nav.querySelector(".mode-btn");
    const sync = () => mode.setAttribute("aria-label",
      root.dataset.mode === "dark" ? "Switch to light mode" : "Switch to dark mode");
    mode.addEventListener("click", () => {
      const dark = root.dataset.mode !== "dark";
      if (dark) root.setAttribute("data-mode", "dark"); else root.removeAttribute("data-mode");
      try { localStorage.setItem("tm2-mode", dark ? "dark" : "light"); } catch (e) {}
      sync();
    });
    sync();
  }

  chrome();
  apply();
})();
