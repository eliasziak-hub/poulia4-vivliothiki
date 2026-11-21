#!/usr/bin/env python3
"""POULIA4 · Βιβλιοθήκη Ορνιθολογίας — δημιουργία δεδομένων από το Blogger export (feed.atom).

Χρήση:
    python3 tools/make-library.py feed.atom public/data [--blog https://poulia4.blogspot.com] [--chunk 100]

Μόνο stdlib. Περιλαμβάνει ΜΟΝΟ δημοσιευμένα (LIVE) άρθρα· πρόχειρα, κάδος και σελίδες δεν μπαίνουν.
Εξαιρούνται άρθρα με ετικέτες Game / Εφαρμογές (σελίδες-φορείς εφαρμογών, όχι κείμενο προς ανάγνωση).
Παράγει: data/index.js (μεταδεδομένα, κεφάλαια, σχετικά άρθρα) και data/b0.json, b1.json … (καθαρό κείμενο).
"""
import sys, re, json, math, html, os, argparse, unicodedata, collections
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

NS = {'a': 'http://www.w3.org/2005/Atom', 'b': 'http://schemas.google.com/blogger/2018'}
GEO = ['Ευρώπη', 'Ασία', 'Αφρική', 'Αμερική', 'Αυστραλία']
EXCLUDE_LABELS = {'Game', 'Εφαρμογές'}
COLLECTIONS = [('Συγκρίσεις', 'Συγκρίσεις ειδών', 'Άρθρα που βάζουν δύο όμοια είδη δίπλα δίπλα.'),
               ('Παράδοξα της Φύσης', 'Παράδοξα της Φύσης', 'Παράξενα και ασυνήθιστα πουλιά.'),
               ('Εξωτικά', 'Εξωτικά πουλιά', 'Είδη από όλο τον κόσμο.')]
FAM_GR = {'Ιερακόμορφα': 'Accipitridae', 'Χαραδριόμορφα': 'Scolopacidae', 'Μυγοθηρίδες': 'Muscicapidae', 'Συλβιίδες': 'Sylviidae', 'Αετίδες': 'Accipitridae',
          'Κορακόμορφα': 'Corvidae', 'Ορνιθόμορφα': 'Phasianidae', 'Πάπιες': 'Anatidae', 'Σκολοπακίδες': 'Scolopacidae', 'Δρυοκολαπτόμορφα': 'Picidae',
          'Θαλλασοπούλια': 'Procellariidae', 'Σπιζίδες': 'Fringillidae', 'Παρυδάτια': 'Charadriidae', 'Περιστερόμορφα': 'Columbidae', 'Ερωδιοί': 'Ardeidae',
          'Ιερακίδες': 'Falconidae', 'Τύραννοι': 'Muscicapidae', 'Αποδόμορφα': 'Apodidae', 'Γλαυκόμορφα': 'Strigidae', 'Τσιχλόνια': 'Emberizidae',
          'Γερανόμορφα': 'Gruidae', 'Κοκκυγόμορφα': 'Cuculidae', 'Χήνες': 'Anatidae', 'Ακροκεφαλίδες': 'Acrocephalidae', 'Ψιττακομόρφα': 'Psittacidae',
          'Κερθιιδόμορφα': 'Certhiidae', 'Κιχλίδες': 'Turdidae', 'Γλαρόνια': 'Laridae', 'Παρίδες': 'Paridae', 'Ψαρόνια': 'Sturnidae', 'Γλάροι': 'Laridae',
          'Πετροκλήδες': 'Muscicapidae', 'Τριλιστές': 'Locustellidae', 'Αετομαχίδες': 'Laniidae', 'Μαλακονοτοειδή': 'Laniidae', 'Πελαργίδες': 'Ciconiidae',
          'Κορυδαλλίδες': 'Alaudidae', 'Σεισοπυγίδες': 'Motacillidae', 'Βασιλίσκος': 'Regulidae', 'Πασσερίδες': 'Passeridae', 'Ραλλίδες': 'Rallidae',
          'Στρουθιονόμορφα': 'Otididae', 'Φυλλοσκόποι': 'Phylloscopidae', 'Γύπες': 'Accipitridae', 'Μελιφαγιδόμορφα': 'Paridae', 'Νεκταρινιίδες': 'Aegithalidae',
          'Εστριλδίδες': 'Fringillidae', 'Θραυπίδες': 'Fringillidae', 'Θρησκειορνιθίδες': 'Threskiornithidae', 'Οριολίδες': 'Oriolidae', 'Πυγοποδίδες': 'Podicipedidae',
          'Χελιδόνια': 'Hirundidae', 'Καθαρτίδες': 'Accipitridae', 'Μοναρχίδες': 'Muscicapidae', 'Ρεμιζίδες': 'Remizidae', 'Τιμαλιίδες': 'Panuridae',
          'Φαλακροκορακίδες': 'Phalacrocoracidae', 'Σαΐνια': 'Accipitridae'}
