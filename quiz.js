import { getCasiClinici, aggiornaStatoCaso } from './db.js';

let casi = [];
let casoCorrente = null;

const elCaricamento = document.getElementById('caricamento');
const elCaso = document.getElementById('caso');
const elMateria = document.getElementById('materia-label');
const elVignetta = document.getElementById('vignetta-text');
const elDomanda = document.getElementById('domanda-text');
const elOpzioni = document.getElementById('opzioni');
const elRisultato = document.getElementById('risultato');
const elProssimo = document.getElementById('prossimo');

// Logica di avanzamento: nuovo -> da_ripassare -> consolidato.
// Una risposta sbagliata riporta sempre il caso a "da_ripassare",
// anche se era gia' consolidato.
function calcolaProssimoStato(statoAttuale, rispostaCorretta) {
  if (!rispostaCorretta) {
    return 'da_ripassare';
  }
  if (statoAttuale === 'nuovo') {
    return 'da_ripassare';
  }
  return 'consolidato';
}

// I casi non ancora consolidati hanno priorita': se ce ne sono,
// il prossimo caso viene scelto solo tra quelli.
function scegliCaso() {
  const daRipassare = casi.filter((c) => c.stato !== 'consolidato');
  const pool = daRipassare.length > 0 ? daRipassare : casi;
  return pool[Math.floor(Math.random() * pool.length)];
}

function mostraCaso(caso) {
  casoCorrente = caso;
  elMateria.textContent = caso.materia;
  elVignetta.textContent = caso.vignetta;
  elDomanda.textContent = caso.domanda;
  elRisultato.hidden = true;
  elProssimo.hidden = true;

  const opzioni = [
    { lettera: 'a', testo: caso.opzione_a },
    { lettera: 'b', testo: caso.opzione_b },
    { lettera: 'c', testo: caso.opzione_c },
    { lettera: 'd', testo: caso.opzione_d },
  ];

  elOpzioni.innerHTML = '';
  opzioni.forEach((opz) => {
    const btn = document.createElement('button');
    btn.textContent = `${opz.lettera.toUpperCase()}) ${opz.testo}`;
    btn.className = 'opzione-btn';
    btn.addEventListener('click', () => rispondi(opz.lettera, btn));
    elOpzioni.appendChild(btn);
  });
}

async function rispondi(letteraScelta, bottoneCliccato) {
  const corretto = letteraScelta === casoCorrente.risposta_corretta;

  Array.from(elOpzioni.children).forEach((btn) => {
    btn.disabled = true;
  });
  bottoneCliccato.classList.add(corretto ? 'corretta' : 'sbagliata');

  elRisultato.hidden = false;
  elRisultato.innerHTML = `
    <p class="esito">${corretto ? '✅ Corretto!' : '❌ Sbagliato.'}</p>
    <p>${casoCorrente.spiegazione}</p>
  `;
  elProssimo.hidden = false;

  const nuovoStato = calcolaProssimoStato(casoCorrente.stato, corretto);
  casoCorrente.stato = nuovoStato;
  await aggiornaStatoCaso(casoCorrente.id, nuovoStato);
}

elProssimo.addEventListener('click', () => {
  mostraCaso(scegliCaso());
});

async function avvia() {
  casi = await getCasiClinici();

  if (casi.length === 0) {
    elCaricamento.textContent = 'Nessun caso trovato. Aggiungine uno dal database per iniziare.';
    return;
  }

  elCaricamento.hidden = true;
  elCaso.hidden = false;
  mostraCaso(scegliCaso());
}

avvia();
