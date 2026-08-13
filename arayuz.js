/* ---------------- kişiye özel sıralama (localStorage) ---------------- */
function siraOku(){
  try { const v = JSON.parse(localStorage.getItem("tys_sira") || "null"); return v && v.tesisler ? v : { tesisler: [], makineler: {} }; }
  catch(e){ return { tesisler: [], makineler: {} }; }
}
function siraYaz(sira){ try { localStorage.setItem("tys_sira", JSON.stringify(sira)); } catch(e){} }
function siraliListe(idler, kayitliSira){
  const kayitliVarOlanlar = (kayitliSira || []).filter(id => idler.includes(id));
  const eksikler = idler.filter(id => !kayitliVarOlanlar.includes(id));
  return [...kayitliVarOlanlar, ...eksikler];
}
function siraliTesisler(){
  const sira = siraOku();
  const idler = erisilenTesisler().map(t => t.id);
  const idSirasi = siraliListe(idler, sira.tesisler);
  const harita = {}; state.tesisler.forEach(t => harita[t.id] = t);
  return idSirasi.map(id => harita[id]).filter(Boolean);
}
function siraliMakineler(tesisId, makineler){
  const sira = siraOku();
  const idler = makineler.map(m => m.id);
  const idSirasi = siraliListe(idler, sira.makineler ? sira.makineler[tesisId] : []);
  const harita = {}; makineler.forEach(m => harita[m.id] = m);
  return idSirasi.map(id => harita[id]).filter(Boolean);
}
function siralamaModuAcKapat(){ ui.siralaModu = !ui.siralaModu; render(); }
function tesisTasi(tesisId, yon){
  const sira = siraOku();
  const liste = siraliListe(erisilenTesisler().map(t => t.id), sira.tesisler);
  const i = liste.indexOf(tesisId), j = i + yon;
  if (i < 0 || j < 0 || j >= liste.length) return;
  [liste[i], liste[j]] = [liste[j], liste[i]];
  sira.tesisler = liste;
  siraYaz(sira); render();
}
function makineTasi(tesisId, makineId, yon){
  const t = state.tesisler.find(x => x.id === tesisId); if (!t) return;
  const sira = siraOku();
  if (!sira.makineler) sira.makineler = {};
  const liste = siraliListe(t.makineler.map(m => m.id), sira.makineler[tesisId]);
  const i = liste.indexOf(makineId), j = i + yon;
  if (i < 0 || j < 0 || j >= liste.length) return;
  [liste[i], liste[j]] = [liste[j], liste[i]];
  sira.makineler[tesisId] = liste;
  siraYaz(sira); render();
}
function yaziOlcegiOku(){ try { return parseInt(localStorage.getItem("tys_yazi_olcek") || "100", 10); } catch(e){ return 100; } }

