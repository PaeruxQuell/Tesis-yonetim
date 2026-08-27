function parcaEkle(){
  const { t, m, p } = pompaBul(); p.parcalar.push({ id: uid(), ad: "", malzeme: "", adet: 1 });
  kaydetIslem(`Parça eklendi: ${p.ad} (${t.ad} / ${m.ad})`, { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id });
  saveData(); render();
}
function gecmisMalzemeyiParcayaEkle(gecmisId, malzemeId){
  const { t, m, p } = pompaBul();
  const g = p.gecmis.find(x => x.id === gecmisId); if (!g) return;
  const x = (g.malzemeler||[]).find(y => y.id === malzemeId); if (!x) return;
  p.parcalar.push({ id: uid(), ad: x.ad, malzeme: x.kod || "", adet: x.adet || 1 });
  malzemeGecmisineEkle(x.ad, x.birim, x.kod);
  kaydetIslem(`Geçmişten parçaya eklendi: ${x.ad} (${p.ad} — ${t.ad} / ${m.ad})`, { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id });
  toastGoster(`"${x.ad}" Parçalar listesine eklendi.`, "basari");
  saveData(); render();
}
function parcaGuncelle(parcaId, alan, deger){
  const { p } = pompaBul(); const pr = p.parcalar.find(x => x.id === parcaId); if (pr) pr[alan] = deger;
  if (alan === "ad") malzemeGecmisineEkle(deger);
  saveData(); render();
}
function parcaSil(parcaId){
  const { t, m, p } = pompaBul();
  const pr = p.parcalar.find(x => x.id === parcaId);
  if (pr) copeAt("parca", pr, { tesisId: t.id, makineId: m.id, pompaId: p.id });
  p.parcalar = p.parcalar.filter(x => x.id !== parcaId);
  if (pr) kaydetIslem(`Parça silindi: ${pr.ad || '(isimsiz)'} (${p.ad} — ${t.ad} / ${m.ad})`, { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id });
  saveData(); render();
}
function gecmisEkle(){
  const { t, m, p } = pompaBul(); p.gecmis.unshift({ id: uid(), tarih: bugun(), aciklama: "" });
  kaydetIslem(`Geçmiş kaydı eklendi: ${p.ad} (${t.ad} / ${m.ad})`, { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id });
  saveData(); render();
}
function gecmisGuncelle(girdiId, alan, deger){
  const { p } = pompaBul(); const g = p.gecmis.find(x => x.id === girdiId); if (g) g[alan] = deger;
  saveData(); render();
}
function gecmisSil(girdiId){
  const { t, m, p } = pompaBul();
  p.gecmis = p.gecmis.filter(x => x.id !== girdiId);
  kaydetIslem(`Geçmiş kaydı silindi: ${p.ad} (${t.ad} / ${m.ad})`, { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id });
  saveData(); render();
}
function gecmisAcKapat(id){ ui.acikGecmis.has(id) ? ui.acikGecmis.delete(id) : ui.acikGecmis.add(id); render(); }
function gecmisMalzemeEkle(gecmisId){
  const { p } = pompaBul(); const g = p.gecmis.find(x => x.id === gecmisId); if (!g) return;
  if (!g.malzemeler) g.malzemeler = [];
  g.malzemeler.push({ id: uid(), ad: "", kod: "", adet: 1, birim: "adet" });
  saveData(); render();
}
function gecmisMalzemeGuncelle(gecmisId, malzemeId, alan, deger){
  const { p } = pompaBul(); const g = p.gecmis.find(x => x.id === gecmisId); if (!g) return;
  const m = g.malzemeler.find(x => x.id === malzemeId); if (m) m[alan] = deger;
  if (alan === "ad") malzemeGecmisineEkle(deger, m?.birim, m?.kod);
  else if (alan === "kod" && m?.ad) malzemeGecmisineEkle(m.ad, m.birim, deger);
  saveData(); render();
}
function gecmisMalzemeSil(gecmisId, malzemeId){
  const { p } = pompaBul(); const g = p.gecmis.find(x => x.id === gecmisId); if (!g) return;
  g.malzemeler = g.malzemeler.filter(x => x.id !== malzemeId);
  saveData(); render();
}

