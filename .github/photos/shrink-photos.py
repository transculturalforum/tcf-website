"""Makes the saved photos lighter so pages load faster.

Runs after save-photos.sh. Any photo in images/photos that is bigger than it
needs to be is resized (1600 px wide for banners, 800 px for cards) and saved
again at a web-friendly quality. Each photo is only shrunk once: the names of
photos already done are kept in shrunk-list.txt, so running this again is safe.
"""
import os
import sys
from PIL import Image, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
PHOTOS = os.path.join(ROOT, "images", "photos")
DONE_LIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shrunk-list.txt")
SMALL_ENOUGH = 250 * 1024  # photos under this size are left as they are

done = set()
if os.path.exists(DONE_LIST):
    with open(DONE_LIST) as f:
        done = {line.strip() for line in f if line.strip()}

changed = 0
for name in sorted(os.listdir(PHOTOS)):
    if not name.lower().endswith((".jpg", ".jpeg")) or name in done:
        continue
    path = os.path.join(PHOTOS, name)
    if os.path.getsize(path) > SMALL_ENOUGH:
        max_width = 1600 if "-w1600" in name else 800
        with Image.open(path) as im:
            im = ImageOps.exif_transpose(im).convert("RGB")
            if im.width > max_width:
                im = im.resize((max_width, round(im.height * max_width / im.width)), Image.LANCZOS)
            im.save(path + ".tmp", "JPEG", quality=70, optimize=True, progressive=True)
        os.replace(path + ".tmp", path)
        changed += 1
    done.add(name)

with open(DONE_LIST, "w") as f:
    f.write("\n".join(sorted(done)) + "\n")
print(f"Shrunk {changed} photos.")
sys.exit(0)
