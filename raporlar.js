/* ---------------- raporlar (özet görünüm) ---------------- */
function raporlarGoster(){ if (!izinVar('raporGor')) return; ui.view = "raporlar"; render(); }
function raporFiltreDegistir(deger){ ui.raporFiltre = deger; render(); }

function raporVerileriTopla(filtre){
  const sonuc = [];
  const bugunTarih = new Date(new Date().toDateString());
  kapsamTesisler().forEach(t => (t.makineler||[]).forEach(m => (m.pompalar||[]).forEach(p => {
    (p.gecmis||[]).forEach(g => {
      if (!g.malzemeler || g.malzemeler.length === 0) return;
      const tarihObj = tarihAyristir(g.tarih);
      if (filtre !== "tumu") {
        if (!tarihObj) return;
        const fark = gunFarki(tarihObj, bugunTarih);
        if (filtre === "gunluk" && fark > 0) return;
        if (filtre === "haftalik" && fark > 6) return;
        if (filtre === "aylik" && fark > 29) return;
        if (filtre === "yillik" && fark > 364) return;
        if (fark < 0) return;
      }
      sonuc.push({ tesisId: t.id, makineId: m.id, pompaId: p.id, tesis: t.ad, makine: m.ad, pompa: p.ad, tarih: g.tarih, tarihObj, malzemeler: g.malzemeler, aciklama: g.aciklama });
    });
  })));
  sonuc.sort((a,b) => (b.tarihObj ? b.tarihObj.getTime() : 0) - (a.tarihObj ? a.tarihObj.getTime() : 0));
  return sonuc;
}

function renderRaporlar(){
  const filtre = ui.raporFiltre || "haftalik";
  const veriler = raporVerileriTopla(filtre);
  const secenekler = [
    { deger: "gunluk", etiket: "Günlük" },
    { deger: "haftalik", etiket: "Haftalık" },
    { deger: "aylik", etiket: "Aylık" },
    { deger: "yillik", etiket: "Yıllık" },
    { deger: "tumu", etiket: "Tümü" },
  ];
  let h = `<div class="pompaBaslikSatir" style="margin-bottom:4px">
    <div>
      <div class="pompaAdBaslik">Raporlar</div>
      <div class="altBaslik2">tesislerde son yapılan işler, kullanılan malzemeler ve tarihleri — aralığı seçerek filtreleyin</div>
    </div>
  </div>`;

  h += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    ${secenekler.map(s => `<button class="ty-btn raporFiltreBtn ${filtre===s.deger?'raporFiltreBtnAktif':''}" onclick="raporFiltreDegistir('${s.deger}')">${s.etiket}</button>`).join('')}
  </div>`;

  h += `<div class="kart">
    <div class="kartBaslik" style="margin-bottom:10px">${veriler.length} kayıt bulundu</div>`;
  if (veriler.length === 0) {
    h += `<div class="bosMetin">Bu aralıkta malzeme kullanımı içeren bir kayıt bulunamadı.</div>`;
  } else {
    h += `<div class="kalemBaslikSatir" style="padding-left:0">
      <span style="flex:1.4">Tesis / Makine / Pompa</span><span style="flex:2">Kullanılan Malzeme</span><span style="width:110px">Tarih</span>
    </div>`;
    veriler.forEach(v => {
      const malzemeMetni = v.malzemeler.map(x => `${x.adet} ${x.ad}${x.birim?(' '+x.birim):''}`).join(', ');
      h += `<div class="stokUrunSatirTek ty-btn" style="cursor:pointer;align-items:flex-start" onclick="pompaSec('${v.tesisId}','${v.makineId}','${v.pompaId}')">
        <span style="flex:1.4">
          <div style="color:var(--yazi);font-size:13px;font-weight:600">${esc(v.tesis)}</div>
          <div style="color:var(--yazi-soluk);font-size:11.5px">${esc(v.makine)} / ${esc(v.pompa)}</div>
        </span>
        <span style="flex:2;color:var(--yazi-ikincil);font-size:12.5px">${esc(malzemeMetni)}</span>
        <span style="width:110px;color:var(--yazi-dim);font-family:'JetBrains Mono',monospace;font-size:12px">${esc(v.tarih)}</span>
      </div>`;
    });
  }
  h += `</div>`;
  anaPanelYaz(h);
}
