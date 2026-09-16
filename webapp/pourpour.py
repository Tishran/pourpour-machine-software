"""Welder Catherine catalogue and recipe adapter. Python 3.11+, stdlib only."""
import hashlib
import json
import math
import re
import threading
import time
import unicodedata
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
from difflib import SequenceMatcher

SITE = 'https://theweldercatherine.ru'
FEED = SITE + '/bitrix/catalog_export/yandex_848006.php'
API = 'https://recipes.theweldercatherine.ru/api/v1/recipes'
CACHE_DIR = Path(__file__).parent / '.cache'
HOSTS = {'theweldercatherine.ru', 'recipes.theweldercatherine.ru'}


class SourceError(Exception):
    pass


def safe_url(url):
    p = urlsplit(url)
    return (p.scheme == 'https' and p.hostname in HOSTS and p.port in (None, 443)
            and not p.username and not p.password)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise SourceError('Источник перенаправил запрос. Попробуйте позже.')


def download(url):
    if not safe_url(url):
        raise SourceError('Недопустимый адрес источника.')
    request = urllib.request.Request(url, headers={'User-Agent': 'FirstBrew/0.1 (coffee recipe lookup)',
                                                  'Accept': 'application/json, application/xml, text/html'})
    try:
        with urllib.request.build_opener(NoRedirect).open(request, timeout=15) as response:
            data = response.read(8_000_001)
            if len(data) > 8_000_000:
                raise SourceError('Ответ источника слишком большой.')
            return data.decode('utf-8-sig')
    except (urllib.error.URLError, TimeoutError, OSError, UnicodeError) as exc:
        raise SourceError('Сайт Welder Catherine сейчас недоступен. Попробуйте ещё раз позже.') from exc


class SourceCache:
    """Bounded catalogue/recipe cache, single-flight requests and explicit stale metadata."""
    def __init__(self, path=CACHE_DIR, fetch=download):
        self.path, self.fetch = Path(path), fetch
        self.lock = threading.Lock()
        self.last_request = 0.0

    def get(self, url, ttl, parse):
        with self.lock:
            file = self.path / (hashlib.sha256(url.encode()).hexdigest() + '.json')
            saved = None
            try:
                saved = json.loads(file.read_text())
                if not isinstance(saved.get('fetched_at'), (int, float)):
                    saved = None
            except (OSError, ValueError, AttributeError):
                pass
            if saved and time.time() - saved['fetched_at'] < ttl:
                return saved['value'], self.meta(saved, False)
            try:
                time.sleep(max(0, .35 - (time.monotonic() - self.last_request)))
                self.last_request = time.monotonic()
                value = parse(self.fetch(url))
                saved = {'fetched_at': time.time(), 'value': value}
                try:
                    self.path.mkdir(parents=True, exist_ok=True)
                    tmp = file.with_suffix('.tmp')
                    tmp.write_text(json.dumps(saved, ensure_ascii=False))
                    tmp.replace(file)
                except OSError:
                    pass  # A read-only disk must not stop a live lookup.
                return value, self.meta(saved, False)
            except (SourceError, ValueError, TypeError, KeyError, ET.ParseError) as exc:
                if saved and time.time() - saved['fetched_at'] <= 7 * 86400:
                    return saved['value'], self.meta(saved, True)
                raise SourceError('Не удалось получить данные Welder Catherine. Попробуйте позже.') from exc

    @staticmethod
    def meta(saved, stale):
        return {'fetched_at': datetime.fromtimestamp(saved['fetched_at'], timezone.utc).isoformat(),
                'stale': stale}


