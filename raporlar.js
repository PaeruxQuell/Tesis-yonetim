/* ---------------- raporlar (özet görünüm) ---------------- */
function raporlarGoster(){
  if (!izinVar('raporGor')) return;
  ui.view = "raporlar";
  const bugunObj = new Date();
  if (!ui.raporTakvimYil) { ui.raporTakvimYil = bugunObj.getFullYear(); ui.raporTakvimAy = bugunObj.getMonth(); }
  render();
}
function raporFiltreDegistir(deger){ ui.raporFiltre = deger; render(); }

function raporVerileriTopla(filtre){
  const sonuc = [];
  const bugunTarih = new Date(new Date().toDateString());
  const ozelBaslangic = filtre === "ozel" && ui.raporOzelBaslangic ? tarihAyristir(ui.raporOzelBaslangic) : null;
  const ozelBitis = filtre === "ozel" && ui.raporOzelBitis ? tarihAyristir(ui.raporOzelBitis) : null;
  kapsamTesisler().forEach(t => (t.makineler||[]).forEach(m => (m.pompalar||[]).forEach(p => {
    (p.gecmis||[]).forEach(g => {
      if (!g.malzemeler || g.malzemeler.length === 0) return;
      const tarihObj = tarihAyristir(g.tarih);
      if (filtre === "ozel") {
        if (!ozelBaslangic || !ozelBitis || !tarihObj) return;
        if (tarihObj.getTime() < ozelBaslangic.getTime() || tarihObj.getTime() > ozelBitis.getTime()) return;
      } else if (filtre !== "tumu") {
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

/* ---------------- özel tarih aralığı (mini takvim) ---------------- */
function raporTakvimAyDegistir(delta){
  let ay = ui.raporTakvimAy + delta, yil = ui.raporTakvimYil;
  if (ay < 0) { ay = 11; yil--; } else if (ay > 11) { ay = 0; yil++; }
  ui.raporTakvimAy = ay; ui.raporTakvimYil = yil;
  render();
}
function raporTakvimGunSec(g, a, y){
  const pad = n => String(n).padStart(2, "0");
  const tarihStr = `${pad(g)}.${pad(a+1)}.${y}`;
  const yeniTarih = new Date(y, a, g);
  if (!ui.raporOzelBaslangic || (ui.raporOzelBaslangic && ui.raporOzelBitis)) {
    ui.raporOzelBaslangic = tarihStr;
    ui.raporOzelBitis = "";
  } else {
    const baslangicTarih = tarihAyristir(ui.raporOzelBaslangic);
    if (yeniTarih.getTime() < baslangicTarih.getTime()) {
      ui.raporOzelBitis = ui.raporOzelBaslangic;
      ui.raporOzelBaslangic = tarihStr;
    } else {
      ui.raporOzelBitis = tarihStr;
    }
  }
  render();
}
function raporOzelTemizle(){
  ui.raporOzelBaslangic = ""; ui.raporOzelBitis = "";
  render();
}
function raporTakvimHTML(){
  const AY_ADLARI = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  const GUN_ADLARI = ["Pt","Sa","Ça","Pe","Cu","Ct","Pz"];
  const yil = ui.raporTakvimYil, ay = ui.raporTakvimAy;
  const ilkGun = new Date(yil, ay, 1);
  let baslangicBosluk = ilkGun.getDay() - 1; if (baslangicBosluk < 0) baslangicBosluk = 6;
  const ayGunSayisi = new Date(yil, ay+1, 0).getDate();
  const bugun = new Date(); bugun.setHours(0,0,0,0);
  const baslangicObj = ui.raporOzelBaslangic ? tarihAyristir(ui.raporOzelBaslangic) : null;
  const bitisObj = ui.raporOzelBitis ? tarihAyristir(ui.raporOzelBitis) : null;

  let h = `<div class="raporTakvim">
    <div class="raporTakvimBaslik">
      <button class="ty-btn raporTakvimOk" onclick="raporTakvimAyDegistir(-1)">‹</button>
      <span>${AY_ADLARI[ay]} ${yil}</span>
      <button class="ty-btn raporTakvimOk" onclick="raporTakvimAyDegistir(1)">›</button>
    </div>
    <div class="raporTakvimHaftaSatiri">${GUN_ADLARI.map(g=>`<span>${g}</span>`).join('')}</div>
    <div class="raporTakvimGunler">`;
  for (let i=0; i<baslangicBosluk; i++) h += `<span class="raporTakvimBosluk"></span>`;
  for (let g=1; g<=ayGunSayisi; g++){
    const gunTarih = new Date(yil, ay, g); gunTarih.setHours(0,0,0,0);
    const bugunMu = gunTarih.getTime() === bugun.getTime();
    const baslangicMi = baslangicObj && gunTarih.getTime() === baslangicObj.getTime();
    const bitisMi = bitisObj && gunTarih.getTime() === bitisObj.getTime();
    const araliktaMi = baslangicObj && bitisObj && gunTarih.getTime() > baslangicObj.getTime() && gunTarih.getTime() < bitisObj.getTime();
    let sinif = "raporTakvimGun";
    if (baslangicMi || bitisMi) sinif += " raporTakvimGunSecili";
    else if (araliktaMi) sinif += " raporTakvimGunAralikta";
    if (bugunMu) sinif += " raporTakvimGunBugun";
    h += `<span class="${sinif}" onclick="raporTakvimGunSec(${g},${ay},${yil})">${g}</span>`;
  }
  h += `</div></div>`;
  return h;
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
    { deger: "ozel", etiket: "📅 Özel Tarih Seç" },
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

  if (filtre === "ozel") {
    h += `<div class="kart">
      <div class="kartBaslik" style="margin-bottom:10px">Özel Tarih Aralığı</div>
      <div class="bosMetin" style="margin-bottom:12px">Takvimden önce başlangıç, sonra bitiş gününe tıklayın — aradaki tüm günler otomatik seçilir.</div>
      <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start">
        ${raporTakvimHTML()}
        <div style="min-width:200px">
          <div style="margin-bottom:10px">
            <div class="bosMetin" style="margin:0">Başlangıç</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:${ui.raporOzelBaslangic?'var(--vurgu)':'var(--yazi-soluk)'}">${esc(ui.raporOzelBaslangic) || 'seçilmedi'}</div>
          </div>
          <div style="margin-bottom:14px">
            <div class="bosMetin" style="margin:0">Bitiş</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:700;color:${ui.raporOzelBitis?'var(--vurgu)':'var(--yazi-soluk)'}">${esc(ui.raporOzelBitis) || 'seçilmedi'}</div>
          </div>
          ${(ui.raporOzelBaslangic || ui.raporOzelBitis) ? `<button class="ustBtn ty-btn" onclick="raporOzelTemizle()">Temizle</button>` : ''}
        </div>
      </div>
    </div>`;
  }

  h += `<div class="kart">
    <div class="kartBaslik" style="margin-bottom:10px">${veriler.length} kayıt bulundu</div>`;
  if (filtre === "ozel" && (!ui.raporOzelBaslangic || !ui.raporOzelBitis)) {
    h += `<div class="bosMetin">Sonuçları görmek için yukarıdan bir başlangıç ve bitiş günü seçin.</div>`;
  } else if (veriler.length === 0) {
    h += `<div class="bosMetin">Bu aralıkta malzeme kullanımı içeren bir kayıt bulunamadı.</div>`;
  } else {
    h += `<div class="kalemBaslikSatir" style="padding-left:0">
      <span style="flex:1.4">Tesis / Makine / Pompa</span><span style="flex:2">Kullanılan Malzeme</span><span style="width:110px">Tarih</span>
    </div>`;
    veriler.forEach(v => {
      const malzemeMetni = v.malzemeler.map(x => `${x.adet} ${x.ad}${x.kod?` (${x.kod})`:''}${x.birim?(' '+x.birim):''}`).join(', ');
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
