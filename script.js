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
