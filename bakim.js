function bakimGoster(){
  if (!izinVar('periyodikBakim')) return;
  ui.view = "bakim";
  if (!ui.bakimTakvimYil) { const d = new Date(); ui.bakimTakvimYil = d.getFullYear(); ui.bakimTakvimAy = d.getMonth(); }
  render();
}
function bakimTesisAcKapat(id){ ui.bakimAcikTesis.has(id) ? ui.bakimAcikTesis.delete(id) : ui.bakimAcikTesis.add(id); render(); }
function bakimMakineAcKapat(id){ ui.bakimAcikMakine.has(id) ? ui.bakimAcikMakine.delete(id) : ui.bakimAcikMakine.add(id); render(); }
function bakimPompaAcKapat(id){ ui.bakimAcikPompa.has(id) ? ui.bakimAcikPompa.delete(id) : ui.bakimAcikPompa.add(id); render(); }
function bakimEkle(tesisId, makineId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  m.bakimlar.push({ id: uid(), ad: "", periyotGun: 180, sonYapilmaTarihi: bugun(), uyariGunu: 15 });
  kaydetIslem(`Yeni bakım planı eklendi (${t.ad} / ${m.ad})`, { view: "bakim", tesisId: t.id, makineId: m.id });
  saveData(); render();
}
function bakimSil(tesisId, makineId, bakimId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const b = m.bakimlar.find(x => x.id === bakimId);
  m.bakimlar = m.bakimlar.filter(b => b.id !== bakimId);
  if (b) kaydetIslem(`Bakım planı silindi: ${b.ad || '(isimsiz)'} (${t.ad} / ${m.ad})`, { view: "bakim", tesisId: t.id, makineId: m.id });
  saveData(); render();
}
function bakimGuncelle(tesisId, makineId, bakimId, alan, deger){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const b = m.bakimlar.find(x => x.id === bakimId); if (b) b[alan] = deger;
  saveData(); render();
}
function bakimYapildiIsaretle(tesisId, makineId, bakimId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t.makineler.find(x => x.id === makineId);
  const b = m.bakimlar.find(x => x.id === bakimId); if (!b) return;
  b.sonYapilmaTarihi = bugun();
  kaydetIslem(`Periyodik bakım yapıldı: ${b.ad || 'bakım'} (${t.ad} / ${m.ad})`, { view: "bakim", tesisId: t.id, makineId: m.id });
  toastGoster("Bakım tamamlandı olarak işaretlendi.", "basari");
  konfetiPatlat();
  saveData(); render();
}
function bakimPompaBul(tesisId, makineId, pompaId){
  const t = state.tesisler.find(x => x.id === tesisId);
  const m = t?.makineler.find(x => x.id === makineId);
  const p = m?.pompalar.find(x => x.id === pompaId);
  return { t, m, p };
}
function bakimPompaEkle(tesisId, makineId, pompaId){
  const { t, m, p } = bakimPompaBul(tesisId, makineId, pompaId); if (!p) return;
  p.bakimlar.push({ id: uid(), ad: "", periyotGun: 180, sonYapilmaTarihi: bugun(), uyariGunu: 15 });
  kaydetIslem(`Yeni bakım planı eklendi: ${p.ad} (${t.ad} / ${m.ad})`, { view: "bakim", tesisId: t.id, makineId: m.id, pompaId: p.id });
  saveData(); render();
}
function bakimPompaSil(tesisId, makineId, pompaId, bakimId){
  const { t, m, p } = bakimPompaBul(tesisId, makineId, pompaId); if (!p) return;
  const b = p.bakimlar.find(x => x.id === bakimId);
  p.bakimlar = p.bakimlar.filter(b => b.id !== bakimId);
  if (b) kaydetIslem(`Bakım planı silindi: ${b.ad || '(isimsiz)'} (${p.ad} — ${t.ad} / ${m.ad})`, { view: "bakim", tesisId: t.id, makineId: m.id, pompaId: p.id });
  saveData(); render();
}
function bakimPompaGuncelle(tesisId, makineId, pompaId, bakimId, alan, deger){
  const { p } = bakimPompaBul(tesisId, makineId, pompaId); if (!p) return;
  const b = p.bakimlar.find(x => x.id === bakimId); if (b) b[alan] = deger;
  saveData(); render();
}
function bakimPompaYapildiIsaretle(tesisId, makineId, pompaId, bakimId){
  const { t, m, p } = bakimPompaBul(tesisId, makineId, pompaId); if (!p) return;
  const b = p.bakimlar.find(x => x.id === bakimId); if (!b) return;
  b.sonYapilmaTarihi = bugun();
  kaydetIslem(`Periyodik bakım yapıldı: ${b.ad || 'bakım'} (${p.ad} — ${t.ad} / ${m.ad})`, { view: "bakim", tesisId: t.id, makineId: m.id, pompaId: p.id });
  toastGoster("Bakım tamamlandı olarak işaretlendi.", "basari");
  konfetiPatlat();
  saveData(); render();
}
function bakimSonrakiTarih(b){
  const son = tarihAyristir(b.sonYapilmaTarihi);
  if (!son) return null;
  const sonraki = new Date(son);
  sonraki.setDate(sonraki.getDate() + (parseInt(b.periyotGun, 10) || 0));
  return sonraki;
}
function bakimDurum(b){
  const sonraki = bakimSonrakiTarih(b);
  if (!sonraki) return { durum: "bilinmiyor", gunKaldi: null, tarih: "—" };
  const gunKaldi = gunFarki(new Date(new Date().toDateString()), sonraki);
  const uyariEsigi = parseInt(b.uyariGunu, 10) || 15;
  let durum = "normal";
  if (gunKaldi <= 0) durum = "gecti";
  else if (gunKaldi <= uyariEsigi) durum = "yaklasiyor";
  return { durum, gunKaldi, tarih: tarihFormatla(sonraki) };
}
function tumBakimlar(){
  const sonuc = [];
  kapsamTesisler().forEach(t => (t.makineler || []).forEach(m => {
    (m.bakimlar || []).forEach(b => {
      if (!b.ad) return;
      sonuc.push({ tesisId: t.id, makineId: m.id, tesis: t.ad, makine: m.ad, bakim: b, durum: bakimDurum(b) });
    });
    (m.pompalar || []).forEach(p => (p.bakimlar || []).forEach(b => {
      if (!b.ad) return;
      sonuc.push({ tesisId: t.id, makineId: m.id, pompaId: p.id, tesis: t.ad, makine: m.ad, pompa: p.ad, bakim: b, durum: bakimDurum(b) });
    }));
  }));
  return sonuc;
}
function bakimUyariSayisi(){
  return tumBakimlar().filter(x => x.durum.durum === "gecti" || x.durum.durum === "yaklasiyor").length;
}
function bakimUyariTesisAdlari(){
  const gectiAdlari = new Set(), yaklasanAdlari = new Set();
  tumBakimlar().forEach(x => {
    if (x.durum.durum === "gecti") gectiAdlari.add(x.tesis);
    else if (x.durum.durum === "yaklasiyor") yaklasanAdlari.add(x.tesis);
  });
  return { gecti: [...gectiAdlari], yaklasan: [...yaklasanAdlari] };
}

