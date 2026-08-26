/* ---------------- depolar arası transfer ---------------- */
function transferGoster(){ if (!izinVar('transfer')) return; ui.view = "transfer"; render(); }
function transferTesisSec(tesisId){ ui.transferTesisId = tesisId; ui.transferDepoId = ""; ui.transferUrunId = ""; render(); }
function transferDepoSec(depoId){ ui.transferDepoId = depoId; ui.transferUrunId = ""; render(); }
function transferUrunSec(id){ ui.transferUrunId = id; render(); }
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
  if (!ui.transferUrunId) { toastGoster("Lütfen bir ürün seçin.", "hata"); return; }
  if (!miktar || miktar <= 0) { toastGoster("Lütfen geçerli bir miktar girin.", "hata"); return; }
  if (!hd) { toastGoster("Lütfen hedef tesis ve depo seçin.", "hata"); return; }
  if (kt.id === ht.id && kd.id === hd.id) { toastGoster("Kaynak ve hedef depo aynı olamaz.", "hata"); return; }
  // ÖNEMLİ: ürün, isme göre değil KİMLİĞE (id) göre bulunuyor — aynı depoda aynı isimde
  // ama farklı kodlu birden fazla ürün olsa bile (örn. iki ayrı "Rulman" satırı, 6205 ve
  // 6305), her zaman ekranda seçilen TAM O ürün transfer edilir, yanlış kodlu ürün gitmez.
  const urun = kd.urunler.find(u => u.id === ui.transferUrunId);
  if (!urun) { toastGoster("Seçilen ürün kaynak depoda bulunamadı.", "hata"); return; }
  const mevcutMiktar = parseFloat(urun.miktar) || 0;
  if (miktar > mevcutMiktar) { toastGoster("Depoda bu kadar stok yok.", "hata"); return; }
  urun.miktar = mevcutMiktar - miktar;
  const transfer = {
    id: uid(), kaynakTesisId: kt.id, kaynakTesisAdi: kt.ad, kaynakDepoId: kd.id, kaynakDepoAdi: kd.ad,
    urunAdi: urun.ad, kod: urun.kod || "", birim: urun.birim || "", miktar,
    hedefTesisId: ht.id, hedefTesisAdi: ht.ad, hedefDepoId: hd.id, hedefDepoAdi: hd.ad,
    durum: "bekliyor", gonderenTarih: bugun(), gonderenSaat: suAn()
  };
  state.transferler.unshift(transfer);
  kaydetIslem(`Transfer gönderildi: ${urun.ad} (${miktar} ${urun.birim||''}) — ${kt.ad}/${kd.ad} → ${ht.ad}/${hd.ad}`, { view: "transfer", tesisId: kt.id });
  toastGoster("Transfer gönderildi.", "basari");
  ui.transferUrunId = ""; ui.transferMiktar = "";
  saveData(); render();
}
function transferKabulEt(transferId, hedefDepoId){
  const tr = state.transferler.find(x => x.id === transferId); if (!tr || tr.durum !== "bekliyor") return;
  const ht = state.tesisler.find(x => x.id === tr.hedefTesisId);
  const hd = ht?.depolar.find(x => x.id === (hedefDepoId || tr.hedefDepoId));
  if (!hd) { toastGoster("Lütfen bir depo seçin.", "hata"); return; }
  const mevcut = hd.urunler.find(u => urunEslesiyorMu(u, tr.urunAdi, tr.kod));
  if (mevcut) { mevcut.miktar = (parseFloat(mevcut.miktar)||0) + tr.miktar; if (tr.kod && !mevcut.kod) mevcut.kod = tr.kod; }
  else hd.urunler.push({ id: uid(), ad: tr.urunAdi, kod: tr.kod || "", miktar: tr.miktar, birim: tr.birim, kritikTakip: false, kritikEsik: 0 });
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
    const urun = kd.urunler.find(u => urunEslesiyorMu(u, tr.urunAdi, tr.kod));
    if (urun) { urun.miktar = (parseFloat(urun.miktar)||0) + tr.miktar; if (tr.kod && !urun.kod) urun.kod = tr.kod; }
    else kd.urunler.push({ id: uid(), ad: tr.urunAdi, kod: tr.kod || "", miktar: tr.miktar, birim: tr.birim, kritikTakip:false, kritikEsik:0 });
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
function transferGecmistenSil(id){
  const tr = state.transferler.find(x => x.id === id);
  state.transferler = state.transferler.filter(x => x.id !== id);
  if (tr) kaydetIslem(`Transfer geçmişi kaydı silindi: ${tr.urunAdi}${tr.kod?` (${tr.kod})`:''} (${tr.kaynakTesisAdi} → ${tr.hedefTesisAdi})`, { view: "transfer" });
  saveData(); render();
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
          <div style="color:var(--yazi);font-size:13.5px;font-weight:600">${esc(tr.urunAdi)}${tr.kod?` · ${esc(tr.kod)}`:''} — ${esc(tr.miktar)} ${esc(tr.birim||'')}</div>
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
      ${kaynakUrunler.map(u=>`<option value="${u.id}" ${ui.transferUrunId===u.id?'selected':''}>${esc(u.ad)}${u.kod?` · ${esc(u.kod)}`:''} (${esc(u.miktar)} ${esc(u.birim||'')})</option>`).join('')}
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
          <div style="color:var(--yazi);font-size:13px">${esc(tr.urunAdi)}${tr.kod?` · ${esc(tr.kod)}`:''} — ${esc(tr.miktar)} ${esc(tr.birim||'')}</div>
          <div style="color:var(--yazi-soluk);font-size:11.5px">${esc(tr.kaynakTesisAdi)}/${esc(tr.kaynakDepoAdi)} → ${esc(tr.hedefTesisAdi)}${tr.hedefDepoAdi?('/'+esc(tr.hedefDepoAdi)):''}</div>
        </span>
        <span style="color:${renk};font-size:11.5px;font-weight:600;text-transform:capitalize">${esc(tr.durum)}</span>
        ${tr.durum==='bekliyor' && erisilenIdler.includes(tr.kaynakTesisId) ? `<span class="silIkon" style="margin-left:8px" onclick="silOnayla('Transferi İptal Et', ()=>transferIptalEt('${tr.id}'))" title="İptal et">×</span>` : ''}
        ${tr.durum!=='bekliyor' && adminMi() ? `<span class="silIkon" style="margin-left:8px" onclick="silOnayla('Transfer Kaydını Sil', ()=>transferGecmistenSil('${tr.id}'))" title="Geçmişten sil">×</span>` : ''}
      </div>`;
    });
    h += `</div>`;
  }

  anaPanelYaz(h);
}
