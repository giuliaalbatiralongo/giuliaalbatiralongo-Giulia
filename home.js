import { getCasiClinici } from './db.js?v=8';
import { iconaPerMateria } from './materie.js?v=3';

const STATI = ['nuovo', 'da_ripassare', 'consolidato'];
const ETICHETTE_STATO = {
  nuovo: 'nuovi',
  da_ripassare: 'da ripassare',
  consolidato: 'consolidati',
};

function contaPerStato(casiMateria) {
  const conteggi = { nuovo: 0, da_ripassare: 0, consolidato: 0 };
  casiMateria.forEach((c) => {
    if (conteggi[c.stato] !== undefined) conteggi[c.stato]++;
  });
  return conteggi;
}

function creaCardMateria(nome, casiMateria, isTutte = false) {
  const a = document.createElement('a');
  a.className = 'materia-card' + (isTutte ? ' tutte' : '');
  a.href = isTutte ? 'sessione.html' : `sessione.html?materia=${encodeURIComponent(nome)}`;

  const testata = document.createElement('div');
  testata.className = 'materia-testata';

  const badge = document.createElement('span');
  badge.className = 'materia-icona';
  const icona = document.createElement('i');
  icona.className = `ph ${iconaPerMateria(isTutte ? null : nome)}`;
  icona.setAttribute('aria-hidden', 'true');
  badge.appendChild(icona);
  testata.appendChild(badge);

  const testo = document.createElement('div');
  const titolo = document.createElement('div');
  titolo.className = 'materia-nome';
  titolo.textContent = isTutte ? 'Tutte le materie' : nome;
  testo.appendChild(titolo);

  const conteggio = document.createElement('div');
  conteggio.className = 'materia-conteggio';
  conteggio.textContent = `${casiMateria.length} ${casiMateria.length === 1 ? 'caso' : 'casi'}`;
  testo.appendChild(conteggio);

  testata.appendChild(testo);
  a.appendChild(testata);

  const stati = document.createElement('div');
  stati.className = 'materia-stati';
  const conteggi = contaPerStato(casiMateria);
  STATI.forEach((stato) => {
    if (conteggi[stato] > 0) {
      const span = document.createElement('span');
      span.className = `stato stato-${stato}`;
      span.textContent = `${conteggi[stato]} ${ETICHETTE_STATO[stato]}`;
      stati.appendChild(span);
    }
  });
  a.appendChild(stati);

  return a;
}

async function avvia() {
  const elScheletro = document.getElementById('scheletro');
  const elMaterie = document.getElementById('materie');

  try {
    const casi = await getCasiClinici();

    if (casi.length === 0) {
      elScheletro.innerHTML = `
        <div class="stato-vuoto">
          <i class="ph ph-folder-open" aria-hidden="true"></i>
          <p>Non hai ancora nessun caso clinico.</p>
          <a class="btn" href="aggiungi.html"><i class="ph ph-plus" aria-hidden="true"></i> Aggiungi il primo caso</a>
        </div>
      `;
      elScheletro.className = '';
      return;
    }

    const materieUniche = [...new Set(casi.map((c) => c.materia))].sort();

    elMaterie.appendChild(creaCardMateria(null, casi, true));
    materieUniche.forEach((nome) => {
      elMaterie.appendChild(creaCardMateria(nome, casi.filter((c) => c.materia === nome)));
    });

    elScheletro.remove();
    elMaterie.hidden = false;
  } catch (errore) {
    elScheletro.className = '';
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

avvia();
