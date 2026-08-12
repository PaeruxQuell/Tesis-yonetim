/* ---------------- yardımcılar ---------------- */
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------------- genel onay modalı (silme / stok onayı) ---------------- */
let teyitState = null;
function teyitIste(baslik, aciklama, geriCagirFn){
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  teyitState = { cevap: a + b, fn: geriCagirFn };
  document.getElementById("teyitBaslik").textContent = baslik;
  document.getElementById("teyitMetin").textContent = aciklama;
  document.getElementById("teyitSoru").textContent = `${a} + ${b} = ?`;
  document.getElementById("teyitGirdi").value = "";
  document.getElementById("teyitHata").textContent = "";
  document.getElementById("teyitModal").style.display = "flex";
  setTimeout(() => document.getElementById("teyitGirdi").focus(), 50);
}
function modalKapat(){
  const modal = document.getElementById("teyitModal");
  modal.classList.add("modalKapaniyor");
  setTimeout(() => {
    modal.style.display = "none";
    modal.classList.remove("modalKapaniyor");
  }, 180);
}
function teyitIptal(){
  modalKapat();
  teyitState = null;
}
function teyitOnayla(){
  const girdi = document.getElementById("teyitGirdi");
  const deger = parseInt(girdi.value, 10);
  if (teyitState && deger === teyitState.cevap) {
    const fn = teyitState.fn;
    modalKapat();
    teyitState = null;
    fn();
  } else {
    document.getElementById("teyitHata").textContent = "Yanlış cevap, tekrar deneyin.";
    girdi.value = ""; girdi.focus();
  }
}
function silOnayla(baslik, geriCagirFn){
  teyitIste(baslik, "Bu kaydı silmek üzeresiniz. Onaylamak için işlemi çözün:", geriCagirFn);
}
const bugun = () => {
  const d = new Date(); const p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth()+1)}.${d.getFullYear()}`;
};
const suAn = () => {
  const d = new Date(); const p = n => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};
function esc(str){ return (str ?? "").toString().replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }
function toastGoster(mesaj, tip){
  const kapsayici = document.getElementById("toastKapsayici");
  if (!kapsayici) return;
  const toast = document.createElement("div");
  toast.className = "toast " + (tip === "hata" ? "toastHata" : "toastBasari");
  toast.innerHTML = `<span class="toastIkon">${tip === "hata" ? "⚠" : "✓"}</span><span>${esc(mesaj)}</span>`;
  kapsayici.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toastCik");
    setTimeout(() => toast.remove(), 300);
  }, 2400);
}
function tarihAyristir(str){
  if (!str) return null;
  const temiz = str.trim();
  const parcalar = temiz.split(/[.\/\-]/).map(x => x.trim()).filter(Boolean);
  if (parcalar.length !== 3) return null;
  let [g, a, y] = parcalar.map(x => parseInt(x, 10));
  if (parcalar[0].length === 4) { const t = g; g = y; y = t; } // yyyy-aa-gg gibi girilmişse çevir
  if (!g || !a || !y) return null;
  if (y < 100) y += 2000;
  const d = new Date(y, a - 1, g);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() !== y || d.getMonth() !== a - 1 || d.getDate() !== g) return null;
  return d;
}
function tarihFormatla(d){
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth()+1)}.${d.getFullYear()}`;
}
function gunFarki(d1, d2){ return Math.round((d2 - d1) / (1000*60*60*24)); }

function ornekPompa(ad){
  return { id: uid(), ad, parcalar: [], gecmis: [{ id: uid(), tarih: bugun(), aciklama: "Kayıt oluşturuldu." }], bakimlar: [] };
}
function varsayilanVeri(){
  return {
    tesisler: Array.from({length:6}).map((_,i)=>({
      id: uid(), ad: `Tesis ${i+1}`,
      makineler: [{ id: uid(), ad: "Pompa İstasyonu", pompalar: [ornekPompa("1. Pompa"), ornekPompa("2. Pompa")], bakimlar: [] }],
      depolar: []
    })),
    satinAlmalar: [],
    malzemeGecmisi: [],
    sonIslemler: [],
    transferler: [],
    logoUrl: ""
  };
}

/* ---------------- durum ---------------- */
let state = null;
let ui = { view: "anasayfa", secim: {}, acikTesis: new Set(), acikMakine: new Set(), acikGecmis: new Set(), duzenle: false, mesaj: "", saSecim: null, saDuzenle: false, saArama: "", saFiltre: "tumu", stokAcikTesis: new Set(), stokAcikDepo: new Set(), stokDuzenle: false, stokBekleyenAcik: new Set(), stokBekleyenSecim: {}, stokBekleyenDepo: {}, bakimAcikTesis: new Set(), bakimAcikMakine: new Set(), bakimAcikPompa: new Set(), genelArama: "", siralaModu: false, sistemKayitlariAcik: false, kayitTesisFiltre: "", cikisTesisId: "", cikisDepoId: "", cikisMiktarlar: {}, transferTesisId: "", transferDepoId: "", transferUrunAdi: "", transferMiktar: "", transferHedefTesisId: "", transferHedefDepoId: "" };

