/* ---------------- bildirimler ---------------- */
let bildirimPaneliAcik = false;
let bildirimTumunuGoster = false;
let bildirimHedefleri = [];
let ilkBildirimAnimasyonuYapildi = false;

function bildirimSetiOku(anahtarAdi){
  try { return new Set(JSON.parse(localStorage.getItem(anahtarAdi) || "[]")); }
  catch(e){ return new Set(); }
}
function bildirimSetiYaz(anahtarAdi, set){
  try { localStorage.setItem(anahtarAdi, JSON.stringify([...set].slice(-500))); } catch(e){}
}
// X ile kalıcı silinenler — bunlar listeden tamamen çıkar
let bildirimSilinenler = bildirimSetiOku("tys_bildirim_silinen");
// paneli bir kez açıp görmüş olduğun bildirimler — listede kalır, sadece rozet sayısına girmez
let bildirimGorulenler = bildirimSetiOku("tys_bildirim_gorulen");

function bildirimleriTopla(){
  const liste = [];
  (state.sonIslemler || []).filter(k => k.aciklama && k.aciklama.startsWith("Rapor eklendi") && islemGorunurMu(k))
    .slice(0, 15)
    .forEach(k => liste.push({ anahtar: "islem:"+k.id, mesaj: k.aciklama, renk: "var(--vurgu)", hedef: k.hedef }));
  (state.sonIslemler || []).filter(k => k.aciklama && k.aciklama.startsWith("Satın alma durumu değiştirildi") && k.aciklama.endsWith("Geldi"))
    .slice(0, 15)
    .forEach(k => liste.push({ anahtar: "islem:"+k.id, mesaj: k.aciklama, renk: "var(--yesil)", hedef: k.hedef }));
  if (satinAlmaOnaylayabilirMi()) {
    (state.sonIslemler || []).filter(k => k.aciklama && k.aciklama.startsWith("Yeni satın alma talebi oluşturuldu"))
      .slice(0, 15)
      .forEach(k => liste.push({ anahtar: "islem:"+k.id, mesaj: "Onay bekleyen yeni satın alma talebi var.", renk: "var(--mor)", hedef: k.hedef }));
  }
  (state.sonIslemler || []).filter(k => k.aciklama && k.aciklama.startsWith("Satın alma onaylandı"))
    .slice(0, 15)
    .forEach(k => {
      const sat = (k.hedef && k.hedef.satId) ? (state.satinAlmalar||[]).find(s => s.id === k.hedef.satId) : null;
      if (sat && satinAlmaGorunurMu(sat)) liste.push({ anahtar: "islem:"+k.id, mesaj: k.aciklama, renk: "var(--yesil)", hedef: k.hedef });
    });
  kapsamTesisler().forEach(t => (t.depolar||[]).forEach(d => (d.urunler||[]).forEach(u => {
    if (u.kritikTakip && (parseFloat(u.miktar)||0) <= (parseFloat(u.kritikEsik)||0)) {
      liste.push({ anahtar: "kritik:"+t.id+":"+d.id+":"+u.id, mesaj: `Kritik stok: ${u.ad || '(isimsiz)'} (${d.ad} — ${t.ad})`, renk: "var(--kirmizi)", hedef: { view: "stok", tesisId: t.id, depoId: d.id } });
    }
  })));
  tumBakimlar().filter(x => x.durum.durum === "gecti" || x.durum.durum === "yaklasiyor").forEach(x => {
    const renk = x.durum.durum === "gecti" ? "var(--kirmizi)" : "var(--vurgu)";
    const yer = x.pompa ? `${x.tesis} / ${x.makine} / ${x.pompa}` : `${x.tesis} / ${x.makine}`;
    const hedef = x.pompaId ? { view: "bakim", tesisId: x.tesisId, makineId: x.makineId, pompaId: x.pompaId } : { view: "bakim", tesisId: x.tesisId, makineId: x.makineId };
    liste.push({ anahtar: "bakim:"+x.tesisId+":"+x.makineId+":"+(x.pompaId||'')+":"+x.bakim.id, mesaj: `${x.durum.durum==='gecti'?'Bakım gecikti':'Bakım yaklaşıyor'}: ${x.bakim.ad} (${yer})`, renk, hedef });
  });
  return liste.filter(b => !bildirimSilinenler.has(b.anahtar));
}
function bildirimSil(anahtar){
  bildirimSilinenler.add(anahtar);
  bildirimSetiYaz("tys_bildirim_silinen", bildirimSilinenler);
  bildirimGuncelle();
}
function bildirimGuncelle(){
  const rozet = document.getElementById("canRozet");
  if (!rozet) return;
  const liste = bildirimleriTopla();
  const yeniSayi = liste.filter(b => !bildirimGorulenler.has(b.anahtar)).length;
  if (yeniSayi > 0) { rozet.textContent = yeniSayi > 99 ? "99+" : yeniSayi; rozet.style.display = ""; }
  else rozet.style.display = "none";
  if (bildirimPaneliAcik) bildirimPaneliRender();
  if (!ilkBildirimAnimasyonuYapildi) {
    ilkBildirimAnimasyonuYapildi = true;
    const ikon = document.getElementById("canIkonu");
    if (ikon) { ikon.classList.remove("canAnimasyon"); void ikon.offsetWidth; ikon.classList.add("canAnimasyon"); }
  }
}
function bildirimPaneliAcKapat(){
  bildirimPaneliAcik = !bildirimPaneliAcik;
  const panel = document.getElementById("bildirimPaneli");
  if (!panel) return;
  if (bildirimPaneliAcik) {
    bildirimTumunuGoster = false;
    bildirimPaneliRender();
    panel.style.display = "block";
    // bir kez görülen bildirim listede kalır, sadece rozet sayısından düşer — kalıcı olarak localStorage'a yazılır
    const guncelListe = bildirimleriTopla();
    guncelListe.forEach(b => bildirimGorulenler.add(b.anahtar));
    bildirimSetiYaz("tys_bildirim_gorulen", bildirimGorulenler);
    bildirimGuncelle();
  }
  else panel.style.display = "none";
}
function bildirimTumunuGosterAc(){
  bildirimTumunuGoster = true;
  bildirimPaneliRender();
}
function bildirimPaneliRender(){
  const panel = document.getElementById("bildirimPaneli");
  if (!panel) return;
  const tamListe = bildirimleriTopla();
  const liste = bildirimTumunuGoster ? tamListe : tamListe.slice(0, 10);
  bildirimHedefleri = liste.map(b => b.hedef);
  let h = `<div class="bildirimBaslikSatir">Son İşlemler</div>`;
  if (liste.length === 0) h += `<div class="bosMetin" style="padding:14px">Henüz bir bildirim yok.</div>`;
  else liste.forEach((b, i) => {
    const yeniMi = !bildirimGorulenler.has(b.anahtar);
    h += `<div class="bildirimSatir" onclick="bildirimeTikla(${i})">
      <span class="bildirimNokta" style="color:${b.renk}">${yeniMi ? '●' : '○'}</span>
      <span style="flex:1;font-size:12.5px;color:var(--yazi-ikincil)">${esc(b.mesaj)}</span>
      <span class="bildirimSilBtn" title="Bildirimi kaldır" onclick="event.stopPropagation(); bildirimSil('${b.anahtar}')">×</span>
    </div>`;
  });
  if (!bildirimTumunuGoster && tamListe.length > 10) {
    h += `<div class="bildirimTumunuGorBtn ty-btn" onclick="bildirimTumunuGosterAc()">Tümünü gör (${tamListe.length})</div>`;
  }
  panel.innerHTML = h;
}
function bildirimeTikla(i){
  const hedef = bildirimHedefleri[i];
  bildirimPaneliAcik = false;
  const panel = document.getElementById("bildirimPaneli");
  if (panel) panel.style.display = "none";
  hedefeGit(hedef);
}
