// Builds the finished website into the _site folder. Netlify runs this on every publish.
//
// What it does:
//  1. Puts the shared menu (partials/menu.html) and footer (partials/footer.html)
//     into every page, where the page says <!-- SHARED MENU --> and <!-- SHARED FOOTER -->.
//  2. Highlights the page you are on in the menu.
//  3. Writes the current year in the footer.
//  4. Adds the "official address" (canonical link) to each page and writes sitemap.xml,
//     the list of pages that Google and other search engines read.
// It needs nothing installed besides Node, which Netlify already has.

const fs = require("fs");
const path = require("path");

const SITE = "https://transculturalforum.org";
const ROOT = __dirname;
const OUT = path.join(ROOT, "_site");
// Files and folders that are part of the project but not part of the website itself.
const SKIP = new Set([".git", ".github", "partials", "_site", "build.js", "netlify.toml", "README.md", "node_modules", ".gitignore"]);
// Pages that should not be listed for search engines.
const NOT_IN_SITEMAP = new Set(["404.html"]);

const stripNote = (html) => html.replace(/^\s*<!--[\s\S]*?-->\s*\n/, "");
const menuTemplate = stripNote(fs.readFileSync(path.join(ROOT, "partials/menu.html"), "utf8"));
const footer = stripNote(fs.readFileSync(path.join(ROOT, "partials/footer.html"), "utf8"))
  .replace(/\{\{YEAR\}\}/g, String(new Date().getFullYear()));

function addClass(tag) {
  return /class="/.test(tag) ? tag.replace(/class="/, 'class="active-page ').replace('class="active-page dropdown-trigger"', 'class="dropdown-trigger active-page"') : tag.replace(/>$/, ' class="active-page">');
}

function menuFor(page) {
  let menu = menuTemplate;
  if (page === "index.html") {
    // On the home page, the Home, Our Mission and Contact Us links jump within the page.
    menu = menu.replace(/href="index\.html#/g, 'href="#');
    menu = menu.replace('<a href="#home">', '<a href="#home" class="active-page">');
    return menu;
  }
  const esc = page.replace(/\./g, "\\.");
  const link = new RegExp(`<a href="${esc}"[^>]*>`);
  const found = menu.match(link);
  if (!found) return menu;
  // If the page sits inside a dropdown whose heading is not itself a page ("What We Do"),
  // highlight that heading too, the way the site always has.
  const at = menu.indexOf(found[0]);
  const tabStart = menu.lastIndexOf('<li class="dropdown-tab">', at);
  const tabEnd = tabStart === -1 ? -1 : menu.indexOf("</ul>", tabStart);
  menu = menu.slice(0, at) + addClass(found[0]) + menu.slice(at + found[0].length);
  if (tabStart !== -1 && at < tabEnd) {
    const head = menu.indexOf('<a href="#" class="dropdown-trigger">', tabStart);
    if (head !== -1 && head < at) {
      menu = menu.slice(0, head) + '<a href="#" class="dropdown-trigger active-page">' + menu.slice(head + '<a href="#" class="dropdown-trigger">'.length);
    }
  }
  return menu;
}

function buildPage(page, html) {
  const problems = [];
  if (html.includes("<!-- SHARED MENU -->")) html = html.replace("<!-- SHARED MENU -->", menuFor(page).trimEnd());
  else problems.push("no <!-- SHARED MENU --> marker");
  if (html.includes("<!-- SHARED FOOTER -->")) html = html.replace("<!-- SHARED FOOTER -->", footer.trimEnd());
  else problems.push("no <!-- SHARED FOOTER --> marker");

  // Give the "Skip to content" link somewhere to land: the first thing after the menu
  // (usually the page's banner and title). If that already has an id, like id="home", use it.
  const afterNav = html.indexOf("</nav>");
  const next = afterNav === -1 ? -1 : html.slice(afterNav).search(/<(header|section|main|div)\b/);
  if (next !== -1) {
    const at = afterNav + next;
    const tagEnd = html.indexOf(">", at);
    const tag = html.slice(at, tagEnd);
    const id = tag.match(/\sid="([^"]+)"/);
    if (id) html = html.replace('href="#content">Skip', `href="#${id[1]}">Skip`);
    else html = html.slice(0, at) + tag.replace(/^<(\w+)/, '<$1 id="content"') + html.slice(tagEnd);
  }

  // The "page not found" page can show up at any address, even /some/folder/page,
  // so its links and files start from the top of the site.
  if (page === "404.html") html = html.replace(/(href|src)="(?![a-z]+:|#|\/)/g, '$1="/');

  const url = page === "index.html" ? `${SITE}/` : `${SITE}/${page}`;
  if (!/rel="canonical"/.test(html) && !NOT_IN_SITEMAP.has(page)) {
    html = html.replace(/<\/title>/, `</title>\n    <link rel="canonical" href="${url}">`);
  }
  return { html, problems, url };
}

function copy(src, dest) {
  for (const name of fs.readdirSync(src)) {
    if (src === ROOT && SKIP.has(name)) continue;
    const from = path.join(src, name), to = path.join(dest, name);
    if (fs.statSync(from).isDirectory()) { fs.mkdirSync(to, { recursive: true }); copy(from, to); }
    else fs.copyFileSync(from, to);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
copy(ROOT, OUT);

const urls = [];
let warnings = 0;
for (const page of fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort()) {
  const { html, problems, url } = buildPage(page, fs.readFileSync(path.join(ROOT, page), "utf8"));
  fs.writeFileSync(path.join(OUT, page), html);
  if (problems.length) { warnings++; console.log(`Note: ${page} has ${problems.join(" and ")}, so it keeps its own.`); }
  if (!NOT_IN_SITEMAP.has(page)) urls.push(url);
}

fs.writeFileSync(path.join(OUT, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") + "\n</urlset>\n");

console.log(`Built ${urls.length + NOT_IN_SITEMAP.size} pages into _site${warnings ? ` (${warnings} notes above)` : ""}.`);