function sanitizeVeri(v){
  if (!v) v = varsayilanVeri();
  if (!v.tesisler) v.tesisler = varsayilanVeri().tesisler;
  if (!v.malzemeGecmisi) v.malzemeGecmisi = [];
  v.malzemeGecmisi = v.malzemeGecmisi.map(x => typeof x === "string" ? { id: uid(), ad: x } : x);
  if (!v.satinAlmalar) v.satinAlmalar = [];
  if (!v.sonIslemler) v.sonIslemler = [];
  if (!v.transferler) v.transferler = [];
  if (typeof v.logoUrl !== "string") v.logoUrl = "";
  v.tesisler.forEach(t => {
    if (!Array.isArray(t.depolar)) t.depolar = [];
    (t.makineler || []).forEach(m => {
      if (!Array.isArray(m.bakimlar)) m.bakimlar = [];
      m.bakimlar.forEach(b => { if (!b.uyariGunu) b.uyariGunu = 15; });
      (m.pompalar || []).forEach(p => {
        if (!Array.isArray(p.bakimlar)) p.bakimlar = [];
        p.bakimlar.forEach(b => { if (!b.uyariGunu) b.uyariGunu = 15; });
      });
    });
  });
  v.satinAlmalar = v.satinAlmalar.map(s => {
    if (Array.isArray(s.kalemler)) return s;
    return {
      id: s.id, siparisNo: s.siparisNo || "", gelisTarihi: s.gelisTarihi || bugun(),
      kalemler: [{ id: uid(), urun: s.urun || "", miktar: s.miktar || "", birim: s.birim || "", teslimTarihi: s.teslimTarihi || "", durum: s.durum || "Gelmedi" }],
      yerler: s.kullanildigiYer ? [{ id: uid(), ad: s.kullanildigiYer }] : [{ id: uid(), ad: "" }],
      firma: s.firma || "",
      eklenmeTarihi: s.eklenmeTarihi || bugun(), eklenmeSaati: s.eklenmeSaati || suAn()
    };
  });
  return v;
}

