function stokGoster(){ if (!izinVar('stokListesi')) return; ui.view = "stok"; render(); }
function stokDuzenleAcKapat(){ ui.stokDuzenle = !ui.stokDuzenle; render(); }
function stokTesisAcKapat(id){ ui.stokAcikTesis.has(id) ? ui.stokAcikTesis.delete(id) : ui.stokAcikTesis.add(id); render(); }
function stokDepoAcKapat(id){ ui.stokAcikDepo.has(id) ? ui.stokAcikDepo.delete(id) : ui.stokAcikDepo.add(id); render(); }
function depoEkle(tesisId){
  if (!adminMi()) return;
  const t = state.tesisler.find(x => x.id === tesisId);
  const yeni = { id: uid(), ad: "Yeni Depo", urunler: [] };
  t.depolar.push(yeni);
  ui.stokAcikDepo.add(yeni.id);
  kaydetIslem(`Yeni depo eklendi: ${yeni.ad} (${t.ad})`, { view: "stok", tesisId: t.id, depoId: yeni.id });
  saveData(); render();
}
function depoSil(tesisId, depoId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const d = t.depolar.find(x => x.id === depoId);
  t.depolar = t.depolar.filter(d => d.id !== depoId);
  if (d) kaydetIslem(`Depo silindi: ${d.ad} (${t.ad})`, { view: "stok", tesisId: t.id });
  saveData(); render();
}
function depoAdGuncelle(tesisId, depoId, ad){
  const t = state.tesisler.find(x => x.id === tesisId);
  const d = t.depolar.find(x => x.id === depoId);
  const eski = d ? d.ad : "";
  if (d) d.ad = ad;
  if (d && eski !== ad) kaydetIslem(`Depo adı değiştirildi: ${eski} → ${ad} (${t.ad})`, { view: "stok", tesisId: t.id, depoId: d.id });
  saveData(); render();
}
function stokUrunBul(tesisId, depoId, urunId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const d = t?.depolar.find(x => x.id === depoId);
  const u = d?.urunler.find(x => x.id === urunId);
  return { t, d, u };
}
function stokUrunEkle(tesisId, depoId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const d = t.depolar.find(x => x.id === depoId);
  d.urunler.push({ id: uid(), ad: "", miktar: 0, birim: "", kritikTakip: false, kritikEsik: 0 });
  kaydetIslem(`Stok ürünü eklendi: ${d.ad} (${t.ad})`, { view: "stok", tesisId: t.id, depoId: d.id });
  saveData(); render();
}
function stokUrunSil(tesisId, depoId, urunId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const d = t.depolar.find(x => x.id === depoId);
  const u = d.urunler.find(x => x.id === urunId);
  d.urunler = d.urunler.filter(x => x.id !== urunId);
  if (u) kaydetIslem(`Stok ürünü silindi: ${u.ad || '(isimsiz)'} (${d.ad} — ${t.ad})`, { view: "stok", tesisId: t.id, depoId: d.id });
  saveData(); render();
}
function stokUrunGuncelle(tesisId, depoId, urunId, alan, deger){
  const { u } = stokUrunBul(tesisId, depoId, urunId); if (u) u[alan] = deger;
  if (alan === "ad") malzemeGecmisineEkle(deger);
  saveData(); render();
}
function stokKritikDegistir(tesisId, depoId, urunId){
  const { t, d, u } = stokUrunBul(tesisId, depoId, urunId); if (!u) return;
  u.kritikTakip = !u.kritikTakip;
  kaydetIslem(`Kritik stok takibi ${u.kritikTakip?'açıldı':'kapatıldı'}: ${u.ad || '(isimsiz)'} (${d.ad} — ${t.ad})`, { view: "stok", tesisId: t.id, depoId: d.id });
  saveData(); render();
}
function tesisKritikMi(t){
  return (t.depolar || []).some(d => (d.urunler || []).some(u => u.kritikTakip && (parseFloat(u.miktar) || 0) <= (parseFloat(u.kritikEsik) || 0)));
}
function kritikTesisAdlari(){
  return kapsamTesisler().filter(tesisKritikMi).map(t => t.ad);
}
function urunKritikMi(ad){
  if (!ad) return false;
  const q = ad.trim().toLowerCase();
  if (!q) return false;
  return state.tesisler.some(t => (t.depolar || []).some(d => (d.urunler || []).some(u =>
    u.ad.trim().toLowerCase() === q && u.kritikTakip && (parseFloat(u.miktar) || 0) <= (parseFloat(u.kritikEsik) || 0)
  )));
}

