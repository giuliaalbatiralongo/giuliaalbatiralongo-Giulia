#!/usr/bin/env python3
"""Rinumera da solo tutti i `?v=` del progetto.

Il numero di versione serve a dire al browser "questo file e' cambiato,
riscaricalo". Finche' li scrivevo a mano, ogni tanto ne dimenticavo uno
-- ed e' il guasto piu' frequente di questo progetto. Il 7 settembre e'
arrivato a spegnere il sito: avevo alzato il numero di auth.js dentro
home.js, ma non quello di home.js dentro index.html, cosi' i browser
tenevano il vecchio home.js, che cercava il vecchio auth.js, che era
rotto.

Qui il numero non si sceglie: e' calcolato dal contenuto del file. Se il
file cambia, cambia il numero; se non cambia, resta uguale e la cache
continua a valere.

La parte importante e' che si propaga da sola. Cambiando auth.js cambia
il suo numero; ma quel numero e' scritto DENTRO home.js, quindi cambia
anche il contenuto di home.js, quindi il suo numero, quindi il
riferimento dentro index.html. Si ripete il giro finche' non si muove
piu' niente.
"""
import hashlib
import io
import re
import sys
from pathlib import Path

QUI = Path(__file__).resolve().parent
RIF = re.compile(r'(?P<file>[A-Za-z0-9_-]+\.(?:js|css))\?v=\d+')


def versione(testo: str) -> str:
    """Otto cifre dal contenuto. Decimali e non esadecimali perche' il
    resto degli strumenti si aspetta `?v=` seguito da numeri."""
    return str(int(hashlib.sha1(testo.encode('utf-8')).hexdigest()[:12], 16))[:8]


def sorgenti():
    return sorted([p for p in QUI.glob('*.js') if p.name != 'controlla-nomi.mjs']
                  + list(QUI.glob('*.css')))


def giro(numeri):
    """Riscrive i riferimenti secondo `numeri`. Ritorna quanti file ha
    cambiato."""
    cambiati = 0
    for p in list(QUI.glob('*.html')) + sorgenti():
        testo = p.read_text(encoding='utf-8')
        nuovo = RIF.sub(
            lambda m: f"{m.group('file')}?v={numeri.get(m.group('file'), '1')}", testo)
        if nuovo != testo:
            p.write_text(nuovo, encoding='utf-8')
            cambiati += 1
    return cambiati


def main(solo_verifica: bool) -> int:
    prima = {p.name: p.read_text(encoding='utf-8') for p in sorgenti()}

    for _ in range(10):
        numeri = {p.name: versione(p.read_text(encoding='utf-8')) for p in sorgenti()}
        if giro(numeri) == 0:
            break
    else:
        print('MALE  i numeri non si assestano: c\'e\' un giro circolare fra i file?')
        return 1

    # I contenuti possono essere cambiati solo nei `?v=`: se e' cambiato
    # altro, qualcosa non torna.
    dopo = {p.name: p.read_text(encoding='utf-8') for p in sorgenti()}
    tocchi = [n for n in prima if RIF.sub('', prima[n]) != RIF.sub('', dopo.get(n, ''))]
    if tocchi:
        print('MALE  ho toccato piu' + "'" + ' dei numeri in: ' + ', '.join(tocchi))
        return 1

    diversi = [n for n in prima if prima[n] != dopo[n]]
    html_diversi = 0  # gli html li conta il git, qui basta sapere se si e' mosso qualcosa

    if solo_verifica:
        import subprocess
        sporchi = subprocess.run(['git', 'status', '--porcelain'], cwd=QUI,
                                 capture_output=True, text=True).stdout.strip()
        if diversi or (sporchi and any(l.split()[-1].endswith(('.html', '.js', '.css'))
                                       for l in sporchi.splitlines())):
            print('MALE  i numeri di versione non erano aggiornati. Lancia: python3 versioni.py')
            print('      file rinumerati: ' + (', '.join(diversi) or '(solo html)'))
            return 1
        print('Versioni a posto.')
        return 0

    print(f'Versioni aggiornate. Rinumerati {len(diversi)} file'
          + (': ' + ', '.join(diversi) if diversi else ' (niente da fare)'))
    return 0


if __name__ == '__main__':
    sys.exit(main('--verifica' in sys.argv))
