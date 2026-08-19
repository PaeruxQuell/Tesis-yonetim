function bosKalem(){ return { id: uid(), urun: "", kod: "", miktar: "", birim: "", gelisTarihi: "", durum: "Gelmedi", stokaAktarildi: false }; }
function bosYer(){ return { id: uid(), ad: "" }; }
function bosSatinAlmaKaydi(){
  return {
    id: uid(), siparisNo: "", gelisTarihi: bugun(),
    kalemler: [bosKalem()], yerler: [bosYer()],
    firma: "",
    onayDurumu: "bekliyor",
    eklenmeTarihi: bugun(), eklenmeSaati: suAn()
  };
}
let saTaslak = null; // henüz gönderilmemiş, listeye/Firestore'a hiç yazılmamış satın alma taslağı
function satinAlmaYeniAc(){
  saTaslak = bosSatinAlmaKaydi();
  ui.saSecim = saTaslak.id;
  ui.saDuzenle = true;
  ui.view = "satinalma-detay";
  render();
}
function satinAlmaTaslakMi(id){ return !!(saTaslak && saTaslak.id === id); }
function satinAlmaBul(id){
  if (saTaslak && saTaslak.id === id) return saTaslak;
  return state.satinAlmalar.find(x => x.id === id);
}
function satinAlmaGonder(){
  if (!saTaslak) return;
  const yeni = saTaslak;
  saTaslak = null;
  state.satinAlmalar.unshift(yeni);
  kaydetIslem("Yeni satın alma talebi oluşturuldu", { view: "satinalma-detay", satId: yeni.id });
  saveData();
  toastGoster("Satın alma talebi gönderildi.", "basari");
  ui.saDuzenle = false;
  render();
}
function satinAlmaTaslaktanVazgec(){
  saTaslak = null;
  ui.view = "satinalma"; ui.saSecim = null;
  render();
}
function satinAlmaOnayla(satId){
  if (!satinAlmaOnaylayabilirMi()) { toastGoster("Bu işlemi onaylama yetkiniz yok.", "hata"); return; }
  const s = satinAlmaBul(satId); if (!s) return;
  s.onayDurumu = "onaylandi";
  kaydetIslem(`Satın alma onaylandı: ${s.siparisNo || 'sipariş no yok'}`, { view: "satinalma-detay", satId: s.id });
  toastGoster("Satın alma talebi onaylandı.", "basari");
  konfetiPatlat();
  saveData(); render();
}
function satinAlmaGuncelle(id, alan, deger){
  const s = satinAlmaBul(id); if (s) s[alan] = deger;
  if (!satinAlmaTaslakMi(id)) saveData();
  render();
}
function satinAlmaSil(id){
  const sat = satinAlmaBul(id);
  state.satinAlmalar = state.satinAlmalar.filter(x => x.id !== id);
  if (ui.saSecim === id) { ui.view = "satinalma"; ui.saSecim = null; }
  if (sat) kaydetIslem(`Satın alma talebi silindi: ${sat.siparisNo || 'sipariş no yok'}`, { view: "anasayfa" });
  saveData(); render();
}
function satinAlmaGoster(){ if (!izinVar('satinAlmalar')) return; ui.view = "satinalma"; ui.saArama = ""; render(); }
function satinAlmaSec(id){ ui.saSecim = id; ui.saDuzenle = false; ui.view = "satinalma-detay"; render(); }
function satinAlmaDuzenleAcKapat(){ ui.saDuzenle = !ui.saDuzenle; render(); }
function saAramaGuncelle(deger){ ui.saArama = deger; saListesiRender(); }

