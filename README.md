# Transcultural Forum website

The site at https://transculturalforum.org. Every change pushed to `main` is published by Netlify automatically.

- The pages (`*.html`), `style.css`, `script.js` and `images/` are the website itself.
- **The menu and footer live in one place:** `partials/menu.html` and `partials/footer.html`. Each page just says `<!-- SHARED MENU -->` and `<!-- SHARED FOOTER -->` where they go. Change the menu or footer there, once, and every page gets it. The page you are on is highlighted automatically and the footer year updates itself.
- When Netlify publishes, it runs `build.js`, which puts the menu and footer into every page, adds each page's official address for search engines, and writes `sitemap.xml`. The finished site goes into the `_site` folder (not saved in GitHub). To add a new page, copy an existing one, keep the two markers, and it shows up in the sitemap on its own.
- `404.html` is the "page not found" page. `robots.txt` points search engines at the sitemap.
- `images/share/` holds the pictures shown when someone shares a page link on social media or in a message.
- `.github/photos/photo-list.txt` lists the online photos the pages use. After every push, a GitHub Action saves any missing ones into `images/photos`, points the pages at those copies, and shrinks any new photo so pages stay fast (`shrink-photos.py`; photos already done are listed in `shrunk-list.txt`).
