#!/usr/bin/env python3
"""Сборка блога: python build.py

Что делает:
  posts/*.md  ->  blog/<имя-файла>.html   (страницы статей)
  обновляет списки статей в blog.html и index.html (между метками POSTS-BLOG / POSTS-HOME)
  создаёт sitemap.xml

Файлы, имя которых начинается с «_», пропускаются.
Начало каждой статьи (front matter):
  ---
  title: Заголовок
  date: 2026-11-11
  tag: dev          (dev = Разработка, seo = Продвижение, an = Аналитика)
  description: Одно-два предложения для поиска и превью
  cover: img/cover.jpg   (необязательно, иначе серая заглушка)
  soon: true             (необязательно: карточка «Скоро» без страницы)
  draft: true            (необязательно: статья не публикуется)
  ---
"""
import html, json, math, re, datetime, pathlib

SITE_URL = "https://h0usehome.github.io/vizitka/index.html"   # замените на адрес сайта
STUDIO = "[Название студии]"
HOME_COUNT = 3                                          # сколько статей на главной
ROOT = pathlib.Path(__file__).parent
TAGS = {"dev": ("Разработка", "tag--dev"), "seo": ("Продвижение", "tag--seo"), "an": ("Аналитика", "tag--both")}
MONTHS = "января февраля марта апреля мая июня июля августа сентября октября ноября декабря".split()
esc = html.escape

# ---------- Markdown (небольшой, без библиотек) ----------
def inline(t):
    t = esc(t, quote=False)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![\*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\*)', r'<em>\1</em>', t)
    def link(m):
        u = m.group(2); ext = u.startswith('http')
        return f'<a href="{u}"' + (' target="_blank" rel="noopener"' if ext else '') + f'>{m.group(1)}</a>'
    return re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', link, t)

def md(src):
    out, para, lst, code = [], [], None, None
    def flush_p():
        if para: out.append('<p>' + inline(' '.join(para)) + '</p>'); para.clear()
    def flush_l():
        nonlocal lst
        if lst: out.append(f'<{lst[0]}>' + ''.join(f'<li>{inline(i)}</li>' for i in lst[1]) + f'</{lst[0]}>'); lst = None
    for ln in src.split('\n'):
        if code is not None:
            if ln.strip().startswith('```'): out.append('<pre><code>' + esc('\n'.join(code)) + '</code></pre>'); code = None
            else: code.append(ln)
            continue
        s = ln.strip()
        if s.startswith('```'): flush_p(); flush_l(); code = []; continue
        if not s: flush_p(); flush_l(); continue
        h = re.match(r'(#{1,3})\s+(.*)', s)
        if h: flush_p(); flush_l(); n = max(2, len(h.group(1))); out.append(f'<h{n}>{inline(h.group(2))}</h{n}>'); continue
        im = re.fullmatch(r'!\[([^\]]*)\]\(([^)\s]+)\)', s)
        if im: flush_p(); flush_l(); out.append(f'<figure><img src="{{{{root}}}}{im.group(2)}" alt="{esc(im.group(1))}" loading="lazy"></figure>'); continue
        if s.startswith('>'): flush_p(); flush_l(); out.append(f'<blockquote><p>{inline(s.lstrip("> "))}</p></blockquote>'); continue
        li = re.match(r'([-*]|\d+\.)\s+(.*)', s)
        if li:
            flush_p(); kind = 'ol' if li.group(1)[0].isdigit() else 'ul'
            if lst and lst[0] != kind: flush_l()
            if not lst: lst = (kind, [])
            lst[1].append(li.group(2)); continue
        flush_l(); para.append(s)
    flush_p(); flush_l()
    return '\n'.join(out)

