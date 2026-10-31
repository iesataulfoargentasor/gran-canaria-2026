(() => {
  'use strict';
  const pages = [...document.querySelectorAll('.page')];
  const nav = [...document.querySelectorAll('[data-day]')];
  const key = 'gran-canaria-2026-visited';
  let visited = new Set();
  try { const saved = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(saved)) visited = new Set(saved); } catch {}
  function renderProgress() {
    document.querySelectorAll('[data-done]').forEach(button => {
      const done = visited.has(button.dataset.done);
      button.setAttribute('aria-pressed', String(done));
      button.textContent = done ? '✓ Visitado · Desmarcar' : '○ Marcar como visitado';
    });
    const count = ['dia-31','dia-1','dia-2','dia-3','dia-4','dia-5'].filter(id => visited.has(id)).length;
    document.querySelector('.progress').textContent = count ? `${count} de 6 días visitados` : 'Tu viaje, a tu ritmo';
  }
  function showPage(scroll = true) {
    const id = location.hash.slice(1);
    const current = pages.find(page => page.id === id) || pages[0];
    pages.forEach(page => { page.hidden = page !== current; });
    nav.forEach(a => { if (a.dataset.day === current.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.title = current.id === 'inicio' ? 'Gran Canaria · Una isla, mil paisajes' : `${current.querySelector('h2').textContent} · Gran Canaria 2026`;
    if (scroll) { window.scrollTo({top: 0, behavior: 'instant'}); const title = current.querySelector('h2[tabindex]'); if (title) title.focus({preventScroll:true}); }
  }
  document.querySelectorAll('[data-done]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.done;
    if (visited.has(id)) visited.delete(id); else visited.add(id);
    try { localStorage.setItem(key, JSON.stringify([...visited])); } catch {}
    renderProgress();
  }));
  window.addEventListener('hashchange', () => showPage());
  document.querySelector('#print').addEventListener('click', () => window.print());
  showPage(false); renderProgress();
  fetch('photos.json').then(response => { if (!response.ok) throw new Error('credits'); return response.json(); }).then(photos => {
    const box = document.querySelector('#photo-credits');
    photos.forEach(photo => {
      const p = document.createElement('p');
      const a = document.createElement('a'); a.href = photo.source; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = photo.title.replace(/^File:/,'');
      p.append(a, document.createTextNode(` · ${photo.author} · `));
      if (photo.licenseUrl) { const license = document.createElement('a'); license.href = photo.licenseUrl; license.textContent = photo.license; license.target = '_blank'; license.rel = 'noopener noreferrer'; p.append(license); }
      else p.append(document.createTextNode(photo.license));
      box.append(p);
    });
  }).catch(() => { const box = document.querySelector('#photo-credits'); const a = document.createElement('a'); a.href = 'photos.json'; a.textContent = 'Consultar archivo de créditos fotográficos'; box.append(a); });
})();
