// =============================================
//  MASCAPITOS — Árbol Genealógico · script.js
// =============================================

/* ---- Particles ---- */
(function spawnParticles() {
  const container = document.getElementById('particles');
  const colors = [
    'rgba(201,162,39,0.5)',
    'rgba(74,127,203,0.4)',
    'rgba(212,95,165,0.35)',
    'rgba(78,184,122,0.35)',
    'rgba(255,255,255,0.15)',
  ];

  for (let i = 0; i < 55; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${Math.random() * 18 + 12}s;
      animation-delay: ${Math.random() * 12}s;
      filter: blur(${Math.random() > 0.7 ? 1 : 0}px);
    `;
    container.appendChild(p);
  }
})();

/* ---- Modal Logic ---- */
function openModal(id) {
  const overlay = document.getElementById(`modal-${id}`);
  if (!overlay) return;

  // Close any other open modals first
  document.querySelectorAll('.modal-overlay.open').forEach(el => {
    el.classList.remove('open');
  });

  // Small delay so closing animation is visible before opening new one
  requestAnimationFrame(() => {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}

function closeModal(id) {
  const overlay = document.getElementById(`modal-${id}`);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function closeModalOutside(event, id) {
  // Only close if the click was directly on the overlay, not the card
  if (event.target === event.currentTarget) {
    closeModal(id);
  }
}

/* ---- Keyboard: Escape closes any open modal ---- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(overlay => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});

/* ---- Subtle entrance animations for cards ---- */
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.member-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 120);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(.34,1.56,.64,1), box-shadow 0.35s ease, border-color 0.35s ease';
    observer.observe(card);
  });
});

/* ---- Text-to-Speech & Custom Audio Player ---- */

// Mapping: "modalId-sectionIndex" → audio file path
const customAudioMap = {
  // Xavi
  'xavi-0': 'audio/Capitulo1Xavi.m4a',
  'xavi-1': 'audio/Capitulo2Xavi.m4a',
  'xavi-2': 'audio/Capitulo3Xavi.m4a',
  // Mishi
  'mishi-0': 'audio/Capitulo1Mishi.m4a',
  'mishi-1': 'audio/Capitulo2Mishi.m4a',
  'mishi-2': 'audio/Capitulo3Mishi.m4a',
  'mishi-3': 'audio/Capitulo4Mishi.m4a',
  // Leo
  'leo-0': 'audio/Capitulo1Leo.m4a',
  'leo-1': 'audio/Capitulo2Leo.m4a',
  'leo-2': 'audio/Capitulo3Leo.m4a',
  // Jorgito
  'jorgito-0': 'audio/Capitulo1Jorgito.m4a',
  'jorgito-1': 'audio/Capitulo2Jorgito.m4a',
  'jorgito-2': 'audio/Capitulo3Jorgito.m4a',
  'jorgito-3': 'audio/Capitulo4Jorgito.m4a',
  'jorgito-4': 'audio/Capitulo5Jorgito.m4a',
  // La Madre
  'madre-0': 'audio/Capitulo1Mujer.m4a',
  // Barto
  'barto-0': 'audio/Capitulo1Barto.m4a',
  'barto-1': 'audio/Capitulo2Barto.m4a',
  'barto-2': 'audio/Capitulo3Barto.m4a',
  'barto-3': 'audio/Capitulo4Barto.m4a'
};

let voices = [];
let activePlayer = null; // { audioEl, btn, progress, timeEl, ttsUtterance, isTTS }

/* --- Voice selector population --- */
function populateVoices() {
  voices = window.speechSynthesis.getVoices();
  const select = document.getElementById('voice-select');
  if (!select) return;
  select.innerHTML = '';
  const def = document.createElement('option');
  def.value = '';
  def.textContent = 'Voz predeterminada (ES)';
  select.appendChild(def);
  voices.forEach((v, i) => {
    if (v.lang.startsWith('es')) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${v.name} (${v.lang})`;
      select.appendChild(opt);
    }
  });
}
window.speechSynthesis.onvoiceschanged = populateVoices;
document.addEventListener('DOMContentLoaded', populateVoices);

