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
    if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
      bildirimPaneliAcik = false;
      panel.style.display = "none";
    }
  });
  document.addEventListener("click", (e) => {
    if (!genelAramaPaneliAcikMi) return;
    const panel = document.getElementById("genelAramaPaneli");
    const btn = document.getElementById("aramaBtn");
    if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
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
