#!/bin/bash
# Saves every photo in photo-list.txt into images/photos and points the pages at those copies.
# Same job as the save-photos tool from the launch zip. Safe to run more than once.
# Photos that fail to download keep their online link.
cd "$(dirname "$0")/../.." || exit 1
LIST=".github/photos/photo-list.txt"
mkdir -p images/photos
ok=0; fail=0
while IFS=$'\t' read -r name url; do
  [ -z "$name" ] && continue
  dest="images/photos/$name"
  if [ ! -s "$dest" ]; then
    ctype=$(curl -fsSL --retry 3 -A "Mozilla/5.0 (TCF website photo saver)" -w '%{content_type}' -o "$dest.tmp" "$url")
    if [ $? -ne 0 ] || [[ "$ctype" != image/* ]]; then
      rm -f "$dest.tmp"; echo "Could not download $name (it keeps its online link)"; fail=$((fail+1)); continue
    fi
    mv "$dest.tmp" "$dest"
  fi
  URL="$url" LOCAL="images/photos/$name" perl -pi -e 's/\Q$ENV{URL}\E/$ENV{LOCAL}/g' ./*.html
  ok=$((ok+1))
done < "$LIST"
echo "Done: $ok photos saved, $fail failed."
