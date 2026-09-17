"""Run locally: python3 server.py"""
import argparse
import json
import logging
import queue
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit
from pourpour import CoffeeService, SourceError, scan_label
from label_ocr import MAX_IMAGE_BYTES, OCRError, status as ocr_status
from recommender import RecipeModel, RECOMMENDATION_POLICY
from machine import BUSY_STATES, MachineError, create_machine, recipe_to_machine

ROOT = Path(__file__).parent / 'static'
STATIC_FILES = {
    '/': ('index.html', 'text/html; charset=utf-8'),
    '/app.js': ('app.js', 'text/javascript; charset=utf-8'),
    '/style.css': ('style.css', 'text/css; charset=utf-8'),
    '/manifest.webmanifest': ('manifest.webmanifest', 'application/manifest+json; charset=utf-8'),
    '/icon.svg': ('icon.svg', 'image/svg+xml'),
    '/icon-192.png': ('icon-192.png', 'image/png'),
    '/icon-512.png': ('icon-512.png', 'image/png'),
    '/apple-touch-icon.png': ('apple-touch-icon.png', 'image/png'),
}
service = CoffeeService()
model = None
machine = None  # set by set_machine(); None means `--machine none`
MACHINE_COMMANDS = ('start', 'pause', 'resume', 'abort', 'tare')


def set_machine(instance):
    """Install the machine bridge (SimulatedMachine, SerialMachine or None)."""
    global machine
    if machine is not None and machine is not instance:
        machine.close()
    machine = instance
    if machine is not None:
        machine.start_pinger()
    return machine


