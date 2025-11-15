/* eslint-disable no-console */
/**
 * Standalone vehicle specials widget that mirrors the legacy test implementation
 * while remaining self-contained and embeddable on any page.
 */

const ROOT_ID = "rv-site-root";
const OFFERS_CONTAINER_ID = "offers-container";
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTqMMIq6hYycwe-QiCokW00vnrP1rdI30c9rj7u82gtdEmtQZa7nXV42dHhPeFwe99cogN1JpqJB9x/pub?gid=976470551&single=true&output=csv";
const FETCH_TIMEOUT_MS = 12000;
const IMAGE_PLACEHOLDER = "https://picsum.photos/seed/vehicle-special/960/540";
const CTA_TEXT = "Shop Now";
const CARD_GRADIENTS = [
  "linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)",
  "linear-gradient(90deg, #ff7a18 0%, #af002d 45%, #319197 100%)",
  "linear-gradient(90deg, #00b09b 0%, #96c93d 100%)",
  "linear-gradient(90deg, #f7797d 0%, #FBD786 50%, #C6FFDD 100%)"
];

let cachedRoot = null;

initializeWidget();

if (typeof window !== "undefined") {
  console.log("[sitescript] expose mount function on window");
  window.rvMountHelloWidget = mountHelloWidget;
}

/**
 * Bootstrap the widget once the DOM is ready so we can safely manipulate the page.
 */
function initializeWidget() {
  console.log("[sitescript] initializeWidget: document.readyState", document.readyState);
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        console.log("[sitescript] initializeWidget: DOMContentLoaded fired");
        void mountHelloWidget();
      },
      { once: true }
    );
    return;
  }

  void mountHelloWidget();
}

/**
 * Fetch the Google Sheet, normalise the dataset, and render the offers grid.
 */
async function mountHelloWidget() {
  console.log("[sitescript] mountHelloWidget: start");
  try {
    const root = ensureRootElement();
    if (!root) {
      console.warn("[sitescript] mountHelloWidget: root not resolved, aborting");
      return;
    }

    renderLoadingState(root);

    const csvText = await fetchCsvWithTimeout(CSV_URL, FETCH_TIMEOUT_MS);
    const parsed = parseCsv(csvText);
    const dataset = convertRowsToObjects(parsed);
    const offers = normalizeOffers(dataset);

    if (!offers.length) {
      renderEmptyState(root);
      return;
    }

    renderOffers(root, offers);
  } catch (error) {
    console.error("[sitescript] mountHelloWidget: failed", error);
    const root = ensureRootElement();
    if (root) {
      renderErrorState(root, error instanceof Error ? error.message : "Unexpected error");
    }
  }
}

/**
 * Return the container that should host the widget. Prefer the existing
 * #offers-container element, fall back to a dedicated root div if necessary.
 */
function ensureRootElement() {
  console.log("[sitescript] ensureRootElement: start");

  if (cachedRoot && document.body.contains(cachedRoot)) {
    console.log("[sitescript] ensureRootElement: using cached root", cachedRoot);
    return cachedRoot;
  }

  const offersContainer = document.getElementById(OFFERS_CONTAINER_ID);
  if (offersContainer) {
    console.log("[sitescript] ensureRootElement: found offers container", offersContainer);
    offersContainer.classList.add("rv-widget");
    cachedRoot = offersContainer;
    return offersContainer;
  }

  const fallbackRoot = document.getElementById(ROOT_ID);
  if (fallbackRoot) {
    console.log("[sitescript] ensureRootElement: found fallback root", fallbackRoot);
    cachedRoot = fallbackRoot;
    return fallbackRoot;
  }

  if (!document.body) {
    console.warn("[sitescript] ensureRootElement: document.body missing");
    return null;
  }

  const newRoot = document.createElement("div");
  newRoot.id = ROOT_ID;
  newRoot.className = "rv-widget";
  document.body.appendChild(newRoot);
  console.log("[sitescript] ensureRootElement: created fallback root", newRoot);

  cachedRoot = newRoot;
  return newRoot;
}

