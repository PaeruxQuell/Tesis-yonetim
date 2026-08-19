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
function konfetiPatlat(){
  const renkler = ['#e2a33d','#3fae74','#5b8fe2','#a586e8','#4ec4c9','#e2694d'];
  const kapsayici = document.createElement("div");
  kapsayici.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;";
  document.body.appendChild(kapsayici);
  for (let i = 0; i < 46; i++){
    const p = document.createElement("div");
    const renk = renkler[Math.floor(Math.random()*renkler.length)];
    const genislik = 6 + Math.random()*6;
    const solX = 38 + Math.random()*24;
    const gecikme = Math.random()*0.2;
    const sure = 1.1 + Math.random()*0.9;
    const donme = (Math.random()*720-360) + "deg";
    const yatay = (Math.random()*220-110) + "px";
    p.style.cssText = `position:absolute;top:-10px;left:${solX}%;width:${genislik}px;height:${genislik*0.4}px;background:${renk};border-radius:2px;opacity:0.95;transform:rotate(${Math.random()*360}deg);animation:konfetiDusme ${sure}s ease-in ${gecikme}s forwards;--yatay-kayma:${yatay};--donme:${donme};`;
    kapsayici.appendChild(p);
  }
  setTimeout(() => kapsayici.remove(), 2600);
}
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
    logoUrl: "",
    logoUrlKoyu: "",
    logoUrlAcik: "",
    satinAlmaOnaycisiId: ""
  };
}

/* ---------------- durum ---------------- */
let state = null;
let ui = { view: "anasayfa", secim: {}, acikTesis: new Set(), acikMakine: new Set(), acikGecmis: new Set(), duzenle: false, mesaj: "", saSecim: null, saDuzenle: false, saArama: "", saFiltre: "tumu", stokAcikTesis: new Set(), stokAcikDepo: new Set(), stokDuzenle: false, stokBekleyenAcik: new Set(), stokBekleyenSecim: {}, stokBekleyenDepo: {}, bakimAcikTesis: new Set(), bakimAcikMakine: new Set(), bakimAcikPompa: new Set(), genelArama: "", siralaModu: false, sistemKayitlariAcik: false, kayitTesisFiltre: "", cikisTesisId: "", cikisDepoId: "", cikisMiktarlar: {}, transferTesisId: "", transferDepoId: "", transferUrunAdi: "", transferMiktar: "", transferHedefTesisId: "", transferHedefDepoId: "", raporFiltre: "haftalik", saTesisFiltre: "", raporOzelBaslangic: "", raporOzelBitis: "", raporTakvimYil: 0, raporTakvimAy: 0, bakimGorunum: "liste", bakimTakvimYil: 0, bakimTakvimAy: 0, bakimTakvimSecili: "", yedekSecili: "", yedekAltSekme: "", kullaniciAcikId: "" };