/* --- Helpers --- */
function formatTime(secs) {
  if (!isFinite(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function stopActive() {
  if (!activePlayer) return;
  if (activePlayer.isTTS) {
    window.speechSynthesis.cancel();
  } else if (activePlayer.audioEl) {
    activePlayer.audioEl.pause();
  }
  setPlayerState(activePlayer, false);
  activePlayer = null;
}

function setPlayerState(player, playing) {
  const { playerEl, btn } = player;
  if (playing) {
    playerEl.classList.add('active');
    btn.classList.add('playing');
    btn.innerHTML = pauseIcon();
  } else {
    playerEl.classList.remove('active');
    btn.classList.remove('playing');
    btn.innerHTML = playIcon();
  }
}

function playIcon() {
  return `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/></svg>`;
}
function pauseIcon() {
  return `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none"/></svg>`;
}

/* --- Build inline players after DOM ready --- */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.story-section').forEach(section => {
    const heading = section.querySelector('.section-heading');
    if (!heading) return;

    // Build player HTML
    const playerEl = document.createElement('div');
    playerEl.className = 'audio-player';
    playerEl.innerHTML = `
      <button class="audio-play-btn" title="Reproducir sección">${playIcon()}</button>
      <div class="audio-progress-wrap">
        <input type="range" class="audio-progress-bar" min="0" max="100" value="0" step="0.1">
        <div class="audio-time">0:00 / 0:00</div>
      </div>
    `;

    // Insert player after the heading div (inside story-section)
    section.appendChild(playerEl);

    const btn = playerEl.querySelector('.audio-play-btn');
    const progressBar = playerEl.querySelector('.audio-progress-bar');
    const timeEl = playerEl.querySelector('.audio-time');

    btn.addEventListener('click', () => {
      // Find modal id + section index
      const modalWrap = section.closest('.modal-overlay');
      const modalId = modalWrap ? modalWrap.id.replace('modal-', '') : '';
      const allSections = Array.from(modalWrap.querySelectorAll('.story-section'));
      const sectionIdx = allSections.indexOf(section);
      const audioKey = `${modalId}-${sectionIdx}`;

      // Already playing THIS player? Toggle pause/resume
      if (activePlayer && activePlayer.playerEl === playerEl) {
        if (activePlayer.isTTS) {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            setPlayerState(activePlayer, false);
          } else {
            window.speechSynthesis.resume();
            setPlayerState(activePlayer, true);
          }
        } else {
          if (activePlayer.audioEl.paused) {
            activePlayer.audioEl.play();
            setPlayerState(activePlayer, true);
          } else {
            activePlayer.audioEl.pause();
            setPlayerState(activePlayer, false);
          }
        }
        return;
      }

      // Stop whatever was playing before
      stopActive();

      const player = { playerEl, btn, progressBar, timeEl, audioEl: null, isTTS: false };

      if (customAudioMap[audioKey]) {
        // Real audio file
        const audio = new Audio(customAudioMap[audioKey]);
        player.audioEl = audio;

        audio.addEventListener('loadedmetadata', () => {
          progressBar.max = audio.duration;
          timeEl.textContent = `0:00 / ${formatTime(audio.duration)}`;
        });

        audio.addEventListener('timeupdate', () => {
          if (!audio.duration) return;
          progressBar.value = audio.currentTime;
          const pct = (audio.currentTime / audio.duration) * 100;
          progressBar.style.setProperty('--progress', `${pct}%`);
          timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        });

        audio.addEventListener('ended', () => {
          setPlayerState(player, false);
          progressBar.value = 0;
          progressBar.style.setProperty('--progress', '0%');
          timeEl.textContent = `0:00 / ${formatTime(audio.duration)}`;
          activePlayer = null;
        });

        progressBar.addEventListener('input', () => {
          audio.currentTime = parseFloat(progressBar.value);
        });

        audio.play();
        setPlayerState(player, true);
        activePlayer = player;

      } else {
        // TTS fallback
        player.isTTS = true;
        const texts = [];
        const titleEl = section.querySelector('.section-heading-text');
        if (titleEl) texts.push(`Capítulo: ${titleEl.innerText}`);

        let sibling = section.nextElementSibling;
        while (sibling && !sibling.classList.contains('story-section')) {
          if (sibling.classList.contains('modal-text')) texts.push(sibling.innerText);
          else if (sibling.classList.contains('modal-quote')) texts.push(sibling.innerText.replace(/"/g, ''));
          sibling = sibling.nextElementSibling;
        }

        const utterance = new SpeechSynthesisUtterance(texts.join('. '));
        const select = document.getElementById('voice-select');
        if (select && select.value !== '') {
          utterance.voice = voices[select.value];
        } else {
          utterance.lang = 'es-ES';
          const sv = voices.find(v => v.lang.startsWith('es'));
          if (sv) utterance.voice = sv;
        }
        utterance.rate = 0.95;

        utterance.onend = () => {
          setPlayerState(player, false);
          activePlayer = null;
        };
        utterance.onerror = () => {
          setPlayerState(player, false);
          activePlayer = null;
        };

        progressBar.style.setProperty('--progress', '0%');
        timeEl.textContent = 'TTS — en curso';

        window.speechSynthesis.speak(utterance);
        player.ttsUtterance = utterance;
        setPlayerState(player, true);
        activePlayer = player;
      }
    });
  });
});

