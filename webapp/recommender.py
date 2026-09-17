"""Coffee label parsing and a fitted TF-IDF nearest-neighbor recipe model.

The model transfers an intact, validated reference recipe. It does not claim
that a recommendation is a measured optimum for an unseen coffee.
"""
from collections import Counter
from difflib import SequenceMatcher
import hashlib
import json
import math
from pathlib import Path
import re
from statistics import median
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = ROOT / 'ml' / 'artifacts' / 'model.json'
MODEL_VERSION = 'tfidf-reference-v1'
RECOMMENDATION_POLICY = 'progressive-fallback-v2'
FEATURE_WEIGHTS = {'country': 2.0, 'processing': 2.0, 'variety': 1.5, 'region': 1.0, 'flavor': .5}

COUNTRIES = {
    'BO': ['боливия', 'bolivia'], 'BR': ['бразилия', 'brazil'],
    'BI': ['бурунди', 'burundi'], 'GT': ['гватемала', 'guatemala'],
    'HN': ['гондурас', 'honduras'], 'ID': ['индонезия', 'indonesia', 'ява', 'java'],
    'KE': ['кения', 'kenya'], 'CO': ['колумбия', 'colombia'],
    'CR': ['коста рика', 'costa rica'], 'PE': ['перу', 'peru'],
    'RW': ['руанда', 'rwanda'], 'TZ': ['танзания', 'tanzania'],
    'ET': ['эфиопия', 'ethiopia'], 'UG': ['уганда', 'uganda'],
    'PA': ['панама', 'panama'], 'SV': ['сальвадор', 'el salvador'],
    'NI': ['никарагуа', 'nicaragua'], 'MX': ['мексика', 'mexico'],
    'EC': ['эквадор', 'ecuador'], 'IN': ['индия', 'india'], 'VN': ['вьетнам', 'vietnam'],
}
PROCESSING = {
    'washed': ['мытый', 'мытая', 'washed'],
    'natural': ['натуральный', 'натуральная', 'сухой', 'сухая', 'natural'],
    'honey': ['хани', 'honey'],
    'anaerobic': ['анаэробный', 'анаэробная', 'анаэробной', 'анаэроб', 'anaerobic'],
}
VARIETIES = {
    'bourbon': ['бурбон', 'bourbon'], 'pink_bourbon': ['розовый бурбон', 'pink bourbon'],
    'red_bourbon': ['красный бурбон', 'red bourbon'], 'caturra': ['катурра', 'caturra'],
    'catuai': ['катуаи', 'catuai'], 'typica': ['типика', 'типики', 'typica'],
    'sl28': ['sl 28', 'sl28'], 'sl34': ['sl 34', 'sl34'],
    'ruiru11': ['руиру 11', 'руиру11', 'ruiru 11', 'ruiru11'],
    'batian': ['батиан', 'batian'], 'java': ['ява', 'java'],
    'pacamara': ['пакамара', 'pacamara'], 'gesha': ['гейша', 'gesha', 'geisha'],
    'f6': ['ф6', 'f6'], 'h10': ['h 10', 'h10'], 'caturron': ['катуррон', 'caturron'],
    'ateng': ['атенг супер', 'ateng super'], 'sigarar': ['сигарар утанг', 'sigarar utang'],
}
TRANSLIT = dict(zip('абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
                   ['a','b','v','g','d','e','e','zh','z','i','i','k','l','m','n','o','p','r','s','t','u','f','kh','ts','ch','sh','shch','','y','','e','yu','ya']))


def norm(value):
    value = unicodedata.normalize('NFKD', str(value or '')).casefold().replace('ё', 'е')
    value = ''.join(c for c in value if not unicodedata.combining(c))
    return ' '.join(re.findall(r'[a-zа-я0-9]+', value))


def translit(value):
    return ''.join(TRANSLIT.get(c, c) for c in norm(value))


