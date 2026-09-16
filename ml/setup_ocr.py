"""Download pinned OCR weights into the project cache. No global installation."""
import hashlib
from pathlib import Path
import urllib.request

from webapp.label_ocr import DEFAULT_TESSDATA

WEIGHTS = {
    'eng': '7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2',
    'rus': 'e16e5e036cce1d9ec2b00063cf8b54472625b9e14d893a169e2b0dedeb4df225',
}


def main():
    DEFAULT_TESSDATA.mkdir(parents=True, exist_ok=True)
    for language, expected in WEIGHTS.items():
        path = DEFAULT_TESSDATA / f'{language}.traineddata'
        if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() == expected:
            print(f'{language}: verified')
            continue
        url = f'https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/{language}.traineddata'
        with urllib.request.urlopen(url, timeout=30) as response:
            data = response.read(10_000_001)
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError(f'Unexpected checksum for {language}; no file was installed.')
        temporary = path.with_suffix('.tmp')
        temporary.write_bytes(data)
        temporary.replace(path)
        print(f'{language}: installed and verified')


if __name__ == '__main__':
    main()
