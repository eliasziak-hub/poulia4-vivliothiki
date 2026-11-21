/* POULIA4 · Βιβλιοθήκη Ορνιθολογίας — εφαρμογή ανάγνωσης (χωρίς εξαρτήσεις, λειτουργεί χωρίς σύνδεση) */
(function () {
  'use strict';
  var D = window.POULIA4_LIB, L = window.P4Linker;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var main = $('#main');
  if (!D) { main.innerHTML = '<p class="loading">Δεν φορτώθηκαν τα δεδομένα της βιβλιοθήκης. Δοκίμασε ανανέωση.</p>'; return; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  /* ---------- αποθήκευση (προαιρετική· δεν σπάει αν είναι μπλοκαρισμένη) ---------- */
  var mem = {};
  function sget(k, d) { try { var v = localStorage.getItem('p4lib.' + k); if (v != null) return JSON.parse(v); } catch (e) { if (k in mem) return mem[k]; } return k in mem ? mem[k] : d; }
  function sset(k, v) { mem[k] = v; try { localStorage.setItem('p4lib.' + k, JSON.stringify(v)); } catch (e) {} }
  var readMap = sget('read', {}), posMap = sget('pos', {}), prefs = sget('prefs', { fs: 1, theme: '', font: 'serif' }), last = sget('last', null);

  /* ---------- δεδομένα ---------- */
  var A = {}, byPath = {}, C = {}, chArts = {};
  D.arts.forEach(function (a) { A[a.id] = a; byPath[a.u] = a; });
  D.chapters.forEach(function (c) { C[c.id] = c; chArts[c.id] = []; });
  D.arts.forEach(function (a) { a.c.forEach(function (cid) { if (chArts[cid]) chArts[cid].push(a); }); });
  var coll = new Intl.Collator('el', { sensitivity: 'base', numeric: true });
  Object.keys(chArts).forEach(function (cid) { chArts[cid].sort(function (x, y) { return (y.ov - x.ov) || coll.compare(x.t, y.t); }); });
  var dict = L.build(D.arts);
  var totalMin = D.arts.reduce(function (s, a) { return s + a.min; }, 0);

  /* ---------- εικόνες ---------- */
  function imgUrl(key, size) {
    if (!key) return '';
    var u = key.charAt(0) === '~' ? 'https://lh3.googleusercontent.com/' + key.slice(1) : 'https://' + key;
    return u.replace('%S', size);
  }
  var GLYPH = {
    geo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.600 2.700 3.900 5.700 3.900 9S14.600 18.300 12 21c-2.600-2.700-3.900-5.700-3.900-9S9.400 5.700 12 3z"/></svg>',
    collection: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.500C6.700 4.500 9.500 4.800 12 6.500c2.500-1.700 5.300-2 8-1v13c-2.700-1-5.500-.7-8 1-2.500-1.700-5.300-2-8-1z"/><path d="M12 6.500v13"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="11" cy="11" r="6.500"/><path d="M16 16l4.500 4.500"/></svg>'
  };
  function portrait(fam, sci, id) {
    try { if (window.__p4Portrait) return window.__p4Portrait(fam || '', sci || id, id); } catch (e) {}
    return '';
  }
  function artThumb(a, cls) {
    var im = a.m ? '<img loading="lazy" decoding="async" alt="" width="160" height="160" src="' + esc(imgUrl(a.m, 's160-c')) + '">' : '';
    return '<span class="art-th ' + (cls || '') + '">' + portrait(a.f, a.lat || a.t, a.id) + im + '</span>';
  }
  function chapIcon(c, lg) {
    if (c.kind === 'order' || c.kind === 'family') return '<span class="cicon' + (lg ? ' lg' : '') + '">' + portrait(c.fam, c.name, c.id) + '</span>';
    return '<span class="cicon glyph' + (lg ? ' lg' : '') + '">' + (GLYPH[c.kind] || GLYPH.collection) + '</span>';
  }
  document.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.closest && t.closest('.art-th,.gallery,.mph')) { if (t.closest('.art-th')) t.remove(); else t.style.visibility = 'hidden'; } }, true);

  /* ---------- δεδομένα άρθρων (τμήματα, ζητούνται όταν χρειάζονται) ---------- */
  var chunks = {};
  function loadChunk(k) {
    if (!chunks[k]) chunks[k] = fetch('data/b' + k + '.json').then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).catch(function (e) { delete chunks[k]; throw e; });
    return chunks[k];
  }
  function getBody(id) { return loadChunk(A[id].b).then(function (c) { return c[id]; }); }

  /* ---------- βοηθητικά UI ---------- */
  function toast(msg, action, fn, ms) {
    var t = $('#toast'); t.innerHTML = '<span></span>'; t.firstChild.textContent = msg;
    if (action) { var b = document.createElement('button'); b.textContent = action; b.onclick = function () { t.hidden = true; fn && fn(); }; t.appendChild(b); }
    t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, ms || 4200);
  }
  function setTitle(s) { document.title = (s ? s + ' · ' : '') + 'Βιβλιοθήκη Ορνιθολογίας'; }
  function readCount(cid) { return chArts[cid].reduce(function (n, a) { return n + (readMap[a.id] ? 1 : 0); }, 0); }
  function mins(n) { return n >= 90 ? (Math.round(n / 6) / 10).toString().replace('.', ',') + ' ώρες' : n + ' λεπτά'; }
  function chapterTypeLabel(c) { return { order: 'Τάξη', family: 'Οικογένεια', collection: 'Συλλογή', geo: 'Ήπειρος' }[c.kind]; }
  function bar(pct) { return '<span class="bar" aria-hidden="true"><i style="width:' + Math.round(pct) + '%"></i></span>'; }
  function applyPrefs() {
    var h = document.documentElement, th = prefs.theme || (matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'paper');
    h.setAttribute('data-theme', th); h.setAttribute('data-font', prefs.font || 'serif'); h.style.setProperty('--fs', prefs.fs || 1);
    var m = $('meta[name=theme-color]'); if (m) m.setAttribute('content', { paper: '#1f5c4d', sepia: '#6b4a1c', dark: '#12171a' }[th]);
    $('#fsOut').textContent = Math.round((prefs.fs || 1) * 100) + '%';
    $$('#settings .th').forEach(function (b) { b.setAttribute('aria-checked', String(b.dataset.theme === th)); });
    $$('#settings [data-font]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.font === (prefs.font || 'serif'))); });
  }

  /* ---------- αρχική ---------- */
  var deferredInstall = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredInstall = e; var b = $('#btnInstall'); if (b) b.hidden = false; });

  function chapCard(c) {
    var n = chArts[c.id].length, r = readCount(c.id);
    return '<a class="chap" href="#/k/' + c.id + '">' + chapIcon(c) + '<span><b>' + esc(c.name) + '</b><small>' + plural(n, 'άρθρο', 'άρθρα') + (r ? ' · ' + r + ' διαβασμένα' : '') + '</small>' + bar(n ? r * 100 / n : 0) + '</span></a>';
  }
  function shelf(title, sub, kinds) {
    var list = D.chapters.filter(function (c) { return kinds.indexOf(c.kind) > -1; });
    if (!list.length) return '';
    return '<section class="shelf"><h2>' + title + ' <small>' + list.length + '</small></h2><p>' + sub + '</p><div class="grid">' + list.map(chapCard).join('') + '</div></section>';
  }
  function dlStatus() {
    var d = sget('dl', null);
    return d ? '<b>Έτοιμο για χρήση χωρίς σύνδεση</b> (λήψη ' + new Date(d).toLocaleDateString('el-GR') + '). Μπορείς να τη ξανακάνεις για να πάρεις τις νεότερες αλλαγές.' : '<b>Χρήση χωρίς σύνδεση.</b> Κατέβασε όλα τα κείμενα (και τις μικρογραφίες 160px) ώστε να διαβάζεις και χωρίς δίκτυο — π.χ. στο πεδίο.';
  }
  function viewHome() {
    setTitle('');
    var lastA = last && A[last.id], h = '';
    h += '<section class="hero"><div><h1>Η βιβλιοθήκη του poulia4, σε οδηγούς.</h1><p>' + plural(D.arts.length, 'άρθρο', 'άρθρα') + ' ειδών οργανωμένα σε τάξεις και οικογένειες, με αναζήτηση, αυτόματες συνδέσεις ονομάτων, εύκολη ανάγνωση και πλήρη χρήση χωρίς σύνδεση.</p><div class="cta"><a class="btn" href="#/k/' + (D.chapters[0] ? D.chapters[0].id : '') + '">Ξεκίνα από τα αρπακτικά</a><button class="btn ghost" data-act="random">Τυχαίο άρθρο</button><button class="btn ghost" id="btnInstall" data-act="install" hidden>Εγκατάσταση</button></div></div>' +
      '<div class="stats"><div class="stat"><b>' + D.arts.length + '</b><span>άρθρα</span></div><div class="stat"><b>' + D.chapters.length + '</b><span>κεφάλαια</span></div><div class="stat"><b>' + Math.round(totalMin / 60) + '</b><span>ώρες ανάγνωσης</span></div></div></section>';
    if (lastA) h += '<a class="resume" href="#/a/' + lastA.id + '">' + artThumb(lastA) + '<span><small>Συνέχισε την ανάγνωση</small><b>' + esc(lastA.t) + '</b></span><em>' + Math.round((posMap[lastA.id] || 0) * 100) + '%</em></a>';
    h += '<div class="offline" id="offline"><p id="dlText">' + dlStatus() + '</p><button class="btn line" data-act="dl">' + (sget('dl', null) ? 'Ενημέρωση λήψης' : 'Λήψη για offline') + '</button><div class="dlbar" id="dlBar" hidden><i></i></div></div>';
    h += shelf('Τάξεις', 'Μεγάλες ομάδες πουλιών — από εδώ μπαίνεις στις επισκοπήσεις και στα είδη τους.', ['order']);
    h += shelf('Οικογένειες', 'Κάθε οικογένεια με τα είδη της, τα χαρακτηριστικά και τις φωτογραφίες τους.', ['family']);
    h += shelf('Συλλογές', 'Θεματικές διαδρομές: συγκρίσεις παρόμοιων ειδών, παράδοξα της φύσης, εξωτικά πουλιά.', ['collection']);
    h += shelf('Ανά ήπειρο', 'Τα είδη όπως τα έχεις ταξινομήσει στο ιστολόγιο ανά γεωγραφική προέλευση.', ['geo']);
    h += '<p style="text-align:center;margin-top:26px"><a class="btn line" href="#/me">Η πρόοδός μου</a></p>';
    main.innerHTML = h;
  }

  /* ---------- κεφάλαιο ---------- */
  var chapFilter = { q: '', mode: 'all' };
  function viewChapter(cid) {
    var c = C[cid]; if (!c) return viewNotFound();
    setTitle(c.name);
    var list = chArts[cid], r = readCount(cid), mm = list.reduce(function (s, a) { return s + a.min; }, 0);
    var intro = c.intro && A[c.intro];
    var h = '<nav class="crumb" aria-label="Διαδρομή"><a href="#/">Βιβλιοθήκη</a> › <span>' + chapterTypeLabel(c) + '</span></nav>';
    h += '<section class="chead">' + chapIcon(c, true) + '<div><h1>' + esc(c.name) + '</h1><p class="sub">' + chapterTypeLabel(c) + ' · ' + plural(list.length, 'άρθρο', 'άρθρα') + ' · ' + mins(mm) + ' ανάγνωσης' + (c.desc ? ' — ' + esc(c.desc) : '') + '</p>' +
      '<div class="prog">' + bar(list.length ? r * 100 / list.length : 0) + '<span>' + r + ' / ' + list.length + ' διαβασμένα</span></div><div class="acts">' +
      (intro ? '<a class="btn" href="#/a/' + intro.id + '/' + cid + '">Επισκόπηση του κεφαλαίου</a>' : '') + '<button class="btn line" data-act="next-unread" data-c="' + cid + '">Επόμενο αδιάβαστο</button></div></div></section>';
    h += '<div class="tools"><input id="cf" type="search" placeholder="Φίλτρο μέσα στο κεφάλαιο…" aria-label="Φίλτρο άρθρων" value="' + esc(chapFilter.q) + '"><div class="chips" role="group" aria-label="Προβολή">' +
      [['all', 'Όλα'], ['unread', 'Αδιάβαστα'], ['ov', 'Επισκοπήσεις']].map(function (m) { return '<button class="chip" data-act="cmode" data-m="' + m[0] + '" aria-pressed="' + (chapFilter.mode === m[0]) + '">' + m[1] + '</button>'; }).join('') + '</div></div>';
    h += '<div class="alist" id="alist"></div>';
    main.innerHTML = h;
    var inp = $('#cf'); inp.oninput = function () { chapFilter.q = inp.value; fillList(cid); };
    fillList(cid);
  }
  function rowHtml(a, cid) {
    var read = readMap[a.id];
    return '<a class="arow' + (read ? ' is-read' : '') + '" href="#/a/' + a.id + (cid ? '/' + cid : '') + '">' + artThumb(a) + '<span><b>' + esc(a.t) + '</b>' + (a.lat ? '<i class="lat">' + esc(a.lat) + '</i>' : '') +
      '<span class="meta"><span>' + a.min + '′ ανάγνωση</span>' + (a.g ? '<span>' + a.g + ' φωτ.</span>' : '') + (a.ov ? '<span class="tagov">Επισκόπηση</span>' : '') + '</span><p class="sum">' + esc(a.s) + '</p></span></a>';
  }
  function fillList(cid) {
    var q = L.norm(chapFilter.q.trim()), list = chArts[cid].filter(function (a) {
      if (chapFilter.mode === 'unread' && readMap[a.id]) return false;
      if (chapFilter.mode === 'ov' && !a.ov) return false;
      return !q || a.n.indexOf(q) > -1;
    });
    $('#alist').innerHTML = list.length ? list.map(function (a) { return rowHtml(a, cid); }).join('') : '<p class="empty">Δεν βρέθηκαν άρθρα.</p>';
    $$('.chip[data-act=cmode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.m === chapFilter.mode)); });
  }
  D.arts.forEach(function (a) { a.n = L.norm(a.t + ' ' + (a.lat || '') + ' ' + a.l.join(' ')); a.ns = L.norm(a.s); });

  /* ---------- αναζήτηση ---------- */
  function viewSearch(q) {
    setTitle('Αναζήτηση: ' + q);
    var nq = L.norm(q).trim(), toks = nq.split(/\s+/).filter(Boolean), res = [];
    if (toks.length) D.arts.forEach(function (a) {
      var sc = 0, ok = true;
      toks.forEach(function (t) {
        var w = L.norm(a.t);
        if (w.indexOf(t) === 0) sc += 4; else if (w.indexOf(t) > -1) sc += 3; else if (a.n.indexOf(t) > -1) sc += 2; else if (a.ns.indexOf(t) > -1) sc += 1; else ok = false;
      });
      if (ok) res.push([sc - (a.ov ? 0.5 : 0), a]);
    });
    res.sort(function (x, y) { return y[0] - x[0] || coll.compare(x[1].t, y[1].t); });
    var chs = toks.length ? D.chapters.filter(function (c) { return L.norm(c.name).indexOf(nq) > -1; }) : [];
    var h = '<h1 style="font:700 28px var(--serif);margin:6px 0 14px">Αναζήτηση: «' + esc(q) + '»</h1>';
    if (chs.length) h += '<div class="grid" style="margin-bottom:16px">' + chs.map(chapCard).join('') + '</div>';
    h += '<p class="sub" style="color:var(--muted)">' + plural(res.length, 'αποτέλεσμα', 'αποτελέσματα') + (res.length > 80 ? ' (εμφανίζονται τα 80 πρώτα)' : '') + '</p><div class="alist">' +
      (res.slice(0, 80).map(function (x) { return rowHtml(x[1]); }).join('') || '<p class="empty">Δεν βρέθηκε τίποτα. Δοκίμασε μικρότερη λέξη ή χωρίς τόνους.</p>') + '</div>';
    main.innerHTML = h;
  }

  /* ---------- η πρόοδός μου ---------- */
  function viewMe() {
    setTitle('Η πρόοδός μου');
    var rd = D.arts.filter(function (a) { return readMap[a.id]; }), ip = D.arts.filter(function (a) { return !readMap[a.id] && posMap[a.id] > 0.04; });
    var rm = rd.reduce(function (s, a) { return s + a.min; }, 0), pct = D.arts.length ? rd.length * 100 / D.arts.length : 0;
    var h = '<h1 style="font:700 30px var(--serif);margin:6px 0 14px">Η πρόοδός μου</h1><div class="me"><div class="box"><b style="font:700 22px var(--serif)">' + rd.length + ' από ' + D.arts.length + ' άρθρα</b><p style="margin:4px 0 0;color:var(--muted)">≈ ' + mins(rm) + ' ανάγνωσης ολοκληρώθηκαν. Η πρόοδος μένει μόνο σε αυτή τη συσκευή.</p>' + bar(pct) + '</div>';
    if (ip.length) h += '<div class="box"><h2 style="font:700 20px var(--serif);margin:0 0 10px">Σε εξέλιξη</h2><div class="alist">' + ip.map(function (a) { return rowHtml(a); }).join('') + '</div></div>';
    if (rd.length) h += '<div class="box"><h2 style="font:700 20px var(--serif);margin:0 0 10px">Διαβασμένα</h2><div class="alist">' + rd.slice(-40).reverse().map(function (a) { return rowHtml(a); }).join('') + '</div></div>';
    h += '<p><button class="btn line" data-act="reset">Μηδενισμός προόδου</button></p></div>';
    main.innerHTML = h;
  }
  function viewNotFound() { setTitle('Δεν βρέθηκε'); main.innerHTML = '<p class="empty">Δεν βρέθηκε η σελίδα. <a href="#/">Πίσω στην αρχική</a></p>'; }

  /* ---------- άρθρο ---------- */
  var cur = null;   // τρέχον άρθρο: {id,cid,body,prose,done}
  var ttsOn = false, ttsQueue = [], ttsIdx = 0;
  function viewArticle(id, cid) {
    var a = A[id]; if (!a) return viewNotFound();
    setTitle(a.t);
    main.innerHTML = '<p class="loading">Φόρτωση άρθρου…</p>';
    var token = cur = { id: id, cid: cid, body: null, prose: null, done: !!readMap[id] };
    getBody(id).then(function (body) {
      if (cur !== token) return;
      token.body = body;
      renderArticle(a, body, cid);
    }).catch(function () {
      if (cur !== token) return;
      main.innerHTML = '<div class="empty"><p>Το άρθρο δεν είναι διαθέσιμο χωρίς σύνδεση.</p><p>Κατέβασε τη βιβλιοθήκη από την <a href="#/">αρχική</a> όταν έχεις δίκτυο.</p></div>';
    });
  }
  function renderArticle(a, body, cid) {
    var chs = a.c.map(function (x) { return C[x]; }).filter(Boolean);
    var ctx = cid && C[cid] ? C[cid] : (chs.filter(function (c) { return c.kind === 'family' || c.kind === 'order'; })[0] || chs[0]);
    var h = '<article class="article"><nav class="crumb" aria-label="Διαδρομή"><a href="#/">Βιβλιοθήκη</a>' + (ctx ? ' › <a href="#/k/' + ctx.id + '">' + esc(ctx.name) + '</a>' : '') + '</nav>';
    h += '<header class="ahead">' + artThumb(a) + '<div><h1>' + esc(a.t) + '</h1>' + (a.lat ? '<p class="lat">' + esc(a.lat) + '</p>' : '') + '</div></header>';
    h += '<div class="ameta"><span>' + a.min + '′ ανάγνωση</span>' + chs.map(function (c) { return '<a class="chip" href="#/k/' + c.id + '">' + esc(c.name) + '</a>'; }).join('') + '<span class="done" id="doneTag"' + (readMap[a.id] ? '' : ' hidden') + '>✓ Διαβασμένο</span></div>';
    h += '<div class="listen">' + ('speechSynthesis' in window ? '<button class="btn line" data-act="tts" aria-pressed="false">🔊 Ακρόαση</button>' : '') + '<a class="btn line" href="' + esc(D.blog + a.u) + '" target="_blank" rel="noopener noreferrer">Στο ιστολόγιο ↗</a></div>';
    if (body.g && body.g.length) h += '<div class="gallery n' + (body.g.length === 1 ? 1 : 'm') + '" role="list" aria-label="Φωτογραφίες">' + body.g.map(function (g, i) { return '<button role="listitem" data-act="lb" data-i="' + i + '" aria-label="Μεγέθυνση φωτογραφίας ' + (i + 1) + '"><img loading="lazy" decoding="async" width="160" height="160" alt="' + esc(g[1] || a.t) + '" src="' + esc(imgUrl(g[0], 's160-c')) + '"></button>'; }).join('') + '</div>';
    h += '<div class="prose" id="prose"></div>';
    if (body.v && body.v.length) h += '<p class="videos">' + body.v.map(function (v, i) { return '<a class="btn line" href="https://www.youtube.com/watch?v=' + esc(v) + '" target="_blank" rel="noopener noreferrer">▶ Βίντεο ' + (body.v.length > 1 ? i + 1 : '') + '</a>'; }).join('') + '</p>';
    h += '<div class="donebar"><span class="src">Πηγή: <a href="' + esc(D.blog + a.u) + '" target="_blank" rel="noopener noreferrer">poulia4.blogspot.com</a></span><button class="btn line" data-act="done">' + (readMap[a.id] ? 'Ξαναδιάβασέ το (αφαίρεση ✓)' : '✓ Σημείωσε ως διαβασμένο') + '</button></div>';
    if (a.r && a.r.length) h += '<section class="arel"><h2>Σχετικά άρθρα</h2><div class="rel">' + a.r.filter(function (x) { return A[x]; }).map(function (x) { var b = A[x]; return '<a class="rcard" href="#/a/' + b.id + '">' + artThumb(b) + '<b>' + esc(b.t) + '</b><small>' + b.min + '′ ανάγνωση</small></a>'; }).join('') + '</div></section>';
    if (ctx) {
      var list = chArts[ctx.id], i = list.findIndex(function (x) { return x.id === a.id; });
      if (i > -1 && list.length > 1) {
        var pv = list[(i - 1 + list.length) % list.length], nx = list[(i + 1) % list.length];
        h += '<nav class="pn" aria-label="Στο κεφάλαιο"><a class="pv" href="#/a/' + pv.id + '/' + ctx.id + '"><small>← Προηγούμενο</small><b>' + esc(pv.t) + '</b></a><a class="nx" href="#/a/' + nx.id + '/' + ctx.id + '"><small>Επόμενο →</small><b>' + esc(nx.t) + '</b></a></nav>';
      }
    }
    main.innerHTML = h + '</article>';
    var prose = $('#prose'); prose.innerHTML = body.h; cur.prose = prose; cur.ctx = ctx;
    fixLinks(prose); autolink(prose, a.id);
    last = { id: a.id, ts: Date.now() }; sset('last', last);
    var p = posMap[a.id];
    if (p && p > 0.05 && p < 0.95 && !readMap[a.id]) {
      toast('Συνέχεια από εκεί που σταμάτησες (' + Math.round(p * 100) + '%)', 'Από την αρχή', function () { window.scrollTo(0, 0); }, 5000);
      requestAnimationFrame(function () { var r = prose.getBoundingClientRect(); window.scrollTo(0, Math.max(0, r.top + scrollY + r.height * p - innerHeight * 0.3)); });
    } else window.scrollTo(0, 0);
    onScroll();
  }
  function fixLinks(root) {
    $$('a[data-p]', root).forEach(function (el) {
      var t = byPath[el.getAttribute('data-p')];
      if (t) el.setAttribute('href', '#/a/' + t.id); else { el.setAttribute('href', D.blog + el.getAttribute('data-p')); el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener noreferrer'); }
      el.removeAttribute('data-p');
    });
  }
  function autolink(root, selfId) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      for (var p = n.parentNode; p && p !== root; p = p.parentNode) if (/^(A|H3|H4|BUTTON)$/.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
      return n.nodeValue.trim().length > 3 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    } }), nodes = [], seen = {}, n;
    while ((n = w.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var text = node.nodeValue, ms = L.find(dict, text, selfId, seen, 40);
      if (!ms.length) return;
      var frag = document.createDocumentFragment(), pos = 0;
      ms.forEach(function (m) {
        if (m.s > pos) frag.appendChild(document.createTextNode(text.slice(pos, m.s)));
        var a = document.createElement('a'); a.className = 'sp-link'; a.href = '#/a/' + m.id; a.dataset.sp = m.id; a.title = 'Γρήγορη κάρτα: ' + A[m.id].t; a.textContent = text.slice(m.s, m.e);
        frag.appendChild(a); pos = m.e;
      });
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* ---------- πρόοδος ανάγνωσης ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var rb = $('#readbar'), pr = cur && cur.prose;
      if (!pr) { rb.classList.remove('on'); return; }
      var r = pr.getBoundingClientRect(), tot = r.height, seen = Math.min(tot, Math.max(0, innerHeight * 0.85 - r.top)), f = tot ? seen / tot : 0;
      rb.classList.add('on'); rb.firstElementChild.style.width = Math.round(f * 100) + '%';
      cur.frac = f;
      if (f > 0.04 && !cur.done) { posMap[cur.id] = Math.round(f * 100) / 100; clearTimeout(onScroll.t); onScroll.t = setTimeout(function () { sset('pos', posMap); }, 400); }
      if (f >= 0.93 && !cur.done) setRead(cur.id, true, true);
    });
  }
  function setRead(id, v, auto) {
    if (v) { readMap[id] = Date.now(); delete posMap[id]; } else { delete readMap[id]; }
    sset('read', readMap); sset('pos', posMap);
    if (cur && cur.id === id) {
      cur.done = v; var t = $('#doneTag'); if (t) t.hidden = !v;
      var b = $('[data-act=done]'); if (b) b.textContent = v ? 'Ξαναδιάβασέ το (αφαίρεση ✓)' : '✓ Σημείωσε ως διαβασμένο';
    }
    if (v && auto) toast('Διαβασμένο ✓ — η πρόοδος αποθηκεύτηκε');
  }
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
  addEventListener('pagehide', function () { sset('pos', posMap); });

  /* ---------- ακρόαση (speechSynthesis) ---------- */
  function ttsStop() {
    ttsOn = false; try { speechSynthesis.cancel(); } catch (e) {}
    $$('.tts-on').forEach(function (e) { e.classList.remove('tts-on'); });
    var b = $('[data-act=tts]'); if (b) { b.setAttribute('aria-pressed', 'false'); b.textContent = '🔊 Ακρόαση'; }
  }
  function ttsStart() {
    if (!cur || !cur.prose) return;
    ttsQueue = $$('h3,h4,p,li', cur.prose).filter(function (e) { return e.textContent.trim().length > 1; }); ttsIdx = 0; ttsOn = true;
    var b = $('[data-act=tts]'); b.setAttribute('aria-pressed', 'true'); b.textContent = '⏹ Διακοπή';
    ttsNext();
  }
  function ttsNext() {
    if (!ttsOn) return;
    $$('.tts-on').forEach(function (e) { e.classList.remove('tts-on'); });
    var el = ttsQueue[ttsIdx]; if (!el) return ttsStop();
    el.classList.add('tts-on'); el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    var u = new SpeechSynthesisUtterance(el.textContent); u.lang = 'el-GR'; u.rate = 0.95;
    try { var v = speechSynthesis.getVoices().filter(function (x) { return /^el/i.test(x.lang); })[0]; if (v) u.voice = v; } catch (e) {}
    u.onend = function () { ttsIdx++; ttsNext(); }; u.onerror = function () { ttsStop(); };
    speechSynthesis.speak(u);
  }

  /* ---------- quick-card ειδών ---------- */
  var lastFocus = null;
  function openCard(id) {
    var a = A[id]; if (!a) return;
    var m = $('#modal'), card = $('.mcard', m), chs = a.c.map(function (x) { return C[x]; }).filter(function (c) { return c && c.kind !== 'geo'; });
    lastFocus = document.activeElement;
    card.innerHTML = '<div class="mhead">' + artThumb(a) + '<div><h2 id="mTitle">' + esc(a.t) + '</h2>' + (a.lat ? '<p class="lat">' + esc(a.lat) + '</p>' : '') + '</div><button class="mclose" data-act="close" aria-label="Κλείσιμο">×</button></div>' +
      '<div class="mbody"><div class="mchips">' + chs.map(function (c) { return '<a href="#/k/' + c.id + '" data-act="close">' + esc(c.name) + '</a>'; }).join('') + '</div><p id="mText">' + esc(a.s) + '…</p><div class="mph" id="mPh"></div>' +
      '<div class="macts"><a class="btn" href="#/a/' + a.id + '" data-act="close">Διάβασε το άρθρο (' + a.min + '′)</a><a class="btn line" href="' + esc(D.blog + a.u) + '" target="_blank" rel="noopener noreferrer">Στο ιστολόγιο ↗</a></div></div>';
    m.hidden = false; document.body.style.overflow = 'hidden'; card.focus();
    getBody(id).then(function (b) {
      if (m.hidden || !$('#mText')) return;
      var tmp = document.createElement('div'); tmp.innerHTML = b.h;
      var first = $$('p', tmp).map(function (p) { return p.textContent.trim(); }).filter(function (t) { return t.length > 60; })[0];
      if (first) $('#mText').textContent = first.length > 380 ? first.slice(0, first.lastIndexOf(' ', 380)) + '…' : first;
      $('#mPh').innerHTML = (b.g || []).slice(0, 4).map(function (g) { return '<span><img loading="lazy" width="160" height="160" alt="' + esc(a.t) + '" src="' + esc(imgUrl(g[0], 's160-c')) + '"></span>'; }).join('');
    }).catch(function () {});
  }
  function closeCard() { var m = $('#modal'); if (m.hidden) return; m.hidden = true; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) {} }

  /* ---------- φωτογραφίες σε μεγέθυνση ---------- */
  var lbI = 0;
  function lbShow(i) {
    var g = cur && cur.body && cur.body.g; if (!g || !g.length) return;
    lbI = (i + g.length) % g.length;
    var lb = $('#lightbox'), im = $('img', lb), big = imgUrl(g[lbI][0], 's1200'), small = imgUrl(g[lbI][0], 's160-c');
    im.onerror = function () { im.onerror = null; im.src = small; }; im.src = big; im.alt = g[lbI][1] || A[cur.id].t;
    $('p', lb).textContent = (g[lbI][1] ? g[lbI][1] + ' · ' : '') + (lbI + 1) + ' / ' + g.length; lb.hidden = false;
  }

  /* ---------- λήψη για offline ---------- */
  var dlBusy = false;
  function downloadAll() {
    if (dlBusy) return; dlBusy = true;
    var bar = $('#dlBar'), fill = bar.firstElementChild, txt = $('#dlText'); bar.hidden = false;
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
    var imgs = D.arts.filter(function (a) { return a.m; }).map(function (a) { return imgUrl(a.m, 's160-c'); });
    var total = D.chunks + imgs.length, done = 0, fail = 0;
    function tick() { done++; fill.style.width = Math.round(done * 100 / total) + '%'; txt.innerHTML = '<b>Λήψη…</b> ' + done + ' / ' + total; }
    var jobs = []; for (var k = 0; k < D.chunks; k++) (function (k) { jobs.push(function () { return loadChunk(k).then(tick, function () { fail++; tick(); }); }); })(k);
    imgs.forEach(function (u) { jobs.push(function () { return fetch(u, { mode: 'no-cors', referrerPolicy: 'no-referrer' }).then(tick, function () { fail++; tick(); }); }); });
    var i = 0;
    function worker() { if (i >= jobs.length) return Promise.resolve(); return jobs[i++]().then(worker); }
    Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]).then(function () {
      dlBusy = false; if (fail < D.chunks) { sset('dl', Date.now()); }
      bar.hidden = true; txt.innerHTML = fail ? '<b>Ολοκληρώθηκε με ' + fail + ' αποτυχίες</b> (συνήθως φωτογραφίες που δεν φόρτωσαν). Δοκίμασε ξανά με καλύτερο δίκτυο.' : dlStatus();
      toast(fail ? 'Η λήψη τελείωσε με ' + fail + ' αποτυχίες' : 'Έτοιμο — η βιβλιοθήκη δουλεύει και χωρίς σύνδεση');
    });
  }

  /* ---------- δρομολόγηση ---------- */
  function route() {
    ttsStop(); closeCard(); $('#lightbox').hidden = true;
    var h = decodeURIComponent((location.hash || '#/').slice(1)), p = h.split('/');
    cur = null; $('#readbar').classList.remove('on');
    if (p[1] === 'a' && p[2]) viewArticle(p[2], p[3]);
    else if (p[1] === 'k' && p[2]) { viewChapter(p[2]); window.scrollTo(0, 0); }
    else if (p[1] === 'q') { viewSearch(p.slice(2).join('/')); window.scrollTo(0, 0); }
    else if (p[1] === 'me') { viewMe(); window.scrollTo(0, 0); }
    else { viewHome(); window.scrollTo(0, 0); }
    $('#settings').hidden = true;
    if (p[1] !== 'q') { var q = $('#q'); if (q) q.value = ''; }
  }
  addEventListener('hashchange', route);
  $('#searchForm').addEventListener('submit', function (e) { e.preventDefault(); var v = $('#q').value.trim(); if (v) location.hash = '#/q/' + encodeURIComponent(v); });

  /* ---------- γεγονότα ---------- */
  document.addEventListener('click', function (e) {
    var sp = e.target.closest && e.target.closest('a.sp-link');
    if (sp && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); openCard(sp.dataset.sp); return; }
    var m = $('#modal'); if (e.target === m) { closeCard(); return; }
    var st = $('#settings'); if (!st.hidden && !e.target.closest('#settings') && !e.target.closest('#btnSet')) st.hidden = true;
    var el = e.target.closest('[data-act],[data-theme],[data-font]'); if (!el) return;
    var act = el.dataset.act;
    if (el.dataset.theme) { prefs.theme = el.dataset.theme; sset('prefs', prefs); applyPrefs(); return; }
    if (el.dataset.font) { prefs.font = el.dataset.font; sset('prefs', prefs); applyPrefs(); return; }
    if (act === 'fs+' || act === 'fs-') { prefs.fs = Math.min(1.6, Math.max(0.8, Math.round(((prefs.fs || 1) + (act === 'fs+' ? 0.1 : -0.1)) * 10) / 10)); sset('prefs', prefs); applyPrefs(); onScroll(); }
    else if (act === 'close') closeCard();
    else if (act === 'random') { var pool = D.arts.filter(function (a) { return !a.ov && a.lat; }); location.hash = '#/a/' + pool[Math.floor(Math.random() * pool.length)].id; }
    else if (act === 'install') { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; el.hidden = true; } }
    else if (act === 'dl') downloadAll();
    else if (act === 'cmode') { chapFilter.mode = el.dataset.m; var cm = /^#\/k\/(\w+)/.exec(location.hash); if (cm) fillList(cm[1]); }
    else if (act === 'next-unread') { var nu = chArts[el.dataset.c].filter(function (a) { return !readMap[a.id] && !a.ov; })[0] || chArts[el.dataset.c][0]; if (nu) location.hash = '#/a/' + nu.id + '/' + el.dataset.c; }
    else if (act === 'done') { if (cur) setRead(cur.id, !cur.done); }
    else if (act === 'tts') { ttsOn ? ttsStop() : ttsStart(); }
    else if (act === 'lb') lbShow(+el.dataset.i);
    else if (act === 'lb-close') $('#lightbox').hidden = true;
    else if (act === 'lb-prev') lbShow(lbI - 1);
    else if (act === 'lb-next') lbShow(lbI + 1);
    else if (act === 'reset') { if (confirm('Να μηδενιστεί η πρόοδος ανάγνωσης σε αυτή τη συσκευή;')) { readMap = {}; posMap = {}; sset('read', readMap); sset('pos', posMap); viewMe(); } }
  });
  $('#btnSet').addEventListener('click', function () { var s = $('#settings'); s.hidden = !s.hidden; });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!$('#lightbox').hidden) $('#lightbox').hidden = true; else if (!$('#modal').hidden) closeCard(); else $('#settings').hidden = true; return; }
    var m = $('#modal');
    if (e.key === 'Tab' && !m.hidden) {
      var f = $$('a[href],button', m).filter(function (x) { return x.offsetParent !== null; }); if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === $('.mcard', m))) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
    if (!$('#lightbox').hidden) { if (e.key === 'ArrowLeft') lbShow(lbI - 1); if (e.key === 'ArrowRight') lbShow(lbI + 1); return; }
    if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '') || !m.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if (cur && cur.ctx && cur.body && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { var l = $(e.key === 'ArrowLeft' ? '.pn .pv' : '.pn .nx'); if (l) location.hash = l.getAttribute('href'); }
  });

  /* ---------- εκκίνηση ---------- */
  $('#footStat').textContent = plural(D.arts.length, 'άρθρο', 'άρθρα') + ' · ' + plural(D.chapters.length, 'κεφάλαιο', 'κεφάλαια');
  applyPrefs(); route();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      function ask(w) { toast('Υπάρχει νέα έκδοση της βιβλιοθήκης', 'Ανανέωση', function () { w.postMessage({ type: 'SKIP_WAITING' }); }, 12000); }
      if (reg.waiting && navigator.serviceWorker.controller) ask(reg.waiting);
      reg.addEventListener('updatefound', function () { var w = reg.installing; w && w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) ask(w); }); });
    }).catch(function () {});
    var reloaded = false; navigator.serviceWorker.addEventListener('controllerchange', function () { if (!reloaded && !window.__noReload) { reloaded = true; location.reload(); } });
  }
  window.P4Library = { open: function (id) { location.hash = '#/a/' + id; }, card: openCard, _state: function () { return { readMap: readMap, posMap: posMap, prefs: prefs, dict: dict }; } };
})();