def visual_text(value):
    # OCR often mixes visually identical Latin/Cyrillic letters: Суса -> Cyca.
    # Used only for name comparison; the extracted label remains unmodified.
    return norm(value).translate(str.maketrans('авекмнорстух', 'abekmhopctyx'))


def contains(text, phrase):
    return f' {norm(phrase)} ' in f' {norm(text)} '


def tags(text, vocabulary):
    return sorted(key for key, aliases in vocabulary.items() if any(contains(text, a) for a in aliases))


def field(text, aliases):
    for line in text.splitlines():
        match = re.match(r'^\s*([^:=]{1,50})\s*[:=]\s*(.+)$', line)
        if match and norm(match[1]) in aliases:
            return match[2].strip()
    return None


def parse_label(text):
    if not isinstance(text, str) or len(text) > 10000:
        raise ValueError('Label text must be shorter than 10,000 characters.')
    country_line = field(text, ['страна', 'country', 'origin'])
    # Search the whole label, excluding descriptive fields that can mention a
    # country/Java variety without naming the coffee's origin.
    description_fields = {'разновидность', 'сорт', 'variety', 'varietal', 'varieties',
                          'обжарщик', 'roaster', 'вкус', 'букет', 'notes', 'tasting notes'}
    origin_text = country_line or '\n'.join(line for line in text.splitlines()
                                            if norm(line.partition(':')[0]) not in description_fields)
    countries = tags(origin_text, COUNTRIES)
    processing_line = field(text, ['обработка', 'способ обработки', 'process', 'processing'])
    variety_line = field(text, ['разновидность', 'разновидности', 'сорт', 'variety', 'varietal', 'varieties'])
    roaster = field(text, ['обжарщик', 'roaster'])
    brand_known = any(contains(text, a) for a in ['the welder catherine', 'welder catherine', 'сварщица екатерина'])
    if brand_known and not roaster:
        roaster = 'The Welder Catherine'
    decaf = any(contains(text, a) for a in ['декаф', 'decaf', 'decaffeinated', 'без кофеина'])
    espresso = any(contains(text, a) for a in ['эспрессо', 'espresso', 'темная обжарка', 'dark roast'])
    return {
        'name': field(text, ['название', 'кофе', 'name', 'coffee']),
        'roaster': roaster, 'welder_brand_present': brand_known,
        'country': countries[0] if len(countries) == 1 else None,
        'processing': tags(processing_line or text, PROCESSING),
        'variety': tags(variety_line, VARIETIES) if variety_line else [],
        'region': field(text, ['регион', 'region']),
        'flavor': field(text, ['вкус', 'букет', 'ноты', 'дескрипторы', 'flavor', 'flavour', 'notes', 'tasting notes']),
        'decaf': decaf, 'espresso_or_dark': espresso,
        'warnings': (['Multiple countries found; check the origin on the label.'] if len(countries) > 1 else []),
    }


def coffee_profile(coffee):
    f = coffee['features']
    return {
        'country': f.get('country_code'), 'processing': tags(f.get('processing'), PROCESSING),
        'variety': tags(f.get('variety'), VARIETIES), 'region': f.get('region'), 'flavor': f.get('flavor'),
        'decaf': any(contains(coffee['name'], a) for a in ['декаф', 'decaf']),
    }


def feature_tokens(profile):
    result = Counter()
    for name, weight in FEATURE_WEIGHTS.items():
        value = profile.get(name)
        if not value:
            continue
        values = value if isinstance(value, list) else ([value] if name == 'country' else norm(value).split())
        for v in set(values):
            result[f'{name}:{v}'] = weight
    return result


def fit(profiles):
    documents = [feature_tokens(p) for p in profiles]
    df = Counter(t for d in documents for t in d)
    idf = {t: math.log((1 + len(documents)) / (1 + n)) + 1 for t, n in sorted(df.items())}
    return idf


def vector(profile, idf):
    values = {k: weight * idf[k] for k, weight in feature_tokens(profile).items() if k in idf}
    length = math.sqrt(sum(v * v for v in values.values()))
    return {k: v / length for k, v in values.items()} if length else {}


