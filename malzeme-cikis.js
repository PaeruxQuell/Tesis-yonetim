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
    kullanilanlar.push(`${u.ad}${u.kod?` (${u.kod})`:''} (${dusulecek} ${u.birim||''})`);
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
            <span style="flex:2;color:var(--yazi)">${esc(u.ad)}${u.kod?` <span style="color:var(--yazi-soluk);font-family:'JetBrains Mono',monospace;font-size:11.5px">(${esc(u.kod)})</span>`:''}</span>
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