/**
 * Show an inline loading message while we fetch data.
 */
function renderLoadingState(target) {
  console.log("[sitescript] renderLoadingState: rendering loader");
  loadSiteScriptStyles();
  target.innerHTML = `
    <section class="sitescript-fullwidth-box">
      <div class="sitescript-inner">
        <div class="sitescript-loading">Loading live vehicle specials…</div>
      </div>
    </section>
  `;
}

/**
 * Present the parsed offers inside the styled card layout.
 */
function renderOffers(target, offers) {
  console.log("[sitescript] renderOffers: rendering", offers.length, "offers");

  loadSiteScriptStyles();
  target.innerHTML = "";

  const section = document.createElement("section");
  section.className = "sitescript-fullwidth-box";

  const inner = document.createElement("div");
  inner.className = "sitescript-inner";

  const cardsWrapper = document.createElement("div");
  cardsWrapper.className = "sitescript-rects";

  offers.forEach((offer, index) => {
    const card = createOfferCard(offer, index);
    cardsWrapper.appendChild(card);
  });

  inner.appendChild(cardsWrapper);
  section.appendChild(inner);
  target.appendChild(section);

  console.log("[sitescript] renderOffers: render complete");
}

/**
 * Render a friendly message when we have no visible data to show.
 */
function renderEmptyState(target) {
  console.log("[sitescript] renderEmptyState: no visible offers found");
  loadSiteScriptStyles();
  target.innerHTML = `
    <section class="sitescript-fullwidth-box">
      <div class="sitescript-inner">
        <div class="sitescript-empty">
          <h3>No live offers to display</h3>
          <p>Update your Google Sheet and mark the specials as visible to surface them here.</p>
        </div>
      </div>
    </section>
  `;
}

/**
 * Show an actionable error message when data retrieval fails.
 */
function renderErrorState(target, message) {
  console.log("[sitescript] renderErrorState: displaying error", message);
  loadSiteScriptStyles();
  target.innerHTML = `
    <section class="sitescript-fullwidth-box">
      <div class="sitescript-inner">
        <div class="sitescript-error">
          <h3>We hit a snag loading specials.</h3>
          <p>${escapeHtml(message)}</p>
          <button type="button" class="sitescript-retry" id="rv-retry-fetch">Retry</button>
        </div>
      </div>
    </section>
  `;

  const retry = document.getElementById("rv-retry-fetch");
  if (retry) {
    retry.addEventListener("click", () => {
      void mountHelloWidget();
    });
  }
}

/**
 * Build a single offer card using the shared styles and gradients.
 */
function createOfferCard(offer, index) {
  const wrapper = document.createElement("article");
  wrapper.className = "sitescript-rect";
  wrapper.style.setProperty("--g", CARD_GRADIENTS[index % CARD_GRADIENTS.length]);

  const inner = document.createElement("div");
  inner.className = "inner";

  if (offer.imageUrl) {
    const media = document.createElement("div");
    media.className = "card-media";

    const img = document.createElement("img");
    img.className = "card-image";
    img.src = offer.imageUrl;
    img.alt = offer.title ? `${offer.title} vehicle photo` : "Vehicle photo";
    img.loading = "lazy";

    media.appendChild(img);
    inner.appendChild(media);
  }

  const content = document.createElement("div");
  content.className = "card-content";

  const tag = document.createElement("span");
  tag.className = "card-tag";
  tag.textContent = offer.badge || "Special Offer";
  content.appendChild(tag);

  const title = document.createElement("h3");
  title.className = "title";
  title.textContent = offer.title || "Vehicle Special";
  content.appendChild(title);

  if (offer.highlight) {
    const highlight = document.createElement("p");
    highlight.className = "highlight";
    highlight.textContent = offer.highlight;
    content.appendChild(highlight);
  }

  if (offer.description) {
    const body = document.createElement("p");
    body.className = "body";
    body.textContent = offer.description;
    content.appendChild(body);
  }

  if (offer.linkUrl) {
    const cta = document.createElement("a");
    cta.className = "card-cta";
    cta.href = offer.linkUrl;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";
    cta.textContent = offer.ctaLabel || CTA_TEXT;
    content.appendChild(cta);
  }

  inner.appendChild(content);
  wrapper.appendChild(inner);
  return wrapper;
}

