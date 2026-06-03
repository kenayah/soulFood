import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs"
import { join, relative } from "path"
import puppeteer from "puppeteer"
import { marked } from "marked"

const DOCS_DIR = new URL("../docs", import.meta.url).pathname
const OUTPUT = new URL("../soulfood-documentation.pdf", import.meta.url).pathname

function collectMarkdownFiles(dir, baseDir = dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== "node_modules") {
      files.push(...collectMarkdownFiles(fullPath, baseDir))
    } else if (entry.name.endsWith(".md")) {
      const relPath = relative(baseDir, fullPath)
      files.push({ path: fullPath, relPath })
    }
  }

  return files
}

// Order files for a logical document flow
const FILE_ORDER = [
  "README.md",
  "architecture.md",
  "getting-started.md",
  "product-requirements.md",
  "database/schema.md",
  "api/README.md",
  "processes/overview.md",
  "processes/01-provisioning.md",
  "processes/02-payment.md",
  "processes/03-preparation.md",
  "processes/04-order-fulfillment.md",
  "features/menu-management.md",
  "features/order-management.md",
  "features/stock-management.md",
  "features/reporting.md",
  "features/notifications.md",
]

function buildHtml(files, baseDir) {
  const parts = []

  parts.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SoulFood Documentation</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>mermaid.initialize({ startOnLoad: true, theme: 'default' })</script>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #333; }
  h1, h2, h3, h4 { color: #1a1a1a; margin-top: 1.5em; }
  h1 { border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
  h2 { border-bottom: 1px solid #eee; padding-bottom: 0.2em; }
  code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #f0f0f0; }
  blockquote { border-left: 4px solid #ddd; margin: 0; padding: 0 1em; color: #666; }
  img { max-width: 100%; }
  a { color: #0066cc; }
  .page-break { page-break-before: always; }
  .mermaid { text-align: center; margin: 20px 0; }
</style>
</head>
<body>
<div class="cover">
  <h1 style="font-size: 2.5em; margin-top: 2em; text-align: center;">SoulFood</h1>
  <p style="text-align: center; font-size: 1.2em; color: #666;">Online Takeaway Management Documentation</p>
  <p style="text-align: center; color: #888;">Generated June 2026</p>
</div>
<div class="page-break"></div>
`)

  for (const relPath of FILE_ORDER) {
    const file = files.find((f) => f.relPath === relPath)
    if (!file) {
      console.warn(`File not found: ${relPath}`)
      continue
    }

    const content = readFileSync(file.path, "utf-8")

    // Clean up front matter (--- ... ---) if present
    const cleaned = content.replace(/^---[\s\S]*?---\n?/, "")

    // Convert mermaid code blocks to divs for mermaid.js
    const withMermaid = cleaned
      .replace(/```mermaid\s*\n([\s\S]*?)```/g, (_, code) => {
        return `<div class="mermaid">\n${code.trim()}\n</div>`
      })

    const html = marked.parse(withMermaid)

    parts.push(`<div class="page-break"></div>\n${html}`)
  }

  parts.push(`\n</body>\n</html>`)
  return parts.join("\n")
}

async function main() {
  console.log("📖 Collecting markdown files...")
  const files = collectMarkdownFiles(DOCS_DIR)

  console.log(`📄 Found ${files.length} files, building HTML...`)
  const html = buildHtml(files, DOCS_DIR)

  const tmpHtml = join(DOCS_DIR, "..", ".tmp-docs.html")
  writeFileSync(tmpHtml, html)
  console.log(`✅ HTML written to ${tmpHtml}`)

  console.log("🖨️ Launching Chromium...")
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  const page = await browser.newPage()
  await page.goto(`file://${tmpHtml}`, { waitUntil: "networkidle0", timeout: 30000 })

  // Wait for mermaid to render
  await page.waitForFunction(
    () => document.querySelectorAll(".mermaid svg").length > 0,
    { timeout: 15000 },
  ).catch(() => console.warn("⚠️ Some mermaid diagrams may not have rendered"))

  console.log("📄 Generating PDF...")
  await page.pdf({
    path: OUTPUT,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
  })

  await browser.close()

  // Clean up temp file
  // writeFileSync(tmpHtml, "") // keep for debugging if needed

  console.log(`✅ PDF generated: ${OUTPUT}`)
}

main().catch(console.error)
