function pompaBul(){
  const t = state.tesisler.find(x => x.id === ui.secim.tesisId);
  const m = t?.makineler.find(x => x.id === ui.secim.makineId);
  const p = m?.pompalar.find(x => x.id === ui.secim.pompaId);
  return { t, m, p };
}
function tesisEkle(){
  if (!adminMi()) return;
  const yeni = { id: uid(), ad: "Yeni Tesis", makineler: [] };
  state.tesisler.push(yeni); ui.acikTesis.add(yeni.id);
  kaydetIslem(`Yeni tesis eklendi: ${yeni.ad}`, { view: "anasayfa", tesisId: yeni.id });
  saveData(); render();
}
function tesisSil(tesisId){
  const t = state.tesisler.find(x => x.id === tesisId);
  state.tesisler = state.tesisler.filter(t => t.id !== tesisId);
  if (ui.secim.tesisId === tesisId) { ui.secim = {}; ui.view = "bos"; }
  if (t) kaydetIslem(`Tesis silindi: ${t.ad}`, { view: "anasayfa", tesisId: t.id });
  saveData(); render();
}
function tesisAdGuncelle(tesisId, ad){
  const t = state.tesisler.find(x => x.id === tesisId); if (t) t.ad = ad;
  saveData(); render();
}
function makineEkle(tesisId){
  if (!adminMi()) return;
  const t = state.tesisler.find(x => x.id === tesisId);
  const yeni = { id: uid(), ad: "Yeni Makine", pompalar: [], bakimlar: [] };
  t.makineler.push(yeni); ui.acikMakine.add(yeni.id);
  kaydetIslem(`Yeni makine eklendi: ${yeni.ad} (${t.ad})`, { view: "anasayfa", tesisId: t.id });
  saveData(); render();
}
function makineSil(tesisId, makineId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  t.makineler = t.makineler.filter(m => m.id !== makineId);
  if (ui.secim.makineId === makineId) { ui.secim = {}; ui.view = "bos"; }
  if (m) kaydetIslem(`Makine silindi: ${m.ad} (${t.ad})`, { view: "anasayfa", tesisId: t.id });
  saveData(); render();
}
function makineAdGuncelle(tesisId, makineId, ad){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId); if (m) m.ad = ad;
  saveData(); render();
}
function pompaEkle(tesisId, makineId){
  if (!adminMi()) return;
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const yeni = ornekPompa(`${m.pompalar.length+1}. Pompa`);
  m.pompalar.push(yeni);
  kaydetIslem(`Yeni pompa eklendi: ${yeni.ad} (${t.ad} / ${m.ad})`, { view: "pompa", tesisId, makineId, pompaId: yeni.id });
  saveData(); render();
}
function pompaSil(tesisId, makineId, pompaId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const p = m.pompalar.find(x => x.id === pompaId);
  m.pompalar = m.pompalar.filter(p => p.id !== pompaId);
  if (ui.secim.pompaId === pompaId) { ui.secim = {}; ui.view = "bos"; }
  if (p) kaydetIslem(`Pompa silindi: ${p.ad} (${t.ad} / ${m.ad})`, { view: "anasayfa", tesisId: t.id, makineId: m.id });
  saveData(); render();
}
function pompaAdGuncelle(ad){
  const { p } = pompaBul(); if (p) p.ad = ad; saveData(); render();
}
function pompaSec(tesisId, makineId, pompaId){
  ui.secim = { tesisId, makineId, pompaId }; ui.view = "pompa"; ui.duzenle = false;
  ui.acikTesis.add(tesisId); if (makineId) ui.acikMakine.add(makineId);
  if (mobilMi()) mobilMenuleriKapat();
  render();
}
function acikTesisToggle(id){ ui.acikTesis.has(id) ? ui.acikTesis.delete(id) : ui.acikTesis.add(id); render(); }
function acikMakineToggle(id){ ui.acikMakine.has(id) ? ui.acikMakine.delete(id) : ui.acikMakine.add(id); render(); }
function duzenleAcKapat(){ ui.duzenle = !ui.duzenle; render(); }

