let raporForm = { tesisId: "", makineId: "", pompaId: "", tarih: bugun(), sebep: "", is: "", gecmiseDonuk: false, malzemeler: [{ id: uid(), ad: "", kod: "", adet: 1, birim: "adet", onemliDegil: false }] };
function raporGoster(){
  if (!izinVar('raporEkle')) return;
  raporForm = { tesisId: erisilenTesisler()[0]?.id || "", makineId: "", pompaId: "", tarih: bugun(), sebep: "", is: "", gecmiseDonuk: false, malzemeler: [{ id: uid(), ad: "", kod: "", adet: 1, birim: "adet", onemliDegil: false }] };
  if (raporForm.tesisId) {
    const t = state.tesisler.find(x => x.id === raporForm.tesisId);
    raporForm.makineId = t?.makineler[0]?.id || "";
    const m = t?.makineler.find(x => x.id === raporForm.makineId);
    raporForm.pompaId = m?.pompalar[0]?.id || "";
  }
  ui.view = "rapor"; render();
}
function raporTesisSec(tesisId){
  raporForm.tesisId = tesisId;
  const t = state.tesisler.find(x => x.id === tesisId);
  raporForm.makineId = t?.makineler[0]?.id || "";
  const m = t?.makineler.find(x => x.id === raporForm.makineId);
  raporForm.pompaId = m?.pompalar[0]?.id || "";
  render();
}
function raporMakineSec(makineId){
  raporForm.makineId = makineId;
  const t = state.tesisler.find(x => x.id === raporForm.tesisId);
  const m = t?.makineler.find(x => x.id === makineId);
  raporForm.pompaId = m?.pompalar[0]?.id || "";
  render();
}
function raporPompaSec(pompaId){ raporForm.pompaId = pompaId; render(); }
function raporAlanGuncelle(alan, deger){ raporForm[alan] = deger; }
function raporGecmiseDonukDegistir(deger){ raporForm.gecmiseDonuk = deger; render(); }
function raporMalzemeEkle(){ raporForm.malzemeler.push({ id: uid(), ad: "", kod: "", adet: 1, birim: "adet", onemliDegil: false }); render(); }
function raporMalzemeSil(id){ raporForm.malzemeler = raporForm.malzemeler.filter(x => x.id !== id); render(); }
function raporMalzemeGuncelle(id, alan, deger){
  const x = raporForm.malzemeler.find(x => x.id === id); if (x) x[alan] = deger;
  render();
}
function raporKaydet(){
  const t = state.tesisler.find(x => x.id === raporForm.tesisId);
  const m = t?.makineler.find(x => x.id === raporForm.makineId);
  const p = m?.pompalar.find(x => x.id === raporForm.pompaId);
  if (!t || !m || !p) { toastGoster("Lütfen tesis, makine ve pompa seçin.", "hata"); return; }
  const tarih = raporForm.tarih || bugun();
  const kullanilanlar = raporForm.malzemeler
    .map(x => ({ id: uid(), ad: x.ad.trim(), kod: (x.kod||"").trim(), adet: x.adet || 1, birim: x.birim || "adet", onemliDegil: !!x.onemliDegil }))
    .filter(x => x.ad);

  kullanilanlar.forEach(({ ad, birim, kod }) => malzemeGecmisineEkle(ad, birim, kod));

  const aciklama = raporForm.sebep ? `${raporForm.sebep}: ${raporForm.is}` : raporForm.is;
  p.gecmis.unshift({ id: uid(), tarih, aciklama: aciklama.trim() || "—", malzemeler: kullanilanlar });

  kaydetIslem(`Rapor eklendi: ${p.ad} (${t.ad} / ${m.ad})`, { view: "pompa", tesisId: t.id, makineId: m.id, pompaId: p.id });

  // "Önemli değil" işaretlenmeyen malzemelerden, bu tesisin depolarında adı eşleşen
  // bir ürün varsa, stoktan düşülmesi için malzemeCikis yetkisi olanlara bildirim gönder.
  // Eşleşen ürün YOKSA, muhtemelen depoya eklemeyi unutmuşlardır — o ürünü otomatik
  // olarak EKSİ miktarla (örn. -2) depoya ekleyip kritik olarak işaretliyoruz, böylece
  // Stok Listesi'nde çok belirgin bir uyarı olarak görünür; stokListesi yetkisi
  // olanlara da bildirim gidiyor ki gerçek miktarı girip düzeltsinler.
  // "Geçmişe dönük" işaretlenen raporlarda (eski evrak işleme) bu blok TAMAMEN atlanır —
  // raporu giren kişi bunun güncel stoğu etkilemesini istemiyorsa bunu kontrol edebilir.
  if (!raporForm.gecmiseDonuk) {
    const gorunurDepolar = (t.depolar || []).filter(d => !d.gizli);
    kullanilanlar.filter(x => !x.onemliDegil).forEach(x => {
      const adAlt = x.ad.toLowerCase();
      const eslesenDepo = gorunurDepolar.find(d => (d.urunler||[]).some(u => (u.ad||"").trim().toLowerCase() === adAlt));
      if (eslesenDepo) {
        kaydetIslem(
          `Depoda malzeme kullanıldı, stoktan düşülmeli: ${x.adet} ${x.birim} ${x.ad} (${eslesenDepo.ad} — ${t.ad})`,
          { view: "malzemecikis", tesisId: t.id, depoId: eslesenDepo.id }
        );
      } else if (gorunurDepolar.length > 0) {
        const hedefDepo = gorunurDepolar[0];
        const miktarSayi = parseFloat(x.adet) || 1;
        hedefDepo.urunler = hedefDepo.urunler || [];
        hedefDepo.urunler.push({
          id: uid(), ad: x.ad, kod: x.kod, miktar: -miktarSayi, birim: x.birim,
          kritikTakip: true, kritikEsik: 0
        });
        kaydetIslem(
          `Depoda kayıtlı olmayan malzeme kullanıldı, stoğa eksi (-${miktarSayi}) olarak eklendi: ${x.ad} (${hedefDepo.ad} — ${t.ad}). Lütfen gerçek stok miktarını girin.`,
          { view: "stok", tesisId: t.id, depoId: hedefDepo.id }
        );
      }
    });
  }

  saveData();
  toastGoster("Rapor kaydedildi.", "basari");
  pompaSec(t.id, m.id, p.id);
}

