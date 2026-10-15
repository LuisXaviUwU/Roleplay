/**
 * LOS MASCAPITOS — CADENAS DE SANGRE
 * Lector Dinámico y Catálogo Oficial
 */

// Application State
const state = {
  currentView: 'portada',
  currentSeason: 1,
  currentChapter: 1,
  theme: localStorage.getItem('mascapitos_theme') || 'dark',
  fontSize: parseInt(localStorage.getItem('mascapitos_fontsize') || '18', 10),
  fontFamily: localStorage.getItem('mascapitos_fontfamily') || 'Lora',
  readHistory: JSON.parse(localStorage.getItem('mascapitos_read_history') || '[]')
};

// =====================================================================
// INITIALIZATION
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.theme);
  applyFontSize(state.fontSize);
  applyFontFamily(state.fontFamily);
  setupNavigation();
  setupReadingProgress();
  populateChapterDropdown();
  renderTocGrid();
  loadChapter(1, state.currentChapter, false);
  switchView('portada'); // Start on Portada / Inicio view
});

// =====================================================================
// MULTI-VIEW NAVIGATION (SIDEBAR SUPERIOR)
// =====================================================================
function switchView(viewId) {
  state.currentView = viewId;

  const validViews = ['portada', 'lector', 'indice', 'personajes'];
  validViews.forEach(id => {
    const sec = document.getElementById(id);
    if (sec) {
      if (id === viewId) {
        sec.style.display = 'block';
        sec.classList.add('active-view');
      } else {
        sec.style.display = 'none';
        sec.classList.remove('active-view');
      }
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update topbar navigation pills
  document.querySelectorAll('.nav-link-btn').forEach(btn => {
    const v = btn.dataset.view || (btn.getAttribute('href') || '').replace('#', '');
    btn.classList.toggle('active', v === viewId);
  });

  // Update mobile drawer links
  document.querySelectorAll('.drawer-link').forEach(btn => {
    const v = btn.dataset.view || (btn.getAttribute('href') || '').replace('#', '');
    btn.classList.toggle('active', v === viewId);
  });
}

function setupNavigation() {
  function handleHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['portada', 'lector', 'indice', 'personajes'].includes(hash)) {
      switchView(hash);
    }
  }

  window.addEventListener('hashchange', handleHash);
  if (window.location.hash) {
    handleHash();
  }
}

function toggleMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer) {
    drawer.classList.toggle('open');
  }
}

function closeMobileDrawer() {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer) {
    drawer.classList.remove('open');
  }
}

// =====================================================================
// LIVE READING PROGRESS TRACKER
// =====================================================================
function setupReadingProgress() {
  const bar = document.getElementById('reading-progress-bar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    if (state.currentView !== 'lector') {
      bar.style.width = '0%';
      return;
    }
    const docElem = document.documentElement;
    const body = document.body;
    const scrollTop = docElem.scrollTop || body.scrollTop;
    const scrollHeight = (docElem.scrollHeight || body.scrollHeight) - docElem.clientHeight;
    const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  });
}

// =====================================================================
// READER SETTINGS (THEMES, FONTS, SIZES)
// =====================================================================
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('mascapitos_theme', theme);

  document.querySelectorAll('.theme-opt-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function adjustFontSize(delta) {
  const newSize = Math.max(14, Math.min(26, state.fontSize + delta * 2));
  applyFontSize(newSize);
}

function applyFontSize(size) {
  state.fontSize = size;
  document.documentElement.style.setProperty('--reader-font-size', `${size}px`);
  localStorage.setItem('mascapitos_fontsize', size.toString());

  const label = document.getElementById('current-font-size-label');
  if (label) label.textContent = `${size}px`;

  const modalLabel = document.getElementById('modal-font-size-label');
  if (modalLabel) modalLabel.textContent = `${size}px`;
}

function applyFontFamily(font) {
  state.fontFamily = font;
  let cssFont = `'${font}', Georgia, serif`;
  if (font === 'Inter') {
    cssFont = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  }
  document.documentElement.style.setProperty('--reader-font-family', cssFont);
  localStorage.setItem('mascapitos_fontfamily', font);

  document.querySelectorAll('.font-opt-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.font === font);
  });
}