function duzenlemeBaslat(id){ ui.duzenlenenId = id; render(); }
function duzenlemeIptal(){ ui.duzenlenenId = null; render(); }
function tesisAdKaydet(inputEl, tesisId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const eski = t ? t.ad : "";
  if (t && inputEl.value.trim()) t.ad = inputEl.value.trim();
  if (t && eski !== t.ad) kaydetIslem(`Tesis adı değiştirildi: ${eski} → ${t.ad}`, { view: "anasayfa", tesisId: t.id });
  ui.duzenlenenId = null; saveData(); render();
}
function makineAdKaydet(inputEl, tesisId, makineId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const eski = m ? m.ad : "";
  if (m && inputEl.value.trim()) m.ad = inputEl.value.trim();
  if (m && eski !== m.ad) kaydetIslem(`Makine adı değiştirildi: ${eski} → ${m.ad} (${t.ad})`, { view: "anasayfa", tesisId: t.id, makineId: m.id });
  ui.duzenlenenId = null; saveData(); render();
}
function pompaAdKaydetSol(inputEl, tesisId, makineId, pompaId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const p = m.pompalar.find(x => x.id === pompaId);
  const eski = p ? p.ad : "";
  if (p && inputEl.value.trim()) p.ad = inputEl.value.trim();
  if (p && eski !== p.ad) kaydetIslem(`Pompa adı değiştirildi: ${eski} → ${p.ad} (${t.ad} / ${m.ad})`, { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id });
  ui.duzenlenenId = null; saveData(); render();
}
function enterIleKaydet(e){ if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { ui.duzenlenenId = null; render(); } }

function renderUstNav(){
  const el = document.getElementById("ustNav");
  if (!el) return;
  const ikon = (svgAd, renkVar) => `<span class="navIkon" style="background:rgba(var(--${renkVar}-rgb),.16);color:var(--${renkVar})">${svgIkon(svgAd)}</span>`;
  let h = `
    <div class="ustNavBtn ${ui.view==='anasayfa'?'ustNavBtnAktif':''} ty-btn" onclick="anaSayfaGoster()">${ikon('home','mavi')} Ana Sayfa</div>`;
  if (izinVar('stokListesi')) h += `
    <div class="ustNavBtn ${ui.view==='stok'?'ustNavBtnAktif':''} ty-btn" onclick="stokGoster()">${ikon('box','yesil')} Stok Listesi</div>`;
  if (izinVar('satinAlmalar')) h += `
    <div class="ustNavBtn ${(ui.view==='satinalma'||ui.view==='satinalma-detay')?'ustNavBtnAktif':''} ty-btn" onclick="satinAlmaGoster()">${ikon('cart','mor')} Satın Almalar
      ${saTumKalemler().some(k=>k.durum==='Gelmedi') ? `<span class="rozet">${saTumKalemler().filter(k=>k.durum==='Gelmedi').length}</span>` : ''}
    </div>`;
  if (izinVar('periyodikBakim')) h += `
    <div class="ustNavBtn ${ui.view==='bakim'?'ustNavBtnAktif':''} ty-btn" onclick="bakimGoster()">${ikon('wrench','kirmizi')} Periyodik Bakım
      ${bakimUyariSayisi() > 0 ? `<span class="rozet">${bakimUyariSayisi()}</span>` : ''}
    </div>`;
  if (izinVar('malzemeCikis')) h += `
    <div class="ustNavBtn ${ui.view==='malzemecikis'?'ustNavBtnAktif':''} ty-btn" onclick="malzemeCikisGoster()">${ikon('trendDown','turkuaz')} Malzeme Kullan</div>`;
  if (izinVar('transfer')) h += `
    <div class="ustNavBtn ${ui.view==='transfer'?'ustNavBtnAktif':''} ty-btn" onclick="transferGoster()">${ikon('refresh','mavi')} Transfer Et
      ${bekleyenTransferSayisi() > 0 ? `<span class="rozet">${bekleyenTransferSayisi()}</span>` : ''}
    </div>`;
  if (izinVar('raporGor')) h += `
    <div class="ustNavBtn ${ui.view==='raporlar'?'ustNavBtnAktif':''} ty-btn" onclick="raporlarGoster()">${ikon('chart','vurgu')} Raporlar</div>`;
  if (izinVar('raporEkle')) h += `
    <div class="ustNavBtn ${ui.view==='rapor'?'ustNavBtnAktif':''} ty-btn" onclick="raporGoster()">${ikon('file','vurgu')} Rapor ekle</div>`;
  el.innerHTML = h;

  const marqueeEl = document.getElementById("ustMarquee");
  if (marqueeEl) {
    let mh = "";
    const kritikTesisler = kritikTesisAdlari();
    if (izinVar('stokListesi') && kritikTesisler.length > 0) {
      const metin = `⚠ Kritik stok: ${kritikTesisler.join(' • ')}`;
      mh += `<div class="kritikMarquee"><div class="kritikMarqueeIc">${esc(metin)} &nbsp;&nbsp;•&nbsp;&nbsp; ${esc(metin)}</div></div>`;
    }
    if (izinVar('periyodikBakim')) {
      const bakimTesisleri = bakimUyariTesisAdlari();
      if (bakimTesisleri.gecti.length > 0 || bakimTesisleri.yaklasan.length > 0) {
        const parcalar = [];
        if (bakimTesisleri.gecti.length) parcalar.push(`⚠ Bakımı geçen: ${bakimTesisleri.gecti.join(' • ')}`);
        if (bakimTesisleri.yaklasan.length) parcalar.push(`⏳ Bakımı yaklaşan: ${bakimTesisleri.yaklasan.join(' • ')}`);
        const metin = parcalar.join('   ·   ');
        mh += `<div class="kritikMarquee"><div class="kritikMarqueeIc">${esc(metin)} &nbsp;&nbsp;•&nbsp;&nbsp; ${esc(metin)}</div></div>`;
      }
    }
    marqueeEl.innerHTML = mh;
  }
}
function logoGuncelle(){
  const el = document.getElementById("logoAlani");
  if (!el || !state) return;
  const acikMi = temaOku() === "acik";
  const aktifLogo = acikMi ? (state.logoUrlAcik || state.logoUrlKoyu) : (state.logoUrlKoyu || state.logoUrlAcik);
  el.innerHTML = aktifLogo
    ? `<img src="${esc(aktifLogo)}" alt="Logo" style="width:320px;height:85px;object-fit:contain;display:block" />`
    : `<div style="display:flex;align-items:center;gap:10px;width:320px;height:85px">
        <span class="logo">⌁</span>
        <div>
          <div class="baslik">Tesis Yönetim Sistemi</div>
          <div class="altBaslik">saha ekipman ve satın alma takibi</div>
        </div>
      </div>`;
}
function renderSol(){
  const h = tesisAgaciHTML();
  document.getElementById("solMenu").innerHTML = h;
}

