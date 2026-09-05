import {
  getDomandeEsame,
  incrementaVolte,
  getNoteDomanda,
  aggiungiNota,
  eliminaNota,
} from './db.js?v=16';
import { iconaPerMateria } from './materie.js?v=3';
import { proteggiPagina } from './auth.js?v=9';
import { misuraTempo } from './tempo.js?v=1';

const parametri = new URLSearchParams(window.location.search);
const materiaScelta = parametri.get('materia');

const elScheletro = document.getElementById('scheletro');
const elContenuto = document.getElementById('contenuto-domande');
const elTitolo = document.getElementById('titolo');
const elSottotitolo = document.getElementById('sottotitolo');
const elAzioni = document.getElementById('azioni-testata');

const finestra = document.getElementById('finestra-note');
const elNoteElenco = document.getElementById('note-elenco');
const elNoteDomanda = document.getElementById('note-domanda');
const formNota = document.getElementById('form-nota');
const campoNota = document.getElementById('nota-testo');
const esitoNota = document.getElementById('nota-esito');

let domandaAperta = null;

/* ---------- Formattazione ---------- */

function etichettaVolte(n) {
  return n === 1 ? 'chiesta 1 volta' : `chiesta ${n} volte`;
}

function etichettaNote(n) {
  if (n === 0) return 'Nessuna nota';
  return n === 1 ? '1 nota' : `${n} note`;
}

function formattaData(iso) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ---------- Finestra delle note ---------- */

function creaRigaNota(nota, alCambio) {
  const riga = document.createElement('article');
  riga.className = 'nota';

  const testo = document.createElement('p');
  testo.className = 'nota-testo';
  testo.textContent = nota.testo;
  riga.appendChild(testo);

  const piede = document.createElement('div');
  piede.className = 'nota-piede';

  const firma = document.createElement('span');
  firma.textContent = `${nota.mia ? 'tu' : nota.autoreNome} · ${formattaData(nota.created_at)}`;
  piede.appendChild(firma);

  // Ognuno cancella solo le proprie: il database rifiuta il resto.
  if (nota.mia) {
    const togli = document.createElement('button');
    togli.type = 'button';
    togli.className = 'link-bottone';
    togli.textContent = 'Elimina';
    togli.addEventListener('click', async () => {
      if (!window.confirm('Eliminare questa nota?')) return;
      togli.disabled = true;
      if (await eliminaNota(nota.id)) {
        riga.remove();
        alCambio(-1);
      } else {
        togli.disabled = false;
      }
    });
    piede.appendChild(togli);
  }

  riga.appendChild(piede);
  return riga;
}

function mostraVuotoNote() {
  elNoteElenco.innerHTML =
    '<p class="finestra-vuoto">Ancora nessuna nota su questa domanda. Scrivi la prima qui sotto.</p>';
}

async function apriNote(domanda, aggiornaEtichetta) {
  domandaAperta = domanda;
  elNoteDomanda.textContent = domanda.domanda;
  elNoteElenco.innerHTML = '<div class="scheletro scheletro-riga"></div>';
  esitoNota.textContent = '';
  esitoNota.className = 'esito-form';
  campoNota.value = '';

  finestra.showModal();

  const note = await getNoteDomanda(domanda.id);

  function alCambio(delta) {
    domanda.quanteNote += delta;
    aggiornaEtichetta(domanda.quanteNote);
    if (!elNoteElenco.querySelector('.nota')) mostraVuotoNote();
  }

  elNoteElenco.innerHTML = '';
  if (note.length === 0) {
    mostraVuotoNote();
  } else {
    note.forEach((nota) => elNoteElenco.appendChild(creaRigaNota(nota, alCambio)));
  }

  // Il form deve sapere a quale domanda sta scrivendo e come aggiornare
  // il conteggio sulla card che sta sotto.
  formNota.onsubmit = async (e) => {
    e.preventDefault();
    const testo = campoNota.value.trim();
    if (!testo) return;

    esitoNota.className = 'esito-form attesa';
    esitoNota.textContent = 'Salvataggio';

    const salvata = await aggiungiNota(domanda.id, testo);

    if (!salvata) {
      esitoNota.className = 'esito-form ko';
      esitoNota.textContent = 'Non sono riuscita a salvare la nota.';
      return;
    }

    if (!elNoteElenco.querySelector('.nota')) elNoteElenco.innerHTML = '';
    elNoteElenco.appendChild(
      creaRigaNota({ ...salvata, mia: true, autoreNome: 'tu' }, alCambio)
    );
    campoNota.value = '';
    esitoNota.textContent = '';
    esitoNota.className = 'esito-form';
    alCambio(1);
  };
}

document.getElementById('chiudi-note').addEventListener('click', () => finestra.close());