function sanitizeVeri(v){
  if (!v) v = varsayilanVeri();
  if (!v.tesisler) v.tesisler = varsayilanVeri().tesisler;
  if (!v.malzemeGecmisi) v.malzemeGecmisi = [];
  v.malzemeGecmisi = v.malzemeGecmisi.map(x => typeof x === "string" ? { id: uid(), ad: x } : x);
  if (!v.satinAlmalar) v.satinAlmalar = [];
  if (!v.sonIslemler) v.sonIslemler = [];
  if (!v.transferler) v.transferler = [];
  if (typeof v.logoUrl !== "string") v.logoUrl = "";
  if (typeof v.logoUrlKoyu !== "string") v.logoUrlKoyu = v.logoUrl || "";
  if (typeof v.logoUrlAcik !== "string") v.logoUrlAcik = "";
  if (typeof v.satinAlmaOnaycisiId !== "string") v.satinAlmaOnaycisiId = "";
  (v.satinAlmalar || []).forEach(s => { if (!s.onayDurumu) s.onayDurumu = "onaylandi"; });
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
const UYGULAMA_SURUM_NO = "53";
function uygulamaSurumMetni(){
  const lm = new Date(document.lastModified);
  const p = (n) => String(n).padStart(2, "0");
  const saat = `${p(lm.getHours())}:${p(lm.getMinutes())}`;
  const tarih = `${p(lm.getDate())}.${p(lm.getMonth()+1)}.${lm.getFullYear()}`;
  return `V${UYGULAMA_SURUM_NO} - ${saat} - ${tarih}`;
}
let mevcutRol = "personel";
let mevcutTesisErisimi = null;
let mevcutIzinler = null;
let mevcutIsim = "";
let mevcutAnaYonetici = false;
let dinleyiciBaslatildi = false;

function adminMi(){ return mevcutRol === "yonetici"; }
function anaYoneticiMi(){ return mevcutAnaYonetici === true; }
function satinAlmaOnaylayabilirMi(){
  return !!(mevcutKullanici && mevcutIzinler && mevcutIzinler.satinAlmaOnay === true);
}

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
    if (window.yedeklemeBaslat) window.yedeklemeBaslat();
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
    const ilkKullaniciMi = hepsi.empty;
    await ref.set({ eposta: user.email, rol: mevcutRol, anaYonetici: ilkKullaniciMi });
    mevcutTesisErisimi = null;
    mevcutIzinler = null;
    mevcutIsim = "";
    mevcutAnaYonetici = ilkKullaniciMi;
  } else {
    mevcutRol = snap.data().rol || "personel";
    const liste = snap.data().tesisErisimi;
    mevcutTesisErisimi = Array.isArray(liste) && liste.length > 0 ? liste : null;
    mevcutIzinler = snap.data().izinler || null;
    mevcutIsim = snap.data().isim || "";
    mevcutAnaYonetici = snap.data().anaYonetici === true;
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
// Aynı isimdeki ürün için DAHA ÖNCE girilmiş tüm farklı kodları toplar
// (örn. "Rulman" yazınca sadece rulman kodlarını, "Keçe" yazınca sadece
// keçe kodlarını önerir) — hem satın alma kalemlerine hem rapor
// geçmişindeki kullanılan malzemelere bakar.
function urunKodlariGetir(urunAdi){
  if (!urunAdi) return [];
  const adAlt = urunAdi.trim().toLowerCase();
  if (!adAlt) return [];
  const kodlar = new Set();
  (state.satinAlmalar || []).forEach(s => (s.kalemler || []).forEach(k => {
    if ((k.urun || "").trim().toLowerCase() === adAlt && k.kod && k.kod.trim()) kodlar.add(k.kod.trim());
  }));
  (state.tesisler || []).forEach(t => (t.makineler || []).forEach(m => (m.pompalar || []).forEach(p =>
    (p.gecmis || []).forEach(g => (g.malzemeler || []).forEach(mz => {
      if ((mz.ad || "").trim().toLowerCase() === adAlt && mz.kod && mz.kod.trim()) kodlar.add(mz.kod.trim());
    }))
  )));
  return [...kodlar].sort();
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
  else if (h.view === "malzemecikis") { if (h.tesisId) ui.cikisTesisId = h.tesisId; if (h.depoId) ui.cikisDepoId = h.depoId; malzemeCikisGoster(); }
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
const IZIN_VARSAYILAN_KAPALI = ["malzemeCikis", "transfer", "satinAlmaOnay"];
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
  if (adminMi() || satinAlmaOnaylayabilirMi() || !mevcutTesisErisimi) return true;
  if (!sat.yerler || sat.yerler.length === 0) return true;
  const adlar = erisilenTesisAdlari();
  return sat.yerler.some(y => adlar.has(y.ad));
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
  mevcutKullanici = null; mevcutRol = "personel"; mevcutTesisErisimi = null; mevcutIzinler = null; mevcutIsim = ""; mevcutAnaYonetici = false; dinleyiciBaslatildi = false; state = null;
  document.getElementById("uygulama").style.display = "none";
  document.getElementById("girisEkrani").style.display = "flex";
  document.getElementById("girisSifre").value = "";
  const btn = document.getElementById("girisButonu");
  if (btn) { btn.textContent = "Giriş yap"; btn.disabled = false; }
}

/* ---------------- rapor ekle ---------------- */
const SVG_YOLLARI = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 1 1-5.66 5.66L3 18v3h3l6.04-6.04a4 4 0 1 1 5.66-5.66z"/>',
  trendDown: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  factory: '<path d="M2 20V9l6 4V9l6 4V4l8 6v10z"/><line x1="2" y1="20" x2="22" y2="20"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/>',
};
function svgIkon(ad, boyut){
  const s = boyut || 15;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${s}" height="${s}">${SVG_YOLLARI[ad] || ''}</svg>`;
}

function render(){ renderSol(); renderAna(); renderSag(); renderUstNav(); logoGuncelle(); guncelleMalzemeListesi(); bildirimGuncelle(); }
function islemBadge(aciklama){
  const a = (aciklama || "").toLowerCase();
  if (a.includes("silindi")) return { etiket: "Silme", renk: "var(--kirmizi)", renkRgb: "var(--kirmizi-rgb)" };
  if (a.includes("stoğa eksi")) return { etiket: "Eksi Stok", renk: "var(--kirmizi)", renkRgb: "var(--kirmizi-rgb)" };
  if (a.includes("stoktan düşülmeli")) return { etiket: "Stok Uyarı", renk: "var(--turkuaz)", renkRgb: "var(--turkuaz-rgb)" };
  if (a.includes("onayland")) return { etiket: "Onay", renk: "var(--yesil)", renkRgb: "var(--yesil-rgb)" };
  if (a.includes("bakım yapıldı")) return { etiket: "Bakım", renk: "var(--yesil)", renkRgb: "var(--yesil-rgb)" };
  if (a.includes("rapor eklendi")) return { etiket: "Rapor", renk: "var(--vurgu)", renkRgb: "var(--vurgu-rgb)" };
  if (a.includes("satın alma")) return { etiket: "Satın Alma", renk: "var(--mavi)", renkRgb: "var(--mavi-rgb)" };
  if (a.includes("eklendi") || a.includes("oluşturuldu")) return { etiket: "Ekleme", renk: "var(--vurgu)", renkRgb: "var(--vurgu-rgb)" };
  return { etiket: "İşlem", renk: "var(--yazi-soluk)", renkRgb: "139,150,168" };
}
function renderSag(){
  const el = document.getElementById("sagMenu");
  const btn = document.getElementById("mobilSagBtn");
  if (!adminMi()) {
    if (el) { el.style.display = "none"; el.innerHTML = ""; }
    if (btn) btn.style.display = "none";
    return;
  }
  if (btn) btn.style.display = "";
  if (!el) return;
  el.style.display = "";
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
  else if (ui.view === "kullanicilar") renderKullanicilar();
  else if (ui.view === "bos") renderBos();
  else if (ui.view === "anasayfa") renderAnaSayfa();
  else if (ui.view === "bakim") renderBakim();
  else if (ui.view === "pompa") renderPompa();
  else if (ui.view === "rapor") renderRapor();
  else if (ui.view === "satinalma") renderSatinAlma();
  else if (ui.view === "satinalma-detay") renderSatinAlmaDetay();
  else if (ui.view === "malzemecikis") renderMalzemeCikis();
  else if (ui.view === "transfer") renderTransfer();
  else if (ui.view === "raporlar") renderRaporlar();
}
