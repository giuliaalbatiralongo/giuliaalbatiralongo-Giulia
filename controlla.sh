#!/bin/sh
# I controlli che NON servono il browser. Vanno lanciati sempre, e
# soprattutto prima di mandare online: i collaudi nel browser
# sostituiscono auth.js e db.js con dei finti, quindi ci sono guasti nel
# codice vero che loro non possono vedere. Questi li vedono.
set -e
cd "$(dirname "$0")"

echo "1. nomi usati e mai importati"
/opt/node22/bin/npx --no-install eslint --config eslint.config.mjs --no-config-lookup "*.js"
echo "   a posto"

echo "2. nomi importati che dall'altra parte non ci sono"
node controlla-nomi.mjs

echo "3. numeri di versione (la cache del browser)"
python3 versioni.py
