/**
 * Main App — Navigation, scroll effects, panel toggles
 */
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll nav
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Active nav link on scroll
    const sections = document.querySelectorAll('.section[id]');
    const navLinks = document.querySelectorAll('.nav a');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-30% 0px -70% 0px' });

    sections.forEach(s => observer.observe(s));

    // Playground panel toggles
    const fireBtn = document.getElementById('open-fire');
    const turnBtn = document.getElementById('open-turn');
    const firePanel = document.getElementById('fire-panel');
    const turnPanel = document.getElementById('turn-panel');

    if (fireBtn && firePanel) {
      fireBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isActive = firePanel.classList.contains('active');
        firePanel.classList.toggle('active', !isActive);
        if (turnPanel) turnPanel.classList.remove('active');
        if (!isActive) firePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    if (turnBtn && turnPanel) {
      turnBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isActive = turnPanel.classList.contains('active');
        turnPanel.classList.toggle('active', !isActive);
        if (firePanel) firePanel.classList.remove('active');
        if (!isActive) {
          turnPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Re-init assessment when opening
          if (window.TurnAssessment) window.TurnAssessment.initAssessment();
        }
      });
    }

    // Hero CTA buttons also trigger panels
    document.querySelectorAll('[data-open="fire"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (firePanel) {
          firePanel.classList.add('active');
          if (turnPanel) turnPanel.classList.remove('active');
          firePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    document.querySelectorAll('[data-open="turn"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (turnPanel) {
          turnPanel.classList.add('active');
          if (firePanel) firePanel.classList.remove('active');
          turnPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (window.TurnAssessment) window.TurnAssessment.initAssessment();
        }
      });
    });

  });
})();
