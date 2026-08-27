/* ---------------- satın alma talep formu — yazdırma görünümü ---------------- */
// Şirketin resmi "SATINALMA TALEP FORMU" kağıt formuna birebir benzeyen,
// yeni bir tarayıcı sekmesinde açılan, doğrudan yazdırılabilir bir sayfa üretir.

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
  const MIN_SATIR = 15;
  const kalemler = sat.kalemler || [];
  const satirSayisi = Math.max(MIN_SATIR, kalemler.length);
  let kalemSatirlari = "";
  for (let i = 0; i < satirSayisi; i++){
    const k = kalemler[i];
    kalemSatirlari += `<tr>
      <td class="ortali">${i+1}</td>
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
    yerSatirlari += `<tr><td>${esc(yerler[i] || "")}</td></tr>`;
  }

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Satınalma Talep Formu — ${esc(sat.siparisNo || sat.id)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; color: #000; margin: 0; padding: 0; }
  .sayfa { width: 100%; max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 10px; }
  table { width: 100%; border-collapse: collapse; }
  .ustTablo td { border: 1px solid #000; padding: 6px 10px; vertical-align: middle; }
  .logoHucre { width: 34%; text-align: center; }
  .logoAd { font-size: 30px; font-weight: 800; letter-spacing: 1px; }
  .logoAlt { font-size: 10px; letter-spacing: 2px; }
  .baslikHucre { width: 36%; text-align: center; font-size: 17px; font-weight: 700; }
  .metaHucre { width: 30%; font-size: 11px; line-height: 1.7; }
  .metaHucre b { display: inline-block; width: 62px; }
  .altBaslikSatir td { border: 1px solid #000; padding: 6px 10px; font-size: 12px; }
  .altBaslikSatir .etiket { font-weight: 700; width: 40%; }
  .kalemTablo { margin-top: -1px; }
  .kalemTablo th { border: 1px solid #000; padding: 5px; font-size: 11px; font-weight: 700; background: #eee; }
  .kalemTablo td { border: 1px solid #000; padding: 4px 6px; font-size: 11.5px; height: 20px; }
  .kalemTablo td.ortali { text-align: center; }
  .kalemTablo td.sol { text-align: left; }
  .bolumBaslik { border: 1px solid #000; border-top: none; padding: 6px; text-align: center; font-weight: 700; font-size: 12px; background: #f5f5f5; }
  .bolumTablo td { border: 1px solid #000; border-top: none; padding: 5px 8px; font-size: 11.5px; height: 20px; }
  .imzaTablo td { border: 1px solid #000; border-top: none; padding: 10px 8px; width: 50%; text-align: center; vertical-align: top; }
  .imzaBaslik { font-weight: 700; font-size: 12px; margin-bottom: 34px; }
  .imzaAd { font-weight: 700; font-size: 12px; }
  .imzaUnvan { font-style: italic; font-size: 11px; }
  .yazdirBtn { margin: 14px auto; display: block; padding: 10px 22px; font-size: 14px; cursor: pointer; }
  @media print { .yazdirBtn { display: none; } body { padding: 0; } }
</style>
</head>
<body>
  <button class="yazdirBtn" onclick="window.print()">🖨️ Yazdır</button>
  <div class="sayfa">
    <table class="ustTablo">
      <tr>
        <td class="logoHucre">
          <div class="logoAd">ÇELİKTAŞ</div>
          <div class="logoAlt">SINAİ KUMU SANAYİ VE TİCARET A.Ş.</div>
        </td>
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
        <td>${esc(sat.gelisTarihi || "")}</td>
        <td class="etiket">Satınalma (Sipariş) No</td>
        <td>${esc(sat.siparisNo || "")}</td>
      </tr>
    </table>
    <table class="kalemTablo">
      <tr>
        <th style="width:6%">S.NO</th>
        <th style="width:46%">MALZEMENİN CİNSİ VE ÖZELLİKLERİ</th>
        <th style="width:14%">MİKTAR</th>
        <th style="width:14%">Birim</th>
        <th style="width:20%">Teslim Tarihi</th>
      </tr>
      ${kalemSatirlari}
    </table>
    <div class="bolumBaslik">KULLANILDIĞI YER</div>
    <table class="bolumTablo"><tbody>${yerSatirlari}</tbody></table>
    <div class="bolumBaslik">SİPARİŞ EDİLMESİ İSTENEN FİRMA / FİRMALAR</div>
    <table class="bolumTablo"><tr><td>${esc(sat.firma || "")}</td></tr></table>
    <table class="imzaTablo">
      <tr>
        <td>
          <div class="imzaBaslik">TALEP EDEN</div>
        </td>
        <td>
          <div class="imzaBaslik">ONAYLAYAN</div>
        </td>
      </tr>
      <tr>
        <td>
          <div class="imzaAd">GÜRAY SEÇİL</div>
          <div class="imzaUnvan">Fabrika Müdür Yardımcısı</div>
        </td>
        <td>
          <div class="imzaAd">OKTAY ŞİMŞEK</div>
          <div class="imzaUnvan">Fabrika Müdürü</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