/* ---------------- görünürlük ayarları ---------------- */
function bakimGorunumDegistir(mod){ ui.bakimGorunum = mod; render(); }
function bakimTakvimAyDegistir(delta){
  let ay = ui.bakimTakvimAy + delta, yil = ui.bakimTakvimYil;
  if (ay < 0) { ay = 11; yil--; } else if (ay > 11) { ay = 0; yil++; }
  ui.bakimTakvimAy = ay; ui.bakimTakvimYil = yil;
  render();
}
function bakimTakvimGunSec(g, a, y){
  const pad = n => String(n).padStart(2, "0");
  ui.bakimTakvimSecili = `${pad(g)}.${pad(a+1)}.${y}`;
  render();
}
function bakimTakvimVerileri(){
  const harita = {};
  tumBakimlar().forEach(x => {
    const tarihObj = bakimSonrakiTarih(x.bakim);
    if (!tarihObj) return;
    const key = tarihFormatla(tarihObj);
    if (!harita[key]) harita[key] = [];
    harita[key].push(x);
  });
  return harita;
}
function renderBakimTakvimi(){
  const AY_ADLARI = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  const GUN_ADLARI = ["Pt","Sa","Ça","Pe","Cu","Ct","Pz"];
  const yil = ui.bakimTakvimYil, ay = ui.bakimTakvimAy;
  const harita = bakimTakvimVerileri();
  const ilkGun = new Date(yil, ay, 1);
  let baslangicBosluk = ilkGun.getDay() - 1; if (baslangicBosluk < 0) baslangicBosluk = 6;
  const ayGunSayisi = new Date(yil, ay+1, 0).getDate();
  const bugunStr = bugun();

  let h = `<div class="bakimTakvimBaslik">
    <button class="ty-btn raporTakvimOk" onclick="bakimTakvimAyDegistir(-1)">‹</button>
    <span>${AY_ADLARI[ay]} ${yil}</span>
    <button class="ty-btn raporTakvimOk" onclick="bakimTakvimAyDegistir(1)">›</button>
  </div>`;
  h += `<div class="bakimTakvimHaftaSatiri">${GUN_ADLARI.map(g=>`<span>${g}</span>`).join('')}</div>`;
  h += `<div class="bakimTakvimGunler">`;
  for (let i=0; i<baslangicBosluk; i++) h += `<span class="bakimTakvimBosluk"></span>`;
  for (let g=1; g<=ayGunSayisi; g++){
    const pad = n => String(n).padStart(2,"0");
    const key = `${pad(g)}.${pad(ay+1)}.${yil}`;
    const kayitlar = harita[key] || [];
    const gectiSayisi = kayitlar.filter(x => x.durum.durum === "gecti").length;
    const yaklasanSayisi = kayitlar.filter(x => x.durum.durum === "yaklasiyor").length;
    let sinif = "bakimTakvimGun";
    if (gectiSayisi > 0) sinif += " bakimTakvimGunKirmizi";
    else if (yaklasanSayisi > 0) sinif += " bakimTakvimGunSari";
    else if (kayitlar.length > 0) sinif += " bakimTakvimGunMavi";
    if (key === bugunStr) sinif += " bakimTakvimGunBugun";
    if (key === ui.bakimTakvimSecili) sinif += " bakimTakvimGunSecili";
    h += `<span class="${sinif}" onclick="bakimTakvimGunSec(${g},${ay},${yil})">
      <span class="bakimTakvimGunNo">${g}</span>
      ${kayitlar.length ? `<span class="bakimTakvimGunSayi">${kayitlar.length}</span>` : ''}
    </span>`;
  }
  h += `</div>`;

  const seciliGun = ui.bakimTakvimSecili || bugunStr;
  const seciliKayitlar = harita[seciliGun] || [];
  h += `<div class="kart" style="margin-top:16px">
    <div class="kartBaslik" style="margin-bottom:10px">${esc(seciliGun)}${seciliGun===bugunStr?' (bugün)':''} — ${seciliKayitlar.length} bakım</div>`;
  if (seciliKayitlar.length === 0) {
    h += `<div class="bosMetin">Bu tarihte planlı bakım yok.</div>`;
  } else {
    seciliKayitlar.forEach(x => {
      const renk = x.durum.durum==='gecti' ? 'var(--kirmizi)' : x.durum.durum==='yaklasiyor' ? 'var(--vurgu)' : 'var(--yesil)';
      const yer = x.pompa ? `${x.tesis} / ${x.makine} / ${x.pompa}` : `${x.tesis} / ${x.makine}`;
      h += `<div class="ayarSatiri ty-btn" style="border-left:3px solid ${renk}" onclick="bakimTesisAcKapat('${x.tesisId}'); bakimMakineAcKapat('${x.makineId}'); ${x.pompaId?`bakimPompaAcKapat('${x.pompaId}');`:''} bakimGorunumDegistir('liste')">
        <span style="flex:1">
          <div style="color:var(--yazi);font-size:13px;font-weight:600">${esc(x.bakim.ad)}</div>
          <div style="color:var(--yazi-soluk);font-size:11.5px">${esc(yer)}</div>
        </span>
        <span style="color:${renk};font-size:11.5px;font-weight:600">${x.durum.durum==='gecti' ? `${Math.abs(x.durum.gunKaldi)} gün gecikti` : `${x.durum.gunKaldi} gün kaldı`}</span>
      </div>`;
    });
  }
  h += `</div>`;
  return h;
}

