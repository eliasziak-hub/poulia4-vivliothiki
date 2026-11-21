/* POULIA4 · ζωγραφισμένα πορτρέτα πουλιών σε ελληνικό τοπίο (λειτουργούν πλήρως χωρίς σύνδεση).
   window.__p4Portrait(οικογένεια, επιστημονικό όνομα, id) → SVG 160×160 ως κείμενο. */
(function (w) {
  'use strict';
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function f1(n) { return Math.round(n * 10) / 10; }

  /* μορφές σώματος: b=[x,y,rx,ry] σώμα, h=[x,y,r] κεφάλι σε πλέγμα 120×90 */
  var CATS = {
    pass:   { b: [58, 54, 21, 15], h: [80, 41, 10], beak: 'cone', tail: [38, 58, 15], legs: 10 },
    small:  { sc: 1.38, b: [58, 56, 17, 12], h: [76, 45, 8.5], beak: 'thinS', tail: [40, 58, 12], legs: 8 },
    crow:   { b: [57, 52, 25, 17], h: [83, 38, 11.5], beak: 'big', tail: [30, 60, 20], legs: 12 },
    shrike: { b: [58, 54, 21, 14], h: [80, 41, 10], beak: 'hookS', tail: [34, 62, 17], legs: 10 },
    swallow:{ sc: 1.2, b: [58, 54, 18, 11], h: [76, 45, 8.5], beak: 'tiny', tail: [30, 66, 11], legs: 6, fork: 1 },
    swift:  { b: [58, 50, 22, 9], h: [80, 46, 8], beak: 'tiny', legs: 0, sickle: 1 },
    cuckoo: { b: [57, 54, 22, 12], h: [80, 42, 9], beak: 'cone', tail: [26, 70, 12], legs: 8 },
    raptor: { b: [58, 50, 24, 19], h: [82, 35, 11], beak: 'hook', tail: [34, 60, 19], legs: 10, wing: 1 },
    owl:    { b: [60, 52, 20, 26], h: [60, 27, 16], beak: 'owl', tail: [58, 78, 8], legs: 6, ears: 1 },
    duck:   { b: [56, 56, 28, 16], h: [88, 36, 10], beak: 'flat', tail: [26, 54, 11], legs: 0, water: 1, neck: 1 },
    swan:   { b: [52, 58, 28, 17], h: [92, 22, 8], beak: 'flat', tail: [24, 54, 12], legs: 0, water: 1, neck: 3 },
    fowl:   { b: [56, 54, 26, 19], h: [82, 35, 9], beak: 'cone', tail: [30, 50, 15], legs: 13 },
    bustard:{ b: [54, 50, 26, 17], h: [86, 25, 8], beak: 'cone', neck: 2, tail: [28, 54, 11], legs: 22 },
    pigeon: { b: [58, 55, 24, 17], h: [82, 41, 9], beak: 'cone', tail: [34, 59, 15], legs: 10 },
    wader:  { sc: 1.12, b: [56, 48, 19, 12], h: [80, 34, 8], beak: 'thin', tail: [38, 50, 9], legs: 23 },
    stilt:  { b: [54, 46, 20, 13], h: [84, 20, 8], beak: 'long', neck: 2, tail: [34, 48, 8], legs: 25 },
    sea:    { b: [56, 50, 24, 13], h: [84, 40, 8], beak: 'hook', tail: [30, 52, 10], wing: 3, legs: 0 },
    gull:   { b: [56, 52, 23, 13], h: [80, 39, 9], beak: 'gull', tail: [30, 56, 10], wing: 3, legs: 9 },
    cormo:  { b: [56, 54, 21, 16], h: [78, 28, 7.5], beak: 'hook', neck: 2, tail: [32, 66, 11], legs: 6 },
    wood:   { b: [50, 52, 17, 20], h: [66, 31, 10], beak: 'long', tail: [42, 78, 8], legs: 6 },
    king:   { b: [58, 52, 18, 17], h: [78, 38, 13], beak: 'long', tail: [40, 58, 10], legs: 8 }
  };

  /* οικογένεια → [μορφή, βιότοπος, παλέτες…]. Παλέτα: body,wing,belly,acc,σήματα
     σήματα: h:#χρώμα κεφάλι · b:#χρώμα στήθος/λαιμός · m μάσκα · s στίγματα · c λοφίο · w φτερούγισμα-μπάρα · k σκούρο καπέλο · e ραβδώσεις */
  var P = function (b, wg, bl, ac, mk) { return [b, wg, bl, ac, mk || '']; };
  var BROWN = P('#8a6a46', '#5b4630', '#eadfc6', '#c6892f');
  var WARB = P('#8c8454', '#645e38', '#ece4c4', '#7a6a4c');
  var FAM = {
    Muscicapidae: ['small', 'olive', P('#8a6a46', '#5b4630', '#eadfc6', '#2a2a2a', 'b:#df7230'), P('#d3bf9a', '#2b2b2b', '#f1e8d6', '#2a2a2a', 'm'), P('#5a626c', '#2f343b', '#d9622c', '#1c1c1c', 'm'), P('#7b6c58', '#55493d', '#ece3d2', '#2a2a2a')],
    Turdidae: ['pass', 'olive', P('#8c6b47', '#5d4630', '#efe2c9', '#d3a03a', 's'), P('#24262a', '#17181b', '#2d3035', '#f0a21f'), P('#7f7a84', '#4f4a55', '#e9dfcc', '#d3a03a', 's')],
    Sylviidae: ['small', 'olive', P('#8a8e92', '#5f6468', '#e6e6e0', '#3b3b3b', 'k'), P('#8f8660', '#5e5538', '#efe6c6', '#6a5a40')],
    Acrocephalidae: ['small', 'wet', WARB, P('#a98e5d', '#6f5a38', '#efe3bf', '#7a6a4c', 'e')],
    Phylloscopidae: ['small', 'olive', P('#8e9455', '#667035', '#efeab8', '#7a6a4c', 'e'), P('#a09468', '#6d6240', '#efe6c6', '#6a5a40')],
    Locustellidae: ['small', 'wet', P('#8a7650', '#5f4f34', '#e8dcc0', '#7a6a4c', 's')],
    Cettiidae: ['small', 'wet', P('#8f6d48', '#5f4630', '#e3d5bb', '#6a5a40')],
    Fringillidae: ['pass', 'olive', P('#8a7d6a', '#5a5046', '#d9b2a2', '#cfc8b8', 'h:#7d93a8;w'), P('#a98a5a', '#2c2c2c', '#f4efe2', '#f0d3b0', 'h:#d7433a;w'), P('#8fa043', '#4e6122', '#c9d57a', '#e4c8a8')],
    Alaudidae: ['pass', 'field', P('#a88a62', '#6f5a3b', '#eadfc4', '#c5a97a', 'c;s'), P('#b79a6c', '#7a643f', '#f0e5cb', '#c5a97a', 'c')],
    Motacillidae: ['small', 'field', P('#8a9446', '#5b6a2a', '#f2d13a', '#2a2a2a'), P('#8d959a', '#3e444a', '#f4f4f1', '#2a2a2a', 'k'), P('#a58b62', '#6f5a3b', '#eee2c8', '#c5a97a', 's')],
    Emberizidae: ['pass', 'field', P('#9a7448', '#5f4328', '#e6c04a', '#e8c9a0', 'h:#c9b060;s')],
    Calcariidae: ['pass', 'rock', P('#f4f1ea', '#2c2c2c', '#ffffff', '#e6b23a', 'h:#f4f1ea')],
    Corvidae: ['crow', 'field', P('#2a2d33', '#16181c', '#3b4048', '#1b1b1b'), P('#8d9298', '#1b1d20', '#a4a8ad', '#1b1b1b', 'h:#1c1c1c'), P('#b98a78', '#2f6fb5', '#d9b7a8', '#262626'), P('#1d1f23', '#3a63a5', '#f6f6f2', '#1b1b1b')],
    Laniidae: ['shrike', 'olive', P('#a0663f', '#3a3a3a', '#f1e6d6', '#262626', 'm;h:#8a5130'), P('#8d9298', '#2a2a2a', '#f1ebe0', '#262626', 'm')],
    Passeridae: ['pass', 'olive', P('#a0805a', '#5c4430', '#d9d0bd', '#6a5a40', 'h:#8c8c8c;b:#262626'), P('#9a7a52', '#5a4228', '#e3d6bc', '#6a5a40', 'h:#9a4f2b')],
    Paridae: ['small', 'olive', P('#72973a', '#5a86c2', '#f0d34a', '#2a2a2a', 'h:#5b86c4'), P('#6f8d3c', '#4f6130', '#e8cf3a', '#2a2a2a', 'h:#1c1c1c;e'), P('#8a8e92', '#5d6368', '#e9e5d9', '#2a2a2a', 'h:#1c1c1c')],
    Hirundidae: ['swallow', 'sky', P('#1f3b6b', '#14274a', '#ead2b0', '#2a2a2a', 'b:#b53a2e')],
    Apodidae: ['swift', 'sky', P('#3a3631', '#27231f', '#4a453f', '#2a2a2a')],
    Sittidae: ['small', 'rock', P('#7089a3', '#4e647a', '#e2b88a', '#2a2a2a', 'e')],
    Certhiidae: ['small', 'olive', P('#8a7048', '#5a4630', '#f1ebe0', '#5a4a38', 's')],
    Tichodromidae: ['small', 'rock', P('#8f969c', '#c2362d', '#4a4f55', '#2a2a2a', 'w')],
    Prunellidae: ['small', 'rock', P('#8a7a68', '#5a4a3c', '#9aa0a6', '#c6892f', 's')],
    Regulidae: ['small', 'olive', P('#8e9a50', '#5e6a30', '#e9e7c8', '#3a3a3a', 'k;c')],
    Troglodytidae: ['small', 'olive', P('#8a6a46', '#5b4630', '#cfb58f', '#5a4a38', 'e')],
    Cinclidae: ['small', 'wet', P('#4a3a32', '#2e2420', '#f6f3ec', '#2a2a2a', 'b:#f6f3ec')],
    Aegithalidae: ['small', 'olive', P('#6f6a70', '#2e2c30', '#f1d9d4', '#2a2a2a', 'h:#f4efea')],
    Remizidae: ['small', 'wet', P('#b08a52', '#6a4c2a', '#e6d9bf', '#2a2a2a', 'h:#a9a9a6')],
    Panuridae: ['small', 'wet', P('#c2884a', '#7a4f2a', '#e8cba0', '#e0a02a', 'h:#9aa5ad')],
    Oriolidae: ['pass', 'olive', P('#f2c230', '#1f1f1f', '#f7d65a', '#d3452e', 'm')],
    Sturnidae: ['pass', 'field', P('#2d3b4a', '#1c2530', '#3a4b5d', '#e6b23a', 's')],
    Accipitridae: ['raptor', 'rock', P('#6b4f33', '#3f2e1d', '#c9a77a', '#e0b72a'), P('#b9a07c', '#6a5440', '#d9c9a8', '#8a8a82', 'h:#e8e0cf'), P('#9aa4ad', '#4a5058', '#f2f2ef', '#e0b72a'), P('#8a6a4b', '#54402c', '#e8dcc6', '#e0b72a', 's')],
    Falconidae: ['raptor', 'field', P('#b8633a', '#5d4636', '#ead7b5', '#e0b72a', 'h:#8a9aa6;s'), P('#5d6b78', '#323c46', '#ece6da', '#e0b72a', 'm;e')],
    Pandionidae: ['raptor', 'sea', P('#4f3f33', '#2e241c', '#f6f3ec', '#8a8a82', 'h:#f6f3ec;m')],
    Strigidae: ['owl', 'rock', P('#8a7a62', '#5a4c3a', '#e2d6bd', '#e0a82a', 's'), P('#9a8668', '#6a563e', '#efe6cf', '#e0a82a')],
    Tytonidae: ['owl', 'olive', P('#d9ac6a', '#b98a52', '#f5efe6', '#d9b88a', 's')],
    Caprimulgidae: ['owl', 'field', P('#8a7a62', '#5a4c3a', '#c9b99a', '#3a3a3a', 's')],
    Phasianidae: ['fowl', 'rock', P('#9a8a6a', '#6a5a40', '#d8c9a8', '#d8372c', 'b:#f4f1e8;m'), P('#a89270', '#6f5a3a', '#e8dcc0', '#8a6a46', 's'), P('#7b4a2a', '#4c2b17', '#a9693a', '#d8372c', 'h:#2f6f55')],
    Columbidae: ['pigeon', 'olive', P('#8c98a3', '#5d6a76', '#b8bec6', '#d8372c', 'b:#f4f1e8'), P('#b98a64', '#6a4a30', '#d9b9a6', '#262626', 'e'), P('#cdb799', '#8a7458', '#e3d5bf', '#262626')],
    Pteroclidae: ['pigeon', 'field', P('#b9a07a', '#6f5a3c', '#e8dcc0', '#8a6a46', 's')],
    Cuculidae: ['cuckoo', 'olive', P('#7f8a95', '#4a5560', '#ece6da', '#e0b72a', 'e')],
    Alcedinidae: ['king', 'wet', P('#2d7fc4', '#1d5fa0', '#e8892f', '#262626', 'h:#2d9fc4')],
    Meropidae: ['king', 'olive', P('#3f9a7a', '#2f7f9a', '#59b4a0', '#2a2a2a', 'b:#f0c63a;h:#a85a2b')],
    Coraciidae: ['king', 'olive', P('#35a0b8', '#2b5aa0', '#6fc3c9', '#2a2a2a')],
    Upupidae: ['wood', 'olive', P('#d99a5c', '#2a2a2a', '#e9c294', '#3a3a3a', 'c;w')],
    Picidae: ['wood', 'olive', P('#232323', '#161616', '#efeee9', '#3a3a3a', 'h:#c8302a;w'), P('#6e9a3a', '#4a6a24', '#c9d489', '#3a3a3a', 'h:#c8302a')],
    Ardeidae: ['stilt', 'wet', P('#8f9aa5', '#5d6874', '#e9edf0', '#e0b72a', 'h:#f4f4f4'), P('#f7f7f4', '#e6e6e0', '#ffffff', '#e0b72a'), P('#7b5a6b', '#4a3a44', '#c9a58f', '#e0b72a')],
    Ciconiidae: ['stilt', 'field', P('#f6f6f2', '#1f1f1f', '#ffffff', '#d8372c')],
    Threskiornithidae: ['stilt', 'wet', P('#4b3a35', '#2c3a3f', '#5a463f', '#8a7a68'), P('#f6f6f2', '#e6e6e0', '#ffffff', '#e0b72a')],
    Pelecanidae: ['stilt', 'wet', P('#f1eee8', '#cfcac0', '#ffffff', '#f0b86a')],
    Phoenicopteridae: ['stilt', 'wet', P('#f4a8b8', '#e0457b', '#f9cdd6', '#e0457b')],
    Gruidae: ['stilt', 'field', P('#a3adb5', '#6a747c', '#c3cad0', '#d8372c', 'h:#1c1c1c')],
    Rallidae: ['fowl', 'wet', P('#2a2f35', '#1b1e22', '#383d43', '#d8372c'), P('#7a6a52', '#4a3f30', '#8f9aa5', '#d8372c')],
    Podicipedidae: ['duck', 'wet', P('#5b5046', '#3a322a', '#f1ebe0', '#2a2a2a', 'h:#8a4a2a'), P('#4a4a46', '#2e2e2a', '#f4f2ea', '#e0b72a', 'c')],
    Gaviidae: ['duck', 'sea', P('#2d3a46', '#1b242c', '#f1f4f4', '#2a2a2a', 'h:#667583;s')],
    Phalacrocoracidae: ['cormo', 'sea', P('#26303a', '#17202a', '#35424e', '#c9a030', 's')],
    Sulidae: ['sea', 'sea', P('#f6f6f2', '#2a2a2a', '#ffffff', '#8a98a2', 'h:#f0d98a')],
    Procellariidae: ['sea', 'sea', P('#3a4750', '#242f37', '#f1f4f4', '#6a7a86')],
    Hydrobatidae: ['small', 'sea', P('#2c333a', '#1b2127', '#3a434b', '#1f1f1f', 'w')],
    Stercorariidae: ['gull', 'sea', P('#4a3f36', '#2e251d', '#6a5e52', '#2a2a2a')],
    Laridae: ['gull', 'sea', P('#f4f6f7', '#9aa6b0', '#ffffff', '#e6a53a'), P('#f4f6f7', '#7b8995', '#ffffff', '#d8372c', 'k'), P('#eef1f3', '#aab4bc', '#ffffff', '#262626', 'h:#2a2a2a')],
    Alcidae: ['gull', 'sea', P('#262a30', '#16181c', '#f6f6f2', '#d88a2f')],
    Scolopacidae: ['wader', 'wet', P('#8a7355', '#5b4a36', '#efe6d4', '#d98a2b', 's'), P('#9a9084', '#5e564c', '#f1ece2', '#3a3a3a'), P('#b08a5a', '#6a4a2a', '#e8cf9f', '#3a3a3a', 'e')],
    Charadriidae: ['wader', 'sea', P('#b49a76', '#7a6444', '#f6f3ec', '#e0782a', 'b:#262626;m'), P('#9a8a70', '#6a5a40', '#f1ece2', '#3a3a3a', 'm')],
    Recurvirostridae: ['stilt', 'wet', P('#f6f6f2', '#1f1f1f', '#ffffff', '#262626', 'h:#f6f6f2;k')],
    Haematopodidae: ['wader', 'sea', P('#1f2124', '#14161a', '#f6f6f2', '#e8441f')],
    Burhinidae: ['wader', 'field', P('#b9a17a', '#6a563c', '#efe6d0', '#e0b72a', 's;e')],
    Glareolidae: ['wader', 'field', P('#a89270', '#3a3028', '#f1e4c8', '#262626', 'b:#e8c27a')],
    Otididae: ['bustard', 'field', P('#b8905a', '#6f5636', '#f2ebdc', '#8a6a46', 's;h:#9aa5ad')],
    Pteroclididae: ['pigeon', 'field', P('#b9a07a', '#6f5a3c', '#e8dcc0', '#8a6a46')],
    Anatidae: ['duck', 'wet', P('#8d7a5e', '#5d5342', '#e3dccb', '#e0a02a', 'h:#2f7d4f'), P('#9c8b74', '#6b5d4a', '#ddd2bd', '#e0a02a', 's'), P('#6b7f8c', '#46555f', '#d8dfe2', '#d4a037', 'h:#8a4a2a')],
    Cygnidae: ['swan', 'wet', P('#f1f3f5', '#d8dde1', '#ffffff', '#e8863a')]
  };
  var DEF = ['pass', 'olive', P('#8a6a46', '#5b4630', '#eadfc6', '#c6892f')];

  /* παραλλαγή: αν οικογένεια Anatidae και όνομα Cygnus/Anser → κύκνος/χήνα */
  function pickSpec(fam, sci) {
    var f = FAM[fam] || DEF, cat = f[0], hab = f[1], pals = f.slice(2);
    var h = hash(sci);
    var pal = pals[h % pals.length];
    var g = String(sci).split(' ')[0];
    if (fam === 'Anatidae') {
      if (g === 'Cygnus') { cat = 'swan'; pal = P('#f1f3f5', '#d8dde1', '#ffffff', '#e8863a'); }
      else if (g === 'Anser' || g === 'Branta') { pal = P('#9a8d7a', '#6a5e4c', '#e0d8c8', '#e8863a', 'h:#cfc6b6'); }
      else if (g === 'Tadorna') { pal = P('#f4efe6', '#8a4a2a', '#f8f5ee', '#d8372c', 'h:#1f5a4a'); }
    }
    if (fam === 'Laridae' && /^(Sterna|Thalasseus|Chlidonias|Gelochelidon|Hydroprogne)$/.test(g)) { cat = 'gull'; pal = P('#f4f6f7', '#a9b4bc', '#ffffff', '#e8441f', 'k'); }
    if (fam === 'Corvidae' && g === 'Pica') pal = P('#1d1f23', '#2f6aa8', '#f6f6f2', '#1b1b1b');
    if (fam === 'Scolopacidae' && /^(Numenius|Limosa)$/.test(g)) { cat = 'stilt'; }
    if (fam === 'Accipitridae' && /^(Gyps|Aegypius|Neophron|Gypaetus)$/.test(g)) pal = P(g === 'Neophron' ? '#f3efe4' : '#b39a76', g === 'Neophron' ? '#2a2a2a' : '#6a5440', '#d9c9a8', '#d9b84a', 'h:' + (g === 'Neophron' ? '#e8c43a' : '#e6dfd0'));
    return { cat: CATS[cat] || CATS.pass, catName: cat, hab: hab, pal: pal, h: h };
  }

  function mk(pal) {
    var o = {}; String(pal[4] || '').split(';').forEach(function (t) { if (!t) return; var i = t.indexOf(':'); if (i > 0) o[t.slice(0, i)] = t.slice(i + 1); else o[t] = 1; }); return o;
  }

  /* ---------- φόντο: ελληνικό τοπίο ---------- */
  function sky(id, a, b) { return '<defs><linearGradient id="' + id + 'k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient></defs><rect width="160" height="160" fill="url(#' + id + 'k)"/>'; }
  function village(x, y, s) {
    var g = '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">';
    g += '<rect x="0" y="6" width="14" height="10" fill="#fbfaf6"/><rect x="14" y="10" width="11" height="6" fill="#f1efe8"/><rect x="-10" y="9" width="10" height="7" fill="#f6f4ee"/>';
    g += '<path d="M2 6a5 5 0 0 1 10 0z" fill="#2a74c4"/><rect x="6.5" y="0" width="1" height="2" fill="#2a74c4"/><rect x="3" y="9" width="2.4" height="3.6" fill="#2a74c4"/><rect x="17" y="12" width="2.2" height="2.8" fill="#2a74c4"/></g>';
    return g;
  }
  function cypress(x, y, s, c) { return '<path d="M' + x + ' ' + y + 'q-' + 4 * s + '-' + 16 * s + ' 0-' + 34 * s + 'q' + 4 * s + ' ' + 18 * s + ' 0 ' + 34 * s + 'z" fill="' + (c || '#2f5a40') + '"/>'; }
  function olive(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-2 0q-3-10 1-16q-3-3-6-2q5 0 6 2q3 4 4 16z" fill="#6a5640"/><path d="M-3 -4q-6-4-8-10" stroke="#6a5640" stroke-width="2.4" fill="none"/>'
      + '<ellipse cx="-9" cy="-24" rx="13" ry="8" fill="#8fa27a"/><ellipse cx="7" cy="-26" rx="14" ry="9" fill="#a3b58d"/><ellipse cx="-1" cy="-32" rx="12" ry="7" fill="#7f9569"/><ellipse cx="-14" cy="-18" rx="8" ry="5" fill="#a3b58d" opacity=".8"/></g>';
  }
  function pine(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 0q1-14-2-26" stroke="#6a4c36" stroke-width="2.2" fill="none"/><ellipse cx="-1" cy="-28" rx="16" ry="5" fill="#4f7a52"/><ellipse cx="9" cy="-23" rx="9" ry="3.4" fill="#5f8a5c"/></g>'; }

  function scene(id, hab, h, water) {
    var v = h >>> 7, sx = 24 + v % 90, g = '';
    var skys = [['#9fd4ef', '#e6f6fb'], ['#a9d6ec', '#f3f9f4'], ['#b8dcee', '#fbf4e2'], ['#9ccbe8', '#e9f3f6']][(h >>> 3) % 4];
    if (hab === 'sea') {
      g += sky(id, skys[0], skys[1]);
      g += '<circle cx="' + sx + '" cy="26" r="9" fill="#fff6d0" opacity=".92"/>';
      g += '<path d="M60 92q20-26 46-4q12-8 30 0l24 4v8H60z" fill="#b9c9b0"/><path d="M80 92q16-14 34-2l30 4v6H80z" fill="#a7bb9c"/>';
      g += village(112, 76, .9) + village(94, 82, .6);
      g += '<rect y="96" width="160" height="64" fill="#1d78b8"/><rect y="96" width="160" height="30" fill="#3fa6d8" opacity=".55"/>';
      g += '<path d="M0 108q10-4 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0" stroke="#d8f0fa" stroke-width="1.2" fill="none" opacity=".7"/><path d="M0 122q10-4 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0" stroke="#c4e6f5" stroke-width="1.2" fill="none" opacity=".6"/>';
      if (!water) g += '<path d="M-6 160q20-34 70-32q58 2 108 32z" fill="#cfc6b2"/><path d="M-6 160q30-22 80-22q50 0 92 22z" fill="#b9b09b"/>';
    } else if (hab === 'wet') {
      g += sky(id, skys[0], '#f7efe0');
      g += '<circle cx="' + sx + '" cy="28" r="8" fill="#fff0c0" opacity=".9"/>';
      g += '<path d="M0 84q30-22 62-6q34 14 98-10v40H0z" fill="#9fb4a0"/><path d="M0 92q40-12 80-2t80 0v30H0z" fill="#b9c4a6"/>';
      g += '<rect y="100" width="160" height="60" fill="#5d9fb0"/><rect y="100" width="160" height="22" fill="#9bd0d8" opacity=".5"/>';
      g += '<path d="M10 118q8-3 16 0t16 0M90 128q8-3 16 0t16 0M40 142q8-3 16 0" stroke="#e4f5f7" stroke-width="1.2" fill="none" opacity=".7"/>';
      g += '<g stroke="#7c8a45" stroke-width="2" fill="none" stroke-linecap="round"><path d="M6 100q2-26 -2-40M14 100q0-20 5-34M148 100q0-26 6-42M140 100q-1-18-6-30"/></g><g fill="#6a4a2a"><ellipse cx="3.5" cy="62" rx="2" ry="5"/><ellipse cx="19.5" cy="68" rx="2" ry="5"/><ellipse cx="154" cy="60" rx="2" ry="5"/></g>';
    } else if (hab === 'olive') {
      g += sky(id, skys[0], '#f6f1de');
      g += '<circle cx="' + sx + '" cy="26" r="9" fill="#fff2c8" opacity=".92"/>';
      g += '<path d="M0 84q30-18 66-6q40 12 94-8v50H0z" fill="#b7a478"/><path d="M0 96q40-14 80-4t80-4v40H0z" fill="#c9b887"/>';
      g += cypress(18, 96, 1, '#3d6048') + olive(40, 104, .9) + olive(126, 102, 1.1) + cypress(148, 100, .8, '#3d6048');
      g += '<path d="M-6 160V118q40-12 86-4t86-6v52z" fill="#c8b685"/><path d="M0 160V132q50-10 100-4t60-6v38z" fill="#b8a371"/>';
      g += '<g fill="#fff" opacity=".9"><circle cx="20" cy="138" r="1.6"/><circle cx="46" cy="146" r="1.4"/><circle cx="130" cy="140" r="1.6"/></g><g fill="#d65a3a"><circle cx="30" cy="144" r="1.6"/><circle cx="140" cy="150" r="1.6"/></g>';
    } else if (hab === 'rock') {
      g += sky(id, skys[0], '#f3efe6');
      g += '<circle cx="' + sx + '" cy="26" r="8" fill="#fff4cc" opacity=".9"/>';
      g += '<path d="M0 100L22 56l16 20 20-34 24 40 18-24 20 26 12-12 28 28v30H0z" fill="#a9a597"/><path d="M0 112L26 76l14 16 22-26 26 38 20-20 52 36v40H0z" fill="#c4bfae"/>';
      g += cypress(20, 124, 1.1, '#3d6048') + cypress(30, 126, .8, '#456a50');
      g += '<path d="M-6 160V128q30-14 66-8t106-4v44z" fill="#d6d0bd"/><path d="M0 160V142q50-12 90-6t70-4v28z" fill="#bcb6a2"/><g fill="#9b9484"><ellipse cx="136" cy="148" rx="9" ry="4"/><ellipse cx="22" cy="152" rx="7" ry="3"/></g>';
    } else if (hab === 'field') {
      g += sky(id, skys[0], '#fbf3dc');
      g += '<circle cx="' + sx + '" cy="26" r="9" fill="#fff0c0" opacity=".92"/>';
      g += '<path d="M0 90q30-20 64-8q40 14 96-10v50H0z" fill="#a8b88c"/><path d="M0 100q50-14 90-4t70-2v36H0z" fill="#d8c47a"/>';
      g += village(24, 78, .7) + cypress(146, 96, .7, '#3d6048');
      g += '<path d="M0 160V122q50-10 96-2t64-4v44z" fill="#cdb85f"/><path d="M0 160V138q50-8 100-2t60-4v28z" fill="#86a550"/>';
      g += '<g fill="#d8372c"><circle cx="14" cy="140" r="2"/><circle cx="34" cy="150" r="1.8"/><circle cx="122" cy="144" r="2"/><circle cx="146" cy="152" r="1.8"/></g><g fill="#fff"><circle cx="52" cy="146" r="1.5"/><circle cx="108" cy="152" r="1.4"/></g>';
    } else if (hab === 'sky') {
      g += sky(id, '#7fc0e6', '#eaf6fa');
      g += '<circle cx="' + sx + '" cy="30" r="10" fill="#fff6d0" opacity=".95"/><g fill="#fff" opacity=".85"><ellipse cx="38" cy="46" rx="18" ry="5"/><ellipse cx="52" cy="42" rx="12" ry="5"/><ellipse cx="118" cy="62" rx="16" ry="4"/></g>';
      g += '<path d="M0 122q34-26 70-14q40 12 90-12v64H0z" fill="#b9c79c"/>' + village(112, 104, .8) + '<path d="M0 160V132q50-10 96-2t64-4v34z" fill="#cdbb7a"/>';
    } else { /* olive-wood: πεύκα */
      g += sky(id, skys[0], '#f1f2de');
      g += '<circle cx="' + sx + '" cy="26" r="9" fill="#fff2c8" opacity=".9"/><path d="M0 92q40-16 80-6t80-6v50H0z" fill="#8fae88"/>';
      g += pine(20, 104, 1.1) + pine(132, 100, 1.2) + pine(150, 110, .8);
      g += '<path d="M0 160V124q50-10 100-2t60-4v46z" fill="#9bb77b"/><path d="M0 160V140q50-8 100-2t60-4v26z" fill="#7d9a5f"/>';
    }
    return g;
  }

  /* ---------- πουλί ---------- */
  function bird(id, c, pal, hash0) {
    var cat = c, M = mk(pal), body = pal[0], wing = pal[1], belly = pal[2], acc = pal[3];
    var bx = cat.b[0], by = cat.b[1], rx = cat.b[2], ry = cat.b[3], hx = cat.h[0], hy = cat.h[1], hr = cat.h[2], g = '';
    var headC = M.h || body, bibC = M.b;
    /* σκιά */
    g += '<ellipse cx="' + (bx + 4) + '" cy="' + (by + ry + (cat.legs || 0) + 3) + '" rx="' + (rx * .9) + '" ry="3.2" fill="#000" opacity=".16"/>';
    if (cat.legs) { var ly = by + ry - 3; g += '<g stroke="' + (cat.legs > 18 ? acc : '#6a5a48') + '" stroke-width="' + (cat.legs > 18 ? 1.8 : 2.2) + '" stroke-linecap="round" fill="none"><path d="M' + (bx - 4) + ' ' + ly + 'v' + cat.legs + 'l-5 2"/><path d="M' + (bx + 5) + ' ' + ly + 'v' + cat.legs + 'l5 2"/></g>'; }
    if (cat.tail) { var tx = cat.tail[0], ty = cat.tail[1]; if (cat.fork) g += '<path d="M' + (bx - rx + 6) + ' ' + (by - 3) + ' L' + (tx - 4) + ' ' + (ty - 8) + ' L' + (tx + 8) + ' ' + (ty - 1) + ' L' + (tx - 4) + ' ' + (ty + 9) + ' L' + (bx - rx + 8) + ' ' + (by + 7) + 'z" fill="' + wing + '"/>'; else g += '<path d="M' + (bx - rx + 6) + ' ' + (by - 3) + ' L' + tx + ' ' + ty + ' L' + (bx - rx + 8) + ' ' + (by + 7) + 'z" fill="' + wing + '"/>'; }
    if (cat.neck) { var nw = cat.neck === 2 ? 6.5 : cat.neck === 3 ? 6 : 9; var ctrl = cat.neck === 3 ? 'C' + (bx + rx + 6) + ' ' + (by - 2) + ' ' + (hx - 12) + ' ' + (hy + 18) + ' ' + hx + ' ' + hy : 'Q' + (hx - 6) + ' ' + (by - 4) + ' ' + hx + ' ' + hy; g += '<path d="M' + (bx + rx - 8) + ' ' + (by - 4) + ' ' + ctrl + '" stroke="' + headC + '" stroke-width="' + nw + '" fill="none" stroke-linecap="round"/>'; }
    if (cat.sickle) {
      g += '<path d="M' + (bx - 30) + ' ' + (by - 2) + ' Q' + (bx - 4) + ' ' + (by - 22) + ' ' + (bx + 28) + ' ' + (by - 24) + ' Q' + (bx + 4) + ' ' + (by - 12) + ' ' + (bx - 22) + ' ' + (by + 5) + 'z" fill="' + wing + '"/>';
      g += '<path d="M' + (bx - 24) + ' ' + (by + 4) + ' L' + (bx - 46) + ' ' + (by + 16) + ' L' + (bx - 30) + ' ' + (by + 8) + ' L' + (bx - 40) + ' ' + (by + 22) + ' L' + (bx - 20) + ' ' + (by + 8) + 'z" fill="' + wing + '"/>';
    }
    g += '<ellipse cx="' + bx + '" cy="' + by + '" rx="' + rx + '" ry="' + ry + '" fill="' + body + '"/>';
    g += '<ellipse cx="' + f1(bx + rx * .18) + '" cy="' + f1(by + ry * .38) + '" rx="' + f1(rx * .62) + '" ry="' + f1(ry * .52) + '" fill="' + belly + '" opacity=".92"/>';
    if (bibC) g += '<ellipse cx="' + f1(bx + rx * .55) + '" cy="' + f1(by - ry * .05) + '" rx="' + f1(rx * .3) + '" ry="' + f1(ry * .55) + '" fill="' + bibC + '" opacity=".95"/>';
    if (M.s) { g += '<g fill="' + wing + '" opacity=".7">'; for (var i = 0; i < 7; i++) g += '<circle cx="' + f1(bx - rx * .1 + (i % 4) * 5.2) + '" cy="' + f1(by + ry * .1 + (i / 4 | 0) * 5) + '" r="1.15"/>'; g += '</g>'; }
    /* φτερό */
    g += '<path d="M' + f1(bx - rx * .55) + ' ' + f1(by - ry * .2) + ' Q' + f1(bx - rx * .05) + ' ' + f1(by - ry * 1.0) + ' ' + f1(bx + rx * .5) + ' ' + f1(by - ry * .1) + ' Q' + bx + ' ' + f1(by + ry * .45) + ' ' + f1(bx - rx * .55) + ' ' + f1(by - ry * .2) + 'z" fill="' + wing + '"/>';
    g += '<path d="M' + f1(bx - rx * .35) + ' ' + f1(by - ry * .1) + ' q' + f1(rx * .3) + ' ' + f1(-ry * .45) + ' ' + f1(rx * .75) + ' ' + f1(-ry * .1) + '" stroke="#fff" stroke-opacity=".18" stroke-width="1.2" fill="none"/>';
    if (M.w) g += '<path d="M' + f1(bx - rx * .25) + ' ' + f1(by - ry * .45) + ' q' + f1(rx * .3) + ' -2 ' + f1(rx * .65) + ' ' + f1(ry * .15) + '" stroke="#f4efe2" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    if (cat.wing === 3) g += '<path d="M' + (bx - 6) + ' ' + (by - 4) + ' Q' + (bx + 6) + ' ' + (by - 30) + ' ' + (bx + 26) + ' ' + (by - 26) + ' Q' + (bx + 10) + ' ' + (by - 12) + ' ' + (bx + 8) + ' ' + (by - 2) + 'z" fill="' + wing + '" opacity=".9"/>';
    if (cat.wing === 1) g += '<path d="M' + (bx - 22) + ' ' + (by + 6) + ' l-9 6 M' + (bx - 16) + ' ' + (by + 9) + ' l-9 6" stroke="' + wing + '" stroke-width="2.4" stroke-linecap="round"/>';
    /* κεφάλι */
    g += '<circle cx="' + hx + '" cy="' + hy + '" r="' + hr + '" fill="' + headC + '"/>';
    if (M.k) g += '<path d="M' + f1(hx - hr) + ' ' + hy + ' a' + hr + ' ' + hr + ' 0 0 1 ' + f1(hr * 2) + ' 0z" fill="#1c1c1c" opacity=".92"/>';
    if (M.c) g += '<path d="M' + f1(hx - hr * .9) + ' ' + f1(hy - hr * .5) + ' l-7 -8 l9 1 l-3-8 l8 6 l4-6 l1 9z" fill="' + (headC !== body ? headC : wing) + '"/>';
    if (cat.ears) g += '<path d="M' + f1(hx - hr * .8) + ' ' + f1(hy - hr * .4) + ' l-2-9 7 5zM' + f1(hx + hr * .8) + ' ' + f1(hy - hr * .4) + ' l2-9-7 5z" fill="' + body + '"/>';
    if (M.m) g += '<path d="M' + f1(hx - hr * .3) + ' ' + f1(hy - hr * .35) + ' h' + f1(hr * 1.3) + ' v' + f1(hr * .55) + ' h' + f1(-hr * 1.1) + 'z" fill="#1c1c1c" opacity=".9"/>';
    if (M.e) g += '<path d="M' + f1(hx - hr * .2) + ' ' + f1(hy - hr * .5) + ' h' + f1(hr * 1.1) + '" stroke="#f4efe2" stroke-width="1.6" stroke-linecap="round"/>';
    if (cat.beak === 'owl') {
      g += '<circle cx="' + f1(hx - hr * .4) + '" cy="' + hy + '" r="' + f1(hr * .5) + '" fill="' + belly + '"/><circle cx="' + f1(hx + hr * .4) + '" cy="' + hy + '" r="' + f1(hr * .5) + '" fill="' + belly + '"/><path d="M' + hx + ' ' + (hy + 1) + ' l-2.5 5h5z" fill="#c9a24a"/><circle cx="' + f1(hx - hr * .4) + '" cy="' + hy + '" r="3" fill="#201a10"/><circle cx="' + f1(hx + hr * .4) + '" cy="' + hy + '" r="3" fill="#201a10"/><circle cx="' + f1(hx - hr * .4 + 1) + '" cy="' + (hy - 1) + '" r=".8" fill="#fff"/><circle cx="' + f1(hx + hr * .4 + 1) + '" cy="' + (hy - 1) + '" r=".8" fill="#fff"/>';
    } else {
      var bxp = hx + hr - 1, bk = '', B = cat.beak, bl = B === 'tiny' ? 5 : B === 'thinS' ? 8 : 0;
      if (B === 'cone') bk = 'M' + bxp + ' ' + (hy - 3) + ' L' + (bxp + 10) + ' ' + (hy + 1) + ' L' + bxp + ' ' + (hy + 4) + 'z';
      else if (B === 'big') bk = 'M' + bxp + ' ' + (hy - 5) + ' L' + (bxp + 14) + ' ' + (hy + 1) + ' L' + bxp + ' ' + (hy + 6) + 'z';
      else if (B === 'hook' || B === 'hookS') bk = 'M' + bxp + ' ' + (hy - 4) + ' Q' + (bxp + 12) + ' ' + (hy - 3) + ' ' + (bxp + 11) + ' ' + (hy + 8) + ' Q' + (bxp + 7) + ' ' + (hy + 2) + ' ' + bxp + ' ' + (hy + 4) + 'z';
      else if (B === 'gull') bk = 'M' + bxp + ' ' + (hy - 3) + ' L' + (bxp + 14) + ' ' + (hy + 1) + ' L' + (bxp + 12) + ' ' + (hy + 4) + ' L' + bxp + ' ' + (hy + 4) + 'z';
      else if (B === 'long') bk = 'M' + bxp + ' ' + (hy - 2) + ' L' + (bxp + 24) + ' ' + (hy + 1) + ' L' + bxp + ' ' + (hy + 3) + 'z';
      else if (B === 'thin') bk = 'M' + bxp + ' ' + (hy - 1) + ' L' + (bxp + 27) + ' ' + (hy + 3) + ' L' + bxp + ' ' + (hy + 2) + 'z';
      else if (B === 'flat') bk = 'M' + bxp + ' ' + (hy - 3) + ' Q' + (bxp + 14) + ' ' + (hy - 3) + ' ' + (bxp + 14) + ' ' + (hy + 2) + ' Q' + (bxp + 6) + ' ' + (hy + 5) + ' ' + bxp + ' ' + (hy + 4) + 'z';
      else bk = 'M' + bxp + ' ' + (hy - 2) + ' L' + (bxp + (bl || 9)) + ' ' + (hy + 1) + ' L' + bxp + ' ' + (hy + 2.5) + 'z';
      g += '<path d="' + bk + '" fill="' + acc + '"/><circle cx="' + f1(hx + hr * .25) + '" cy="' + f1(hy - hr * .2) + '" r="' + Math.max(1.6, f1(hr * .2)) + '" fill="#17120c"/><circle cx="' + f1(hx + hr * .3) + '" cy="' + f1(hy - hr * .27) + '" r=".6" fill="#fff"/>';
    }
    return g;
  }

  var cache = new Map();
  function portrait(fam, sci, id) {
    fam = String(fam || ''); sci = String(sci || id || '');
    var key = fam + '|' + sci; if (cache.has(key)) return cache.get(key);
    var sp = pickSpec(fam, sci), cat = sp.cat, uid = 'p' + (sp.h % 1e6).toString(36);
    var flip = (sp.h >>> 11) & 1, tilt = ((sp.h >>> 13) % 5) - 2;
    var s = '<svg class="p4art" viewBox="0 0 160 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + scene(uid, sp.hab, sp.h, cat.water);
    if (cat.water) s += '<path d="M0 126q10-4 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0v34H0z" fill="#2c86bd" opacity=".35"/>';
    var sc = 1.1 * (cat.sc || 1), tx = f1(78 - 60 * sc), ty = f1((sp.catName === 'swift' ? 70 : 100) - 60 * sc);
    s += '<g transform="' + (flip ? 'translate(160 0) scale(-1 1) ' : '') + 'translate(' + tx + ' ' + ty + ') scale(' + f1(sc) + ') rotate(' + tilt + ' 60 60)">' + bird(uid, cat, sp.pal, sp.h) + '</g>';
    if (cat.water) s += '<path d="M0 134q10-4 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0v26H0z" fill="#2c86bd" opacity=".55"/><path d="M0 142q10-4 20 0t20 0 20 0 20 0 20 0 20 0 20 0 20 0" stroke="#d8f0fa" stroke-width="1.2" fill="none" opacity=".6"/>';
    else if (sp.hab === 'field' || sp.hab === 'olive') s += '<g stroke="#6f8a3d" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".85"><path d="M12 160q1-10 -2-16M18 160q0-8 3-13M138 160q-1-10 3-17M146 160q0-7-3-12M70 160q-1-6 2-10"/></g>';
    s += '</svg>';
    cache.set(key, s); return s;
  }
  w.__p4Portrait = portrait;
  w.__p4PortraitFamilies = Object.keys(FAM);
})(window);
