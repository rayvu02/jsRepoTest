/* eslint-disable no-console */
/**
 * Standalone vehicle specials widget that mirrors the legacy test implementation
 * while remaining self-contained and embeddable on any page.
 */

const ROOT_ID = "rv-site-root";
const OFFERS_CONTAINER_ID = "offers-container";
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTqMMIq6hYycwe-QiCokW00vnrP1rdI30c9rj7u82gtdEmtQZa7nXV42dHhPeFwe99cogN1JpqJB9x/pub?gid=976470551&single=true&output=csv";
const FETCH_TIMEOUT_MS = 12000;
const IMAGE_PLACEHOLDER = "";
const CTA_TEXT = "Shop Now";

let cachedRoot = null; //DOM element where the widget will be mounted
const TAILWIND_SCRIPT_ID = "tailwind-cdn-script"; //ID of the Tailwind CSS script
const TAILWIND_CONFIG_ID = "tailwind-cdn-config"; //ID of the Tailwind CSS config
let tailwindReadyPromise = null; //Promise that resolves when Tailwind CSS is loaded so it is not loaded multiple times

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

  void mountHelloWidget(); //Mount the widget once the DOM is ready
}

/**
 * Fetch the Google Sheet, normalise the dataset, and render the offers grid.
 */
async function mountHelloWidget() {
  console.log("[sitescript] mountHelloWidget: start");
  try {
    await loadTailwind(); //Wait for Tailwind CSS to load, things will break if it's not loaded first
    console.log("[sitescript] mountHelloWidget: Tailwind loaded");
    
    const root = ensureRootElement(); //Gets or creates the root element where the widget will be mounted
    if (!root) {
      console.warn("[sitescript] mountHelloWidget: root not found, abort");
      return;
    }

    renderLoadingState(root);

    const csvText = await fetchCsvWithTimeout(CSV_URL, FETCH_TIMEOUT_MS); //Get the csv from the google sheet link
    const rows = extractDataRows(csvText); //Extract the data from the csv
    const offers = normalizeOffers(rows); //Normalize the data (break them down into what we need and want)

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

  //Check if the root element has already been found and cached, use it if it is
  if (cachedRoot && document.body.contains(cachedRoot)) {
    console.log("[sitescript] ensureRootElement: using cached root", cachedRoot);
    return cachedRoot;
  }

  //Find the div that should already exist on the page
  const offersContainer = document.getElementById(OFFERS_CONTAINER_ID);
  if (offersContainer) {
    console.log("[sitescript] ensureRootElement: found offers container", offersContainer);
    offersContainer.classList.add("rv-widget");
    cachedRoot = offersContainer;
    return offersContainer;
  }

  //This finds the backup location for the widget if the offers container is not found
  const fallbackRoot = document.getElementById(ROOT_ID);
  if (fallbackRoot) {
    console.log("[sitescript] ensureRootElement: found fallback root", fallbackRoot);
    cachedRoot = fallbackRoot;
    return fallbackRoot;
  }

  //Check if the body element exists, if not, return null means we have no where to put it
  if (!document.body) {
    console.warn("[sitescript] ensureRootElement: document.body missing");
    return null;
  }

  //This creates the backup div if the offers container and the backup is not found
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

  //Basic stlying for the whole widget while loading
  target.innerHTML = `
    <section class="bg-gradient-to-br from-white via-blue-50 to-sky-100 py-20 px-4 sm:px-8 text-slate-700">
      <div class="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <span class="relative flex h-12 w-12 items-center justify-center">
          <span class="absolute h-full w-full rounded-full border-2 border-slate-300/70"></span>
          <span class="absolute h-full w-full animate-spin rounded-full border-2 border-transparent border-t-sky-500"></span>
        </span>
        <p class="text-base font-medium text-slate-600 sm:text-lg">Loading live vehicle specials…</p>
      </div>
    </section>
  `;
}

/**
 * Present the parsed offers inside the styled card layout.
 */
function renderOffers(target, offers) {
  console.log("[sitescript] renderOffers: rendering", offers.length, "offers");

  target.innerHTML = ""; //clear the target element (removes any existing content)

  const section = document.createElement("section");
  section.className = "bg-gradient-to-br from-white via-blue-50 to-sky-100 py-20 px-4 sm:px-8 text-slate-900"; //back ground gradient, TODO: Might remove this later

  const inner = document.createElement("div");
  inner.className = "mx-auto w-full max-w-7xl";

  const cardsWrapper = document.createElement("div");
  //Grid layout for the cards: 1 column on mobile, 2 columns max on larger screens for wider cards
  cardsWrapper.className = "grid grid-cols-1 gap-10 lg:grid-cols-2 auto-rows-fr"; 

  //Create a card for each offer
  offers.forEach((offer, index) => {
    const card = createOfferCard(offer, index);
    cardsWrapper.appendChild(card);
  });

  //Nest objects together: cards go into the inner div, and the inner div goes into the section
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
  target.innerHTML = `
    <section class="bg-gradient-to-br from-white via-blue-50 to-sky-100 py-20 px-4 sm:px-8 text-slate-800">
      <div class="mx-auto max-w-3xl rounded-3xl border border-sky-200 bg-white/95 p-12 text-center shadow-[0_35px_80px_rgba(14,165,233,0.25)] backdrop-blur-md">
        <h3 class="text-2xl font-semibold text-slate-900 sm:text-3xl">No live offers to display</h3>
        <p class="mt-4 text-base text-slate-600 sm:text-lg">Update your Google Sheet and mark the specials as visible to surface them here.</p>
      </div>
    </section>
  `;
}

/**
 * Show an actionable error message when data retrieval fails.
 */
function renderErrorState(target, message) {
  console.log("[sitescript] renderErrorState: displaying error", message);
  target.innerHTML = `
    <section class="bg-gradient-to-br from-white via-blue-50 to-sky-100 py-20 px-4 sm:px-8 text-slate-900">
      <div class="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white/95 p-12 text-center shadow-[0_35px_80px_rgba(249,115,22,0.25)] backdrop-blur-md">
        <h3 class="text-2xl font-semibold text-red-600 sm:text-3xl">We hit a snag loading specials.</h3>
        <p class="mt-4 text-base text-slate-600 sm:text-lg">${escapeHtml(message)}</p>
        <button
          type="button"
          id="rv-retry-fetch"
          class="relative mt-8 inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 bg-[length:200%_100%] px-6 py-3 text-sm font-semibold uppercase tracking-[0.32em] text-red-900 shadow-lg transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-300/70 focus:ring-offset-2 focus:ring-offset-white animate-cta-gradient"
        >
          <span class="pointer-events-none absolute inset-0 translate-x-[-140%] bg-[linear-gradient(120deg,rgba(255,255,255,0.9),rgba(255,255,255,0.2),rgba(255,255,255,0.6))] opacity-0 animate-cta-shimmer"></span>
          <span class="relative">Retry</span>
        </button>
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
function createOfferCard(offerData, index) {
  const wrapper = document.createElement("article"); //Create a new article element for the card
  //Stlying for the card, rounded corners, border, shadow, and hover effect, set height, and the animation for the border
  wrapper.className = "relative isolate h-full rounded-[28px] p-[3px] overflow-hidden animate-border-streak shadow-[0_20px_60px_rgba(59,130,246,0.3)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(59,130,246,0.4)]";

  const body = document.createElement("div");
  //body stlying for the card, rounded corners, border, background color, and padding
  body.className = "flex h-full flex-col rounded-[26px] border border-white/60 bg-white p-2";

  if (offerData.imageUrl) {
    const media = document.createElement("div");
    //media container: uses background-image so we can control sizing, removes forced aspect ratio
    media.className = "relative w-full min-h-64 max-h-80 overflow-hidden rounded-xl bg-slate-100 bg-center bg-no-repeat";
    //set vehicle photo as background
    media.style.backgroundImage = `url('${offerData.imageUrl}')`;
    //background-size contain shows full image, will scale to fit without cropping
    media.style.backgroundSize = "contain";
    //add ARIA labels for accessibility since background images aren't read by screen readers
    media.setAttribute('role', 'img');
    media.setAttribute('aria-label', offerData.title ? `${offerData.title} vehicle photo` : 'Vehicle photo');

    body.appendChild(media);
  }

  const content = document.createElement("div"); //Create a new div element for the content the content area
  content.className = "flex flex-col flex-1 justify-between gap-2 rounded-xl bg-slate-50/90 p-3 mt-2 shadow-inner";

  const textWrapper = document.createElement("div");
  textWrapper.className = "flex flex-col gap-2";

  const tag = document.createElement("span");
  //tag stlying for the tag (Special Offer), rounded corners, background color, padding, font size, font weight, uppercase, and text color
  tag.className = "inline-flex w-max items-center rounded-full bg-sky-100 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-sky-600";
  tag.textContent = offerData.badge || "Special Offer";
  textWrapper.appendChild(tag);

  const title = document.createElement("h3"); //Create a new h3 element for the title (name of the vehicle)
  //title stlying for the title, font size, font weight, line clamp, and text color
  title.className = "text-xl font-semibold text-slate-900 line-clamp-2";
  title.textContent = offerData.title || "Vehicle Special";
  textWrapper.appendChild(title);

  if (offerData.offer) {
    const offerLine = document.createElement("p"); //Create a new p element for the offer (price of the vehicle)
    //offerLine stlying for the offer, font size, font weight, line clamp, and text color
    offerLine.className = "text-base font-semibold text-sky-600 line-clamp-3";
    offerLine.textContent = offerData.offer;
    textWrapper.appendChild(offerLine);
  }

  content.appendChild(textWrapper);

  //if the link url is present, create a new a element button to click to go to the vehicle page
  if (offerData.linkUrl) {
    const cta = document.createElement("a");
    //Stlying for the button, rounded corners, background color, padding, font size, font weight, uppercase, text color white, shadow, hover effect, and animation for the button
    cta.className = "card-cta relative mt-2 inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.3em] text-white shadow-[0_10px_30px_rgba(79,70,229,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(79,70,229,0.5)] focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:ring-offset-2 focus:ring-offset-white animate-cta-streak";
    cta.href = offerData.linkUrl;
    cta.target = "_blank";
    cta.rel = "noopener noreferrer";

    const label = document.createElement("span"); //Create a new span element for the label (text of the button)
    //label stlying for the label, relative position, z-index
    label.className = "relative z-10";
    label.textContent = offerData.ctaLabel || CTA_TEXT;
    cta.appendChild(label);

    content.appendChild(cta);
  }

  body.appendChild(content);
  wrapper.appendChild(body);
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
 * Split the CSV export into data rows (starting at row 11) and return a matrix
 * where each entry represents the original comma-separated columns.
 */
function extractDataRows(csvText) {
  if (!csvText) {
    return [];
  }

  const lines = csvText
    .split(/\r?\n/)
    .slice(10)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) =>
    line
      .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      .map((cell) => cell.replace(/^"|"$/g, "").trim())
  );
}

/**
 * Reduce the raw matrix into normalized offer objects tailored for the UI.
 */
function normalizeOffers(rows) {
  console.log("[sitescript] normalizeOffers: row count", rows.length);

  const MODEL_INDEX = 0; // "Model"
  const OFFER_INDEX = 1; // "Offer"
  const DESCRIPTION_INDEX = 2; // "Desc."
  const VISIBLE_INDEX = 3; // "Visible on Specials"
  const IMAGE_INDEX = 4; // "Image URL of Vehicle"
  const LINK_INDEX = 5; // "Link to Vehicle"

  return rows
    .filter((row) => {
      const visibility = (row[VISIBLE_INDEX] || "").toString().trim().toLowerCase();
      return visibility === "true";
    })
    .map((row) => ({
      title: (row[MODEL_INDEX] || "").trim(),
      offer: (row[OFFER_INDEX] || "").trim(),
      description: (row[DESCRIPTION_INDEX] || "").trim(),
      imageUrl: resolveImageUrl((row[IMAGE_INDEX] || "").trim()),
      linkUrl: (row[LINK_INDEX] || "").trim(),
      badge: "Special Offer",
      ctaLabel: CTA_TEXT
    }))
    .filter((offer) => Boolean(offer.title));
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
 * Escape user-provided content before injecting into HTML.
 * Error messages fetched are ensured to be literal text and not as executed as code.
 */
function escapeHtml(value) {
  const safeValue = (value ?? "").toString();
  return safeValue.replace(/[&<>"']/g, (match) => {
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
 * Configure Tailwind CSS to use the custom properties for the border animation. 
 * This is used to create the animated border effect on the cards.
 */
function configureTailwind() {
  if (typeof window === "undefined") {
    return;
  }

  if (document.getElementById(TAILWIND_CONFIG_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = TAILWIND_CONFIG_ID;
  style.textContent = `
    @property --border-angle {
      syntax: '<angle>';
      inherits: false;
      initial-value: 0deg;
    }

    @keyframes border-rotate {
      0% {
        --border-angle: 0deg;
      }
      100% {
        --border-angle: 360deg;
      }
    }

    @keyframes cta-streak {
      0% {
        transform: translateX(-200%) skewX(-15deg);
        opacity: 0;
      }
      10% {
        opacity: 0.7;
      }
      50% {
        opacity: 0.9;
      }
      90% {
        opacity: 0.7;
      }
      100% {
        transform: translateX(200%) skewX(-15deg);
        opacity: 0;
      }
    }

    .animate-border-streak {
      position: relative;
      background: linear-gradient(to bottom right, rgb(56, 189, 248), rgb(59, 130, 246), rgb(79, 70, 229));
      background-clip: padding-box;
    }

    .animate-border-streak::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 3px;
      background: conic-gradient(
        from var(--border-angle),
        transparent 0deg,
        transparent 60deg,
        rgb(251, 146, 60) 90deg,
        rgb(239, 68, 68) 180deg,
        rgb(236, 72, 153) 270deg,
        transparent 300deg,
        transparent 360deg
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, 
                    linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      animation: border-rotate 3s linear infinite;
      pointer-events: none;
    }

    .animate-cta-streak::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, 
        transparent 0%, 
        rgb(251, 146, 60) 20%, 
        rgb(239, 68, 68) 50%, 
        rgb(236, 72, 153) 80%, 
        transparent 100%);
      border-radius: inherit;
      animation: cta-streak 4s ease-in-out infinite;
      pointer-events: none;
      z-index: 1;
    }

    /* Prevent visited link color from turning buttons black */
    a.card-cta,
    a.card-cta:visited,
    a.card-cta:hover,
    a.card-cta:active {
      color: white !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Load Tailwind CSS from the CDN.
 */
function loadTailwind() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  //Inject the custom tailwind animation before the tailwind script is loaded.
  configureTailwind();

  //If the tailwind script is already loaded, return the promise
  if (tailwindReadyPromise) {
    return tailwindReadyPromise;
  }

  //This creates a new promise to load the tailwind script, it will resolve when the script is loaded and the custom animation is injected.
  tailwindReadyPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TAILWIND_SCRIPT_ID);
    if (existingScript) {
      if (existingScript.dataset.ready === "true") {
        resolve();
        return;
      }
      existingScript.addEventListener(
        "load",
        () => {
          existingScript.dataset.ready = "true";
          resolve();
        },
        { once: true }
      );
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    //This allows us to get access to tailwind classes via the tailwind CDN
    const script = document.createElement("script"); //Create a new script element to load the tailwind script
    script.src = "https://cdn.tailwindcss.com"; //Set the source of the script to the tailwind css cdn
    script.id = TAILWIND_SCRIPT_ID;
    script.onload = () => {
      script.dataset.ready = "true";
      resolve();
    };
    script.onerror = (error) => reject(error);
    document.head.appendChild(script);
  });

  return tailwindReadyPromise;
}

// Kick off Tailwind loading immediately
configureTailwind();
loadTailwind();