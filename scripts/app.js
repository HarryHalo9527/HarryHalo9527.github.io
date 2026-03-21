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

    // API Configuration modal
    const configBtn = document.getElementById('api-config-btn');
    if (configBtn) {
      configBtn.addEventListener('click', showApiConfig);
    }
  });

  function showApiConfig() {
    const existing = document.getElementById('api-config-modal');
    if (existing) { existing.remove(); return; }

    const modal = document.createElement('div');
    modal.id = 'api-config-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);';
    modal.innerHTML = `
      <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-xl);padding:2rem;max-width:420px;width:90%;">
        <h3 style="color:var(--text-heading);margin-bottom:1rem;">配置 AI API</h3>
        <div class="form-group" style="margin-bottom:1rem;">
          <label>Cloudflare Worker URL</label>
          <input id="cfg-worker" placeholder="https://your-worker.workers.dev" value="${LLM_API.workerUrl || ''}">
        </div>
        <p style="text-align:center;color:var(--text-muted);font-size:.8rem;margin-bottom:1rem;">— 或 —</p>
        <div class="form-group" style="margin-bottom:1rem;">
          <label>API Key（仅本地测试）</label>
          <input id="cfg-key" type="password" placeholder="sk-..." value="${LLM_API.apiKey || ''}">
        </div>
        <div style="display:flex;gap:.5rem;justify-content:flex-end;">
          <button class="btn btn-secondary" id="cfg-cancel">取消</button>
          <button class="btn btn-primary" id="cfg-save">保存</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cfg-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    document.getElementById('cfg-save').addEventListener('click', () => {
      LLM_API.configure({
        workerUrl: document.getElementById('cfg-worker').value.trim(),
        apiKey: document.getElementById('cfg-key').value.trim()
      });
      modal.remove();
    });
  }
})();
