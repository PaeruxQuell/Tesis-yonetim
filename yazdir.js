/* ---------------- satın alma talep formu — yazdırma görünümü ---------------- */
// Şirketin resmi "SATINALMA TALEP FORMU" kağıt formuna BİREBİR (gerçek belgeden
// piksel bazında ölçülmüş sütun oranları ve gerçek logo görseliyle) uyacak
// şekilde, tek sayfaya sığan, doğrudan yazdırılabilir bir görünüm üretir.

const SATINALMA_FORM_LOGO = "data:image/jpeg;base64,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";

function satinAlmaYazdir(satId){
  const sat = satinAlmaBul(satId);
  if (!sat) { toastGoster("Satın alma bulunamadı.", "hata"); return; }
  const pencere = window.open("", "_blank");
  if (!pencere) { toastGoster("Yazdırma sayfası açılamadı — tarayıcınız açılır pencereleri engellemiş olabilir.", "hata"); return; }
  pencere.document.open();
  pencere.document.write(satinAlmaYazdirHTML(sat));
  pencere.document.close();
}

function satinAlmaYazdirHTML(sat){
  const kalemler = sat.kalemler || [];
  // Formda 16 satırlık bir tablo var — kalem sayısı azsa kalanları boş bırakıyoruz,
  // kalem sayısı fazlaysa (form tek sayfaya sığsın diye) 16'ya sabit kalıyoruz ve
  // taşanları tabloya sığdırmak için satır sayısını olduğu gibi kullanıyoruz.
  const MIN_SATIR = 16;
  const satirSayisi = Math.max(MIN_SATIR, kalemler.length);
  let kalemSatirlari = "";
  for (let i = 0; i < satirSayisi; i++){
    const k = kalemler[i];
    kalemSatirlari += `<tr>
      <td class="ortali">${k ? (i+1) : ''}</td>
      <td class="sol">${k ? esc(`${k.urun||''}${k.kod?' — '+k.kod:''}`) : ''}</td>
      <td class="ortali">${k ? esc(k.miktar||'') : ''}</td>
      <td class="ortali">${k ? esc(k.birim||'') : ''}</td>
      <td class="ortali">${k && k.durum==='Geldi' ? esc(k.gelisTarihi||'') : ''}</td>
    </tr>`;
  }

  const yerler = (sat.yerler || []).map(y => y.ad).filter(Boolean);
  const YER_SATIR = 5;
  let yerSatirlari = "";
  for (let i = 0; i < YER_SATIR; i++){
    yerSatirlari += `<tr><td class="dar"></td><td class="genis">${esc(yerler[i] || "")}</td></tr>`;
  }

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Satınalma Talep Formu — ${esc(sat.siparisNo || sat.id)}</title>
<style>
  @page { size: A4; margin: 10mm; }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body { font-family: 'Times New Roman', Georgia, serif; color: #000; margin: 0; padding: 0; font-size: 12px; }
  .sayfa { width: 100%; border: 1.5px solid #000; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }

  /* Üst başlık: logo | başlık | doküman bilgileri — gerçek belgeden ölçülen oranlar */
  .ustTablo td { border: 1px solid #000; vertical-align: middle; padding: 4px 8px; }
  .logoHucre { width: 31.6%; text-align: center; padding: 10px; }
  .logoHucre img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
  .baslikHucre { width: 39.3%; text-align: center; font-size: 17px; font-weight: 700; }
  .metaHucre { width: 29.1%; font-size: 10.5px; line-height: 1.75; padding: 6px 10px; }
  .metaHucre b { display: inline-block; width: 60px; }

  .altBaslikSatir td { border: 1px solid #000; border-top: none; padding: 4px 10px; font-size: 11.5px; }
  .altBaslikSatir .etiket { width: 30%; text-align: center; }
  .altBaslikSatir .deger { width: 20%; text-align: center; }

  .kalemTablo { border-top: none; }
  .kalemTablo th { border: 1px solid #000; padding: 3px; font-size: 10.5px; font-weight: 700; }
  .kalemTablo td { border: 1px solid #000; padding: 1px 5px; font-size: 10.5px; height: 15px; }
  .kalemTablo td.ortali { text-align: center; }
  .kalemTablo td.sol { text-align: left; }
  .thSno { width: 5.8%; } .thMalzeme { width: 58.7%; text-align:center; } .thMiktar { width: 10.3%; } .thBirim { width: 9.1%; } .thTeslim { width: 16.1%; }

  .bolumBaslik td { border: 1px solid #000; border-top: none; padding: 4px; text-align: center; font-weight: 700; font-size: 11px; }
  .bolumTablo td { border: 1px solid #000; border-top: none; padding: 1px 6px; font-size: 10.5px; height: 15px; }
  .bolumTablo td.dar { width: 5.8%; }
  .bolumTablo td.genis { width: 94.2%; }

  .imzaTablo td { border: 1px solid #000; border-top: none; padding: 6px 8px 4px; width: 50%; text-align: center; vertical-align: top; font-size: 11px; font-weight: 700; }
  .imzaAdSatiri td { border: 1px solid #000; border-top: none; padding: 4px 8px 8px; width: 50%; text-align: center; }
  .imzaAd { font-weight: 700; font-size: 11px; }
  .imzaUnvan { font-style: italic; font-size: 10.5px; }

  .yazdirBtn { margin: 10px auto; display: block; padding: 9px 20px; font-size: 13px; cursor: pointer; }
  @media print { .yazdirBtn { display: none; } body { padding: 0; } }
</style>
</head>
<body>
  <button class="yazdirBtn" onclick="window.print()">🖨️ Yazdır</button>
  <div class="sayfa">
    <table class="ustTablo">
      <tr>
        <td class="logoHucre"><img src="${SATINALMA_FORM_LOGO}" alt="Çeliktaş" /></td>
        <td class="baslikHucre">SATINALMA TALEP<br>FORMU</td>
        <td class="metaHucre">
          <div><b>Dok. No:</b> FPH.03.01</div>
          <div><b>Yay. Tar.:</b> 12.10.2006</div>
          <div><b>Rev. No:</b> 01</div>
          <div><b>Rev. Tar.:</b> 17.01.2011</div>
        </td>
      </tr>
    </table>
    <table class="ustTablo altBaslikSatir">
      <tr>
        <td class="etiket">Geliş Tarihi</td>
        <td class="deger">${esc(sat.gelisTarihi || "")}</td>
        <td class="etiket">Satınalma (Sipariş) No</td>
        <td class="deger">${esc(sat.siparisNo || "")}</td>
      </tr>
    </table>
    <table class="kalemTablo">
      <tr>
        <th class="thSno">S.NO</th>
        <th class="thMalzeme">MALZEMENİN CİNSİ VE ÖZELLİKLERİ</th>
        <th class="thMiktar">MİKTAR</th>
        <th class="thBirim">Birim</th>
        <th class="thTeslim">Teslim Tarihi</th>
      </tr>
      ${kalemSatirlari}
    </table>
    <table class="bolumBaslik"><tr><td>KULLANILDIĞI YER</td></tr></table>
    <table class="bolumTablo">${yerSatirlari}</table>
    <table class="bolumBaslik"><tr><td>SİPARİŞ EDİLMESİ İSTENEN FİRMA / FİRMALAR</td></tr></table>
    <table class="bolumTablo"><tr><td class="dar"></td><td class="genis">${esc(sat.firma || "")}</td></tr></table>
    <table class="imzaTablo">
      <tr><td>TALEP EDEN</td><td>ONAYLAYAN</td></tr>
    </table>
    <table class="imzaAdSatiri">
      <tr>
        <td><div class="imzaAd">GÜRAY SEÇİL</div><div class="imzaUnvan">Fabrika Müdür Yardımcısı</div></td>
        <td><div class="imzaAd">OKTAY ŞİMŞEK</div><div class="imzaUnvan">Fabrika Müdürü</div></td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