function renderBakim(){
    let h = `<div class="pompaBaslikSatir" style="margin-bottom:4px">
      <div>
        <div class="pompaAdBaslik">Periyodik Bakım</div>
        <div class="altBaslik2">tesis ve makine bazında bakım planı</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="ty-btn raporFiltreBtn ${(!ui.bakimGorunum||ui.bakimGorunum==='liste')?'raporFiltreBtnAktif':''}" onclick="bakimGorunumDegistir('liste')">📋 Liste</button>
        <button class="ty-btn raporFiltreBtn ${ui.bakimGorunum==='takvim'?'raporFiltreBtnAktif':''}" onclick="bakimGorunumDegistir('takvim')">📅 Takvim</button>
      </div>
    </div>`;
    if (ui.bakimGorunum === 'takvim') {
      h += renderBakimTakvimi();
      anaPanelYaz(h);
      return;
    }
    erisilenTesisler().forEach(t => {
      const acik = ui.bakimAcikTesis.has(t.id);
      const tesisBakimlari = tumBakimlar().filter(x => x.tesisId === t.id);
      const tesisGecti = tesisBakimlari.filter(x => x.durum.durum === 'gecti').length;
      const tesisYaklasan = tesisBakimlari.filter(x => x.durum.durum === 'yaklasiyor').length;
      const tesisDurumRenk = tesisGecti > 0 ? 'var(--kirmizi)' : tesisYaklasan > 0 ? 'var(--vurgu)' : null;
      const tesisDurumRgb = tesisGecti > 0 ? 'var(--kirmizi-rgb)' : 'var(--vurgu-rgb)';
      const tesisPlanSayisi = (t.makineler||[]).reduce((n,mk)=> n + (mk.bakimlar||[]).length + (mk.pompalar||[]).reduce((pn,pp)=>pn+(pp.bakimlar||[]).length,0), 0);
      h += `<div class="tesisKart" ${tesisDurumRenk?`style="border-color:rgba(${tesisDurumRgb},0.5)"`:''}>
        <div class="tesisBaslikSatir" style="${tesisDurumRenk?`background:rgba(${tesisDurumRgb},0.08);border-left:3px solid ${tesisDurumRenk}`:''}" onclick="bakimTesisAcKapat('${t.id}')">
          <span class="okBuyuk" style="transform:${acik?'rotate(90deg)':'none'}">›</span>
          <span class="tesisIkon">🏭</span>
          <span class="tesisAdMetin" style="${tesisDurumRenk?`color:${tesisDurumRenk};font-weight:700`:''}">${esc(t.ad)}</span>
          ${tesisPlanSayisi ? `<span class="bosMetin" style="font-style:normal;flex-shrink:0">${tesisPlanSayisi} plan</span>` : ''}
          ${tesisDurumRenk ? `<span class="islemRozet" style="color:${tesisDurumRenk};background:rgba(${tesisDurumRgb},0.15);border-color:rgba(${tesisDurumRgb},0.5);margin-bottom:0">⚠ ${tesisGecti>0?`${tesisGecti} gecikti`:''}${tesisGecti>0&&tesisYaklasan>0?' · ':''}${tesisYaklasan>0?`${tesisYaklasan} yaklaşıyor`:''}</span>` : ''}
        </div>`;
      if (acik) {
        (t.makineler || []).forEach(m => {
          const makineAcik = ui.bakimAcikMakine.has(m.id);
          const makineBakimlari = tumBakimlar().filter(x => x.tesisId === t.id && x.makineId === m.id);
          const makineGecti = makineBakimlari.filter(x => x.durum.durum === 'gecti').length;
          const makineYaklasan = makineBakimlari.filter(x => x.durum.durum === 'yaklasiyor').length;
          const makineDurumRenk = makineGecti > 0 ? 'var(--kirmizi)' : makineYaklasan > 0 ? 'var(--vurgu)' : null;
          const makineDurumRgb = makineGecti > 0 ? 'var(--kirmizi-rgb)' : 'var(--vurgu-rgb)';
          const makinePlanSayisi = (m.bakimlar||[]).length + (m.pompalar||[]).reduce((pn,pp)=>pn+(pp.bakimlar||[]).length,0);
          h += `<div class="makineSatir" style="${makineDurumRenk?`background:rgba(${makineDurumRgb},0.08);border-left:3px solid ${makineDurumRenk}`:''}" onclick="bakimMakineAcKapat('${m.id}')">
            <span class="okBuyuk" style="transform:${makineAcik?'rotate(90deg)':'none'}">›</span>
            <span class="tesisIkon" style="font-size:15px">⚙</span>
            <span class="makineAdMetin" style="${makineDurumRenk?`color:${makineDurumRenk};font-weight:700`:''}">${esc(m.ad)}</span>
            ${makinePlanSayisi ? `<span class="bosMetin" style="font-style:normal;flex-shrink:0">${makinePlanSayisi} plan</span>` : ''}
            ${makineDurumRenk ? `<span class="islemRozet" style="color:${makineDurumRenk};background:rgba(${makineDurumRgb},0.15);border-color:rgba(${makineDurumRgb},0.5);margin-bottom:0">⚠ ${makineGecti>0?`${makineGecti} gecikti`:''}${makineGecti>0&&makineYaklasan>0?' · ':''}${makineYaklasan>0?`${makineYaklasan} yaklaşıyor`:''}</span>` : ''}
          </div>`;
          if (makineAcik) {
            h += `<div class="acilirIcerik" style="padding:10px 14px 16px 54px">`;
            h += `<div class="kartBaslik" style="margin-bottom:8px">Pompalar (alt birimler) — her birinin kendi bakım planı</div>`;
            if ((m.pompalar||[]).length === 0) {
              h += `<div class="bosMetin" style="margin-bottom:14px">Bu makinede henüz pompa eklenmedi.</div>`;
            } else {
              (m.pompalar||[]).forEach(p => {
                const pompaAcik = ui.bakimAcikPompa.has(p.id);
                const pUyari = (p.bakimlar||[]).some(b => b.ad && (bakimDurum(b).durum==='gecti' || bakimDurum(b).durum==='yaklasiyor'));
                h += `<div class="pompaBakimSatir ty-node" onclick="bakimPompaAcKapat('${p.id}')">
                  <span class="okBuyuk" style="transform:${pompaAcik?'rotate(90deg)':'none'}">›</span>
                  <span class="pompaNokta">●</span>
                  <span class="pompaAdMetin" style="flex:1">${esc(p.ad) || '(isimsiz)'}</span>
                  ${pUyari ? `<span class="kritikNokta" title="Yaklaşan/geçmiş bakım var">●</span>` : ''}
                  ${(p.bakimlar||[]).length ? `<span class="bosMetin" style="font-style:normal">${p.bakimlar.length} plan</span>` : ''}
                </div>`;
                if (pompaAcik) {
                  h += `<div class="acilirIcerik" style="padding:8px 0 14px 30px">`;
                  if ((p.bakimlar||[]).length === 0) h += `<div class="bosMetin">Bu pompa için henüz bakım planı eklenmedi.</div>`;
                  else h += `<div class="kalemBaslikSatir" style="padding-left:0">
                    <span style="flex:1.3">Bakım adı</span><span style="width:95px">Periyot (gün)</span><span style="width:95px">Uyarı (gün)</span><span style="width:110px">Son yapılma</span><span style="width:140px">Sonraki tarih</span><span style="width:130px"></span>
                  </div>`;
                  (p.bakimlar || []).forEach(b => {
                    const d = bakimDurum(b);
                    const renk = d.durum==='gecti' ? 'var(--kirmizi)' : d.durum==='yaklasiyor' ? 'var(--vurgu)' : 'var(--yesil)';
                    const metin = d.durum==='gecti' ? `${Math.abs(d.gunKaldi)} gün gecikti` : d.durum==='yaklasiyor' ? `${d.gunKaldi} gün kaldı` : d.gunKaldi!=null ? `${d.gunKaldi} gün kaldı` : '—';
                    h += `<div class="stokUrunSatirTek">
                      <input class="parcaGirdi" style="flex:1.3" list="malzemeListesi" placeholder="Örn: Rulman değişimi" value="${esc(b.ad)}" onchange="bakimPompaGuncelle('${t.id}','${m.id}','${p.id}','${b.id}','ad',this.value)" />
                      <input class="parcaGirdi" style="width:95px;flex:none" type="number" min="1" value="${esc(b.periyotGun)}" onchange="bakimPompaGuncelle('${t.id}','${m.id}','${p.id}','${b.id}','periyotGun',this.value)" />
                      <input class="parcaGirdi" style="width:95px;flex:none" type="number" min="1" title="Bu bakım için kaç gün kala uyarı çıksın" value="${esc(b.uyariGunu||15)}" onchange="bakimPompaGuncelle('${t.id}','${m.id}','${p.id}','${b.id}','uyariGunu',this.value)" />
                      <input class="parcaGirdi" style="width:110px;flex:none;font-family:'JetBrains Mono',monospace" placeholder="gg.aa.yyyy" value="${esc(b.sonYapilmaTarihi)}" onchange="bakimPompaGuncelle('${t.id}','${m.id}','${p.id}','${b.id}','sonYapilmaTarihi',this.value)" />
                      <div style="width:140px;flex:none">
                        <div style="color:${renk};font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600">${d.tarih}</div>
                        <div style="color:${renk};font-size:11px">${metin}</div>
                      </div>
                      <div style="width:130px;flex:none;display:flex;gap:6px">
                        <button class="ty-btn stokKullanBtn" style="font-size:11px;padding:7px 10px" onclick="bakimPompaYapildiIsaretle('${t.id}','${m.id}','${p.id}','${b.id}')">Yapıldı</button>
                        <span class="silIkon" onclick="silOnayla('Bakım Planını Sil', ()=>bakimPompaSil('${t.id}','${m.id}','${p.id}','${b.id}'))">×</span>
                      </div>
                    </div>`;
                  });
                  h += `<button class="ekleMini ty-btn" style="margin-top:8px" onclick="bakimPompaEkle('${t.id}','${m.id}','${p.id}')">+ bu pompaya bakım planı ekle</button>`;
                  h += `</div>`;
                }
              });
            }
            h += `<div class="kartBaslik" style="margin:18px 0 8px">Makineye ait genel bakım planları</div>`;
            if ((m.bakimlar||[]).length === 0) h += `<div class="bosMetin">Henüz genel bakım planı eklenmedi.</div>`;
            else h += `<div class="kalemBaslikSatir" style="padding-left:0">
              <span style="flex:1.3">Bakım adı</span><span style="width:95px">Periyot (gün)</span><span style="width:95px">Uyarı (gün)</span><span style="width:110px">Son yapılma</span><span style="width:140px">Sonraki tarih</span><span style="width:130px"></span>
            </div>`;
            (m.bakimlar || []).forEach(b => {
              const d = bakimDurum(b);
              const renk = d.durum==='gecti' ? 'var(--kirmizi)' : d.durum==='yaklasiyor' ? 'var(--vurgu)' : 'var(--yesil)';
              const metin = d.durum==='gecti' ? `${Math.abs(d.gunKaldi)} gün gecikti` : d.durum==='yaklasiyor' ? `${d.gunKaldi} gün kaldı` : d.gunKaldi!=null ? `${d.gunKaldi} gün kaldı` : '—';
              h += `<div class="stokUrunSatirTek">
                <input class="parcaGirdi" style="flex:1.3" list="malzemeListesi" placeholder="Örn: Genel yağlama" value="${esc(b.ad)}" onchange="bakimGuncelle('${t.id}','${m.id}','${b.id}','ad',this.value)" />
                <input class="parcaGirdi" style="width:95px;flex:none" type="number" min="1" value="${esc(b.periyotGun)}" onchange="bakimGuncelle('${t.id}','${m.id}','${b.id}','periyotGun',this.value)" />
                <input class="parcaGirdi" style="width:95px;flex:none" type="number" min="1" title="Bu bakım için kaç gün kala uyarı çıksın" value="${esc(b.uyariGunu||15)}" onchange="bakimGuncelle('${t.id}','${m.id}','${b.id}','uyariGunu',this.value)" />
                <input class="parcaGirdi" style="width:110px;flex:none;font-family:'JetBrains Mono',monospace" placeholder="gg.aa.yyyy" value="${esc(b.sonYapilmaTarihi)}" onchange="bakimGuncelle('${t.id}','${m.id}','${b.id}','sonYapilmaTarihi',this.value)" />
                <div style="width:140px;flex:none">
                  <div style="color:${renk};font-family:'JetBrains Mono',monospace;font-size:12.5px;font-weight:600">${d.tarih}</div>
                  <div style="color:${renk};font-size:11px">${metin}</div>
                </div>
                <div style="width:130px;flex:none;display:flex;gap:6px">
                  <button class="ty-btn stokKullanBtn" style="font-size:11px;padding:7px 10px" onclick="bakimYapildiIsaretle('${t.id}','${m.id}','${b.id}')">Yapıldı</button>
                  <span class="silIkon" onclick="silOnayla('Bakım Planını Sil', ()=>bakimSil('${t.id}','${m.id}','${b.id}'))">×</span>
                </div>
              </div>`;
            });
            h += `<button class="ekleMini ty-btn" style="margin-top:8px" onclick="bakimEkle('${t.id}','${m.id}')">+ genel bakım planı ekle</button>`;
            h += `</div>`;
          }
        });
      }
      h += `</div>`;
    });
    anaPanelYaz(h);
    return;
}
