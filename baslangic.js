window.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("contextmenu", (e) => { e.preventDefault(); });
  try { yaziOlcegiUygula(yaziOlcegiOku()); } catch(e){ console.error(e); }
  try { temaUygula(temaOku()); } catch(e){ console.error(e); }
  try { lambaGuncelle(); } catch(e){ console.error(e); }
  try { if (kumImleciTercihOku()) kumImleciBaslat(); } catch(e){ console.error(e); }
  auth.onAuthStateChanged(user => {
    if (user) girisiTamamla(user);
    else girisEkraniniGoster();
  });
  document.addEventListener("click", (e) => {
    if (!bildirimPaneliAcik) return;
    const panel = document.getElementById("bildirimPaneli");
    const btn = document.getElementById("canBtn");
    // e.target yerine e.composedPath() kullanıyoruz: "Tümünü gör" gibi panel
    // İÇİNDEKİ bir butona tıklayınca panel.innerHTML yeniden yazılıyor (eski
    // buton DOM'dan kopuyor), bu da panel.contains(e.target) kontrolünü
    // yanıltıp paneli "dışarı tıklandı" sanıp anında kapatıyordu. composedPath,
    // tıklama anındaki GERÇEK yayılma yolunu sabit tutar, bu sorunu ortadan kaldırır.
    const yol = e.composedPath ? e.composedPath() : [e.target];
    const icerde = (panel && yol.includes(panel)) || (btn && yol.includes(btn));
    if (panel && btn && !icerde) {
      bildirimPaneliAcik = false;
      panel.style.display = "none";
    }
  });
  document.addEventListener("click", (e) => {
    if (!genelAramaPaneliAcikMi) return;
    const panel = document.getElementById("genelAramaPaneli");
    const btn = document.getElementById("aramaBtn");
    const yol = e.composedPath ? e.composedPath() : [e.target];
    const icerde = (panel && yol.includes(panel)) || (btn && yol.includes(btn));
    if (panel && btn && !icerde) {
      genelAramaPaneliAcikMi = false;
      panel.style.display = "none";
      panel.innerHTML = "";
      ui.genelArama = "";
    }
  });
});

// Gönderilmemiş bir satın alma taslağı varken sekme kapatılır/yenilenirse
// tarayıcı bir onay istesin — aksi halde doldurulan form sessizce kaybolurdu.
window.addEventListener("beforeunload", (e) => {
  if (typeof saTaslak !== "undefined" && saTaslak) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ---------------- tesis / makine / pompa ---------------- */
