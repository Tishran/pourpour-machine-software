"""Validated learning content: number explanations, timer notes, takeaways and the School.

Every text carries a `source` in the repository (docs/BREWING.md, the engine's own
texts or the reference data). Nothing here is reviewed by a barista yet, so the
course is marked "draft". Practice recipes are built by the engine at load time,
so a lesson can never ask for parameters the engine refuses.
"""

from pathlib import Path

from brew_catalog import DATA_DIR, fields, read_json, require
from brewing_engine import DIAGNOSIS_CODES, BrewingInputError, build

COURSE_FILE = 'course.json'
WHY_KEYS = ('dose', 'water', 'ratio', 'temperature', 'grind', 'grind_roaster', 'pours', 'time')
TIMER_KEYS = ('bloom', 'pour', 'wait', 'drawdown', 'fill', 'steep', 'press', 'drain', 'automatic')
SOURCES = ('docs/BREWING.md', 'brewing_engine', 'webapp/data/')
CARD_LIMIT = 280
EXPERIMENT_PARAMETERS = ('grind', 'temperature', 'ratio')


def text_pair(value, where, limit=CARD_LIMIT, *, source=True):
    names = ('ru', 'en', 'source') if source else ('ru', 'en')
    fields(value, where, names)
    require(set(value) == set(names), where, f'expected exactly {", ".join(names)}')
    for key in ('ru', 'en'):
        text = value[key]
        require(isinstance(text, str) and text == text.strip() and 0 < len(text) <= limit,
                f'{where}.{key}', f'expected a trimmed text up to {limit} characters')
    if source:
        require(isinstance(value['source'], str) and value['source'].startswith(SOURCES) and len(value['source']) <= 200,
                f'{where}.source', 'every text needs a source in the repository')


def keyed_texts(data, where, keys):
    require(isinstance(data, dict) and set(data) == set(keys), where, f'expected exactly {", ".join(keys)}')
    for key in keys:
        text_pair(data[key], f'{where}.{key}')


def validate_lesson(lesson, where, seen):
    fields(lesson, where, ('id', 'title', 'review', 'cards', 'practice', 'takeaway'))
    require(set(lesson) <= {'id', 'title', 'review', 'cards', 'practice', 'takeaway', 'conclusions', 'barista'},
            where, 'unknown lesson field')
    require(isinstance(lesson['id'], str) and lesson['id'].replace('_', '').isalnum() and lesson['id'] not in seen,
            where, 'lesson ids must be unique words')
    seen.add(lesson['id'])
    text_pair(lesson['title'], f'{where}.title', 80, source=False)
    require(lesson['review'] == 'draft', where, 'lessons stay drafts until a barista reviews them')
    require(isinstance(lesson['cards'], list) and 2 <= len(lesson['cards']) <= 4, where, 'expected 2–4 theory cards')
    for index, card in enumerate(lesson['cards']):
        text_pair(card, f'{where}.cards[{index}]')
    text_pair(lesson['takeaway'], f'{where}.takeaway')
    if 'barista' in lesson:
        require(isinstance(lesson['barista'], str) and 0 < len(lesson['barista']) <= 280, where,
                'barista: what a barista should write or check')
    practice = lesson['practice']
    fields(practice, f'{where}.practice', ('kind', 'params'))
    require(practice['kind'] in ('build', 'experiment'), where, 'practice is a build or an experiment')
    try:
        variants = build(practice['params'])
    except BrewingInputError as exc:
        require(False, f'{where}.practice.params', f'the engine refuses them: {exc}')
    if practice['kind'] == 'experiment':
        require(set(practice) == {'kind', 'params', 'vary'} and practice['vary'] in EXPERIMENT_PARAMETERS,
                where, f'an experiment varies one of {", ".join(EXPERIMENT_PARAMETERS)}')
        require(variants[0]['method'] == 'percolation', where, 'experiments use a pour-over recipe')
        conclusions = lesson.get('conclusions')
        keyed_texts(conclusions, f'{where}.conclusions', ('a', 'b', 'same'))
    else:
        require(set(practice) == {'kind', 'params'} and 'conclusions' not in lesson, where,
                'only experiments have conclusions')


def load_course(data_dir=DATA_DIR):
    """Read course.json and reject missing texts, sources or unusable practice recipes."""
    data = read_json(Path(data_dir) / COURSE_FILE)
    fields(data, 'course', ('schema_version', 'review', 'why', 'timer', 'takeaways', 'modules'))
    require(data['schema_version'] == 1, 'course', 'unsupported schema version')
    require(data['review'] == 'draft', 'course', 'the course is a draft until a barista reviews it')
    keyed_texts(data['why'], 'course.why', WHY_KEYS)
    keyed_texts(data['timer'], 'course.timer', TIMER_KEYS)
    keyed_texts(data['takeaways'], 'course.takeaways', DIAGNOSIS_CODES)
    modules = data['modules']
    require(isinstance(modules, list), 'course.modules', 'expected a list')
    module_ids, lesson_ids = set(), set()
    for index, module in enumerate(modules):
        where = f'course.modules[{index}]'
        fields(module, where, ('id', 'title', 'lessons'))
        require(set(module) == {'id', 'title', 'lessons'}, where, 'unknown module field')
        require(isinstance(module['id'], str) and module['id'] not in module_ids, where, 'module ids must be unique')
        module_ids.add(module['id'])
        text_pair(module['title'], f'{where}.title', 80, source=False)
        require(isinstance(module['lessons'], list) and module['lessons'], where, 'a module needs lessons')
        for number, lesson in enumerate(module['lessons']):
            validate_lesson(lesson, f'{where}.lessons[{number}]', lesson_ids)
    if modules:
        first = modules[0]['lessons'][0]
        require(first['practice']['kind'] == 'build', 'course', 'the free first lesson is not an experiment')
    return data
