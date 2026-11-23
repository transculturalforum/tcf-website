// WORLD MAP on the Cultures page: click (or tap) any country to read about it.
// - The drawing is images/world-map.svg (country shapes from Natural Earth, public domain).
// - Country facts come from data/countries.json (The World Factbook, public domain; see data/README.md).
// - TCF's own culture profiles are read from the culture cards further down the page,
//   so editing a culture card updates the map too.
//
// To link a country to a culture, add it to the list below. The country name must match
// the name in images/world-map.svg, and the culture is the id of its card (without "culture-").
const CULTURES_BY_COUNTRY = {
  // Africa (every African country links to "African Cultures" automatically, see AFRICA below)
  "Nigeria": ["yoruba"], "Benin": ["yoruba"], "Togo": ["yoruba"],
  "Ethiopia": ["ethiopian"],
  "Egypt": ["arab"], "Libya": ["arab"], "Tunisia": ["arab"], "Algeria": ["arab"], "Morocco": ["arab"],
  "Western Sahara": ["arab"], "Mauritania": ["arab"], "Sudan": ["arab"], "Somalia": ["arab"],
  "Somaliland": ["arab"], "Djibouti": ["arab"],
  // Middle East
  "Saudi Arabia": ["arab"], "Yemen": ["arab"], "Oman": ["arab"], "United Arab Emirates": ["arab"],
  "Qatar": ["arab"], "Kuwait": ["arab"], "Iraq": ["arab"], "Syria": ["arab"], "Jordan": ["arab"],
  "Lebanon": ["arab"], "Palestine": ["arab"],
  "Iran": ["persian"], "Afghanistan": ["persian"], "Tajikistan": ["persian"],
  "Turkey": ["turkish"], "Northern Cyprus": ["turkish"],
  "Israel": ["jewish"],
  // Americas
  "United States": ["american"],
  "Brazil": ["brazilian", "latin_american"],
  "Guatemala": ["latin_american"], "Belize": ["latin_american"], "Honduras": ["latin_american"],
  "El Salvador": ["latin_american"], "Nicaragua": ["latin_american"], "Costa Rica": ["latin_american"],
  "Panama": ["latin_american"], "Cuba": ["latin_american"], "Dominican Republic": ["latin_american"],
  "Haiti": ["latin_american"], "Puerto Rico": ["latin_american"], "Colombia": ["latin_american"],
  "Venezuela": ["latin_american"], "Ecuador": ["latin_american"], "Peru": ["latin_american"],
  "Bolivia": ["latin_american"], "Chile": ["latin_american"], "Argentina": ["latin_american"],
  "Uruguay": ["latin_american"], "Paraguay": ["latin_american"],
  // Asia
  "India": ["indian"],
  "China": ["han_chinese"], "Taiwan": ["han_chinese"],
  "Japan": ["japanese"],
  "South Korea": ["korean"], "North Korea": ["korean"],
  "Philippines": ["filipino"],
  // Europe
  "France": ["french"], "Italy": ["italian"], "Greece": ["greek"], "Cyprus": ["greek"],
  // Oceania
  "New Zealand": ["polynesian"], "Samoa": ["polynesian"], "Tonga": ["polynesian"],
  "French Polynesia": ["polynesian"], "Cook Islands": ["polynesian"], "American Samoa": ["polynesian"],
  "Hong Kong": ["han_chinese"], "Macao": ["han_chinese"], "Bahrain": ["arab"], "Comoros": ["arab"],
  "Mexico": ["mexican", "latin_american"],
};
const AFRICA = ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon",
  "Central African Republic", "Chad", "Congo", "Côte d'Ivoire", "Democratic Republic of the Congo",
  "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
  "Mali", "Mauritania", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Senegal",
  "Sierra Leone", "Somalia", "Somaliland", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo",
  "Tunisia", "Uganda", "Western Sahara", "Zambia", "Zimbabwe"];
AFRICA.forEach((c) => { CULTURES_BY_COUNTRY[c] = [...(CULTURES_BY_COUNTRY[c] || []), "african"]; });

