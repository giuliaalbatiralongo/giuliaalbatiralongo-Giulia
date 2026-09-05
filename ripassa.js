import { getCasiClinici, aggiornaStatoCaso, getMateriali } from './db.js?v=6';
import { iconaPerMateria } from './materie.js?v=3';

const parametri = new URLSearchParams(window.location.search);
const materiaFiltro = parametri.get('materia');

let casi = [];
let casoCorrente = null;
const materialiPerMateria = {};

const elScheletro = document.getElementById('scheletro');
const elCaso = document.getElementById('caso');
const elTitolo = document.getElementById('titolo-materia');
const elCasoMateria = document.getElementById('caso-materia');
const elVignetta = document.getElementById('caso-vignetta');
const elDomanda = document.getElementById('caso-domanda');
const elOpzioni = document.getElementById('opzioni');
const elRisultato = document.getElementById('risultato');
const elProssimo = document.getElementById('prossimo');
const elPannello = document.getElementById('materiali-laterali');
const elPannelloLista = document.getElementById('materiali-laterali-lista');

elTitolo.textContent = materiaFiltro || 'Tutte le materie';

// Avanzamento: nuovo -> da_ripassare -> consolidato.
// Una risposta sbagliata riporta sempre il caso a "da_ripassare".
function calcolaProssimoStato(statoAttuale, rispostaCorretta) {
  if (!rispostaCorretta) return 'da_ripassare';
  if (statoAttuale === 'nuovo') return 'da_ripassare';
  return 'consolidato';
}

// I casi non ancora consolidati hanno priorita'.
function scegliCaso() {
  const daRipassare = casi.filter((c) => c.stato !== 'consolidato');
  const pool = daRipassare.length > 0 ? daRipassare : casi;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function mostraMaterialiCorrelati(materia) {
  if (!materialiPerMateria[materia]) {
    materialiPerMateria[materia] = await getMateriali(materia);
  }
  const materiali = materialiPerMateria[materia];

  if (materiali.length === 0) {
    elPannello.hidden = true;
    return;
  }

  elPannelloLista.innerHTML = '';
  materiali.forEach((m) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = m.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    const icona = document.createElement('i');
    icona.className = 'ph ph-file-pdf';
    icona.setAttribute('aria-hidden', 'true');
    a.appendChild(icona);
    a.appendChild(document.createTextNode(m.titolo));

    li.appendChild(a);
    elPannelloLista.appendChild(li);
  });
  elPannello.hidden = false;
}

function mostraCaso(caso) {
  casoCorrente = caso;

  elCasoMateria.innerHTML = '';
  const icona = document.createElement('i');
  icona.className = `ph ${iconaPerMateria(caso.materia)}`;
  icona.setAttribute('aria-hidden', 'true');
  elCasoMateria.appendChild(icona);
  elCasoMateria.appendChild(
    document.createTextNode(caso.argomento ? `${caso.materia} · ${caso.argomento}` : caso.materia)
  );

  elVignetta.textContent = caso.vignetta;
  elDomanda.textContent = caso.domanda;
  elRisultato.hidden = true;
  elRisultato.className = '';
  elProssimo.hidden = true;
  mostraMaterialiCorrelati(caso.materia);

  const opzioni = [
    { lettera: 'a', testo: caso.opzione_a },
    { lettera: 'b', testo: caso.opzione_b },
    { lettera: 'c', testo: caso.opzione_c },
    { lettera: 'd', testo: caso.opzione_d },
  ];

  elOpzioni.innerHTML = '';
  opzioni.forEach((opz) => {
    const btn = document.createElement('button');
    btn.className = 'opzione-btn';

    const lettera = document.createElement('span');
    lettera.className = 'opzione-lettera';
    lettera.textContent = opz.lettera.toUpperCase();
    btn.appendChild(lettera);
    btn.appendChild(document.createTextNode(opz.testo));

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

  elRisultato.className = corretto ? 'esito-corretto' : 'esito-sbagliato';
  elRisultato.hidden = false;
  elRisultato.innerHTML = `
    <p class="esito">
      <i class="ph-fill ${corretto ? 'ph-check-circle' : 'ph-x-circle'}" aria-hidden="true"></i>
      ${corretto ? 'Risposta corretta' : 'Risposta errata'}
    </p>
    <p class="spiegazione">${casoCorrente.spiegazione}</p>
  `;
  elProssimo.hidden = false;

  const nuovoStato = calcolaProssimoStato(casoCorrente.stato, corretto);
  casoCorrente.stato = nuovoStato;
  const salvato = await aggiornaStatoCaso(casoCorrente.id, nuovoStato);
  if (!salvato) {
    elRisultato.innerHTML +=
      '<p class="avviso"><i class="ph ph-warning" aria-hidden="true"></i> Non sono riuscita a salvare il nuovo stato nel database.</p>';
  }
}

elProssimo.addEventListener('click', () => {
  mostraCaso(scegliCaso());
});

async function avvia() {
  try {
    casi = await getCasiClinici(materiaFiltro || undefined);

    if (casi.length === 0) {
      elScheletro.innerHTML = `
        <div class="stato-vuoto">
          <i class="ph ph-folder-open" aria-hidden="true"></i>
          <p>${materiaFiltro ? `Nessun caso per ${materiaFiltro}.` : 'Nessun caso nel database.'}</p>
          <a class="btn" href="aggiungi.html"><i class="ph ph-plus" aria-hidden="true"></i> Aggiungi un caso</a>
        </div>
      `;
      return;
    }

    elScheletro.remove();
    elCaso.hidden = false;
    mostraCaso(scegliCaso());
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

avvia();