/* kalemler (ürün satırları) */
function saKalemEkle(satId){
  const s = satinAlmaBul(satId); s.kalemler.push(bosKalem());
  if (!satinAlmaTaslakMi(satId)) {
    kaydetIslem(`Satın alma kalemi eklendi (Sipariş: ${s.siparisNo||'no yok'})`, { view: "satinalma-detay", satId: s.id });
    saveData();
  }
  render();
}
function saKalemSil(satId, kalemId){
  const s = satinAlmaBul(satId);
  const k = s.kalemler.find(x => x.id === kalemId);
  s.kalemler = s.kalemler.filter(x => x.id !== kalemId);
  if (s.kalemler.length === 0) s.kalemler.push(bosKalem());
  if (!satinAlmaTaslakMi(satId)) {
    if (k) kaydetIslem(`Satın alma kalemi silindi: ${k.urun || '(isimsiz)'} (Sipariş: ${s.siparisNo||'no yok'})`, { view: "satinalma-detay", satId: s.id });
    saveData();
  }
  render();
}
function saKalemGuncelle(satId, kalemId, alan, deger){
  const s = satinAlmaBul(satId); const k = s.kalemler.find(x => x.id === kalemId); if (k) k[alan] = deger;
  if (alan === "urun" || alan === "kod") { if (k && k.urun) malzemeGecmisineEkle(k.urun, "", k.kod); }
  if (!satinAlmaTaslakMi(satId)) saveData();
  render();
}
function saKalemDurumDegistir(satId, kalemId){
  const s = satinAlmaBul(satId); const k = s.kalemler.find(x => x.id === kalemId); if (!k) return;
  if (s.onayDurumu !== "onaylandi") { toastGoster("Bu talep henüz onaylanmadı.", "hata"); return; }
  if (k.stokaAktarildi) { toastGoster("Bu ürün zaten stoğa eklendi, durumu değiştirilemez.", "hata"); return; }
  k.durum = k.durum === "Geldi" ? "Gelmedi" : "Geldi";
  k.gelisTarihi = k.durum === "Geldi" ? bugun() : "";
  kaydetIslem(`Satın alma durumu değiştirildi: ${k.urun || '(isimsiz)'} → ${k.durum}`, { view: "satinalma-detay", satId: s.id });
  saveData(); render();
}
/* kullanıldığı yer satırları */
function saYerEkle(satId){
  const s = satinAlmaBul(satId); s.yerler.push(bosYer());
  if (!satinAlmaTaslakMi(satId)) saveData();
  render();
}
function saYerSil(satId, yerId){
  const s = satinAlmaBul(satId); s.yerler = s.yerler.filter(x => x.id !== yerId);
  if (s.yerler.length === 0) s.yerler.push(bosYer());
  if (!satinAlmaTaslakMi(satId)) saveData();
  render();
}
function saYerGuncelle(satId, yerId, deger){
  const s = satinAlmaBul(satId); const y = s.yerler.find(x => x.id === yerId); if (y) y.ad = deger;
  if (!satinAlmaTaslakMi(satId)) saveData();
  render();
}