function renderPompa(){
    const { t, m, p } = pompaBul();
    if (!p) { ui.view = "bos"; renderAna(); return; }
    let h = `<div class="yolIzi">${esc(t.ad)} <span style="opacity:.4">/</span> ${esc(m.ad)} <span style="opacity:.4">/</span> <span style="color:var(--vurgu)">${esc(p.ad)}</span></div>`;
    h += `<div class="pompaBaslikSatir">`;
    h += ui.duzenle
      ? `<input class="pompaAdInput" value="${esc(p.ad)}" onchange="pompaAdGuncelle(this.value)" />`
      : `<div class="pompaAdBaslik">${esc(p.ad)}</div>`;
    h += `<button class="${ui.duzenle?'duzenleBtnAktif':'duzenleBtn'} ty-btn" onclick="duzenleAcKapat()">${ui.duzenle?'Düzenlemeyi bitir':'Düzenle'}</button>`;
    h += `</div>`;

    h += `<div class="kart"><div class="kartBaslikSatir"><span class="kartBaslik">Parçalar ve malzemeler</span>${ui.duzenle?'<button class="ekleMini ty-btn" onclick="parcaEkle()">+ parça ekle</button>':''}</div>`;
    if (p.parcalar.length === 0) h += `<div class="bosMetin">Henüz parça eklenmedi.</div>`;
    p.parcalar.forEach(pr => {
      h += `<div class="parcaSatir">`;
      if (ui.duzenle) {
        h += `<input class="parcaGirdi" list="malzemeListesi" placeholder="Parça adı" value="${esc(pr.ad)}" onchange="parcaGuncelle('${pr.id}','ad',this.value)" />`;
        h += `<input class="parcaGirdi" placeholder="Malzeme" value="${esc(pr.malzeme)}" onchange="parcaGuncelle('${pr.id}','malzeme',this.value)" />`;
        h += `<input class="parcaGirdi" style="width:70px;flex:none" type="number" placeholder="Adet" value="${esc(pr.adet)}" onchange="parcaGuncelle('${pr.id}','adet',this.value)" />`;
        h += `<span class="silIkon" onclick="silOnayla('Parçayı Sil', ()=>parcaSil('${pr.id}'))">×</span>`;
      } else {
        h += `<span style="flex:1;color:var(--yazi)">${esc(pr.ad) || '(isimsiz)'}</span>`;
        h += `<span style="flex:1;color:var(--yazi-dim)">${esc(pr.malzeme) || '—'}</span>`;
        h += `<span style="width:70px;color:var(--yazi-dim);font-family:'JetBrains Mono',monospace">× ${esc(pr.adet)}</span>`;
      }
      h += `</div>`;
    });
    h += `</div>`;

    h += `<div class="kart"><div class="kartBaslikSatir"><span class="kartBaslik">İşlem geçmişi</span>${ui.duzenle?'<button class="ekleMini ty-btn" onclick="gecmisEkle()">+ kayıt ekle</button>':''}</div>`;
    p.gecmis.forEach(g => {
      const malzemeVar = g.malzemeler && g.malzemeler.length > 0;
      const acik = ui.acikGecmis.has(g.id);
      if (ui.duzenle) {
        h += `<div class="gecmisSatir" style="flex-direction:column;align-items:stretch;gap:8px">
          <div style="display:flex;gap:12px;align-items:center">
            <input class="gecmisTarih" placeholder="gg.aa.yyyy" value="${esc(g.tarih)}" onchange="gecmisGuncelle('${g.id}','tarih',this.value)" />
            <input class="gecmisMetin" placeholder="Yapılan işin içeriği" value="${esc(g.aciklama)}" onchange="gecmisGuncelle('${g.id}','aciklama',this.value)" />
            <span class="silIkon" onclick="silOnayla('Kaydı Sil', ()=>gecmisSil('${g.id}'))">×</span>
          </div>
          <div style="margin-left:112px;padding:10px 12px;background:var(--bg);border:1px solid var(--sinir);border-radius:8px">
            <div class="kartBaslikSatir" style="margin-bottom:${(g.malzemeler&&g.malzemeler.length)?'8px':'0'}">
              <span class="kartBaslik" style="font-size:11px">Kullanılan malzemeler</span>
              <button class="ekleMini ty-btn" onclick="gecmisMalzemeEkle('${g.id}')">+ malzeme ekle</button>
            </div>
            ${(g.malzemeler || []).map(x => `
              <div class="parcaSatir" style="border-top:1px solid var(--sinir-soluk)">
                <input class="parcaGirdi" style="flex:1.4" list="malzemeListesi" placeholder="Malzeme adı" value="${esc(x.ad)}" onchange="gecmisMalzemeGuncelle('${g.id}','${x.id}','ad',this.value)" />
                <input class="parcaGirdi" style="width:110px;flex:none" list="kodListesi-${x.id}" placeholder="Kod" value="${esc(x.kod)}" onchange="gecmisMalzemeGuncelle('${g.id}','${x.id}','kod',this.value)" />
                <datalist id="kodListesi-${x.id}">${urunKodlariGetir(x.ad).map(kd => `<option value="${esc(kd)}"></option>`).join('')}</datalist>
                <input class="parcaGirdi" style="width:70px;flex:none" type="number" placeholder="Adet" value="${esc(x.adet)}" onchange="gecmisMalzemeGuncelle('${g.id}','${x.id}','adet',this.value)" />
                <select class="parcaGirdi" style="width:95px;flex:none" onchange="gecmisMalzemeGuncelle('${g.id}','${x.id}','birim',this.value)">
                  ${["adet","koli","tane","kg","litre","metre","milimetre"].map(b => `<option value="${b}" ${(x.birim||'adet')===b?'selected':''}>${b}</option>`).join('')}
                </select>
                <span class="silIkon" onclick="silOnayla('Malzemeyi Sil', ()=>gecmisMalzemeSil('${g.id}','${x.id}'))">×</span>
              </div>`).join('')}
          </div>
        </div>`;
      } else {
        const gecmisRenk = malzemeVar ? "var(--vurgu)" : "var(--mavi)";
        const gecmisRenkRgb = malzemeVar ? "var(--vurgu-rgb)" : "var(--mavi-rgb)";
        h += `<div class="gecmisKayit" style="border-left:3px solid ${gecmisRenk};background:rgba(${gecmisRenkRgb},0.05);padding-left:11px">
          <div class="gecmisUstSatir">
            <span class="gecmisTarihGoster" style="color:${gecmisRenk}">${esc(g.tarih)}</span>
            <span style="flex:1;color:var(--yazi-ikincil)">${esc(g.aciklama) || '—'}</span>
            ${malzemeVar ? `<span class="gecmisAcButonu ty-btn" title="Kullanılan malzemeleri göster" onclick="gecmisAcKapat('${g.id}')"><span class="okBuyuk" style="transform:${acik?'rotate(90deg)':'none'}">›</span></span>` : ''}
          </div>`;
        if (acik && malzemeVar) {
          h += `<div class="gecmisMalzemeListesi">
            <div class="kartBaslik" style="margin-bottom:8px">Kullanılan malzemeler</div>
            ${g.malzemeler.map(x => `<div class="gecmisMalzemeSatir"><span>${esc(x.ad)}${x.kod?` <span style="color:var(--yazi-soluk)">(${esc(x.kod)})</span>`:''}</span><span style="display:flex;align-items:center;gap:8px"><span style="font-family:'JetBrains Mono',monospace;color:var(--yazi-dim)">× ${esc(x.adet)} ${esc(x.birim||'adet')}</span><span class="parcayaEkleBtn ty-btn" title="Bu malzemeyi yukarıdaki Parçalar listesine ekle" onclick="gecmisMalzemeyiParcayaEkle('${g.id}','${x.id}')">↑ Parçalara ekle</span></span></div>`).join('')}
          </div>`;
        }
        h += `</div>`;
      }
    });
    h += `</div>`;
    anaPanelYaz(h);
    return;
}
