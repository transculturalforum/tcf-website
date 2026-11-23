# Transcultural Forum website

The site at https://transculturalforum.org. Every change pushed to `main` is published by Netlify automatically.

- The pages (`*.html`), `style.css`, `script.js` and `images/` are the website itself.
- **The menu and footer live in one place:** `partials/menu.html` and `partials/footer.html`. Each page just says `<!-- SHARED MENU -->` and `<!-- SHARED FOOTER -->` where they go. Change the menu or footer there, once, and every page gets it. The page you are on is highlighted automatically and the footer year updates itself.
- When Netlify publishes, it runs `build.js`, which puts the menu and footer into every page, adds each page's official address for search engines, and writes `sitemap.xml`. The finished site goes into the `_site` folder (not saved in GitHub). To add a new page, copy an existing one, keep the two markers, and it shows up in the sitemap on its own.
- **All design rules are in `style.css`.** The top part applies to the whole site. Below the "PAGE-BY-PAGE DESIGN RULES" heading, each section applies only to the pages named in its heading: every page's `<body>` has a class such as `page-islam` (and the nine shorter religion pages share `religion-page`) that ties it to its section. Pages no longer carry their own `<style>` blocks.
- **Icons** use Font Awesome names, for example `<i class="fa-solid fa-utensils"></i>`. When the site is published, `build.js` makes `icons.css` with just the icons the pages use, from the free set in `icons/fontawesome` (CC BY 4.0). Any free Font Awesome icon name works, with nothing to download.
- `404.html` is the "page not found" page. `robots.txt` points search engines at the sitemap.
- `images/share/` holds the pictures shown when someone shares a page link on social media or in a message.
- `.github/photos/photo-list.txt` lists the online photos the pages use. After every push, a GitHub Action saves any missing ones into `images/photos`, points the pages at those copies, and shrinks any new photo so pages stay fast (`shrink-photos.py`; photos already done are listed in `shrunk-list.txt`).
- **Search:** the magnifying glass in the menu searches the whole site. `build.js` makes `search-index.json` from every page when the site is published, so new text is searchable with nothing to update.
- **Insight of the Day** on the home page shows a different "Myth and Fact" from the religion pages each day. `build.js` collects them into `insights.json`, so any myth added to a religion page joins the rotation by itself.
- **World map** on the Cultures page: `world-map.js` and `images/world-map.svg` (country shapes from Natural Earth, public domain). The panel text is read from the culture cards. To link a country to a culture, add it to the list at the top of `world-map.js`.