function tesisAgaciHTML(){
  let h = `
    <div class="solBaslikSatir" style="padding:4px 0 10px">
      <span class="solBaslik">Tesisler</span>
      <div style="display:flex;gap:6px">
        <button class="ekleMini ty-btn ${ui.siralaModu?'siralaAktifBtn':''}" onclick="siralamaModuAcKapat()">${ui.siralaModu?'✓ Sıralamayı bitir':'↕ Sırala'}</button>
        ${adminMi() ? `<button class="ekleMini ty-btn" onclick="tesisEkle()">+ Tesis ekle</button>` : ''}
      </div>
    </div>`;

  const tesisListesi = siraliTesisler();
  if (tesisListesi.length === 0) {
    h += `<div class="bosMetin">Erişebileceğiniz bir tesis bulunmuyor.</div>`;
  }
  tesisListesi.forEach((t, tIndex) => {
    const acikT = ui.acikTesis.has(t.id);
    h += `<div class="tesisKart" ${ui.siralaModu?`draggable="true" ondragstart="tesisSurukleBasla(event,'${t.id}')" ondragover="event.preventDefault()" ondrop="tesisSurukleBirak(event,'${t.id}')"`:''}>`;
    h += `<div class="tesisBaslikSatir ${ui.siralaModu?'suruklenebilirSatir':''}" onclick="acikTesisToggle('${t.id}')">
      ${ui.siralaModu ? `<span class="suruklemeTutamaci">⠿</span>` : ''}
      <span class="okBuyuk" style="transform:${acikT?'rotate(90deg)':'none'}">›</span>
      <span class="tesisIkon tesisIkonRenkli">${svgIkon('factory',15)}</span>`;
    if (ui.duzenlenenId === t.id) {
      h += `<input class="editInput" id="editInput_${t.id}" value="${esc(t.ad)}" onclick="event.stopPropagation()" onkeydown="enterIleKaydet(event)" onblur="tesisAdKaydet(this,'${t.id}')" />`;
    } else {
      h += `<span class="tesisAdMetin">${esc(t.ad)}</span>`;
    }
    h += `<div class="aksiyonGrup">
        ${ui.siralaModu ? `
          <button class="aksiyonBtn ty-btn" title="Yukarı taşı" ${tIndex===0?'disabled style="opacity:.3"':''} onclick="event.stopPropagation(); tesisTasi('${t.id}',-1)">▲</button>
          <button class="aksiyonBtn ty-btn" title="Aşağı taşı" ${tIndex===tesisListesi.length-1?'disabled style="opacity:.3"':''} onclick="event.stopPropagation(); tesisTasi('${t.id}',1)">▼</button>
        ` : `
          <button class="aksiyonBtn ty-btn" title="Adını düzenle" onclick="event.stopPropagation(); duzenlemeBaslat('${t.id}')">✎</button>
          ${adminMi() ? `<button class="aksiyonBtn aksiyonBtnSil ty-btn" title="Tesisi sil" onclick="event.stopPropagation(); silOnayla('Tesisi Sil', ()=>tesisSil('${t.id}'))">×</button>` : ''}
        `}
      </div>
    </div>`;

    if (acikT) {
      h += `<div class="acilirIcerik makineListesiAlani">`;
      const makineListesi = siraliMakineler(t.id, t.makineler);
      makineListesi.forEach((m, mIndex) => {
        const acikM = ui.acikMakine.has(m.id);
        h += `<div class="makineSatir ${ui.siralaModu?'suruklenebilirSatir':''}" ${ui.siralaModu?`draggable="true" ondragstart="makineSurukleBasla(event,'${m.id}')" ondragover="event.preventDefault()" ondrop="makineSurukleBirak(event,'${t.id}','${m.id}')"`:''} onclick="acikMakineToggle('${m.id}')">
          ${ui.siralaModu ? `<span class="suruklemeTutamaci">⠿</span>` : ''}
          <span class="okBuyuk" style="transform:${acikM?'rotate(90deg)':'none'}">›</span>
          <span class="tesisIkon makineIkonRenkli">${svgIkon('gear',13)}</span>`;
        if (ui.duzenlenenId === m.id) {
          h += `<input class="editInput" id="editInput_${m.id}" value="${esc(m.ad)}" onclick="event.stopPropagation()" onkeydown="enterIleKaydet(event)" onblur="makineAdKaydet(this,'${t.id}','${m.id}')" />`;
        } else {
          h += `<span class="makineAdMetin">${esc(m.ad)}</span>`;
        }
        h += `<div class="aksiyonGrup">
            ${ui.siralaModu ? `
              <button class="aksiyonBtn ty-btn" title="Yukarı taşı" ${mIndex===0?'disabled style="opacity:.3"':''} onclick="event.stopPropagation(); makineTasi('${t.id}','${m.id}',-1)">▲</button>
              <button class="aksiyonBtn ty-btn" title="Aşağı taşı" ${mIndex===makineListesi.length-1?'disabled style="opacity:.3"':''} onclick="event.stopPropagation(); makineTasi('${t.id}','${m.id}',1)">▼</button>
            ` : `
              <button class="aksiyonBtn ty-btn" title="Adını düzenle" onclick="event.stopPropagation(); duzenlemeBaslat('${m.id}')">✎</button>
              ${adminMi() ? `<button class="aksiyonBtn aksiyonBtnSil ty-btn" title="Makineyi sil" onclick="event.stopPropagation(); silOnayla('Makineyi Sil', ()=>makineSil('${t.id}','${m.id}'))">×</button>` : ''}
            `}
          </div>
        </div>`;

        if (acikM) {
          h += `<div class="acilirIcerik pompaListesiAlani">`;
          m.pompalar.forEach(p => {
            const secili = ui.secim.pompaId === p.id && ui.view === 'pompa';
            h += `<div class="pompaSatir ${secili?'pompaSatirSecili':''}" onclick="pompaSec('${t.id}','${m.id}','${p.id}')">
              <span class="pompaNokta">●</span>`;
            if (ui.duzenlenenId === p.id) {
              h += `<input class="editInput" id="editInput_${p.id}" value="${esc(p.ad)}" onclick="event.stopPropagation()" onkeydown="enterIleKaydet(event)" onblur="pompaAdKaydetSol(this,'${t.id}','${m.id}','${p.id}')" />`;
            } else {
              h += `<span class="pompaAdMetin">${esc(p.ad) || '(isimsiz)'}</span>`;
            }
            h += `<div class="aksiyonGrup">
                <button class="aksiyonBtn ty-btn" title="Adını düzenle" onclick="event.stopPropagation(); duzenlemeBaslat('${p.id}')">✎</button>
                ${adminMi() ? `<button class="aksiyonBtn aksiyonBtnSil ty-btn" title="Pompayı sil" onclick="event.stopPropagation(); silOnayla('Pompayı Sil', ()=>pompaSil('${t.id}','${m.id}','${p.id}'))">×</button>` : ''}
              </div>
            </div>`;
          });
          if (adminMi()) h += `<button class="ekleMiniPompa ty-btn" onclick="pompaEkle('${t.id}','${m.id}')">+ Pompa ekle</button>`;
          h += `</div>`;
        }
      });
      if (adminMi()) h += `<button class="ekleMiniMakine ty-btn" onclick="makineEkle('${t.id}')">+ Makine ekle</button>`;
      h += `</div>`;
    }
    h += `</div>`;
  });
  return h;
}

