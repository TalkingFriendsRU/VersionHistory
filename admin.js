(() => {
  let data = {apps:[]}, editingId = null;

  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

  async function init(){
    try {
      const r = await fetch("./data.json?ts="+Date.now(), {cache:"no-store"});
      if(!r.ok) throw new Error("HTTP "+r.status);
      data = await r.json();
    } catch(e) {
      data = {apps:[]};
    }
    bind();
    renderList();
  }

  function bind(){
    $("newApp").onclick = () => openEditor();
    $("cancel").onclick = $("cancel2").onclick = closeEditor;
    $("save").onclick = saveEditor;
    $("addAndroid").onclick = () => addVersion("android");
    $("addIos").onclick = () => addVersion("ios");
    $("download").onclick = downloadData;
    $("upload").onchange = importData;
  }

  function renderList(){
    const root = $("adminList");
    if(!data.apps.length){
      root.innerHTML = '<div class="empty">Каталог пуст. Нажми «Новое приложение».</div>';
      return;
    }
    root.innerHTML = data.apps.map(x => `
      <div class="admin-item">
        <div class="miniicon">${esc(x.icon||"📦")}</div>
        <div class="info"><strong>${esc(x.name)}</strong><small>${esc(x.developer||"—")} · ${x.type==="game"?"Игра":"Приложение"}</small></div>
        <div class="item-actions">
          <button onclick="window.editApp('${esc(x.id)}')">Изменить</button>
          <button class="danger" onclick="window.deleteApp('${esc(x.id)}')">Удалить</button>
        </div>
      </div>`).join("");
  }

  window.editApp = id => {
    const x = data.apps.find(a=>a.id===id);
    if(x) openEditor(x);
  };

  window.deleteApp = id => {
    const x = data.apps.find(a=>a.id===id);
    if(!x) return;
    if(confirm("Удалить «"+x.name+"»?")){
      data.apps = data.apps.filter(a=>a.id!==id);
      renderList();
    }
  };

  function openEditor(x=null){
    editingId = x?.id || null;
    $("editorTitle").textContent = x ? "Редактирование приложения" : "Новое приложение";
    $("name").value = x?.name || "";
    $("developer").value = x?.developer || "";
    $("type").value = x?.type || "game";
    $("releaseDate").value = x?.releaseDate || "";
    $("icon").value = x?.icon || "📦";
    renderRows("android", x?.versions?.android || []);
    renderRows("ios", x?.versions?.ios || []);
    $("editor").classList.remove("hidden");
    $("editor").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function closeEditor(){
    $("editor").classList.add("hidden");
    editingId = null;
  }

  function renderRows(platform, rows){
    const root = $(platform+"Rows");
    root.innerHTML = rows.map((z,i)=>rowHtml(platform,z,i)).join("");
  }

  function rowHtml(platform,z={},i=0){
    const code = platform==="android" ? `<label>Код версии<input data-field="versionCode" value="${esc(z.versionCode)}" inputmode="numeric"></label>` : `<label>Код версии<input value="—" disabled></label>`;
    return `<div class="version-row" data-platform="${platform}">
      <label>Версия<input data-field="version" value="${esc(z.version)}" placeholder="7.4.1"></label>
      ${code}
      <label>Дата<input data-field="date" type="date" value="${esc(z.date)}"></label>
      <label>Изменения<textarea data-field="changes" rows="2">${esc(z.changes)}</textarea></label>
      <button class="remove" type="button">×</button>
    </div>`;
  }

  function addVersion(platform){
    const root = $(platform+"Rows");
    const i = root.children.length;
    root.insertAdjacentHTML("beforeend", rowHtml(platform,{},i));
    root.lastElementChild.querySelector(".remove").onclick = e => e.currentTarget.parentElement.remove();
    if(root.children.length===1) root.lastElementChild.querySelector(".remove").onclick = e => e.currentTarget.parentElement.remove();
  }

  function collectRows(platform){
    return [...$(platform+"Rows").children].map(row => {
      const get = f => row.querySelector(`[data-field="${f}"]`)?.value.trim() || "";
      const obj = {version:get("version"), date:get("date"), changes:get("changes")};
      if(platform==="android") obj.versionCode = get("versionCode");
      return obj;
    }).filter(x=>x.version || x.date || x.changes || x.versionCode);
  }

  function saveEditor(){
    const name = $("name").value.trim();
    if(!name){ alert("Укажи название приложения."); return; }
    const item = {
      id: editingId || slugify(name),
      name,
      developer: $("developer").value.trim(),
      type: $("type").value,
      releaseDate: $("releaseDate").value,
      icon: $("icon").value.trim() || "📦",
      versions: {android:collectRows("android"),ios:collectRows("ios")}
    };
    const idx = data.apps.findIndex(a=>a.id===editingId);
    if(idx>=0) data.apps[idx]=item; else data.apps.push(item);
    renderList();
    closeEditor();
    alert("Сохранено в браузере. Теперь скачай data.json и замени им файл на GitHub.");
  }

  function slugify(s){
    return s.toLowerCase().replace(/ё/g,"e").replace(/[^a-z0-9а-я]+/gi,"-").replace(/^-+|-+$/g,"") || "app-"+Date.now();
  }

  function downloadData(){
    const blob = new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importData(e){
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const parsed = JSON.parse(reader.result);
        if(!Array.isArray(parsed.apps)) throw new Error("В JSON нет массива apps");
        data=parsed; renderList(); alert("data.json загружен.");
      }catch(err){ alert("Не удалось загрузить JSON: "+err.message); }
    };
    reader.readAsText(file);
    e.target.value="";
  }

  init();
})();