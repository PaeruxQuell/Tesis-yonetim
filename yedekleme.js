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
  try {
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
    await db.collection("yedekler").doc(id).set(ozet, { merge: true });
    await db.collection("yedekVerileri").doc(id).set({ veriJSON: JSON.stringify(state) });
  } catch (err) {
    console.error("Yedekleme hatası:", err);
  }
}

function yedeklemeZamanlayiciKur(){
  const simdi = new Date();
  const hedef = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate(), 23, 59, 0, 0);
  if (hedef.getTime() <= simdi.getTime()) hedef.setDate(hedef.getDate() + 1);
  const ms = hedef.getTime() - simdi.getTime();
  setTimeout(async () => {
    await bugununYedeginiGuncelle(true); // günü kapat
    yedeklemeZamanlayiciKur(); // bir sonraki gün için tekrar kur
  }, ms);
}

window.yedeklemeBaslat = function(){
  if (yedeklemeZamanlayicisiKuruldu) return;
  if (!adminMi()) return;
  yedeklemeZamanlayicisiKuruldu = true;
  bugununYedeginiGuncelle(false); // güne dair ilk (henüz kapanmamış) yedek
  yedeklemeZamanlayiciKur();
};

/* ---------------- Ayarlar: yedek listesi ve önizleme ---------------- */
let yedeklerListesi = [];
let yedekOnizlemeVerisi = {};

function yedeklerYukle(){
  if (!adminMi()) return;
  db.collection("yedekler").orderBy("sira", "desc").limit(90).get().then(snap => {
    yedeklerListesi = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (ui.view === "ayarlar") render();
  }).catch(err => console.error("Yedek listesi alınamadı:", err));
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
