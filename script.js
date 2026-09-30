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

/* ---- Text-to-Speech (TTS) & Custom Audio Logic ---- */
let currentUtterance = null;
let currentCustomAudio = null;
let currentBtnPlaying = null;
let voices = [];

// Mapping of specific sections to their pre-recorded audio files
// Key format: "modalId-sectionIndex" (0-indexed)
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

function populateVoices() {
  voices = window.speechSynthesis.getVoices();
  const select = document.getElementById('voice-select');
  if (!select) return;
  
  select.innerHTML = '';
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Voz predeterminada (ES)';
  select.appendChild(defaultOption);

  voices.forEach((voice, i) => {
    if (voice.lang.startsWith('es')) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = `${voice.name} (${voice.lang})`;
      select.appendChild(option);
    }
  });
}

window.speechSynthesis.onvoiceschanged = populateVoices;
document.addEventListener('DOMContentLoaded', populateVoices);

// Inject buttons dynamically into sections
document.addEventListener('DOMContentLoaded', () => {
  const headings = document.querySelectorAll('.section-heading');
  headings.forEach(heading => {
    const btn = document.createElement('button');
    btn.className = 'audio-btn';
    btn.title = 'Escuchar esta sección';
    btn.onclick = function() { toggleAudioSection(this); };
    btn.innerHTML = `
      <svg class="audio-icon-play" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      <svg class="audio-icon-pause" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="display:none;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
    `;
    
    const lastLine = heading.lastElementChild;
    heading.insertBefore(btn, lastLine);
  });
});

function toggleAudioSection(btn) {
  if (currentBtnPlaying === btn) {
    stopAnyAudio();
    resetAudioButton(btn);
    currentBtnPlaying = null;
    return;
  }

  if (currentBtnPlaying) {
    stopAnyAudio();
    resetAudioButton(currentBtnPlaying);
  }

  const sectionWrap = btn.closest('.story-section');
  const modalWrap = btn.closest('.modal-overlay');
  const modalId = modalWrap ? modalWrap.id.replace('modal-', '') : '';
  
  // Find which section index this is inside the modal
  const allSectionsInModal = Array.from(modalWrap.querySelectorAll('.story-section'));
  const sectionIndex = allSectionsInModal.indexOf(sectionWrap);
  const audioKey = `${modalId}-${sectionIndex}`;

  currentBtnPlaying = btn;
  btn.classList.add('playing');
  btn.querySelector('.audio-icon-play').style.display = 'none';
  btn.querySelector('.audio-icon-pause').style.display = 'block';

  // Check if we have a custom audio file for this section
  if (customAudioMap[audioKey]) {
    currentCustomAudio = new Audio(customAudioMap[audioKey]);
    currentCustomAudio.onended = () => {
      resetAudioButton(btn);
      currentBtnPlaying = null;
      currentCustomAudio = null;
    };
    currentCustomAudio.onerror = (e) => {
      console.error('Error loading custom audio', e);
      resetAudioButton(btn);
      currentBtnPlaying = null;
      currentCustomAudio = null;
    };
    currentCustomAudio.play();
  } else {
    // Fallback to TTS
    playTTSForSection(btn, sectionWrap);
  }
}

function playTTSForSection(btn, sectionWrap) {
  const texts = [];
  const titleText = sectionWrap.querySelector('.section-heading-text');
  if (titleText) {
    texts.push(`Capítulo: ${titleText.innerText}`);
  }

  let sibling = sectionWrap.nextElementSibling;
  while (sibling && !sibling.classList.contains('story-section')) {
    if (sibling.classList.contains('modal-text')) {
      texts.push(sibling.innerText);
    } else if (sibling.classList.contains('modal-quote')) {
      const quoteText = sibling.innerText.replace(/"/g, '');
      texts.push(`Cita: ${quoteText}`);
    }
    sibling = sibling.nextElementSibling;
  }

  const fullText = texts.join('. ');
  currentUtterance = new SpeechSynthesisUtterance(fullText);
  
  const select = document.getElementById('voice-select');
  if (select && select.value !== "") {
    currentUtterance.voice = voices[select.value];
  } else {
    currentUtterance.lang = 'es-ES';
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) currentUtterance.voice = spanishVoice;
  }
  
  currentUtterance.rate = 0.95;

  currentUtterance.onend = () => {
    resetAudioButton(btn);
    currentBtnPlaying = null;
    currentUtterance = null;
  };
  currentUtterance.onerror = (e) => {
    console.error('Speech synthesis error', e);
    resetAudioButton(btn);
    currentBtnPlaying = null;
    currentUtterance = null;
  };

  window.speechSynthesis.speak(currentUtterance);
}

function stopAnyAudio() {
  if (currentUtterance) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
  if (currentCustomAudio) {
    currentCustomAudio.pause();
    currentCustomAudio.currentTime = 0;
    currentCustomAudio = null;
  }
}

function resetAudioButton(btn) {
  if (!btn) return;
  btn.classList.remove('playing');
  const play = btn.querySelector('.audio-icon-play');
  const pause = btn.querySelector('.audio-icon-pause');
  if(play) play.style.display = 'block';
  if(pause) pause.style.display = 'none';
}

const originalCloseModal = closeModal;
closeModal = function(id) {
  if (currentBtnPlaying) {
    stopAnyAudio();
    resetAudioButton(currentBtnPlaying);
    currentBtnPlaying = null;
  }
  originalCloseModal(id);
};