/**
 * Fetch the CSV with an AbortController-based timeout to avoid hanging forever.
 */
async function fetchCsvWithTimeout(url, timeout) {
  console.log("[sitescript] fetchCsvWithTimeout: fetching", url);
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-cache",
      headers: { Accept: "text/csv" },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.text();
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Parse the CSV payload into a header list and 2D array of rows.
 */
function parseCsv(text) {
  if (!text || !text.trim()) {
    return { headers: [], rows: [] };
  }

  const rows = [];
  let record = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      record.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (current.length || record.length) {
        record.push(current);
        rows.push(record);
        record = [];
        current = "";
      }
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      continue;
    }

    current += char;
  }

  if (current.length || record.length) {
    record.push(current);
    rows.push(record);
  }

  const headerRow = rows.shift() ?? [];
  const headers = headerRow.map((value) => toCamelCase(value ?? ""));
  return { headers, rows };
}

/**
 * Turn the 2D array into an array of keyed objects for easier lookups.
 */
function convertRowsToObjects(parsed) {
  const { headers, rows } = parsed;
  return rows.map((cols) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = (cols[index] ?? "").trim();
    });
    entry.__raw = cols.map((value) => (value ?? "").trim());
    return entry;
  });
}

/**
 * Reduce the raw records into normalized offer objects tailored for the UI.
 */
function normalizeOffers(dataset) {
  console.log("[sitescript] normalizeOffers: dataset size", dataset.length);
  return dataset
    .slice(10)
    .filter(isRecordVisible)
    .map((record) => {
      const raw = Array.isArray(record.__raw) ? record.__raw : [];
      const fallbackTitle = raw[0] ?? "";
      const fallbackHighlight = raw[1] ?? "";
      const fallbackDescription = raw[2] ?? "";
      const fallbackImage = raw[4] ?? "";
      const fallbackLink = raw[5] ?? "";

      return {
        badge: pickFirst(record, ["badge", "tag", "category", "offerTag"]) || "Special Offer",
        title: pickFirst(record, ["vehicleName", "offerTitle", "headline", "model", "name"]) || fallbackTitle,
        highlight: pickFirst(record, ["offerHeadline", "totalSavings", "primaryOffer", "headlineText"]) || fallbackHighlight,
        description: pickFirst(record, ["offerDescription", "bodyCopy", "details", "copy"]) || fallbackDescription,
        imageUrl: resolveImageUrl(
          pickFirst(record, [
            "image",
            "imageUrl",
            "primaryImage",
            "offerImage",
            "vehicleImage",
            "heroImage",
            "photo"
          ]) || fallbackImage
        ),
        linkUrl:
          pickFirst(record, ["ctaUrl", "ctaLink", "offerLink", "buttonUrl", "vehicleLink", "link"]) || fallbackLink,
        ctaLabel: pickFirst(record, ["ctaLabel", "buttonText", "ctaText", "linkLabel"]) || CTA_TEXT
      };
    })
    .filter((offer) => Boolean(offer.title));
}

/**
 * Determine whether a record should be displayed based on visibility flags.
 */
function isRecordVisible(record) {
  const visibility = pickFirst(record, [
    "containsOffer",
    "visibleOnSpecials",
    "visible",
    "show",
    "display",
    "isPublished"
  ]);

  if (!visibility) {
    return false;
  }

  const normalized = visibility.toLowerCase();
  return normalized === "true" || normalized === "yes" || normalized === "1";
}

