import {
  getCasiClinici,
  registraRipasso,
  casiDaRipassareOggi,
  casiMaiVisti,
  quandoTorna,
  getMateriali,
  linkMateriali,
  registraRisposta,
} from './db.js?v=24';
import { iconaPerMateria } from './materie.js?v=3';
import { proteggiPagina } from './auth.js?v=10';
import { misuraTempo } from './tempo.js?v=2';

const parametri = new URLSearchParams(window.location.search);
const materiaFiltro = parametri.get('materia');

// Un identificativo per sessione: resta lo stesso finche' la scheda
// del browser resta aperta, cosi' le risposte date di seguito contano
// come una sessione sola.
const sessione =
  sessionStorage.getItem('akesis-sessione') ||
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
sessionStorage.setItem('akesis-sessione', sessione);

let casi = [];
let casoCorrente = null;
let risposteDate = 0;
let risposteCorrette = 0;
const materialiPerMateria = {};

const elScheletro = document.getElementById('scheletro');
const elCaso = document.getElementById('caso');
const elTitolo = document.getElementById('titolo-materia');
const elRiepilogo = document.getElementById('riepilogo-sessione');
const elCasoMateria = document.getElementById('caso-materia');
const elVignetta = document.getElementById('caso-vignetta');
const elDomanda = document.getElementById('caso-domanda');
const elOpzioni = document.getElementById('opzioni');
const elRisultato = document.getElementById('risultato');
const elProssimo = document.getElementById('prossimo');
const elPannello = document.getElementById('materiali-laterali');
const elPannelloLista = document.getElementById('materiali-laterali-lista');

elTitolo.textContent = materiaFiltro || 'Tutte le materie';

function aggiornaRiepilogo() {
  if (risposteDate > 0) {
    elRiepilogo.textContent = `${risposteCorrette} corrette su ${risposteDate} in questa sessione.`;
    return;
  }

  if (ripassoLibero) {
    elRiepilogo.textContent = 'Nessun ripasso in scadenza oggi. Questo e allenamento libero.';
    return;
  }

  const restano = coda.length - indiceCoda;
  elRiepilogo.textContent =
    restano === 1 ? '1 caso in programma oggi.' : `${restano} casi in programma oggi.`;
}

/* La coda del giorno, in ordine di priorita':
     1. i casi in scadenza oggi o arretrati, dal piu' vecchio
     2. quelli mai visti
     3. se non c'e' altro, ripasso libero
   La coda si costruisce una volta all'avvio e non si ricalcola dopo ogni
   risposta: altrimenti un caso appena sbagliato, che torna in scadenza
   domani, resterebbe a girare nella stessa sessione. */
let coda = [];
let indiceCoda = 0;
let ripassoLibero = false;

function preparaCoda() {
  const scaduti = casiDaRipassareOggi(casi);
  const maiVisti = casiMaiVisti(casi);

  coda = [...scaduti, ...maiVisti];
  indiceCoda = 0;
  ripassoLibero = coda.length === 0;

  return { scaduti: scaduti.length, maiVisti: maiVisti.length };
}

function scegliCaso() {
  if (ripassoLibero || indiceCoda >= coda.length) {
    ripassoLibero = true;
    return casi[Math.floor(Math.random() * casi.length)];
  }

  const caso = coda[indiceCoda];
  indiceCoda += 1;
  return caso;
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

  // L'archivio e' privato: qui servono i link firmati, non l'indirizzo
  // pubblico di una volta. Chi non ha ancora la chiave di un documento
  // protetto lo vede indicato come chiuso, senza link.
  const indirizzi = await linkMateriali(
    materiali.filter((m) => m.sbloccato).map((m) => m.percorso)
  );

  elPannelloLista.innerHTML = '';
  materiali.forEach((m) => {
    const li = document.createElement('li');
    const indirizzo = indirizzi.get(m.percorso);

    const icona = document.createElement('i');
    icona.className = m.sbloccato ? 'ph ph-file-pdf' : 'ph ph-lock-key';
    icona.setAttribute('aria-hidden', 'true');

    if (m.sbloccato && indirizzo) {
      const a = document.createElement('a');
      a.href = indirizzo;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.appendChild(icona);
      a.appendChild(document.createTextNode(m.titolo));
      li.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.className = 'elenco-meta';
      span.appendChild(icona);
      span.appendChild(
        document.createTextNode(
          m.sbloccato ? m.titolo : `${m.titolo} (serve la chiave)`
        )
      );
      li.appendChild(span);
    }

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

  risposteDate += 1;
  if (corretto) risposteCorrette += 1;
  aggiornaRiepilogo();

  const [ripasso, salvataRisposta] = await Promise.all([
    registraRipasso(casoCorrente.id, corretto),
    registraRisposta({
      casoId: casoCorrente.id,
      materia: casoCorrente.materia,
      corretta: corretto,
      sessione,
    }),
  ]);

  if (ripasso?.ok) {
    casoCorrente.stato = ripasso.stato;
    casoCorrente.passo = ripasso.passo;
    casoCorrente.prossimoRipasso = ripasso.prossimo_ripasso;

    // Sapere quando tornera' e' la parte che rende utile il sistema:
    // senza, sembra che le risposte non lascino traccia.
    const quando = document.createElement('p');
    quando.className = 'prossimo-ripasso';
    quando.innerHTML =
      '<i class="ph ph-clock-counter-clockwise" aria-hidden="true"></i> ' +
      `Rivedrai questo caso ${quandoTorna(ripasso.giorni)}.`;
    elRisultato.appendChild(quando);
  }

  if (!ripasso?.ok || !salvataRisposta) {
    elRisultato.innerHTML +=
      '<p class="avviso"><i class="ph ph-warning" aria-hidden="true"></i> Non sono riuscita a salvare tutto nel database.</p>';
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

    preparaCoda();
    aggiornaRiepilogo();

    elScheletro.remove();
    elCaso.hidden = false;
    mostraCaso(scegliCaso());
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

// Il conteggio parte solo a pagina protetta: senza profilo non
// c'e' nessuno a cui attribuire il tempo.
proteggiPagina().then((profilo) => {
  if (profilo) misuraTempo('quiz');
  if (profilo) avvia();
});
