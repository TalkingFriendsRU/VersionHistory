const apps=[
{name:"Говорящий Том: Бег за золотом",developer:"Outfit7",type:"game",date:"2013-06-12",platforms:["android","ios"],icon:"🎮"},
{name:"Мой Говорящий Том: Друзья 2",developer:"Outfit7",type:"game",date:"2025-08-15",platforms:["android","ios"],icon:"🐱"},
{name:"Говорящий Том и Друзья: Мир",developer:"Outfit7",type:"game",date:"2026-02-20",platforms:["android"],icon:"🌍"},
{name:"Telegram",developer:"Telegram FZ-LLC",type:"app",date:"2013-08-14",platforms:["android","ios"],icon:"✈️"},
{name:"YouTube",developer:"Google LLC",type:"app",date:"2010-12-21",platforms:["android","ios"],icon:"▶️"},
{name:"Google Maps",developer:"Google LLC",type:"app",date:"2005-02-08",platforms:["android","ios"],icon:"🗺️"}
];

let type="all";
const $=id=>document.getElementById(id);
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");type=b.dataset.type;render()});
["search","platform","sort","date"].forEach(id=>$(id).addEventListener(id==="search"?"input":"change",render));

function render(){
 const q=$("search").value.toLowerCase().trim(), p=$("platform").value, s=$("sort").value, d=$("date").value;
 let list=apps.filter(a=>(type==="all"||a.type===type)&&(!q||a.name.toLowerCase().includes(q))&&(p==="all"||a.platforms.includes(p)));
 const now=new Date("2026-09-18");
 if(d!=="all"){const days=d==="year"?365:1095;list=list.filter(a=>(now-new Date(a.date))/86400000<=days)}
 list.sort((a,b)=>s==="az"?a.name.localeCompare(b.name,"ru"):s==="za"?b.name.localeCompare(a.name,"ru"):s==="old"?new Date(a.date)-new Date(b.date):new Date(b.date)-new Date(a.date));
 $("count").textContent=list.length+" "+(list.length===1?"результат":"результатов");
 $("grid").innerHTML=list.length?list.map(a=>`<article class="card" onclick="openApp('${a.name.replaceAll("'","\\'")}')"><div class="app-top"><div class="app-icon">${a.icon}</div><div><h3>${a.name}</h3><div class="developer">${a.developer}</div></div></div><div class="meta"><span>📅 ${new Date(a.date).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",year:"numeric"})}</span><span class="platforms">${a.platforms.includes("android")?"Google Play":""}${a.platforms.length>1?" · ":""}${a.platforms.includes("ios")?"App Store":""}</span></div></article>`).join(""):'<div class="empty">Ничего не найдено.<br>Попробуйте изменить поиск или фильтры.</div>';
}
function openApp(name){alert("Страница «"+name+"» — здесь будет полная история версий, включая versionCode для Google Play.");}
$("theme").onclick=()=>{document.body.classList.toggle("light");$("theme").textContent=document.body.classList.contains("light")?"☀":"☾"};
render();