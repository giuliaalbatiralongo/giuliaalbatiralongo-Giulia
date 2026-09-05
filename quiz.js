import { getCasiClinici, getRisposte, calcolaStatistiche } from './db.js?v=7';
import { iconaPerMateria } from './materie.js?v=3';

const STATI = ['nuovo', 'da_ripassare', 'consolidato'];
const ETICHETTE_PLURALE = {
  nuovo: 'nuovi',
  da_ripassare: 'da ripassare',
  consolidato: 'consolidati',
};
const ETICHETTE_SINGOLARE = {
  nuovo: 'nuovo',
  da_ripassare: 'da ripassare',
  consolidato: 'consolidato',
};

/* ---------- Schede materia ---------- */

function contaPerStato(casi) {
  const conteggi = { nuovo: 0, da_ripassare: 0, consolidato: 0 };
  casi.forEach((c) => {
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
      span.textContent = `${conteggi[stato]} ${ETICHETTE_PLURALE[stato]}`;
      stati.appendChild(span);
    }
  });
  a.appendChild(stati);

  return a;
}

/* ---------- Tracker ---------- */

function creaStat(etichetta, valore, nota) {
  const div = document.createElement('div');
  div.className = 'stat';

  const lab = document.createElement('div');
  lab.className = 'stat-etichetta';
  lab.textContent = etichetta;
  div.appendChild(lab);

  const val = document.createElement('div');
  val.className = 'stat-valore';
  val.textContent = valore;
  div.appendChild(val);

  if (nota) {
    const n = document.createElement('div');
    n.className = 'stat-nota';
    n.textContent = nota;
    div.appendChild(n);
  }

  return div;
}

function creaStatAndamento(andamento) {
  const div = document.createElement('div');
  div.className = 'stat';

  const lab = document.createElement('div');
  lab.className = 'stat-etichetta';
  lab.textContent = 'Andamento';
  div.appendChild(lab);

  if (!andamento) {
    const val = document.createElement('div');
    val.className = 'stat-valore';
    val.textContent = '-';
    div.appendChild(val);

    const nota = document.createElement('div');
    nota.className = 'stat-nota';
    nota.textContent = 'Servono almeno 10 risposte';
    div.appendChild(nota);
    return div;
  }

  const val = document.createElement('div');
  val.className = 'stat-valore';
  val.textContent = `${andamento.recenti}%`;
  div.appendChild(val);

  const verso = andamento.delta > 0 ? 'su' : andamento.delta < 0 ? 'giu' : 'pari';
  const iconaVerso = {
    su: 'ph-trend-up',
    giu: 'ph-trend-down',
    pari: 'ph-minus',
  }[verso];

  const delta = document.createElement('div');
  delta.className = `stat-delta ${verso}`;
  delta.innerHTML = `<i class="ph ${iconaVerso}" aria-hidden="true"></i> ${
    andamento.delta > 0 ? '+' : ''
  }${andamento.delta} punti`;
  div.appendChild(delta);

  const nota = document.createElement('div');
  nota.className = 'stat-nota';
  nota.textContent = `Ultime ${andamento.finestra} risposte contro le precedenti`;
  div.appendChild(nota);

  return div;
}

function mostraTracker(statistiche) {
  const contenitore = document.getElementById('tracker');
  contenitore.innerHTML = '';

  if (statistiche.totale === 0) {
    contenitore.innerHTML = `
      <div class="tracker-vuoto">
        <i class="ph ph-chart-line" aria-hidden="true"></i>
        Le statistiche compaiono dopo la tua prima sessione di quiz.
      </div>
    `;
    return;
  }

  const griglia = document.createElement('div');
  griglia.className = 'tracker';

  griglia.appendChild(
    creaStat(
      'Accuratezza',
      `${statistiche.accuratezza}%`,
      `${statistiche.corrette} corrette su ${statistiche.totale}`
    )
  );
  griglia.appendChild(
    creaStat(
      'Risposte date',
      String(statistiche.totale),
      `${statistiche.totale - statistiche.corrette} sbagliate`
    )
  );
  griglia.appendChild(
    creaStat(
      'Sessioni',
      String(statistiche.sessioni),
      statistiche.sessioni === 1 ? 'sessione completata' : 'sessioni completate'
    )
  );
  griglia.appendChild(creaStatAndamento(statistiche.andamento));

  contenitore.appendChild(griglia);
}

/* ---------- Elenco casi ---------- */

function creaVoceCaso(caso) {
  const li = document.createElement('li');

  const testo = document.createElement('span');
  testo.className = 'elenco-testo';
  testo.textContent = caso.vignetta;
  li.appendChild(testo);

  const stato = document.createElement('span');
  stato.className = `stato stato-${caso.stato}`;
  stato.textContent = ETICHETTE_SINGOLARE[caso.stato] || caso.stato;
  li.appendChild(stato);

  return li;
}

function creaGruppoMateria(nome, casiMateria) {
  const div = document.createElement('div');
  div.className = 'gruppo-materia';

  const testata = document.createElement('div');
  testata.className = 'gruppo-materia-testata';

  const icona = document.createElement('i');
  icona.className = `ph ${iconaPerMateria(nome)}`;
  icona.setAttribute('aria-hidden', 'true');
  testata.appendChild(icona);

  const h3 = document.createElement('h3');
  h3.textContent = nome;
  testata.appendChild(h3);

  div.appendChild(testata);

  const argomenti = [...new Set(casiMateria.map((c) => c.argomento || 'Generale'))].sort();
  argomenti.forEach((argomento) => {
    const blocco = document.createElement('div');
    blocco.className = 'gruppo-argomento';

    const h4 = document.createElement('h4');
    h4.textContent = argomento;
    blocco.appendChild(h4);

    const ul = document.createElement('ul');
    ul.className = 'elenco';
    casiMateria
      .filter((c) => (c.argomento || 'Generale') === argomento)
      .forEach((caso) => ul.appendChild(creaVoceCaso(caso)));
    blocco.appendChild(ul);

    div.appendChild(blocco);
  });

  return div;
}

/* ---------- Avvio ---------- */

async function avvia() {
  const elScheletroMaterie = document.getElementById('scheletro-materie');
  const elMaterie = document.getElementById('materie');
  const elScheletroCasi = document.getElementById('scheletro-casi');
  const elCasi = document.getElementById('casi');

  try {
    const [casi, risposte] = await Promise.all([getCasiClinici(), getRisposte()]);

    mostraTracker(calcolaStatistiche(risposte));

    if (casi.length === 0) {
      elScheletroMaterie.className = '';
      elScheletroMaterie.innerHTML = `
        <div class="stato-vuoto">
          <i class="ph ph-folder-open" aria-hidden="true"></i>
          <p>Non hai ancora nessun caso clinico.</p>
          <a class="btn" href="aggiungi.html"><i class="ph ph-plus" aria-hidden="true"></i> Aggiungi il primo caso</a>
        </div>
      `;
      elScheletroCasi.remove();
      return;
    }

    const materie = [...new Set(casi.map((c) => c.materia))].sort();

    elMaterie.appendChild(creaCardMateria(null, casi, true));
    materie.forEach((nome) => {
      elMaterie.appendChild(creaCardMateria(nome, casi.filter((c) => c.materia === nome)));
    });
    elScheletroMaterie.remove();
    elMaterie.hidden = false;

    materie.forEach((nome) => {
      elCasi.appendChild(creaGruppoMateria(nome, casi.filter((c) => c.materia === nome)));
    });
    elScheletroCasi.remove();
  } catch (errore) {
    elScheletroMaterie.className = '';
    elScheletroMaterie.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

avvia();