def rank(profile, rows, idf):
    query = vector(profile, idf)
    scored = []
    for row in rows:
        p = row['profile']
        # Do not transfer caffeinated recipes to decaf or the reverse.
        if bool(p.get('decaf')) != bool(profile.get('decaf')):
            continue
        candidate = vector(p, idf)
        score = sum(v * candidate.get(k, 0) for k, v in query.items())
        scored.append((score, row))
    return sorted(scored, key=lambda x: (-x[0], x[1]['coffee']['coffee_id']))


def supported(profile, reference, similarity):
    same_country = bool(profile.get('country')) and profile['country'] == reference.get('country')
    shared_process = set(profile.get('processing', [])) & set(reference.get('processing', []))
    # Matching fermentation alone is insufficient; washed/natural/honey must agree.
    base_process = shared_process & {'washed', 'natural', 'honey'}
    return same_country and bool(base_process) and similarity >= .3


def representative(rows):
    """Select an intact recipe closest to the group's median brewing parameters.

    Fixed scales express one meaningful unit per target. No new pour schedule
    is synthesized, and missing label features are never imputed from the donor.
    """
    if not rows:
        raise ValueError('No checked reference recipes are available.')
    scales = {'coffee_g': 1, 'water_to_coffee_ratio': 1, 'temperature_c': 1,
              'duration_seconds': 30}
    centers = {key: median(row['recipe'][key] for row in rows) for key in scales}
    def distance(row):
        return sum(abs(row['recipe'][key] - centers[key]) / scale for key, scale in scales.items())
    return min(rows, key=lambda row: (distance(row), len(row['recipe']['quality_issues']), row['coffee']['coffee_id']))


def ui_recipe(raw):
    issue_text = {
        'missing_step_temperature': 'The source recipe omits the temperature of one pour.',
        'step_water_sum_mismatch': 'The source pour amounts do not match the stated total water.',
        'invalid_step_time': 'The source contains an invalid pour time.',
        'missing_duration_seconds': 'The source contains an invalid total duration.',
    }
    return {
        'name': raw['name'],
        'device': ' '.join(str(raw['device'].get(k) or '') for k in ('manufacturer', 'model')).strip(),
        'grinder': ' '.join(str(raw['grinder'].get(k) or '') for k in ('manufacturer', 'model')).strip(),
        'grind_setting': raw['grind_setting_display'],
        'coffee_g': raw['coffee_g'], 'water_g': raw['water_g'], 'temperature_c': raw['temperature_c'],
        'duration_seconds': raw['duration_seconds'], 'ratio': round(raw['water_to_coffee_ratio'], 2) if raw['water_to_coffee_ratio'] else None,
        'steps': [dict(s, total_water_g=s['cumulative_water_g']) for s in raw['steps']],
        'notes': raw['notes'], 'warnings': [issue_text.get(i['code'], i['code']) for i in raw['quality_issues']],
    }


