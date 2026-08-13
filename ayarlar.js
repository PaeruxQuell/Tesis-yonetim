function malzemeListesiEkle(){
  state.malzemeGecmisi.unshift({ id: uid(), ad: "", birim: "adet", kod: "" });
  saveData(); render();
}
function malzemeListesiGuncelle(id, alan, deger){
  const m = state.malzemeGecmisi.find(x => x.id === id); if (m) m[alan] = deger;
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
function logoUrlGuncelle(tema, deger){
  if (!adminMi()) return;
  const temiz = (deger || "").trim();
  if (tema === "koyu") state.logoUrlKoyu = temiz;
  else state.logoUrlAcik = temiz;
  kaydetIslem(temiz ? `Logo güncellendi (${tema==='koyu'?'koyu':'açık'} tema).` : `Logo kaldırıldı (${tema==='koyu'?'koyu':'açık'} tema).`, { view: "kayitlar" });
  saveData(); render();
}
function ayarlarGoster(){
  ui.view = "ayarlar"; render();
  if (adminMi()) {
    db.collection("kullanicilar").get().then(snap => {
      kullanicilarListesi = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (ui.view === "ayarlar") render();
    }).catch(err => console.error(err));
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
      h += `<div class="kart">
        <div class="kartBaslik" style="margin-bottom:10px">Logo</div>
        <div class="bosMetin" style="margin-bottom:14px">Sol üstte görünecek logo görselinin adresini (URL) girin — 320×85 boyutunda gösterilir. Koyu ve açık tema için ayrı ayrı logo yükleyebilirsiniz (örn. açık temada koyu renkli, koyu temada açık renkli bir logo daha net görünür). Boş bırakılırsa varsayılan yazı ve simge kullanılır.</div>

        <div style="margin-bottom:16px">
          <div style="font-size:12.5px;font-weight:700;color:var(--yazi-ikincil);margin-bottom:6px">🌙 Koyu Tema Logosu</div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <input class="girdi" style="flex:1;min-width:260px" placeholder="https://..." value="${esc(state.logoUrlKoyu||'')}" onchange="logoUrlGuncelle('koyu', this.value)" />
            ${state.logoUrlKoyu ? `<button class="ustBtn ty-btn" onclick="logoUrlGuncelle('koyu','')">Kaldır</button>` : ''}
          </div>
          ${state.logoUrlKoyu ? `<div style="margin-top:10px;padding:10px;background:#12161d;border-radius:8px;display:inline-block"><img src="${esc(state.logoUrlKoyu)}" style="width:320px;height:85px;object-fit:contain;display:block" /></div>` : ''}
        </div>

        <div>
          <div style="font-size:12.5px;font-weight:700;color:var(--yazi-ikincil);margin-bottom:6px">☀️ Açık Tema Logosu</div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <input class="girdi" style="flex:1;min-width:260px" placeholder="https://..." value="${esc(state.logoUrlAcik||'')}" onchange="logoUrlGuncelle('acik', this.value)" />
            ${state.logoUrlAcik ? `<button class="ustBtn ty-btn" onclick="logoUrlGuncelle('acik','')">Kaldır</button>` : ''}
          </div>
          ${state.logoUrlAcik ? `<div style="margin-top:10px;padding:10px;background:#f2f3f5;border-radius:8px;display:inline-block"><img src="${esc(state.logoUrlAcik)}" style="width:320px;height:85px;object-fit:contain;display:block" /></div>` : ''}
        </div>
      </div>`;
    }

    h += `<div class="kart">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:22px">💡</span>
        <div>
          <div class="kartBaslik" style="margin-bottom:2px">Açık / Koyu Tema</div>
          <div class="bosMetin">Üst çubukta, "Tesis Yönetim Sistemi" yazısının yanındaki lambaya tıklayarak temayı değiştirebilirsiniz.</div>
        </div>
      </div>
    </div>`;

    h += `<div class="kart">
      <div class="kartBaslik" style="margin-bottom:10px">Tesis Görünürlüğü</div>`;
    state.tesisler.forEach(t => {
      h += `<div class="ayarSatiri">
        <span class="tesisIkon">🏭</span>
        <span style="flex:1;color:${t.gizli?'var(--yazi-soluk)':'var(--yazi)'}">${esc(t.ad)}${t.gizli?' (gizli)':''}</span>
        <button class="ty-btn ayarToggleBtn ${!t.gizli?'ayarToggleAktif':''}" onclick="tesisGizleDegistir('${t.id}')">${t.gizli?'Göster':'Gizle'}</button>
      </div>`;
    });
    h += `</div>`;
    h += `<div class="bosMetin" style="margin-bottom:20px">Gizlenen tesisler; sol menüdeki Tesisler listesinde ve Stok Listesi'nde görünmez. Verileri silinmez, istediğiniz zaman tekrar gösterebilirsiniz.</div>`;

    const tumDepolar = [];
    state.tesisler.forEach(t => (t.depolar||[]).forEach(d => tumDepolar.push({ t, d })));
    h += `<div class="kart">
      <div class="kartBaslik" style="margin-bottom:10px">Depo Görünürlüğü</div>`;
    if (tumDepolar.length === 0) h += `<div class="bosMetin">Henüz depo eklenmedi.</div>`;
    tumDepolar.forEach(({ t, d }) => {
      h += `<div class="ayarSatiri">
        <span class="tesisIkon" style="font-size:16px">📦</span>
        <span style="flex:1;color:${d.gizli?'var(--yazi-soluk)':'var(--yazi)'}">${esc(d.ad)} <span class="bosMetin" style="display:inline">— ${esc(t.ad)}</span>${d.gizli?' (gizli)':''}</span>
        <button class="ty-btn ayarToggleBtn ${!d.gizli?'ayarToggleAktif':''}" onclick="depoGizleDegistir('${t.id}','${d.id}')">${d.gizli?'Göster':'Gizle'}</button>
      </div>`;
    });
    h += `</div>`;
    h += `<div class="bosMetin" style="margin-bottom:20px">Gizlenen depolar sadece Stok Listesi'nde görünmez, verileri korunur.</div>`;

    if (adminMi()) {
      h += `<div class="kart">
        <div class="kartBaslik" style="margin-bottom:10px">Kullanıcılar ve Yetkiler</div>`;
      if (kullanicilarListesi.length === 0) {
        h += `<div class="bosMetin">Yükleniyor...</div>`;
      } else {
        kullanicilarListesi.forEach(k => {
          const benMi = mevcutKullanici && k.id === mevcutKullanici.uid;
          const kErisimi = Array.isArray(k.tesisErisimi) ? k.tesisErisimi : [];
          h += `<div class="ayarSatiri" style="flex-direction:column;align-items:stretch;gap:6px">
            <div style="display:flex;align-items:center;gap:10px">
              <span style="flex:1;color:var(--yazi)">${esc(k.eposta)}${benMi?' (siz)':''}</span>
              <select class="girdi" style="width:140px" ${benMi?'disabled':''} onchange="kullaniciRoluDegistir('${k.id}', this.value)">
                <option value="personel" ${k.rol==='personel'?'selected':''}>Personel</option>
                <option value="yonetici" ${k.rol==='yonetici'?'selected':''}>Yönetici</option>
              </select>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="bosMetin" style="font-style:normal;flex-shrink:0">Görünecek isim:</span>
              <input class="girdi" style="flex:1;padding:6px 10px;font-size:12.5px" placeholder="Örn: Ahmet Yılmaz" value="${esc(k.isim||'')}" onchange="kullaniciIsmiDegistir('${k.id}', this.value)" />
            </div>
            <div class="bosMetin">${k.sonGirisTarihi ? `Son giriş: ${esc(k.sonGirisTarihi)} ${esc(k.sonGirisSaati||'')} · ${esc(k.tarayici||'—')} · IP: ${esc(k.sonGirisIp||'—')}` : 'Henüz giriş kaydı yok'}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:2px">
              <button class="ty-btn tesisErisimBtn ${(k.izinler && k.izinler.satinAlmaOnay===true)?'tesisErisimBtnAktif':''}" onclick="kullaniciIzinDegistir('${k.id}','satinAlmaOnay')">🔑 Satın Alma Onay</button>
              <span class="bosMetin" style="margin:0">bu yetkiye sahip TEK kişi(ler) satın alma taleplerini onaylayabilir — rol fark etmeksizin</span>
            </div>`;
          if (k.rol !== 'yonetici') {
            const kIzinler = k.izinler || {};
            const izinListesi = [
              { anahtar: 'stokListesi', etiket: '📦 Stok Listesi (kritik stok, depo)' },
              { anahtar: 'satinAlmalar', etiket: '🛒 Satın Almalar' },
              { anahtar: 'raporEkle', etiket: '📝 Rapor Ekle' },
              { anahtar: 'raporGor', etiket: '📊 Raporu (özet görünüm)' },
              { anahtar: 'periyodikBakim', etiket: '🔧 Periyodik Bakım' },
              { anahtar: 'kullanilanMalzemeler', etiket: '🧾 Kullanılan Malzemeler' },
              { anahtar: 'malzemeCikis', etiket: '📉 Malzeme Kullan (stoktan düş)', varsayilanKapali: true },
              { anahtar: 'transfer', etiket: '🔄 Depolar Arası Transfer', varsayilanKapali: true },
            ];
            h += `<div style="margin-top:4px">
              <div class="bosMetin" style="margin-bottom:6px">Görebileceği tesisler ${kErisimi.length===0?'<b style="color:var(--yazi-dim)">(hiçbiri seçilmedi = tümünü görür)</b>':''}</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
                ${state.tesisler.map(t => `<button class="ty-btn tesisErisimBtn ${kErisimi.includes(t.id)?'tesisErisimBtnAktif':''}" onclick="kullaniciTesisErisimiDegistir('${k.id}','${t.id}')">${esc(t.ad)}</button>`).join('')}
              </div>
              <div class="bosMetin" style="margin-bottom:6px">Görebileceği bölümler</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${izinListesi.map(iz => `<button class="ty-btn tesisErisimBtn ${(iz.varsayilanKapali ? kIzinler[iz.anahtar]===true : kIzinler[iz.anahtar]!==false)?'tesisErisimBtnAktif':''}" onclick="kullaniciIzinDegistir('${k.id}','${iz.anahtar}')">${iz.etiket}</button>`).join('')}
              </div>
            </div>`;
          }
          h += `</div>`;
        });
      }
      h += `</div>`;
      h += `<div class="bosMetin" style="margin-bottom:20px">Yeni kullanıcı eklemek için Firebase Console → Authentication → Add user yolunu kullanın. Yeni kullanıcı ilk giriş yaptığında otomatik olarak "Personel" yetkisiyle burada listelenir.</div>`;

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
    let h = `<div class="bosMetin ty-btn" style="cursor:pointer;margin-bottom:10px;display:inline-block" onclick="ayarlarGoster()">← Ayarlar'a dön</div>`;
    h += `<div class="pompaBaslikSatir">
      <div>
        <div class="pompaAdBaslik">Kullanılan Malzemeler</div>
        <div class="altBaslik2">daha önce kullanılmış / kayıtlı tüm malzemeler — pompa ve rapor kayıtlarında otomatik tamamlama için kullanılır</div>
      </div>
      <button class="eklePrimer ty-btn" onclick="malzemeListesiEkle()">+ malzeme ekle</button>
    </div>`;
    h += `<div class="kart">`;
    if (state.malzemeGecmisi.length === 0) h += `<div class="bosMetin">Henüz malzeme eklenmedi.</div>`;
    else h += `<div class="kalemBaslikSatir" style="padding-left:0"><span style="flex:1">Malzeme adı</span><span style="width:130px">Kod</span><span style="width:120px">Birim</span><span style="width:20px"></span></div>`;
    state.malzemeGecmisi.forEach(m => {
      h += `<div class="parcaSatir">
        <input class="parcaGirdi" placeholder="Malzeme adı" value="${esc(m.ad)}" onchange="malzemeListesiGuncelle('${m.id}','ad',this.value)" />
        <input class="parcaGirdi" style="width:130px;flex:none" placeholder="Kod" value="${esc(m.kod)}" onchange="malzemeListesiGuncelle('${m.id}','kod',this.value)" />
        <select class="parcaGirdi" style="width:120px;flex:none" onchange="malzemeListesiGuncelle('${m.id}','birim',this.value)">
          ${["adet","koli","tane","kg","litre"].map(b => `<option value="${b}" ${(m.birim||'adet')===b?'selected':''}>${b}</option>`).join('')}
        </select>
        <span class="silIkon" onclick="silOnayla('Malzemeyi Sil', ()=>malzemeListesindenSil('${m.id}'))">×</span>
      </div>`;
    });
    h += `</div>`;
    anaPanelYaz(h);
    return;
}
