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
function hizliSilTercihOku(){
  try { return localStorage.getItem("tys_hizli_sil") === "acik"; }
  catch(e){ return false; }
}
function hizliSilAcKapat(deger){
  try { localStorage.setItem("tys_hizli_sil", deger ? "acik" : "kapali"); } catch(e){}
  render();
}
function silOnayla(baslik, geriCagirFn){
  // Sadece Yönetici rolündeki kişi bu hızlı silme tercihini açabiliyor (Ayarlar'da).
  // Açıksa, matematik onayı sorulmadan doğrudan silme işlemi uygulanır.
  if (adminMi() && hizliSilTercihOku()) { geriCagirFn(); return; }
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
// GÜVENLİK (V108): Kullanıcı verisini onclick="..." gibi satır içi bir olay
// işleyicisine METİN argümanı olarak koymak için. esc() burada TEK BAŞINA
// yetmez: tarayıcı &#39; kodunu JS çalışmadan önce tekrar ' karakterine
// çevirir ve metin dizeden kaçabilir. Kullanım (tırnaksız!):
//   onclick="fonksiyon(${jsArg(deger)})"
function jsArg(deger){ return esc(JSON.stringify(String(deger ?? ""))); }
// GÜVENLİK (V108): Uygulama kimlikleri (id, tesisId, makineId...) yüzlerce yerde
// onclick="pompaSec('${t.id}')" şeklinde HTML'e basılıyor. Normalde uid() sadece
// harf/rakam üretir; ama biri F12'den tırnak içeren bir kimlik yazarsa bu,
// script enjeksiyonuna dönüşür. Veri sunucudan gelir gelmez, adı "id" olan ya da
// "Id" ile biten tüm alanlardan harf/rakam/-/_ dışındaki karakterler atılır.
const KIMLIK_DISI_KARAKTER = /[^A-Za-z0-9_-]/g;
function kimlikleriTemizle(nesne){
  if (Array.isArray(nesne)) { nesne.forEach(kimlikleriTemizle); return nesne; }
  if (nesne && typeof nesne === "object") {
    Object.keys(nesne).forEach(k => {
      const v = nesne[k];
      if (typeof v === "string" && (k === "id" || /Id$/.test(k))) nesne[k] = v.replace(KIMLIK_DISI_KARAKTER, "");
      else if (v && typeof v === "object") kimlikleriTemizle(v);
    });
  }
  return nesne;
}
function yetkiHatasiMi(err){ return !!(err && err.code === "permission-denied"); }
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
    silinenler: [],
    birimListesi: ["adet","koli","tane","kg","litre","metre","milimetre"],
    logoUrl: "",
    logoUrlKoyu: "",
    logoUrlAcik: "",
    satinAlmaOnaycisiId: ""
  };
}

/* ---------------- durum ---------------- */
let state = null;
let ui = { view: "anasayfa", secim: {}, acikTesis: new Set(), acikMakine: new Set(), acikGecmis: new Set(), duzenle: false, mesaj: "", saSecim: null, saDuzenle: false, saArama: "", saFiltre: "tumu", stokAcikTesis: new Set(), stokAcikDepo: new Set(), stokDuzenle: false, stokBekleyenAcik: new Set(), stokBekleyenSecim: {}, stokBekleyenDepo: {}, bakimAcikTesis: new Set(), bakimAcikMakine: new Set(), bakimAcikPompa: new Set(), genelArama: "", siralaModu: false, sistemKayitlariAcik: false, kayitTesisFiltre: "", cikisTesisId: "", cikisDepoId: "", cikisMiktarlar: {}, transferTesisId: "", transferDepoId: "", transferUrunId: "", transferMiktar: "", transferHedefTesisId: "", transferHedefDepoId: "", raporFiltre: "haftalik", saTesisFiltre: "", raporOzelBaslangic: "", raporOzelBitis: "", raporTakvimYil: 0, raporTakvimAy: 0, bakimGorunum: "liste", bakimTakvimYil: 0, bakimTakvimAy: 0, bakimTakvimSecili: "", yedekSecili: "", yedekAltSekme: "", kullaniciAcikId: "", duzenlenenId: null, silinenAcikId: "", kayitAcikId: "", saSiralama: "", parcaNotAcikId: "" };

