import { getCasiClinici, aggiornaStatoCaso, getMateriali } from './db.js?v=6';
import { iconaPerMateria } from './materie.js?v=2';

const parametri = new URLSearchParams(window.location.search);
const materiaFiltro = parametri.get('materia');

let casi = [];
let casoCorrente = null;
const materialiPerMateria = {};

const elScheletro = document.getElementById('scheletro-caso');
const elCaso = document.getElementById('caso');
const elTitoloMateria = document.getElementById('titolo-materia');
const elMateria = document.getElementById('materia-label');
const elVignetta = document.getElementById('vignetta-text');
const elDomanda = document.getElementById('domanda-text');
const elOpzioni = document.getElementById('opzioni');
const elRisultato = document.getElementById('risultato');
const elProssimo = document.getElementById('prossimo');
const elMaterialiLaterali = document.getElementById('materiali-laterali');
const elMaterialiLaterialiLista = document.getElementById('materiali-laterali-lista');

elTitoloMateria.textContent = materiaFiltro || 'Tutte le materie';

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

async function mostraMaterialiCorrelati(materia) {
  if (!materialiPerMateria[materia]) {
    materialiPerMateria[materia] = await getMateriali(materia);
  }
  const materiali = materialiPerMateria[materia];

  if (materiali.length === 0) {
    elMaterialiLaterali.hidden = true;
    return;
  }

  elMaterialiLaterialiLista.innerHTML = '';
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
    elMaterialiLaterialiLista.appendChild(li);
  });
  elMaterialiLaterali.hidden = false;
}

function mostraCaso(caso) {
  casoCorrente = caso;

  const { icona } = iconaPerMateria(caso.materia);
  elMateria.innerHTML = '';
  const iconaEl = document.createElement('i');
  iconaEl.className = `ph ${icona}`;
  iconaEl.setAttribute('aria-hidden', 'true');
  elMateria.appendChild(iconaEl);
  elMateria.appendChild(document.createTextNode(caso.materia));

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
    lettera.className = 'lettera';
    lettera.textContent = `${opz.lettera.toUpperCase()})`;
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
      <i class="ph ${corretto ? 'ph-check-circle' : 'ph-x-circle'}" aria-hidden="true"></i>
      ${corretto ? 'Risposta corretta' : 'Risposta errata'}
    </p>
    <p>${casoCorrente.spiegazione}</p>
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

function mostraStatoVuoto(messaggio) {
  elScheletro.innerHTML = `
    <div class="stato-vuoto">
      <i class="ph ph-folder-open stato-vuoto-icona" aria-hidden="true"></i>
      <p>${messaggio}</p>
      <a class="btn-primario" href="aggiungi.html">
        <i class="ph ph-plus" aria-hidden="true"></i> Aggiungi un caso
      </a>
    </div>
  `;
}

async function avvia() {
  try {
    casi = await getCasiClinici(materiaFiltro || undefined);

    if (casi.length === 0) {
      mostraStatoVuoto(
        materiaFiltro
          ? `Nessun caso per "${materiaFiltro}".`
          : 'Nessun caso nel database.'
      );
      return;
    }

    elScheletro.remove();
    elCaso.hidden = false;
    mostraCaso(scegliCaso());
  } catch (errore) {
    elScheletro.innerHTML = `<p class="errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

avvia();
