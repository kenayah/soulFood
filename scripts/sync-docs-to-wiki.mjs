import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, cpSync, rmSync } from "fs"
import { join, dirname, relative, extname } from "path"

const DOCS_DIR = new URL("../docs", import.meta.url).pathname
const WIKI_DIR = new URL("../.wiki", import.meta.url).pathname

const FILE_ORDER = [
  ["architecture.md", "Architecture.md"],
  ["getting-started.md", "Getting-Started.md"],
  ["product-requirements.md", "Product-Requirements.md"],
  ["api/README.md", "API.md"],
  ["database/schema.md", "Database/Schema.md"],
  ["features/menu-management.md", "Features/Menu-Management.md"],
  ["features/order-management.md", "Features/Order-Management.md"],
  ["features/stock-management.md", "Features/Stock-Management.md"],
  ["features/reporting.md", "Features/Reporting.md"],
  ["features/notifications.md", "Features/Notifications.md"],
  ["processes/overview.md", "Processes/Overview.md"],
  ["processes/01-provisioning.md", "Processes/Making-Provision.md"],
  ["processes/02-payment.md", "Processes/Receiving-Payment.md"],
  ["processes/03-preparation.md", "Processes/Preparing-Dishes.md"],
  ["processes/04-order-fulfillment.md", "Processes/Selling-Dishes.md"],
]

function toPascalCase(str) {
  return str
    .replace(/^\d+-/, "")
    .split(/[-_\/]/)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join("-")
}

function buildLinkMap() {
  const map = {}
  for (const [src, dst] of FILE_ORDER) {
    const srcName = src.split("/").pop().replace(/\.md$/, "")
    const dstName = dst.replace(/\.md$/, "")
    map[srcName] = dstName
  }
  return map
}

function rewriteLinks(content, linkMap) {
  return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    if (url.startsWith("http") || url.startsWith("#")) return match
    const urlPath = url.replace(/\.md$/, "").replace(/\/$/, "")
    const mapped = linkMap[urlPath]
    if (mapped) {
      return `[${text}](${mapped})`
    }
    if (url.endsWith(".md")) {
      const parts = urlPath.split("/")
      const pascalName = parts.map(toPascalCase).join("/")
      return `[${text}](${pascalName})`
    }
    return match
  })
}

function generateSidebar() {
  const lines = [
    "## Documentation",
    "",
  ]
  for (const [src, dst] of FILE_ORDER) {
    const display = dst.replace(/\.md$/, "").replace(/^(Features|Processes|Database|API)\//, "$1 » ")
    lines.push(`- [${display}](${dst.replace(/\.md$/, "")})`)
  }
  return lines.join("\n")
}

function generateHome() {
  const readme = readFileSync(join(DOCS_DIR, "README.md"), "utf-8")
  const blocks = readme.split("## Quick Links")[0].trim()
  return blocks + "\n\n---\n\n_Synced from docs/ — last updated: " + new Date().toISOString().slice(0, 10) + "_\n"
}

function main() {
  console.log("Syncing docs/ to GitHub Wiki format...")

  if (existsSync(WIKI_DIR)) {
    rmSync(WIKI_DIR, { recursive: true })
  }

  const linkMap = buildLinkMap()

  for (const [src, dst] of FILE_ORDER) {
    const srcPath = join(DOCS_DIR, src)
    if (!existsSync(srcPath)) {
      console.warn(`  WARN: ${src} not found, skipping`)
      continue
    }

    const dstPath = join(WIKI_DIR, dst)
    mkdirSync(dirname(dstPath), { recursive: true })

    let content = readFileSync(srcPath, "utf-8")
    content = rewriteLinks(content, linkMap)
    writeFileSync(dstPath, content)
    console.log(`  ${src} → ${dst}`)
  }

  const sidebar = generateSidebar()
  writeFileSync(join(WIKI_DIR, "_Sidebar.md"), sidebar)
  console.log("  _Sidebar.md generated")

  const home = generateHome()
  writeFileSync(join(WIKI_DIR, "Home.md"), home)
  console.log("  Home.md generated")

  console.log("\nDone. Wiki content ready in .wiki/")
}

main()
