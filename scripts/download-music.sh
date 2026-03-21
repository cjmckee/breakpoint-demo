#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Download background music tracks from Kevin MacLeod (incompetech.com)
# License: Creative Commons Attribution 4.0 (CC BY 4.0)
# Attribution: Music by Kevin MacLeod — incompetech.com
# ─────────────────────────────────────────────────────────────────────────────
#
# USAGE:
#   chmod +x scripts/download-music.sh
#   ./scripts/download-music.sh
#
# Tracks:
#   menu_theme      → Sneaky Snitch
#   match_tension   → Investigations
#   match_intense   → Cipher
#   training_theme  → Scheming Weasel
#   story_ambient   → Local Forecast - Slower
#
# If a direct download fails, visit https://incompetech.com and search for
# the track name, then save the MP3 to public/audio/music/ manually.
# ─────────────────────────────────────────────────────────────────────────────

set -e
MUSIC_DIR="$(dirname "$0")/../public/audio/music"
mkdir -p "$MUSIC_DIR"

download_track() {
  local filename="$1"
  local track_name="$2"
  local isrc="$3"

  local dest="$MUSIC_DIR/$filename"
  if [ -f "$dest" ] && [ -s "$dest" ]; then
    echo "✓ $filename already exists, skipping"
    return
  fi

  echo "→ Downloading $track_name..."

  # incompetech direct MP3 URL pattern
  local url="https://incompetech.com/music/royalty-free/mp3-royaltyfree/$(python3 -c "import urllib.parse; print(urllib.parse.quote('$track_name'))" 2>/dev/null || echo "$track_name" | sed 's/ /%20/g').mp3"

  if curl -fsSL --max-time 30 "$url" -o "$dest" 2>/dev/null; then
    echo "✓ Downloaded $filename"
  else
    echo "⚠  Could not auto-download $track_name"
    echo "   Visit: https://incompetech.com/music/royalty-free/index.html?isrc=$isrc"
    echo "   Save the MP3 as: $dest"
  fi
}

echo "Downloading music tracks for ai-slop-tennis..."
echo ""

download_track "sneaky_snitch.mp3"       "Sneaky Snitch"             "USUAN1100772"
download_track "investigations.mp3"      "Investigations"            "USUAN1100148"
download_track "cipher.mp3"             "Cipher"                    "USUAN1200064"
download_track "scheming_weasel.mp3"    "Scheming Weasel"           "USUAN1100187"
download_track "local_forecast.mp3"     "Local Forecast - Slower"   "USUAN1300254"

echo ""
echo "Done. Files saved to $MUSIC_DIR"
echo ""
echo "Attribution (required by CC BY 4.0):"
echo "  Music by Kevin MacLeod (incompetech.com)"
echo "  Licensed under Creative Commons: By Attribution 4.0"
echo "  https://creativecommons.org/licenses/by/4.0/"
