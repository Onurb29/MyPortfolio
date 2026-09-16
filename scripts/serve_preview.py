"""Serve static files with the deployed browser headers for CI checks."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'wwwroot'
headers = []
for line in (ROOT / '_headers').read_text().splitlines()[1:]:
    if not line.strip():
        break
    name, value = line.strip().split(':', 1)
    headers.append((name, value.strip()))

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        for name, value in headers:
            self.send_header(name, value)
        super().end_headers()

ThreadingHTTPServer(('127.0.0.1', 8000), Handler).serve_forever()