/* ---------------- Firebase / Firestore ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyC5Jh7at2UmUrNnksDv2jDy5aonh_M3eA4",
  authDomain: "tesis-yonetim-d7502.firebaseapp.com",
  projectId: "tesis-yonetim-d7502",
  storageBucket: "tesis-yonetim-d7502.firebasestorage.app",
  messagingSenderId: "540630226337",
  appId: "1:540630226337:web:f1f48b6eab8c92b11127e0"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const veriRef = db.collection("veri").doc("ana");

let mevcutKullanici = null;
const UYGULAMA_SURUMU = "v9";
const UYGULAMA_SURUM_TARIHI = "12 Ağustos 2026";
let mevcutRol = "personel";
let mevcutTesisErisimi = null;
let mevcutIzinler = null;
let mevcutIsim = "";
let dinleyiciBaslatildi = false;

function adminMi(){ return mevcutRol === "yonetici"; }

function saveData(){
  if (!state) return;
  veriRef.set(state).catch(err => {
    console.error("Kaydetme hatası:", err);
    toastGoster("Değişiklik kaydedilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.", "hata");
  });
}
function veriDinlemeyeBasla(){
  if (dinleyiciBaslatildi) return;
  dinleyiciBaslatildi = true;
  veriRef.get().then(snap => {
    if (!snap.exists) { veriRef.set(varsayilanVeri()); }
  });
  veriRef.onSnapshot(snap => {
    if (!snap.exists) return;
    state = sanitizeVeri(snap.data());
    if (document.getElementById("uygulama").style.display !== "none") {
      if (!ui.acikTesis || ui.acikTesis.size === 0) ui.acikTesis.add(state.tesisler[0]?.id);
      render();
    }
  }, err => {
    console.error("Veri dinleme hatası:", err);
    toastGoster("Veri sunucusuna bağlanılamadı. İnternet bağlantınızı kontrol edin.", "hata");
  });
}
async function kullaniciRoluAyarla(user){
  mevcutKullanici = user;
  const ref = db.collection("kullanicilar").doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    const hepsi = await db.collection("kullanicilar").get();
    mevcutRol = hepsi.empty ? "yonetici" : "personel";
    await ref.set({ eposta: user.email, rol: mevcutRol });
    mevcutTesisErisimi = null;
    mevcutIzinler = null;
    mevcutIsim = "";
  } else {
    mevcutRol = snap.data().rol || "personel";
    const liste = snap.data().tesisErisimi;
    mevcutTesisErisimi = Array.isArray(liste) && liste.length > 0 ? liste : null;
    mevcutIzinler = snap.data().izinler || null;
    mevcutIsim = snap.data().isim || "";
  }
}
function tarayiciAdi(){
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Microsoft Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  return "Bilinmeyen tarayıcı";
}
async function girisKaydiTut(user){
  const bilgi = { sonGirisTarihi: bugun(), sonGirisSaati: suAn(), tarayici: tarayiciAdi() };
  try {
    const yanit = await fetch("https://api.ipify.org?format=json");
    const veri = await yanit.json();
    bilgi.sonGirisIp = veri.ip || "bilinmiyor";
  } catch(e) {
    bilgi.sonGirisIp = "alınamadı";
  }
  db.collection("kullanicilar").doc(user.uid).set(bilgi, { merge: true }).catch(err => console.error(err));
}
function malzemeGecmisineEkle(ad, birim, kod){
  if (!ad) return;
  const temiz = ad.trim();
  if (!temiz) return;
  const mevcut = state.malzemeGecmisi.find(x => x.ad.toLowerCase() === temiz.toLowerCase());
  if (!mevcut) state.malzemeGecmisi.push({ id: uid(), ad: temiz, birim: birim || "adet", kod: (kod||"").trim() });
  else {
    if (birim && !mevcut.birim) mevcut.birim = birim;
    if (kod && kod.trim() && !mevcut.kod) mevcut.kod = kod.trim();
  }
}
function kaydetIslem(aciklama, hedef){
  if (!state.sonIslemler) state.sonIslemler = [];
  const kullanici = mevcutKullanici ? mevcutKullanici.email : "";
  state.sonIslemler.unshift({ id: uid(), aciklama, kullanici, hedef, tarih: bugun(), saat: suAn() });
  if (state.sonIslemler.length > 300) state.sonIslemler.length = 300;
  saveData();
}
function hedefeGit(h){
  if (!h) return;
  if (h.view === "pompa") pompaSec(h.tesisId, h.makineId, h.pompaId);
  else if (h.view === "satinalma-detay") satinAlmaSec(h.satId);
  else if (h.view === "rapor") raporGoster();
  else if (h.view === "malzemeler") malzemeListesiGoster();
  else if (h.view === "stok") { if (h.tesisId) ui.stokAcikTesis.add(h.tesisId); if (h.depoId) ui.stokAcikDepo.add(h.depoId); stokGoster(); }
  else if (h.view === "satinalma") satinAlmaGoster();
  else if (h.view === "bakim") { if (h.tesisId) ui.bakimAcikTesis.add(h.tesisId); if (h.makineId) ui.bakimAcikMakine.add(h.makineId); if (h.pompaId) ui.bakimAcikPompa.add(h.pompaId); bakimGoster(); }
  else if (h.view === "tesis-vurgula") { ui.acikTesis.add(h.tesisId); if (h.makineId) ui.acikMakine.add(h.makineId); ui.view = "anasayfa"; render(); }
  else if (h.view === "kayitlar") kayitlarGoster();
  else if (h.view === "anasayfa") anaSayfaGoster();
}
function islemeGitById(id){
  const islem = (state.sonIslemler || []).find(x => x.id === id);
  if (islem) hedefeGit(islem.hedef);
}

/* ---------------- stok ---------------- */
function gorunurTesisler(){ return state.tesisler.filter(t => !t.gizli); }
function erisilenTesisler(){
  const liste = gorunurTesisler();
  if (adminMi() || !mevcutTesisErisimi) return liste;
  return liste.filter(t => mevcutTesisErisimi.includes(t.id));
}
function kapsamTesisler(){
  if (adminMi() || !mevcutTesisErisimi) return state.tesisler;
  return state.tesisler.filter(t => mevcutTesisErisimi.includes(t.id));
}
function erisilenTesisAdlari(){ return new Set(erisilenTesisler().map(t => t.ad)); }
const IZIN_VARSAYILAN_KAPALI = ["malzemeCikis", "transfer"];
function izinVar(ad){
  if (adminMi()) return true;
  const kapaliMi = IZIN_VARSAYILAN_KAPALI.includes(ad);
  if (!mevcutIzinler) return !kapaliMi;
  return kapaliMi ? mevcutIzinler[ad] === true : mevcutIzinler[ad] !== false;
}
function islemGorunurMu(islem){
  if (adminMi() || !mevcutTesisErisimi) return true;
  const tId = islem.hedef && islem.hedef.tesisId;
  if (tId) return mevcutTesisErisimi.includes(tId);
  // eski kayıtlarda tesis kimliği yok — açıklama metninde geçen tesis adına bakarak en iyi çabayla karar ver
  const izinliAdlar = erisilenTesisAdlari();
  const gecenTesis = state.tesisler.find(t => islem.aciklama && islem.aciklama.includes(t.ad));
  if (gecenTesis) return izinliAdlar.has(gecenTesis.ad);
  return true;
}
function aciklamaGoster(aciklama){
  return (aciklama || "").replace(/\s*—\s*\S+@\S+\.\S+\s*$/, "");
}
function satinAlmaGorunurMu(sat){
  if (adminMi() || !mevcutTesisErisimi) return true;
  if (!sat.yerler || sat.yerler.length === 0) return true;
  const adlar = erisilenTesisAdlari();
  return sat.yerler.some(y => adlar.has(y.ad));
}

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
  const metin = document.getElementById("lambaMetin");
  if (ikon) ikon.textContent = acikMi ? "☀️" : "🌙";
  if (metin) metin.textContent = acikMi ? "Açık Tema" : "Koyu Tema";
}

