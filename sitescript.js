/* eslint-disable @typescript-eslint/no-use-before-define */
(function prizeSiteScript() {
  'use strict';

  const ROOT_ID = 'prize-dynamic-root';
  const STYLE_ID = 'prize-tailwind-v4-styles';
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRTqMMIq6hYycwe-QiCokW00vnrP1rdI30c9rj7u82gtdEmtQZa7nXV42dHhPeFwe99cogN1JpqJB9x/pub?gid=976470551&single=true&output=csv';
  const FETCH_TIMEOUT_MS = 12000;
  const IMAGE_PLACEHOLDER = 'https://picsum.photos/seed/prize-showcase/960/720';

  if (document.getElementById(ROOT_ID)) {
    console.info('Prize showcase script already mounted.');
    return;
  }

  init();

  function init() {
    injectBaseStyles();
    mountLayout();
  }

  function injectBaseStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const styleTag = document.createElement('style');
    styleTag.id = STYLE_ID;
    styleTag.textContent = `
      :root {
        color-scheme: dark;
        font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
        background-color: #020617;
      }

      *, *::before, *::after {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background-color: #020617;
        color: #e2e8f0;
        font-family: inherit;
        -webkit-font-smoothing: antialiased;
      }

      img {
        max-width: 100%;
        display: block;
      }

      button {
        font: inherit;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .tw-min-h-screen { min-height: 100vh; }
      .tw-w-full { width: 100%; }
      .tw-bg-slate-950 { background-color: #020617; }
      .tw-text-white { color: #f8fafc; }
      .tw-font-sans { font-family: inherit; }
      .tw-flex { display: flex; }
      .tw-flex-col { flex-direction: column; }
      .tw-items-center { align-items: center; }
      .tw-gap-12 { gap: 3rem; }
      .tw-gap-10 { gap: 2.5rem; }
      .tw-gap-8 { gap: 2rem; }
      .tw-gap-6 { gap: 1.5rem; }
      .tw-gap-4 { gap: 1rem; }
      .tw-mx-auto { margin-left: auto; margin-right: auto; }
      .tw-px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
      .tw-py-20 { padding-top: 5rem; padding-bottom: 5rem; }
      .tw-text-center { text-align: center; }
      .tw-text-left { text-align: left; }
      .tw-relative { position: relative; }
      .tw-rounded-3xl { border-radius: 1.5rem; }
      .tw-rounded-2xl { border-radius: 1rem; }
      .tw-rounded-xl { border-radius: 0.75rem; }
      .tw-shadow-2xl { box-shadow: 0 35px 80px rgba(15, 23, 42, 0.55); }
      .tw-text-5xl { font-size: clamp(2.75rem, 4vw, 3.5rem); font-weight: 700; line-height: 1.1; }
      .tw-text-lg { font-size: 1.125rem; line-height: 1.65; color: rgba(226, 232, 240, 0.78); }
      .tw-font-medium { font-weight: 600; }
      .tw-font-semibold { font-weight: 700; }
      .tw-uppercase { text-transform: uppercase; letter-spacing: 0.2em; font-weight: 600; font-size: 0.75rem; color: rgba(226, 232, 240, 0.6); }
      .tw-opacity-80 { opacity: 0.8; }
      .tw-inline-flex { display: inline-flex; }
      .tw-items-baseline { align-items: baseline; }
      .tw-justify-center { justify-content: center; }
      .tw-justify-between { justify-content: space-between; }
      .tw-flex-wrap { flex-wrap: wrap; }
      .tw-max-w-6xl { max-width: 72rem; }
      .tw-max-w-3xl { max-width: 48rem; }
      .tw-leading-relaxed { line-height: 1.7; }
      .tw-space-y-6 > * + * { margin-top: 1.5rem; }
      .tw-space-y-4 > * + * { margin-top: 1rem; }
      .tw-hidden { display: none !important; }
      .tw-grid { display: grid; }
      .tw-grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
      .tw-relative { position: relative; }
      .tw-overflow-hidden { overflow: hidden; }
      .tw-h-full { height: 100%; }
      .tw-aspect-video { aspect-ratio: 16 / 9; }
      .tw-object-cover { object-fit: cover; }
      .tw-backdrop-blur { backdrop-filter: blur(16px); }
      .tw-bg-slate-900 { background-color: rgba(15, 23, 42, 0.85); }
      .tw-border { border: 1px solid rgba(148, 163, 184, 0.15); }
      .tw-text-sm { font-size: 0.95rem; line-height: 1.55; color: rgba(226, 232, 240, 0.72); }
      .tw-text-xs { font-size: 0.78rem; line-height: 1.4; color: rgba(203, 213, 225, 0.75); }
      .tw-inline-block { display: inline-block; }
      .tw-transition { transition: all 180ms ease; }
      .tw-duration-200 { transition-duration: 200ms; }
      .tw-ease-out { transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
      .tw-translate-y-0 { transform: translateY(0); }
      .tw-translate-y-1 { transform: translateY(4px); }
      .tw-ring-2 { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4); }
      .tw-ring-offset-2 { box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.9); }
      .tw-text-balance { text-wrap: balance; }

      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes borderGlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(50%); opacity: 0.4; }
        100% { transform: translateX(100%); opacity: 0; }
      }

      .tw-gradient-banner {
        position: relative;
        width: 100%;
        padding: clamp(3rem, 8vw, 6rem) clamp(1.5rem, 6vw, 4rem);
        border-radius: 2.5rem;
        overflow: hidden;
        background: linear-gradient(120deg, rgba(59, 130, 246, 0.95), rgba(236, 72, 153, 0.9), rgba(14, 165, 233, 0.9));
        background-size: 200% 200%;
        animation: gradientShift 14s ease infinite;
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 24px 80px rgba(59, 130, 246, 0.35);
      }

      .tw-gradient-banner::before {
        content: '';
        position: absolute;
        inset: -20%;
        background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.45), transparent 55%);
        opacity: 0.6;
        filter: blur(40px);
        animation: shimmer 11s infinite linear;
      }

      .tw-gradient-banner::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(45deg, rgba(255, 255, 255, 0.2), transparent 55%);
        mix-blend-mode: screen;
        opacity: 0.35;
      }

      .tw-banner-content {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 54rem;
        margin: 0 auto;
        text-align: center;
      }

      .tw-banner-subheading {
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3em;
        color: rgba(15, 23, 42, 0.8);
      }

      .tw-banner-heading {
        font-size: clamp(2.8rem, 6vw, 4.2rem);
        line-height: 1.05;
        font-weight: 800;
        text-wrap: balance;
        color: #0f172a;
      }

      .tw-banner-copy {
        font-size: clamp(1.1rem, 2.8vw, 1.45rem);
        line-height: 1.7;
        color: rgba(15, 23, 42, 0.78);
        text-wrap: balance;
      }

      .tw-card-grid {
        width: 100%;
        display: grid;
        gap: clamp(1.75rem, 2vw, 2.5rem);
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }

      .tw-card {
        position: relative;
        border-radius: 1.75rem;
        overflow: hidden;
        padding: clamp(1.5rem, 3vw, 2.25rem);
        background: linear-gradient(150deg, rgba(10, 12, 27, 0.85), rgba(24, 28, 48, 0.95));
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 260ms cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(18px);
      }

      .tw-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(135deg, #ef4444, #6366f1, #3b82f6, #a855f7, #ef4444);
        background-size: 260% 260%;
        animation: borderGlow 10s linear infinite;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-image: linear-gradient(#fff, #fff), linear-gradient(#fff, #fff);
        mask-composite: exclude;
        z-index: 0;
      }

      .tw-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 22px 60px rgba(12, 18, 36, 0.55);
      }

      .tw-card > * {
        position: relative;
        z-index: 1;
      }

      .tw-card-media {
        border-radius: 1.25rem;
        overflow: hidden;
        position: relative;
        aspect-ratio: 16 / 9;
        background: radial-gradient(circle at center, rgba(148, 163, 184, 0.25), rgba(30, 41, 59, 0.8));
      }

      .tw-card-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 320ms ease;
      }

      .tw-card:hover .tw-card-media img {
        transform: scale(1.04);
      }

      .tw-card-body {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .tw-card-title {
        font-size: clamp(1.25rem, 2.6vw, 1.75rem);
        font-weight: 700;
        line-height: 1.3;
        color: #f8fafc;
      }

      .tw-card-description {
        font-size: 1rem;
        line-height: 1.7;
        color: rgba(226, 232, 240, 0.76);
      }

      .tw-tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .tw-tag {
        padding: 0.45rem 0.9rem;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.18);
        color: rgba(226, 232, 240, 0.68);
        font-size: 0.8rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .tw-cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.85rem 1.4rem;
        border-radius: 999px;
        border: none;
        background: linear-gradient(130deg, rgba(239, 68, 68, 0.95), rgba(99, 102, 241, 0.95), rgba(59, 130, 246, 0.95));
        background-size: 200% 200%;
        color: #f8fafc;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        box-shadow: 0 14px 36px rgba(79, 70, 229, 0.4);
        transition: transform 200ms ease, background-position 220ms ease, box-shadow 220ms ease;
      }

      .tw-cta:hover {
        background-position: 80% 20%;
        transform: translateY(-2px);
        box-shadow: 0 18px 46px rgba(79, 70, 229, 0.55);
      }

      .tw-loading {
        width: 100%;
        padding: 3rem 1rem;
        text-align: center;
        color: rgba(148, 163, 184, 0.75);
        font-size: 1.05rem;
      }

      .tw-error-box {
        width: 100%;
        padding: 2.5rem;
        border-radius: 1.5rem;
        background: rgba(248, 113, 113, 0.08);
        border: 1px solid rgba(248, 113, 113, 0.25);
        color: rgba(248, 113, 113, 0.9);
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .tw-error-actions {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
      }

      .tw-retry-button {
        padding: 0.8rem 1.4rem;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.12);
        color: #f8fafc;
        font-weight: 600;
        transition: transform 200ms ease, background 200ms ease;
      }

      .tw-retry-button:hover {
        background: rgba(255, 255, 255, 0.18);
        transform: translateY(-2px);
      }

      @media (min-width: 768px) {
        .tw-card {
          flex-direction: row;
        }

        .tw-card-media {
          width: 46%;
          flex-shrink: 0;
        }

        .tw-card-body {
          width: 54%;
        }
      }
    `;
    document.head.appendChild(styleTag);
  }

  function mountLayout() {
    const root = createElement('section', {
      id: ROOT_ID,
      classes: ['tw-min-h-screen', 'tw-bg-slate-950', 'tw-text-white', 'tw-font-sans'],
    });

    const container = createElement('div', {
      classes: ['tw-w-full', 'tw-max-w-6xl', 'tw-mx-auto', 'tw-px-6', 'tw-py-20', 'tw-flex', 'tw-flex-col', 'tw-gap-12'],
    });

    const banner = createBanner();
    const cardsSection = createCardsSection();

    container.appendChild(banner);
    container.appendChild(cardsSection.wrapper);
    root.appendChild(container);
    document.body.appendChild(root);

    populateCards(cardsSection);
  }

  function createBanner() {
    const banner = createElement('div', {
      classes: ['tw-gradient-banner', 'tw-shadow-2xl'],
    });

    const content = createElement('div', {
      classes: ['tw-banner-content'],
    });

    const subheading = createElement('span', {
      text: 'Featured Specials',
      classes: ['tw-banner-subheading'],
    });

    const heading = createElement('h1', {
      text: 'Shop the latest vehicle offers',
      classes: ['tw-banner-heading'],
    });

    const copy = createElement('p', {
      text: 'These deals sync directly from your Google Sheet after the initial staging rows, so visitors only see the specials you mark as visible.',
      classes: ['tw-banner-copy'],
    });

    content.append(subheading, heading, copy);
    banner.appendChild(content);
    return banner;
  }

  function createCardsSection() {
    const wrapper = createElement('div', {
      classes: ['tw-flex', 'tw-flex-col', 'tw-gap-10'],
    });

    const loading = createElement('div', {
      text: 'Loading live content…',
      classes: ['tw-loading'],
    });

    const grid = createElement('div', {
      classes: ['tw-card-grid'],
    });
    grid.classList.add('tw-hidden');

    wrapper.append(loading, grid);
    return { wrapper, loading, grid };
  }

  async function populateCards(section) {
    try {
      const dataset = await fetchCsvDataset(CSV_URL);
      const preparedRecords = prepareRecords(dataset);
      if (!preparedRecords.length) {
        renderEmptyState(section, 'No vehicle specials are currently visible.');
        return;
      }
      section.loading.classList.add('tw-hidden');
      section.grid.classList.remove('tw-hidden');
      preparedRecords.forEach((record) => {
        const card = buildCard(record);
        section.grid.appendChild(card);
      });
    } catch (error) {
      console.error('[Prize Showcase] Failed to load CSV data', error);
      renderErrorState(section, error instanceof Error ? error.message : 'Unexpected error occurred.');
    }
  }

  function prepareRecords(dataset) {
    return dataset
      .slice(10)
      .filter(isRecordVisible);
  }

  function isRecordVisible(record) {
    const visibility = pickFirst(record, ['visibleOnSpecials', 'visible', 'show', 'display']);
    if (!visibility) return false;
    return visibility.toLowerCase() === 'true';
  }

  function renderEmptyState(section, message) {
    section.loading.classList.add('tw-hidden');
    const emptyBox = createElement('div', {
      classes: ['tw-error-box'],
    });
    const heading = createElement('h3', {
      text: 'Nothing to display just yet',
      classes: ['tw-card-title'],
    });
    const copy = createElement('p', {
      text: message,
      classes: ['tw-card-description'],
    });
    emptyBox.append(heading, copy);
    section.wrapper.appendChild(emptyBox);
  }

  function renderErrorState(section, message) {
    section.loading.classList.add('tw-hidden');
    const errorBox = createElement('div', {
      classes: ['tw-error-box'],
    });
    const heading = createElement('h3', {
      text: 'We hit a snag fetching your data.',
      classes: ['tw-card-title'],
    });
    const copy = createElement('p', {
      text: message,
      classes: ['tw-card-description'],
    });
    const actions = createElement('div', {
      classes: ['tw-error-actions'],
    });
    const retryButton = createElement('button', {
      text: 'Retry',
      classes: ['tw-retry-button'],
    });
    retryButton.addEventListener('click', debounce(() => {
      errorBox.remove();
      section.loading.classList.remove('tw-hidden');
      section.grid.innerHTML = '';
      populateCards(section);
    }, 600));
    actions.appendChild(retryButton);
    errorBox.append(heading, copy, actions);
    section.wrapper.appendChild(errorBox);
  }

  async function fetchCsvDataset(url) {
    if (!url || url.includes('YOUR_SHEET_ID_HERE')) {
      throw new Error('CSV URL is missing. Update CSV_URL with your published Google Sheet link.');
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-cache',
        headers: { 'Accept': 'text/csv', 'Content-Type': 'text/plain;charset=UTF-8' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const csvText = await response.text();
      return parseCsv(csvText);
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function parseCsv(text) {
    if (!text.trim()) return [];
    const rows = [];
    let current = '';
    let inQuotes = false;
    let record = [];

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        record.push(current.trim());
        current = '';
        continue;
      }

      if ((char === '\r' || char === '\n') && !inQuotes) {
        if (current !== '' || record.length) {
          record.push(current.trim());
          rows.push(record);
          record = [];
          current = '';
        }
        if (char === '\r' && next === '\n') {
          i += 1;
        }
        continue;
      }

      current += char;
    }

    if (current !== '' || record.length) {
      record.push(current.trim());
      rows.push(record);
    }

    if (!rows.length) return [];

    const headers = rows[0].map(toCamelCase);
    const normalizedRows = rows.slice(1).filter((cols) => cols.some((value) => value && value.trim().length > 0));

    return normalizedRows.map((cols) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = cols[index] ? cols[index].trim() : '';
      });
      return entry;
    });
  }

  function buildCard(record) {
    const title = pickFirst(record, ['carModel', 'model', 'name', 'title']) || 'Featured Vehicle';
    const offerText = pickFirst(record, ['offerText', 'offer', 'specialOffer', 'headline', 'headlineText']) || '';
    const imageUrl = pickImage(record);
    const ctaHref = pickUrl(record);
    const hasCta = Boolean(ctaHref);

    const card = createElement('article', {
      classes: ['tw-card', 'tw-relative', 'tw-overflow-hidden'],
    });

    const media = createElement('div', { classes: ['tw-card-media'] });
    const image = createElement('img', {
      attributes: {
        src: imageUrl,
        alt: title ? `${title} vehicle photo` : 'Vehicle photo',
        loading: 'lazy',
      },
    });
    media.appendChild(image);

    const body = createElement('div', { classes: ['tw-card-body'] });

    const heading = createElement('h3', {
      text: title,
      classes: ['tw-card-title', 'tw-text-balance'],
    });
    body.appendChild(heading);

    if (offerText) {
      const descriptionEl = createElement('p', {
        text: offerText,
        classes: ['tw-card-description'],
      });
      body.appendChild(descriptionEl);
    }

    if (hasCta) {
      const cta = createElement('a', {
        text: 'SHOP NOW',
        classes: ['tw-cta', 'tw-transition', 'tw-duration-200', 'tw-ease-out'],
        attributes: {
          href: ctaHref,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      });
      body.appendChild(cta);
    }

    card.append(media, body);
    return card;
  }

  function pickImage(record) {
    const imageField = pickFirst(record, [
      'image',
      'imageUrl',
      'imageurl',
      'thumbnail',
      'cover',
      'hero',
      'imageUrlForVehicle',
      'vehicleImage',
      'vehicleImageUrl',
    ]);
    if (!imageField) return IMAGE_PLACEHOLDER;
    try {
      const url = new URL(imageField, window.location.origin);
      return url.href;
    } catch (_) {
      return imageField;
    }
  }

  function pickUrl(record) {
    return pickFirst(record, [
      'url',
      'link',
      'ctaUrl',
      'ctaLink',
      'buttonUrl',
      'vehicleLink',
      'linkToVehicle',
      'vehicleUrl',
    ]);
  }

  function pickFirst(record, keys) {
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (record[key] && record[key].trim()) return record[key].trim();
    }
    return '';
  }

  function toCamelCase(value) {
    return value
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
  }

  function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    if (options.id) element.id = options.id;
    if (options.classes) options.classes.forEach((className) => element.classList.add(className));
    if (options.attributes) {
      Object.keys(options.attributes).forEach((key) => {
        element.setAttribute(key, options.attributes[key]);
      });
    }
    if (typeof options.text === 'string') {
      element.textContent = options.text;
    }
    return element;
  }

  function debounce(fn, delay) {
    let timer = null;
    return function debounced(...args) {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }
})();