function openSettingsModal() {
  const modal = document.getElementById('modal-settings');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSettingsModal() {
  const modal = document.getElementById('modal-settings');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// =====================================================================
// CHAPTER LOADER & READER ENGINE (.TXT FETCHER & FALLBACK)
// =====================================================================
async function fetchChapterTxt(season, chapter) {
  const path = `capitulos/temporada${season}/${chapter}.txt`;
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const text = await res.text();
    if (text && text.trim().length > 10) {
      return text;
    }
    throw new Error('Empty file content');
  } catch (err) {
    console.info(`[Reader Engine] Fallback used for ${path}:`, err.message);
    const fallbackKey = `s${season}_c${chapter}`;
    if (typeof CHAPTER_FALLBACK_TEXTS !== 'undefined' && CHAPTER_FALLBACK_TEXTS[fallbackKey]) {
      return CHAPTER_FALLBACK_TEXTS[fallbackKey];
    }
    return `No se pudo cargar el capítulo ${chapter}. Asegúrate de que el archivo ${path} existe.`;
  }
}

async function loadChapter(season, chapter, shouldSwitch = true) {
  state.currentSeason = 1;
  state.currentChapter = chapter;

  const metaList = CHAPTERS_METADATA.temporada1 || [];
  const meta = metaList.find(m => m.id === chapter) || {
    id: chapter,
    title: `Capítulo ${chapter}`,
    kicker: 'Crónica',
    cover: `img/capitulos/temporada1/${chapter}.png`,
    time: '5 min'
  };

  // Update UI Meta
  const badgeElem = document.getElementById('chapter-season-badge');
  if (badgeElem) badgeElem.textContent = `Capítulo ${chapter} de 8`;

  document.getElementById('chapter-main-title').textContent = meta.title;
  document.getElementById('chapter-kicker-subtitle').textContent = meta.kicker || 'Crónica';
  document.getElementById('chapter-read-time').textContent = meta.time || '5 min';

  // Update Cover Image in Reader
  const coverImg = document.getElementById('chapter-cover-img');
  if (coverImg && meta.cover) {
    coverImg.src = meta.cover;
    coverImg.alt = `Portada de ${meta.title}`;
  }

  // Quote Box setup
  const quoteBox = document.getElementById('chapter-quote-box');
  if (meta.quote) {
    quoteBox.style.display = 'block';
    document.getElementById('quote-body-text').textContent = `«${meta.quote}»`;
    document.getElementById('quote-attribution').textContent = meta.quoteAttr ? `— ${meta.quoteAttr}` : '';
  } else {
    quoteBox.style.display = 'none';
  }

  // Chapter Text Body Loading
  const textContainer = document.getElementById('chapter-content-body');
  textContainer.innerHTML = '<p class="loading-state">Cargando capítulo desde el archivo...</p>';

  const rawText = await fetchChapterTxt(1, chapter);
  renderChapterText(rawText);

  // Update Selector Dropdown
  const select = document.getElementById('reader-chapter-select');
  if (select) {
    select.value = `1-${chapter}`;
  }

  // Update Prev / Next Buttons
  updatePrevNextButtons(1, chapter);

  // Mark as Read in history
  const chKey = `s1_c${chapter}`;
  if (!state.readHistory.includes(chKey)) {
    state.readHistory.push(chKey);
    localStorage.setItem('mascapitos_read_history', JSON.stringify(state.readHistory));
  }

  if (shouldSwitch) {
    switchView('lector');
  }
}

function renderChapterText(text) {
  const container = document.getElementById('chapter-content-body');
  container.innerHTML = '';

  const paragraphs = text.split(/\n\s*\n/);
  paragraphs.forEach(rawP => {
    const trimmed = rawP.trim();
    if (!trimmed) return;
    
    const p = document.createElement('p');
    let formatted = trimmed;
    if (formatted.startsWith('-') || formatted.startsWith('—')) {
      p.classList.add('is-dialogue');
    }
    p.textContent = formatted;
    container.appendChild(p);
  });
}

function updatePrevNextButtons(season, chapter) {
  const metaList = CHAPTERS_METADATA.temporada1 || [];
  const total = metaList.length;

  const prevBtn = document.getElementById('btn-prev-chapter');
  const nextBtn = document.getElementById('btn-next-chapter');
  const prevCard = document.getElementById('prev-chapter-card');
  const nextCard = document.getElementById('next-chapter-card');

  // Prev
  if (chapter > 1) {
    const prevMeta = metaList.find(m => m.id === chapter - 1);
    if (prevBtn) prevBtn.disabled = false;
    if (prevCard) {
      prevCard.style.visibility = 'visible';
      document.getElementById('prev-card-title').textContent = prevMeta ? prevMeta.title : `Capítulo ${chapter - 1}`;
    }
  } else {
    if (prevBtn) prevBtn.disabled = true;
    if (prevCard) prevCard.style.visibility = 'hidden';
  }

  // Next
  if (chapter < total) {
    const nextMeta = metaList.find(m => m.id === chapter + 1);
    if (nextBtn) nextBtn.disabled = false;
    if (nextCard) {
      nextCard.style.visibility = 'visible';
      document.getElementById('next-card-title').textContent = nextMeta ? nextMeta.title : `Capítulo ${chapter + 1}`;
    }
  } else {
    if (nextBtn) nextBtn.disabled = true;
    if (nextCard) nextCard.style.visibility = 'hidden';
  }
}

function prevChapter() {
  if (state.currentChapter > 1) {
    loadChapter(1, state.currentChapter - 1, true);
  }
}

function nextChapter() {
  const metaList = CHAPTERS_METADATA.temporada1 || [];
  if (state.currentChapter < metaList.length) {
    loadChapter(1, state.currentChapter + 1, true);
  }
}

// Populate Quick Chapter Dropdown
function populateChapterDropdown() {
  const select = document.getElementById('reader-chapter-select');
  if (!select) return;
  select.innerHTML = '';

  const list = CHAPTERS_METADATA.temporada1 || [];
  list.forEach(c => {
    const opt = document.createElement('option');
    opt.value = `1-${c.id}`;
    opt.textContent = `Cap. ${c.id}: ${c.title}`;
    select.appendChild(opt);
  });

  select.addEventListener('change', (e) => {
    const [, c] = e.target.value.split('-').map(Number);
    loadChapter(1, c, true);
  });
}

// =====================================================================
// TABLE OF CONTENTS (ÍNDICE)
// =====================================================================
function renderTocGrid() {
  const grid = document.getElementById('toc-chapters-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const list = CHAPTERS_METADATA.temporada1 || [];
  list.forEach(c => {
    const card = document.createElement('div');
    card.className = 'toc-card';
    card.onclick = () => loadChapter(1, c.id, true);

    const isRead = state.readHistory.includes(`s1_c${c.id}`);

    card.innerHTML = `
      <div class="toc-cover-thumb">
        <img src="${c.cover}" alt="${c.title}" class="toc-thumb-img" loading="lazy">
        <span class="toc-chapter-number-pill">Cap. ${c.id}</span>
      </div>
      <div class="toc-info">
        <div class="toc-title">${c.title}</div>
        <div class="toc-kicker">${c.kicker || 'Crónica'}</div>
        <div class="toc-meta">
          <span class="toc-time-badge">${c.time}</span>
          ${isRead ? '<span class="toc-read-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><polyline points="20 6 9 17 4 12"/></svg>Leído</span>' : ''}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// =====================================================================
// MODALES DE PERSONAJES
// =====================================================================
function openModal(charId) {
  const modal = document.getElementById(`modal-${charId}`);
  if (modal) {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(charId) {
  const modal = document.getElementById(`modal-${charId}`);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function closeModalOutside(event, charId) {
  if (event.target === event.currentTarget) {
    closeModal(charId);
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});

// Explicit Global Window API for inline HTML event handlers
window.switchView = switchView;
window.loadChapter = loadChapter;
window.prevChapter = prevChapter;
window.nextChapter = nextChapter;
window.adjustFontSize = adjustFontSize;
window.applyTheme = applyTheme;
window.applyFontFamily = applyFontFamily;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.toggleMobileDrawer = toggleMobileDrawer;
window.closeMobileDrawer = closeMobileDrawer;
window.openModal = openModal;
window.closeModal = closeModal;
window.closeModalOutside = closeModalOutside;