TAXON = re.compile(r'(ιδες|ιδαι|ομορφα|οειδη|ιδων|ιδων|ωδη|ινοι)$')
META_LABELS = {'Οικογένεια', 'Πουλιά'} | {c[0] for c in COLLECTIONS} | set(GEO) | EXCLUDE_LABELS
STOP = set('και για που των του της την τον στο στη στην στον στα στις στους απο αυτο αυτη αυτοι αυτες αυτα αυτων αυτος ειναι εχει εχουν ηταν ειχε ειχαν μπορει μπορουν οπως μονο πολυ πολλα πολλες πολλοι πολλων πιο ακομη επισης μετα προς πριν οταν ενω αλλα ομως ωστε μεταξυ κατα μεσα εξω ειτε τους δηλαδη ετσι υπαρχει υπαρχουν καθως μεχρι περιπου συνηθως γενικα αρκετα διαφορα αυτου αυτης τουτο μιας μια ενας ενος ενα οποιο οποια οποιοι οποιες οσο οσα ολα ολες ολοι ολο τωρα τοτε εκει εδω ακριβως ισως ουτε θα να αν δεν μην εαν εχω ηδη επειδη διοτι αρα αφου γιατι παρα http https blogspot'.split())


def norm(s):
    s = unicodedata.normalize('NFKD', (s or '').lower())
    s = re.sub('[̀-ͯ]', '', s).replace('ς', 'σ')
    return re.sub(r'[^\w\s-]', ' ', s, flags=re.U)


FAM_GR = {norm(k).replace(' ', ''): v for k, v in FAM_GR.items()}

# ---------------------------------------------------------------- εικόνες
IMG_OK = re.compile(r'^https?://(?:lh\d\.(?:googleusercontent|ggpht)\.com|blogger\.googleusercontent\.com|\d\.bp\.blogspot\.com)/', re.I)


def img_key(u):
    """Επιστρέφει (βάση με %S στη θέση του μεγέθους) ή None."""
    if not u or not IMG_OK.match(u):
        return None
    u = u.split('#')[0]
    m = re.search(r'=([swh]\d+[^/?]*)$', u)
    if m:
        base = u[:m.start()] + '=%S'
    elif re.search(r'/[swh]\d+(?:-[a-z0-9-]+)?/[^/]+$', u):
        base = re.sub(r'/[swh]\d+(?:-[a-z0-9-]+)?/([^/]+)$', r'/%S/\1', u)
    else:
        base = u + '=%S' if 'blogger.googleusercontent.com' in u else None
    if not base:
        return None
    base = re.sub(r'^https?://lh\d\.(googleusercontent|ggpht)\.com/', '~', base)
    base = re.sub(r'^https?://', '', base) if not base.startswith('~') else base
    return base


# ---------------------------------------------------------------- καθαρισμός HTML
SKIP = {'script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 'button', 'select', 'option', 'form', 'textarea',
        'template', 'head', 'title', 'object', 'embed', 'audio', 'video', 'map', 'datalist'}
VOIDSKIP = {'meta', 'link', 'input', 'source', 'track', 'area', 'param'}
BLOCK = {'div', 'p', 'section', 'article', 'header', 'footer', 'aside', 'nav', 'blockquote', 'center', 'pre', 'tr', 'table',
         'tbody', 'thead', 'ul', 'ol', 'dl', 'dd', 'dt', 'figure', 'figcaption', 'hr', 'td', 'th', 'main'}
