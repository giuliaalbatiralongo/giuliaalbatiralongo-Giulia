/* Controlla che ogni nome importato esista davvero nel file da cui lo
   si prende.

   `no-undef` di eslint prende il caso "uso un nome che non ho
   importato". Questo prende quello gemello: "importo un nome che dall
   altra parte non c e". Tutti e due fanno morire la pagina al primo
   caricamento, e nessuno dei due si vede leggendo il codice. */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const CARTELLA = dirname(new URL(import.meta.url).pathname);
const files = readdirSync(CARTELLA).filter((f) => f.endsWith('.js') && f !== 'controlla-nomi.mjs');

const esportati = new Map();
for (const f of files) {
  const testo = readFileSync(join(CARTELLA, f), 'utf8');
  const nomi = new Set();
  for (const m of testo.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    nomi.add(m[1]);
  }
  // export { a, b as c }
  for (const m of testo.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    m[1].split(',').forEach((p) => {
      const pezzo = p.trim();
      if (!pezzo) return;
      nomi.add((pezzo.split(/\s+as\s+/).pop() || pezzo).trim());
    });
  }
  esportati.set(f, nomi);
}

let guai = 0;
for (const f of files) {
  const testo = readFileSync(join(CARTELLA, f), 'utf8');
  for (const m of testo.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]\.\/([^'"?]+)(?:\?[^'"]*)?['"]/g)) {
    const da = m[2];
    if (!esportati.has(da)) {
      console.log(`MALE  ${f}: prende roba da ${da}, che non esiste`);
      guai += 1;
      continue;
    }
    for (const p of m[1].split(',')) {
      const nome = p.trim().split(/\s+as\s+/)[0].trim();
      if (!nome) continue;
      if (!esportati.get(da).has(nome)) {
        console.log(`MALE  ${f}: importa "${nome}" da ${da}, ma ${da} non lo esporta`);
        guai += 1;
      }
    }
  }
}

console.log(guai === 0 ? `Nomi a posto (${files.length} file).` : `\n${guai} import rotti.`);
process.exit(guai === 0 ? 0 : 1);
