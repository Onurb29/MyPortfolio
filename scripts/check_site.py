"""Check local HTML references and fragments without depending on external sites."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1] / 'wwwroot'

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.ids, self.refs = path, set(), []
        self.feed(path.read_text(encoding='utf-8-sig'))

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key == 'id':
                assert value not in self.ids, f'{self.path}: duplicate ID {value}'
                self.ids.add(value)
            if key in ('src', 'href') and value:
                self.refs.append(value)

pages = {p.resolve(): Page(p) for p in ROOT.rglob('*.html')}
assert pages, 'No HTML pages found'
for path, page in pages.items():
    for ref in page.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            continue
        target = (ROOT / unquote(url.path).lstrip('/') if url.path.startswith('/')
                  else path.parent / unquote(url.path)) if url.path else path
        if target.is_dir():
            target /= 'index.html'
        target = target.resolve()
        assert target.is_relative_to(ROOT.resolve()), f'Outside site: {ref}'
        assert target.is_file(), f'{path}: missing {ref}'
        if url.fragment and target in pages:
            assert unquote(url.fragment) in pages[target].ids, f'{path}: missing fragment {ref}'
print(f'Validated links, assets and fragments in {len(pages)} pages.')
