"""Run locally: python3 server.py"""
import argparse
import json
import logging
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from pourpour import CoffeeService, SourceError

ROOT = Path(__file__).parent / 'static'
service = CoffeeService()


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlsplit(self.path)
        try:
            if url.path == '/api/health':
                return self.send_json(200, {'status': 'ok'})
            if url.path == '/api/search':
                query = parse_qs(url.query).get('q', [''])[0].strip()
                if len(query) > 120:
                    return self.send_json(400, {'error': 'Введите не больше 120 символов.'})
                return self.send_json(200, service.search(query))
            if url.path.startswith('/api/recipes/'):
                key = url.path.removeprefix('/api/recipes/')
                if len(key) != 16 or any(c not in '0123456789abcdef' for c in key):
                    return self.send_json(400, {'error': 'Неверный идентификатор кофе.'})
                return self.send_json(200, service.recipe(key))
            files = {'/': ('index.html', 'text/html'), '/app.js': ('app.js', 'text/javascript'),
                     '/style.css': ('style.css', 'text/css')}
            if url.path not in files:
                return self.send_json(404, {'error': 'Страница не найдена.'})
            name, mime = files[url.path]
            self.respond(200, (ROOT / name).read_bytes(), mime + '; charset=utf-8')
        except SourceError as exc:
            self.send_json(502, {'error': str(exc)})
        except KeyError:
            self.send_json(404, {'error': 'Кофе не найден. Обновите поиск.'})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            logging.exception('Request failed')
            self.send_json(500, {'error': 'Не удалось обработать запрос. Попробуйте ещё раз.'})

    def send_json(self, code, body):
        self.respond(code, json.dumps(body, ensure_ascii=False).encode(), 'application/json; charset=utf-8')

    def respond(self, code, body, mime):
        self.send_response(code)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8000)
    args = parser.parse_args()
    print(f'PourPour: http://{args.host}:{args.port}', flush=True)
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()
