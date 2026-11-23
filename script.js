document.addEventListener('DOMContentLoaded', () => {
    // Safely check if the landing page donate button exists before adding the event listener
    const donateButton = document.getElementById('donate-btn');
    if (donateButton) {
        donateButton.addEventListener('click', () => {
            window.location.href = 'donate.html';
        });
    }

    // Interactive tab switching for the donate.html page
    const tabButtons = document.querySelectorAll('.payment-tab-btn');
    const tabContents = document.querySelectorAll('.payment-content');

    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // Remove active classes from all buttons and content panes
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to the clicked button and matching content pane
                button.classList.add('active');
                const activeContent = document.getElementById(targetTab);
                if (activeContent) {
                    activeContent.classList.add('active');
                }
            });
        });
    }

    // Contact Form Submission Handler
    const form = document.getElementById("tcf-contact-form");
    const statusMessage = document.getElementById("form-status");

    if (form) {
        form.addEventListener("submit", async function(event) {
            event.preventDefault(); // Prevents the default Formspree redirect page
            
            const data = new FormData(event.target);
            
            fetch(event.target.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            }).then(response => {
                if (response.ok) {
                    // Show the success message and clear the form
                    statusMessage.style.display = "block";
                    statusMessage.style.color = "#3C6B5F"; // Matches your Transcultural Forum green
                    statusMessage.innerHTML = "Your message has been submitted.";
                    form.reset();
                } else {
                    // In case of an error
                    statusMessage.style.display = "block";
                    statusMessage.style.color = "red";
                    statusMessage.innerHTML = "Oops! There was a problem submitting your form.";
                }
            }).catch(error => {
                statusMessage.style.display = "block";
                statusMessage.style.color = "red";
                statusMessage.innerHTML = "Oops! There was a problem submitting your form.";
            });
        });
    }

    // --- Mobile Hamburger Menu Logic ---
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            // Toggles the menu sliding in and out
            navLinks.classList.toggle('active');
            
            // Optional: Changes the icon to an "X" when open, and back to "☰" when closed
            const open = navLinks.classList.contains('active');
            hamburger.innerHTML = open ? '&#10005;' : '&#9776;'; // "X" when open, "☰" when closed
            // Tell screen readers whether the menu is open
            hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
            hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        });
    }

    // --- Open the right tab when a link points inside a page ---
    // Search results and the Insight of the Day link to a section such as islam.html#sec-myths.
    // Religion pages show one tab at a time, so open that tab (and the small tab inside it) first.
    function showTarget() {
        const id = decodeURIComponent(location.hash.slice(1));
        const target = id && document.getElementById(id);
        if (!target) return;
        const clickButtonFor = (el) => {
            const btn = el && document.querySelector(`button[onclick*="'${el.id}'"]`);
            if (btn && !el.classList.contains('active')) btn.click();
        };
        clickButtonFor(target.closest('.template-section'));
        clickButtonFor(target.closest('.history-sub-section'));
        target.classList.remove('just-found');
        void target.offsetWidth;
        target.classList.add('just-found');
        setTimeout(() => target.scrollIntoView({ block: 'start' }), 30);
    }
    window.addEventListener('hashchange', showTarget);
    if (location.hash.length > 1) showTarget();

    // --- Site search ---
    // The search button in the menu opens a box. The first time, it downloads
    // search-index.json, which build.js makes from every page when the site is published.
    const searchToggle = document.getElementById('search-toggle');
    if (searchToggle) {
        let index = null, loading = null, lastFocus = null;
        const panel = document.createElement('div');
        panel.className = 'site-search';
        panel.hidden = true;
        panel.innerHTML = `
            <div class="site-search-box" role="dialog" aria-modal="true" aria-label="Search the site">
                <div class="site-search-bar">
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><line x1="15.5" y1="15.5" x2="21" y2="21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
                    <input type="search" id="site-search-input" placeholder="Search religions, cultures, topics..." autocomplete="off" aria-label="Search the site" aria-controls="site-search-results">
                    <button type="button" class="site-search-close" aria-label="Close search">&#10005;</button>
                </div>
                <p class="site-search-status" id="site-search-status" aria-live="polite">Type a word, such as Ramadan, turban or Nowruz.</p>
                <ol class="site-search-results" id="site-search-results"></ol>
            </div>`;
        document.body.appendChild(panel);
        const input = panel.querySelector('input');
        const status = panel.querySelector('.site-search-status');
        const list = panel.querySelector('.site-search-results');

        // Compare letters without accents or apostrophes, so "bahai" finds "Bahá'í".
        // Keeps a map back to the original text so the matching words can be highlighted.
        const fold = (text) => {
            let out = '';
            const map = [];
            for (let i = 0; i < text.length; i++) {
                const c = text[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
                if (/['’‘`ʻʼ]/.test(c)) continue;
                for (const ch of c) { out += ch; map.push(i); }
            }
            return { out, map };
        };
        const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
        // Match the start of a word, so "unity" finds "unity" and "unity's" but not "community".
        const wordStart = (w, flags = '') => new RegExp('(?<![\\p{L}\\p{N}])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u' + flags);

        function load() {
            if (!loading) {
                status.textContent = 'Loading...';
                loading = fetch('search-index.json').then((r) => r.json()).then((data) => {
                    index = data.map((e) => ({ ...e, title: fold(`${e.p} ${e.s}`).out, body: fold(e.x) }));
                    run();
                }).catch(() => { loading = null; status.textContent = 'Search is not available right now. Please try again later.'; });
            }
            return loading;
        }

        function snippet(entry, words) {
            const at = words.map((w) => entry.body.out.search(wordStart(w))).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
            const startF = Math.max(0, at - 70);
            const endF = Math.min(entry.body.out.length, at + 150);
            let start = entry.body.map[startF] ?? 0;
            let end = (entry.body.map[endF - 1] ?? entry.x.length - 1) + 1;
            let text = entry.x.slice(start, end);
            // Mark every matching word
            const marks = [];
            const seg = fold(text);
            for (const w of words) {
                for (const m of seg.out.matchAll(wordStart(w, 'g'))) marks.push([seg.map[m.index], seg.map[m.index + w.length - 1] + 1]);
            }
            marks.sort((a, b) => a[0] - b[0]);
            let html = '', pos = 0;
            for (const [a, b] of marks) { if (a < pos) continue; html += esc(text.slice(pos, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>'; pos = b; }
            html += esc(text.slice(pos));
            return (start > 0 ? '...' : '') + html + (end < entry.x.length ? '...' : '');
        }

        function run() {
            const words = fold(input.value).out.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 1);
            list.innerHTML = '';
            if (!index) return;
            if (!words.length) { status.textContent = 'Type a word, such as Ramadan, turban or Nowruz.'; return; }
            const found = [];
            const patterns = words.map((w) => [wordStart(w), wordStart(w, 'g')]);
            for (const e of index) {
                let score = 0;
                for (const [one, all] of patterns) {
                    const inTitle = one.test(e.title);
                    const count = (e.body.out.match(all) || []).length;
                    if (!inTitle && !count) { score = 0; break; }
                    score += (inTitle ? 20 : 0) + Math.min(10, count);
                }
                if (score) found.push([score, e]);
            }
            found.sort((a, b) => b[0] - a[0]);
            const shown = found.slice(0, 25);
            status.textContent = found.length ? `${found.length} result${found.length === 1 ? '' : 's'}${found.length > shown.length ? `, showing the best ${shown.length}` : ''}` : 'No results. Try a different or shorter word.';
            list.innerHTML = shown.map(([, e]) => `
                <li><a href="${esc(e.u)}">
                    <span class="site-search-where">${esc(e.p)}${e.s ? ' <span aria-hidden="true">&rsaquo;</span> ' + esc(e.s) : ''}</span>
                    <span class="site-search-snippet">${snippet(e, words)}</span>
                </a></li>`).join('');
        }

        let timer;
        input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => (index ? run() : load()), 120); });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { const first = list.querySelector('a'); if (first) first.click(); }
            if (e.key === 'ArrowDown') { const first = list.querySelector('a'); if (first) { e.preventDefault(); first.focus(); } }
        });
        list.addEventListener('keydown', (e) => {
            const links = [...list.querySelectorAll('a')];
            const i = links.indexOf(document.activeElement);
            if (e.key === 'ArrowDown' && i < links.length - 1) { e.preventDefault(); links[i + 1].focus(); }
            if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? links[i - 1] : input).focus(); }
        });
        list.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });

        function open() {
            lastFocus = document.activeElement;
            panel.hidden = false;
            document.body.classList.add('search-open');
            input.focus();
            input.select();
            load();
        }
        function close() {
            panel.hidden = true;
            document.body.classList.remove('search-open');
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }
        searchToggle.addEventListener('click', open);
        panel.querySelector('.site-search-close').addEventListener('click', close);
        panel.addEventListener('click', (e) => { if (e.target === panel) close(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !panel.hidden) close();
            // Press "/" anywhere (outside a text box) to search
            if (e.key === '/' && panel.hidden && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
        });
        // Keep keyboard focus inside the open search box
        panel.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;
            const items = [...panel.querySelectorAll('input, button, a')];
            const first = items[0], last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
    }

    // --- Insight of the Day (home page) ---
    // A different "common belief and the fact" each day, from the Myths and Facts sections
    // of the religion pages (build.js collects them into insights.json). Nothing to update by hand.
    const insightBox = document.getElementById('insight-of-the-day');
    if (insightBox) {
        fetch('insights.json').then((r) => r.json()).then((items) => {
            if (!items.length) return;
            const now = new Date();
            const today = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
            let at = today % items.length;
            const set = (name, value) => { insightBox.querySelector(`[data-insight="${name}"]`).textContent = value; };
            const show = () => {
                const item = items[at];
                insightBox.dataset.faith = item.r;
                set('faith', item.r);
                set('fact', item.f);
                set('belief', item.m);
                const link = insightBox.querySelector('[data-insight="link"]');
                link.href = item.u;
                link.querySelector('span span').textContent = item.r;
                set('date', at === today % items.length ? now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Another insight');
            };
            show();
            insightBox.classList.add('is-ready');
            // "Show another insight" steps through the rest, then comes back to today's
            insightBox.querySelector('[data-insight="next"]').addEventListener('click', () => {
                at = (at + 1) % items.length;
                insightBox.classList.remove('is-changing');
                void insightBox.offsetWidth;
                insightBox.classList.add('is-changing');
                show();
            });
        }).catch(() => {});
    }
});
