/* Ye’ Jebena — site behaviour. Business details come from js/config.js */
(function () {
  'use strict';
  const C = window.SITE_CONFIG || {};
  const contact = C.contact || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, html) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (html !== undefined) n.innerHTML = html;
    return n;
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- icons ---------- */
  const ICON = {
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 2h-3.3v13.2a2.8 2.8 0 11-2.8-2.8c.3 0 .6 0 .8.1V9.100a6.100 6.100 0 106.100 6.100V8.600a7.600 7.600 0 004.400 1.400V6.700A4.400 4.400 0 0116.600 2z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.200"/><circle cx="17.300" cy="6.700" r="1" fill="currentColor" stroke="none"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 8.500V6.800c0-.8.200-1.200 1.400-1.200H17V2.200h-2.600C11.200 2.200 10 4 10 6.500v2H7.500V12H10v9.800h4V12h2.800l.5-3.500z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.500 3.400L2.700 10.700c-.9.400-.9 1.100 0 1.400l4.800 1.500 1.800 5.600c.2.600.9.800 1.400.4l2.700-2.200 4.800 3.500c.7.400 1.400.2 1.600-.7l3-15.200c.3-1-.4-1.500-1.300-1.100zM8.700 13.100l9.600-6-7.600 7.200-.3 3.500z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.600 15L2 22l5.200-1.400A10 10 0 1012 2zm0 18.200a8.200 8.200 0 01-4.200-1.200l-.3-.2-3 .8.8-3-.2-.3A8.200 8.200 0 1112 20.200zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8s-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100a6.700 6.700 0 01-3.300-2.900c-.2-.4.200-.4.700-1.300.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.100-.7.300-.8.800-1 1.700-.7 2.700.7 1.800 2.200 3.500 4 4.500 1.700.9 2.500 1 3.500.8.600-.1 1.500-.7 1.700-1.300.2-.6.200-1.100.1-1.200z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.900v3a2 2 0 01-2.200 2 19.800 19.800 0 01-8.600-3.100 19.500 19.500 0 01-6-6A19.800 19.800 0 012.100 4.200 2 2 0 014.100 2h3a2 2 0 012 1.700c.1 1 .4 1.900.7 2.800a2 2 0 01-.5 2.100L8.100 9.900a16 16 0 006 6l1.300-1.300a2 2 0 012.100-.4c.9.300 1.800.6 2.800.7a2 2 0 011.700 2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 2l3.100 6.600 7.200.9-5.300 5 1.400 7.100L12 18l-6.400 3.600 1.400-7.100-5.300-5 7.200-.9z"/></svg>'
  };
  const SOCIAL_LABEL = { tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook', telegram: 'Telegram', whatsapp: 'WhatsApp' };

  /* ---------- loader (lightweight: waits for load, short minimum) ---------- */
  const loader = $('#loader');
  const t0 = performance.now();
  let loaderGone = false;
  function hideLoader() {
    if (loaderGone) return; loaderGone = true;
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    setTimeout(() => loader.remove(), 900);
    $$('.hero .reveal').forEach(n => n.classList.add('is-in'));
  }
  document.body.classList.add('is-loading');
  window.addEventListener('load', () => setTimeout(hideLoader, Math.max(0, 1500 - (performance.now() - t0))));
  setTimeout(hideLoader, 3500); // hard cap

  /* ---------- nav ---------- */
  const nav = $('#nav'), toggle = $('#navToggle'), menu = $('#navMenu');
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const setMenu = open => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  const sections = $$('main section[id]');
  const links = $$('.nav__menu a[href^="#"]:not(.nav__cta)');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));

    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: .12 });
    $$('.reveal').filter(n => !n.closest('.hero')).forEach(n => io.observe(n));
  } else { $$('.reveal').forEach(n => n.classList.add('is-in')); }

  $('#year').textContent = new Date().getFullYear();

  /* ---------- contact, map, social (all from config) ---------- */
  const waDigits = (contact.whatsapp || '').replace(/\D/g, '');
  const waUrl = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(contact.whatsappMessage || '')}` : '';
  const telDigits = (contact.phone || '').replace(/[^\d+]/g, '');
  const directions = contact.directionsUrl || (contact.address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(contact.address)}` : '');
  const mapsLink = contact.directionsUrl || (contact.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}` : '');

  const info = $('#infoList'), footerList = $('#footerContact'), actions = $('#contactActions');
  let any = false;
  if (contact.address) { any = true;
    info.append(el('li', {}, `${ICON.pin}<div><b>Address</b>${esc(contact.address)}</div>`));
    footerList.append(el('li', {}, esc(contact.address))); }
  if (Array.isArray(contact.hours) && contact.hours.length) { any = true;
    info.append(el('li', {}, `${ICON.clock}<div><b>Opening hours</b>${contact.hours.map(h => `${esc(h.days)}: ${esc(h.time)}`).join('<br>')}</div>`));
    footerList.append(el('li', {}, contact.hours.map(h => `${esc(h.days)}: ${esc(h.time)}`).join('<br>'))); }
  if (contact.phone) { any = true;
    info.append(el('li', {}, `${ICON.phone}<div><b>Phone</b><a href="tel:${esc(telDigits)}">${esc(contact.phone)}</a></div>`));
    footerList.append(el('li', {}, `<a href="tel:${esc(telDigits)}">${esc(contact.phone)}</a>`));
    actions.append(el('a', { class: 'btn btn--ghost', href: 'tel:' + telDigits }, 'Call Us')); }
  if (directions) {
    actions.prepend(el('a', { class: 'btn btn--gold', href: directions, target: '_blank', rel: 'noopener noreferrer' }, 'Get Directions'));
    footerList.append(el('li', {}, `<a href="${esc(mapsLink)}" target="_blank" rel="noopener noreferrer">View on Google Maps</a>`)); }
  if (waUrl) {
    actions.append(el('a', { class: 'btn btn--green', href: waUrl, target: '_blank', rel: 'noopener noreferrer' }, `${ICON.whatsapp.replace('<svg', '<svg width="20" height="20"')} WhatsApp Us`)); }
  if (!any && !directions && !waUrl) $('#configNotice').hidden = false;
  if (!footerList.children.length) footerList.append(el('li', {}, 'Details coming soon'));

  if (contact.mapsEmbedUrl && /^https:\/\/www\.google\.com\/maps\//.test(contact.mapsEmbedUrl)) {
    const f = el('iframe', { src: contact.mapsEmbedUrl, title: 'Ye’ Jebena on Google Maps', loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade', allowfullscreen: '' });
    $('#mapBox').replaceChildren(f);
  }

  const social = Object.assign({}, C.social || {});
  if (!social.whatsapp && waUrl) social.whatsapp = waUrl;
  ['#socialRow', '#footerSocial'].forEach(sel => {
    const row = $(sel); let n = 0;
    Object.keys(SOCIAL_LABEL).forEach(k => {
      if (!social[k] || !/^https?:\/\//.test(social[k])) return; n++;
      row.append(el('a', { class: 'soc', href: social[k], target: '_blank', rel: 'noopener noreferrer', 'aria-label': 'Ye’ Jebena on ' + SOCIAL_LABEL[k], title: SOCIAL_LABEL[k] }, ICON[k]));
    });
    if (!n) row.closest('.social, div')?.classList.add('is-empty');
  });

  const gUrl = contact.googleReviewUrl;
  const gBtn = $('#googleBtn'), tGoogle = $('#thanksGoogle');
  if (gUrl && /^https:\/\//.test(gUrl)) { gBtn.href = gUrl; tGoogle.href = gUrl; }
  else { gBtn.hidden = true; tGoogle.hidden = true; }

  /* ---------- gallery + lightbox ---------- */
  const grid = $('#galleryGrid'); const shown = [];
  const loadOne = g => new Promise(res => { const i = new Image(); i.onload = () => res(g); i.onerror = () => res(null); i.src = g.src; });
  Promise.all((C.gallery || []).map(loadOne)).then(list => {
    list.filter(Boolean).forEach((g, idx) => {
      shown.push(g);
      const b = el('button', { class: 'tile reveal is-in', type: 'button', 'aria-label': 'Open photo: ' + g.caption }, `<img src="${esc(g.src)}" alt="${esc(g.alt)}" loading="lazy"><span>${esc(g.caption)}</span>`);
      b.addEventListener('click', () => openLb(idx));
      grid.append(b);
    });
    if (shown.length < 5) $('#galleryNote').hidden = false;
  });
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap'); let cur = 0, lastFocus = null;
  function showLb(i) { cur = (i + shown.length) % shown.length; lbImg.src = shown[cur].src; lbImg.alt = shown[cur].alt; lbCap.textContent = shown[cur].caption; }
  function openLb(i) { lastFocus = document.activeElement; showLb(i); lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lbClose').focus(); }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }
  $('#lbClose').onclick = closeLb; $('#lbPrev').onclick = () => showLb(cur - 1); $('#lbNext').onclick = () => showLb(cur + 1);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') showLb(cur - 1); if (e.key === 'ArrowRight') showLb(cur + 1);
  });

  /* ---------- reviews ---------- */
  const api = (C.reviews && C.reviews.apiUrl) || '/api/reviews';
  const pageSize = (C.reviews && C.reviews.pageSize) || 6;
  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
  const starsHtml = (n, full = 5) => Array.from({ length: full }, (_, i) => `<span style="display:inline-block">${ICON.star.replace('<svg', `<svg style="fill:${i < Math.round(n) ? '#c9a24a' : '#e5d9c6'}"`)}</span>`).join('');
  let rating = 0, token = '', offset = 0, total = 0;

  const pick = $('#starPick');
  for (let i = 1; i <= 5; i++) {
    const b = el('button', { type: 'button', class: 'starbtn', role: 'radio', 'aria-checked': 'false', 'aria-label': `${i} star${i > 1 ? 's' : ''}`, tabindex: i === 1 ? '0' : '-1', 'data-v': i }, ICON.star);
    pick.append(b);
  }
  const setRating = v => {
    rating = v;
    $$('.starbtn', pick).forEach(b => { const n = +b.dataset.v; b.classList.toggle('on', n <= v); b.setAttribute('aria-checked', String(n === v)); b.tabIndex = (n === v || (!v && n === 1)) ? 0 : -1; });
    $('#starLabel').textContent = v ? `${v} / 5 — ${LABELS[v]}` : 'Tap a star';
  };
  const hover = v => $$('.starbtn', pick).forEach(b => b.classList.toggle('on', +b.dataset.v <= (v || rating)));
  pick.addEventListener('click', e => { const b = e.target.closest('.starbtn'); if (b) setRating(+b.dataset.v); });
  pick.addEventListener('mouseover', e => { const b = e.target.closest('.starbtn'); if (b) hover(+b.dataset.v); });
  pick.addEventListener('mouseleave', () => hover(0));
  pick.addEventListener('keydown', e => {
    const map = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
    if (!(e.key in map)) return; e.preventDefault();
    const v = Math.min(5, Math.max(1, (rating || 0) + map[e.key])); setRating(v); $(`.starbtn[data-v="${v}"]`, pick).focus();
  });

  const box = $('#testimonials');
  function renderReviews(list, append) {
    if (!append) box.innerHTML = '';
    if (!list.length && !append) { box.append(el('p', { class: 'empty' }, 'No reviews yet — be the first to share your experience.')); return; }
    list.forEach(r => {
      const d = new Date(r.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      box.append(el('article', { class: 'tcard' }, `<div class="stars" role="img" aria-label="${r.rating} out of 5 stars">${starsHtml(r.rating)}</div>${r.text ? `<p>${esc(r.text)}</p>` : ''}<footer><b>${esc(r.name)}</b><time datetime="${esc(r.date)}">${esc(d)}</time></footer>`));
    });
  }
  function renderSummary(s) {
    total = s.total;
    $('#avgScore').textContent = s.total ? s.average.toFixed(1) : '–';
    $('#avgStars').innerHTML = starsHtml(s.total ? s.average : 0);
    $('#avgStars').setAttribute('aria-label', `${s.total ? s.average.toFixed(1) : 0} out of 5`);
    $('#reviewCount').textContent = s.total ? `Based on ${s.total} review${s.total > 1 ? 's' : ''}` : 'No reviews yet';
  }
  async function loadReviews(append) {
    try {
      const r = await fetch(`${api}?limit=${pageSize}&offset=${offset}`, { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error();
      const d = await r.json();
      token = d.token || token; renderSummary(d); renderReviews(d.reviews, append);
      offset += d.reviews.length; $('#moreReviews').hidden = offset >= total;
    } catch {
      if (!append) { box.innerHTML = ''; box.append(el('p', { class: 'empty' }, 'Reviews are temporarily unavailable. Please try again soon.')); }
    }
  }
  $('#moreReviews').addEventListener('click', () => loadReviews(true));

  const form = $('#reviewForm'), msg = $('#formMsg'), submit = $('#rvSubmit');
  const say = (t, ok) => { msg.textContent = t; msg.classList.toggle('ok', !!ok); };
  form.addEventListener('submit', async e => {
    e.preventDefault(); say('');
    const name = $('#rvName').value.trim(), text = $('#rvText').value.trim();
    if (!rating) return say('Please choose a star rating.');
    if (name.length < 2) { $('#rvName').focus(); return say('Please enter your name.'); }
    submit.disabled = true; submit.textContent = 'Sending…';
    try {
      const r = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, rating, text, website: $('#rvWebsite').value, token }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
      form.reset(); setRating(0);
      const th = $('#thanks'); th.hidden = false; $('.thanks__box', th).focus();
      offset = 0; loadReviews(false);
    } catch (err) { say(err.message); }
    submit.disabled = false; submit.textContent = 'Submit Review';
  });
  const closeThanks = () => { $('#thanks').hidden = true; };
  $('#thanksClose').onclick = closeThanks;
  $('#thanks').addEventListener('click', e => { if (e.target.id === 'thanks') closeThanks(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeThanks(); });

  $('#avgStars').innerHTML = starsHtml(0);
  loadReviews(false);
})();
