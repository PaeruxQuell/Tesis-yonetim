/* ---------------- otomatik günlük yedekleme ---------------- */
// Firestore yapısı:
//   yedekler/{id}       -> hafif özet bilgi (liste için hızlı okunur)
//   yedekVerileri/{id}  -> asıl veri (JSON), sadece önizleme/indirme açıldığında çekilir
// id formatı: "13-08-2026" (tarihteki noktalar tire ile değiştirilmiş hali)

let yedeklemeZamanlayicisiKuruldu = false;

function yedekDokumanId(tarihStr){ return tarihStr.replace(/\./g, "-"); }
function yedekSiraAnahtari(tarihStr){
  const [g, a, y] = tarihStr.split(".");
  return `${y}-${a}-${g}`;
}

async function bugununYedeginiGuncelle(kapandiMi){
  if (!state || !adminMi()) return;
  const tarihStr = bugun();
  const id = yedekDokumanId(tarihStr);
  const ozet = {
    tarih: tarihStr,
    saat: suAn(),
    sira: yedekSiraAnahtari(tarihStr),
    tesisSayisi: (state.tesisler || []).length,
    malzemeGecmisiSayisi: (state.malzemeGecmisi || []).length,
    satinAlmaSayisi: (state.satinAlmalar || []).length,
    transferSayisi: (state.transferler || []).length,
    kapandi: !!kapandiMi
  };
  // Not: hata burada YUTULMUYOR — çağıran taraf (manuelYedekAl) gerçek
  // başarı/başarısızlık durumunu görüp kullanıcıya doğru mesajı gösterebilsin.
  await db.collection("yedekler").doc(id).set(ozet, { merge: true });
  await db.collection("yedekVerileri").doc(id).set({ veriJSON: JSON.stringify(state) });
}

function yedeklemeZamanlayiciKur(){
  const simdi = new Date();
  const hedef = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate(), 23, 59, 0, 0);
  if (hedef.getTime() <= simdi.getTime()) hedef.setDate(hedef.getDate() + 1);
  const ms = hedef.getTime() - simdi.getTime();
  setTimeout(async () => {
    try { await bugununYedeginiGuncelle(true); } catch (err) { console.error("Otomatik yedekleme hatası:", err); } // günü kapat
    yedeklemeZamanlayiciKur(); // bir sonraki gün için tekrar kur
  }, ms);
}

window.yedeklemeBaslat = function(){
  if (yedeklemeZamanlayicisiKuruldu) return;
  if (!adminMi()) return;
  yedeklemeZamanlayicisiKuruldu = true;
  bugununYedeginiGuncelle(false).catch(err => console.error("Otomatik yedekleme hatası:", err)); // güne dair ilk (henüz kapanmamış) yedek
  yedeklemeZamanlayiciKur();
};

/* ---------------- manuel yedekleme (sadece Yönetici) ---------------- */
let manuelYedekAliniyor = false;
async function manuelYedekAl(){
  if (!adminMi()) return;
  if (manuelYedekAliniyor) return;
  manuelYedekAliniyor = true;
  render();
  try {
    await bugununYedeginiGuncelle(false);
    kaydetIslem("Günlük yedek manuel olarak alındı.", { view: "ayarlar" });
    yedekOnizlemeVerisi = {};
    toastGoster("Yedek başarıyla alındı.", "basari");
    try { await yedeklerYukle(); } catch (e) { console.error("Liste yenilenemedi:", e); }
  } catch (err) {
    console.error(err);
    const izinHatasiMi = err && (err.code === "permission-denied" || /permission/i.test(err.message||""));
    toastGoster(izinHatasiMi ? "Yedek alınamadı — Firestore güvenlik kuralları 'yedekler' ve 'yedekVerileri' koleksiyonlarına izin vermiyor olabilir." : "Yedek alınamadı, tekrar deneyin.", "hata");
  } finally {
    manuelYedekAliniyor = false;
    render();
  }
}

/* ---------------- Ayarlar: yedek listesi ve önizleme ---------------- */
let yedeklerListesi = [];
let yedekOnizlemeVerisi = {};

function yedeklerYukle(){
  if (!adminMi()) return Promise.resolve();
  return db.collection("yedekler").orderBy("sira", "desc").limit(90).get().then(snap => {
    yedeklerListesi = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (ui.view === "ayarlar") render();
  }).catch(err => { console.error("Yedek listesi alınamadı:", err); throw err; });
}

function yedekOnizleAc(id){
  ui.yedekSecili = (ui.yedekSecili === id) ? "" : id;
  if (ui.yedekSecili && !yedekOnizlemeVerisi[id]) {
    db.collection("yedekVerileri").doc(id).get().then(snap => {
      if (snap.exists) {
        yedekOnizlemeVerisi[id] = snap.data().veriJSON;
        if (ui.view === "ayarlar") render();
      }
    }).catch(err => console.error("Yedek verisi alınamadı:", err));
  }
  render();
}

function yedekIndir(id){
  const json = yedekOnizlemeVerisi[id];
  if (!json) { toastGoster("Önce önizlemeyi açın, veri henüz yüklenmedi.", "hata"); return; }
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `yedek-${id}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function yedekGeriYukle(id){
  if (!adminMi()) return;
  const json = yedekOnizlemeVerisi[id];
  if (!json) { toastGoster("Önce önizlemeyi açın, veri henüz yüklenmedi.", "hata"); return; }
  silOnayla("Bu Yedeği Geri Yükle", () => {
    try {
      const veri = JSON.parse(json);
      state = sanitizeVeri(veri);
      kaydetIslem(`Sistem "${id}" tarihli yedekten geri yüklendi.`, { view: "kayitlar" });
      saveData();
      render();
      toastGoster("Yedek geri yüklendi.", "basari");
    } catch (e) {
      console.error(e);
      toastGoster("Yedek geri yüklenemedi — dosya bozuk olabilir.", "hata");
    }
  });
}
