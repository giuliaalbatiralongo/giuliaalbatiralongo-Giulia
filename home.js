import { getCasiClinici } from './db.js?v=6';
import { creaIconaMateria } from './materie.js?v=2';

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

  const top = document.createElement('div');
  top.className = 'materia-card-top';
  top.appendChild(creaIconaMateria(isTutte ? null : nome));

  const h3 = document.createElement('h3');
  h3.textContent = isTutte ? 'Tutte le materie' : nome;
  top.appendChild(h3);

  a.appendChild(top);

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

function mostraStatoVuoto(contenitore) {
  contenitore.innerHTML = `
    <div class="stato-vuoto">
      <i class="ph ph-folder-open stato-vuoto-icona" aria-hidden="true"></i>
      <p>Non hai ancora nessun caso clinico.</p>
      <a class="btn-primario" href="aggiungi.html">
        <i class="ph ph-plus" aria-hidden="true"></i> Aggiungi il primo caso
      </a>
    </div>
  `;
  contenitore.hidden = false;
}

async function avvia() {
  const elScheletro = document.getElementById('scheletro-home');
  const elMaterie = document.getElementById('materie');

  try {
    const casi = await getCasiClinici();
    elScheletro.remove();

    if (casi.length === 0) {
      mostraStatoVuoto(elMaterie);
      return;
    }

    const materieUniche = [...new Set(casi.map((c) => c.materia))].sort();

    elMaterie.appendChild(creaCardMateria(null, casi, true));
    materieUniche.forEach((nome) => {
      const casiMateria = casi.filter((c) => c.materia === nome);
      elMaterie.appendChild(creaCardMateria(nome, casiMateria));
    });

    elMaterie.hidden = false;
  } catch (errore) {
    elScheletro.innerHTML = `<p class="errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

avvia();