/* ---------------- bildirimler ---------------- */
let bildirimPaneliAcik = false;
let bildirimHedefleri = [];
let ilkBildirimAnimasyonuYapildi = false;
let bildirimGizlenenler = new Set();
function bildirimleriTopla(){
  const liste = [];
  (state.sonIslemler || []).filter(k => k.aciklama && k.aciklama.startsWith("Rapor eklendi") && islemGorunurMu(k))
    .slice(0, 15)
    .forEach(k => liste.push({ anahtar: "islem:"+k.id, mesaj: k.aciklama, renk: "var(--vurgu)", hedef: k.hedef }));
  (state.sonIslemler || []).filter(k => k.aciklama && k.aciklama.startsWith("Satın alma durumu değiştirildi") && k.aciklama.endsWith("Geldi"))
    .slice(0, 15)
    .forEach(k => liste.push({ anahtar: "islem:"+k.id, mesaj: k.aciklama, renk: "var(--yesil)", hedef: k.hedef }));
  kapsamTesisler().forEach(t => (t.depolar||[]).forEach(d => (d.urunler||[]).forEach(u => {
    if (u.kritikTakip && (parseFloat(u.miktar)||0) <= (parseFloat(u.kritikEsik)||0)) {
      liste.push({ anahtar: "kritik:"+t.id+":"+d.id+":"+u.id, mesaj: `Kritik stok: ${u.ad || '(isimsiz)'} (${d.ad} — ${t.ad})`, renk: "var(--kirmizi)", hedef: { view: "stok", tesisId: t.id, depoId: d.id } });
    }
  })));
  tumBakimlar().filter(x => x.durum.durum === "gecti" || x.durum.durum === "yaklasiyor").forEach(x => {
    const renk = x.durum.durum === "gecti" ? "var(--kirmizi)" : "var(--vurgu)";
    const yer = x.pompa ? `${x.tesis} / ${x.makine} / ${x.pompa}` : `${x.tesis} / ${x.makine}`;
    const hedef = x.pompaId ? { view: "bakim", tesisId: x.tesisId, makineId: x.makineId, pompaId: x.pompaId } : { view: "bakim", tesisId: x.tesisId, makineId: x.makineId };
    liste.push({ anahtar: "bakim:"+x.tesisId+":"+x.makineId+":"+(x.pompaId||'')+":"+x.bakim.id, mesaj: `${x.durum.durum==='gecti'?'Bakım gecikti':'Bakım yaklaşıyor'}: ${x.bakim.ad} (${yer})`, renk, hedef });
  });
  return liste.filter(b => !bildirimGizlenenler.has(b.anahtar));
}
function bildirimSil(anahtar){
  bildirimGizlenenler.add(anahtar);
  bildirimGuncelle();
}
let bildirimGorulenler = new Set();
function bildirimGuncelle(){
  const rozet = document.getElementById("canRozet");
  if (!rozet) return;
  const liste = bildirimleriTopla();
  const yeniSayi = liste.filter(b => !bildirimGorulenler.has(b.anahtar)).length;
  if (yeniSayi > 0) { rozet.textContent = yeniSayi > 99 ? "99+" : yeniSayi; rozet.style.display = ""; }
  else rozet.style.display = "none";
  if (bildirimPaneliAcik) bildirimPaneliRender();
  if (!ilkBildirimAnimasyonuYapildi) {
    ilkBildirimAnimasyonuYapildi = true;
    const ikon = document.getElementById("canIkonu");
    if (ikon) { ikon.classList.remove("canAnimasyon"); void ikon.offsetWidth; ikon.classList.add("canAnimasyon"); }
  }
}
function bildirimPaneliAcKapat(){
  bildirimPaneliAcik = !bildirimPaneliAcik;
  const panel = document.getElementById("bildirimPaneli");
  if (!panel) return;
  if (bildirimPaneliAcik) {
    bildirimPaneliRender();
    panel.style.display = "block";
    bildirimleriTopla().forEach(b => bildirimGorulenler.add(b.anahtar));
    bildirimGuncelle();
  }
  else panel.style.display = "none";
}
function bildirimPaneliRender(){
  const panel = document.getElementById("bildirimPaneli");
  if (!panel) return;
  const liste = bildirimleriTopla();
  bildirimHedefleri = liste.map(b => b.hedef);
  let h = `<div class="bildirimBaslikSatir">Bildirimler</div>`;
  if (liste.length === 0) h += `<div class="bosMetin" style="padding:14px">Şu an bir bildirim yok.</div>`;
  else liste.forEach((b, i) => {
    const yeniMi = !bildirimGorulenler.has(b.anahtar);
    h += `<div class="bildirimSatir" onclick="bildirimeTikla(${i})">
      <span class="bildirimNokta" style="color:${b.renk}">${yeniMi?'●':'○'}</span>
      <span style="flex:1;font-size:12.5px;color:${yeniMi?'var(--yazi-ikincil)':'var(--yazi-soluk)'}">${esc(b.mesaj)}</span>
      <span class="bildirimSilBtn" title="Bildirimi kaldır" onclick="event.stopPropagation(); bildirimSil('${b.anahtar}')">×</span>
    </div>`;
  });
  panel.innerHTML = h;
}
function bildirimeTikla(i){
  const hedef = bildirimHedefleri[i];
  bildirimPaneliAcik = false;
  const panel = document.getElementById("bildirimPaneli");
  if (panel) panel.style.display = "none";
  hedefeGit(hedef);
}
function lambaTikla(){
  temaDegistir(temaOku() !== "acik");
  lambaGuncelle();
  const btn = document.getElementById("lambaBtn");
  if (btn) {
    btn.classList.remove("sallaniyor");
    void btn.offsetWidth;
    btn.classList.add("sallaniyor");
  }
}

function girisGonder(){
  const eposta = document.getElementById("girisEposta").value.trim();
  const sifre = document.getElementById("girisSifre").value;
  const hataEl = document.getElementById("girisHataMetni");
  hataEl.textContent = "";
  if (!eposta || !sifre) { hataEl.textContent = "E-posta ve şifre gerekli."; return; }
  const btn = document.getElementById("girisButonu");
  btn.textContent = "Giriş yapılıyor..."; btn.disabled = true;
  auth.signInWithEmailAndPassword(eposta, sifre)
    .catch(err => {
      btn.textContent = "Giriş yap"; btn.disabled = false;
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        hataEl.textContent = "E-posta veya şifre hatalı.";
      } else if (err.code === "auth/invalid-email") {
        hataEl.textContent = "Geçerli bir e-posta adresi girin.";
      } else if (err.code === "auth/too-many-requests") {
        hataEl.textContent = "Çok fazla deneme yapıldı. Biraz sonra tekrar deneyin.";
      } else {
        hataEl.textContent = "Giriş yapılamadı: " + err.message;
      }
    });
}
function cikisYap(){
  auth.signOut();
}
async function girisiTamamla(user){
  await kullaniciRoluAyarla(user);
  girisKaydiTut(user);
  document.getElementById("girisEkrani").style.display = "none";
  document.getElementById("uygulama").style.display = "flex";
  document.getElementById("kullaniciRozeti").textContent = mevcutIsim ? mevcutIsim : (mevcutRol === "yonetici" ? "Yönetici" : "Personel");
  document.getElementById("anaPanel").innerHTML = `<div class="yukleniyorKutu"><div class="spinner"></div><div>Veriler yükleniyor...</div></div>`;
  veriDinlemeyeBasla();
}
function girisEkraniniGoster(){
  mevcutKullanici = null; mevcutRol = "personel"; mevcutTesisErisimi = null; mevcutIzinler = null; mevcutIsim = ""; dinleyiciBaslatildi = false; state = null;
  document.getElementById("uygulama").style.display = "none";
  document.getElementById("girisEkrani").style.display = "flex";
  document.getElementById("girisSifre").value = "";
  const btn = document.getElementById("girisButonu");
  if (btn) { btn.textContent = "Giriş yap"; btn.disabled = false; }
}

