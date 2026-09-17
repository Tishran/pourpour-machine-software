"""Local neural OCR using Tesseract's pinned Russian/English LSTM weights."""
import csv
import io
import importlib.util
import os
import re
from pathlib import Path
import shutil
import struct
import subprocess
import tempfile
import threading
import time

DEFAULT_TESSDATA = Path(__file__).parent / '.cache' / 'tessdata'
MAX_IMAGE_BYTES = 8_000_000
MAX_PIXELS = 16_000_000
OCR_LOCK = threading.BoundedSemaphore(1)


def needs_review(text, confidence):
    """Two meaningful Unicode words and confidence >=70 are required.

    Punctuation/digits are separators, not evidence of a readable label.
    A single country is still useful, but must be confirmed by the user.
    """
    words = re.findall(r'[^\W\d_]{3,}', text, re.UNICODE)
    return confidence < 70 or len(words) < 2


class OCRError(Exception):
    pass


def configuration():
    binary = shutil.which('tesseract')
    data = Path(os.environ.get('POURPOUR_TESSDATA', DEFAULT_TESSDATA))
    ready = bool(binary and importlib.util.find_spec('PIL') and all((data / f'{lang}.traineddata').is_file() for lang in ('rus', 'eng')))
    return binary, data, ready


def status():
    _, _, ready = configuration()
    return {'available': ready, 'engine': 'Tesseract LSTM', 'languages': ['ru', 'en'],
            'privacy': 'local_only', 'max_bytes': MAX_IMAGE_BYTES,
            'message': '' if ready else 'Photo recognition needs Tesseract, Pillow and python3 -m ml.setup_ocr. You can enter label text manually.'}


def image_dimensions(payload):
    if payload.startswith(b'\x89PNG\r\n\x1a\n') and len(payload) >= 33 and payload[12:16] == b'IHDR':
        return (*struct.unpack('>II', payload[16:24]), '.png')
    if payload.startswith(b'\xff\xd8'):
        offset = 2
        while offset + 4 <= len(payload):
            if payload[offset] != 255:
                break
            while offset < len(payload) and payload[offset] == 255:
                offset += 1
            if offset >= len(payload):
                break
            marker = payload[offset]
            offset += 1
            if marker in (0xd9, 0xda):
                break
            if marker == 1 or 0xd0 <= marker <= 0xd8:
                continue
            if offset + 2 > len(payload):
                break
            length = int.from_bytes(payload[offset:offset+2], 'big')
            if length < 2 or offset + length > len(payload):
                break
            if marker in (0xc0, 0xc1, 0xc2) and length >= 8:
                height, width = struct.unpack('>HH', payload[offset+3:offset+7])
                return width, height, '.jpg'
            offset += length
    raise ValueError('A JPEG or PNG photo is required. Export the image and try again.')


def extract(payload):
    if not payload or len(payload) > MAX_IMAGE_BYTES:
        raise ValueError('The photo must be smaller than 8 MB.')
    width, height, suffix = image_dimensions(payload)
    if width < 40 or height < 40 or width * height > MAX_PIXELS:
        raise ValueError('Photo size must be between 40 × 40 pixels and 16 megapixels.')
    binary, data, ready = configuration()
    if not ready:
        raise OCRError(status()['message'])
    if not OCR_LOCK.acquire(blocking=False):
        raise OCRError('Another photo is still being processed. Try again in a few seconds.')
    try:
        from PIL import Image, ImageOps, UnidentifiedImageError
        with tempfile.TemporaryDirectory(prefix='pourpour-label-') as directory:
            try:
                with Image.open(io.BytesIO(payload)) as source:
                    if source.width * source.height > MAX_PIXELS:
                        raise ValueError('The photo must not exceed 16 megapixels.')
                    source.load()
                    image = ImageOps.exif_transpose(source).convert('RGBA')
                    background = Image.new('RGBA', image.size, 'white')
                    background.alpha_composite(image)
                    image = ImageOps.autocontrast(background.convert('L'))
                    image.thumbnail((2400, 2400))
            except (OSError, UnidentifiedImageError, Image.DecompressionBombError) as exc:
                raise ValueError('Could not read the image. Try a different JPEG or PNG photo.') from exc
            best = None
            deadline = time.monotonic() + 30
            # Try modest skew corrections. No name/dataset is used to choose OCR output.
            for angle in (0, -10, 10):
                path = Path(directory) / f'label-{angle}.png'
                image.rotate(angle, expand=True, fillcolor=255).save(path)
                for mode in (6, 11):
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        break
                    try:
                        process = subprocess.run(
                            [binary, str(path), 'stdout', '--tessdata-dir', str(data),
                             '-l', 'rus+eng', '--oem', '1', '--psm', str(mode),
                             '-c', 'thresholding_method=2', '-c', 'tessedit_create_tsv=1'],
                            capture_output=True, timeout=remaining, env={**os.environ, 'OMP_THREAD_LIMIT': '2'})
                    except subprocess.TimeoutExpired:
                        break
                    if process.returncode:
                        continue
                    candidate = parse_tsv(process.stdout.decode('utf-8'))
                    if best is None or candidate['rank_score'] > best['rank_score']:
                        best = dict(candidate, deskew_degrees=angle, segmentation_mode=mode)
                if best and best['mean_word_confidence'] >= 90 and best['word_count'] >= 5:
                    break
            if best is None:
                raise OCRError('Could not recognize the photo within 30 seconds. Crop it to the label.')
            review = needs_review(best['text'], best['mean_word_confidence'])
            best.pop('rank_score')
            return {**best, 'engine': 'Tesseract LSTM rus+eng',
                    'needs_review': review,
                    'warnings': ['Please review the text: the label was not read confidently.'] if review else [],
                    'privacy': 'Photo processed locally and deleted after OCR.'}
    finally:
        OCR_LOCK.release()


def parse_tsv(text):
    lines, confidence = {}, []
    for row in csv.DictReader(io.StringIO(text), delimiter='\t', quoting=csv.QUOTE_NONE):
        if row.get('level') != '5' or not (row.get('text') or '').strip():
            continue
        key = tuple(row.get(k) for k in ('page_num', 'block_num', 'par_num', 'line_num'))
        lines.setdefault(key, []).append(row['text'])
        try:
            confidence.append(float(row['conf']))
        except (ValueError, TypeError):
            pass
    score = round(sum(confidence) / len(confidence), 1) if confidence else 0
    return {'text': '\n'.join(' '.join(words) for words in lines.values())[:10000],
            'mean_word_confidence': score, 'word_count': len(confidence),
            'rank_score': score + min(len(confidence), 20) * .5}