/* ---------------- satın alma ---------------- */

function renderRapor(){
    const t = state.tesisler.find(x => x.id === raporForm.tesisId);
    const m = t?.makineler.find(x => x.id === raporForm.makineId);

    let h = `<div class="pompaAdBaslik">Rapor Ekle</div><div class="altBaslik2" style="margin-bottom:20px">bir tesis / makine / pompa için yapılan işi kaydet</div>`;


    h += `<div class="kart">
      <div class="kartBaslik" style="margin-bottom:10px">Konum</div>
      <div style="display:flex;gap:10px;margin-bottom:10px">
        <div style="flex:1">
          <div class="bosMetin" style="margin-bottom:5px;font-style:normal">Tesis</div>
          <select class="girdi" onchange="raporTesisSec(this.value)">
            ${erisilenTesisler().map(x => `<option value="${x.id}" ${x.id===raporForm.tesisId?'selected':''}>${esc(x.ad)}</option>`).join('')}
          </select>
        </div>
        <div style="flex:1">
          <div class="bosMetin" style="margin-bottom:5px;font-style:normal">Makine</div>
          <select class="girdi" onchange="raporMakineSec(this.value)">
            ${(t?.makineler || []).map(x => `<option value="${x.id}" ${x.id===raporForm.makineId?'selected':''}>${esc(x.ad)}</option>`).join('')}
          </select>
        </div>
        <div style="flex:1">
          <div class="bosMetin" style="margin-bottom:5px;font-style:normal">Pompa</div>
          <select class="girdi" onchange="raporPompaSec(this.value)">
            ${(m?.pompalar || []).map(x => `<option value="${x.id}" ${x.id===raporForm.pompaId?'selected':''}>${esc(x.ad)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="width:160px">
        <div class="bosMetin" style="margin-bottom:5px;font-style:normal">Tarih</div>
        <input class="girdi" placeholder="gg.aa.yyyy" value="${esc(raporForm.tarih)}" onchange="raporAlanGuncelle('tarih', this.value)" />
      </div>
    </div>`;

    h += `<div class="kart" style="${raporForm.gecmiseDonuk?'border-color:rgba(var(--turkuaz-rgb),0.45);background:rgba(var(--turkuaz-rgb),0.07)':''}">
      <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
        <input type="checkbox" style="margin-top:3px" ${raporForm.gecmiseDonuk?'checked':''} onchange="raporGecmiseDonukDegistir(this.checked)" />
        <span>
          <div style="font-weight:700;color:${raporForm.gecmiseDonuk?'var(--turkuaz)':'var(--yazi)'};font-size:13.5px">📋 Bu geçmişe dönük (eski tarihli) bir kayıt</div>
          <div class="bosMetin" style="margin-top:2px">Eski evrakları işlerken bunu işaretleyin. İşaretlenirse, bu raporda kullanılan malzemeler için depo stoğundan düşme bildirimi gitmez ve eksi stok otomatik oluşmaz — malzemeler yine de bu rapor ve makine geçmişinde normal şekilde görünmeye devam eder.</div>
        </span>
      </label>
    </div>`;

    h += `<div class="kart">
      <div class="kartBaslik" style="margin-bottom:10px">Rapor içeriği</div>
      <div class="bosMetin" style="margin-bottom:5px;font-style:normal">Rapor sebebi</div>
      <input class="girdi" style="margin-bottom:12px" placeholder="Örn: periyodik bakım, arıza müdahalesi" value="${esc(raporForm.sebep)}" onchange="raporAlanGuncelle('sebep', this.value)" />
      <div class="bosMetin" style="margin-bottom:5px;font-style:normal">Yapılan iş</div>
      <textarea class="girdi" rows="4" placeholder="Yapılan işin içeriğini yazın" onchange="raporAlanGuncelle('is', this.value)">${esc(raporForm.is)}</textarea>
    </div>`;

    h += `<div class="kart">
      <div class="kartBaslikSatir"><span class="kartBaslik">Kullanılan malzemeler</span><button class="ekleMini ty-btn" onclick="raporMalzemeEkle()">+ malzeme ekle</button></div>
      <div class="kalemBaslikSatir" style="padding-left:0"><span style="flex:1.4">Malzeme</span><span style="width:130px">Kod</span><span style="width:80px">Miktar</span><span style="width:110px">Birim</span><span style="width:120px">Stok Uyarısı</span><span style="width:20px"></span></div>`;
    raporForm.malzemeler.forEach(x => {
      h += `<div class="parcaSatir" style="${x.onemliDegil?'opacity:.6':''}">
        <input class="parcaGirdi" style="flex:1.4" list="malzemeListesi" placeholder="Malzeme adı (örn: Rulman)" value="${esc(x.ad)}" onchange="raporMalzemeGuncelle('${x.id}','ad',this.value)" />
        <input class="parcaGirdi" style="width:130px;flex:none" placeholder="Kod (örn: 6305)" value="${esc(x.kod)}" onchange="raporMalzemeGuncelle('${x.id}','kod',this.value)" />
        <input class="parcaGirdi" style="width:80px;flex:none" type="number" placeholder="Miktar" value="${esc(x.adet)}" onchange="raporMalzemeGuncelle('${x.id}','adet',this.value)" />
        <select class="parcaGirdi" style="width:110px;flex:none" onchange="raporMalzemeGuncelle('${x.id}','birim',this.value)">
          ${["adet","koli","tane","kg","litre"].map(b => `<option value="${b}" ${x.birim===b?'selected':''}>${b}</option>`).join('')}
        </select>
        <label style="width:120px;flex:none;display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--yazi-soluk);cursor:pointer" title="İşaretlerseniz bu malzeme için depo stoğundan düşülmesi gerektiğine dair kimseye bildirim gitmez. Yine de raporlarda ve makine geçmişinde görünmeye devam eder.">
          <input type="checkbox" ${x.onemliDegil?'checked':''} onchange="raporMalzemeGuncelle('${x.id}','onemliDegil',this.checked)" />
          Önemli değil
        </label>
        <span class="silIkon" onclick="silOnayla('Malzemeyi Sil', ()=>raporMalzemeSil('${x.id}'))">×</span>
      </div>`;
    });
    h += `<div class="bosMetin" style="margin-top:8px">Yazmaya başladığında daha önce kullanılmış malzemeler öneri olarak çıkar. Depoda karşılığı olan bir malzeme yazarsanız, "Önemli değil" işaretlemediğiniz sürece o tesiste stoktan düşme yetkisi olan kişiye otomatik bildirim gider — stok kendiliğinden düşülmez, sadece haber verilir.</div>`;
    h += `</div>`;

    h += `<button class="eklePrimer ty-btn" style="padding:10px 20px;font-size:13.5px" onclick="raporKaydet()">Raporu kaydet</button>`;

    anaPanelYaz(h);
    return;
}