HEAD = {'h1': 'h3', 'h2': 'h3', 'h3': 'h3', 'h4': 'h4', 'h5': 'h4', 'h6': 'h4'}
BUL = re.compile(r'^\s*(?:[\U0001F530-\U0001F53D\u2022\u25CF\u25AA\u25B6\u2023\u2043]\ufe0f?|[-–]\s)\s*')
BLOG_HOSTS = re.compile(r'^https?://(?:www\.)?poulia4\.blogspot\.[a-z.]+', re.I)


def esc(s):
    return html.escape(s, quote=False)


class Cleaner(HTMLParser):
    def __init__(self, blog):
        super().__init__(convert_charrefs=True)
        self.blog = blog
        self.skip = 0
        self.divs = []
        self.box = 0              # βάθος div που αγνοείται (float / κρυμμένο)
        self.inl = []             # στοίβα inline: [tag, attrs_html, emitted]
        self.cur = []
        self.kind = 'p'
        self.head = None          # ανοιχτή κεφαλίδα
        self.blocks = []
        self.gallery = []
        self.gkeys = set()
        self.videos = []
        self.bc = None
        self.a_href = None
        self.a_has_img = False

    def skipping(self):
        return self.skip > 0 or self.box > 0

    # ---- inline
    def _open_pending(self):
        for e in self.inl:
            if not e[2]:
                self.cur.append('<%s%s>' % (e[0], e[1]))
                e[2] = True

    def _text(self, t):
        t = t.replace('\xa0', ' ')
        if not t.strip() and not self.cur:
            return
        if not self.cur and not t.strip():
            return
        self._open_pending()
        self.cur.append(esc(t))

    def _flush(self, force_kind=None):
        # κλείνουμε ό,τι έχει ανοιχτεί
        for e in reversed(self.inl):
            if e[2]:
                self.cur.append('</%s>' % e[0])
                e[2] = False
        raw = ''.join(self.cur)
        self.cur = []
        plain = re.sub(r'<[^>]+>', '', raw)
        plain = html.unescape(plain)
        if not plain.strip():
            return
        raw = re.sub(r'\s+', ' ', raw).strip()
        raw = re.sub(r'<(b|i|a[^>]*)>\s*</\1>', '', raw)
        kind = force_kind or self.kind
        self.blocks.append((kind, raw, re.sub(r'\s+', ' ', plain).strip()))

    # ---- handlers
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in VOIDSKIP:
            return
        if tag == 'div':
            st = (a.get('style') or '').replace(' ', '').lower()
            hide = 'display:none' in st or 'float:' in st or 'visibility:hidden' in st
            self.divs.append(hide)
            if hide and not self.box and not self.skip:
                self.box = len(self.divs)
            return
        if self.skipping():
            if tag in SKIP:
                self.skip += 1
            return
        if tag in SKIP:
            if tag == 'iframe':
                m = re.search(r'youtube(?:-nocookie)?\.com/embed/([\w-]{6,})', a.get('src') or a.get('data-src') or '')
                if m and m.group(1) not in self.videos:
                    self.videos.append(m.group(1))
            self.skip += 1
            return
        if tag == 'img':
            self._img(a)
            return
        if tag == 'br':
            self._flush()
            return
        if tag in HEAD:
            self._flush()
            self.head = HEAD[tag]
            self.head_src = tag
            self.kind = self.head
            return
        if tag == 'li':
            self._flush()
            self.kind = 'li'
            return
        if tag in BLOCK:
            self._flush()
            return
        if tag in ('b', 'strong'):
            self.inl.append(['b', '', False])
        elif tag in ('i', 'em'):
            self.inl.append(['i', '', False])
        elif tag == 'a':
            href = (a.get('href') or '').strip()
            self.a_href = href
            self.a_has_img = False
            self.inl.append(self._anchor(href))

    def _anchor(self, href):
        if not href or href.startswith('javascript') or href.startswith('#'):
            return ['span', '', False]
        if href.startswith('/') or BLOG_HOSTS.match(href):
            path = re.sub(r'^https?://[^/]+', '', href).split('#')[0].split('?')[0]
            if re.match(r'^/\d{4}/\d{2}/[^/]+\.html$', path):
                return ['a', ' data-p="%s"' % html.escape(path, quote=True), False]
            full = href if href.startswith('http') else self.blog + path
            return ['a', ' href="%s" target="_blank" rel="noopener noreferrer"' % html.escape(full, quote=True), False]
        if re.match(r'^https?://', href):
            if IMG_OK.match(href) and re.search(r'\.(jpe?g|png|gif|webp)(\?|$)', href, re.I):
                return ['span', '', False]
            return ['a', ' href="%s" target="_blank" rel="noopener noreferrer"' % html.escape(href, quote=True), False]
        return ['span', '', False]

    def _img(self, a):
        self.a_has_img = True
        src = a.get('src') or a.get('data-src') or ''
        k = img_key(src) or (img_key(self.a_href) if self.a_href else None)
        if not k:
            return
        if self.a_href and img_key(self.a_href):
            pass
        base = re.sub(r'\.(jpe?g|png|gif|webp)$', '', k, flags=re.I)
        base = re.sub(r'%S.*$', '', k) + re.sub(r'^.*/', '', base) if False else k
        ident = re.sub(r'%S', '', k).rsplit('/', 1)
        ident = ident[0] if len(ident) > 1 else k
        ident = re.sub(r'/[^/]*$', '', k) + '|' + k.rsplit('/', 1)[-1]
        if ident in self.gkeys:
            return
        self.gkeys.add(ident)
        alt = (a.get('alt') or '').strip()
        if len(self.gallery) < 24:
            self.gallery.append([k, alt[:80] if alt and not re.match(r'^(img|dsc|image|photo)', alt, re.I) else ''])

    def handle_endtag(self, tag):
        if tag in VOIDSKIP:
            return
        if tag == 'div':
            if self.divs:
                self.divs.pop()
                if self.box and len(self.divs) < self.box:
                    self.box = 0
            if not self.skipping():
                self._flush()
            return
        if self.skipping():
            if tag in SKIP and self.skip:
                self.skip -= 1
            return
        if tag in SKIP:
            return
        if tag in HEAD and self.head:
            self._flush()
            self.head = None
            self.kind = 'p'
            return
        if tag == 'li':
            self._flush()
            self.kind = 'p'
            return
        if tag in BLOCK:
            self._flush()
            return
        if tag in ('b', 'strong', 'i', 'em', 'a'):
            want = {'strong': 'b', 'em': 'i'}.get(tag, tag)
            for idx in range(len(self.inl) - 1, -1, -1):
                e = self.inl[idx]
                if e[0] == want or (tag == 'a' and e[0] in ('a', 'span') and idx == len(self.inl) - 1):
                    if e[2]:
                        self.cur.append('</%s>' % e[0])
                    del self.inl[idx]
                    break
            if tag == 'a':
                self.a_href = None

    def handle_data(self, data):
        if self.skipping():
            return
        self._text(data)

    def handle_comment(self, data):
        pass

    def close(self):
        super().close()
        self._flush()