function saTumKalemler(){
  return state.satinAlmalar.filter(satinAlmaGorunurMu).flatMap(s => s.kalemler.map(k => ({ ...k, satId: s.id })));
}
function saDurumFiltreDegistir(f){ ui.saFiltre = f; render(); }
function saTesisFiltreDegistir(deger){ ui.saTesisFiltre = deger; render(); }
function saFiltreliListe(){
  const q = (ui.saArama || "").trim().toLowerCase();
  let liste = state.satinAlmalar.filter(satinAlmaGorunurMu);
  if (ui.saTesisFiltre) {
    liste = liste.filter(s => (s.yerler || []).some(y => y.ad === ui.saTesisFiltre));
  }
  if (q) {
    liste = liste.filter(s =>
      [s.siparisNo, s.firma,
       ...(s.kalemler || []).map(k => k.urun),
       ...(s.yerler || []).map(y => y.ad)]
        .some(alan => (alan || "").toLowerCase().includes(q))
    );
  }
  if (ui.saFiltre === "beklemede") {
    liste = liste.filter(s => s.onayDurumu !== "onaylandi");
  } else {
    liste = liste.filter(s => s.onayDurumu === "onaylandi");
    if (ui.saFiltre === "gelen") {
      liste = liste.filter(s => s.kalemler.length > 0 && s.kalemler.every(k => k.durum === "Geldi"));
    } else if (ui.saFiltre === "gelmeyen") {
      liste = liste.filter(s => s.kalemler.some(k => k.durum === "Gelmedi"));
    }
  }
  return liste;
}
function saListesiRender(){
  const kap = document.getElementById("saListesiKapsayici");
  if (!kap) return;
  const liste = saFiltreliListe();
  let h = `<div class="tabloSarici">`;
  if (liste.length === 0) {
    h += `<div class="bosMetin" style="padding:16px">${state.satinAlmalar.length===0 ? "Henüz satın alma kaydı yok. \"+ satın alma ekle\" ile başlayın." : "Aramanla eşleşen bir kayıt bulunamadı."}</div>`;
  } else {
    liste.forEach(sat => {
      const urunler = (sat.kalemler || []).map(k => k.urun).filter(Boolean);
      const gelenSayi = (sat.kalemler || []).filter(k => k.durum === "Geldi").length;
      const toplam = (sat.kalemler || []).length;
      const yerMetni = (sat.yerler || []).map(y => y.ad).filter(Boolean).join(", ");
      const bekliyorMu = sat.onayDurumu !== "onaylandi";
      const renk = bekliyorMu ? "var(--mor)" : (gelenSayi === toplam ? durumRenk.Geldi : durumRenk.Gelmedi);
      const renkRgb = bekliyorMu ? "var(--mor-rgb)" : (gelenSayi === toplam ? durumRenkRgb.Geldi : durumRenkRgb.Gelmedi);
      h += `<div class="saListeSatir ty-satir" onclick="satinAlmaSec('${sat.id}')">
        <div style="flex:1;min-width:0">
          <div class="saListeUrun">${esc(urunler.slice(0,3).join(", ")) || "(ürün adı girilmedi)"}${urunler.length>3?` <span style="color:var(--yazi-soluk)">+${urunler.length-3} diğer</span>`:''}</div>
          <div class="saListeAltBilgi">${[sat.siparisNo && ('Sipariş No: '+sat.siparisNo), yerMetni].filter(Boolean).map(esc).join(' · ') || '—'}</div>
        </div>
        <span class="rozetDurum" style="color:${renk};border-color:rgba(${renkRgb},0.33);background:rgba(${renkRgb},0.1)">${bekliyorMu ? '⏳ Onay Bekliyor' : `${gelenSayi}/${toplam} geldi`}</span>
      </div>`;
    });
  }
  h += `</div>`;
  kap.innerHTML = h;
}

/* ---------------- yedekleme ---------------- */
function disaAktar(){
  const veri = { ...state, olusturma: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(veri, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `tesis-yedek-${bugun().replaceAll(".", "-")}.json`; a.click();
  URL.revokeObjectURL(url);
}
function iceAktar(dosya){
  if (!dosya) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const veri = JSON.parse(reader.result);
      if (veri.tesisler) state.tesisler = veri.tesisler;
      if (veri.satinAlmalar) state.satinAlmalar = veri.satinAlmalar;
      toastGoster("Yedek başarıyla geri yüklendi.", "basari");
      saveData(); render();
    } catch(e){ toastGoster("Yedek dosyası okunamadı. Geçerli bir JSON dosyası seçin.", "hata"); }
  };
  reader.readAsText(dosya);
}

/* ---------------- render ---------------- */
const durumRenk = { Geldi: "var(--yesil)", Gelmedi: "var(--kirmizi2)" };
const durumRenkRgb = { Geldi: "var(--yesil-rgb)", Gelmedi: "var(--kirmizi2-rgb)" };