/* ---------------- başlangıç ---------------- */
function pompaBul(){
  const t = state.tesisler.find(x => x.id === ui.secim.tesisId);
  const m = t?.makineler.find(x => x.id === ui.secim.makineId);
  const p = m?.pompalar.find(x => x.id === ui.secim.pompaId);
  return { t, m, p };
}
function tesisEkle(){
  if (!adminMi()) return;
  const yeni = { id: uid(), ad: "Yeni Tesis", makineler: [] };
  state.tesisler.push(yeni); ui.acikTesis.add(yeni.id);
  kaydetIslem(`Yeni tesis eklendi: ${yeni.ad}`, { view: "anasayfa", tesisId: yeni.id });
  saveData(); render();
}
function tesisSil(tesisId){
  const t = state.tesisler.find(x => x.id === tesisId);
  state.tesisler = state.tesisler.filter(t => t.id !== tesisId);
  if (ui.secim.tesisId === tesisId) { ui.secim = {}; ui.view = "bos"; }
  if (t) kaydetIslem(`Tesis silindi: ${t.ad}`, { view: "anasayfa", tesisId: t.id });
  saveData(); render();
}
function tesisAdGuncelle(tesisId, ad){
  const t = state.tesisler.find(x => x.id === tesisId); if (t) t.ad = ad;
  saveData(); render();
}
function makineEkle(tesisId){
  if (!adminMi()) return;
  const t = state.tesisler.find(x => x.id === tesisId);
  const yeni = { id: uid(), ad: "Yeni Makine", pompalar: [], bakimlar: [] };
  t.makineler.push(yeni); ui.acikMakine.add(yeni.id);
  kaydetIslem(`Yeni makine eklendi: ${yeni.ad} (${t.ad})`, { view: "anasayfa", tesisId: t.id });
  saveData(); render();
}
function makineSil(tesisId, makineId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  t.makineler = t.makineler.filter(m => m.id !== makineId);
  if (ui.secim.makineId === makineId) { ui.secim = {}; ui.view = "bos"; }
  if (m) kaydetIslem(`Makine silindi: ${m.ad} (${t.ad})`, { view: "anasayfa", tesisId: t.id });
  saveData(); render();
}
function makineAdGuncelle(tesisId, makineId, ad){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId); if (m) m.ad = ad;
  saveData(); render();
}
function pompaEkle(tesisId, makineId){
  if (!adminMi()) return;
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const yeni = ornekPompa(`${m.pompalar.length+1}. Pompa`);
  m.pompalar.push(yeni);
  kaydetIslem(`Yeni pompa eklendi: ${yeni.ad} (${t.ad} / ${m.ad})`, { view: "pompa", tesisId, makineId, pompaId: yeni.id });
  saveData(); render();
}
function pompaSil(tesisId, makineId, pompaId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const p = m.pompalar.find(x => x.id === pompaId);
  m.pompalar = m.pompalar.filter(p => p.id !== pompaId);
  if (ui.secim.pompaId === pompaId) { ui.secim = {}; ui.view = "bos"; }
  if (p) kaydetIslem(`Pompa silindi: ${p.ad} (${t.ad} / ${m.ad})`, { view: "anasayfa", tesisId: t.id, makineId: m.id });
  saveData(); render();
}
function pompaAdGuncelle(ad){
  const { p } = pompaBul(); if (p) p.ad = ad; saveData(); render();
}
function pompaSec(tesisId, makineId, pompaId){
  ui.secim = { tesisId, makineId, pompaId }; ui.view = "pompa"; ui.duzenle = false;
  ui.acikTesis.add(tesisId); if (makineId) ui.acikMakine.add(makineId);
  render();
}
function acikTesisToggle(id){ ui.acikTesis.has(id) ? ui.acikTesis.delete(id) : ui.acikTesis.add(id); render(); }
function acikMakineToggle(id){ ui.acikMakine.has(id) ? ui.acikMakine.delete(id) : ui.acikMakine.add(id); render(); }
function duzenleAcKapat(){ ui.duzenle = !ui.duzenle; render(); }

