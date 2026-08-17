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
});

/* ---------------- tesis / makine / pompa ---------------- */
