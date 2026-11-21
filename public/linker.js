/* POULIA4 · Βιβλιοθήκη Ορνιθολογίας — αυτόματη σύνδεση ονομάτων ειδών μέσα στο κείμενο.
   Καθαρές συναρτήσεις (χωρίς DOM) ώστε να ελέγχονται και σε Node. Ταιριάζει και κλιτούς τύπους (Πετρίτης/Πετρίτη/Πετρίτες). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.P4Linker = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var SUF = ['ουσ', 'ων', 'ησ', 'ασ', 'οσ', 'ου', 'εσ', 'ισ', 'ια', 'ιο', 'οι', 'ει', 'α', 'η', 'ο', 'ι', 'ε', 'υ', 'σ'];
  var ART = /^(ο|η|το|οι|τα|του|της|των)$/;
  var TAXON = /(ιδεσ|ιδαι|ομορφα|οειδη)$/;
  var STOPNAMES = /^(αρπακτικα|παπαγαλοι|γλαρονια|τσιροβακοι|πετροκληδεσ|βουτυχταρια|κυκνοι|κορακια|πουλια|παπιεσ|χηνεσ|γυπεσ|αετοι|γλαροι|σαινια|χλωριδα|)$|^(πουλι|πουλια|πτηνα|ειδοσ|ειδη|οικογενεια|γενοσ|ανθρωποσ|φυση|ζωα|ζωο|εργα|πηγη|χρωμα|πτερυγα|φτερα|ραμφοσ|ουρα|μυτη|αυγα|φωλια|φωλιεσ)$/;

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ς/g, 'σ');
  }
  function stem(w) {
    if (w.length < 5) return w;
    for (var i = 0; i < SUF.length; i++) {
      var s = SUF[i];
      if (w.length - s.length >= 4 && w.slice(-s.length) === s) { w = w.slice(0, -s.length); break; }
    }
    if (w.length > 5 && /[ιυ]$/.test(w)) w = w.slice(0, -1);   // Περιστέρι / Περιστεριού → περιστερ
    return w;
  }
  function words(s) { return norm(s).match(/[a-zα-ω0-9]+/g) || []; }

  /* arts: [{id,t,lat,f,ov,c}] — επιλέγει «είδη» και χτίζει λεξικό stem-κλειδιών */
  function build(arts) {
    var map = Object.create(null), bad = Object.create(null), stats = { names: 0, dropped: 0 };
    function add(name, id, main) {
      var ws = words(name).filter(function (w) { return !ART.test(w); });
      if (!ws.length) return;
      var st = ws.map(stem);
      if (ws.length === 1 && (st[0].length < 5 || STOPNAMES.test(ws[0]) || TAXON.test(ws[0]))) return;
      var key = st.join(' ');
      if (bad[key]) return;
      if (map[key] && map[key].id !== id) {
        if (map[key].main && !main) return;           // το κύριο όνομα υπερισχύει του συνωνύμου
        if (!map[key].main && main) { map[key] = { id: id, st: st, main: main }; return; }
        delete map[key]; bad[key] = 1; stats.dropped++; return;
      }
      if (!map[key]) stats.names++;
      map[key] = { id: id, st: st, main: main };
    }
    arts.forEach(function (a) {
      if (a.ov) return;
      var t = a.t || '';
      if (!/[α-ωά-ώ]/i.test(t) || /[:|\/\d]/.test(t)) return;
      if (!(a.lat || a.f)) return;
      var n = words(t).length;
      if (n > 4) return;
      add(t, a.id, true);
      t.split(/\s+(?:ή|η)\s+/i).forEach(function (p, i, all) { if (all.length > 1) add(p, a.id, false); });
      var m = t.match(/^(\S+)\s+(?:ο|η|το)\s+\S+$/i);       // «Σπίνος ο κοινός» → «Σπίνος»
      if (m) add(m[1], a.id, false);
    });
    var first = Object.create(null);
    Object.keys(map).forEach(function (k) {
      var e = map[k], h = e.st[0];
      (first[h] = first[h] || []).push(e);
    });
    Object.keys(first).forEach(function (h) { first[h].sort(function (a, b) { return b.st.length - a.st.length; }); });
    return { first: first, stats: stats };
  }

  /* text → [{s,e,id}] (πρώτη εμφάνιση κάθε είδους, χωρίς το ίδιο το άρθρο) */
  function find(dict, text, selfId, seen, limit) {
    var re = /[A-Za-zΑ-Ωα-ωΆ-ώ]+/g, m, toks = [];
    while ((m = re.exec(text))) toks.push({ s: m.index, e: m.index + m[0].length, n: norm(m[0]) });
    var out = [];
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], cs = dict.first[stem(t.n)];
      if (!cs) continue;
      for (var c = 0; c < cs.length; c++) {
        var e = cs[c], ok = true, last = i;
        for (var k = 0; k < e.st.length; k++) {
          var tk = toks[i + k];
          if (!tk || stem(tk.n) !== e.st[k] || (k && !/^[\s\-–]+$/.test(text.slice(toks[i + k - 1].e, tk.s)))) { ok = false; break; }
          last = i + k;
        }
        if (!ok) continue;
        if (e.id !== selfId && !seen[e.id] && (!limit || Object.keys(seen).length < limit)) {
          seen[e.id] = 1;
          out.push({ s: t.s, e: toks[last].e, id: e.id });
        }
        i = last;
        break;
      }
    }
    return out;
  }

  return { norm: norm, stem: stem, build: build, find: find };
});