// Links from a country's religions to TCF's religion pages.
const FAITH_PAGES = [
  ["Christianity", "christianity.html", /christian|catholic|protestant|orthodox|evangelical|anglican|lutheran|pentecostal|methodist|baptist|adventist|presbyterian|church|jehovah|latter-day/i],
  ["Islam", "islam.html", /muslim|islam|sunni|shia/i],
  ["Judaism", "judaism.html", /jewish|judaism/i],
  ["Hinduism", "hinduism.html", /hindu/i],
  ["Buddhism", "buddhism.html", /buddhis/i],
  ["Sikhism", "sikhism.html", /sikh/i],
  ["Bahá'í Faith", "bahai.html", /baha/i],
  ["Jainism", "jainism.html", /jain/i],
  ["Zoroastrianism", "zoroastrianism.html", /zoroastr|parsi/i],
  ["Indigenous Traditions", "indigenous.html", /folk|ethnic relig|traditional|indigenous|animis|shaman/i],
  ["Secular Worldviews", "secular.html", /none|unaffiliated|atheis|agnostic|no religion|nonreligious|non-believ/i],
];
// Colours for "Largest religion" view
const FAITH_COLORS = {
  "Christianity": "#5B7FA6", "Islam": "#3C6B5F", "Hinduism": "#D08A3E", "Buddhism": "#C9A227",
  "Judaism": "#7C6BA8", "Folk and Indigenous": "#9C5A33", "Unaffiliated": "#9AA39A",
};
const FAITH_LABELS = { "Folk and Indigenous": "Folk, Shinto and Indigenous", "Unaffiliated": "No religion (largest group)" };

