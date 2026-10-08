#!/bin/zsh
# Genera las voces de ElevenLabs y recompila Imperia. Uso: ELEVENLABS_API_KEY=tu_clave ./tools/voces.sh
cd "$(dirname "$0")/.." && node tools/voces.mjs && ./build.sh