/* ---------------- satın almadan stoğa bekleyen ürünler ---------------- */
function bekleyenStokKalemleri(tesisAdi){
  const sonuc = [];
  state.satinAlmalar.forEach(sat => {
    if (!(sat.yerler || []).some(y => y.ad === tesisAdi)) return;
    (sat.kalemler || []).forEach(k => {
      if (!k.stokaAktarildi && k.durum === "Geldi" && k.urun && k.urun.trim()) {
        sonuc.push({ satId: sat.id, kalemId: k.id, urun: k.urun, miktar: k.miktar, birim: k.birim });
      }
    });
  });
  return sonuc;
}
function stokBekleyenAcKapat(tesisId){ ui.stokBekleyenAcik.has(tesisId) ? ui.stokBekleyenAcik.delete(tesisId) : ui.stokBekleyenAcik.add(tesisId); render(); }
function stokBekleyenSecToggle(tesisId, satId, kalemId){
  const anahtar = satId + "|" + kalemId;
  if (!ui.stokBekleyenSecim[tesisId]) ui.stokBekleyenSecim[tesisId] = new Set();
  const s = ui.stokBekleyenSecim[tesisId];
  s.has(anahtar) ? s.delete(anahtar) : s.add(anahtar);
  render();
}
function stokBekleyenDepoSec(tesisId, depoId){ ui.stokBekleyenDepo[tesisId] = depoId; render(); }
function stokBekleyenAlanGuncelle(satId, kalemId, alan, deger){
  const sat = satinAlmaBul(satId); const k = sat?.kalemler.find(x => x.id === kalemId); if (k) k[alan] = deger;
  if (alan === "urun") malzemeGecmisineEkle(deger);
  saveData(); render();
}
function stokBekleyenOnayla(tesisId){
  const t = state.tesisler.find(x => x.id === tesisId);
  if (!t.depolar || t.depolar.length === 0) { toastGoster("Bu tesiste depo yok — önce bir depo eklemelisiniz.", "hata"); return; }
  const secilenler = ui.stokBekleyenSecim[tesisId];
  if (!secilenler || secilenler.size === 0) { toastGoster("Lütfen stoğa eklenecek en az bir ürün seçin.", "hata"); return; }
  teyitIste("Stok Onayı", "Seçilen ürünleri stoğa eklemek üzeresiniz. Onaylamak için işlemi çözün:", () => stokBekleyenIsle(tesisId));
}
function stokBekleyenIsle(tesisId){
  const t = state.tesisler.find(x => x.id === tesisId);
  if (!t.depolar || t.depolar.length === 0) { toastGoster("Bu tesiste depo yok.", "hata"); return; }
  const secilenler = ui.stokBekleyenSecim[tesisId] || new Set();
  let depoId = t.depolar.length === 1 ? t.depolar[0].id : (ui.stokBekleyenDepo[tesisId] || t.depolar[0].id);
  let depo = t.depolar.find(d => d.id === depoId);
  if (!depo) { toastGoster("Geçerli bir depo seçin.", "hata"); return; }
  const bekleyenler = bekleyenStokKalemleri(t.ad);
  let sayac = 0;
  bekleyenler.forEach(b => {
    const anahtar = b.satId + "|" + b.kalemId;
    malzemeGecmisineEkle(b.urun);
    if (!secilenler.has(anahtar)) return;
    const sat = satinAlmaBul(b.satId); const k = sat?.kalemler.find(x => x.id === b.kalemId);
    if (!k) return;
    const adTemiz = (k.urun || "").trim();
    const mevcut = depo.urunler.find(u => u.ad.trim().toLowerCase() === adTemiz.toLowerCase());
    const miktar = parseFloat(k.miktar) || 0;
    if (mevcut) { mevcut.miktar = (parseFloat(mevcut.miktar) || 0) + miktar; }
    else { depo.urunler.push({ id: uid(), ad: adTemiz, miktar, birim: k.birim || "", kritikTakip: false, kritikEsik: 0 }); }
    k.stokaAktarildi = true;
    sayac++;
  });
  delete ui.stokBekleyenSecim[tesisId];
  kaydetIslem(`Stok onaylandı: ${sayac} ürün → ${t.ad} / ${depo.ad}`, { view: "stok", tesisId: t.id, depoId: depo.id });
  toastGoster(`${sayac} ürün ${t.ad} / ${depo.ad} stoğuna eklendi.`, "basari");
  saveData(); render();
}

/* ---------------- periyodik bakım ---------------- */