# ---------- Чтение статей ----------
def load():
    posts = []
    for f in sorted((ROOT / 'posts').glob('*.md')):
        if f.name.startswith('_'): continue
        raw = f.read_text(encoding='utf-8')
        m = re.match(r'---\s*\n(.*?)\n---\s*\n?(.*)', raw, re.S)
        if not m: print('! нет front matter:', f.name); continue
        meta = {}
        for ln in m.group(1).split('\n'):
            if ':' in ln: k, v = ln.split(':', 1); meta[k.strip()] = v.strip().strip('"\'')
        if meta.get('draft') == 'true': continue
        meta['slug'] = f.stem; meta['body'] = m.group(2)
        meta['soon'] = meta.get('soon') == 'true'
        meta.setdefault('title', f.stem); meta.setdefault('tag', 'dev'); meta.setdefault('description', '')
        d = meta.get('date')
        meta['dt'] = datetime.date.fromisoformat(d) if d else None
        meta['min'] = max(1, math.ceil(len(re.findall(r'\w+', meta['body'])) / 180))
        posts.append(meta)
    posts.sort(key=lambda p: (p['soon'], -(p['dt'].toordinal() if p['dt'] else 0)))
    return posts

def fdate(d): return f'{d.day} {MONTHS[d.month - 1]} {d.year}'

def card(p, lead=False):
    name, cls = TAGS.get(p['tag'], TAGS['dev'])
    cover = (f'<img class="post__cover" src="{esc(p["cover"])}" alt="" loading="lazy">' if p.get('cover')
             else '<div class="ph ph--shot" role="img" aria-label="Место для обложки"><span>Обложка<small>16:10</small></span></div>')
    if p['soon']:
        meta = '<b>Скоро</b>'; op, cl = '<div class="post__a">', '</div>'
    else:
        meta = f'{fdate(p["dt"])} · {p["min"]} мин' if p['dt'] else f'{p["min"]} мин'
        op, cl = f'<a class="post__a" href="blog/{p["slug"]}.html">', '</a>'
    return (f'<article class="post{" post--lead" if lead else ""}" data-cat="{p["tag"]}">{op}{cover}'
            f'<span class="tag {cls}">{name}</span><h3>{esc(p["title"])}</h3><p class="post__meta">{meta}</p>{cl}</article>')

def fill(path, marker, cards):
    f = ROOT / path
    s = f.read_text(encoding='utf-8')
    pat = re.compile(rf'(<!-- {marker}:START -->).*?(<!-- {marker}:END -->)', re.S)
    assert pat.search(s), f'в {path} нет меток {marker}'
    f.write_text(pat.sub(lambda m: m.group(1) + '\n' + '\n'.join(cards) + '\n' + m.group(2), s), encoding='utf-8')

def build():
    posts = load()
    tpl = (ROOT / 'templates' / 'post.html').read_text(encoding='utf-8')
    out = ROOT / 'blog'; out.mkdir(exist_ok=True)
    for old in out.glob('*.html'): old.unlink()
    urls = [SITE_URL + '/', SITE_URL + '/blog.html']
    for p in posts:
        if p['soon']: continue
        name, cls = TAGS.get(p['tag'], TAGS['dev'])
        url = f'{SITE_URL}/blog/{p["slug"]}.html'; urls.append(url)
        ld = json.dumps({"@context": "https://schema.org", "@type": "Article", "headline": p['title'],
                         "description": p['description'], "datePublished": p['dt'].isoformat() if p['dt'] else None,
                         "mainEntityOfPage": url, "author": {"@type": "Organization", "name": STUDIO}}, ensure_ascii=False)
        page = tpl
        for k, v in {'title': esc(p['title']), 'description': esc(p['description']), 'canonical': url,
                     'tagname': name, 'tagcls': cls, 'date': fdate(p['dt']) if p['dt'] else '', 'min': str(p['min']),
                     'jsonld': ld, 'content': md(p['body'])}.items():
            page = page.replace('{{' + k + '}}', v)
        page = page.replace('{{root}}', '../')
        (out / f'{p["slug"]}.html').write_text(page, encoding='utf-8')
    fill('blog.html', 'POSTS-BLOG', [card(p, i == 0) for i, p in enumerate(posts)])
    fill('index.html', 'POSTS-HOME', [card(p) for p in posts[:HOME_COUNT]])
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + \
         ''.join(f'  <url><loc>{u}</loc></url>\n' for u in urls) + '</urlset>\n'
    (ROOT / 'sitemap.xml').write_text(sm, encoding='utf-8')
    print(f'Готово: страниц статей {sum(not p["soon"] for p in posts)}, «скоро» {sum(p["soon"] for p in posts)}')

if __name__ == '__main__':
    build()