/* ---------------- rapor ekle ---------------- */
function render(){ renderSol(); renderAna(); renderSag(); renderUstNav(); logoGuncelle(); guncelleMalzemeListesi(); bildirimGuncelle(); }
function islemBadge(aciklama){
  const a = (aciklama || "").toLowerCase();
  if (a.includes("silindi")) return { etiket: "Silme", renk: "var(--kirmizi)", renkRgb: "var(--kirmizi-rgb)" };
  if (a.includes("onayland")) return { etiket: "Onay", renk: "var(--yesil)", renkRgb: "var(--yesil-rgb)" };
  if (a.includes("bakım yapıldı")) return { etiket: "Bakım", renk: "var(--yesil)", renkRgb: "var(--yesil-rgb)" };
  if (a.includes("rapor eklendi")) return { etiket: "Rapor", renk: "var(--vurgu)", renkRgb: "var(--vurgu-rgb)" };
  if (a.includes("satın alma")) return { etiket: "Satın Alma", renk: "var(--mavi)", renkRgb: "var(--mavi-rgb)" };
  if (a.includes("eklendi") || a.includes("oluşturuldu")) return { etiket: "Ekleme", renk: "var(--vurgu)", renkRgb: "var(--vurgu-rgb)" };
  return { etiket: "İşlem", renk: "var(--yazi-soluk)", renkRgb: "139,150,168" };
}
function renderSag(){
  const el = document.getElementById("sagMenu");
  if (!el) return;
  const liste = (state.sonIslemler || []).filter(islemGorunurMu).slice(0, 10);
  let h = `<div class="solBaslikSatir" style="padding-top:6px"><span class="solBaslik">Son İşlemler</span></div>`;
  if (liste.length === 0) {
    h += `<div class="bosMetin" style="padding:14px">Henüz bir işlem yapılmadı.</div>`;
  } else {
    liste.forEach(islem => {
      const rozet = islemBadge(islem.aciklama);
      h += `<div class="islemSatir ty-node" style="border-left:3px solid ${rozet.renk};background:rgba(${rozet.renkRgb},0.045)" onclick="islemeGitById('${islem.id}')">
        <span class="islemRozet" style="color:${rozet.renk};background:rgba(${rozet.renkRgb},0.12);border-color:rgba(${rozet.renkRgb},0.4)">${rozet.etiket}</span>
        <div class="islemAciklama">${esc(aciklamaGoster(islem.aciklama))}</div>
        <div class="islemZaman">${esc(islem.tarih)} · ${esc(islem.saat)}</div>
      </div>`;
    });
  }
  el.innerHTML = h;
}
function guncelleMalzemeListesi(){
  const dl = document.getElementById("malzemeListesi");
  if (dl) dl.innerHTML = state.malzemeGecmisi.map(x => `<option value="${esc(x.ad)}">`).join("");
}

function duzenlemeBaslat(id){ ui.duzenlenenId = id; render(); }
function duzenlemeIptal(){ ui.duzenlenenId = null; render(); }
function tesisAdKaydet(inputEl, tesisId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const eski = t ? t.ad : "";
  if (t && inputEl.value.trim()) t.ad = inputEl.value.trim();
  if (t && eski !== t.ad) kaydetIslem(`Tesis adı değiştirildi: ${eski} → ${t.ad}`, { view: "anasayfa", tesisId: t.id });
  ui.duzenlenenId = null; saveData(); render();
}
function makineAdKaydet(inputEl, tesisId, makineId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const eski = m ? m.ad : "";
  if (m && inputEl.value.trim()) m.ad = inputEl.value.trim();
  if (m && eski !== m.ad) kaydetIslem(`Makine adı değiştirildi: ${eski} → ${m.ad} (${t.ad})`, { view: "anasayfa", tesisId: t.id, makineId: m.id });
  ui.duzenlenenId = null; saveData(); render();
}
function pompaAdKaydetSol(inputEl, tesisId, makineId, pompaId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const p = m.pompalar.find(x => x.id === pompaId);
  const eski = p ? p.ad : "";
  if (p && inputEl.value.trim()) p.ad = inputEl.value.trim();
  if (p && eski !== p.ad) kaydetIslem(`Pompa adı değiştirildi: ${eski} → ${p.ad} (${t.ad} / ${m.ad})`, { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id });
  ui.duzenlenenId = null; saveData(); render();
}
function enterIleKaydet(e){ if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { ui.duzenlenenId = null; render(); } }