/* ---------------- sürükle-bırak sıralama ---------------- */
let surukleTesisId = null;
function tesisSurukleBasla(e, tesisId){ surukleTesisId = tesisId; try { e.dataTransfer.effectAllowed = "move"; } catch(err){} }
function tesisSurukleBirak(e, hedefTesisId){
  e.preventDefault(); e.stopPropagation();
  if (!surukleTesisId || surukleTesisId === hedefTesisId) { surukleTesisId = null; return; }
  const sira = siraOku();
  const liste = siraliListe(erisilenTesisler().map(t => t.id), sira.tesisler);
  const kaynakIdx = liste.indexOf(surukleTesisId), hedefIdx = liste.indexOf(hedefTesisId);
  const kaynakId = surukleTesisId;
  surukleTesisId = null;
  if (kaynakIdx === -1 || hedefIdx === -1) return;
  liste.splice(kaynakIdx, 1);
  liste.splice(hedefIdx, 0, kaynakId);
  sira.tesisler = liste;
  siraYaz(sira); render();
}
let surukleMakineId = null;
function makineSurukleBasla(e, makineId){ e.stopPropagation(); surukleMakineId = makineId; try { e.dataTransfer.effectAllowed = "move"; } catch(err){} }
function makineSurukleBirak(e, tesisId, hedefMakineId){
  e.preventDefault(); e.stopPropagation();
  if (!surukleMakineId || surukleMakineId === hedefMakineId) { surukleMakineId = null; return; }
  const t = state.tesisler.find(x => x.id === tesisId); if (!t) { surukleMakineId = null; return; }
  const sira = siraOku();
  if (!sira.makineler) sira.makineler = {};
  const liste = siraliListe(t.makineler.map(m => m.id), sira.makineler[tesisId]);
  const kaynakIdx = liste.indexOf(surukleMakineId), hedefIdx = liste.indexOf(hedefMakineId);
  const kaynakId = surukleMakineId;
  surukleMakineId = null;
  if (kaynakIdx === -1 || hedefIdx === -1) return;
  liste.splice(kaynakIdx, 1);
  liste.splice(hedefIdx, 0, kaynakId);
  sira.makineler[tesisId] = liste;
  siraYaz(sira); render();
}
function yaziOlcegiUygula(deger){
  const oran = deger / 100;
  document.documentElement.style.zoom = oran;
  try { localStorage.setItem("tys_yazi_olcek", String(deger)); } catch(e){}
}
function yaziOlcegiDegisti(deger){
  const el = document.getElementById("yaziOlcekDeger");
  if (el) el.textContent = deger + "%";
  yaziOlcegiUygula(deger);
}

/* ---------------- tema ---------------- */
function temaOku(){ try { return localStorage.getItem("tys_tema") || "koyu"; } catch(e){ return "koyu"; } }
function temaUygula(tema){
  document.body.classList.toggle("acik-tema", tema === "acik");
  try { localStorage.setItem("tys_tema", tema); } catch(e){}
}
function temaDegistir(acikMi){
  temaUygula(acikMi ? "acik" : "koyu");
}
function lambaGuncelle(){
  const btn = document.getElementById("lambaBtn");
  const acikMi = temaOku() === "acik";
  if (btn) btn.classList.toggle("yanik", acikMi);
  const ikon = document.getElementById("lambaIkon");
  if (ikon) ikon.textContent = acikMi ? "☀️" : "🌙";
  btn?.setAttribute("title", acikMi ? "Açık Tema — değiştirmek için tıklayın" : "Koyu Tema — değiştirmek için tıklayın");
}

function lambaTikla(){
  temaDegistir(temaOku() !== "acik");
  lambaGuncelle();
  logoGuncelle();
  const btn = document.getElementById("lambaBtn");
  if (btn) {
    btn.classList.remove("sallaniyor");
    void btn.offsetWidth;
    btn.classList.add("sallaniyor");
  }
}

function mobilMi(){ return window.innerWidth <= 900; }
function mobilSolAcKapat(){
  const sol = document.getElementById("solMenu");
  const sag = document.getElementById("sagMenu");
  const bg = document.getElementById("mobilArkaplan");
  if (!sol) return;
  const acilacak = !sol.classList.contains("mobilAcik");
  if (sag) sag.classList.remove("mobilAcik");
  sol.classList.toggle("mobilAcik", acilacak);
  if (bg) bg.classList.toggle("aktif", acilacak);
}
function mobilSagAcKapat(){
  const sol = document.getElementById("solMenu");
  const sag = document.getElementById("sagMenu");
  const bg = document.getElementById("mobilArkaplan");
  if (!sag) return;
  const acilacak = !sag.classList.contains("mobilAcik");
  if (sol) sol.classList.remove("mobilAcik");
  sag.classList.toggle("mobilAcik", acilacak);
  if (bg) bg.classList.toggle("aktif", acilacak);
}
function mobilMenuleriKapat(){
  const sol = document.getElementById("solMenu");
  const sag = document.getElementById("sagMenu");
  const bg = document.getElementById("mobilArkaplan");
  if (sol) sol.classList.remove("mobilAcik");
  if (sag) sag.classList.remove("mobilAcik");
  if (bg) bg.classList.remove("aktif");
}
