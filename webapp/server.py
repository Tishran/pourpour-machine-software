"""Run locally: python3 server.py"""
import argparse
import json
import logging
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from pourpour import CoffeeService, SourceError
from label_ocr import MAX_IMAGE_BYTES, OCRError, extract, status as ocr_status
from recommender import RecipeModel

ROOT = Path(__file__).parent / 'static'
service = CoffeeService()
model = None


def get_model():
    global model
    if model is None:
        model = RecipeModel()
    return model


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlsplit(self.path)
        try:
            if url.path == '/api/health':
                return self.send_json(200, {'status': 'ok'})
            if url.path == '/api/model':
                fitted = get_model()
                return self.send_json(200, {'version': fitted.model['version'],
                                            'dataset_snapshot': fitted.model['dataset_snapshot'],
                                            'coffees': len(fitted.rows), 'ocr': ocr_status()})
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

    def do_POST(self):
        url = urlsplit(self.path)
        try:
            if url.path not in ('/api/label', '/api/recommend'):
                return self.send_json(404, {'error': 'Страница не найдена.'})
            origin = self.headers.get('Origin')
            if origin and origin != 'http://' + self.headers.get('Host', ''):
                return self.send_json(403, {'error': 'The request must come from this application.'})
            if self.headers.get('Transfer-Encoding'):
                return self.send_json(400, {'error': 'The request must include Content-Length.'})
            length = int(self.headers.get('Content-Length', '0'))
            maximum = MAX_IMAGE_BYTES if url.path == '/api/label' else 60000
            if length <= 0 or length > maximum:
                return self.send_json(413, {'error': 'The request is too large or empty.'})
            content_type = self.headers.get('Content-Type', '').split(';')[0]
            allowed = ('image/jpeg', 'image/png') if url.path == '/api/label' else ('application/json',)
            if content_type not in allowed:
                return self.send_json(415, {'error': 'Unsupported request format.'})
            self.connection.settimeout(35)
            payload = self.rfile.read(length)
            if len(payload) != length:
                raise ValueError('The upload was incomplete.')
            if url.path == '/api/label':
                ocr = extract(payload)
                recommendation = get_model().recommend(ocr['text'])
                # Low-confidence OCR is editable, but should not automatically prepare a recipe.
                if ocr['needs_review']:
                    recommendation.update(kind='review_label', recipe_data=None,
                                          message='Review the label text and select Prepare recipe.')
                return self.send_json(200, {'ocr': ocr, 'recommendation': recommendation})
            body = json.loads(payload)
            if not isinstance(body, dict) or not isinstance(body.get('text'), str):
                raise ValueError('Label text is required.')
            selected = body.get('selected_coffee_id')
            if selected is not None and not isinstance(selected, str):
                raise ValueError('Invalid coffee identifier.')
            return self.send_json(200, get_model().recommend(body['text'], selected))
        except (ValueError, UnicodeError) as exc:
            self.send_json(400, {'error': str(exc)})
        except OCRError as exc:
            self.send_json(503, {'error': str(exc)})
        except (BrokenPipeError, ConnectionResetError, socket.timeout):
            pass
        except Exception:
            logging.exception('Photo/recommendation request failed')
            self.send_json(500, {'error': 'Could not prepare a recipe. Check the model setup.'})

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