document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".world-map-section");
  const frame = document.getElementById("world-map");
  const panel = document.getElementById("world-map-panel");
  const legend = document.getElementById("world-map-legend");
  const finder = document.getElementById("map-country-search");
  if (!frame || !panel) return;
  let facts = {};
  let svg, mode = "cultures";

  const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function cultureInfo(key) {
    const card = document.getElementById("culture-" + key);
    if (!card) return null;
    const fact = (name) => text(card.querySelector(`[data-fact="${name}"] .fact-value`));
    return { id: card.id, name: text(card.querySelector("h2")), region: text(card.querySelector(".region-tag")), festival: fact("festival"), dish: fact("dish") };
  }

  // ---- The side panel ----
  function show(country, fromMap) {
    if (!svg) return;
    svg.querySelectorAll("path.is-selected").forEach((p) => p.classList.remove("is-selected"));
    const paths = [...svg.querySelectorAll(`path[data-country="${CSS.escape(country)}"]`)];
    paths.forEach((p) => p.classList.add("is-selected"));
    // Very small countries get a pin so they can be seen
    svg.querySelectorAll(".map-pin").forEach((c) => c.remove());
    if (paths.length) {
      const big = paths.map((p) => p.getBBox()).sort((a, b) => b.width * b.height - a.width * a.height)[0];
      if (big.width < 8 && big.height < 8) {
        const pin = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        pin.setAttribute("class", "map-pin");
        pin.setAttribute("cx", big.x + big.width / 2);
        pin.setAttribute("cy", big.y + big.height / 2);
        pin.setAttribute("r", 4);
        svg.appendChild(pin);
      }
    }
    if (!fromMap && paths.length) zoomTo(paths);
    sizePins();
    const f = facts[country];
    const cultures = (CULTURES_BY_COUNTRY[country] || []).map(cultureInfo).filter(Boolean);
    const faiths = f ? FAITH_PAGES.filter(([, , rx]) => rx.test(f.religions)) : [];
    let html = `<h3>${esc(country)}</h3>`;
    if (f && f.note) html += `<p class="map-note">${esc(f.note)}</p>`;
    if (f && f.intro) html += `<p class="map-intro">${esc(f.intro)}</p>`;
    if (f) {
      html += `<dl class="map-facts">` + [["Capital", f.capital], ["Population", f.population], ["Languages", f.languages], ["Religions", f.religions]]
        .filter(([, v]) => v).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("") + `</dl>`;
    } else {
      html += `<p class="map-intro">A territory with a small population. Country facts are not available for it yet.</p>`;
    }
    if (cultures.length) {
      html += `<h4 class="map-sub">Culture profiles on TCF</h4>` + cultures.map((c) => `
        <div class="map-culture">
          <strong>${esc(c.name)}</strong> <span class="map-region">${esc(c.region)}</span>
          ${c.festival ? `<span class="map-line"><b>Festivals:</b> ${esc(c.festival)}</span>` : ""}
          ${c.dish ? `<span class="map-line"><b>Food:</b> ${esc(c.dish)}</span>` : ""}
          <button type="button" class="map-read-more" data-card="${c.id}">Read the full profile</button>
        </div>`).join("");
    }
    if (faiths.length) {
      html += `<h4 class="map-sub">Learn about its faiths</h4><div class="map-faiths">` +
        faiths.map(([name, url]) => `<a href="${url}">${esc(name)}</a>`).join("") + `</div>`;
    }
    if (f) html += `<p class="map-source">Country facts: The World Factbook (CIA), 2025.</p>`;
    panel.innerHTML = html;
    panel.scrollTop = 0;
    if (finder) finder.value = "";
    if (fromMap && window.matchMedia("(max-width: 960px)").matches) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  panel.addEventListener("click", (e) => {
    const quick = e.target.closest("[data-country]");
    if (quick) return show(quick.dataset.country);
    const btn = e.target.closest(".map-read-more");
    if (!btn) return;
    const card = document.getElementById(btn.dataset.card);
    const clear = document.getElementById("clear-filters");
    if (clear) clear.click();
    if (typeof window.openCard === "function") window.openCard(btn.dataset.card);
    else card.scrollIntoView({ behavior: "smooth", block: "start" });
    card.classList.remove("just-found"); void card.offsetWidth; card.classList.add("just-found");
  });

  // ---- Colouring: culture profiles, or largest religion ----
  function paint() {
    svg.querySelectorAll("path[data-country]").forEach((p) => {
      const name = p.dataset.country;
      if (mode === "faith") {
        const main = facts[name] && facts[name].main;
        p.style.fill = FAITH_COLORS[main] || "";
        p.classList.toggle("has-culture", false);
      } else {
        p.style.fill = "";
        p.classList.toggle("has-culture", !!CULTURES_BY_COUNTRY[name]);
      }
    });
    section.dataset.mode = mode;
    legend.innerHTML = mode === "faith"
      ? Object.entries(FAITH_COLORS).map(([k, c]) => `<button type="button" data-faith="${esc(k)}" style="--swatch:${c}">${esc(FAITH_LABELS[k] || k)}</button>`).join("")
      : `<span style="--swatch:#7FA79B">Has a TCF culture profile</span><span style="--swatch:#D6D3C8">Country facts only</span><span style="--swatch:#C29262">Selected</span>`;
  }
  document.querySelectorAll(".map-mode button").forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    document.querySelectorAll(".map-mode button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    paint();
  }));
  // In "Largest religion" view, pointing at a legend item highlights those countries
  legend.addEventListener("mouseover", (e) => {
    const b = e.target.closest("[data-faith]");
    svg.querySelectorAll("path[data-country]").forEach((p) => p.classList.toggle("is-dimmed", !!b && (facts[p.dataset.country] || {}).main !== b.dataset.faith));
  });
  legend.addEventListener("mouseleave", () => svg.querySelectorAll(".is-dimmed").forEach((p) => p.classList.remove("is-dimmed")));
  legend.addEventListener("click", (e) => {
    const b = e.target.closest("[data-faith]");
    if (!b) return;
    const on = !b.classList.contains("is-on");
    legend.querySelectorAll("[data-faith]").forEach((x) => x.classList.toggle("is-on", on && x === b));
    svg.querySelectorAll("path[data-country]").forEach((p) => p.classList.toggle("is-dimmed", on && (facts[p.dataset.country] || {}).main !== b.dataset.faith));
  });

  // ---- Zoom and drag ----
  const FULL = { x: 0, y: 0, w: 1000, h: 480 };
  let view = { ...FULL };
  const setView = (v) => {
    const w = Math.min(FULL.w, Math.max(60, v.w)), h = w * FULL.h / FULL.w;
    view = { w, h, x: Math.min(FULL.w - w, Math.max(0, v.x)), y: Math.min(FULL.h - h, Math.max(0, v.y)) };
    svg.setAttribute("viewBox", `${view.x} ${view.y} ${view.w} ${view.h}`);
    section.classList.toggle("is-zoomed", view.w < FULL.w);
    sizePins();
  };
  function sizePins() { svg.querySelectorAll(".map-pin").forEach((c) => c.setAttribute("r", view.w / 90)); }
  const zoomBy = (factor, cx = view.x + view.w / 2, cy = view.y + view.h / 2) => {
    const w = view.w / factor, h = view.h / factor;
    setView({ w, h, x: cx - (cx - view.x) / factor, y: cy - (cy - view.y) / factor });
  };
  function zoomTo(paths) {
    const boxes = paths.map((p) => p.getBBox());
    const x1 = Math.min(...boxes.map((b) => b.x)), y1 = Math.min(...boxes.map((b) => b.y));
    const x2 = Math.max(...boxes.map((b) => b.x + b.width)), y2 = Math.max(...boxes.map((b) => b.y + b.height));
    const w = Math.max(160, (x2 - x1) * 2.2, (y2 - y1) * 2.2 * FULL.w / FULL.h);
    setView({ w, x: (x1 + x2) / 2 - w / 2, y: (y1 + y2) / 2 - (w * FULL.h / FULL.w) / 2 });
  }
  const toMap = (clientX, clientY) => {
    const r = svg.getBoundingClientRect();
    return { x: view.x + (clientX - r.left) / r.width * view.w, y: view.y + (clientY - r.top) / r.height * view.h };
  };
  document.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.zoom === "in") zoomBy(1.6);
    else if (b.dataset.zoom === "out") zoomBy(1 / 1.6);
    else setView(FULL);
  }));

  // ---- Load the map and the country facts ----
  Promise.all([
    fetch("images/world-map.svg").then((r) => r.text()),
    fetch("data/countries.json").then((r) => r.json()).catch(() => ({})),
  ]).then(([drawing, data]) => {
    facts = data;
    frame.insertAdjacentHTML("afterbegin", drawing);
    svg = frame.querySelector("svg");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", "World map. Choose a country to read about it.");
    const names = new Set();
    svg.querySelectorAll("path[data-country]").forEach((p) => {
      const name = p.dataset.country;
      names.add(name);
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      p.setAttribute("aria-label", name);
    });
    if (finder) {
      const list = document.getElementById("map-country-list");
      list.innerHTML = [...names].sort((a, b) => a.localeCompare(b)).map((n) => `<option value="${esc(n)}"></option>`).join("");
      finder.addEventListener("change", () => { if (names.has(finder.value)) show(finder.value); });
      finder.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        const q = finder.value.trim().toLowerCase();
        const hit = [...names].find((n) => n.toLowerCase() === q) || [...names].find((n) => n.toLowerCase().startsWith(q));
        if (hit) show(hit);
      });
    }
    paint();

    const tip = document.createElement("div");
    tip.className = "world-map-tip";
    tip.hidden = true;
    frame.appendChild(tip);

    // Click, keyboard, hover (no hover label on touch screens)
    let dragged = false, touched = false;
    frame.addEventListener("click", (e) => {
      if (dragged) return;
      const p = e.target.closest("path[data-country]");
      if (p) show(p.dataset.country, true);
    });
    frame.addEventListener("keydown", (e) => {
      const p = e.target.closest("path[data-country]");
      if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); show(p.dataset.country, true); }
    });
    frame.addEventListener("mousemove", (e) => {
      const p = e.target.closest("path[data-country]");
      if (!p || pointers.size || touched) { tip.hidden = true; return; }
      const box = frame.getBoundingClientRect();
      const f = facts[p.dataset.country];
      tip.textContent = p.dataset.country + (mode === "faith" && f && f.main ? ` · ${FAITH_LABELS[f.main] || f.main}` : "");
      tip.style.left = `${e.clientX - box.left}px`;
      tip.style.top = `${e.clientY - box.top}px`;
      tip.hidden = false;
    });
    frame.addEventListener("mouseleave", () => { tip.hidden = true; });
    frame.addEventListener("dblclick", (e) => { e.preventDefault(); const m = toMap(e.clientX, e.clientY); zoomBy(1.8, m.x, m.y); });
    // Zoom with the mouse wheel only while holding Ctrl (or pinching on a trackpad), so the page still scrolls normally
    frame.addEventListener("wheel", (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const m = toMap(e.clientX, e.clientY);
      zoomBy(e.deltaY < 0 ? 1.25 : 0.8, m.x, m.y);
    }, { passive: false });

    // Drag to move around, pinch to zoom (touch screens)
    const pointers = new Map();
    let start = null;
    frame.addEventListener("pointerdown", (e) => {
      touched = e.pointerType === "touch";
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragged = false;
      start = { view: { ...view }, pts: new Map(pointers) };
    });
    frame.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = svg.getBoundingClientRect();
      const scale = start.view.w / r.width;
      if (pointers.size === 1) {
        const s0 = start.pts.get(e.pointerId);
        if (!s0) return;
        const dx = e.clientX - s0.x, dy = e.clientY - s0.y;
        if (Math.abs(dx) + Math.abs(dy) < 6 && !dragged) return;
        if (start.view.w >= FULL.w) return; // nothing to move when fully zoomed out
        dragged = true;
        frame.setPointerCapture(e.pointerId);
        setView({ ...start.view, x: start.view.x - dx * scale, y: start.view.y - dy * scale });
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const [a0, b0] = [...start.pts.values()];
        if (!a0 || !b0) return;
        dragged = true;
        const d = Math.hypot(a.x - b.x, a.y - b.y), d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y) || 1;
        const factor = d / d0;
        const mid = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
        const cx = start.view.x + (mid.x - r.left) * scale, cy = start.view.y + (mid.y - r.top) * scale;
        const w = start.view.w / factor;
        setView({ w, x: cx - (cx - start.view.x) / factor, y: cy - (cy - start.view.y) / factor });
      }
    });
    const end = (e) => {
      pointers.delete(e.pointerId);
      start = { view: { ...view }, pts: new Map(pointers) };
      setTimeout(() => { if (!pointers.size) dragged = false; }, 0);
    };
    frame.addEventListener("pointerup", end);
    frame.addEventListener("pointercancel", end);
  }).catch(() => {
    section.hidden = true;
  });
});
