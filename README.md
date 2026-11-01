# Transcultural Forum website

The site at https://transculturalforum.org. Every change pushed to `main` is published by Netlify automatically.

- The pages, `style.css`, `script.js` and `images/` are the website itself.
- `.github/photos/photo-list.txt` lists the online photos the pages use. After every push, a GitHub Action saves any missing ones into `images/photos` and points the pages at those copies, the same way the launch guide's save-photos tool did.
