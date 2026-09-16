"""python3 -m ml.train; train and evaluate a leave-one-coffee-out baseline."""
import argparse
import json
from pathlib import Path
from statistics import mean, median

from webapp.recommender import MODEL_PATH, ROOT, fit, rank, supported, train

SNAPSHOT = ROOT / 'data/welder_catherine/snapshots/20260916T114435680044Z'
TARGETS = ('temperature_c', 'duration_seconds', 'water_to_coffee_ratio')


def evaluate(rows):
    rows = [r for r in rows if r['usable']]
    predictions = []
    for held in rows:
        pool = [r for r in rows if r['coffee']['coffee_id'] != held['coffee']['coffee_id']]
        # Refit IDF without the held-out coffee; names, IDs and recipe targets are never features.
        idf = fit([r['profile'] for r in pool])
        ranking = rank(held['profile'], pool, idf)
        candidates = [(score, row) for score, row in ranking if supported(held['profile'], row['profile'], score)]
        if not candidates:
            continue
        score, neighbor = candidates[0]
        predictions.append({
            'coffee_id': held['coffee']['coffee_id'], 'reference_coffee_id': neighbor['coffee']['coffee_id'],
            'similarity': score,
            'actual': {t: held['recipe'][t] for t in TARGETS},
            'prediction': {t: neighbor['recipe'][t] for t in TARGETS},
            'training_median': {t: median(r['recipe'][t] for r in pool) for t in TARGETS},
        })
    errors = {t: {'model_mae': mean(abs(p['prediction'][t] - p['actual'][t]) for p in predictions),
                  'median_baseline_mae': mean(abs(p['training_median'][t] - p['actual'][t]) for p in predictions)}
              for t in TARGETS} if predictions else {}
    return {'protocol': 'leave-one-coffee-out; IDF refitted per fold; no recipe targets/names as inputs',
            'coffees': len(rows), 'predicted': len(predictions), 'abstained': len(rows)-len(predictions),
            'coverage': len(predictions)/len(rows) if rows else 0, 'errors_on_supported_coffees': errors,
            'limitations': ['One roaster, small sample; this is not a taste-quality evaluation.',
                            'Uses clean catalog characteristics, not held-out photos.',
                            'Shared farms and repeated recipe programs may make this evaluation optimistic.',
                            'Weights and acceptance thresholds are hand-set, not calibrated probabilities.',
                            'No evidence that transferring a recipe is optimal for a new coffee.'],
            'predictions': predictions}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--snapshot', type=Path, default=SNAPSHOT)
    parser.add_argument('--output', type=Path, default=MODEL_PATH)
    args = parser.parse_args()
    model = train(args.snapshot, args.output)
    report = evaluate(model['rows'])
    report['dataset_snapshot'] = model['dataset_snapshot']
    path = args.output.with_name('evaluation.json')
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'predictions'}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