// Cliccare fuori dal riquadro lo chiude, come ci si aspetta.
finestra.addEventListener('click', (e) => {
  if (e.target === finestra) finestra.close();
});

/* ---------- Card di una domanda ---------- */

function creaCardDomanda(domanda) {
  const card = document.createElement('article');
  card.className = 'domanda-card';

  const testata = document.createElement('div');
  testata.className = 'domanda-testata';

  const blocco = document.createElement('div');
  const testo = document.createElement('p');
  testo.className = 'domanda-testo';
  testo.textContent = domanda.domanda;
  blocco.appendChild(testo);

  if (domanda.argomento) {
    const argomento = document.createElement('p');
    argomento.className = 'domanda-argomento';
    argomento.textContent = domanda.argomento;
    blocco.appendChild(argomento);
  }
  testata.appendChild(blocco);

  const conteggio = document.createElement('div');
  conteggio.className = 'domanda-conteggio';

  const valore = document.createElement('span');
  valore.className = 'conteggio-valore';
  valore.textContent = etichettaVolte(domanda.volte);
  conteggio.appendChild(valore);

  const piu = document.createElement('button');
  piu.type = 'button';
  piu.className = 'btn-piu';
  piu.title = 'Segnala che e stata chiesta di nuovo';
  piu.setAttribute('aria-label', 'Segnala che e stata chiesta di nuovo');
  piu.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i>';

  piu.addEventListener('click', async () => {
    piu.disabled = true;
    const nuovo = await incrementaVolte(domanda.id);
    if (nuovo !== null) {
      domanda.volte = nuovo;
      valore.textContent = etichettaVolte(nuovo);
    }
    piu.disabled = false;
  });
  conteggio.appendChild(piu);

  testata.appendChild(conteggio);
  card.appendChild(testata);

  /* Le note non stanno sulla card: si aprono a parte. */
  const piede = document.createElement('div');
  piede.className = 'domanda-piede';

  const bottoneNote = document.createElement('button');
  bottoneNote.type = 'button';
  bottoneNote.className = 'btn-note';

  const iconaNote = document.createElement('i');
  iconaNote.className = 'ph ph-note';
  iconaNote.setAttribute('aria-hidden', 'true');

  const etichettaBottone = document.createElement('span');

  function aggiornaEtichetta(quante) {
    etichettaBottone.textContent = etichettaNote(quante);
    bottoneNote.classList.toggle('vuoto', quante === 0);
  }
  aggiornaEtichetta(domanda.quanteNote);

  bottoneNote.appendChild(iconaNote);
  bottoneNote.appendChild(etichettaBottone);
  bottoneNote.addEventListener('click', () => apriNote(domanda, aggiornaEtichetta));

  piede.appendChild(bottoneNote);
  card.appendChild(piede);

  return card;
}

/* ---------- Indice delle materie ---------- */

function creaCardMateria(nome, domande) {
  const a = document.createElement('a');
  a.className = 'materia-card';
  a.href = `domande.html?materia=${encodeURIComponent(nome)}`;

  const testata = document.createElement('div');
  testata.className = 'materia-testata';

  const badge = document.createElement('span');
  badge.className = 'materia-icona';
  const icona = document.createElement('i');
  icona.className = `ph ${iconaPerMateria(nome)}`;
  icona.setAttribute('aria-hidden', 'true');
  badge.appendChild(icona);
  testata.appendChild(badge);

  const testo = document.createElement('div');
  const titolo = document.createElement('div');
  titolo.className = 'materia-nome';
  titolo.textContent = nome;
  testo.appendChild(titolo);

  const quante = document.createElement('div');
  quante.className = 'materia-conteggio';
  quante.textContent =
    domande.length === 1 ? '1 domanda' : `${domande.length} domande`;
  testo.appendChild(quante);

  testata.appendChild(testo);
  a.appendChild(testata);

  return a;
}

function mostraIndice(domande) {
  elAzioni.innerHTML =
    '<a href="aggiungi-domanda.html" class="btn"><i class="ph ph-plus" aria-hidden="true"></i> Aggiungi domanda</a>';

  const griglia = document.createElement('div');
  griglia.className = 'materie-grid';

  [...new Set(domande.map((d) => d.materia))].sort().forEach((nome) => {
    griglia.appendChild(creaCardMateria(nome, domande.filter((d) => d.materia === nome)));
  });

  elContenuto.appendChild(griglia);
}

/* ---------- Interrogazione ---------- */