def parse_catalog(xml):
    if '<!ENTITY' in xml.upper() or re.search(r'<!DOCTYPE[^>]*\[', xml, re.I):
        raise SourceError('Неподдерживаемый формат каталога.')
    # YML includes an external shops.dtd declaration. ElementTree does not
    # load it; remove the declaration and reject internal entity definitions.
    xml = re.sub(r'<!DOCTYPE[^>]*>', '', xml, flags=re.I)
    root = ET.fromstring(xml)
    products = {}
    for offer in root.findall('.//offer'):
        name, url = offer.findtext('name', '').strip(), offer.findtext('url', '').strip()
        if not re.search(r'\(под фильтр\s*/', name, re.I):
            continue
        if not safe_url(url) or not urlsplit(url).path.startswith('/catalog/'):
            continue
        if url not in products:
            products[url] = {
                'id': hashlib.sha256(url.encode()).hexdigest()[:16],
                'name': re.sub(r'\s*\(под фильтр/.*$', '', name, flags=re.I).strip(),
                'url': url, 'region': '', 'available': False,
            }
        product = products[url]
        product['available'] |= offer.get('available') == 'true'
        product['region'] = next((p.text or '' for p in offer.findall('param')
                                  if p.get('name') == 'Регион'), product['region'])
    if not products:
        raise SourceError('Структура каталога изменилась.')
    return sorted(products.values(), key=lambda p: p['name'])


TRANSLIT = dict(zip('абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
                    ['a','b','v','g','d','e','e','zh','z','i','i','k','l','m','n','o','p','r','s','t','u','f','kh','ts','ch','sh','shch','','y','','e','yu','ya']))


def normalize(text):
    text = unicodedata.normalize('NFKC', text).lower()
    text = ''.join(TRANSLIT.get(c, c) for c in text)
    return ' '.join(re.findall(r'[a-z0-9]+', text))


def search_products(products, query):
    query = normalize(query)
    if not query:
        return [dict(p, match='catalog') for p in products]
    exact, similar = [], []
    for p in products:
        name = normalize(p['name'])
        if all(token in name for token in query.split()):
            exact.append(dict(p, match='exact' if query == name else 'partial'))
        else:
            score = max(SequenceMatcher(None, query, name).ratio(),
                        max((SequenceMatcher(None, query, token).ratio() for token in name.split()), default=0))
            if len(query) >= 4 and score >= .76:
                similar.append((score, dict(p, match='similar')))
    return sorted(exact, key=lambda p: (p['match'] != 'exact', p['name'])) or [
        p for _, p in sorted(similar, key=lambda pair: -pair[0])[:8]]


class ProductParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.product_id = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id') == 'recipe-template':
            value = attrs.get('data-id', '')
            if re.fullmatch(r'\d{1,12}', value):
                self.product_id = value


def parse_product(html):
    parser = ProductParser()
    parser.feed(html)
    if not parser.product_id:
        raise SourceError('На странице кофе не найден блок рецептов.')
    return parser.product_id


def seconds(value):
    # Source uses Go-like durations including "s", "1ms" and "2ms" for
    # 0 seconds, 1 minute and 2 minutes respectively (NOT milliseconds).
    if not isinstance(value, str) or not re.fullmatch(r'(?:(\d+)h)?(?:(\d+)m)?(?:(\d*)s)?', value) or not value:
        return None
    parts = re.fullmatch(r'(?:(\d+)h)?(?:(\d+)m)?(?:(\d*)s)?', value)
    h, m, s = parts.groups()
    return int(h or 0) * 3600 + int(m or 0) * 60 + int(s or 0)