function sanitizeVeri(v){
  if (!v) v = varsayilanVeri();
  if (!v.tesisler) v.tesisler = varsayilanVeri().tesisler;
  if (!v.malzemeGecmisi) v.malzemeGecmisi = [];
  v.malzemeGecmisi = v.malzemeGecmisi.map(x => typeof x === "string" ? { id: uid(), ad: x } : x);
  // Eski sürümlerde tek bir "kod" alanı vardı — artık her malzeme birden fazla
  // manuel kod tutabiliyor (manuelKodlar dizisi). Eski tekil kodu kaybetmemek için
  // diziye taşıyoruz.
  v.malzemeGecmisi.forEach(x => {
    if (!Array.isArray(x.manuelKodlar)) x.manuelKodlar = [];
    if (x.kod && x.kod.trim() && !x.manuelKodlar.includes(x.kod.trim())) x.manuelKodlar.push(x.kod.trim());
    delete x.kod; // eski tekil alanı kalıcı olarak temizle — aksi halde silinen
                  // manuel kod her veri yenilendiğinde bu alandan geri geliyordu.
  });
  // Geçmişte (eski sürümlerde) aynı isimle birden fazla kayıt oluşmuş olabilir
  // (örn. "Rulman" iki ayrı satırda, farklı kodlarla) — bunları isme göre
  // (büyük/küçük harf duyarsız) tek kayda birleştiriyoruz; kodlar zaten artık
  // dinamik olarak (satın alma + rapor geçmişinden + manuel girişlerden) hesaplanıyor.
  {
    const gorulen = new Map();
    const birlesik = [];
    v.malzemeGecmisi.forEach(x => {
      const anahtar = (x.ad || "").trim().toLowerCase();
      if (!anahtar) return;
      if (!gorulen.has(anahtar)) { gorulen.set(anahtar, x); birlesik.push(x); }
      else {
        const mevcut = gorulen.get(anahtar);
        if (x.birim && !mevcut.birim) mevcut.birim = x.birim;
        (x.manuelKodlar || []).forEach(kd => { if (!mevcut.manuelKodlar.includes(kd)) mevcut.manuelKodlar.push(kd); });
      }
    });
    v.malzemeGecmisi = birlesik;
  }
  if (!v.satinAlmalar) v.satinAlmalar = [];
  if (!v.sonIslemler) v.sonIslemler = [];
  if (!v.transferler) v.transferler = [];
  if (!v.silinenler) v.silinenler = [];
  // Birim listesi boşsa (hiç kaydedilmemişse) varsayılan setle başla — ama
  // kullanıcı Ayarlar'dan eklediği/kaldırdığı birimleri her zaman korunur.
  if (!Array.isArray(v.birimListesi) || v.birimListesi.length === 0) {
    v.birimListesi = ["adet","koli","tane","kg","litre","metre","milimetre"];
  }
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

// ---------------------------------------------------------------------
// VERİ YAPISI (V76'dan itibaren): Tüm veri artık TEK bir "veri/ana" belgesi
// yerine BİRDEN FAZLA belgeye bölünmüş durumda — her belgenin kendi 1MB'lık
// bütçesi olsun diye:
//   tesisler/{tesisId}      -> her tesis (makineler, depolar dahil) kendi belgesi
//   ortak/satinAlmalar      -> { satinAlmalar: [...] }
//   ortak/malzemeGecmisi    -> { malzemeGecmisi: [...] }
//   ortak/sonIslemler       -> { sonIslemler: [...] }
//   ortak/transferler       -> { transferler: [...] }
//   ortak/silinenler        -> { silinenler: [...] }
// Eski "veri/ana" belgesi SİLİNMİYOR — ilk açılışta oradan yeni yapıya
// tek seferlik otomatik bir göç yapılıyor, sonra bir daha dokunulmuyor.
// Uygulamanın geri kalanı (render fonksiyonları, tüm ekle/sil/güncelle
// fonksiyonları) hiç değişmedi — hepsi hâlâ tek bir `state` nesnesi
// üzerinden çalışıyor; state artık sadece BİRLEŞTİRİLEREK oluşturuluyor.
// ---------------------------------------------------------------------
const eskiVeriRef = db.collection("veri").doc("ana");
const tesislerRef = db.collection("tesisler");
const ortakRef = db.collection("ortak");
const ORTAK_ALANLAR = ["satinAlmalar", "malzemeGecmisi", "sonIslemler", "transferler", "silinenler", "birimListesi"];
// GÜVENLİK (V108): Bu iki belgeye HERKES yeni kayıt düşer (her işlem bir log,
// her silme bir çöp kopyası). Bunlar artık listenin tamamı baştan yazılarak
// DEĞİL, arrayUnion ile SADECE SONA EKLENEREK kaydediliyor. Böylece:
//  - Silinenleri okuma izni olmayan biri de silme yapabiliyor (listeyi okumadan),
//  - Kimse başkasının kaydını ezemiyor/silemiyor (kurallar da bunu zorluyor).
// Listeden ÇIKARMA (geri getirme, temizleme, kırpma) sadece ortakTamYaz() ile,
// yetkisi olanlar tarafından yapılır.
const EKLEMELI_ALANLAR = ["sonIslemler", "silinenler"];
const EKLEMELI_SINIR = { sonIslemler: 2000, silinenler: 300 };

let mevcutKullanici = null;
const UYGULAMA_SURUM_NO = "108";
function uygulamaSurumMetni(){
  const lm = new Date(document.lastModified);
  const p = (n) => String(n).padStart(2, "0");
  const saat = `${p(lm.getHours())}:${p(lm.getMinutes())}`;
  const tarih = `${p(lm.getDate())}.${p(lm.getMonth()+1)}.${lm.getFullYear()}`;
  return `V${UYGULAMA_SURUM_NO} - ${saat} - ${tarih}`;
}
let mevcutRol = "personel";
let mevcutYetkilendirildi = true;
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


// GÜVENLİK (V108): Personelin hangi ortak belgeleri OKUYABİLECEĞİ — firestore.rules
// içindeki ortakOkunabilir() ile BİREBİR aynı olmalı. Okuyamadığı belgeye hiç
// dinleyici açılmaz (veri istemciye hiç gelmez) ve o belgeye asla yazılmaz.
function ortakOkunabilirMi(alan){
  if (adminMi()) return true;
  if (alan === "satinAlmalar") return izinVar('satinAlmalar') || satinAlmaOnaylayabilirMi();
  if (alan === "transferler" || alan === "tesisDizini") return izinVar('transfer');
  if (alan === "silinenler") return izinVar('silinenGeriGetir');
  return true; // malzemeGecmisi, sonIslemler, birimListesi
}

// Son okunan/yazılan hâllerin JSON'u — saveData() sadece DEĞİŞEN belgeleri yazar.
// ("t:<tesisId>" ve "o:<alan>" anahtarlarıyla)
let sonKayitliJSON = {};
let bekleyenEklemeler = { sonIslemler: [], silinenler: [] };
let aktifDinleyiciler = [];
function dinleyicileriKapat(){
  aktifDinleyiciler.forEach(kapat => { try { kapat(); } catch(e){} });
  aktifDinleyiciler = [];
}

function saveData(){
  if (!state) return;
  if (yetkiKilitliMi()) return;
  // 1) Tesisler — sadece bu kullanıcının yüklediği ve DEĞİŞEN tesisler yazılır.
  //    (Eskiden her kayıtta TÜM tesisler baştan yazılıyordu.)
  (state.tesisler || []).forEach(t => {
    const anahtar = "t:" + t.id;
    const json = JSON.stringify(t);
    if (sonKayitliJSON[anahtar] === json) return;
    sonKayitliJSON[anahtar] = json;
    tesislerRef.doc(t.id).set(t).catch(err => {
      console.error(`Tesis kaydetme hatası (${t.ad}):`, err);
      delete sonKayitliJSON[anahtar];
      toastGoster(yetkiHatasiMi(err)
        ? `"${t.ad}" tesisinde bu değişikliği yapma yetkiniz yok.`
        : `"${t.ad}" tesisi kaydedilemedi — bu tesisin verisi 1MB sınırına yaklaşmış olabilir.`, "hata");
    });
  });
  // 2) Ortak belgeler — sadece OKUYABİLDİĞİ ve DEĞİŞEN belgeler baştan yazılır.
  //    Okuyamadığı bir belgeyi (elindeki boş listeyle) ezmesi böylece imkânsız.
  ORTAK_ALANLAR.forEach(alan => {
    if (EKLEMELI_ALANLAR.includes(alan)) return;
    if (!ortakOkunabilirMi(alan)) return;
    const anahtar = "o:" + alan;
    const json = JSON.stringify(state[alan] || []);
    if (sonKayitliJSON[anahtar] === json) return;
    sonKayitliJSON[anahtar] = json;
    ortakRef.doc(alan).set({ [alan]: state[alan] || [] }).catch(err => {
      console.error(`"${alan}" kaydetme hatası:`, err);
      delete sonKayitliJSON[anahtar];
      toastGoster(yetkiHatasiMi(err) ? "Bu işlem için yetkiniz yok." : "Değişiklik kaydedilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.", "hata");
    });
  });
  // 3) Sistem kayıtları ve silinenler — kuyruktaki yeni kayıtlar SONA eklenir.
  EKLEMELI_ALANLAR.forEach(alan => {
    const kuyruk = bekleyenEklemeler[alan];
    if (!kuyruk || kuyruk.length === 0) return;
    bekleyenEklemeler[alan] = [];
    ortakRef.doc(alan).update({ [alan]: firebase.firestore.FieldValue.arrayUnion(...kuyruk) }).catch(err => {
      console.error(`"${alan}" ekleme hatası:`, err);
      toastGoster(yetkiHatasiMi(err) ? "Bu işlem için yetkiniz yok." : "Değişiklik kaydedilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.", "hata");
    });
  });
  if (adminMi()) tesisDiziniGuncelle();
}
// Eklemeli bir listeyi (sonIslemler/silinenler) çıkarma/temizleme sonrası
// baştan yazar. Kurallar bunu sadece yetkisi olana izin verir.
function ortakTamYaz(alan){
  const liste = state[alan] || [];
  sonKayitliJSON["o:" + alan] = JSON.stringify(liste);
  return ortakRef.doc(alan).set({ [alan]: liste }).catch(err => {
    console.error(`"${alan}" yazma hatası:`, err);
    toastGoster(yetkiHatasiMi(err) ? "Bu işlem için yetkiniz yok." : "Değişiklik kaydedilemedi.", "hata");
  });
}
// Eklemeli listelerde sıra: yeni kayıtlar arrayUnion ile SONA eklendiği için
// ekranda en yeni üstte olsun diye "zaman" alanına göre sıralanır. "zaman" alanı
// olmayan eski (V107 ve öncesi) kayıtlar zaten en yeni üstte saklıydı —
// sıralarını koruyarak en alta konur.
function eklemeliSirala(liste){
  const zamanli = liste.filter(x => x && typeof x.zaman === "number").sort((a, b) => b.zaman - a.zaman);
  const eski = liste.filter(x => !(x && typeof x.zaman === "number"));
  return [...zamanli, ...eski];
}

// ---------------------------------------------------------------------
// TESİS DİZİNİ (V108): Kısıtlı personel artık erişimi olmayan tesislerin
// verisini hiç indirmiyor. Ama Transfer'de HEDEF olarak başka bir tesisin
// deposunu seçebilmesi gerekiyor. Bunun için sadece ad + depo adlarını içeren
// küçük bir özet belge (ortak/tesisDizini) tutuluyor — stok, makine, rapor
// gibi hiçbir içerik yok. Sadece Transfer izni olanlar okuyabilir, sadece
// yönetici yazabilir (yönetici oturumu açıkken otomatik güncellenir).
// ---------------------------------------------------------------------
let tesisDizini = [];
let sonTesisDiziniJSON = null;
function diziniNormallestir(liste){
  return [...(liste || [])].sort((a, b) => (a.id || "").localeCompare(b.id || "")).map(t => ({
    id: t.id, ad: t.ad || "", gizli: !!t.gizli,
    depolar: (t.depolar || []).map(d => ({ id: d.id, ad: d.ad || "", gizli: !!d.gizli }))
  }));
}
function tesisDiziniOlustur(){ return diziniNormallestir(state.tesisler); }
function tesisDiziniGuncelle(){
  if (!adminMi() || !state || sonTesisDiziniJSON === null) return;
  const yeni = tesisDiziniOlustur();
  const json = JSON.stringify(yeni);
  if (json === sonTesisDiziniJSON) return;
  sonTesisDiziniJSON = json;
  ortakRef.doc("tesisDizini").set({ tesisler: yeni }).catch(err => console.error("Tesis dizini yazılamadı:", err));
}
// Transfer hedef listesi: erişebildiği tesisler güncel hâliyle state'ten,
// diğerleri dizinden gelir.
function transferHedefTesisleri(){
  const harita = {};
  (tesisDizini || []).forEach(t => { if (!t.gizli) harita[t.id] = t; });
  (state.tesisler || []).forEach(t => {
    if (t.gizli) { delete harita[t.id]; return; }
    harita[t.id] = { id: t.id, ad: t.ad, depolar: (t.depolar || []).map(d => ({ id: d.id, ad: d.ad, gizli: !!d.gizli })) };
  });
  const idSirasi = siraliListe(Object.keys(harita).sort(), siraOku().tesisler);
  return idSirasi.map(id => harita[id]).filter(Boolean);
}

// Eski tek-belgeli veriyi yeni (bölünmüş) yapıya BİR KEZ aktarır.
// "tesisler" koleksiyonu zaten doluysa (göç daha önce yapılmışsa) hiçbir
// şey yapmaz — bu yüzden yanlışlıkla üzerine yazma riski yoktur.
// V108: Sadece yönetici çalıştırır (veri/ana artık sadece yöneticiye açık).
async function eskiVeridenGocEt(){
  if (!adminMi()) return;
  const kontrol = await tesislerRef.limit(1).get();
  if (!kontrol.empty) return; // zaten göç edilmiş
  const eskiSnap = await eskiVeriRef.get();
  const kaynak = eskiSnap.exists ? sanitizeVeri(eskiSnap.data()) : varsayilanVeri();
  await Promise.all((kaynak.tesisler || []).map(t => tesislerRef.doc(t.id).set(t)));
  await Promise.all(ORTAK_ALANLAR.map(alan => ortakRef.doc(alan).set({ [alan]: kaynak[alan] || [] })));
  console.log("Veri, bölünmüş (çoklu belge) yapıya aktarıldı.");
}

let tesislerYuklendi = false;
let ortakYuklenenler = new Set();
let sonTesislerHam = [];
let sonOrtakHam = {};

function stateBirlestirVeRenderla(){
  if (!tesislerYuklendi || ortakYuklenenler.size < ORTAK_ALANLAR.length) return; // henüz tüm parçalar gelmedi
  const ham = {
    tesisler: [...sonTesislerHam].sort((a,b) => (a.id||"").localeCompare(b.id||"")),
    satinAlmalar: sonOrtakHam.satinAlmalar || [],
    malzemeGecmisi: sonOrtakHam.malzemeGecmisi || [],
    sonIslemler: eklemeliSirala(sonOrtakHam.sonIslemler || []),
    transferler: sonOrtakHam.transferler || [],
    silinenler: eklemeliSirala(sonOrtakHam.silinenler || []),
    birimListesi: sonOrtakHam.birimListesi || [],
    logoUrl: "", logoUrlKoyu: "", logoUrlAcik: "", satinAlmaOnaycisiId: ""
  };
  state = kimlikleriTemizle(sanitizeVeri(ham));
  // Değişiklik takibi için "sunucudaki hâl" referansı
  sonKayitliJSON = {};
  state.tesisler.forEach(t => { sonKayitliJSON["t:" + t.id] = JSON.stringify(t); });
  ORTAK_ALANLAR.forEach(alan => { sonKayitliJSON["o:" + alan] = JSON.stringify(state[alan] || []); });
  if (adminMi()) yoneticiBakimIsleri();
  if (document.getElementById("uygulama").style.display !== "none") {
    if (!ui.acikTesis || ui.acikTesis.size === 0) ui.acikTesis.add(state.tesisler[0]?.id);
    render();
  }
  if (window.yedeklemeBaslat) window.yedeklemeBaslat();
}
// Sadece yönetici oturumunda: eklemeli listeleri sınırda tut, tesis dizinini güncelle.
function yoneticiBakimIsleri(){
  EKLEMELI_ALANLAR.forEach(alan => {
    const sinir = EKLEMELI_SINIR[alan];
    if ((sonOrtakHam[alan] || []).length > sinir) {
      state[alan] = state[alan].slice(0, sinir);
      ortakTamYaz(alan);
    }
  });
  tesisDiziniGuncelle();
}

function tesisDinlemeyeBasla(){
  const hataOldu = (err) => {
    console.error("Tesisler dinleme hatası:", err);
    toastGoster(yetkiHatasiMi(err) ? "Tesis verisine erişim yetkiniz yok." : "Veri sunucusuna bağlanılamadı. İnternet bağlantınızı kontrol edin.", "hata");
  };
  // Tüm tesislere erişimi olan: koleksiyonun tamamı.
  if (adminMi() || !mevcutTesisErisimi) {
    aktifDinleyiciler.push(tesislerRef.onSnapshot(snap => {
      sonTesislerHam = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      tesislerYuklendi = true;
      stateBirlestirVeRenderla();
    }, err => { hataOldu(err); sonTesislerHam = []; tesislerYuklendi = true; stateBirlestirVeRenderla(); }));
    return;
  }
  // GÜVENLİK (V108): Kısıtlı personel — SADECE erişimi olan tesis belgeleri tek
  // tek dinlenir. Diğer tesislerin verisi tarayıcıya hiç gelmez.
  const idler = mevcutTesisErisimi.filter(id => typeof id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(id));
  if (idler.length === 0) { sonTesislerHam = []; tesislerYuklendi = true; stateBirlestirVeRenderla(); return; }
  const beklenen = new Set(idler);
  const gelenler = {};
  const tamamla = (id) => {
    beklenen.delete(id);
    sonTesislerHam = Object.values(gelenler);
    if (beklenen.size === 0) { tesislerYuklendi = true; stateBirlestirVeRenderla(); }
  };
  idler.forEach(id => {
    aktifDinleyiciler.push(tesislerRef.doc(id).onSnapshot(snap => {
      if (snap.exists) gelenler[id] = { id: snap.id, ...snap.data() };
      else delete gelenler[id];
      tamamla(id);
    }, err => { hataOldu(err); delete gelenler[id]; tamamla(id); }));
  });
}

function veriDinlemeyeBasla(){
  if (dinleyiciBaslatildi) return;
  dinleyiciBaslatildi = true;
  // GÜVENLİK (V108): Yetkilendirilmemiş (kilitli) hesap HİÇBİR veri çekmez.
  if (yetkiKilitliMi()) {
    state = sanitizeVeri({ tesisler: [] });
    render();
    return;
  }
  const baslat = () => {
    tesisDinlemeyeBasla();
    ORTAK_ALANLAR.forEach(alan => {
      if (!ortakOkunabilirMi(alan)) {
        // Yetkisi olmayan belge hiç istenmez — boş kabul edilir.
        sonOrtakHam[alan] = [];
        ortakYuklenenler.add(alan);
        return;
      }
      aktifDinleyiciler.push(ortakRef.doc(alan).onSnapshot(snap => {
        sonOrtakHam[alan] = snap.exists ? (snap.data()[alan] || []) : [];
        ortakYuklenenler.add(alan);
        stateBirlestirVeRenderla();
      }, err => {
        console.error(`"${alan}" dinleme hatası:`, err);
        sonOrtakHam[alan] = [];
        ortakYuklenenler.add(alan);
        stateBirlestirVeRenderla();
      }));
    });
    if (ortakOkunabilirMi("tesisDizini")) {
      aktifDinleyiciler.push(ortakRef.doc("tesisDizini").onSnapshot(snap => {
        tesisDizini = diziniNormallestir(kimlikleriTemizle(snap.exists ? (snap.data().tesisler || []) : []));
        sonTesisDiziniJSON = JSON.stringify(tesisDizini);
        if (adminMi()) tesisDiziniGuncelle();
        if (state && ui.view === "transfer") render();
      }, err => console.error("Tesis dizini dinleme hatası:", err)));
    }
  };
  eskiVeridenGocEt().catch(err => console.error("Göç hatası:", err)).finally(baslat);
}
async function kullaniciRoluAyarla(user){
  mevcutKullanici = user;
  const ref = db.collection("kullanicilar").doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    // GÜVENLİK (V108): YENİ kaydolan her kullanıcı kilitli personel olarak başlar.
    // Eskiden "ilk kullanıcı mıyım?" diye tüm kullanıcı listesi okunuyordu —
    // artık liste sadece yöneticiye açık ve yönetici zaten mevcut. (Boş bir
    // projede ilk yönetici, Firebase Console'dan rol: "yonetici" yazılarak atanır.)
    // Kurallar da bu belgenin sadece bu alanlarla ve bu değerlerle
    // oluşturulmasına izin veriyor.
    mevcutRol = "personel";
    await ref.set({ eposta: user.email, rol: "personel", anaYonetici: false, yetkilendirildi: false });
    mevcutTesisErisimi = null;
    mevcutIzinler = null;
    mevcutIsim = "";
    mevcutAnaYonetici = false;
    mevcutYetkilendirildi = false;
  } else {
    mevcutRol = snap.data().rol || "personel";
    const liste = snap.data().tesisErisimi;
    mevcutTesisErisimi = Array.isArray(liste) && liste.length > 0 ? liste : null;
    mevcutIzinler = snap.data().izinler || null;
    mevcutIsim = snap.data().isim || "";
    mevcutAnaYonetici = snap.data().anaYonetici === true;
    // Geriye dönük uyumluluk: bu alan daha önce hiç yoktu — eski (halihazırda
    // kullanımda olan) kullanıcılarda alan tanımsızsa, YETKİLİ sayılır (kilitlenmez).
    // Sadece AÇIKÇA false ise kilitli sayılır.
    mevcutYetkilendirildi = snap.data().yetkilendirildi !== false;
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
// V108: Kullanıcının IP adresi artık üçüncü taraf bir servise (ipify) gönderilip
// toplanmıyor. Kurallar da kullanıcının kendi kaydında SADECE bu üç alanı
// değiştirmesine izin veriyor.
function girisKaydiTut(user){
  const bilgi = { sonGirisTarihi: bugun(), sonGirisSaati: suAn(), tarayici: tarayiciAdi() };
  db.collection("kullanicilar").doc(user.uid).set(bilgi, { merge: true }).catch(err => console.error(err));
}
// İki depo ürününün "aynı ürün" sayılması için ad YETMEZ — kod da eşleşmeli.
// Aksi halde "Rulman 6305" ile "Rulman 6405" yanlışlıkla aynı ürün sayılıp
// stokları birbirine karışır. Her ikisinde de kod yoksa (boşsa) yine eşleşir,
// bu da kod kullanılmayan genel ürünlerin eskisi gibi birleşmesini sağlar.
function urunEslesiyorMu(u, ad, kod){
  if ((u.ad || "").trim().toLowerCase() !== (ad || "").trim().toLowerCase()) return false;
  return (u.kod || "").trim().toLowerCase() === (kod || "").trim().toLowerCase();
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
  (state.tesisler || []).forEach(t => (t.depolar || []).forEach(d => (d.urunler || []).forEach(u => {
    if ((u.ad || "").trim().toLowerCase() === adAlt && u.kod && u.kod.trim()) kodlar.add(u.kod.trim());
  })));
  (state.malzemeGecmisi || []).forEach(m => {
    if ((m.ad || "").trim().toLowerCase() === adAlt) (m.manuelKodlar || []).forEach(kd => { if (kd && kd.trim()) kodlar.add(kd.trim()); });
  });
  return [...kodlar].sort();
}
function kaydetIslem(aciklama, hedef){
  if (!state.sonIslemler) state.sonIslemler = [];
  const kullanici = mevcutKullanici ? mevcutKullanici.email : "";
  const kayit = { id: uid(), aciklama, kullanici, hedef: hedef || null, tarih: bugun(), saat: suAn(), zaman: Date.now() };
  state.sonIslemler.unshift(kayit);
  // V108: Kayıt listenin tamamı yeniden yazılarak DEĞİL, sona eklenerek kaydedilir
  // (bkz. EKLEMELI_ALANLAR). 2000 sınırını yönetici oturumu korur.
  bekleyenEklemeler.sonIslemler.push(kayit);
  if (state.sonIslemler.length > 2000) state.sonIslemler.length = 2000;
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
  else if (h.view === "transfer") transferGoster();
  else if (h.view === "ayarlar") ayarlarGoster();
  else if (h.view === "silinenler") silinenlerGoster();
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
// Bir tesisin depolarında KAYITLI olan (stokta bulunan) tüm ürün adlarını döndürür.
// Rapor Ekle'de "Malzeme adı" yazarken, sadece SEÇİLİ tesisin deposunda gerçekten
// olan ürünleri önermek için kullanılır — depoda olmayan bir ürün yazınca hiçbir
// öneri çıkmaz.
function tesisDepoUrunAdlari(tesisId){
  const t = state.tesisler.find(x => x.id === tesisId);
  if (!t) return [];
  const adlar = new Set();
  (t.depolar || []).forEach(d => (d.urunler || []).forEach(u => { if (u.ad && u.ad.trim()) adlar.add(u.ad.trim()); }));
  return [...adlar].sort();
}

/* ---------------- silinen veriler (geri getirme) ---------------- */
// Yapısal öneme sahip kayıtlar (tesis/makine/pompa/parça, bakım planı, depo,
// stok ürünü, satın alma talebi) silinmeden HEMEN ÖNCE buraya (state.silinenler)
// bir kopyası düşülür. "baglam" alanı, geri getirirken hangi tesis/makine/depo/
// pompanın altına konması gerektiğini hatırlamak için kullanılır.
function copeAt(tip, veri, baglam){
  if (!state.silinenler) state.silinenler = [];
  const kayit = {
    id: uid(), tip, veri: JSON.parse(JSON.stringify(veri)), baglam: baglam || {},
    silenKullanici: mevcutIsim || (mevcutKullanici ? mevcutKullanici.email : ""),
    tarih: bugun(), saat: suAn(), zaman: Date.now()
  };
  state.silinenler.unshift(kayit);
  // V108: Silinenleri OKUMA izni olmayan biri de silme yapabildiği için kopya
  // listeyi okumadan, sona eklenerek kaydedilir. 300 sınırını yönetici oturumu korur.
  bekleyenEklemeler.silinenler.push(kayit);
  if (state.silinenler.length > 300) state.silinenler.length = 300;
}
// Bir çöp kaydının, GÖRÜNTÜLEYEN kişiye gösterilip gösterilmeyeceğine karar verir.
// Yönetici her zaman görür. "silinenGeriGetir" yetkisi olmayan hiç göremez.
// Yetkisi olan biri ise, sadece KENDİ erişebildiği tesislere ait silinen
// kayıtları görür (örn. sadece Yıkama tesisine erişimi olan, sadece Yıkama'daki
// silinenleri görür).
function silinenGorunurMu(kayit){
  if (adminMi()) return true;
  if (!izinVar('silinenGeriGetir')) return false;
  if (!mevcutTesisErisimi) return true;
  if (kayit.baglam && kayit.baglam.tesisId) return mevcutTesisErisimi.includes(kayit.baglam.tesisId);
  if (kayit.tip === "satinalma" && kayit.baglam && Array.isArray(kayit.baglam.yerAdlari)) {
    const adlar = erisilenTesisAdlari();
    return kayit.baglam.yerAdlari.some(ad => adlar.has(ad));
  }
  return false;
}
function silinenBaslikHesapla(kayit){
  const v = kayit.veri || {};
  const tipAdlari = { tesis:"Tesis", makine:"Makine", pompa:"Pompa", parca:"Parça", bakim:"Bakım Planı", bakimPompa:"Bakım Planı", depo:"Depo", stokUrun:"Stok Ürünü", satinalma:"Satın Alma Talebi" };
  const ad = v.ad || v.urun || v.siparisNo || "(isimsiz)";
  return `${tipAdlari[kayit.tip] || kayit.tip}: ${ad}`;
}
function silinenlerGoster(){
  if (!adminMi() && !izinVar('silinenGeriGetir')) return;
  ui.view = "silinenler"; render();
}
function silinenAcKapat(id){ ui.silinenAcikId = (ui.silinenAcikId === id) ? "" : id; render(); }
function silinenGeriGetir(id){
  const kayit = (state.silinenler || []).find(x => x.id === id);
  if (!kayit || !silinenGorunurMu(kayit)) return;
  const v = kayit.veri;
  const b = kayit.baglam || {};
  try {
    if (kayit.tip === "tesis") {
      state.tesisler.push(v);
    } else if (kayit.tip === "makine") {
      const t = state.tesisler.find(x => x.id === b.tesisId);
      if (!t) { toastGoster("Bu tesis artık mevcut değil, geri getirilemiyor.", "hata"); return; }
      t.makineler.push(v);
    } else if (kayit.tip === "pompa") {
      const t = state.tesisler.find(x => x.id === b.tesisId);
      const m = t?.makineler.find(x => x.id === b.makineId);
      if (!m) { toastGoster("Bu makine artık mevcut değil, geri getirilemiyor.", "hata"); return; }
      m.pompalar.push(v);
    } else if (kayit.tip === "parca") {
      const t = state.tesisler.find(x => x.id === b.tesisId);
      const m = t?.makineler.find(x => x.id === b.makineId);
      const p = m?.pompalar.find(x => x.id === b.pompaId);
      if (!p) { toastGoster("Bu pompa artık mevcut değil, geri getirilemiyor.", "hata"); return; }
      p.parcalar.push(v);
    } else if (kayit.tip === "bakim") {
      const t = state.tesisler.find(x => x.id === b.tesisId);
      const m = t?.makineler.find(x => x.id === b.makineId);
      if (!m) { toastGoster("Bu makine artık mevcut değil, geri getirilemiyor.", "hata"); return; }
      m.bakimlar.push(v);
    } else if (kayit.tip === "bakimPompa") {
      const t = state.tesisler.find(x => x.id === b.tesisId);
      const m = t?.makineler.find(x => x.id === b.makineId);
      const p = m?.pompalar.find(x => x.id === b.pompaId);
      if (!p) { toastGoster("Bu pompa artık mevcut değil, geri getirilemiyor.", "hata"); return; }
      p.bakimlar.push(v);
    } else if (kayit.tip === "depo") {
      const t = state.tesisler.find(x => x.id === b.tesisId);
      if (!t) { toastGoster("Bu tesis artık mevcut değil, geri getirilemiyor.", "hata"); return; }
      t.depolar.push(v);
    } else if (kayit.tip === "stokUrun") {
      const t = state.tesisler.find(x => x.id === b.tesisId);
      const d = t?.depolar.find(x => x.id === b.depoId);
      if (!d) { toastGoster("Bu depo artık mevcut değil, geri getirilemiyor.", "hata"); return; }
      d.urunler.push(v);
    } else if (kayit.tip === "satinalma") {
      state.satinAlmalar.push(v);
    } else {
      toastGoster("Bilinmeyen kayıt türü, geri getirilemiyor.", "hata"); return;
    }
    state.silinenler = state.silinenler.filter(x => x.id !== id);
    ortakTamYaz("silinenler");
    kaydetIslem(`Silinen veri geri getirildi: ${silinenBaslikHesapla(kayit)}`, { view: "silinenler" });
    toastGoster("Geri getirildi.", "basari");
    saveData(); render();
  } catch (e) {
    console.error(e);
    toastGoster("Geri getirilemedi — bağlı olduğu üst kayıt bulunamadı olabilir.", "hata");
  }
}

const IZIN_VARSAYILAN_KAPALI = ["malzemeCikis", "transfer", "satinAlmaOnay", "silinenGeriGetir"];
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
  // V108: Çıkışta tüm Firestore dinleyicileri kapatılır ve bellekteki veri silinir.
  dinleyicileriKapat();
  tesislerYuklendi = false; ortakYuklenenler = new Set(); sonTesislerHam = []; sonOrtakHam = {};
  sonKayitliJSON = {}; bekleyenEklemeler = { sonIslemler: [], silinenler: [] };
  tesisDizini = []; sonTesisDiziniJSON = null;
  if (typeof kullanicilarListesi !== "undefined") kullanicilarListesi = [];
  mevcutKullanici = null; mevcutRol = "personel"; mevcutTesisErisimi = null; mevcutIzinler = null; mevcutIsim = ""; mevcutAnaYonetici = false; mevcutYetkilendirildi = true; dinleyiciBaslatildi = false; state = null;
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

function yetkiKilitliMi(){ return !adminMi() && mevcutYetkilendirildi === false; }
function renderYetkiKilitli(){
  const sol = document.getElementById("solMenu"); if (sol) sol.innerHTML = "";
  const sag = document.getElementById("sagMenu"); if (sag) { sag.innerHTML = ""; sag.style.display = "none"; }
  const nav = document.getElementById("ustNav"); if (nav) nav.innerHTML = "";
  ["mobilSagBtn","mobilSolBtn","aramaBtn","lambaBtn","canBtn","ayarlarBtn"].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = "none";
  });
  const ana = document.getElementById("anaPanel");
  if (ana) ana.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:40px 20px">
      <div style="font-size:56px;margin-bottom:16px">🔒</div>
      <div style="font-size:22px;font-weight:800;color:var(--yazi);margin-bottom:10px">Yetki Talep Edin</div>
      <div class="bosMetin" style="max-width:420px;font-size:14px;line-height:1.6">Hesabınıza henüz hiçbir yetki tanımlanmadı. Bu sistemi kullanabilmeniz için yöneticinizden Ayarlar → Kullanıcılar ve Yetkiler bölümünden size erişim vermesini isteyin. Yetkiniz tanımlandığında, bir sonraki girişinizde ilgili bölümleri görebileceksiniz.</div>
    </div>`;
  logoGuncelle();
}
function render(){
  if (yetkiKilitliMi()) { renderYetkiKilitli(); return; }
  renderSol(); renderAna(); renderSag(); renderUstNav(); logoGuncelle(); guncelleMalzemeListesi(); bildirimGuncelle();
}
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
  else if (ui.view === "silinenler") renderSilinenler();
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
