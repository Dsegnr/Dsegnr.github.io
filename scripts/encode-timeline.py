"""Encode screenshots from render-timeline.cjs. Requires Pillow; no source editing."""
from pathlib import Path
import argparse,json
from PIL import Image
parser=argparse.ArgumentParser()
parser.add_argument('frames',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
count=json.loads((args.frames/'manifest.json').read_text(encoding='utf-8'))['frames']
for theme in ['light','dark']:
    frames=[]
    for i in range(count):
        with Image.open(args.frames/f'{theme}-{i}.png') as im:
            frames.append(im.convert('RGB').quantize(colors=128))
    dest=root/'assets'/f'timeline-preview-{theme}.gif'
    frames[0].save(dest,save_all=True,append_images=frames[1:],duration=2800,loop=0,optimize=True,disposal=2)
    print(dest.name, dest.stat().st_size)