/* Stop audio when closing modals */
const _origClose = closeModal;
closeModal = function(id) {
  stopActive();
  _origClose(id);
};

/* ---- Story Accordion ---- */
function toggleStory() {
  const wrapper = document.getElementById('story-chapters-wrapper');
  const chevron = document.getElementById('story-chevron');
  const text    = document.getElementById('story-toggle-text');
  const isOpen  = wrapper.classList.toggle('story-open');
  chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  text.textContent = isOpen ? 'Cerrar historia' : 'Leer la historia';
}

function toggleChapter(n) {
  const body   = document.getElementById('chapter-body-' + n);
  const chev   = document.getElementById('chev-' + n);
  const header = body.previousElementSibling;
  const isOpen = body.classList.toggle('chapter-open');
  chev.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  header.classList.toggle('chapter-header-active', isOpen);
  if (isOpen) {
    // Close other chapters
    for (let i = 1; i <= 8; i++) {
      if (i === n) continue;
      const ob = document.getElementById('chapter-body-' + i);
      const oc = document.getElementById('chev-' + i);
      const oh = ob ? ob.previousElementSibling : null;
      if (ob) ob.classList.remove('chapter-open');
      if (oc) oc.style.transform = 'rotate(0deg)';
      if (oh) oh.classList.remove('chapter-header-active');
    }
  }
}

/* ---- Chapter Audio Players ---- */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.chapter-audio-player').forEach(playerEl => {
    const src = playerEl.dataset.src;
    if (!src) return;

    const btn = playerEl.querySelector('.chapter-play-btn');
    const progressBar = playerEl.querySelector('.audio-progress-bar');
    const timeEl = playerEl.querySelector('.audio-time');

    btn.addEventListener('click', () => {
      // Toggle pause/resume if this player is already active
      if (activePlayer && activePlayer.playerEl === playerEl) {
        if (activePlayer.audioEl.paused) {
          activePlayer.audioEl.play();
          playerEl.classList.add('active');
          btn.classList.add('playing');
          btn.innerHTML = pauseIcon();
        } else {
          activePlayer.audioEl.pause();
          playerEl.classList.remove('active');
          btn.classList.remove('playing');
          btn.innerHTML = playIcon();
        }
        return;
      }

      // Stop any currently playing audio
      stopActive();

      const audio = new Audio(src);
      const player = { playerEl, btn, progressBar, timeEl, audioEl: audio, isTTS: false };

      audio.addEventListener('loadedmetadata', () => {
        progressBar.max = audio.duration;
        timeEl.textContent = `0:00 / ${formatTime(audio.duration)}`;
      });

      audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        progressBar.value = audio.currentTime;
        const pct = (audio.currentTime / audio.duration) * 100;
        progressBar.style.setProperty('--progress', `${pct}%`);
        timeEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
      });

      audio.addEventListener('ended', () => {
        playerEl.classList.remove('active');
        btn.classList.remove('playing');
        btn.innerHTML = playIcon();
        progressBar.value = 0;
        progressBar.style.setProperty('--progress', '0%');
        timeEl.textContent = `0:00 / ${formatTime(audio.duration)}`;
        activePlayer = null;
      });

      progressBar.addEventListener('input', () => {
        audio.currentTime = parseFloat(progressBar.value);
      });

      audio.play();
      playerEl.classList.add('active');
      btn.classList.add('playing');
      btn.innerHTML = pauseIcon();
      activePlayer = player;
    });
  });
});

