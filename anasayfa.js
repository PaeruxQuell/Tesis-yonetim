function anaSayfaGoster(){ ui.view = "anasayfa"; render(); }
function sonKullanilanMalzemeler(limit){
  const sonuc = [];
  kapsamTesisler().forEach(t => (t.makineler||[]).forEach(m => (m.pompalar||[]).forEach(p => {
    (p.gecmis||[]).forEach(g => {
      if (!g.malzemeler || g.malzemeler.length === 0) return;
      const tarihObj = tarihAyristir(g.tarih);
      const ozet = g.malzemeler.map(x => `${x.adet} ${x.ad}${x.kod?` (${x.kod})`:''}`).join(', ') + ' kullanıldı';
      sonuc.push({ tesisId: t.id, makineId: m.id, pompaId: p.id, tesis: t.ad, makine: m.ad, pompa: p.ad, tarih: g.tarih, tarihObj, ozet });
    });
  })));
  sonuc.sort((a,b) => (b.tarihObj ? b.tarihObj.getTime() : 0) - (a.tarihObj ? a.tarihObj.getTime() : 0));
  return sonuc.slice(0, limit || 10);
}
let stokOncekiMiktarlar = {};
function miktarDegisimSinifi(urunId, yeniMiktar){
  const eski = stokOncekiMiktarlar[urunId];
  stokOncekiMiktarlar[urunId] = yeniMiktar;
  if (eski === undefined) return "";
  const e = parseFloat(eski) || 0, y = parseFloat(yeniMiktar) || 0;
  if (e === y) return "";
  return y > e ? "miktarYanipSonArtis" : "miktarYanipSonAzalis";
}
let ozetOnceki = { kritik: 0, satinAlma: 0, bakim: 0 };
function sayiSayarakYaz(elId, eskiDeger, yeniDeger, anahtar){
  const el = document.getElementById(elId);
  if (!el) return;
  if (eskiDeger === yeniDeger) { el.textContent = yeniDeger; ozetOnceki[anahtar] = yeniDeger; return; }
  const sure = 650, baslangic = performance.now();
  function adim(simdi){
    const ilerleme = Math.min(1, (simdi - baslangic) / sure);
    const kolay = 1 - Math.pow(1 - ilerleme, 3);
    el.textContent = Math.round(eskiDeger + (yeniDeger - eskiDeger) * kolay);
    if (ilerleme < 1) requestAnimationFrame(adim);
    else { el.textContent = yeniDeger; ozetOnceki[anahtar] = yeniDeger; }
  }
  requestAnimationFrame(adim);
}