def lead(h):
    """«Τροφή: …» → έντονη ετικέτα στην αρχή (μόνο αν δεν υπάρχει ήδη εσωτερικό HTML πριν την άνω-κάτω τελεία)."""
    m = re.match(r'^([^<:]{3,42}:)(\s.*)$', h, re.S)
    if m and not re.search(r'[.!?;]\s', m.group(1)):
        return '<b>%s</b>%s' % (m.group(1), m.group(2))
    return h


def clean_article(raw, title, blog):
    raw = re.sub(r'<!--.*?-->', '', raw, flags=re.S)
    c = Cleaner(blog)
    c.feed(raw)
    c.close()
    blocks = c.blocks
    # breadcrumb της ταξινόμησης (h3 με "|")
    out = []
    bc = None
    for kind, h, plain in blocks:
        if kind == 'h3' and '|' in plain and len(re.findall(r'data-p="', h)) >= 2:
            bc = [html.unescape(re.sub(r'<[^>]+>', '', x)).strip() for x in re.split(r'\s*\|\s*', h)]
            continue
        out.append((kind, h, plain))
    blocks = out
    latin = ''
    # πρώτη γραμμή: «Όνομα (Latin name)» → την κρατάμε ως μεταδεδομένο
    if blocks and blocks[0][0] == 'p':
        p0 = blocks[0][2]
        m = re.search(r'\(([A-Z][a-z]+(?: [a-z-]+){1,2})\)', p0)
        if len(p0) <= len(title) + 70 and (norm(title)[:5] in norm(p0) or m):
            if m:
                latin = m.group(1)
            blocks = blocks[1:]
    if not latin:
        for _, _, p in blocks[:3]:
            m = re.search(r'\(([A-Z][a-z]+ [a-z-]+(?: [a-z-]+)?)\)', p)
            if m:
                latin = m.group(1)
                break
    # ένωση παραγράφων που κόπηκαν από <br>, και «🔸»/«•» → λίστες
    merged = []
    for kind, h, plain in blocks:
        if (merged and kind == 'p' and merged[-1][0] == 'p' and not BUL.match(plain) and not BUL.match(merged[-1][2])
                and not re.search(r'[.;:!?»"\u2026)]\s*$', merged[-1][2]) and re.match(r'^[a-zα-ωά-ώ(«"]', plain) and len(merged[-1][2]) > 60):
            k0, h0, p0 = merged[-1]
            merged[-1] = (k0, h0 + ' ' + h, p0 + ' ' + plain)
            continue
        if kind == 'p' and BUL.match(plain):
            h = BUL.sub('', h, count=1) if BUL.match(h) else re.sub(r'^(<[^>]+>)*\s*(?:[\U0001F530-\U0001F53D\u2022\u25CF\u25AA\u25B6\u2023\u2043]\ufe0f?)\s*', lambda m: m.group(1) or '', h)
            kind = 'li'
        merged.append((kind, h, plain))
    blocks = merged
    # εξαγωγή HTML
    parts = []
    i = 0
    while i < len(blocks):
        kind, h, plain = blocks[i]
        if kind == 'li':
            items = []
            while i < len(blocks) and blocks[i][0] == 'li':
                items.append('<li>%s</li>' % lead(blocks[i][1]))
                i += 1
            parts.append('<ul>%s</ul>' % ''.join(items))
            continue
        if kind in ('h3', 'h4'):
            only_link = re.fullmatch(r'<a [^>]*>[^<]*</a>', h) is not None and kind == 'h4'
            if only_link:
                items = []
                while i < len(blocks) and blocks[i][0] == 'h4' and re.fullmatch(r'<a [^>]*>[^<]*</a>', blocks[i][1]):
                    items.append('<li>%s</li>' % blocks[i][1])
                    i += 1
                parts.append('<ul class="sp">%s</ul>' % ''.join(items))
                continue
            parts.append('<%s>%s</%s>' % (kind, re.sub(r'</?b>', '', h), kind))
        else:
            h = lead(h)
            parts.append('<p>%s</p>' % h)
        i += 1
    text = ' '.join(p for _, _, p in blocks)
    return dict(html=''.join(parts), text=text, gallery=c.gallery, videos=c.videos, latin=latin, bc=bc)