function renderSatinAlma(){
    let h = `<div class="saUstSatir">
      <div><div class="pompaAdBaslik">Satın Almalar</div><div class="altBaslik2">satınalma talep formu formatında kayıt ve takip</div></div>
      <div style="display:flex;gap:8px;">
        <button class="eklePrimer ty-btn" onclick="satinAlmaYeniAc()">+ satın alma ekle</button>
      </div>
    </div>`;
    h += `<div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap">
      <input class="girdi saArama" style="flex:1;min-width:220px" id="saArama" placeholder="🔍  Ürün, sipariş no, tesis, firma... ara" value="${esc(ui.saArama)}" oninput="saAramaGuncelle(this.value)" />
      <select class="girdi" style="width:200px" onchange="saTesisFiltreDegistir(this.value)">
        <option value="">Tüm tesisler</option>
        ${erisilenTesisler().map(t => `<option value="${esc(t.ad)}" ${ui.saTesisFiltre===t.ad?'selected':''}>${esc(t.ad)}</option>`).join('')}
      </select>
    </div>`;
    const onayliListe = state.satinAlmalar.filter(satinAlmaGorunurMu).filter(s => s.onayDurumu === "onaylandi");
    const tumSayi = onayliListe.length;
    const gelenSayi = onayliListe.filter(s => s.kalemler.length>0 && s.kalemler.every(k=>k.durum==='Geldi')).length;
    const gelmeyenSayi = onayliListe.filter(s => s.kalemler.some(k=>k.durum==='Gelmedi')).length;
    const beklemedeSayi = state.satinAlmalar.filter(satinAlmaGorunurMu).filter(s => s.onayDurumu !== "onaylandi").length;
    h += `<div class="filtreSatiri">
      <button class="filtreBtn ${ui.saFiltre==='tumu'?'filtreBtnAktif':''} ty-btn" style="--filtre-renk:var(--vurgu);--filtre-bg:rgba(var(--vurgu-rgb),0.12)" onclick="saDurumFiltreDegistir('tumu')">Tümü <span class="filtreSayi">${tumSayi}</span></button>
      <button class="filtreBtn ${ui.saFiltre==='gelen'?'filtreBtnAktif':''} ty-btn" style="--filtre-renk:${durumRenk.Geldi};--filtre-bg:rgba(${durumRenkRgb.Geldi},0.12)" onclick="saDurumFiltreDegistir('gelen')">Gelenler <span class="filtreSayi">${gelenSayi}</span></button>
      <button class="filtreBtn ${ui.saFiltre==='gelmeyen'?'filtreBtnAktif':''} ty-btn" style="--filtre-renk:${durumRenk.Gelmedi};--filtre-bg:rgba(${durumRenkRgb.Gelmedi},0.12)" onclick="saDurumFiltreDegistir('gelmeyen')">Gelmeyenler <span class="filtreSayi">${gelmeyenSayi}</span></button>
      <button class="filtreBtn ${ui.saFiltre==='beklemede'?'filtreBtnAktif':''} ty-btn" style="--filtre-renk:var(--mor);--filtre-bg:rgba(var(--mor-rgb),0.12)" onclick="saDurumFiltreDegistir('beklemede')">Beklemede <span class="filtreSayi">${beklemedeSayi}</span></button>
    </div>`;
    h += `<div id="saListesiKapsayici"></div>`;
    anaPanelYaz(h);
    saListesiRender();
    return;
}
function renderSatinAlmaDetay(){
    const sat = satinAlmaBul(ui.saSecim);
    if (!sat) { ui.view = "satinalma"; renderAna(); return; }
    const taslakMi = satinAlmaTaslakMi(sat.id);
    const baslikAlan = (etiket, key, genislik) => `
      <div style="${genislik?`width:${genislik}px`:'flex:1'}">
        <div class="bosMetin" style="margin-bottom:5px;font-style:normal">${etiket}</div>
        ${ui.saDuzenle
          ? `<input class="girdi" value="${esc(sat[key])}" onchange="satinAlmaGuncelle('${sat.id}','${key}',this.value)" />`
          : `<div class="deger">${esc(sat[key]) || '—'}</div>`}
      </div>`;

    let h = `<div class="geriDon ty-btn" onclick="${taslakMi ? "silOnayla('Taslağı Kapat', ()=>satinAlmaTaslaktanVazgec())" : 'satinAlmaGoster()'}"><span style="font-size:17px;line-height:1">‹</span> Satın Almalar listesine dön</div>`;
    h += `<div class="pompaBaslikSatir">
      <div class="pompaAdBaslik">${taslakMi ? 'Yeni Satın Alma Talebi' : (esc(sat.siparisNo) ? ('Sipariş No: ' + esc(sat.siparisNo)) : 'İsimsiz Satınalma Talebi')}</div>
      <div style="display:flex;gap:8px">
        ${taslakMi ? '' : `<button class="${ui.saDuzenle?'duzenleBtnAktif':'duzenleBtn'} ty-btn" onclick="satinAlmaDuzenleAcKapat()">${ui.saDuzenle?'Düzenlemeyi bitir':'Düzenle'}</button>`}
        ${taslakMi ? `<button class="ustBtn ty-btn" style="color:var(--kirmizi)" onclick="silOnayla('Taslağı Kapat', ()=>satinAlmaTaslaktanVazgec())">Vazgeç</button>` : (adminMi() ? `<button class="ustBtn ty-btn" style="color:var(--kirmizi)" onclick="silOnayla('Satın Alma Talebini Sil', ()=>satinAlmaSil('${sat.id}'))">Sil</button>` : '')}
      </div>
    </div>`;

    if (taslakMi) {
      h += `<div class="kart" style="border-color:rgba(var(--vurgu-rgb),0.4);background:rgba(var(--vurgu-rgb),0.06)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div>
            <div style="font-weight:700;color:var(--vurgu);font-size:14px">📝 Taslak — henüz gönderilmedi</div>
            <div class="bosMetin" style="margin:2px 0 0">Bu talep aşağıdaki bilgileri doldurup "Satın Almayı Gönder"e basana kadar listeye eklenmez, kimseye bildirim gitmez.</div>
          </div>
          <button class="eklePrimer ty-btn" onclick="satinAlmaGonder()">📨 Satın Almayı Gönder</button>
        </div>
      </div>`;
    } else if (sat.onayDurumu !== "onaylandi") {
      h += `<div class="kart" style="border-color:rgba(var(--mor-rgb),0.4);background:rgba(var(--mor-rgb),0.06)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div>
            <div style="font-weight:700;color:var(--mor);font-size:14px">⏳ Onay Bekliyor</div>
            <div class="bosMetin" style="margin:2px 0 0">Bu talep henüz onaylanmadı. Onaylanana kadar ürünlerin Geldi/Gelmedi durumu değiştirilemez.</div>
          </div>
          ${satinAlmaOnaylayabilirMi() ? `<button class="eklePrimer ty-btn" onclick="silOnayla('Satın Almayı Onayla', ()=>satinAlmaOnayla('${sat.id}'))">✓ Onayla</button>` : ''}
        </div>
      </div>`;
    }

    h += `<div class="kart">
      <div class="kartBaslik" style="margin-bottom:12px">Satınalma Talep Formu</div>
      <div style="display:flex;gap:14px;margin-bottom:14px">
        ${baslikAlan('Geliş Tarihi', 'gelisTarihi', 140)}
        ${baslikAlan('Satınalma (Sipariş) No', 'siparisNo')}
      </div>
    </div>`;

    h += `<div class="kart">
      <div class="kartBaslikSatir">
        <span class="kartBaslik">Malzemenin Cinsi ve Özellikleri (Ürün)</span>
        ${ui.saDuzenle?`<button class="ekleMini ty-btn" onclick="saKalemEkle('${sat.id}')">+ satır ekle</button>`:''}
      </div>
      <div class="kalemBaslikSatir">
        <span style="width:26px"></span><span style="flex:1.6">Ürün</span><span style="width:130px">Kod</span><span style="flex:1">Miktar</span><span style="flex:1">Birim</span><span style="width:150px">Durum</span><span style="width:20px"></span>
      </div>
      ${sat.kalemler.map((k, i) => `
        <div class="kalemSatir">
          <span class="kalemNo">${i+1}</span>
          ${urunKritikMi(k.urun) ? `<span class="kritikSolukNokta" title="Bu ürün kritik stokta">●</span>` : ''}
          ${ui.saDuzenle ? `
            <input class="parcaGirdi" style="flex:1.6" list="malzemeListesi" placeholder="Ürün adı" value="${esc(k.urun)}" onchange="saKalemGuncelle('${sat.id}','${k.id}','urun',this.value)" />
            <input class="parcaGirdi" style="width:130px;flex:none" list="kodListesi-${k.id}" placeholder="Kod (örn: 6305)" value="${esc(k.kod||'')}" onchange="saKalemGuncelle('${sat.id}','${k.id}','kod',this.value)" />
            <datalist id="kodListesi-${k.id}">${urunKodlariGetir(k.urun).map(kd => `<option value="${esc(kd)}"></option>`).join('')}</datalist>
            <input class="parcaGirdi" style="flex:1" placeholder="Miktar" value="${esc(k.miktar)}" onchange="saKalemGuncelle('${sat.id}','${k.id}','miktar',this.value)" />
            <input class="parcaGirdi" style="flex:1" placeholder="Birim" value="${esc(k.birim)}" onchange="saKalemGuncelle('${sat.id}','${k.id}','birim',this.value)" />
            <span style="width:150px"></span>
          ` : `
            <span style="flex:1.6;color:var(--yazi)">${esc(k.urun) || '—'}</span>
            <span style="width:130px;color:var(--yazi-dim);font-family:'JetBrains Mono',monospace;font-size:11.5px">${esc(k.kod) || '—'}</span>
            <span style="flex:1;color:var(--yazi-dim)">${esc(k.miktar) || '—'}</span>
            <span style="flex:1;color:var(--yazi-dim)">${esc(k.birim) || '—'}</span>
            <span style="width:150px;flex:none">
              ${sat.onayDurumu !== "onaylandi" ? `
                <span style="color:var(--mor);font-weight:600;font-size:11px">⏳ Onay bekliyor</span>
              ` : k.stokaAktarildi ? `
                <span style="color:var(--yesil);font-weight:600;font-size:11.5px">✓ Depoya eklendi</span>
                ${k.gelisTarihi ? `<div style="color:var(--yazi-soluk);font-size:10.5px;font-family:'JetBrains Mono',monospace">${esc(k.gelisTarihi)}</div>` : ''}
              ` : `
                <button class="ty-btn" style="width:110px;background:rgba(${durumRenkRgb[k.durum]},0.1);color:${durumRenk[k.durum]};font-weight:600;border:1px solid rgba(${durumRenkRgb[k.durum]},0.33);border-radius:6px;padding:6px 0;font-size:11.5px" onclick="saKalemDurumDegistir('${sat.id}','${k.id}')">${k.durum}</button>
                ${k.durum==='Geldi' && k.gelisTarihi ? `<div style="color:var(--yazi-soluk);font-size:10.5px;font-family:'JetBrains Mono',monospace;margin-top:2px">${esc(k.gelisTarihi)}</div>` : ''}
              `}
            </span>
          `}
          ${ui.saDuzenle ? `<span class="silIkon" style="width:20px" onclick="silOnayla('Ürünü Sil', ()=>saKalemSil('${sat.id}','${k.id}'))">×</span>` : `<span style="width:20px"></span>`}
        </div>`).join('')}
    </div>`;

    h += `<div class="kart">
      <div class="kartBaslikSatir">
        <span class="kartBaslik">Kullanıldığı Yer</span>
        ${ui.saDuzenle?`<button class="ekleMini ty-btn" onclick="saYerEkle('${sat.id}')">+ satır ekle</button>`:''}
      </div>
      ${sat.yerler.map((y, i) => `
        <div class="kalemSatir">
          <span class="kalemNo">${i+1}</span>
          ${ui.saDuzenle
            ? `<select class="parcaGirdi" style="flex:1" onchange="saYerGuncelle('${sat.id}','${y.id}',this.value)">
                 <option value="">— tesis seç —</option>
                 ${erisilenTesisler().map(t => `<option value="${esc(t.ad)}" ${t.ad===y.ad?'selected':''}>${esc(t.ad)}</option>`).join('')}
               </select>
               <span class="silIkon" style="width:20px" onclick="silOnayla('Satırı Sil', ()=>saYerSil('${sat.id}','${y.id}'))">×</span>`
            : `<span style="flex:1;color:var(--yazi-ikincil)">${esc(y.ad) || '—'}</span>`}
        </div>`).join('')}
    </div>`;

    h += `<div class="kart">
      <div class="kartBaslik" style="margin-bottom:12px">Sipariş Bilgileri</div>
      <div>${baslikAlan('Sipariş Edilmesi İstenen Firma / Firmalar', 'firma')}</div>
    </div>`;

    h += taslakMi
      ? `<div class="bosMetin">Bu taslak henüz kaydedilmedi. Formu doldurup yukarıdaki "Satın Almayı Gönder" butonuna basın.</div>`
      : `<div class="bosMetin">Kayıt zamanı: ${esc(sat.eklenmeTarihi)} ${esc(sat.eklenmeSaati)}</div>`;

    anaPanelYaz(h);
}
