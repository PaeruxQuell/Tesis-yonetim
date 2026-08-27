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
  if (d) copeAt("depo", d, { tesisId });
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
  d.urunler.push({ id: uid(), ad: "", kod: "", miktar: 0, birim: "", kritikTakip: false, kritikEsik: 0 });
  kaydetIslem(`Stok ürünü eklendi: ${d.ad} (${t.ad})`, { view: "stok", tesisId: t.id, depoId: d.id });
  saveData(); render();
}
function stokUrunSil(tesisId, depoId, urunId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const d = t.depolar.find(x => x.id === depoId);
  const u = d.urunler.find(x => x.id === urunId);
  if (u) copeAt("stokUrun", u, { tesisId, depoId });
  d.urunler = d.urunler.filter(x => x.id !== urunId);
  if (u) kaydetIslem(`Stok ürünü silindi: ${u.ad || '(isimsiz)'} (${d.ad} — ${t.ad})`, { view: "stok", tesisId: t.id, depoId: d.id });
  saveData(); render();
}
function stokUrunGuncelle(tesisId, depoId, urunId, alan, deger){
  const { t, d, u } = stokUrunBul(tesisId, depoId, urunId); if (u) u[alan] = deger;
  if (alan === "ad") {
    malzemeGecmisineEkle(deger, "", u?.kod);
    // Aynı depoda AYNI isimde başka bir ürün zaten varsa uyar — stok yanlışlıkla
    // iki ayrı satıra bölünmesin diye (elle eklerken bu kontrol yoktu).
    const temiz = (deger || "").trim().toLowerCase();
    if (temiz && d) {
      const cakisan = d.urunler.find(x => x.id !== urunId && (x.ad||"").trim().toLowerCase() === temiz);
      if (cakisan) toastGoster(`Dikkat: "${deger}" adında bir ürün bu depoda zaten var — stoğunuz iki ayrı satıra bölünmüş olabilir.`, "hata");
    }
  } else if (alan === "kod" && u?.ad) {
    malzemeGecmisineEkle(u.ad, "", deger);
  }
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
        sonuc.push({ satId: sat.id, kalemId: k.id, urun: k.urun, kod: k.kod || "", miktar: k.miktar, birim: k.birim });
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
  if (alan === "urun") malzemeGecmisineEkle(deger, "", k?.kod);
  else if (alan === "kod" && k?.urun) malzemeGecmisineEkle(k.urun, "", deger);
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
    const mevcut = depo.urunler.find(u => urunEslesiyorMu(u, adTemiz, k.kod));
    const miktar = parseFloat(k.miktar) || 0;
    if (mevcut) { mevcut.miktar = (parseFloat(mevcut.miktar) || 0) + miktar; if (k.kod && !mevcut.kod) mevcut.kod = k.kod; }
    else { depo.urunler.push({ id: uid(), ad: adTemiz, kod: k.kod || "", miktar, birim: k.birim || "", kritikTakip: false, kritikEsik: 0 }); }
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
    const siraliListeDizi = siraliTesisler();
    siraliListeDizi.forEach((t, i) => {
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
          <span style="display:flex;gap:2px;margin-left:auto" onclick="event.stopPropagation()">
            <button class="ty-btn siraOkBtn" ${i===0?'disabled':''} onclick="tesisYukariTasi('${t.id}')" title="Yukarı taşı">▲</button>
            <button class="ty-btn siraOkBtn" ${i===siraliListeDizi.length-1?'disabled':''} onclick="tesisAsagiTasi('${t.id}')" title="Aşağı taşı">▼</button>
          </span>
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
              <span style="width:26px"></span><span style="flex:2">Ürün</span><span style="width:100px">Kod</span><span style="width:80px">Miktar</span><span style="width:120px">Birim</span>
            </div>`;
            bekleyenler.forEach(b => {
              const anahtar = b.satId + "|" + b.kalemId;
              const secili = secim.has(anahtar);
              h += `<div class="kalemSatir" style="padding-left:0">
                <input type="checkbox" class="bekleyenCheck" ${secili?'checked':''} onchange="stokBekleyenSecToggle('${t.id}','${b.satId}','${b.kalemId}')" />
                <input class="parcaGirdi" style="flex:2" value="${esc(b.urun)}" onchange="stokBekleyenAlanGuncelle('${b.satId}','${b.kalemId}','urun',this.value)" />
                <input class="parcaGirdi" style="width:100px;flex:none;font-family:'JetBrains Mono',monospace" list="kodListesi-bek-${b.kalemId}" value="${esc(b.kod)}" onchange="stokBekleyenAlanGuncelle('${b.satId}','${b.kalemId}','kod',this.value)" />
                <datalist id="kodListesi-bek-${b.kalemId}">${urunKodlariGetir(b.urun).map(kd => `<option value="${esc(kd)}"></option>`).join('')}</datalist>
                <input class="parcaGirdi" style="width:80px;flex:none" value="${esc(b.miktar)}" onchange="stokBekleyenAlanGuncelle('${b.satId}','${b.kalemId}','miktar',this.value)" />
                <select class="parcaGirdi" style="width:120px;flex:none" onchange="stokBekleyenAlanGuncelle('${b.satId}','${b.kalemId}','birim',this.value)">
                  ${["adet","koli","tane","kg","litre"].map(bi => `<option value="${bi}" ${(b.birim||'adet')===bi?'selected':''}>${bi}</option>`).join('')}
                </select>
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
            h += `<div class="acilirIcerik" style="padding:12px 14px 16px 26px;margin-left:20px;border-left:2px solid var(--sinir2);background:var(--bg)">`;
            if ((d.urunler || []).length === 0) h += `<div class="bosMetin">Henüz ürün eklenmedi.</div>`;
            else h += `<div class="kalemBaslikSatir" style="padding-left:0">
              <span style="flex:1.6">Ürün</span><span style="width:90px">Kod</span><span style="width:55px">Miktar</span><span style="width:90px">Birim</span>
              <span style="width:75px">Kritik Eşik</span><span style="width:135px">Kritik</span>
            </div>`;
            (d.urunler || []).forEach(u => {
              const kritikRenk = u.kritikTakip && (parseFloat(u.miktar)||0) <= (parseFloat(u.kritikEsik)||0);
              const eksiMi = (parseFloat(u.miktar)||0) < 0;
              const miktarFlashSinif = miktarDegisimSinifi(u.id, u.miktar);
              h += `<div class="stokUrunSatirTek ${eksiMi?'stokEksiSatir':''}">
                ${ui.stokDuzenle ? `
                  <span style="flex:1.6;display:flex;align-items:center;gap:6px">
                    ${eksiMi?'<span class="stokEksiRozet" title="Bu ürün depoya kayıtlı değilken raporda kullanıldığı için eksi bakiyeyle otomatik eklendi. Gerçek stok miktarını girip düzeltin.">⚠ EKSİ STOK</span>':''}
                    <input class="parcaGirdi" style="flex:1" list="malzemeListesi" placeholder="Ürün adı" value="${esc(u.ad)}" onchange="stokUrunGuncelle('${t.id}','${d.id}','${u.id}','ad',this.value)" />
                  </span>
                  <input class="parcaGirdi" style="width:90px;flex:none;font-family:'JetBrains Mono',monospace" list="kodListesi-${u.id}" placeholder="Kod" value="${esc(u.kod)}" onchange="stokUrunGuncelle('${t.id}','${d.id}','${u.id}','kod',this.value)" />
                  <datalist id="kodListesi-${u.id}">${urunKodlariGetir(u.ad).map(kd => `<option value="${esc(kd)}"></option>`).join('')}</datalist>
                  <input class="parcaGirdi ${kritikRenk?'stokKritikGirdi':''} ${eksiMi?'stokEksiGirdi':''} ${miktarFlashSinif}" style="width:55px;flex:none" type="number" max="9999" maxlength="4" value="${esc(u.miktar)}" onchange="this.value=this.value.slice(0,4); stokUrunGuncelle('${t.id}','${d.id}','${u.id}','miktar',this.value)" />
                  <select class="parcaGirdi" style="width:90px;flex:none" onchange="stokUrunGuncelle('${t.id}','${d.id}','${u.id}','birim',this.value)">
                    ${["adet","koli","tane","kg","litre"].map(b => `<option value="${b}" ${(u.birim||'adet')===b?'selected':''}>${b}</option>`).join('')}
                  </select>
                  <input class="parcaGirdi" style="width:75px;flex:none" type="number" value="${esc(u.kritikEsik)}" onchange="stokUrunGuncelle('${t.id}','${d.id}','${u.id}','kritikEsik',this.value)" />
                  <button class="ty-btn kritikToggleBtn ${u.kritikTakip?'kritikToggleAktif':''}" style="width:135px;flex:none" onclick="stokKritikDegistir('${t.id}','${d.id}','${u.id}')">${u.kritikTakip?'● İzleniyor':'Kritik işaretle'}</button>
                  ${adminMi() ? `<span class="silIkon" onclick="silOnayla('Ürünü Sil', ()=>stokUrunSil('${t.id}','${d.id}','${u.id}'))">×</span>` : ''}
                ` : `
                  <span style="flex:1.6;color:var(--yazi);display:flex;align-items:center;gap:6px">${eksiMi?'<span class="stokEksiRozet" title="Bu ürün depoya kayıtlı değilken raporda kullanıldığı için eksi bakiyeyle otomatik eklendi. Gerçek stok miktarını girip düzeltin.">⚠ EKSİ STOK</span>':''}${esc(u.ad) || '—'}</span>
                  <span style="width:90px;color:var(--yazi-dim);font-family:'JetBrains Mono',monospace;font-size:11.5px">${esc(u.kod) || '—'}</span>
                  <span class="${miktarFlashSinif}" style="width:55px;color:${eksiMi?'var(--kirmizi-yazi)':(kritikRenk?'var(--kirmizi-yazi)':'var(--yazi-dim)')};font-weight:${(eksiMi||kritikRenk)?'800':'400'};border-radius:4px;display:inline-block">${eksiMi?'⚠ ':''}${esc(u.miktar)}</span>
                  <span style="width:90px;color:var(--yazi-dim)">${esc(u.birim) || '—'}</span>
                  <span style="width:75px;color:var(--yazi-dim)">${esc(u.kritikEsik)}</span>
                  <span style="width:135px;color:${u.kritikTakip?'var(--kirmizi)':'var(--yazi-soluk)'};font-size:11.5px">${u.kritikTakip?'● İzleniyor':'—'}</span>
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