function renderUstNav(){
  const el = document.getElementById("ustNav");
  if (!el) return;
  const ikon = (emoji, renkVar) => `<span class="navIkon" style="background:rgba(var(--${renkVar}-rgb),.16);color:var(--${renkVar})">${emoji}</span>`;
  let h = `
    <div class="ustNavBtn ${ui.view==='anasayfa'?'ustNavBtnAktif':''} ty-btn" onclick="anaSayfaGoster()">${ikon('🏠','mavi')} Ana Sayfa</div>`;
  if (izinVar('stokListesi')) h += `
    <div class="ustNavBtn ${ui.view==='stok'?'ustNavBtnAktif':''} ty-btn" onclick="stokGoster()">${ikon('📦','yesil')} Stok Listesi</div>`;
  if (izinVar('satinAlmalar')) h += `
    <div class="ustNavBtn ${(ui.view==='satinalma'||ui.view==='satinalma-detay')?'ustNavBtnAktif':''} ty-btn" onclick="satinAlmaGoster()">${ikon('🛒','mor')} Satın Almalar
      ${saTumKalemler().some(k=>k.durum==='Gelmedi') ? `<span class="rozet">${saTumKalemler().filter(k=>k.durum==='Gelmedi').length}</span>` : ''}
    </div>`;
  if (izinVar('raporEkle')) h += `
    <div class="ustNavBtn ${ui.view==='rapor'?'ustNavBtnAktif':''} ty-btn" onclick="raporGoster()">${ikon('📝','vurgu')} Rapor ekle</div>`;
  if (izinVar('periyodikBakim')) h += `
    <div class="ustNavBtn ${ui.view==='bakim'?'ustNavBtnAktif':''} ty-btn" onclick="bakimGoster()">${ikon('🔧','kirmizi')} Periyodik Bakım
      ${bakimUyariSayisi() > 0 ? `<span class="rozet">${bakimUyariSayisi()}</span>` : ''}
    </div>`;
  if (izinVar('malzemeCikis')) h += `
    <div class="ustNavBtn ${ui.view==='malzemecikis'?'ustNavBtnAktif':''} ty-btn" onclick="malzemeCikisGoster()">${ikon('📉','turkuaz')} Malzeme Kullan</div>`;
  if (izinVar('transfer')) h += `
    <div class="ustNavBtn ${ui.view==='transfer'?'ustNavBtnAktif':''} ty-btn" onclick="transferGoster()">${ikon('🔄','mavi')} Transfer Et
      ${bekleyenTransferSayisi() > 0 ? `<span class="rozet">${bekleyenTransferSayisi()}</span>` : ''}
    </div>`;
  el.innerHTML = h;

  const marqueeEl = document.getElementById("ustMarquee");
  if (marqueeEl) {
    let mh = "";
    const kritikTesisler = kritikTesisAdlari();
    if (izinVar('stokListesi') && kritikTesisler.length > 0) {
      const metin = `⚠ Kritik stok: ${kritikTesisler.join(' • ')}`;
      mh += `<div class="kritikMarquee"><div class="kritikMarqueeIc">${esc(metin)} &nbsp;&nbsp;•&nbsp;&nbsp; ${esc(metin)}</div></div>`;
    }
    if (izinVar('periyodikBakim')) {
      const bakimTesisleri = bakimUyariTesisAdlari();
      if (bakimTesisleri.gecti.length > 0 || bakimTesisleri.yaklasan.length > 0) {
        const parcalar = [];
        if (bakimTesisleri.gecti.length) parcalar.push(`⚠ Bakımı geçen: ${bakimTesisleri.gecti.join(' • ')}`);
        if (bakimTesisleri.yaklasan.length) parcalar.push(`⏳ Bakımı yaklaşan: ${bakimTesisleri.yaklasan.join(' • ')}`);
        const metin = parcalar.join('   ·   ');
        mh += `<div class="kritikMarquee"><div class="kritikMarqueeIc">${esc(metin)} &nbsp;&nbsp;•&nbsp;&nbsp; ${esc(metin)}</div></div>`;
      }
    }
    marqueeEl.innerHTML = mh;
  }
}
function logoGuncelle(){
  const el = document.getElementById("logoAlani");
  if (!el || !state) return;
  el.innerHTML = state.logoUrl
    ? `<img src="${esc(state.logoUrl)}" alt="Logo" style="width:320px;height:85px;object-fit:contain;display:block" />`
    : `<div style="display:flex;align-items:center;gap:10px;width:320px;height:85px">
        <span class="logo">⌁</span>
        <div>
          <div class="baslik">Tesis Yönetim Sistemi</div>
          <div class="altBaslik">saha ekipman ve satın alma takibi</div>
        </div>
      </div>`;
}
function renderSol(){
  const h = tesisAgaciHTML();
  document.getElementById("solMenu").innerHTML = h;
}