class RecipeModel:
    def __init__(self, path=MODEL_PATH):
        self.model = json.loads(Path(path).read_text(encoding='utf-8'))
        if self.model['version'] != MODEL_VERSION:
            raise ValueError('Unsupported model version.')
        self.rows = self.model['rows']
        self.by_id = {row['coffee']['coffee_id']: row for row in self.rows}

    def identity_candidates(self, text):
        normalized = translit(text)
        visual = visual_text(text)
        results = []
        for row in self.rows:
            c = row['coffee']
            name = translit(c['name'])
            visual_name = visual_text(c['name'])
            exact = f' {name} ' in f' {normalized} ' or f' {visual_name} ' in f' {visual} '
            tokens = normalized.split()
            n = len(name.split())
            # Compare name-sized windows, so bag text does not dilute the name match.
            score = 1.0 if exact else max((SequenceMatcher(None, target, ' '.join(words[i:i+n])).ratio()
                                           for words, target in ((tokens, name), (visual.split(), visual_name))
                                           for i in range(max(0, len(words)-n+1))), default=0)
            if score >= .78:
                results.append({'coffee_id': c['coffee_id'], 'name': c['name'],
                                'name_similarity': round(score, 4), 'exact_name': exact,
                                'url': c['url']})
        return sorted(results, key=lambda c: (-c['name_similarity'], -len(c['name'])))[:5]

    def recommend(self, text, selected_coffee_id=None):
        profile = parse_label(text)
        candidates = self.identity_candidates(text)
        result = {'model_version': self.model['version'], 'policy_version': RECOMMENDATION_POLICY,
                  'dataset_snapshot': self.model['dataset_snapshot'],
                  'label': profile, 'candidates': candidates, 'kind': 'insufficient_data',
                  'message': '', 'recipe_data': None, 'neighbors': []}
        exact = [c for c in candidates if c['exact_name']]
        selected = self.by_id.get(selected_coffee_id) if selected_coffee_id else None
        if selected_coffee_id and not selected:
            raise ValueError('The selected coffee is not in the model.')
        # Preserve the photo-only flow: use a strong name match immediately.
        if not selected and candidates and (exact or candidates[0]['name_similarity'] >= .86):
            selected = self.by_id[(exact[0] if exact else candidates[0])['coffee_id']]
        if selected:
            if not selected['usable']:
                return self.baseline(result, reason='The matched source recipe has errors. This is a separate starting recipe, not a repaired version.')
            result.update(kind='catalog_match', message='Matched the saved catalog. Check the lot, harvest and filter roast on your bag.')
            result['recipe_data'] = self.response_recipe(selected, result['kind'], selected['coffee']['name'])
            return result
        if profile['espresso_or_dark'] or profile['decaf']:
            return self.baseline(result, general=True)
        if not profile['country'] or not (set(profile['processing']) & {'washed', 'natural', 'honey'}):
            return self.baseline(result)
        ranked = rank(profile, [r for r in self.rows if r['usable']], self.model['idf'])
        result['neighbors'] = [{'name': row['coffee']['name'], 'coffee_id': row['coffee']['coffee_id'],
                                'url': row['coffee']['url'], 'similarity': round(score, 4)} for score, row in ranked[:3]]
        # Choose only a supported neighbor, not an unrelated best-scoring recipe.
        eligible = [(s, r) for s, r in ranked if supported(profile, r['profile'], s)]
        if not eligible:
            return self.baseline(result)
        score, reference = eligible[0]
        result.update(kind='closest_reference', similarity=round(score, 4),
                      message='A starting recipe from a similar coffee. Taste is untested on your coffee; the grind setting applies only to the listed grinder.')
        result['recipe_data'] = self.response_recipe(reference, result['kind'], profile['name'] or 'Your coffee')
        return result

    def baseline(self, result, general=False, reason=None):
        profile = result['label']
        if profile['decaf'] or profile['espresso_or_dark']:
            general = True
            reason = (reason + ' ' if reason else '') + 'The dataset cannot tailor this reference to decaf, espresso or dark roast.'
        pool = [r for r in self.rows if r['usable'] and not r['profile'].get('decaf')]
        scope, matched = 'general', []
        base = set(profile['processing']) & {'washed', 'natural', 'honey'}
        if not general:
            country_pool = [r for r in pool if profile['country'] and r['profile']['country'] == profile['country']]
            if country_pool:
                pool, scope, matched = country_pool, 'country', ['country']
            process_pool = [r for r in pool if base and base == (set(r['profile']['processing']) & {'washed', 'natural', 'honey'})]
            if process_pool:
                pool = process_pool
                scope = 'country_processing' if country_pool else 'processing'
                matched.append('processing')
        reference = representative(pool)
        country_name = COUNTRIES[profile['country']][1].title() if profile['country'] in COUNTRIES else None
        descriptions = {
            'general': 'A general V60 starting recipe from the checked dataset.',
            'country': f'A starting recipe based on {len(pool)} checked coffees from {country_name}. Processing is not assumed.',
            'country_processing': f'A starting recipe based on {len(pool)} checked coffees with this country and base processing.',
            'processing': f'A starting recipe based on {len(pool)} checked coffees with this base processing; origin is not matched.',
        }
        missing = [key for key in ('country', 'processing', 'variety', 'region', 'flavor')
                   if not (base if key == 'processing' else profile.get(key))]
        unmatched = [key for key in ('country', 'processing') if profile.get(key) and key not in matched]
        message = descriptions[scope]
        if missing:
            message += ' Not read: ' + ', '.join(missing) + '.'
        if unmatched:
            message += ' Not matched: ' + ', '.join(unmatched) + '.'
        if reason:
            message = reason + ' ' + message
        basis = {'scope': scope, 'reference_count': len(pool), 'matched_fields': matched,
                 'missing_fields': missing, 'unmatched_fields': unmatched}
        result.update(kind='suggested_baseline', message=message, basis=basis)
        title = profile['name'] or (f'{country_name} · starting recipe' if country_name else 'Your coffee · starting recipe')
        result['recipe_data'] = self.response_recipe(reference, 'suggested_baseline', title)
        result['recipe_data'].update(basis=basis, explanation=message,
                                    recipe_subtitle='Dataset starting recipe · ' + scope.replace('_', ' '))
        return result

    def response_recipe(self, row, kind, title):
        recipe = row['recipe']
        c = row['coffee']
        return {
            'product': {'name': title, 'url': c['url']}, 'recipes': [ui_recipe(recipe)],
            'source': {'fetched_at': recipe['source']['fetched_at']}, 'stale': False,
            'source_url': recipe['source']['url'], 'recommendation_kind': kind,
            'reference_name': c['name'], 'snapshot': self.model['dataset_snapshot'],
            'recipe_subtitle': ('Saved recipe from The Welder Catherine' if kind == 'catalog_match'
                                else 'Suggested reference recipe: ' + c['name']),
        }