# ---------------------------------------------------------------- κύρια ροή
def stem(w):
    return w[:6]


def tokens(text):
    out = []
    for w in norm(text).split():
        if len(w) < 4 or w in STOP or w.isdigit():
            continue
        out.append(stem(w))
    return out


def common_prefix(a, b):
    n = 0
    for x, y in zip(a, b):
        if x != y:
            break
        n += 1
    return n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('feed')
    ap.add_argument('outdir')
    ap.add_argument('--blog', default='https://poulia4.blogspot.com')
    ap.add_argument('--chunk', type=int, default=100)
    ap.add_argument('--min-chapter', type=int, default=3)
    args = ap.parse_args()
    blog = args.blog.rstrip('/')

    arts = []
    skipped = collections.Counter()
    for ev, el in ET.iterparse(args.feed, events=('end',)):
        if not el.tag.endswith('}entry'):
            continue
        if el.findtext('b:type', namespaces=NS) != 'POST' or el.findtext('b:status', namespaces=NS) != 'LIVE':
            el.clear()
            continue
        title = html.unescape((el.findtext('a:title', namespaces=NS) or '').strip())
        labels = [x.get('term') for x in el.findall('a:category', NS) if x.get('term') and not x.get('term').startswith('http')]
        link = next((l.get('href') for l in el.findall('a:link', NS) if l.get('rel') == 'alternate'), '')
        if set(labels) & EXCLUDE_LABELS:
            skipped['εφαρμογή/παιχνίδι (ετικέτα Game/Εφαρμογές)'] += 1
            el.clear()
            continue
        pid = re.search(r'post-(\d+)', el.findtext('a:id', namespaces=NS) or '')
        raw = el.findtext('a:content', namespaces=NS) or ''
        cl = clean_article(raw, title, blog)
        if len(cl['text']) < 120:
            skipped['χωρίς αρκετό κείμενο (<120 χαρακτήρες)'] += 1
            el.clear()
            continue
        path = re.sub(r'^https?://[^/]+', '', link).split('?')[0]
        def ms(tag):
            t = el.findtext(tag, namespaces=NS)
            try:
                from datetime import datetime
                return int(datetime.fromisoformat(t.replace('Z', '+00:00')).timestamp() * 1000)
            except Exception:
                return 0
        arts.append(dict(id=pid.group(1) if pid else str(len(arts)), t=title, u=path, l=labels, cl=cl, p=ms('a:published'), up=ms('a:updated')))
        el.clear()
    print('άρθρα στη βιβλιοθήκη:', len(arts), '· εξαιρέθηκαν:', dict(skipped))

    # ---- κεφάλαια από ετικέτες
    cnt = collections.Counter(l for a in arts for l in a['l'] if l not in META_LABELS)
    chapters = []
    for a in arts:
        nt = norm(a['t']).strip()
        a['ov'] = int(not a['cl']['latin'] and (' ' not in nt and bool(TAXON.search(nt)) or 'Οικογένεια' in a['l']))
    for lab, n in sorted(cnt.items(), key=lambda x: (-x[1], x[0])):
        if n < args.min_chapter:
            continue
        kind = 'order' if re.search(r'[οό][μµ][όο]ρφα$', lab) else 'family'
        fam = FAM_GR.get(norm(lab).replace(' ', ''), '')
        chapters.append(dict(id='c%d' % len(chapters), name=lab, kind=kind, n=n, fam=fam))
    chap_by_label = {c['name']: c for c in chapters}
    # εισαγωγικό (επισκόπηση) άρθρο κάθε κεφαλαίου: άρθρο-ταξινομική μονάδα με το πιο κοινό πρόθεμα ονόματος
    for c in chapters:
        nc = norm(c['name']).strip()
        best, bl = None, 0
        for a in arts:
            if not a['ov'] or c['name'] not in a['l']:
                continue
            cp = common_prefix(norm(a['t']).strip(), nc)
            if cp >= 4 and cp > bl:
                best, bl = a, cp
        if best:
            c['intro'] = best['id']
    for coll_label, name, desc in COLLECTIONS:
        n = sum(1 for a in arts if coll_label in a['l'])
        if n:
            chapters.append(dict(id='c%d' % len(chapters), name=name, label=coll_label, kind='collection', n=n, desc=desc))
    for g in GEO:
        n = sum(1 for a in arts if g in a['l'])
        if n:
            chapters.append(dict(id='c%d' % len(chapters), name=g, label=g, kind='geo', n=n))
    for c in chapters:
        lab = c.get('label') or c['name']
        c['label'] = lab
    # ανάθεση κεφαλαίων στα άρθρα
    by_label = collections.defaultdict(list)
    for c in chapters:
        by_label[c['label']].append(c['id'])
    for a in arts:
        ids = []
        for l in a['l']:
            ids += by_label.get(l, [])
        a['ch'] = ids
        a['fam'] = ''
        for kind in ('family', 'order'):
            for l in a['l']:
                c = chap_by_label.get(l)
                if c and c['kind'] == kind and c.get('fam') and not a['fam']:
                    a['fam'] = c['fam']

    # ---- σχετικά άρθρα (TF-IDF cosine + κοινές ταξινομικές ετικέτες)
    docs = []
    for a in arts:
        toks = tokens(a['t'] + ' ') * 3 + tokens(' '.join(a['l'])) * 2 + tokens(a['cl']['text'])
        docs.append(collections.Counter(toks))
    df = collections.Counter()
    for d in docs:
        df.update(d.keys())
    N = len(docs)
    vecs, inv = [], collections.defaultdict(list)
    for i, d in enumerate(docs):
        v = {t: (1 + math.log(c)) * math.log(1 + N / df[t]) for t, c in d.items() if df[t] < N * 0.25}
        nrm = math.sqrt(sum(x * x for x in v.values())) or 1
        v = {t: x / nrm for t, x in v.items()}
        vecs.append(v)
        for t in v:
            inv[t].append(i)
    taxo = [set(l for l in a['l'] if l not in META_LABELS) for a in arts]
    for i, a in enumerate(arts):
        sc = collections.Counter()
        for t, x in vecs[i].items():
            if len(inv[t]) > N * 0.2:
                continue
            for j in inv[t]:
                if j != i:
                    sc[j] += x * vecs[j][t]
        for j in list(sc):
            inter = len(taxo[i] & taxo[j])
            if inter:
                sc[j] += 0.12 * inter / max(1, len(taxo[i] | taxo[j]))
        top = [j for j, s in sc.most_common(6) if s > 0.07]
        a['rel'] = [arts[j]['id'] for j in top]

    # ---- έξοδος
    os.makedirs(args.outdir, exist_ok=True)
    for f in os.listdir(args.outdir):
        if re.match(r'^(b\d+\.json|index\.js)$', f):
            os.remove(os.path.join(args.outdir, f))
    arts.sort(key=lambda a: (a['p'], a['id']))
    meta = []
    for k, a in enumerate(arts):
        words = len(a['cl']['text'].split())
        first = a['cl']['gallery'][0][0] if a['cl']['gallery'] else ''
        summ = re.sub(r'\s+', ' ', a['cl']['text'])[:200]
        meta.append(dict(id=a['id'], f=a['fam'], ov=a['ov'], t=a['t'], u=a['u'], l=a['l'], c=a['ch'], p=a['p'], up=a['up'], m=first, lat=a['cl']['latin'],
                         min=max(1, round(words / 190)), w=words, s=summ, r=a['rel'], g=len(a['cl']['gallery']), v=len(a['cl']['videos']),
                         b=k // args.chunk))
    nchunk = (len(arts) + args.chunk - 1) // args.chunk
    for ci in range(nchunk):
        body = {}
        for a in arts[ci * args.chunk:(ci + 1) * args.chunk]:
            body[a['id']] = dict(h=a['cl']['html'], g=a['cl']['gallery'], v=a['cl']['videos'])
        with open(os.path.join(args.outdir, 'b%d.json' % ci), 'w', encoding='utf-8') as f:
            json.dump(body, f, ensure_ascii=False, separators=(',', ':'))
    built = max([a['up'] for a in arts] + [0])
    idx = dict(v=1, built=built, blog=blog, chunks=nchunk, chunk=args.chunk, chapters=chapters, arts=meta)
    with open(os.path.join(args.outdir, 'index.js'), 'w', encoding='utf-8') as f:
        f.write('/* POULIA4 · Βιβλιοθήκη Ορνιθολογίας — δεδομένα (παράγεται από tools/make-library.py). Μόνο δημοσιευμένα άρθρα. */\n')
        f.write('window.POULIA4_LIB=')
        json.dump(idx, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    tot = sum(os.path.getsize(os.path.join(args.outdir, x)) for x in os.listdir(args.outdir))
    print('κεφάλαια:', len(chapters), '· αρχεία δεδομένων: %d KB' % (tot // 1024))


if __name__ == '__main__':
    main()
