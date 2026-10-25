"""Render PDFs using system Poppler and Pillow. No npm image dependencies."""
import json
import subprocess
import tempfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
manifest = {}
for language in ('ru', 'en'):
    source = ROOT / 'public' / 'downloads' / f'Lala_Deviluke_Vol_1_{language.upper()}.pdf'
    target = ROOT / 'public' / 'manga' / 'vol-1' / language
    target.mkdir(parents=True, exist_ok=True)
    pages = []
    with tempfile.TemporaryDirectory() as temporary:
        # 96 dpi preserves the resolution of the images in the supplied PDFs.
        subprocess.run(['pdftoppm', '-r', '96', '-png', str(source), str(Path(temporary) / 'page')], check=True)
        rendered = sorted(Path(temporary).glob('page-*.png'), key=lambda p: int(p.stem.split('-')[-1]))
        for number, file in enumerate(rendered, 1):
            with Image.open(file) as image:
                image = image.convert('RGB')
                name = f'{number:02d}.webp'
                image.save(target / name, 'WEBP', quality=88, method=6)
                pages.append({'src': f'manga/vol-1/{language}/{name}', 'width': image.width, 'height': image.height})
                if number == 1:
                    image.thumbnail((480, 720))
                    image.save(target / 'cover.webp', 'WEBP', quality=85, method=6)
    if not pages:
        raise RuntimeError(f'No pages rendered for {source}')
    manifest[language] = pages
    print(f'{language}: {len(pages)} pages')
(ROOT / 'src').mkdir(exist_ok=True)
(ROOT / 'src' / 'pages.json').write_text(json.dumps(manifest, indent=2) + '\n')