def dataset_rows(snapshot):
    path = Path(snapshot) / 'processed'
    coffees = [json.loads(line) for line in (path / 'coffees.jsonl').read_text().splitlines()]
    recipes = [json.loads(line) for line in (path / 'recipes.jsonl').read_text().splitlines()]
    rows = []
    for c in coffees:
        matching = [r for r in recipes if r['coffee_id'] == c['coffee_id']]
        # Stable selection; multiple source variants remain in the canonical dataset.
        matching.sort(key=lambda r: (not (r['scalar_targets_usable'] and r['schedule_usable']), r['recipe_id']))
        if not matching:
            continue
        recipe = matching[0]
        rows.append({'coffee': c, 'recipe': recipe, 'profile': coffee_profile(c),
                     'usable': bool(recipe['scalar_targets_usable'] and recipe['schedule_usable'] and c['recipe_status'] == 'has_pourover')})
    return rows


def train(snapshot, output):
    snapshot = Path(snapshot)
    rows = dataset_rows(snapshot)
    usable = [r for r in rows if r['usable']]
    if len(usable) < 2:
        raise ValueError('At least two coffees with checked recipes are required.')
    model = {'version': MODEL_VERSION, 'dataset_snapshot': snapshot.name,
             'algorithm': 'TF-IDF weighted categorical/text features; nearest reference recipe',
             'feature_weights': FEATURE_WEIGHTS,
             'source_sha256': {name: hashlib.sha256((snapshot / 'processed' / name).read_bytes()).hexdigest()
                               for name in ('coffees.jsonl', 'recipes.jsonl')},
             'idf': fit([r['profile'] for r in usable]), 'rows': rows}
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    Path(output).write_text(json.dumps(model, ensure_ascii=False, sort_keys=True, indent=2) + '\n', encoding='utf-8')
    return model