function renderStok(){
    let h = `<div class="pompaBaslikSatir" style="margin-bottom:4px">
      <div>
        <div class="pompaAdBaslik">Stok Listesi</div>
        <div class="altBaslik2">tesis ve depo bazında stok takibi</div>
      </div>
      <button class="${ui.stokDuzenle?'duzenleBtnAktif':'duzenleBtn'} ty-btn" onclick="stokDuzenleAcKapat()">${ui.stokDuzenle?'Düzenlemeyi bitir':'Düzenle'}</button>
    </div>`;
    h += `<div style="height:8px"></div>`;
    erisilenTesisler().forEach(t => {
      const acik = ui.stokAcikTesis.has(t.id);
      const kritik = tesisKritikMi(t);
      const bekleyenler = bekleyenStokKalemleri(t.ad);
      h += `<div class="tesisKart">
        <div class="tesisBaslikSatir" onclick="stokTesisAcKapat('${t.id}')">
          <span class="okBuyuk" style="transform:${acik?'rotate(90deg)':'none'}">›</span>
          <span class="tesisIkon">🏭</span>
          <span class="tesisAdMetin">${esc(t.ad)}</span>
          ${kritik ? `<span class="kritikNokta" title="Kritik stok var">●</span>` : ''}
          ${bekleyenler.length ? `<span class="bekleyenRozet">${bekleyenler.length} bekleyen</span>` : ''}
        </div>`;
      if (acik) {
        if (bekleyenler.length > 0) {
          const bekAcik = ui.stokBekleyenAcik.has(t.id);
          const secim = ui.stokBekleyenSecim[t.id] || new Set();
          h += `<div class="bekleyenBanner ty-btn" onclick="stokBekleyenAcKapat('${t.id}')">
            <span>🕓 Beklenen yeni stok var (${bekleyenler.length} ürün)</span>
            <span class="okBuyuk" style="transform:${bekAcik?'rotate(90deg)':'none'}">›</span>
          </div>`;
          if (bekAcik) {
            h += `<div class="bekleyenIcerik">`;
            h += `<div class="kalemBaslikSatir" style="padding-left:0">
              <span style="width:26px"></span><span style="flex:2">Ürün</span><span style="width:80px">Miktar</span><span style="width:120px">Birim</span>
            </div>`;
            bekleyenler.forEach(b => {
              const anahtar = b.satId + "|" + b.kalemId;
              const secili = secim.has(anahtar);
              h += `<div class="kalemSatir" style="padding-left:0">
                <input type="checkbox" class="bekleyenCheck" ${secili?'checked':''} onchange="stokBekleyenSecToggle('${t.id}','${b.satId}','${b.kalemId}')" />
                <input class="parcaGirdi" style="flex:2" value="${esc(b.urun)}" onchange="stokBekleyenAlanGuncelle('${b.satId}','${b.kalemId}','urun',this.value)" />
                <input class="parcaGirdi" style="width:80px;flex:none" value="${esc(b.miktar)}" onchange="stokBekleyenAlanGuncelle('${b.satId}','${b.kalemId}','miktar',this.value)" />
                <input class="parcaGirdi" style="width:120px;flex:none" value="${esc(b.birim)}" onchange="stokBekleyenAlanGuncelle('${b.satId}','${b.kalemId}','birim',this.value)" />
              </div>`;
            });
            h += `<div class="bekleyenAltSatir">
              ${(t.depolar||[]).length === 0 ? `
                <span class="bosMetin" style="color:var(--kirmizi)">Bu tesiste depo yok — önce bir depo eklemelisiniz.</span>
              ` : (t.depolar||[]).length === 1 ? `
                <span class="bosMetin" style="font-style:normal">Depo: <b style="color:var(--yazi)">${esc(t.depolar[0].ad)}</b></span>
                <button class="eklePrimer ty-btn" onclick="stokBekleyenOnayla('${t.id}')">Seçilenleri Stoğa Ekle</button>
              ` : `
                <select class="girdi" style="width:220px" onchange="stokBekleyenDepoSec('${t.id}', this.value)">
                  ${t.depolar.map(d => `<option value="${d.id}" ${(ui.stokBekleyenDepo[t.id]||t.depolar[0].id)===d.id?'selected':''}>${esc(d.ad)}</option>`).join('')}
                </select>
                <button class="eklePrimer ty-btn" onclick="stokBekleyenOnayla('${t.id}')">Seçilenleri Stoğa Ekle</button>
              `}
            </div>`;
            h += `</div>`;
          }
        }
        (t.depolar || []).filter(d => !d.gizli).forEach(d => {
          const depoAcik = ui.stokAcikDepo.has(d.id);
          h += `<div class="makineSatir" onclick="stokDepoAcKapat('${d.id}')">
            <span class="okBuyuk" style="transform:${depoAcik?'rotate(90deg)':'none'}">›</span>
            <span class="tesisIkon" style="font-size:15px">📦</span>
            ${ui.stokDuzenle
              ? `<input class="dugumInput" value="${esc(d.ad)}" onclick="event.stopPropagation()" onchange="depoAdGuncelle('${t.id}','${d.id}',this.value)" />
                 ${adminMi() ? `<div class="aksiyonGrup"><button class="aksiyonBtn aksiyonBtnSil ty-btn" onclick="event.stopPropagation(); silOnayla('Depoyu Sil', ()=>depoSil('${t.id}','${d.id}'))">×</button></div>` : ''}`
              : `<span class="makineAdMetin">${esc(d.ad)}</span>`}
          </div>`;
          if (depoAcik) {
            h += `<div class="acilirIcerik" style="padding:10px 14px 16px 54px">`;
            if ((d.urunler || []).length === 0) h += `<div class="bosMetin">Henüz ürün eklenmedi.</div>`;
            else h += `<div class="kalemBaslikSatir" style="padding-left:0">
              <span style="flex:2">Ürün</span><span style="width:60px">Miktar</span><span style="width:110px">Birim</span>
              <span style="width:80px">Kritik Eşik</span><span style="width:150px">Kritik</span>
            </div>`;
            (d.urunler || []).forEach(u => {
              const kritikRenk = u.kritikTakip && (parseFloat(u.miktar)||0) <= (parseFloat(u.kritikEsik)||0);
              const miktarFlashSinif = miktarDegisimSinifi(u.id, u.miktar);
              h += `<div class="stokUrunSatirTek">
                ${ui.stokDuzenle ? `
                  <input class="parcaGirdi" style="flex:2" list="malzemeListesi" placeholder="Ürün adı" value="${esc(u.ad)}" onchange="stokUrunGuncelle('${t.id}','${d.id}','${u.id}','ad',this.value)" />
                  <input class="parcaGirdi ${kritikRenk?'stokKritikGirdi':''} ${miktarFlashSinif}" style="width:60px;flex:none" type="number" min="0" max="9999" maxlength="4" value="${esc(u.miktar)}" onchange="this.value=this.value.slice(0,4); stokUrunGuncelle('${t.id}','${d.id}','${u.id}','miktar',this.value)" />
                  <input class="parcaGirdi" style="width:110px;flex:none" placeholder="Birim" maxlength="16" value="${esc(u.birim)}" onchange="stokUrunGuncelle('${t.id}','${d.id}','${u.id}','birim',this.value)" />
                  <input class="parcaGirdi" style="width:80px;flex:none" type="number" value="${esc(u.kritikEsik)}" onchange="stokUrunGuncelle('${t.id}','${d.id}','${u.id}','kritikEsik',this.value)" />
                  <button class="ty-btn kritikToggleBtn ${u.kritikTakip?'kritikToggleAktif':''}" style="width:150px;flex:none" onclick="stokKritikDegistir('${t.id}','${d.id}','${u.id}')">${u.kritikTakip?'● İzleniyor':'Kritik işaretle'}</button>
                  ${adminMi() ? `<span class="silIkon" onclick="silOnayla('Ürünü Sil', ()=>stokUrunSil('${t.id}','${d.id}','${u.id}'))">×</span>` : ''}
                ` : `
                  <span style="flex:2;color:var(--yazi)">${esc(u.ad) || '—'}</span>
                  <span class="${miktarFlashSinif}" style="width:60px;color:${kritikRenk?'var(--kirmizi-yazi)':'var(--yazi-dim)'};font-weight:${kritikRenk?'700':'400'};border-radius:4px;display:inline-block">${esc(u.miktar)}</span>
                  <span style="width:110px;color:var(--yazi-dim)">${esc(u.birim) || '—'}</span>
                  <span style="width:80px;color:var(--yazi-dim)">${esc(u.kritikEsik)}</span>
                  <span style="width:150px;color:${u.kritikTakip?'var(--kirmizi)':'var(--yazi-soluk)'};font-size:11.5px">${u.kritikTakip?'● İzleniyor':'—'}</span>
                `}
              </div>`;
            });
            if (ui.stokDuzenle) h += `<button class="ekleMini ty-btn" style="margin-top:8px" onclick="stokUrunEkle('${t.id}','${d.id}')">+ ürün ekle</button>`;
            h += `</div>`;
          }
        });
        if (ui.stokDuzenle && adminMi()) h += `<button class="ekleMiniMakine ty-btn" onclick="depoEkle('${t.id}')">+ depo ekle</button>`;
      }
      h += `</div>`;
    });
    anaPanelYaz(h);
    return;
}