function tesisAgaciHTML(){
  let h = `
    <div class="solBaslikSatir" style="padding:4px 0 10px">
      <span class="solBaslik">Tesisler</span>
      <div style="display:flex;gap:6px">
        <button class="ekleMini ty-btn ${ui.siralaModu?'siralaAktifBtn':''}" onclick="siralamaModuAcKapat()">${ui.siralaModu?'✓ Sıralamayı bitir':'↕ Sırala'}</button>
        ${adminMi() ? `<button class="ekleMini ty-btn" onclick="tesisEkle()">+ Tesis ekle</button>` : ''}
      </div>
    </div>`;

  const tesisListesi = siraliTesisler();
  if (tesisListesi.length === 0) {
    h += `<div class="bosMetin">Erişebileceğiniz bir tesis bulunmuyor.</div>`;
  }
  tesisListesi.forEach((t, tIndex) => {
    const acikT = ui.acikTesis.has(t.id);
    h += `<div class="tesisKart">`;
    h += `<div class="tesisBaslikSatir" onclick="acikTesisToggle('${t.id}')">
      <span class="okBuyuk" style="transform:${acikT?'rotate(90deg)':'none'}">›</span>
      <span class="tesisIkon tesisIkonRenkli">🏭</span>`;
    if (ui.duzenlenenId === t.id) {
      h += `<input class="editInput" id="editInput_${t.id}" value="${esc(t.ad)}" onclick="event.stopPropagation()" onkeydown="enterIleKaydet(event)" onblur="tesisAdKaydet(this,'${t.id}')" />`;
    } else {
      h += `<span class="tesisAdMetin">${esc(t.ad)}</span>`;
    }
    h += `<div class="aksiyonGrup">
        ${ui.siralaModu ? `
          <button class="aksiyonBtn ty-btn" title="Yukarı taşı" ${tIndex===0?'disabled style="opacity:.3"':''} onclick="event.stopPropagation(); tesisTasi('${t.id}',-1)">▲</button>
          <button class="aksiyonBtn ty-btn" title="Aşağı taşı" ${tIndex===tesisListesi.length-1?'disabled style="opacity:.3"':''} onclick="event.stopPropagation(); tesisTasi('${t.id}',1)">▼</button>
        ` : `
          <button class="aksiyonBtn ty-btn" title="Adını düzenle" onclick="event.stopPropagation(); duzenlemeBaslat('${t.id}')">✎</button>
          ${adminMi() ? `<button class="aksiyonBtn aksiyonBtnSil ty-btn" title="Tesisi sil" onclick="event.stopPropagation(); silOnayla('Tesisi Sil', ()=>tesisSil('${t.id}'))">×</button>` : ''}
        `}
      </div>
    </div>`;

    if (acikT) {
      h += `<div class="acilirIcerik">`;
      const makineListesi = siraliMakineler(t.id, t.makineler);
      makineListesi.forEach((m, mIndex) => {
        const acikM = ui.acikMakine.has(m.id);
        h += `<div class="makineSatir" onclick="acikMakineToggle('${m.id}')">
          <span class="okBuyuk" style="transform:${acikM?'rotate(90deg)':'none'}">›</span>
          <span class="tesisIkon makineIkonRenkli" style="font-size:12px">⚙</span>`;
        if (ui.duzenlenenId === m.id) {
          h += `<input class="editInput" id="editInput_${m.id}" value="${esc(m.ad)}" onclick="event.stopPropagation()" onkeydown="enterIleKaydet(event)" onblur="makineAdKaydet(this,'${t.id}','${m.id}')" />`;
        } else {
          h += `<span class="makineAdMetin">${esc(m.ad)}</span>`;
        }
        h += `<div class="aksiyonGrup">
            ${ui.siralaModu ? `
              <button class="aksiyonBtn ty-btn" title="Yukarı taşı" ${mIndex===0?'disabled style="opacity:.3"':''} onclick="event.stopPropagation(); makineTasi('${t.id}','${m.id}',-1)">▲</button>
              <button class="aksiyonBtn ty-btn" title="Aşağı taşı" ${mIndex===makineListesi.length-1?'disabled style="opacity:.3"':''} onclick="event.stopPropagation(); makineTasi('${t.id}','${m.id}',1)">▼</button>
            ` : `
              <button class="aksiyonBtn ty-btn" title="Adını düzenle" onclick="event.stopPropagation(); duzenlemeBaslat('${m.id}')">✎</button>
              ${adminMi() ? `<button class="aksiyonBtn aksiyonBtnSil ty-btn" title="Makineyi sil" onclick="event.stopPropagation(); silOnayla('Makineyi Sil', ()=>makineSil('${t.id}','${m.id}'))">×</button>` : ''}
            `}
          </div>
        </div>`;

        if (acikM) {
          h += `<div class="acilirIcerik">`;
          m.pompalar.forEach(p => {
            const secili = ui.secim.pompaId === p.id && ui.view === 'pompa';
            h += `<div class="pompaSatir ${secili?'pompaSatirSecili':''}" onclick="pompaSec('${t.id}','${m.id}','${p.id}')">
              <span class="pompaNokta">●</span>`;
            if (ui.duzenlenenId === p.id) {
              h += `<input class="editInput" id="editInput_${p.id}" value="${esc(p.ad)}" onclick="event.stopPropagation()" onkeydown="enterIleKaydet(event)" onblur="pompaAdKaydetSol(this,'${t.id}','${m.id}','${p.id}')" />`;
            } else {
              h += `<span class="pompaAdMetin">${esc(p.ad) || '(isimsiz)'}</span>`;
            }
            h += `<div class="aksiyonGrup">
                <button class="aksiyonBtn ty-btn" title="Adını düzenle" onclick="event.stopPropagation(); duzenlemeBaslat('${p.id}')">✎</button>
                ${adminMi() ? `<button class="aksiyonBtn aksiyonBtnSil ty-btn" title="Pompayı sil" onclick="event.stopPropagation(); silOnayla('Pompayı Sil', ()=>pompaSil('${t.id}','${m.id}','${p.id}'))">×</button>` : ''}
              </div>
            </div>`;
          });
          if (adminMi()) h += `<button class="ekleMiniPompa ty-btn" onclick="pompaEkle('${t.id}','${m.id}')">+ Pompa ekle</button>`;
          h += `</div>`;
        }
      });
      if (adminMi()) h += `<button class="ekleMiniMakine ty-btn" onclick="makineEkle('${t.id}')">+ Makine ekle</button>`;
      h += `</div>`;
    }
    h += `</div>`;
  });
  return h;
}

function anaPanelYaz(h){
  const el = document.getElementById("anaPanel");
  if (!el) return;
  el.innerHTML = h;
}

function renderBos(){
    anaPanelYaz(`<div class="bosDurum"><div style="font-size:32px;opacity:.3;margin-bottom:8px;">⌁</div><div>Soldan bir pompa seçin ya da Satın Almalar bölümüne geçin.</div></div>`);
    return;
}

function renderAna(){
  if (ui.view === "stok") renderStok();
  else if (ui.view === "ayarlar") renderAyarlar();
  else if (ui.view === "malzemeler") renderMalzemeler();
  else if (ui.view === "bos") renderBos();
  else if (ui.view === "anasayfa") renderAnaSayfa();
  else if (ui.view === "bakim") renderBakim();
  else if (ui.view === "pompa") renderPompa();
  else if (ui.view === "rapor") renderRapor();
  else if (ui.view === "satinalma") renderSatinAlma();
  else if (ui.view === "satinalma-detay") renderSatinAlmaDetay();
  else if (ui.view === "malzemecikis") renderMalzemeCikis();
  else if (ui.view === "transfer") renderTransfer();
}
