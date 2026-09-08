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

Il conto si fa tutto in memoria e si scrive su disco solo alla fine:
cosi' `--verifica` puo' dire com'e' la situazione senza cambiarla. Prima
non era cosi', e la verifica sistemava i numeri e poi si complimentava
da sola -- oppure, se c'era una qualsiasi modifica non ancora
depositata, gridava al lupo. Un controllo che grida sempre al lupo non
lo guarda piu' nessuno.
"""
import hashlib
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


def pagine():
    return sorted(QUI.glob('*.html'))


def assesta(testi):
    """Rinumera in memoria finche' non si muove piu' niente.

    `testi` e' un dizionario nome -> contenuto, e non viene toccato: si
    ritorna la versione assestata. Ritorna None se i numeri non si
    fermano, che vorrebbe dire un giro circolare fra i file.
    """
    testi = dict(testi)
    nomi_sorgenti = [p.name for p in sorgenti()]

    for _ in range(10):
        numeri = {n: versione(testi[n]) for n in nomi_sorgenti}
        mosso = False
        for nome, testo in testi.items():
            nuovo = RIF.sub(
                lambda m: f"{m.group('file')}?v={numeri.get(m.group('file'), '1')}", testo)
            if nuovo != testo:
                testi[nome] = nuovo
                mosso = True
        if not mosso:
            return testi
    return None


def main(solo_verifica: bool) -> int:
    tutti = pagine() + sorgenti()
    prima = {p.name: p.read_text(encoding='utf-8') for p in tutti}

    dopo = assesta(prima)
    if dopo is None:
        print('MALE  i numeri non si assestano: c\'e\' un giro circolare fra i file?')
        return 1

    # I contenuti possono essere cambiati solo nei `?v=`: se e' cambiato
    # altro, qualcosa non torna.
    tocchi = [n for n in prima if RIF.sub('', prima[n]) != RIF.sub('', dopo[n])]
    if tocchi:
        print('MALE  ho toccato piu' + "'" + ' dei numeri in: ' + ', '.join(tocchi))
        return 1

    diversi = sorted(n for n in prima if prima[n] != dopo[n])

    if solo_verifica:
        if diversi:
            print('MALE  i numeri di versione non sono aggiornati. Lancia: python3 versioni.py')
            print('      da rinumerare: ' + ', '.join(diversi))
            return 1
        print('Versioni a posto.')
        return 0

    for nome in diversi:
        (QUI / nome).write_text(dopo[nome], encoding='utf-8')

    if not diversi:
        print('Versioni aggiornate (niente da fare).')
        return 0

    fonti = [n for n in diversi if not n.endswith('.html')]
    html = [n for n in diversi if n.endswith('.html')]
    print(f'Versioni aggiornate. Rinumerati {len(diversi)} file: '
          + ', '.join(diversi)
          + f'  [{len(fonti)} sorgenti, {len(html)} pagine]')
    return 0


if __name__ == '__main__':
    sys.exit(main('--verifica' in sys.argv))
