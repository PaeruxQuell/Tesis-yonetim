function malzemeListesiEkle(){
  state.malzemeGecmisi.unshift({ id: uid(), ad: "", birim: "adet", manuelKodlar: [] });
  saveData(); render();
}
function malzemeListesiGuncelle(id, alan, deger){
  const m = state.malzemeGecmisi.find(x => x.id === id); if (m) m[alan] = deger;
  saveData(); render();
}
function malzemeManuelKodEkle(id, deger){
  const m = state.malzemeGecmisi.find(x => x.id === id); if (!m) return;
  const temiz = (deger || "").trim();
  if (!temiz) return;
  if (!Array.isArray(m.manuelKodlar)) m.manuelKodlar = [];
  if (!m.manuelKodlar.includes(temiz)) m.manuelKodlar.push(temiz);
  saveData(); render();
}
function malzemeManuelKodSil(id, kod){
  const m = state.malzemeGecmisi.find(x => x.id === id); if (!m) return;
  m.manuelKodlar = (m.manuelKodlar || []).filter(k => k !== kod);
  saveData(); render();
}
function malzemeListesindenSil(id){
  const m = state.malzemeGecmisi.find(x => x.id === id);
  state.malzemeGecmisi = state.malzemeGecmisi.filter(x => x.id !== id);
  if (m) kaydetIslem(`Kullanılan malzeme silindi: ${m.ad}`, { view: "malzemeler" });
  saveData(); render();
}
function malzemeListesiGoster(){ if (!izinVar('kullanilanMalzemeler')) return; ui.view = "malzemeler"; render(); }

/* ---------------- son işlemler ---------------- */
function kayitlarGoster(){ if (!adminMi()) return; ayarlarGoster(); }
let kullanicilarListesi = [];
/* ---------------- yazı boyutu ---------------- */
function sistemKayitlariAcKapat(){ ui.sistemKayitlariAcik = !ui.sistemKayitlariAcik; render(); }
function kayitTesisFiltreDegistir(deger){ ui.kayitTesisFiltre = deger; render(); }
function sonIslemleriTemizle(){
  if (!adminMi()) return;
  state.sonIslemler = [];
  saveData(); render();
  toastGoster("Aktivite günlüğü temizlendi.", "basari");
}
function ayarlarGoster(){
  ui.view = "ayarlar"; render();
  if (adminMi()) {
    db.collection("kullanicilar").get().then(snap => {
      kullanicilarListesi = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (ui.view === "ayarlar") render();
    }).catch(err => console.error(err));
    yedeklerYukle().catch(()=>{});
  }
}
function kullaniciRoluDegistir(kullaniciId, yeniRol){
  db.collection("kullanicilar").doc(kullaniciId).update({ rol: yeniRol }).then(() => {
    const k = kullanicilarListesi.find(x => x.id === kullaniciId); if (k) k.rol = yeniRol;
    kaydetIslem(`Kullanıcı rolü değiştirildi: ${k?k.eposta:kullaniciId} → ${yeniRol==='yonetici'?'Yönetici':'Personel'}`, { view: "kayitlar" });
    saveData(); render();
  }).catch(err => console.error(err));
}
function kullaniciIsmiDegistir(kullaniciId, yeniIsim){
  const temiz = (yeniIsim || "").trim();
  db.collection("kullanicilar").doc(kullaniciId).update({ isim: temiz }).then(() => {
    const k = kullanicilarListesi.find(x => x.id === kullaniciId); if (k) k.isim = temiz;
    kaydetIslem(`Kullanıcı ismi değiştirildi: ${k?k.eposta:kullaniciId} → ${temiz||'(boş)'}`, { view: "kayitlar" });
    saveData();
    toastGoster("İsim güncellendi.", "basari");
  }).catch(err => { console.error(err); toastGoster("İsim güncellenemedi.", "hata"); });
}
function kullaniciTesisErisimiDegistir(kullaniciId, tesisId){
  const k = kullanicilarListesi.find(x => x.id === kullaniciId); if (!k) return;
  const mevcut = Array.isArray(k.tesisErisimi) ? k.tesisErisimi.slice() : [];
  const idx = mevcut.indexOf(tesisId);
  const tesis = state.tesisler.find(x => x.id === tesisId);
  if (idx === -1) mevcut.push(tesisId); else mevcut.splice(idx, 1);
  db.collection("kullanicilar").doc(kullaniciId).update({ tesisErisimi: mevcut }).then(() => {
    k.tesisErisimi = mevcut;
    kaydetIslem(`Tesis erişimi güncellendi: ${k.eposta} — ${tesis?tesis.ad:tesisId} ${idx===-1?'eklendi':'kaldırıldı'}`, { view: "kayitlar" });
    saveData();
    render();
  }).catch(err => { console.error(err); toastGoster("Erişim güncellenemedi.", "hata"); });
}
function kullaniciIzinDegistir(kullaniciId, izinAdi){
  const k = kullanicilarListesi.find(x => x.id === kullaniciId); if (!k) return;
  const mevcut = { ...(k.izinler || {}) };
  const kapaliMi = IZIN_VARSAYILAN_KAPALI.includes(izinAdi);
  const suankiEfektif = kapaliMi ? (mevcut[izinAdi] === true) : (mevcut[izinAdi] !== false);
  mevcut[izinAdi] = !suankiEfektif;
  db.collection("kullanicilar").doc(kullaniciId).update({ izinler: mevcut }).then(() => {
    k.izinler = mevcut;
    kaydetIslem(`Bölüm izni değiştirildi: ${k.eposta} — ${izinAdi} ${mevcut[izinAdi]?'açıldı':'kapatıldı'}`, { view: "kayitlar" });
    saveData(); render();
  }).catch(err => { console.error(err); toastGoster("İzin güncellenemedi.", "hata"); });
}
function tesisGizleDegistir(tesisId){
  const t = state.tesisler.find(x => x.id === tesisId); if (!t) return;
  t.gizli = !t.gizli;
  kaydetIslem(`Tesis ${t.gizli?'gizlendi':'gösterildi'}: ${t.ad}`, { view: "kayitlar" });
  saveData(); render();
}
function depoGizleDegistir(tesisId, depoId){
  const t = state.tesisler.find(x => x.id === tesisId); if (!t) return;
  const d = t.depolar.find(x => x.id === depoId); if (!d) return;
  d.gizli = !d.gizli;
  kaydetIslem(`Depo ${d.gizli?'gizlendi':'gösterildi'}: ${d.ad} (${t.ad})`, { view: "stok", tesisId: t.id });
  saveData(); render();
}

