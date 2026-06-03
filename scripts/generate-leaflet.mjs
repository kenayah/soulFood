import puppeteer from "puppeteer"
import { readFileSync } from "fs"

const LOGO_PATH = new URL("../site/static/images/logo.webp", import.meta.url).pathname
const OUTPUT = new URL("../soulfood-leaflet.pdf", import.meta.url).pathname

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  @page {
    size: 105mm 148mm;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }

  /* ---- FRONT ---- */
  .front {
    width: 105mm;
    height: 148mm;
    background: linear-gradient(145deg, #1a0f0a 0%, #2d1a10 40%, #4a2818 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10mm 6mm;
    position: relative;
    overflow: hidden;
    font-family: 'Georgia', 'Times New Roman', serif;
    color: #f5ede6;
    page-break-after: always;
  }

  .front::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background:
      radial-gradient(circle at 20% 30%, rgba(180, 90, 30, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(200, 120, 40, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  .ornament {
    font-size: 18px;
    color: #c8956c;
    letter-spacing: 8px;
    margin-bottom: 4mm;
  }

  .logo-area {
    margin-bottom: 5mm;
    position: relative;
    z-index: 1;
  }

  .logo-area img {
    width: 55mm;
    height: auto;
  }

  .business-name {
    font-size: 28px;
    font-weight: bold;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #f5ede6;
    margin-bottom: 1mm;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .tagline {
    font-size: 11px;
    font-style: italic;
    color: #c8956c;
    text-align: center;
    max-width: 80mm;
    line-height: 1.4;
    margin-bottom: 2mm;
    position: relative;
    z-index: 1;
  }

  .divider {
    width: 30mm;
    height: 1px;
    background: linear-gradient(90deg, transparent, #c8956c, transparent);
    margin: 3mm auto;
  }

  .ikhaya {
    font-size: 14px;
    font-style: italic;
    color: #d4a574;
    text-align: center;
    margin-bottom: 4mm;
    position: relative;
    z-index: 1;
  }

  .contact {
    text-align: center;
    position: relative;
    z-index: 1;
    margin-top: 2mm;
  }

  .contact-item {
    font-size: 10px;
    color: #c8956c;
    margin-bottom: 1.5mm;
    letter-spacing: 0.5px;
  }

  .contact-item span {
    color: #f5ede6;
  }

  .cta {
    margin-top: 3mm;
    padding: 2.5mm 8mm;
    border: 1.5px solid #c8956c;
    color: #f5ede6;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-family: 'Georgia', serif;
    background: transparent;
  }

  /* ---- BACK ---- */
  .back {
    width: 105mm;
    height: 148mm;
    background: #faf6f0;
    padding: 5mm 5mm;
    font-family: 'Georgia', 'Times New Roman', serif;
    color: #2d1a10;
    page-break-after: always;
  }

  .back-title {
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    color: #4a2818;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 1mm;
  }

  .back-subtitle {
    text-align: center;
    font-size: 9px;
    color: #8a6e58;
    font-style: italic;
    margin-bottom: 3mm;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .back-divider {
    width: 20mm;
    height: 1px;
    background: #8a6e58;
    margin: 0 auto 3mm auto;
  }

  .menu-item {
    margin-bottom: 2.5mm;
    padding-bottom: 2mm;
    border-bottom: 1px dashed #ddd6ce;
  }

  .menu-item:last-child {
    border-bottom: none;
  }

  .menu-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5mm;
  }

  .menu-name {
    font-size: 11px;
    font-weight: bold;
    color: #2d1a10;
  }

  .menu-price {
    font-size: 11px;
    font-weight: bold;
    color: #8b4513;
  }

  .menu-desc {
    font-size: 8px;
    color: #6b5544;
    line-height: 1.3;
  }

  .menu-starch {
    font-size: 7.5px;
    color: #8a6e58;
    font-style: italic;
    margin-top: 0.5mm;
  }

  .specials-section {
    margin-top: 4mm;
    padding: 2.5mm;
    background: #f0e8de;
    border-radius: 2mm;
  }

  .specials-title {
    text-align: center;
    font-size: 10px;
    font-weight: bold;
    color: #4a2818;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2mm;
  }

  .footer-contact {
    margin-top: 3mm;
    text-align: center;
    font-size: 8px;
    color: #6b5544;
    line-height: 1.6;
  }

  .footer-contact strong {
    color: #4a2818;
  }
</style>
</head>
<body>

<!-- FRONT -->
<div class="front">
  <div class="ornament">✦ ✦ ✦</div>

  <div class="logo-area">
    <img src="file://${LOGO_PATH}" alt="Soul Food" />
  </div>

  <div class="business-name">Soul Food</div>

  <div class="tagline">The Taste of South African Comfort Meal on a Plate</div>

  <div class="divider"></div>

  <div class="ikhaya">"Ikhaya — The unmistakable feel & taste of home."</div>

  <div class="divider"></div>

  <div class="contact">
    <div class="contact-item">☎ <span>069 466 0013</span></div>
    <div class="contact-item">✉ <span>khutiecola@gmail.com</span></div>
  </div>

  <div class="cta">Order Now</div>
</div>

<!-- BACK -->
<div class="back">
  <div class="back-title">Our Menu</div>
  <div class="back-subtitle">Featured on the Week</div>
  <div class="back-divider"></div>

  <div class="menu-item">
    <div class="menu-header">
      <span class="menu-name">Mogodu Wednesday</span>
      <span class="menu-price">R 90</span>
    </div>
    <div class="menu-desc">Slow-cooked tripe served with Butternut & Creamy Spinach</div>
    <div class="menu-starch">Choice of Starch: Creamy Samp or Steamed Bread</div>
  </div>

  <div class="menu-item">
    <div class="menu-header">
      <span class="menu-name">Umleqwa Friday</span>
      <span class="menu-price">R 100</span>
    </div>
    <div class="menu-desc">Tender Hardbody Chicken with Chakalaka & Spicy Spinach</div>
    <div class="menu-starch">Choice of Starch: Samp & Beans or Steamed Bread</div>
  </div>

  <div class="menu-item">
    <div class="menu-header">
      <span class="menu-name">Sunday Kos Meal</span>
      <span class="menu-price">R 120</span>
    </div>
    <div class="menu-desc">Fried Savoury Rice, Beef Stew, Creamy Spinach, Roasted Butternut with Feta & Chakalaka</div>
  </div>

  <div class="menu-item">
    <div class="menu-header">
      <span class="menu-name">Sunday Kos 7 Colors</span>
      <span class="menu-price">R 150</span>
    </div>
    <div class="menu-desc">Fried Savoury Rice, Beef Stew, Potato Salad, Chakalaka, Roasted Butternut with Feta, Creamy Spinach & Beetroot</div>
  </div>

  <div class="menu-item">
    <div class="menu-header">
      <span class="menu-name">Ama Zulu Beef Stew</span>
      <span class="menu-price">R 145</span>
    </div>
    <div class="menu-desc">Slowly Cooked Beef from Ma Gogo's Pot</div>
  </div>

  <div class="menu-item">
    <div class="menu-header">
      <span class="menu-name">Side Dishes</span>
      <span class="menu-price">R 35</span>
    </div>
    <div class="menu-desc">Chakalaka, Roasted Butternut with Feta, Creamy Spinach, Spicy Spinach, Potato Salad</div>
  </div>

  <div class="menu-item">
    <div class="menu-header">
      <span class="menu-name">Starch Options</span>
      <span class="menu-price" style="color:#6b5544;font-size:9px;">ask</span>
    </div>
    <div class="menu-desc">Creamy Samp, Samp & Beans, Steamed Bread, Fried Savoury Rice, Plain Rice</div>
  </div>

  <div class="footer-contact">
    ☎ <strong>069 466 0013</strong> &nbsp;·&nbsp; ✉ <strong>khutiecola@gmail.com</strong><br/>
    Soul Food — Taste of Home on a Plate
  </div>
</div>

</body>
</html>`

async function main() {
  console.log("🖨️ Generating leaflet...")
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle0" })

  await page.pdf({
    path: OUTPUT,
    width: "105mm",
    height: "148mm",
    printBackground: true,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  })

  await browser.close()
  console.log(`✅ Leaflet saved: ${OUTPUT}`)
}

main().catch(console.error)
