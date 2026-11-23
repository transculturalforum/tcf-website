// WORLD MAP on the Cultures page: click (or tap) a country to read about its culture.
// The map drawing is images/world-map.svg (country shapes from Natural Earth, public domain).
// The text in the side panel is read from the culture cards further down the page,
// so editing a culture card updates the map too.
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
  "Mexico": ["mexican", "latin_american"],
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
  "New Zealand": ["polynesian"],
};
const AFRICA = ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cameroon",
  "Central African Republic", "Chad", "Congo", "Côte d'Ivoire", "Democratic Republic of the Congo",
  "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
  "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi",
  "Mali", "Mauritania", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Senegal",
  "Sierra Leone", "Somalia", "Somaliland", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo",
  "Tunisia", "Uganda", "Western Sahara", "Zambia", "Zimbabwe"];
AFRICA.forEach((c) => { CULTURES_BY_COUNTRY[c] = [...(CULTURES_BY_COUNTRY[c] || []), "african"]; });

document.addEventListener("DOMContentLoaded", () => {
  const frame = document.getElementById("world-map");
  const panel = document.getElementById("world-map-panel");
  if (!frame || !panel) return;

  const text = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function cultureInfo(key) {
    const card = document.getElementById("culture-" + key);
    if (!card) return null;
    const fact = (name) => text(card.querySelector(`[data-fact="${name}"] .fact-value`));
    return {
      id: card.id,
      name: text(card.querySelector("h2")),
      region: text(card.querySelector(".region-tag")),
      facts: [["Population", fact("population")], ["Languages", fact("languages")], ["Main faiths", fact("faiths")], ["Key festivals", fact("festival")], ["Signature food", fact("dish")]].filter(([, v]) => v),
    };
  }

  function show(country, path) {
    frame.querySelectorAll("path.is-selected").forEach((p) => p.classList.remove("is-selected"));
    frame.querySelectorAll(`path[data-country="${CSS.escape(country)}"]`).forEach((p) => p.classList.add("is-selected"));
    const list = (CULTURES_BY_COUNTRY[country] || []).map(cultureInfo).filter(Boolean);
    panel.innerHTML = `<h3>${esc(country)}</h3>` + (list.length
      ? list.map((c) => `
        <div class="map-culture">
          <h4>${esc(c.name)}</h4>
          <span class="map-region">${esc(c.region)}</span>
          <dl>${c.facts.slice(0, 4).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
          <button type="button" class="map-read-more" data-card="${c.id}">Read the full profile</button>
        </div>`).join("")
      : `<p class="map-hint">We have not written about ${esc(country)} yet. The green countries have a culture profile.</p>`);
    if (window.matchMedia("(max-width: 960px)").matches && path) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  fetch("images/world-map.svg").then((r) => r.text()).then((svg) => {
    frame.insertAdjacentHTML("afterbegin", svg);
    const tip = document.createElement("div");
    tip.className = "world-map-tip";
    tip.hidden = true;
    frame.appendChild(tip);
    frame.querySelectorAll("path[data-country]").forEach((p) => {
      const name = p.dataset.country;
      const count = (CULTURES_BY_COUNTRY[name] || []).length;
      if (!count) return;
      p.classList.add("has-culture");
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      p.setAttribute("aria-label", `${name}: read about ${count === 1 ? "its culture" : count + " cultures"}`);
    });
    frame.addEventListener("click", (e) => {
      const p = e.target.closest("path[data-country]");
      if (p) show(p.dataset.country, p);
    });
    frame.addEventListener("keydown", (e) => {
      const p = e.target.closest("path.has-culture");
      if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); show(p.dataset.country, p); }
    });
    frame.addEventListener("mousemove", (e) => {
      const p = e.target.closest("path[data-country]");
      if (!p) { tip.hidden = true; return; }
      const box = frame.getBoundingClientRect();
      tip.textContent = p.dataset.country;
      tip.style.left = `${e.clientX - box.left}px`;
      tip.style.top = `${e.clientY - box.top}px`;
      tip.hidden = false;
    });
    frame.addEventListener("mouseleave", () => { tip.hidden = true; });
  }).catch(() => {
    frame.closest(".world-map-section").hidden = true;
  });
});
