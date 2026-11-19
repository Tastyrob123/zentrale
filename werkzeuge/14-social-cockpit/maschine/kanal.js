/* Content-Maschine · Kanal-Wahl (Robert 12.11.2026: «so ein kleines Canva-Board … für jeden Kanal … perfekte Vorlage … Logos schnell reinziehen»).
   Steht vor den Vorlagen des Studios: Kanal wählen → Format passt → Vorlagen im Stil von Tasty Studios. Logos liegen unter «Fotos», Gruppe «Logos».
   ?kanal=<id> öffnet direkt mit diesem Kanal (aus dem Social Cockpit). */
(function () {
  const KANAELE = [
    { k: 'instagram', name: 'Instagram', formate: [['insta', 'Beitrag 4:5'], ['story', 'Reel und Story 9:16'], ['li', 'Quadrat 1:1']] },
    { k: 'linkedin', name: 'LinkedIn', formate: [['li', 'Bild 1:1'], ['insta', 'Hochformat 4:5']] },
    { k: 'tiktok', name: 'TikTok', formate: [['story', 'Titelbild 9:16']] },
    { k: 'facebook', name: 'Facebook', formate: [['insta', 'Beitrag 4:5'], ['li', 'Quadrat 1:1']] },
    { k: 'pinterest', name: 'Pinterest', formate: [['pin', 'Pin 2:3']] },
    { k: 'google', name: 'Google', formate: [['google', 'Beitrag 4:3']] },
    { k: 'newsletter', name: 'Post aus dem Studio', formate: [['mailkopf', 'Kopfbild'], ['mail', 'Newsletter als Bild']] }
  ];
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function waehle(fk, k) {
    const sel = $('#vorlageFormat'); if (!sel) return;
    sel.value = fk; sel.dispatchEvent(new Event('change', { bubbles: true }));
    document.querySelectorAll('.kanalwahl .kw-k').forEach(b => b.classList.toggle('an', b.dataset.k === k));
    if (window.DSStudio && DSStudio.zeigeTab) DSStudio.zeigeTab('vorlagen');
    const h = document.querySelector('.tab[data-tab="vorlagen"] h2'); if (h) h.textContent = 'Vorlagen für ' + (KANAELE.find(x => x.k === k) || {}).name;
  }

  document.addEventListener('ds:bereit', () => {
    /* nur Bildformate für Kanäle in der Formatliste */
    const sel = $('#vorlageFormat');
    if (sel) [...sel.options].forEach(o => { if (!(DS.FORMATE[o.value] || {}).digital) o.remove(); });
    const box = $('#kanalwahl');
    if (box) box.innerHTML = KANAELE.map(c => `<div class="kw-k" data-k="${c.k}" style="--k:${(SO_WELT[c.k] || {}).farbe};--kg:${(SO_WELT[c.k] || {}).grad}">
      <div class="kw-k__kopf">${soLogo(c.k, 'so-lg--l')}<b>${esc(c.name)}</b></div>
      <div class="kw-k__f">${c.formate.map(([fk, t]) => { const F = DS.FORMATE[fk] || {}; return `<button type="button" data-fk="${fk}" data-k="${c.k}"><span>${esc(t)}</span><small>${F.px ? F.px.join(' × ') : ''}</small></button>`; }).join('')}</div></div>`).join('');
    box && box.addEventListener('click', e => { const b = e.target.closest('[data-fk]'); if (b) waehle(b.dataset.fk, b.dataset.k); });
    /* Weg zurück ins Social Cockpit */
    const werk = $('.kopf__werk');
    if (werk) werk.insertAdjacentHTML('afterbegin', '<a class="kn kn--klein kn--ohne kw-zurueck" href="../#start"><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg><span>Social Cockpit</span></a><span class="kopf__trenn"></span>');
    /* «Übersicht» führt zur Kanal-Wahl, «Markenbuch» ins Markenbuch von Tasty Studios */
    document.addEventListener('click', e => {
      const n = e.target.closest && e.target.closest('#btnNeu, #kopfMarke');
      if (n) { e.preventDefault(); e.stopImmediatePropagation(); if (window.DSStudio) DSStudio.zeigeTab('kanal'); return; }
      const l = e.target.closest && e.target.closest('[data-livre]');
      if (l) { e.preventDefault(); e.stopImmediatePropagation(); window.open('/zentrale/werkzeuge/11-markenbuch/', '_blank', 'noopener'); }
    }, true);
    const neu = document.querySelector('#btnNeu span'); if (neu) neu.textContent = 'Kanal';
    const k = new URLSearchParams(location.search).get('kanal');
    const c = KANAELE.find(x => x.k === k);
    if (c) waehle(c.formate[0][0], c.k);
  });
})();