/* ---------------- giriş / oturum ---------------- */

function renderAyarlar(){
    let h = `<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <div class="pompaAdBaslik" style="margin-bottom:0">Ayarlar</div>
        <span class="surumRozeti" title="Uygulama sürümü — tarih/saat, index.html dosyasının sunucudaki gerçek son değişiklik zamanıdır">${uygulamaSurumMetni()}</span>
      </div>
      <div class="altBaslik2" style="margin-bottom:20px">görmek istemediğiniz tesisleri gizleyebilir, yazı boyutunu ayarlayabilirsiniz</div>`;

    if (adminMi()) {
      h += `<div class="kart malzemeKisayolKart" onclick="kullanicilarGoster()">
        <div style="display:flex;align-items:center;gap:16px">
          <span class="malzemeKisayolIkon" style="background:rgba(var(--mor-rgb),0.16)">👥</span>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:800;color:var(--yazi)">Kullanıcılar ve Yetkiler</div>
            <div class="bosMetin" style="margin:2px 0 0">Rol, tesis erişimi ve bölüm izinlerini yönetin — ${kullanicilarListesi.length || '…'} kullanıcı</div>
          </div>
          <span class="okBuyuk" style="transform:rotate(90deg);font-size:22px;color:var(--mor)">›</span>
        </div>
      </div>`;
    }

    if (adminMi() || izinVar('silinenGeriGetir')) {
      h += `<div class="kart malzemeKisayolKart" onclick="silinenlerGoster()">
        <div style="display:flex;align-items:center;gap:16px">
          <span class="malzemeKisayolIkon" style="background:rgba(var(--kirmizi-rgb),0.16)">🗑️</span>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:800;color:var(--yazi)">Silinen Verileri Geri Getir</div>
            <div class="bosMetin" style="margin:2px 0 0">Yanlışlıkla silinen tesis, makine, pompa, bakım, stok ürünü ya da satın alma taleplerini geri yükleyin — ${(state.silinenler||[]).length} kayıt</div>
          </div>
          <span class="okBuyuk" style="transform:rotate(90deg);font-size:22px;color:var(--kirmizi)">›</span>
        </div>
      </div>`;
    }

    if (izinVar('kullanilanMalzemeler')) {
      h += `<div class="kart ty-btn malzemeKisayolKart" onclick="malzemeListesiGoster()">
        <div style="display:flex;align-items:center;gap:16px">
          <span class="malzemeKisayolIkon">🧾</span>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:800;color:var(--yazi)">Kullanılan Malzemeler</div>
            <div class="bosMetin" style="margin:2px 0 0">Ürün adı, kodu ve birimini içeren malzeme listesini görüntüleyin ve düzenleyin — ${state.malzemeGecmisi.length} ürün kayıtlı</div>
          </div>
          <span class="okBuyuk" style="transform:rotate(90deg);font-size:22px;color:var(--yesil)">›</span>
        </div>
      </div>`;
    }

    h += `<div class="kart">
      <div class="kartBaslik" style="margin-bottom:14px">Yazı Boyutu</div>
      <div style="display:flex;align-items:center;gap:16px">
        <input type="range" min="80" max="160" step="10" value="${yaziOlcegiOku()}" oninput="yaziOlcegiDegisti(this.value)" style="flex:1;accent-color:var(--vurgu)" />
        <span id="yaziOlcekDeger" style="font-family:'JetBrains Mono',monospace;color:var(--vurgu);font-weight:600;width:52px;text-align:right;flex-shrink:0">${yaziOlcegiOku()}%</span>
      </div>
      <div class="bosMetin" style="margin-top:10px">Kaydırıcıyı sağa çekince tüm sayfadaki yazılar büyür, sola çekince küçülür. Tercihiniz bu tarayıcıda hatırlanır.</div>
    </div>`;

    h += `<div class="kart">
      <div class="kartBaslik" style="margin-bottom:10px">⏳ Kum İmleci</div>
      <div class="bosMetin" style="margin-bottom:12px">Fare imlecini, hareket ettikçe içi kum tanesiyle dolan özel bir imleçle değiştirir. Bir yere tıklayınca boşalıp yeniden dolmaya başlar. Sadece bu tarayıcıda geçerli bir tercihtir.</div>
      <button class="ty-btn kumImleciToggleBtn ${kumImleciTercihOku()?'kumImleciToggleBtnAktif':''}" onclick="kumImleciAcKapat(${kumImleciTercihOku()?'false':'true'})">${kumImleciTercihOku()?'✓ Açık — kapatmak için tıklayın':'Kapalı — açmak için tıklayın'}</button>
    </div>`;

    if (adminMi()) {
      const limitBayt = 1048576; // Firestore'un HER BELGE için sert üst sınırı: 1 MB
      const belgeler = [];
      (state.tesisler || []).forEach(t => belgeler.push({ ad: `Tesis: ${t.ad}`, bayt: new Blob([JSON.stringify(t)]).size }));
      belgeler.push({ ad: "Satın Almalar", bayt: new Blob([JSON.stringify(state.satinAlmalar||[])]).size });
      belgeler.push({ ad: "Kullanılan Malzemeler", bayt: new Blob([JSON.stringify(state.malzemeGecmisi||[])]).size });
      belgeler.push({ ad: "Sistem Kayıtları", bayt: new Blob([JSON.stringify(state.sonIslemler||[])]).size });
      belgeler.push({ ad: "Transferler", bayt: new Blob([JSON.stringify(state.transferler||[])]).size });
      belgeler.push({ ad: "Silinen Veriler", bayt: new Blob([JSON.stringify(state.silinenler||[])]).size });
      belgeler.sort((a,b) => b.bayt - a.bayt);
      const enBuyuk = belgeler[0] || { ad: "—", bayt: 0 };
      const enBuyukYuzde = Math.min(100, (enBuyuk.bayt / limitBayt) * 100);
      const boyutRenk = enBuyukYuzde > 85 ? 'var(--kirmizi)' : enBuyukYuzde > 60 ? 'var(--vurgu)' : 'var(--yesil)';
      h += `<div class="kart">
        <div class="kartBaslik" style="margin-bottom:10px">💾 Veri Boyutu (sadece Yönetici)</div>
        <div class="bosMetin" style="margin-bottom:12px">Veri artık TEK bir dosyada değil, her tesis ve her ortak kayıt türü (satın almalar, malzeme geçmişi vb.) KENDİ ayrı dosyasında tutuluyor — her birinin kendi 1 MB'lık sınırı var. Aşağıda en dolu olan dosya gösteriliyor; bir dosya sınıra ulaşırsa sadece O dosyaya yeni kayıt eklenemez, diğerleri etkilenmez.</div>
        <div style="font-size:12.5px;color:var(--yazi);font-weight:600;margin-bottom:4px">En dolu: ${esc(enBuyuk.ad)}</div>
        <div style="background:var(--bg-yuzey2);border-radius:8px;height:12px;overflow:hidden;margin-bottom:8px">
          <div style="background:${boyutRenk};height:100%;width:${enBuyukYuzde.toFixed(1)}%;transition:width .3s ease"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--yazi-soluk);margin-bottom:12px">
          <span>${(enBuyuk.bayt/1024).toFixed(0)} KB kullanılıyor</span>
          <span style="color:${boyutRenk};font-weight:700">%${enBuyukYuzde.toFixed(1)}</span>
          <span>Sınır: 1024 KB</span>
        </div>
        ${enBuyukYuzde > 70 ? `<div class="bosMetin" style="margin-bottom:12px;color:${boyutRenk}">⚠ "${esc(enBuyuk.ad)}" sınıra yaklaşıyor.</div>` : ''}
        <div style="border-top:1px solid var(--sinir-soluk);padding-top:10px">
          ${belgeler.map(b => {
            const y = Math.min(100, (b.bayt/limitBayt)*100);
            return `<div style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:11.5px">
              <span style="width:170px;flex:none;color:var(--yazi-soluk);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(b.ad)}</span>
              <span style="flex:1;background:var(--bg-yuzey2);border-radius:4px;height:6px;overflow:hidden"><span style="display:block;background:${y>85?'var(--kirmizi)':y>60?'var(--vurgu)':'var(--yesil)'};height:100%;width:${y.toFixed(1)}%"></span></span>
              <span style="width:55px;flex:none;text-align:right;color:var(--yazi-dim)">${(b.bayt/1024).toFixed(0)} KB</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }

    if (adminMi()) {
      h += `<div class="kart" style="border-color:rgba(var(--kirmizi-rgb),0.35)">
        <div class="kartBaslik" style="margin-bottom:10px">⚡ Hızlı Silme (sadece Yönetici)</div>
        <div class="bosMetin" style="margin-bottom:12px">Açıkken, herhangi bir kaydı silerken artık matematik onayı sorulmaz — "Sil" işlemi anında, tek tıkla uygulanır. Bu, kazara silme riskini artırır; dikkatli kullanın. Sadece bu tarayıcıda geçerli bir tercihtir.</div>
        <button class="ty-btn kumImleciToggleBtn ${hizliSilTercihOku()?'kumImleciToggleBtnAktif':''}" onclick="hizliSilAcKapat(${hizliSilTercihOku()?'false':'true'})">${hizliSilTercihOku()?'✓ Açık — kapatmak için tıklayın':'Kapalı — açmak için tıklayın'}</button>
      </div>`;
    }

    if (adminMi()) {
      h += `<div class="kart">
        <div class="kartBaslikSatir" style="margin-bottom:10px">
          <span class="kartBaslik">🗄️ Günlük Yedekler</span>
          <button class="ustBtn ty-btn" ${manuelYedekAliniyor?'disabled':''} onclick="manuelYedekAl()">${manuelYedekAliniyor?'⏳ Yedekleniyor...':'⬇ Şimdi Yedekle'}</button>
        </div>
        <div class="bosMetin" style="margin-bottom:14px">Sistem her gün otomatik olarak kendini yedekler — gün içinde açık kaldıkça güncellenir, saat 23:59'da o günün yedeği kapanır ve yeni gün için ayrı bir yedek başlar. "Şimdi Yedekle" ile bugünün yedeğini istediğiniz an manuel olarak da alabilirsiniz. Eski yedekler burada kalıcı olarak durur; birine tıklayıp yalnızca önizleyebilir ve isterseniz .json olarak indirebilirsiniz.</div>
        ${yedeklerListesi.length === 0 ? `<div class="bosMetin">Henüz bir yedek oluşmadı.</div>` : ''}`;
      yedeklerListesi.forEach(y => {
        const acikMi = ui.yedekSecili === y.id;
        const veri = yedekOnizlemeVerisi[y.id];
        h += `<div class="ayarSatiri ty-btn" style="flex-direction:column;align-items:stretch;gap:0" onclick="yedekOnizleAc('${y.id}')">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="okBuyuk" style="transform:${acikMi?'rotate(90deg)':'none'}">›</span>
            <span style="flex:1;font-weight:600;color:var(--yazi);font-family:'JetBrains Mono',monospace">${esc(y.tarih)}</span>
            <span class="bosMetin" style="margin:0">saat ${esc(y.saat)}</span>
            <span class="islemRozet" style="color:${y.kapandi?'var(--yesil)':'var(--vurgu)'};background:rgba(${y.kapandi?'var(--yesil-rgb)':'var(--vurgu-rgb)'},0.14);border-color:rgba(${y.kapandi?'var(--yesil-rgb)':'var(--vurgu-rgb)'},0.4)">${y.kapandi?'✓ kapandı':'⏳ gün devam ediyor'}</span>
          </div>`;
        if (acikMi) {
          h += `<div style="padding:12px 0 4px 30px" onclick="event.stopPropagation()">`;
          if (!veri) {
            h += `<div class="bosMetin">Yükleniyor...</div>`;
          } else {
            const veriObj = (() => { try { return JSON.parse(veri); } catch(e) { return null; } })();
            const alt = ui.yedekAltSekme || "";
            const kategoriler = [
              { anahtar: "tesis", etiket: "Tesis", sayi: y.tesisSayisi },
              { anahtar: "malzeme", etiket: "Kayıtlı Malzeme", sayi: y.malzemeGecmisiSayisi },
              { anahtar: "satinalma", etiket: "Satın Alma", sayi: y.satinAlmaSayisi },
              { anahtar: "transfer", etiket: "Transfer", sayi: y.transferSayisi },
            ];
            h += `<div style="display:flex;gap:24px;flex-wrap:wrap;margin-bottom:12px">`;
            kategoriler.forEach(k => {
              h += `<div class="ty-btn" style="cursor:pointer;${alt===k.anahtar?'outline:2px solid var(--vurgu);border-radius:6px;padding:2px 6px;margin:-2px -6px':''}" onclick="event.stopPropagation(); yedekAltSekmeAc('${k.anahtar}')">
                <div style="font-size:18px;font-weight:700;color:var(--yazi)">${k.sayi ?? '—'}</div>
                <div class="bosMetin" style="margin:0">${k.etiket}</div>
              </div>`;
            });
            h += `</div>`;

            if (alt && veriObj) {
              h += `<div class="kart" style="background:var(--bg-yuzey);margin-bottom:12px;max-height:260px;overflow-y:auto">`;
              if (alt === "tesis") {
                const liste = veriObj.tesisler || [];
                if (liste.length === 0) h += `<div class="bosMetin">Bu yedekte tesis yok.</div>`;
                liste.forEach(t => {
                  h += `<div class="ayarSatiri" style="padding:6px 0"><span style="flex:1;font-size:12.5px;color:var(--yazi)">${esc(t.ad)}</span><span class="bosMetin" style="margin:0">${(t.makineler||[]).length} makine · ${(t.depolar||[]).length} depo</span></div>`;
                });
              } else if (alt === "malzeme") {
                const liste = veriObj.malzemeGecmisi || [];
                if (liste.length === 0) h += `<div class="bosMetin">Bu yedekte kayıtlı malzeme yok.</div>`;
                liste.forEach(m => {
                  h += `<div class="ayarSatiri" style="padding:6px 0"><span style="flex:1;font-size:12.5px;color:var(--yazi)">${esc(m.ad)}</span><span class="bosMetin" style="margin:0">${esc(m.birim||'')}${m.kod?' · '+esc(m.kod):''}</span></div>`;
                });
              } else if (alt === "satinalma") {
                const liste = veriObj.satinAlmalar || [];
                if (liste.length === 0) h += `<div class="bosMetin">Bu yedekte satın alma yok.</div>`;
                liste.forEach(s => {
                  h += `<div class="ayarSatiri" style="padding:6px 0;flex-direction:column;align-items:stretch;gap:2px">
                    <div style="display:flex;justify-content:space-between"><span style="font-size:12.5px;color:var(--yazi);font-weight:600">${esc(s.firma||'—')} ${s.siparisNo?'· '+esc(s.siparisNo):''}</span><span class="bosMetin" style="margin:0">${s.onayDurumu==='onaylandi'?'✓ onaylandı':'⏳ bekliyor'}</span></div>
                    <span class="bosMetin" style="margin:0">${(s.kalemler||[]).map(kl=>esc(kl.urun||'')).filter(Boolean).join(', ') || '—'}</span>
                  </div>`;
                });
              } else if (alt === "transfer") {
                const liste = veriObj.transferler || [];
                if (liste.length === 0) h += `<div class="bosMetin">Bu yedekte transfer yok.</div>`;
                liste.forEach(tr => {
                  h += `<div class="ayarSatiri" style="padding:6px 0"><span style="flex:1;font-size:12.5px;color:var(--yazi)">${esc(tr.urunAdi||'—')} — ${esc(tr.miktar||'')} ${esc(tr.birim||'')}</span><span class="bosMetin" style="margin:0">${tr.durum?esc(tr.durum):'—'}</span></div>`;
                });
              }
              h += `</div>`;
            }

            h += `<button class="ustBtn ty-btn" onclick="yedekIndir('${y.id}')">⬇ İndir (.json)</button>`;
          }
          h += `</div>`;
        }
        h += `</div>`;
      });
      h += `</div>`;
    }

    const tumDepolar = [];
    state.tesisler.forEach(t => (t.depolar||[]).forEach(d => tumDepolar.push({ t, d })));

    h += `<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:20px">`;

    h += `<div class="kart" style="flex:1;min-width:240px;padding:14px 16px">
      <div class="kartBaslik" style="margin-bottom:6px;font-size:13px">Tesis Görünürlüğü</div>`;
    state.tesisler.forEach(t => {
      h += `<div class="ayarSatiri" style="padding:6px 0;gap:8px">
        <span class="tesisIkon" style="font-size:14px">🏭</span>
        <span style="flex:1;font-size:12.5px;color:${t.gizli?'var(--yazi-soluk)':'var(--yazi)'}">${esc(t.ad)}${t.gizli?' (gizli)':''}</span>
        <button class="ty-btn ayarToggleBtn ${!t.gizli?'ayarToggleAktif':''}" style="padding:3px 10px;font-size:11px" onclick="tesisGizleDegistir('${t.id}')">${t.gizli?'Göster':'Gizle'}</button>
      </div>`;
    });
    h += `<div class="bosMetin" style="margin-top:8px;font-size:11px">Gizlenenler sol menü ve Stok Listesi'nde görünmez.</div>
    </div>`;

    h += `<div class="kart" style="flex:1;min-width:240px;padding:14px 16px">
      <div class="kartBaslik" style="margin-bottom:6px;font-size:13px">Depo Görünürlüğü</div>`;
    if (tumDepolar.length === 0) h += `<div class="bosMetin" style="font-size:11px">Henüz depo eklenmedi.</div>`;
    tumDepolar.forEach(({ t, d }) => {
      h += `<div class="ayarSatiri" style="padding:6px 0;gap:8px">
        <span class="tesisIkon" style="font-size:13px">📦</span>
        <span style="flex:1;font-size:12.5px;color:${d.gizli?'var(--yazi-soluk)':'var(--yazi)'}">${esc(d.ad)} <span class="bosMetin" style="display:inline;font-size:10.5px">— ${esc(t.ad)}</span>${d.gizli?' (gizli)':''}</span>
        <button class="ty-btn ayarToggleBtn ${!d.gizli?'ayarToggleAktif':''}" style="padding:3px 10px;font-size:11px" onclick="depoGizleDegistir('${t.id}','${d.id}')">${d.gizli?'Göster':'Gizle'}</button>
      </div>`;
    });
    h += `<div class="bosMetin" style="margin-top:8px;font-size:11px">Gizlenenler sadece Stok Listesi'nde görünmez.</div>
    </div>`;

    h += `</div>`;

    if (adminMi()) {
      h += `<div class="bosMetin" style="margin-bottom:20px">Yeni kullanıcı eklemek için Firebase Console → Authentication → Add user yolunu kullanın. Yeni kullanıcı ilk giriş yaptığında otomatik olarak "Personel" yetkisiyle listelenir.</div>`;

      h += `<div class="kart">
        <div class="kartBaslikSatir ty-btn" style="cursor:pointer;margin-bottom:0" onclick="sistemKayitlariAcKapat()">
          <span class="kartBaslik">Sistem Kayıtları ${state.sonIslemler&&state.sonIslemler.length?`<span class="bosMetin" style="display:inline;font-style:normal">(${state.sonIslemler.length})</span>`:''}</span>
          <span class="okBuyuk" style="transform:${ui.sistemKayitlariAcik?'rotate(90deg)':'none'}">›</span>
        </div>`;
      if (ui.sistemKayitlariAcik) {
        h += `<div class="acilirIcerik">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin:12px 0">
          <div class="bosMetin" style="margin:0">Tüm ekleme, silme ve onay işlemlerinin günlüğü — sadece yöneticiler görür.</div>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <select class="girdi" style="width:170px;padding:7px 10px;font-size:12.5px" onchange="kayitTesisFiltreDegistir(this.value)">
              <option value="">Tüm tesisler</option>
              ${state.tesisler.map(t => `<option value="${t.id}" ${ui.kayitTesisFiltre===t.id?'selected':''}>${esc(t.ad)}</option>`).join('')}
            </select>
            <button class="ustBtn ty-btn" style="color:var(--kirmizi)" onclick="silOnayla('Aktivite Günlüğünü Temizle', sonIslemleriTemizle)">Günlüğü temizle</button>
          </div>
        </div>
        <div class="tabloSarici"><div class="tabloBaslikSatir">
          <span style="width:96px">Tür</span><span style="flex:1">İşlem</span><span style="width:170px">Kullanıcı</span><span style="width:110px">Tarih</span><span style="width:70px">Saat</span>
        </div>`;
        const kayitlar = (state.sonIslemler || []).filter(k => !ui.kayitTesisFiltre || (k.hedef && k.hedef.tesisId === ui.kayitTesisFiltre));
        if (kayitlar.length === 0) h += `<div class="bosMetin" style="padding:16px">${ui.kayitTesisFiltre ? 'Bu tesise ait kayıt bulunamadı.' : 'Henüz kayıt yok.'}</div>`;
        kayitlar.forEach(k => {
          const rozet = islemBadge(k.aciklama);
          h += `<div class="tabloSatir ty-satir" style="border-left:3px solid ${rozet.renk}">
            <span style="width:96px;flex-shrink:0"><span class="islemRozet" style="color:${rozet.renk};background:rgba(${rozet.renkRgb},0.12);border-color:rgba(${rozet.renkRgb},0.4);margin-bottom:0">${rozet.etiket}</span></span>
            <span style="flex:1;color:var(--yazi-ikincil)">${esc(k.aciklama)}</span>
            <span style="width:170px;color:var(--yazi-dim);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(k.kullanici) || '—'}</span>
            <span style="width:110px;color:var(--yazi-dim);font-family:'JetBrains Mono',monospace">${esc(k.tarih)}</span>
            <span style="width:70px;color:var(--yazi-dim);font-family:'JetBrains Mono',monospace">${esc(k.saat)}</span>
          </div>`;
        });
        h += `</div></div>`;
      }
      h += `</div>`;
    }

    anaPanelYaz(h);
    return;
}
function renderMalzemeler(){
    let h = `<div class="geriDon" onclick="ayarlarGoster()"><span style="font-size:17px;line-height:1">‹</span> Ayarlar'a dön</div>`;
    h += `<div class="pompaBaslikSatir">
      <div>
        <div class="pompaAdBaslik">Kullanılan Malzemeler</div>
        <div class="altBaslik2">daha önce kullanılmış / kayıtlı tüm malzemeler — pompa ve rapor kayıtlarında otomatik tamamlama için kullanılır</div>
      </div>
      <button class="eklePrimer ty-btn" onclick="malzemeListesiEkle()">+ malzeme ekle</button>
    </div>`;
    h += `<div class="kart">`;
    if (state.malzemeGecmisi.length === 0) h += `<div class="bosMetin">Henüz malzeme eklenmedi.</div>`;
    else h += `<div class="kalemBaslikSatir" style="padding-left:0"><span style="flex:1">Malzeme adı</span><span style="width:230px">Kayıtlı Kodlar</span><span style="width:120px">Birim</span><span style="width:20px"></span></div>`;
    state.malzemeGecmisi.forEach(m => {
      const kodlar = urunKodlariGetir(m.ad);
      const manuelKodlar = m.manuelKodlar || [];
      h += `<div class="parcaSatir" style="align-items:flex-start">
        <input class="parcaGirdi" style="margin-top:2px" list="malzemeListesi" placeholder="Malzeme adı" value="${esc(m.ad)}" onchange="malzemeListesiGuncelle('${m.id}','ad',this.value)" />
        <span style="width:230px;flex:none;display:flex;flex-direction:column;gap:6px">
          <span style="display:flex;flex-wrap:wrap;gap:4px;align-items:center">
            ${kodlar.length === 0
              ? `<span class="bosMetin" style="margin:0">— kod yok —</span>`
              : kodlar.map(kd => {
                  const manuelMi = manuelKodlar.includes(kd);
                  return `<span style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:var(--turkuaz);background:rgba(var(--turkuaz-rgb),0.14);border-radius:5px;padding:2px 7px;display:inline-flex;align-items:center;gap:4px">${esc(kd)}${manuelMi?`<span class="ty-btn" style="color:var(--kirmizi);cursor:pointer;font-weight:800" onclick="malzemeManuelKodSil('${m.id}','${esc(kd)}')" title="Manuel eklenen bu kodu kaldır">×</span>`:''}</span>`;
                }).join('')}
          </span>
          <span style="display:flex;gap:4px">
            <input class="parcaGirdi" style="font-size:11px;padding:5px 8px" placeholder="+ kod ekle" onkeydown="if(event.key==='Enter'){malzemeManuelKodEkle('${m.id}',this.value);this.value='';}" />
          </span>
        </span>
        <select class="parcaGirdi" style="width:120px;flex:none;margin-top:2px" onchange="malzemeListesiGuncelle('${m.id}','birim',this.value)">
          ${["adet","koli","tane","kg","litre"].map(b => `<option value="${b}" ${(m.birim||'adet')===b?'selected':''}>${b}</option>`).join('')}
        </select>
        <span class="silIkon" onclick="silOnayla('Malzemeyi Sil', ()=>malzemeListesindenSil('${m.id}'))">×</span>
      </div>`;
    });
    h += `</div>`;
    h += `<div class="bosMetin" style="margin-top:8px">Bir ürün satın alma ya da rapor kayıtlarında kullanıldıkça, o üründe geçen kodlar burada otomatik olarak toplanıp gösterilir. İsterseniz "+ kod ekle" ile elle de bir kod ekleyebilirsiniz (yazıp Enter'a basın) — bu manuel eklenen kodlar kırmızı × ile kaldırılabilir, otomatik toplananlar ise kaldırılamaz.</div>`;
    anaPanelYaz(h);
    return;
}

