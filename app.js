(() => {
  const path = location.pathname;
  const isDetail = path.endsWith("/app.html") || path.endsWith("app.html");

  async function loadData() {
    const response = await fetch("./data.json?ts=" + Date.now(), {cache:"no-store"});
    if (!response.ok) throw new Error("data.json не найден (HTTP " + response.status + ")");
    return await response.json();
  }

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));

  const isImageIcon = (value) => /^(https?:\/\/|data:image\/)/i.test(String(value || "").trim())
    || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(String(value || "").trim());

  const iconHtml = (value) => {
    const v = String(value || "").trim();
    if (isImageIcon(v)) return `<img src="${esc(v)}" alt="" loading="lazy">`;
    return esc(v || "📦");
  };

  const formatDate = value => {
    if (!value) return "—";
    const d = new Date(value + "T00:00:00");
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("ru-RU");
  };

  if (!isDetail) {
    let DATA = null, type = "all";

    async function init() {
      try {
        DATA = await loadData();
        setup();
        render();
      } catch (e) {
        document.getElementById("count").textContent = "Ошибка загрузки";
        const err = document.getElementById("error");
        err.textContent = "Не удалось загрузить каталог: " + e.message;
        err.classList.remove("hidden");
      }
    }

    function render() {
      if (!DATA) return;
      const q = document.getElementById("search").value.trim().toLowerCase();
      const platform = document.getElementById("platform").value;
      const sort = document.getElementById("sort").value;

      let apps = DATA.apps.filter(x => {
        const nameMatch = (x.name || "").toLowerCase().includes(q);
        const typeMatch = type === "all" || x.type === type;
        const versions = x.versions || {android:[], ios:[]};
        const platformMatch = platform === "all" ||
          (platform === "android" && versions.android) ||
          (platform === "ios" && versions.ios);
        return nameMatch && typeMatch && platformMatch;
      });

      apps.sort((a,b) => {
        if (sort === "az") return a.name.localeCompare(b.name, "ru");
        if (sort === "za") return b.name.localeCompare(a.name, "ru");
        if (sort === "old") return (a.releaseDate || "").localeCompare(b.releaseDate || "");
        return (b.releaseDate || "").localeCompare(a.releaseDate || "");
      });

      document.getElementById("count").textContent =
        apps.length === 1 ? "1 приложение" :
        apps.length + " " + (apps.length >= 2 && apps.length <= 4 ? "приложения" : "приложений");

      const grid = document.getElementById("grid");
      if (!apps.length) {
        grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Ничего не найдено.<br>Попробуй изменить поиск или фильтры.</div>';
        return;
      }

      grid.innerHTML = apps.map(x => {
        const v = x.versions || {android:[],ios:[]};
        const platforms = [
          v.android?.length ? "Google Play" : "",
          v.ios?.length ? "App Store" : ""
        ].filter(Boolean).join(" · ") || "История версий пока не добавлена";
        return `<article class="card" onclick="location.href='./app.html?id=${encodeURIComponent(x.id)}'">
          <div class="appicon">${iconHtml(x.icon)}</div>
          <h3>${esc(x.name)}</h3>
          <p class="developer">${esc(x.developer || "—")}</p>
          <footer><span>📅 ${formatDate(x.releaseDate)}</span><span class="platforms">${esc(platforms)}</span></footer>
        </article>`;
      }).join("");
    }

    function setup() {
      document.querySelectorAll(".tab").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
          btn.classList.add("active");
          type = btn.dataset.type;
          render();
        });
      });
      document.getElementById("search").addEventListener("input", render);
      document.getElementById("platform").addEventListener("change", render);
      document.getElementById("sort").addEventListener("change", render);
    }
    init();
  } else {
    async function initDetail() {
      const root = document.getElementById("app");
      try {
        const data = await loadData();
        const id = new URLSearchParams(location.search).get("id");
        const x = data.apps.find(a => a.id === id);
        if (!x) {
          root.innerHTML = '<div class="empty">Приложение не найдено.<br><br><a class="back" href="./index.html">← Вернуться в каталог</a></div>';
          return;
        }
        const v = x.versions || {android:[],ios:[]};
        const years = [...new Set([...(v.android||[]), ...(v.ios||[])]
          .map(z => (z.date || "").slice(0,4))
          .filter(Boolean))].sort((a,b) => b.localeCompare(a));
        root.innerHTML = `
          <section class="app-hero">
            <div class="bigicon">${iconHtml(x.icon)}</div>
            <div><h1>${esc(x.name)}</h1><p>${esc(x.developer || "—")} · релиз ${formatDate(x.releaseDate)}</p></div>
          </section>
          <div class="switch">
            <button class="active" data-platform="android">Google Play</button>
            <button data-platform="ios">App Store</button>
          </div>
          <div class="control-grid" style="margin:16px 0">
            <label class="select-wrap">
              <span>Сортировка</span>
              <select id="versionSort">
                <option value="new">Сначала новые</option>
                <option value="old">Сначала старые</option>
              </select>
            </label>
            <label class="select-wrap">
              <span>Год</span>
              <select id="versionYear">
                <option value="all">Все годы</option>
                ${years.map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join("")}
              </select>
            </label>
          </div>
          <div id="versions"></div>`;
        let currentPlatform = "android";
        document.querySelectorAll(".switch button").forEach(btn => {
          btn.addEventListener("click", () => {
            document.querySelectorAll(".switch button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentPlatform = btn.dataset.platform;
            showVersions(currentPlatform, v);
          });
        });
        document.getElementById("versionSort").addEventListener("change", () => showVersions(currentPlatform, v));
        document.getElementById("versionYear").addEventListener("change", () => showVersions(currentPlatform, v));
        showVersions("android", v);
      } catch (e) {
        root.innerHTML = '<div class="error">Ошибка загрузки: ' + esc(e.message) + '</div>';
      }
    }

    function showVersions(platform, versions) {
      const original = versions[platform] || [];
      let list = original;
      const sortDir = document.getElementById("versionSort")?.value || "new";
      const yearFilter = document.getElementById("versionYear")?.value || "all";
      if (yearFilter !== "all") list = list.filter(z => (z.date || "").slice(0,4) === yearFilter);
      list = [...list].sort((a,b) => sortDir === "old"
        ? (a.date || "").localeCompare(b.date || "")
        : (b.date || "").localeCompare(a.date || ""));
      const title = platform === "android" ? "Google Play — история версий" : "App Store — история версий";
      const emptyMsg = original.length && !list.length
        ? "Нет версий за выбранный год."
        : "Версии пока не добавлены.";
      document.getElementById("versions").innerHTML =
        `<h2 style="margin:0 0 14px">${title}</h2>` +
        (list.length ? `<div class="version-list">${list.map(z => `
          <article class="version">
            <div class="version-top">
              <div><div class="version-number">Версия ${esc(z.version)}</div>
              ${platform === "android" && z.versionCode ? `<div class="version-meta">Код версии: ${esc(z.versionCode)}</div>` : ""}</div>
              <div class="version-date">${formatDate(z.date)}</div>
            </div>
            <p>${esc(z.changes || "Изменения не указаны.")}</p>
          </article>`).join("")}</div>` :
        `<div class="empty">${emptyMsg}</div>`);
    }
    initDetail();
  }
})();