/* ---------------- genel arama ---------------- */
let aramaHedefleri = [];
function genelAramaGuncelle(sorgu){
  ui.genelArama = sorgu;
  genelAramaSonucRender();
}
function genelAramaSonuclariHesapla(q){
  const sonuc = [];
  erisilenTesisler().forEach(t => {
    if (t.ad.toLowerCase().includes(q)) sonuc.push({ tip: "Tesis", baslik: t.ad, alt: "", hedef: { view: "tesis-vurgula", tesisId: t.id } });
    (t.makineler || []).forEach(m => {
      if (m.ad.toLowerCase().includes(q)) sonuc.push({ tip: "Makine", baslik: m.ad, alt: t.ad, hedef: { view: "tesis-vurgula", tesisId: t.id, makineId: m.id } });
      (m.pompalar || []).forEach(p => {
        if (p.ad.toLowerCase().includes(q)) sonuc.push({ tip: "Pompa", baslik: p.ad, alt: `${t.ad} / ${m.ad}`, hedef: { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id } });
        (p.parcalar || []).forEach(pr => {
          if ((pr.ad||"").toLowerCase().includes(q) || (pr.malzeme||"").toLowerCase().includes(q)) sonuc.push({ tip: "Parça", baslik: pr.ad || "(isimsiz)", alt: `${p.ad} — ${t.ad}/${m.ad}`, hedef: { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id } });
        });
        (p.gecmis || []).forEach(g => {
          if ((g.aciklama||"").toLowerCase().includes(q)) sonuc.push({ tip: "Rapor/Geçmiş", baslik: g.aciklama, alt: `${p.ad} — ${t.ad}/${m.ad} · ${g.tarih}`, hedef: { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id } });
        });
      });
      (m.bakimlar || []).forEach(b => {
        if ((b.ad||"").toLowerCase().includes(q)) sonuc.push({ tip: "Bakım Planı", baslik: b.ad, alt: `${t.ad} / ${m.ad}`, hedef: { view: "bakim", tesisId: t.id, makineId: m.id } });
      });
    });
    (t.depolar || []).forEach(d => {
      if (d.ad.toLowerCase().includes(q)) sonuc.push({ tip: "Depo", baslik: d.ad, alt: t.ad, hedef: { view: "stok", tesisId: t.id, depoId: d.id } });
      (d.urunler || []).forEach(u => {
        if ((u.ad||"").toLowerCase().includes(q)) sonuc.push({ tip: "Stok Ürünü", baslik: u.ad, alt: `${d.ad} — ${t.ad}`, hedef: { view: "stok", tesisId: t.id, depoId: d.id } });
      });
    });
  });
  state.satinAlmalar.forEach(sat => {
    (sat.kalemler || []).forEach(k => {
      if ((k.urun||"").toLowerCase().includes(q)) sonuc.push({ tip: "Satın Alma", baslik: k.urun, alt: sat.siparisNo ? `Sipariş No: ${sat.siparisNo}` : "", hedef: { view: "satinalma-detay", satId: sat.id } });
    });
    if ((sat.siparisNo||"").toLowerCase().includes(q)) sonuc.push({ tip: "Satın Alma", baslik: `Sipariş No: ${sat.siparisNo}`, alt: "", hedef: { view: "satinalma-detay", satId: sat.id } });
  });
  (state.malzemeGecmisi || []).forEach(m => {
    if (m.ad.toLowerCase().includes(q)) sonuc.push({ tip: "Malzeme", baslik: m.ad, alt: "Kullanılan Malzemeler listesi", hedef: { view: "malzemeler" } });
  });
  return sonuc.slice(0, 40);
}
function genelAramaSonucRender(){
  const kap = document.getElementById("genelAramaSonuclari");
  if (!kap) return;
  const q = (ui.genelArama || "").trim().toLowerCase();
  if (!q) { kap.innerHTML = ""; aramaHedefleri = []; return; }
  const sonuclar = genelAramaSonuclariHesapla(q);
  aramaHedefleri = sonuclar.map(s => s.hedef);
  let h = "";
  if (sonuclar.length === 0) {
    h = `<div class="bosMetin" style="padding:14px">Sonuç bulunamadı.</div>`;
  } else {
    sonuclar.forEach((s, i) => {
      h += `<div class="aramaSonucSatiri ty-btn" onclick="aramaSonucunaGit(${i})">
        <span class="aramaTip">${esc(s.tip)}</span>
        <span style="flex:1;min-width:0">
          <div style="color:var(--yazi);font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.baslik)}</div>
          ${s.alt ? `<div style="color:var(--yazi-soluk);font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.alt)}</div>` : ''}
        </span>
      </div>`;
    });
  }
  kap.innerHTML = h;
}
function aramaSonucunaGit(i){
  const hedef = aramaHedefleri[i];
  document.getElementById("genelArama").value = "";
  ui.genelArama = "";
  hedefeGit(hedef);
}

function renderAnaSayfa(){
    const kapsam = kapsamTesisler();
    const kritikSayisi = kapsam.reduce((top, t) => top + (t.depolar||[]).reduce((d, dep) => d + (dep.urunler||[]).filter(u => u.kritikTakip && (parseFloat(u.miktar)||0) <= (parseFloat(u.kritikEsik)||0)).length, 0), 0);
    const bekleyenSatinAlma = saTumKalemler().filter(k => k.durum === "Gelmedi").length;
    const bekleyenBakim = bakimUyariSayisi();

    let h = `<div class="pompaAdBaslik" style="margin-bottom:4px">Ana Sayfa</div>
      <div class="altBaslik2" style="margin-bottom:20px">genel durum özeti</div>`;

    h += `<div style="position:relative;margin-bottom:24px">
      <input class="girdi" id="genelArama" placeholder="🔍  Tesis, makine, pompa, parça, rapor, satın alma, stok, malzeme... her şeyde ara" value="${esc(ui.genelArama)}" oninput="genelAramaGuncelle(this.value)" style="font-size:14.5px;padding:13px 16px" />
      <div id="genelAramaSonuclari" class="genelAramaSonuclari"></div>
    </div>`;

    h += `<div class="ozetSatiri">
      <div class="ozetKart ${kritikSayisi>0?'ozetKartKirmizi':''} ty-btn" onclick="stokGoster()">
        <div class="ozetSayi" id="ozetKritikSayi">${ozetOnceki.kritik}</div>
        <div class="ozetEtiket">Kritik Stok</div>
      </div>
      <div class="ozetKart ${bekleyenSatinAlma>0?'ozetKartAmber':''} ty-btn" onclick="satinAlmaGoster()">
        <div class="ozetSayi" id="ozetSatinAlmaSayi">${ozetOnceki.satinAlma}</div>
        <div class="ozetEtiket">Bekleyen Satın Alma</div>
      </div>
      <div class="ozetKart ${bekleyenBakim>0?'ozetKartAmber':''} ty-btn" onclick="bakimGoster()">
        <div class="ozetSayi" id="ozetBakimSayi">${ozetOnceki.bakim}</div>
        <div class="ozetEtiket">Yaklaşan / Geciken Bakım</div>
      </div>
    </div>`;

    const bakimListesi = tumBakimlar().filter(x => x.durum.durum === "gecti" || x.durum.durum === "yaklasiyor")
      .sort((a,b) => (a.durum.gunKaldi ?? 0) - (b.durum.gunKaldi ?? 0));
    if (bakimListesi.length > 0) {
      h += `<div class="kart bakimUyariYanip" style="border-color:rgba(var(--kirmizi-rgb),0.4)">
        <div class="kartBaslik" style="margin-bottom:10px;color:var(--kirmizi)">⚠ Bakım Uyarıları (${bakimListesi.length})</div>`;
      bakimListesi.forEach(x => {
        const renk = x.durum.durum === "gecti" ? "var(--kirmizi)" : "var(--vurgu)";
        const metin = x.durum.durum === "gecti" ? `${Math.abs(x.durum.gunKaldi)} gün gecikti` : `${x.durum.gunKaldi} gün kaldı`;
        const yer = x.pompa ? `${x.tesis} / ${x.makine} / ${x.pompa}` : `${x.tesis} / ${x.makine}`;
        h += `<div class="ayarSatiri ty-btn" style="border-left:3px solid ${renk};padding-left:11px" onclick="bakimGoster()">
          <span style="flex:1">
            <div style="color:var(--yazi);font-size:13px">${esc(x.bakim.ad)}</div>
            <div style="color:var(--yazi-soluk);font-size:11.5px">${esc(yer)}</div>
          </span>
          <span style="color:${renk};font-size:12px;font-weight:600">${metin}</span>
        </div>`;
      });
      h += `</div>`;
    }

    const depoDurumlari = [];
    kapsam.forEach(t => (t.depolar||[]).forEach(d => {
      const kritikSayisiDepo = (d.urunler||[]).filter(u => u.kritikTakip && (parseFloat(u.miktar)||0) <= (parseFloat(u.kritikEsik)||0)).length;
      if (kritikSayisiDepo > 0) depoDurumlari.push({ tesis: t.ad, depo: d.ad, sayi: kritikSayisiDepo });
    }));
    if (depoDurumlari.length > 0) {
      h += `<div class="kart">
        <div class="kartBaslik" style="margin-bottom:10px">Depo Durumu</div>`;
      depoDurumlari.forEach(dd => {
        h += `<div class="ayarSatiri" style="border-left:3px solid var(--kirmizi);padding-left:11px">
          <span style="flex:1;color:var(--yazi)">${esc(dd.tesis)} / ${esc(dd.depo)}</span>
          <span style="color:var(--kirmizi);font-size:12px;font-weight:600">${dd.sayi} kritik ürün</span>
        </div>`;
      });
      h += `</div>`;
    }

    const sonMalzemeler = sonKullanilanMalzemeler(8);
    if (sonMalzemeler.length > 0) {
      h += `<div class="kart">
        <div class="kartBaslik" style="margin-bottom:10px">Son Kullanılan Malzemeler</div>`;
      sonMalzemeler.forEach(sm => {
        h += `<div class="ayarSatiri ty-btn" onclick="pompaSec('${sm.tesisId}','${sm.makineId}','${sm.pompaId}')">
          <span style="flex:1">
            <div style="color:var(--yazi);font-size:13px">${esc(sm.ozet)}</div>
            <div style="color:var(--yazi-soluk);font-size:11.5px">${esc(sm.tesis)} / ${esc(sm.makine)} / ${esc(sm.pompa)}</div>
          </span>
          <span style="color:var(--yazi-soluk);font-size:11px;font-family:'IBM Plex Mono',monospace">${esc(sm.tarih)}</span>
        </div>`;
      });
      h += `</div>`;
    }

    anaPanelYaz(h);
    genelAramaSonucRender();
    sayiSayarakYaz("ozetKritikSayi", ozetOnceki.kritik, kritikSayisi, "kritik");
    sayiSayarakYaz("ozetSatinAlmaSayi", ozetOnceki.satinAlma, bekleyenSatinAlma, "satinAlma");
    sayiSayarakYaz("ozetBakimSayi", ozetOnceki.bakim, bekleyenBakim, "bakim");
    if (ui.duzenlenenId) {
      const inp = document.getElementById("editInput_" + ui.duzenlenenId);
      if (inp) { inp.focus(); inp.select(); }
    }
    return;
}
