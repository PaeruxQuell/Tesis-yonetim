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
  let h = `<div class="bosMetin ty-btn" style="cursor:pointer;margin-bottom:10px;display:inline-block" onclick="ayarlarGoster()">← Ayarlar'a dön</div>`;
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