def positive(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value > 0 else None


def parse_recipes(body):
    response = json.loads(body)
    if not isinstance(response, dict) or response.get('status') != 'OK' or not isinstance(response.get('value'), list):
        raise SourceError('Неожиданный ответ сервиса рецептов.')
    recipes = []
    for raw in response['value']:
        if not isinstance(raw, dict):
            raise SourceError('Неожиданный формат рецепта.')
        device = raw.get('device') or {}
        if not isinstance(device, dict):
            raise SourceError('Неожиданный формат оборудования.')
        if device.get('kind') != 'DRIPPER':
            continue
        steps, cumulative = [], 0
        warnings = []
        raw_steps = raw.get('steps') or []
        if not isinstance(raw_steps, list) or any(not isinstance(s, dict) or
                not isinstance(s.get('seq_num'), (int, float)) for s in raw_steps):
            raise SourceError('Неожиданный формат шагов рецепта.')
        for step in sorted(raw_steps, key=lambda s: s['seq_num']):
            water = positive(step.get('water'))
            cumulative = cumulative + water if cumulative is not None and water is not None else None
            steps.append({'instruction': str(step.get('instruction') or '').strip(),
                          'water_g': water, 'total_water_g': cumulative,
                          'temperature_c': positive(step.get('temperature')),
                          'start_seconds': seconds(step.get('start')), 'stop_seconds': seconds(step.get('stop'))})
        dose, water, temp = (positive(raw.get(k)) for k in ('load', 'water', 'temperature'))
        duration = seconds(raw.get('time')) or None
        if not all((dose, water, temp, duration)) or not steps:
            warnings.append('В источнике не заполнена часть параметров рецепта.')
        if steps and water and cumulative is not None and abs(cumulative - water) > .5:
            warnings.append('Сумма вливаний в источнике отличается от общего количества воды.')
        if any(s['start_seconds'] is None or s['stop_seconds'] is None or
               s['stop_seconds'] < s['start_seconds'] for s in steps):
            warnings.append('В источнике есть неполное или некорректное время вливаний.')
        grinder = raw.get('grinder') or {}
        if not isinstance(grinder, dict):
            raise SourceError('Неожиданный формат кофемолки.')
        setting = raw.get('grind_step')
        sub = raw.get('grind_sub_step')
        recipe = {'name': str(raw.get('name') or ''),
                  'device': ' '.join(str(device.get(k) or '') for k in ('manufacturer', 'model')).strip(),
                  'coffee_g': dose, 'water_g': water, 'temperature_c': temp,
                  'duration_seconds': duration, 'ratio': round(water / dose, 1) if dose and water else None,
                  'grinder': ' '.join(str(grinder.get(k) or '') for k in ('manufacturer', 'model')).strip(),
                  'grind_setting': f'{setting}.{sub}' if positive(setting) and sub is not None else None,
                  'steps': steps, 'notes': str(raw.get('notes') or '').strip(), 'warnings': warnings}
        if recipe not in recipes:
            recipes.append(recipe)
    return recipes


def scan_label(image_bytes, content_type):
    """Recognize a package locally; retain the scan endpoint's response contract."""
    if content_type.split(';')[0] not in ('image/jpeg', 'image/png'):
        raise ValueError('A JPEG or PNG photo is required.')
    if __package__:
        from .label_ocr import extract
    else:
        from label_ocr import extract
    ocr = extract(image_bytes)
    return {'status': 'needs_confirmation' if ocr['needs_review'] else 'ok',
            'text': ocr['text'], 'candidates': [], 'ocr': ocr,
            'message': 'Review the recognized label before preparing a recipe.'}


class CoffeeService:
    def __init__(self, cache=None):
        self.cache = cache or SourceCache()

    def search(self, query):
        products, meta = self.cache.get(FEED, 6 * 3600, parse_catalog)
        matches = search_products(products, query)
        return {'products': matches[:60], 'total': len(matches), 'catalog_size': len(products),
                'source': meta, 'scope': 'filter_catalog'}

    def recipe(self, product_key):
        products, catalog_meta = self.cache.get(FEED, 6 * 3600, parse_catalog)
        product = next((p for p in products if p['id'] == product_key), None)
        if not product:
            raise KeyError('Кофе не найден в текущем каталоге.')
        product_id, page_meta = self.cache.get(product['url'], 86400, parse_product)
        source_url = f'{API}?product_id={product_id}&view=true'
        recipes, meta = self.cache.get(source_url, 3600, parse_recipes)
        return {'product': product, 'recipes': recipes, 'source_url': source_url,
                'source': meta, 'catalog_source': catalog_meta, 'product_source': page_meta,
                'stale': any(m['stale'] for m in (meta, catalog_meta, page_meta))}