/* ---------------- malzeme kullan (stoktan düş) ---------------- */
function malzemeCikisGoster(){ if (!izinVar('malzemeCikis')) return; ui.view = "malzemecikis"; ui.cikisMiktarlar = {}; render(); }
function cikisTesisSec(tesisId){ ui.cikisTesisId = tesisId; ui.cikisDepoId = ""; ui.cikisMiktarlar = {}; render(); }
function cikisDepoSec(depoId){ ui.cikisDepoId = depoId; ui.cikisMiktarlar = {}; render(); }
function cikisMiktarGuncelle(urunId, deger){ ui.cikisMiktarlar[urunId] = deger; }
function cikisUygula(){
  const t = state.tesisler.find(x => x.id === ui.cikisTesisId);
  const d = t?.depolar.find(x => x.id === ui.cikisDepoId);
  if (!d) { toastGoster("Lütfen bir depo seçin.", "hata"); return; }
  const kullanilanlar = [];
  Object.entries(ui.cikisMiktarlar).forEach(([urunId, deger]) => {
    const miktar = parseFloat(deger);
    if (!miktar || miktar <= 0) return;
    const u = d.urunler.find(x => x.id === urunId);
    if (!u) return;
    const mevcutMiktar = parseFloat(u.miktar) || 0;
    const dusulecek = Math.min(miktar, mevcutMiktar);
    u.miktar = mevcutMiktar - dusulecek;
    kullanilanlar.push(`${u.ad} (${dusulecek} ${u.birim||''})`);
  });
  if (kullanilanlar.length === 0) { toastGoster("Lütfen en az bir ürün için miktar girin.", "hata"); return; }
  kaydetIslem(`Malzeme kullanıldı: ${kullanilanlar.join(', ')} (${d.ad} — ${t.ad})`, { view: "stok", tesisId: t.id, depoId: d.id });
  toastGoster("Seçilen malzemeler stoktan düşüldü.", "basari");
  ui.cikisMiktarlar = {};
  saveData(); render();
}
function renderMalzemeCikis(){
  let h = `<div class="pompaBaslikSatir" style="margin-bottom:4px">
    <div>
      <div class="pompaAdBaslik">Malzeme Kullan</div>
      <div class="altBaslik2">seçtiğiniz depodaki ürünlerden kullanılan miktarı stoktan düşün</div>
    </div>
  </div>`;
  h += `<div class="kart">
    <div class="kartBaslik" style="margin-bottom:10px">1. Tesis ve depo seçin</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
      <select class="girdi" style="width:220px" onchange="cikisTesisSec(this.value)">
        <option value="">Tesis seçin</option>
        ${erisilenTesisler().map(t => `<option value="${t.id}" ${ui.cikisTesisId===t.id?'selected':''}>${esc(t.ad)}</option>`).join('')}
      </select>`;
  if (ui.cikisTesisId) {
    const t = state.tesisler.find(x=>x.id===ui.cikisTesisId);
    const depolar = (t?.depolar||[]).filter(d=>!d.gizli);
    if (depolar.length === 0) h += `<span class="bosMetin" style="color:var(--kirmizi)">Bu tesiste depo yok.</span>`;
    else h += `<select class="girdi" style="width:220px" onchange="cikisDepoSec(this.value)">
        <option value="">Depo seçin</option>
        ${depolar.map(d => `<option value="${d.id}" ${ui.cikisDepoId===d.id?'selected':''}>${esc(d.ad)}</option>`).join('')}
      </select>`;
  }
  h += `</div></div>`;

  if (ui.cikisTesisId && ui.cikisDepoId) {
    const t = state.tesisler.find(x=>x.id===ui.cikisTesisId);
    const d = t?.depolar.find(x=>x.id===ui.cikisDepoId);
    if (d) {
      h += `<div class="kart"><div class="kartBaslik" style="margin-bottom:10px">2. Kullanılan miktarı girin</div>`;
      if ((d.urunler||[]).length === 0) h += `<div class="bosMetin">Bu depoda ürün yok.</div>`;
      else {
        h += `<div class="kalemBaslikSatir" style="padding-left:0"><span style="flex:2">Ürün</span><span style="width:110px">Mevcut</span><span style="width:130px">Kullanılan</span></div>`;
        d.urunler.forEach(u => {
          h += `<div class="stokUrunSatirTek">
            <span style="flex:2;color:var(--yazi)">${esc(u.ad)}</span>
            <span style="width:110px;color:var(--yazi-dim)">${esc(u.miktar)} ${esc(u.birim||'')}</span>
            <input class="parcaGirdi" style="width:130px;flex:none" type="number" min="0" placeholder="0" value="${esc(ui.cikisMiktarlar[u.id]||'')}" onchange="cikisMiktarGuncelle('${u.id}',this.value)" />
          </div>`;
        });
        h += `<button class="eklePrimer ty-btn" style="margin-top:14px" onclick="silOnayla('Malzeme Kullanımı', ()=>cikisUygula())">Stoktan Düş</button>`;
      }
      h += `</div>`;
    }
  }
  anaPanelYaz(h);
}