function mescola(elenco) {
  const copia = [...elenco];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function avviaInterrogazione(domande, quante, alTermine) {
  const scelte = mescola(domande).slice(0, quante);
  let indice = 0;

  const pannello = document.createElement('section');
  pannello.className = 'interrogazione';

  const barra = document.createElement('div');
  barra.className = 'interrogazione-barra';

  const avanzamento = document.createElement('span');
  avanzamento.className = 'interrogazione-avanzamento';

  const esci = document.createElement('button');
  esci.type = 'button';
  esci.className = 'link-bottone';
  esci.textContent = 'Esci dall interrogazione';
  esci.addEventListener('click', alTermine);

  barra.appendChild(avanzamento);
  barra.appendChild(esci);
  pannello.appendChild(barra);

  const corpo = document.createElement('div');
  pannello.appendChild(corpo);

  const azioni = document.createElement('div');
  azioni.className = 'interrogazione-azioni';

  const prossima = document.createElement('button');
  prossima.type = 'button';
  prossima.className = 'btn';
  azioni.appendChild(prossima);
  pannello.appendChild(azioni);

  function mostra() {
    const domanda = scelte[indice];
    avanzamento.textContent = `Domanda ${indice + 1} di ${scelte.length}`;
    corpo.innerHTML = '';
    corpo.appendChild(creaCardDomanda(domanda));

    prossima.innerHTML =
      indice === scelte.length - 1
        ? '<i class="ph ph-check" aria-hidden="true"></i> Ho finito'
        : '<i class="ph ph-arrow-right" aria-hidden="true"></i> Prossima domanda';
  }

  prossima.addEventListener('click', () => {
    if (indice === scelte.length - 1) {
      alTermine();
      return;
    }
    indice += 1;
    mostra();
  });

  mostra();
  return pannello;
}

function creaComandiInterrogazione(domande, disegnaElenco) {
  const barra = document.createElement('div');
  barra.className = 'comandi-interrogazione';

  const etichetta = document.createElement('span');
  etichetta.className = 'comandi-etichetta';
  etichetta.textContent = 'Interrogami su';
  barra.appendChild(etichetta);

  // Non ha senso proporre 10 domande se ce ne sono 3.
  const possibili = [1, 3, 5, 10].filter((n) => n <= domande.length);
  if (possibili.length === 0 || possibili[possibili.length - 1] < domande.length) {
    possibili.push(domande.length);
  }

  [...new Set(possibili)].forEach((quante) => {
    const bottone = document.createElement('button');
    bottone.type = 'button';
    bottone.className = 'btn btn-neutro btn-piccolo';
    bottone.textContent = quante === 1 ? '1 domanda' : `${quante} domande`;
    bottone.addEventListener('click', () => {
      elContenuto.innerHTML = '';
      elContenuto.appendChild(
        avviaInterrogazione(domande, quante, () => {
          elContenuto.innerHTML = '';
          disegnaElenco();
        })
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    barra.appendChild(bottone);
  });

  return barra;
}

/* ---------- Dettaglio di una materia ---------- */

function mostraMateria(domande) {
  elTitolo.textContent = materiaScelta;
  elSottotitolo.textContent =
    domande.length === 1
      ? '1 domanda raccolta, dalla piu chiesta.'
      : `${domande.length} domande raccolte, dalla piu chiesta.`;

  elAzioni.innerHTML =
    '<a href="domande.html" class="link-testo"><i class="ph ph-arrow-left" aria-hidden="true"></i> Tutte le materie</a>';

  function disegnaElenco() {
    elContenuto.appendChild(creaComandiInterrogazione(domande, disegnaElenco));

    const elenco = document.createElement('div');
    elenco.className = 'elenco-domande';
    domande.forEach((d) => elenco.appendChild(creaCardDomanda(d)));
    elContenuto.appendChild(elenco);
  }

  disegnaElenco();
}

/* ---------- Avvio ---------- */

async function avvia() {
  try {
    const domande = await getDomandeEsame(materiaScelta || undefined);

    if (domande.length === 0) {
      elScheletro.innerHTML = `
        <div class="stato-vuoto">
          <i class="ph ph-exam" aria-hidden="true"></i>
          <p>${materiaScelta ? 'Nessuna domanda per questa materia.' : "Nessuna domanda d'esame raccolta finora."}</p>
          <a class="btn" href="aggiungi-domanda.html"><i class="ph ph-plus" aria-hidden="true"></i> Aggiungi una domanda</a>
        </div>
      `;
      if (materiaScelta) {
        elTitolo.textContent = materiaScelta;
        elAzioni.innerHTML =
          '<a href="domande.html" class="link-testo"><i class="ph ph-arrow-left" aria-hidden="true"></i> Tutte le materie</a>';
      }
      return;
    }

    elScheletro.remove();

    if (materiaScelta) {
      mostraMateria(domande);
    } else {
      mostraIndice(domande);
    }
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

// Il conteggio parte solo a pagina protetta: senza profilo non
// c'e' nessuno a cui attribuire il tempo.
proteggiPagina().then((profilo) => {
  if (profilo) misuraTempo('domande');
  if (profilo) avvia();
});
