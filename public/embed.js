/* POULIA4 Blogger Embed · iframe-free Web Component-style mount */
(function () {
  'use strict';
  var current = document.currentScript;
  if (!current || !current.src) return;
  var defaultBase = new URL('.', current.src).href;
  var TEMPLATE = "<div class=\"p4-app\" data-theme=\"paper\" data-font=\"serif\">\n<a class=\"skip\" href=\"#main\">Μετάβαση στο περιεχόμενο</a>\n<div id=\"readbar\" aria-hidden=\"true\"><i></i></div>\n<header class=\"top\" id=\"top\">\n  <a class=\"brand\" href=\"#/\" aria-label=\"Αρχική Βιβλιοθήκης\">\n    <svg viewBox=\"0 0 40 40\" width=\"34\" height=\"34\" aria-hidden=\"true\"><rect width=\"40\" height=\"40\" rx=\"10\" fill=\"#1f5c4d\"/><path d=\"M9 11.5c4-1.6 8-1.2 11 1.2v17c-3-2.4-7-2.8-11-1.2z\" fill=\"#f6efdc\"/><path d=\"M31 11.5c-4-1.6-8-1.2-11 1.2v17c3-2.4 7-2.8 11-1.2z\" fill=\"#e9dcb8\"/><path d=\"M24 8c4 1 6 4 5.600 8-1.800-1.400-4-1.400-5.600-.4z\" fill=\"#d9942b\"/></svg>\n    <span><b>Βιβλιοθήκη Ορνιθολογίας</b><small>POULIA4</small></span>\n  </a>\n  <form class=\"search\" id=\"searchForm\" role=\"search\" autocomplete=\"off\">\n    <input id=\"q\" type=\"search\" placeholder=\"Αναζήτηση είδους, οικογένειας, επιστημονικού ονόματος…\" aria-label=\"Αναζήτηση\" enterkeyhint=\"search\">\n    <button type=\"submit\" aria-label=\"Αναζήτηση\"><svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\"><path d=\"M10.500 3a7.500 7.500 0 015.900 12.100l4.300 4.300-1.400 1.400-4.300-4.300A7.500 7.500 0 1110.500 3zm0 2a5.500 5.500 0 100 11 5.500 5.500 0 000-11z\" fill=\"currentColor\"/></svg></button>\n  </form>\n  <button class=\"iconbtn\" id=\"btnSet\" aria-label=\"Ρυθμίσεις ανάγνωσης\" aria-haspopup=\"dialog\"><span aria-hidden=\"true\">Aa</span></button>\n</header>\n<main id=\"main\" tabindex=\"-1\"><p class=\"loading\">Φόρτωση βιβλιοθήκης…</p></main>\n<footer class=\"foot\">\n  <p>Βιβλιοθήκη από τα άρθρα του <a href=\"https://poulia4.blogspot.com\" target=\"_blank\" rel=\"noopener\">poulia4.blogspot.com</a> · <span id=\"footStat\"></span></p>\n</footer>\n\n<div id=\"settings\" class=\"pop\" hidden role=\"dialog\" aria-label=\"Ρυθμίσεις ανάγνωσης\">\n  <div class=\"row\"><span>Μέγεθος γραμμάτων</span><div class=\"seg\"><button data-act=\"fs-\" aria-label=\"Μικρότερα γράμματα\">A−</button><output id=\"fsOut\">100%</output><button data-act=\"fs+\" aria-label=\"Μεγαλύτερα γράμματα\">A+</button></div></div>\n  <div class=\"row\"><span>Φόντο</span><div class=\"themes\" role=\"radiogroup\" aria-label=\"Φόντο\">\n    <button class=\"th th-paper\" data-theme=\"paper\" role=\"radio\" aria-label=\"Λευκό χαρτί\"><i></i>Χαρτί</button>\n    <button class=\"th th-sepia\" data-theme=\"sepia\" role=\"radio\" aria-label=\"Σέπια\"><i></i>Σέπια</button>\n    <button class=\"th th-dark\" data-theme=\"dark\" role=\"radio\" aria-label=\"Σκοτεινό\"><i></i>Νύχτα</button></div></div>\n  <div class=\"row\"><span>Γραμματοσειρά</span><div class=\"seg\"><button data-font=\"serif\">Με πατούρες</button><button data-font=\"sans\">Χωρίς</button></div></div>\n</div>\n\n<div id=\"modal\" class=\"modal\" hidden><div class=\"mcard\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"mTitle\" tabindex=\"-1\"></div></div>\n<div id=\"lightbox\" class=\"lightbox\" hidden><button class=\"lbx\" data-act=\"lb-close\" aria-label=\"Κλείσιμο\">×</button><button class=\"lbn lbp\" data-act=\"lb-prev\" aria-label=\"Προηγούμενη\">‹</button><img alt=\"\"><button class=\"lbn lbf\" data-act=\"lb-next\" aria-label=\"Επόμενη\">›</button><p></p></div>\n<div id=\"toast\" class=\"toast\" role=\"status\" aria-live=\"polite\" hidden></div>\n</div>";
  var scriptPromises = Object.create(null);
  var corePromises = Object.create(null);

  function normaliseBase(value) {
    var url = new URL(value || defaultBase, defaultBase).href;
    return url.endsWith('/') ? url : url + '/';
  }
  function loadScript(url) {
    if (scriptPromises[url]) return scriptPromises[url];
    scriptPromises[url] = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = url;
      s.async = false;
      s.onload = function () { s.remove(); resolve(); };
      s.onerror = function () { delete scriptPromises[url]; s.remove(); reject(new Error('Δεν φορτώθηκε το ' + url)); };
      document.head.appendChild(s);
    });
    return scriptPromises[url];
  }
  function loadCore(base) {
    if (corePromises[base]) return corePromises[base];
    corePromises[base] = loadScript(base + 'data/index.js')
      .then(function () { return loadScript(base + 'portraits.js'); })
      .then(function () { return loadScript(base + 'linker.js'); })
      .then(function () { return loadScript(base + 'embed-library.js'); });
    return corePromises[base];
  }
  function showError(host, error) {
    var root = host.shadowRoot || host.attachShadow({ mode: 'open' });
    root.innerHTML = '<style>:host{display:block}.err{padding:18px;border:1px solid #c44;border-radius:12px;color:#792a22;background:#fff5f3;font:15px/1.5 system-ui,sans-serif}</style><div class="err">Η ενσωματωμένη βιβλιοθήκη δεν μπόρεσε να φορτωθεί. Έλεγξε τη διεύθυνση φιλοξενίας και ανανέωσε τη σελίδα.<br><small></small></div>';
    root.querySelector('small').textContent = error && error.message ? error.message : '';
    host.removeAttribute('data-p4-mounted');
  }
  function mount(host) {
    if (host.getAttribute('data-p4-mounted')) return;
    host.setAttribute('data-p4-mounted', 'loading');
    var base = normaliseBase(host.getAttribute('data-base') || defaultBase);
    host.style.display = 'block';
    host.style.width = '100%';
    host.style.maxWidth = '100%';
    var root;
    try { root = host.shadowRoot || host.attachShadow({ mode: 'open' }); }
    catch (e) { showError(host, e); return; }
    root.innerHTML = '';
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + 'embed.css';
    root.appendChild(link);
    var wrapper = document.createElement('div');
    wrapper.innerHTML = TEMPLATE;
    root.appendChild(wrapper.firstElementChild);
    var app = root.querySelector('.p4-app');
    var loading = app.querySelector('#main .loading');
    if (loading) loading.textContent = 'Φόρτωση βιβλιοθήκης…';
    loadCore(base).then(function () {
      if (typeof window.P4MountLibrary !== 'function') throw new Error('Δεν βρέθηκε ο μηχανισμός ενσωμάτωσης.');
      window.P4MountLibrary(host, base);
      host.setAttribute('data-p4-mounted', 'yes');
    }).catch(function (error) { showError(host, error); });
  }
  function scan(scope) {
    if (scope.matches && scope.matches('[data-poulia4-library]')) mount(scope);
    if (scope.querySelectorAll) Array.prototype.forEach.call(scope.querySelectorAll('[data-poulia4-library]'), mount);
  }
  scan(document);
  if (window.MutationObserver && document.documentElement) {
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, function (node) { if (node.nodeType === 1) scan(node); });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