/* ---------------- depolar arası transfer ---------------- */
function transferGoster(){ if (!izinVar('transfer')) return; ui.view = "transfer"; render(); }
function transferTesisSec(tesisId){ ui.transferTesisId = tesisId; ui.transferDepoId = ""; ui.transferUrunAdi = ""; render(); }
function transferDepoSec(depoId){ ui.transferDepoId = depoId; ui.transferUrunAdi = ""; render(); }
function transferUrunSec(ad){ ui.transferUrunAdi = ad; }
function transferMiktarGuncelle(deger){ ui.transferMiktar = deger; }
function transferHedefTesisSec(tesisId){ ui.transferHedefTesisId = tesisId; ui.transferHedefDepoId = ""; render(); }
function transferHedefDepoSec(depoId){ ui.transferHedefDepoId = depoId; }

function transferGonder(){
  const kt = state.tesisler.find(x=>x.id===ui.transferTesisId);
  const kd = kt?.depolar.find(x=>x.id===ui.transferDepoId);
  const ht = state.tesisler.find(x=>x.id===ui.transferHedefTesisId);
  const hd = ht?.depolar.find(x=>x.id===ui.transferHedefDepoId);
  const miktar = parseFloat(ui.transferMiktar);
  if (!kd) { toastGoster("Lütfen kaynak depo seçin.", "hata"); return; }
  if (!ui.transferUrunAdi) { toastGoster("Lütfen bir ürün seçin.", "hata"); return; }
  if (!miktar || miktar <= 0) { toastGoster("Lütfen geçerli bir miktar girin.", "hata"); return; }
  if (!hd) { toastGoster("Lütfen hedef tesis ve depo seçin.", "hata"); return; }
  if (kt.id === ht.id && kd.id === hd.id) { toastGoster("Kaynak ve hedef depo aynı olamaz.", "hata"); return; }
  const urun = kd.urunler.find(u => u.ad.toLowerCase() === ui.transferUrunAdi.toLowerCase());
  if (!urun) { toastGoster("Seçilen ürün kaynak depoda bulunamadı.", "hata"); return; }
  const mevcutMiktar = parseFloat(urun.miktar) || 0;
  if (miktar > mevcutMiktar) { toastGoster("Depoda bu kadar stok yok.", "hata"); return; }
  urun.miktar = mevcutMiktar - miktar;
  const transfer = {
    id: uid(), kaynakTesisId: kt.id, kaynakTesisAdi: kt.ad, kaynakDepoId: kd.id, kaynakDepoAdi: kd.ad,
    urunAdi: urun.ad, birim: urun.birim || "", miktar,
    hedefTesisId: ht.id, hedefTesisAdi: ht.ad, hedefDepoId: hd.id, hedefDepoAdi: hd.ad,
    durum: "bekliyor", gonderenTarih: bugun(), gonderenSaat: suAn()
  };
  state.transferler.unshift(transfer);
  kaydetIslem(`Transfer gönderildi: ${urun.ad} (${miktar} ${urun.birim||''}) — ${kt.ad}/${kd.ad} → ${ht.ad}/${hd.ad}`, { view: "transfer", tesisId: kt.id });
  toastGoster("Transfer gönderildi.", "basari");
  ui.transferUrunAdi = ""; ui.transferMiktar = "";
  saveData(); render();
}
function transferKabulEt(transferId, hedefDepoId){
  const tr = state.transferler.find(x => x.id === transferId); if (!tr || tr.durum !== "bekliyor") return;
  const ht = state.tesisler.find(x => x.id === tr.hedefTesisId);
  const hd = ht?.depolar.find(x => x.id === (hedefDepoId || tr.hedefDepoId));
  if (!hd) { toastGoster("Lütfen bir depo seçin.", "hata"); return; }
  const mevcut = hd.urunler.find(u => u.ad.toLowerCase() === tr.urunAdi.toLowerCase());
  if (mevcut) mevcut.miktar = (parseFloat(mevcut.miktar)||0) + tr.miktar;
  else hd.urunler.push({ id: uid(), ad: tr.urunAdi, miktar: tr.miktar, birim: tr.birim, kritikTakip: false, kritikEsik: 0 });
  tr.durum = "kabul edildi"; tr.hedefDepoId = hd.id; tr.hedefDepoAdi = hd.ad; tr.kabulTarihi = bugun(); tr.kabulSaati = suAn();
  kaydetIslem(`Transfer kabul edildi: ${tr.urunAdi} (${tr.miktar} ${tr.birim||''}) — ${ht.ad}/${hd.ad}`, { view: "transfer", tesisId: ht.id });
  toastGoster("Transfer kabul edildi, stoğunuza eklendi.", "basari");
  saveData(); render();
}
function transferIptalEt(transferId){
  const tr = state.transferler.find(x => x.id === transferId); if (!tr || tr.durum !== "bekliyor") return;
  const kt = state.tesisler.find(x => x.id === tr.kaynakTesisId);
  const kd = kt?.depolar.find(x => x.id === tr.kaynakDepoId);
  if (kd) {
    const urun = kd.urunler.find(u => u.ad.toLowerCase() === tr.urunAdi.toLowerCase());
    if (urun) urun.miktar = (parseFloat(urun.miktar)||0) + tr.miktar;
    else kd.urunler.push({ id: uid(), ad: tr.urunAdi, miktar: tr.miktar, birim: tr.birim, kritikTakip:false, kritikEsik:0 });
  }
  tr.durum = "iptal edildi";
  kaydetIslem(`Transfer iptal edildi: ${tr.urunAdi} (${tr.miktar} ${tr.birim||''})`, { view: "transfer", tesisId: tr.kaynakTesisId });
  toastGoster("Transfer iptal edildi, stok kaynak depoya geri eklendi.", "basari");
  saveData(); render();
}
function bekleyenTransferSayisi(){
  if (!izinVar('transfer') || !state.transferler) return 0;
  const erisilenIdler = erisilenTesisler().map(t=>t.id);
  return state.transferler.filter(tr => tr.durum === "bekliyor" && (adminMi() || erisilenIdler.includes(tr.hedefTesisId))).length;
}
function renderTransfer(){
  const erisilenIdler = erisilenTesisler().map(t=>t.id);
  let h = `<div class="pompaBaslikSatir" style="margin-bottom:4px">
    <div>
      <div class="pompaAdBaslik">Transfer Et</div>
      <div class="altBaslik2">depolar arası malzeme transferi gönderin ve gelen transferleri kabul edin</div>
    </div>
  </div>`;

  const gelenler = (state.transferler||[]).filter(tr => tr.durum === "bekliyor" && (adminMi() || erisilenIdler.includes(tr.hedefTesisId)));
  if (gelenler.length > 0) {
    h += `<div class="kart" style="border-color:rgba(var(--vurgu-rgb),0.4)">
      <div class="kartBaslik" style="margin-bottom:10px;color:var(--vurgu)">📥 Gelen Transferler (${gelenler.length})</div>`;
    gelenler.forEach(tr => {
      const ht = state.tesisler.find(x=>x.id===tr.hedefTesisId);
      const depolar = (ht?.depolar||[]).filter(d=>!d.gizli);
      h += `<div class="ayarSatiri" style="flex-direction:column;align-items:stretch;gap:8px;border-left:3px solid var(--vurgu);padding-left:11px">
        <div>
          <div style="color:var(--yazi);font-size:13.5px;font-weight:600">${esc(tr.urunAdi)} — ${esc(tr.miktar)} ${esc(tr.birim||'')}</div>
          <div style="color:var(--yazi-soluk);font-size:12px">${esc(tr.kaynakTesisAdi)} / ${esc(tr.kaynakDepoAdi)} → ${esc(tr.hedefTesisAdi)} · ${esc(tr.gonderenTarih)} ${esc(tr.gonderenSaat)}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="girdi" style="width:200px" id="transferHedefDepo_${tr.id}">
            ${depolar.length===0 ? `<option value="">Depo yok</option>` : depolar.map(d=>`<option value="${d.id}" ${d.id===tr.hedefDepoId?'selected':''}>${esc(d.ad)}</option>`).join('')}
          </select>
          <button class="eklePrimer ty-btn" ${depolar.length===0?'disabled':''} onclick="transferKabulEt('${tr.id}', document.getElementById('transferHedefDepo_${tr.id}').value)">Kabul Et</button>
        </div>
      </div>`;
    });
    h += `</div>`;
  }

  h += `<div class="kart">
    <div class="kartBaslik" style="margin-bottom:12px">Yeni Transfer Gönder</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <select class="girdi" style="width:190px" onchange="transferTesisSec(this.value)">
          <option value="">Kaynak tesis</option>
          ${erisilenTesisler().map(t=>`<option value="${t.id}" ${ui.transferTesisId===t.id?'selected':''}>${esc(t.ad)}</option>`).join('')}
        </select>`;
  let kaynakDepo = null, kaynakUrunler = [];
  if (ui.transferTesisId) {
    const t = state.tesisler.find(x=>x.id===ui.transferTesisId);
    const depolar = (t?.depolar||[]).filter(d=>!d.gizli);
    h += `<select class="girdi" style="width:190px" onchange="transferDepoSec(this.value)">
      <option value="">Kaynak depo</option>
      ${depolar.map(d=>`<option value="${d.id}" ${ui.transferDepoId===d.id?'selected':''}>${esc(d.ad)}</option>`).join('')}
    </select>`;
    kaynakDepo = depolar.find(d=>d.id===ui.transferDepoId);
    kaynakUrunler = kaynakDepo ? kaynakDepo.urunler||[] : [];
  }
  if (kaynakDepo) {
    h += `<select class="girdi" style="width:190px" onchange="transferUrunSec(this.value)">
      <option value="">Ürün seçin</option>
      ${kaynakUrunler.map(u=>`<option value="${esc(u.ad)}" ${ui.transferUrunAdi===u.ad?'selected':''}>${esc(u.ad)} (${esc(u.miktar)} ${esc(u.birim||'')})</option>`).join('')}
    </select>
    <input class="girdi" style="width:110px" type="number" min="0" placeholder="Miktar" value="${esc(ui.transferMiktar)}" onchange="transferMiktarGuncelle(this.value)" />`;
  }
  h += `</div>`;

  h += `<div style="display:flex;gap:10px;flex-wrap:wrap">
    <select class="girdi" style="width:190px" onchange="transferHedefTesisSec(this.value)">
      <option value="">Hedef tesis</option>
      ${state.tesisler.filter(t=>!t.gizli).map(t=>`<option value="${t.id}" ${ui.transferHedefTesisId===t.id?'selected':''}>${esc(t.ad)}</option>`).join('')}
    </select>`;
  if (ui.transferHedefTesisId) {
    const ht = state.tesisler.find(x=>x.id===ui.transferHedefTesisId);
    const hdepolar = (ht?.depolar||[]).filter(d=>!d.gizli);
    h += `<select class="girdi" style="width:190px" onchange="transferHedefDepoSec(this.value)">
      <option value="">Hedef depo</option>
      ${hdepolar.length===0 ? '' : hdepolar.map(d=>`<option value="${d.id}" ${ui.transferHedefDepoId===d.id?'selected':''}>${esc(d.ad)}</option>`).join('')}
    </select>`;
    if (hdepolar.length===0) h += `<span class="bosMetin" style="color:var(--kirmizi)">Bu tesiste depo yok.</span>`;
  }
  h += `</div>
      <button class="eklePrimer ty-btn" style="align-self:flex-start" onclick="transferGonder()">Transfer Gönder</button>
    </div>
  </div>`;

  const gecmis = (state.transferler||[]).filter(tr => tr.durum !== "bekliyor" || (tr.durum==="bekliyor" && erisilenIdler.includes(tr.kaynakTesisId)))
    .filter(tr => adminMi() || erisilenIdler.includes(tr.kaynakTesisId) || erisilenIdler.includes(tr.hedefTesisId))
    .slice(0, 30);
  if (gecmis.length > 0) {
    h += `<div class="kart">
      <div class="kartBaslik" style="margin-bottom:10px">Transfer Geçmişi</div>`;
    gecmis.forEach(tr => {
      const renk = tr.durum==='kabul edildi' ? 'var(--yesil)' : tr.durum==='iptal edildi' ? 'var(--kirmizi)' : 'var(--vurgu)';
      h += `<div class="ayarSatiri" style="border-left:3px solid ${renk};padding-left:11px">
        <span style="flex:1">
          <div style="color:var(--yazi);font-size:13px">${esc(tr.urunAdi)} — ${esc(tr.miktar)} ${esc(tr.birim||'')}</div>
          <div style="color:var(--yazi-soluk);font-size:11.5px">${esc(tr.kaynakTesisAdi)}/${esc(tr.kaynakDepoAdi)} → ${esc(tr.hedefTesisAdi)}${tr.hedefDepoAdi?('/'+esc(tr.hedefDepoAdi)):''}</div>
        </span>
        <span style="color:${renk};font-size:11.5px;font-weight:600;text-transform:capitalize">${esc(tr.durum)}</span>
        ${tr.durum==='bekliyor' && erisilenIdler.includes(tr.kaynakTesisId) ? `<span class="silIkon" style="margin-left:8px" onclick="silOnayla('Transferi İptal Et', ()=>transferIptalEt('${tr.id}'))" title="İptal et">×</span>` : ''}
      </div>`;
    });
    h += `</div>`;
  }

  anaPanelYaz(h);
}
