import { getCasiClinici } from './db.js?v=5';

const STATI = ['nuovo', 'da_ripassare', 'consolidato'];
const ETICHETTE_STATO = {
  nuovo: 'nuovo',
  da_ripassare: 'da ripassare',
  consolidato: 'consolidato',
};

function contaPerStato(casiMateria) {
  const conteggi = { nuovo: 0, da_ripassare: 0, consolidato: 0 };
  casiMateria.forEach((c) => {
    if (conteggi[c.stato] !== undefined) conteggi[c.stato]++;
  });
  return conteggi;
}

function creaPill(stato, numero) {
  const span = document.createElement('span');
  span.className = `pill pill-${stato}`;
  span.textContent = `${numero} ${ETICHETTE_STATO[stato]}`;
  return span;
}

function creaCardMateria(nome, casiMateria, isTutte = false) {
  const a = document.createElement('a');
  a.className = 'materia-card' + (isTutte ? ' tutte' : '');
  a.href = isTutte ? 'ripassa.html' : `ripassa.html?materia=${encodeURIComponent(nome)}`;

  const h3 = document.createElement('h3');
  h3.textContent = isTutte ? 'Tutte le materie' : nome;
  a.appendChild(h3);

  const stats = document.createElement('div');
  stats.className = 'materia-stats';
  const conteggi = contaPerStato(casiMateria);
  STATI.forEach((stato) => {
    if (conteggi[stato] > 0) {
      stats.appendChild(creaPill(stato, conteggi[stato]));
    }
  });
  a.appendChild(stats);

  return a;
}

async function avvia() {
  const elStato = document.getElementById('stato-home');
  const elMaterie = document.getElementById('materie');

  try {
    const casi = await getCasiClinici();

    if (casi.length === 0) {
      elStato.textContent = 'Nessun caso ancora. Vai su "+ Aggiungi" per crearne uno.';
      return;
    }

    const materieUniche = [...new Set(casi.map((c) => c.materia))].sort();

    elMaterie.appendChild(creaCardMateria(null, casi, true));
    materieUniche.forEach((nome) => {
      const casiMateria = casi.filter((c) => c.materia === nome);
      elMaterie.appendChild(creaCardMateria(nome, casiMateria));
    });

    elStato.hidden = true;
    elMaterie.hidden = false;
  } catch (errore) {
    elStato.textContent = 'Errore nel caricamento: ' + errore.message;
    console.error(errore);
  }
}

avvia();