/**
 * Pick the first populated value from a list of possible keys.
 */
function pickFirst(record, keys) {
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    if (record[key] && record[key].trim()) {
      return record[key].trim();
    }
  }
  return "";
}

/**
 * Normalise image URLs and fall back to a placeholder when needed.
 */
function resolveImageUrl(candidate) {
  if (!candidate) {
    return IMAGE_PLACEHOLDER;
  }

  try {
    const absolute = new URL(candidate, window.location.href);
    return absolute.href;
  } catch (_error) {
    return candidate;
  }
}

/**
 * Convert arbitrary strings to camelCase keys to simplify lookups.
 */
function toCamelCase(value) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

/**
 * Escape user-provided content before injecting into HTML.
 */
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (match) => {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return match;
    }
  });
}

/**
 * Inject shared styles only once to keep the widget self-contained.
 */
function loadSiteScriptStyles() {
  if (document.getElementById("sitescript-shared-styles")) {
    return;
  }

  const css = `
    .sitescript-fullwidth-box {
      width: 100%;
      box-sizing: border-box;
      background: #f8fafc;
      padding: 36px 16px;
      display: flex;
      justify-content: center;
      font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #0f172a;
    }

    .sitescript-inner {
      width: 100%;
      max-width: 1200px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .sitescript-rects {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }

    .sitescript-rect {
      border-radius: 18px;
      padding: 3px;
      background: linear-gradient(120deg, #312e81 0%, #1d4ed8 60%, #38bdf8 100%);
      box-sizing: border-box;
      transition: transform 180ms ease, box-shadow 180ms ease;
    }

    .sitescript-rect:hover {
      transform: translateY(-4px);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22);
    }

    .sitescript-rect .inner {
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: #fff;
      border-radius: 15px;
      padding: 20px;
      min-height: 260px;
      box-sizing: border-box;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
    }

    .card-media {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 12px;
      overflow: hidden;
      background: #e2e8f0;
    }

    .card-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .card-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-tag {
      display: inline-flex;
      align-self: flex-start;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.08);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #1f2937;
    }

    .sitescript-rect .title {
      margin: 0;
      font-size: 1.35rem;
      line-height: 1.3;
      font-weight: 700;
      color: #0f172a;
    }

    .card-content .highlight {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1d4ed8;
    }

    .sitescript-rect .body {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.6;
      color: #475569;
    }

    .card-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: fit-content;
      padding: 10px 18px;
      border-radius: 999px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: #1d4ed8;
      color: #fff;
      transition: background 160ms ease, transform 160ms ease;
    }

    .card-cta:hover {
      background: #1e40af;
      transform: translateY(-2px);
    }

    .sitescript-loading,
    .sitescript-empty,
    .sitescript-error {
      padding: 32px;
      border-radius: 18px;
      background: rgba(15, 23, 42, 0.06);
      text-align: center;
    }

    .sitescript-empty h3,
    .sitescript-error h3 {
      margin: 0 0 12px 0;
      font-size: 1.25rem;
    }

    .sitescript-empty p,
    .sitescript-error p {
      margin: 0;
      color: #475569;
    }

    .sitescript-retry {
      margin-top: 20px;
      padding: 10px 18px;
      border: none;
      border-radius: 999px;
      background: #1d4ed8;
      color: #fff;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      cursor: pointer;
      transition: background 160ms ease, transform 160ms ease;
    }

    .sitescript-retry:hover {
      background: #1e40af;
      transform: translateY(-2px);
    }

    @media (max-width: 640px) {
      .sitescript-fullwidth-box {
        padding: 24px 12px;
      }

      .sitescript-inner {
        gap: 20px;
      }

      .sitescript-rect .inner {
        padding: 16px;
      }

      .sitescript-rect .title {
        font-size: 1.15rem;
      }
    }
  `;

  const style = document.createElement("style");
  style.id = "sitescript-shared-styles";
  style.textContent = css;
  document.head.appendChild(style);
}