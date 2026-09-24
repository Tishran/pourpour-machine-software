"""Validated plans and entitlements of the First Brew membership demo.

Prices are placeholders the team replaces in data/plans.json. There are no
payments or accounts: the chosen plan is a demo state on the device. `allowed`
is the reference for the browser's `can()`; the machine right belongs to the
owner of the machine and never depends on a paid plan.
"""

from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

from brew_catalog import DATA_DIR, CatalogError, fields, is_number, nonempty, read_json, require

PLANS_FILE = 'plans.json'
PLAN_IDS = ('free', 'member', 'machine_bundle')
ENTITLEMENTS = ('roaster_recipe', 'learn_why', 'builder', 'recipe_adjust', 'champion_recipes',
                'school_intro', 'school_full', 'experiments', 'journal_recent', 'journal_full',
                'own_recipes', 'machine_brew')
LIMITS = ('free_builder_tries', 'free_adjustments', 'own_recipes_free', 'journal_recent')
ACCESS = {'free', 'member', 'machine_owner'}
# Always free: the entry into the product and the owner's machine (principles 1 and 2).
ALWAYS_FREE = {'roaster_recipe', 'learn_why', 'school_intro', 'journal_recent'}


def localized(value, where, limit=240):
    require(isinstance(value, dict) and set(value) == {'ru', 'en'}, where, 'expected ru and en texts')
    for language in ('ru', 'en'):
        text = value[language]
        require(isinstance(text, str) and text == text.strip() and 0 < len(text) <= limit,
                f'{where}.{language}', f'expected a trimmed text up to {limit} characters')


def whole_rub(value, where):
    require(is_number(value) and isinstance(value, int) and value >= 0, where, 'expected whole rubles')


def validate_price(value, where):
    if isinstance(value, dict):
        fields(value, where, ('min', 'max'))
        require(set(value) == {'min', 'max'}, where, 'a price range has only min and max')
        whole_rub(value['min'], f'{where}.min')
        whole_rub(value['max'], f'{where}.max')
        require(value['min'] < value['max'], where, 'min must be below max')
    else:
        whole_rub(value, where)


def load_plans(data_dir=DATA_DIR):
    """Read plans.json and reject unknown plans, rights, limits or broken references."""
    data = read_json(Path(data_dir) / PLANS_FILE)
    where = 'plans'
    fields(data, where, ('schema_version', 'currency', 'cafe_cup_rub', 'home_cup_rub', 'price_is_hypothesis',
                         'survey_url', 'limits', 'entitlements', 'plans'))
    require(data['schema_version'] == 1, where, 'unsupported schema version')
    require(data['currency'] == 'RUB', where, 'prices are in rubles')
    whole_rub(data['cafe_cup_rub'], f'{where}.cafe_cup_rub')
    whole_rub(data['home_cup_rub'], f'{where}.home_cup_rub')
    require(data['cafe_cup_rub'] > data['home_cup_rub'] > 0, where, 'a café cup must cost more than a home cup')
    require(isinstance(data['price_is_hypothesis'], bool), where, 'price_is_hypothesis must be true or false')
    survey = urlsplit(data['survey_url']) if isinstance(data['survey_url'], str) else None
    require(survey is not None and survey.scheme == 'https' and bool(survey.hostname), where, 'survey_url must be HTTPS')

    limits = data['limits']
    require(isinstance(limits, dict) and set(limits) == set(LIMITS), f'{where}.limits', f'expected {", ".join(LIMITS)}')
    for name, value in limits.items():
        require(isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 1000,
                f'{where}.limits.{name}', 'expected a whole number')

    rights = data['entitlements']
    require(isinstance(rights, dict) and set(rights) == set(ENTITLEMENTS), f'{where}.entitlements',
            f'expected exactly {", ".join(ENTITLEMENTS)}')
    for name, rule in rights.items():
        point = f'{where}.entitlements.{name}'
        fields(rule, point, ('access', 'benefit'))
        require(set(rule) <= {'access', 'benefit', 'free_limit'}, point, 'unknown rule field')
        require(rule['access'] in ACCESS, point, 'unknown access level')
        localized(rule['benefit'], f'{point}.benefit', 160)
        if 'free_limit' in rule:
            require(rule['access'] == 'member' and rule['free_limit'] in limits, point, 'free_limit must name a limit')
        if name in ALWAYS_FREE:
            require(rule['access'] == 'free', point, 'this right is always free')
    require(rights['machine_brew']['access'] == 'machine_owner', f'{where}.entitlements.machine_brew',
            'the machine right belongs to its owner, not to a paid plan')

    plans = data['plans']
    require(isinstance(plans, list) and [plan.get('id') if isinstance(plan, dict) else None for plan in plans] == list(PLAN_IDS),
            f'{where}.plans', f'expected plans {", ".join(PLAN_IDS)} in this order')
    for plan in plans:
        point = f'{where}.plans.{plan["id"]}'
        required = ['id', 'name', 'tagline', 'role', 'price_rub', 'price_note', 'features', 'cta']
        if plan['id'] == 'member':
            required.append('period')
        if plan['id'] == 'machine_bundle':
            required.append('included_months')
        fields(plan, point, required)
        require(set(plan) == set(required), point, 'unknown plan field')
        for key in ('name', 'tagline', 'role', 'price_note'):
            localized(plan[key], f'{point}.{key}', 80)
        validate_price(plan['price_rub'], f'{point}.price_rub')
        if 'period' in plan:
            require(plan['period'] in ('month', 'year'), point, 'period must be month or year')
        if 'included_months' in plan:
            months = plan['included_months']
            require(isinstance(months, int) and not isinstance(months, bool) and 1 <= months <= 24,
                    point, 'included_months must be 1–24')
        require(plan['cta'] in ('demo', 'survey'), point, 'cta must be demo or survey')
        require(isinstance(plan['features'], list) and 0 < len(plan['features']) <= 8, point, 'expected 1–8 features')
        for index, feature in enumerate(plan['features']):
            spot = f'{point}.features[{index}]'
            fields(feature, spot, ('entitlement', 'ru', 'en'))
            require(set(feature) <= {'entitlement', 'ru', 'en', 'status'}, spot, 'unknown feature field')
            require(feature['entitlement'] is None or feature['entitlement'] in rights, spot, 'unknown entitlement')
            require(feature.get('status', 'available') in ('available', 'coming'), spot, 'status must be available or coming')
            localized({'ru': feature['ru'], 'en': feature['en']}, spot, 80)
    require(plans[0]['price_rub'] == 0, f'{where}.plans.free', 'the free plan costs nothing')
    return data


def effective_plan(state, today=None):
    """The plan in force: included months of a machine bundle end on their date."""
    plan = state.get('plan') if isinstance(state, dict) else None
    if plan != 'member':
        return 'free'
    until = state.get('includedUntil')
    if until:
        try:
            if (today or date.today()) > date.fromisoformat(until):
                return 'free'
        except (TypeError, ValueError):
            return 'free'
    return 'member'


def allowed(plans, state, feature, used=0, today=None):
    """Whether a right is available: the same rule as can() in the browser."""
    rule = plans['entitlements'].get(feature)
    if rule is None:
        raise CatalogError(f'unknown entitlement: {feature}')
    if rule['access'] == 'free':
        return True
    if rule['access'] == 'machine_owner':
        # Never a paid-plan check: without membership the machine keeps brewing.
        return bool(isinstance(state, dict) and state.get('machineOwner') is True)
    if effective_plan(state, today) == 'member':
        return True
    limit = rule.get('free_limit')
    return limit is not None and used < plans['limits'][limit]