def machine_status():
    if machine is None:
        return {'enabled': False, 'connected': False, 'state': None, 'firmware': None, 'mode': None, 'telemetry': None}
    return {'enabled': True, 'connected': machine.connected, 'state': machine.state,
            'firmware': machine.info.get('fw'), 'mode': machine.info.get('mode'), 'telemetry': machine.latest}


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
            if url.path == '/api/machine':
                return self.send_json(200, machine_status())
            if url.path == '/api/machine/events':
                return self.stream_machine_events()
            if url.path == '/api/model':
                fitted = get_model()
                return self.send_json(200, {'version': fitted.model['version'],
                                            'policy_version': RECOMMENDATION_POLICY,
                                            'dataset_snapshot': fitted.model['dataset_snapshot'],
                                            'coffees': len(fitted.rows), 'ocr': ocr_status()})
            if url.path == '/api/search':
                query = parse_qs(url.query).get('q', [''])[0].strip()
                if len(query) > 120:
                    return self.send_json(400, {'error': 'Enter no more than 120 characters.'})
                return self.send_json(200, service.search(query))
            if url.path.startswith('/api/recipes/'):
                key = url.path.removeprefix('/api/recipes/')
                if len(key) != 16 or any(c not in '0123456789abcdef' for c in key):
                    return self.send_json(400, {'error': 'Invalid coffee identifier.'})
                return self.send_json(200, service.recipe(key))
            if url.path not in STATIC_FILES:
                return self.send_json(404, {'error': 'Page not found.'})
            name, mime = STATIC_FILES[url.path]
            self.respond(200, (ROOT / name).read_bytes(), mime)
        except SourceError as exc:
            self.send_json(502, {'error': str(exc)})
        except KeyError:
            self.send_json(404, {'error': 'Coffee not found. Refresh the search.'})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            logging.exception('Request failed')
            self.send_json(500, {'error': 'Could not process the request. Try again.'})

    def do_POST(self):
        url = urlsplit(self.path)
        try:
            if url.path.startswith('/api/machine/'):
                return self.machine_post(url.path.removeprefix('/api/machine/'))
            if url.path not in ('/api/label', '/api/scan', '/api/recommend'):
                return self.send_json(404, {'error': 'Page not found.'})
            origin = self.headers.get('Origin')
            if origin and origin != 'http://' + self.headers.get('Host', ''):
                return self.send_json(403, {'error': 'The request must come from this application.'})
            if self.headers.get('Transfer-Encoding'):
                return self.send_json(400, {'error': 'The request must include Content-Length.'})
            length = int(self.headers.get('Content-Length', '0'))
            is_photo = url.path in ('/api/label', '/api/scan')
            maximum = MAX_IMAGE_BYTES if is_photo else 60000
            if length <= 0 or length > maximum:
                return self.send_json(413, {'error': 'The request is too large or empty.'})
            content_type = self.headers.get('Content-Type', '').split(';')[0]
            allowed = ('image/jpeg', 'image/png') if is_photo else ('application/json',)
            if content_type not in allowed:
                return self.send_json(415, {'error': 'Unsupported request format.'})
            self.connection.settimeout(35)
            payload = self.rfile.read(length)
            if len(payload) != length:
                raise ValueError('The upload was incomplete.')
            if is_photo:
                scan = scan_label(payload, content_type)
                ocr = scan['ocr']
                recommendation = get_model().recommend(ocr['text'])
                # Preserve automatic recipes for readable names, including uncertain
                # OCR. Surface the uncertainty without adding a confirmation step.
                if ocr['needs_review']:
                    message = ('The label could not be read. This is a general starting recipe.'
                               if not ocr['text'].strip() else
                               'Some label text is uncertain. This recipe may refer to a different coffee; try a clearer photo to refine it.')
                    recommendation.update(ocr_uncertain=True, message=message + ' ' + recommendation['message'])
                    recommendation['recipe_data']['explanation'] = recommendation['message']
                return self.send_json(200, {**scan, 'candidates': recommendation['candidates'],
                                            'message': recommendation['message'], 'recommendation': recommendation})
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

    # -- machine bridge ---------------------------------------------------
    def machine_post(self, action):
        origin = self.headers.get('Origin')
        if origin and origin != 'http://' + self.headers.get('Host', ''):
            return self.send_json(403, {'error': 'The request must come from this application.'})
        if action not in ('recipe',) + MACHINE_COMMANDS:
            return self.send_json(404, {'error': 'Страница не найдена.'})
        if machine is None:
            return self.send_json(404, {'error': 'No machine is configured on this server.', 'code': 'no_machine'})
        length = int(self.headers.get('Content-Length', '0') or 0)
        if length > 60000:
            return self.send_json(413, {'error': 'The request is too large.'})
        payload = self.rfile.read(length) if length else b''
        try:
            if not machine.connected:
                raise MachineError('disconnected')
            if action == 'recipe':
                try:
                    body = json.loads(payload or b'{}')
                except ValueError:
                    return self.send_json(400, {'error': 'Invalid JSON.', 'code': 'bad_params'})
                recipe = body.get('recipe') if isinstance(body, dict) else None
                if machine.state in BUSY_STATES:
                    raise MachineError('busy')
                command = recipe_to_machine(recipe)
                if machine.state not in ('IDLE', 'READY', 'DONE', None):
                    machine.command('abort')  # clear a finished/failed session before loading
                machine.command('load_recipe', **command)
            else:
                machine.command(action)
            return self.send_json(200, {'ok': True, 'state': machine.state, 'telemetry': machine.latest})
        except MachineError as exc:
            return self.send_json(exc.status, {'error': exc.message, 'code': exc.code, 'state': machine.state})
        except (BrokenPipeError, ConnectionResetError, socket.timeout):
            pass
        except Exception:
            logging.exception('Machine request failed')
            self.send_json(500, {'error': 'Could not talk to the machine.', 'code': 'internal'})

    def stream_machine_events(self):
        if machine is None:
            return self.send_json(404, {'error': 'No machine is configured on this server.', 'code': 'no_machine'})
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Accel-Buffering', 'no')
        self.end_headers()
        events = machine.subscribe()
        try:
            self.write_event('link', {'connected': machine.connected, 'info': machine.info})
            if machine.latest:
                self.write_event('state', machine.latest)
            while True:
                try:
                    event = events.get(timeout=15)
                except queue.Empty:
                    self.wfile.write(b': keep-alive\n\n')
                    self.wfile.flush()
                    continue
                self.write_event(event.get('ev', 'state'), event)
        except (BrokenPipeError, ConnectionResetError, socket.timeout, OSError):
            pass
        finally:
            machine.unsubscribe(events)

    def write_event(self, name, data):
        self.wfile.write(f'event: {name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n'.encode())
        self.wfile.flush()

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
    parser.add_argument('--machine', default='none',
                        help='none (default), sim, serial (autodetect the USB port) or serial:/dev/tty...')
    parser.add_argument('--sim-speed', type=float, default=1.0, help='simulator time scale, e.g. 20 for fast tests')
    parser.add_argument('--sim-faults', action='store_true', help='simulator injects random faults')
    args = parser.parse_args()
    set_machine(create_machine(args.machine, sim_speed=args.sim_speed, sim_faults=args.sim_faults))
    print(f'First Brew: http://{args.host}:{args.port} · machine: {args.machine}', flush=True)
    ThreadingHTTPServer((args.host, args.port), Handler).serve_forever()