/* ---------------- kullanıcılar ve yetkiler (ayrı sayfa) ---------------- */
function kullanicilarGoster(){
  if (!adminMi()) return;
  ui.view = "kullanicilar";
  render();
  if (kullanicilarListesi.length === 0) {
    db.collection("kullanicilar").get().then(snap => {
      kullanicilarListesi = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (ui.view === "kullanicilar") render();
    }).catch(err => console.error(err));
  }
}
function kullaniciAcKapat(id){
  ui.kullaniciAcikId = (ui.kullaniciAcikId === id) ? "" : id;
  render();
}

function renderKullanicilar(){
  let h = `<div class="geriDon" onclick="ayarlarGoster()"><span style="font-size:17px;line-height:1">‹</span> Ayarlar'a dön</div>`;
  h += `<div class="pompaAdBaslik" style="margin-bottom:4px">Kullanıcılar ve Yetkiler</div>
    <div class="altBaslik2" style="margin-bottom:20px">rol, tesis erişimi ve bölüm izinlerini buradan yönetin — bir kullanıcıya tıklayarak açın</div>`;

  if (kullanicilarListesi.length === 0) {
    h += `<div class="kart"><div class="bosMetin">Yükleniyor...</div></div>`;
    anaPanelYaz(h);
    return;
  }

  kullanicilarListesi.forEach(k => {
    const benMi = mevcutKullanici && k.id === mevcutKullanici.uid;
    const acikMi = ui.kullaniciAcikId === k.id;
    const kErisimi = Array.isArray(k.tesisErisimi) ? k.tesisErisimi : [];
    const yoneticiMi = k.rol === 'yonetici';
    const rolRenk = yoneticiMi ? 'var(--vurgu)' : 'var(--turkuaz)';
    const rolRgb = yoneticiMi ? 'var(--vurgu-rgb)' : 'var(--turkuaz-rgb)';
    const harf = (k.isim || k.eposta || '?').trim().charAt(0).toUpperCase();

    h += `<div class="kart" style="padding:0;overflow:hidden">
      <div class="ayarSatiri ty-btn" style="padding:14px 16px;margin:0" onclick="kullaniciAcKapat('${k.id}')">
        <span class="tesisIkonRenkli" style="background:rgba(${rolRgb},0.18);color:${rolRenk};font-weight:700;font-size:14px">${esc(harf)}</span>
        <span style="flex:1;min-width:0">
          <div style="color:var(--yazi);font-weight:600;font-size:13.5px">${esc(k.isim) || esc(k.eposta)}${benMi?' <span style="color:var(--yazi-soluk);font-weight:400">(siz)</span>':''}</div>
          <div class="bosMetin" style="margin:1px 0 0">${esc(k.eposta)}</div>
        </span>
        <span class="islemRozet" style="color:${rolRenk};background:rgba(${rolRgb},0.14);border-color:rgba(${rolRgb},0.4)">${yoneticiMi?'Yönetici':'Personel'}</span>
        <span class="okBuyuk" style="transform:${acikMi?'rotate(90deg)':'none'}">›</span>
      </div>`;

    if (acikMi) {
      h += `<div class="acilirIcerik" style="padding:0 16px 18px 16px;border-top:1px solid var(--sinir-soluk)">
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;margin-bottom:18px">
          <div style="flex:1;min-width:160px">
            <div class="kullaniciAlanBasligi">Rol</div>
            <select class="girdi" style="width:100%" ${benMi?'disabled':''} onchange="kullaniciRoluDegistir('${k.id}', this.value)">
              <option value="personel" ${k.rol==='personel'?'selected':''}>Personel</option>
              <option value="yonetici" ${k.rol==='yonetici'?'selected':''}>Yönetici</option>
            </select>
          </div>
          <div style="flex:2;min-width:200px">
            <div class="kullaniciAlanBasligi">Görünecek İsim</div>
            <input class="girdi" style="width:100%" placeholder="Örn: Ahmet Yılmaz" value="${esc(k.isim||'')}" onchange="kullaniciIsmiDegistir('${k.id}', this.value)" />
          </div>
        </div>

        <div style="margin-bottom:18px">
          <div class="kullaniciAlanBasligi">Özel Yetki</div>
          <button class="ty-btn tesisErisimBtn ${(k.izinler && k.izinler.satinAlmaOnay===true)?'tesisErisimBtnAktif':''}" onclick="kullaniciIzinDegistir('${k.id}','satinAlmaOnay')">🔑 Satın Alma Onay</button>
          <div class="bosMetin" style="margin-top:6px">Bu yetkiye sahip kişi(ler) satın alma taleplerini onaylayabilir — rol fark etmeksizin.</div>
        </div>`;

      if (!yoneticiMi) {
        const kIzinler = k.izinler || {};
        const izinListesi = [
          { anahtar: 'stokListesi', etiket: '📦 Stok Listesi' },
          { anahtar: 'satinAlmalar', etiket: '🛒 Satın Almalar' },
          { anahtar: 'raporEkle', etiket: '📝 Rapor Ekle' },
          { anahtar: 'raporGor', etiket: '📊 Raporlar' },
          { anahtar: 'periyodikBakim', etiket: '🔧 Periyodik Bakım' },
          { anahtar: 'kullanilanMalzemeler', etiket: '🧾 Kullanılan Malzemeler' },
          { anahtar: 'malzemeCikis', etiket: '📉 Malzeme Kullan', varsayilanKapali: true },
          { anahtar: 'transfer', etiket: '🔄 Transfer', varsayilanKapali: true },
          { anahtar: 'silinenGeriGetir', etiket: '🗑️ Silinen Verileri Geri Getir', varsayilanKapali: true },
        ];
        h += `<div style="margin-bottom:18px">
          <div class="kullaniciAlanBasligi">Erişebileceği Tesisler${kErisimi.length===0?' <span class="kullaniciAlanIpucu">— hiçbiri seçilmedi, tümünü görür</span>':''}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${state.tesisler.map(t => `<button class="ty-btn tesisErisimBtn ${kErisimi.includes(t.id)?'tesisErisimBtnAktif':''}" onclick="kullaniciTesisErisimiDegistir('${k.id}','${t.id}')">${esc(t.ad)}</button>`).join('')}
          </div>
        </div>
        <div style="margin-bottom:6px">
          <div class="kullaniciAlanBasligi">Görebileceği Bölümler</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${izinListesi.map(iz => `<button class="ty-btn tesisErisimBtn ${(iz.varsayilanKapali ? kIzinler[iz.anahtar]===true : kIzinler[iz.anahtar]!==false)?'tesisErisimBtnAktif':''}" onclick="kullaniciIzinDegistir('${k.id}','${iz.anahtar}')">${iz.etiket}</button>`).join('')}
          </div>
        </div>`;
      }

      h += `<div class="bosMetin" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--sinir-soluk)">${k.sonGirisTarihi ? `Son giriş: ${esc(k.sonGirisTarihi)} ${esc(k.sonGirisSaati||'')} · ${esc(k.tarayici||'—')} · IP: ${esc(k.sonGirisIp||'—')}` : 'Henüz giriş kaydı yok'}</div>`;
      h += `</div>`;
    }
    h += `</div>`;
  });

  anaPanelYaz(h);
}

/* ---------------- silinen verileri geri getir (ayrı sayfa) ---------------- */
function silinenDetaySatiri(etiket, deger){
  if (deger === undefined || deger === null || deger === "") return "";
  return `<div style="display:flex;gap:8px;padding:4px 0;font-size:12.5px"><span style="width:120px;flex:none;color:var(--yazi-soluk)">${esc(etiket)}</span><span style="color:var(--yazi)">${esc(deger)}</span></div>`;
}
function silinenDetayHTML(kayit){
  const v = kayit.veri || {};
  let h = "";
  if (kayit.tip === "stokUrun") {
    h += silinenDetaySatiri("Ürün adı", v.ad);
    h += silinenDetaySatiri("Kod", v.kod);
    h += silinenDetaySatiri("Miktar", v.miktar);
    h += silinenDetaySatiri("Birim", v.birim);
    h += silinenDetaySatiri("Kritik Eşik", v.kritikEsik);
    h += silinenDetaySatiri("Kritik Takip", v.kritikTakip ? "Açık" : "Kapalı");
  } else if (kayit.tip === "satinalma") {
    h += silinenDetaySatiri("Sipariş No", v.siparisNo);
    h += silinenDetaySatiri("Firma", v.firma);
    h += silinenDetaySatiri("Onay Durumu", v.onayDurumu === "onaylandi" ? "Onaylandı" : "Onay bekliyordu");
    h += silinenDetaySatiri("Kullanıldığı Yer", (v.yerler||[]).map(y=>y.ad).filter(Boolean).join(", "));
    (v.kalemler || []).forEach((k, i) => {
      h += silinenDetaySatiri(`Ürün ${i+1}`, `${k.urun || '(isimsiz)'}${k.kod?` · ${k.kod}`:''} — ${k.miktar||''} ${k.birim||''} (${k.durum||''})`);
    });
  } else if (kayit.tip === "parca") {
    h += silinenDetaySatiri("Parça adı", v.ad);
    h += silinenDetaySatiri("Malzeme", v.malzeme);
  } else if (kayit.tip === "bakim" || kayit.tip === "bakimPompa") {
    h += silinenDetaySatiri("Bakım adı", v.ad);
    h += silinenDetaySatiri("Periyot (gün)", v.periyotGun);
    h += silinenDetaySatiri("Son Yapılma Tarihi", v.sonYapilmaTarihi);
    h += silinenDetaySatiri("Uyarı Günü", v.uyariGunu);
  } else if (kayit.tip === "depo") {
    h += silinenDetaySatiri("Depo adı", v.ad);
    h += silinenDetaySatiri("Ürün Sayısı", (v.urunler||[]).length);
    (v.urunler || []).forEach((u, i) => {
      h += silinenDetaySatiri(`Ürün ${i+1}`, `${u.ad || '(isimsiz)'}${u.kod?` · ${u.kod}`:''} — ${u.miktar||0} ${u.birim||''}`);
    });
  } else if (kayit.tip === "makine") {
    h += silinenDetaySatiri("Makine adı", v.ad);
    h += silinenDetaySatiri("Pompa Sayısı", (v.pompalar||[]).length);
    h += silinenDetaySatiri("Bakım Planı Sayısı", (v.bakimlar||[]).length);
  } else if (kayit.tip === "pompa") {
    h += silinenDetaySatiri("Pompa adı", v.ad);
    h += silinenDetaySatiri("Parça Sayısı", (v.parcalar||[]).length);
    h += silinenDetaySatiri("Geçmiş Kayıt Sayısı", (v.gecmis||[]).length);
    h += silinenDetaySatiri("Bakım Planı Sayısı", (v.bakimlar||[]).length);
  } else if (kayit.tip === "tesis") {
    h += silinenDetaySatiri("Tesis adı", v.ad);
    h += silinenDetaySatiri("Makine Sayısı", (v.makineler||[]).length);
    h += silinenDetaySatiri("Depo Sayısı", (v.depolar||[]).length);
  }
  return h || `<div class="bosMetin">Ek detay yok.</div>`;
}
function renderSilinenler(){
  let h = `<div class="geriDon ty-btn" onclick="ayarlarGoster()"><span style="font-size:17px;line-height:1">‹</span> Ayarlar'a dön</div>`;
  h += `<div class="pompaAdBaslik" style="margin-bottom:4px">Silinen Verileri Geri Getir</div>
    <div class="altBaslik2" style="margin-bottom:20px">yanlışlıkla silinen kayıtları buradan geri yükleyebilirsiniz — sadece erişiminiz olan tesislere ait kayıtları görürsünüz</div>`;

  const liste = (state.silinenler || []).filter(silinenGorunurMu);
  if (liste.length === 0) {
    h += `<div class="kart"><div class="bosMetin">Görebileceğiniz silinmiş bir kayıt yok.</div></div>`;
    anaPanelYaz(h);
    return;
  }

  liste.forEach(kayit => {
    const acikMi = ui.silinenAcikId === kayit.id;
    h += `<div class="kart" style="padding:0;overflow:hidden">
      <div class="ayarSatiri ty-btn" style="padding:14px 16px;margin:0" onclick="silinenAcKapat('${kayit.id}')">
        <span style="flex:1;min-width:0">
          <div style="color:var(--yazi);font-weight:600;font-size:13.5px">${esc(silinenBaslikHesapla(kayit))}</div>
          <div class="bosMetin" style="margin:1px 0 0">${esc(kayit.tarih)} · ${esc(kayit.saat)}${kayit.silenKullanici?` · ${esc(kayit.silenKullanici)}`:''}</div>
        </span>
        <span class="okBuyuk" style="transform:${acikMi?'rotate(90deg)':'none'}">›</span>
      </div>`;
    if (acikMi) {
      h += `<div class="acilirIcerik" style="padding:0 16px 16px">
        <div class="kart" style="background:var(--bg-yuzey2);margin-bottom:12px">${silinenDetayHTML(kayit)}</div>
        <button class="eklePrimer ty-btn" onclick="silOnayla('Bu Kaydı Geri Getir', ()=>silinenGeriGetir('${kayit.id}'))">↺ Geri Getir</button>
      </div>`;
    }
    h += `</div>`;
  });

  anaPanelYaz(h);
}
