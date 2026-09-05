import {
  getCasiInAttesa,
  approvaCaso,
  eliminaCaso,
  getMaterialiInAttesa,
  approvaMateriale,
  eliminaMateriale,
  linkMateriali,
} from './db.js?v=23';
import { proteggiPagina } from './auth.js?v=10';
import { iconaPerMateria } from './materie.js?v=3';

const elScheletro = document.getElementById('scheletro');
const elProposte = document.getElementById('proposte');
const elProposteMateriali = document.getElementById('proposte-materiali');
const elSezioneCasi = document.getElementById('sezione-casi');
const elSezioneMateriali = document.getElementById('sezione-materiali');
const elTuttoFatto = document.getElementById('tutto-fatto');

function creaOpzioni(caso) {
  const ul = document.createElement('ul');
  ul.className = 'caso-opzioni';

  [
    { lettera: 'a', testo: caso.opzione_a },
    { lettera: 'b', testo: caso.opzione_b },
    { lettera: 'c', testo: caso.opzione_c },
    { lettera: 'd', testo: caso.opzione_d },
  ].forEach((opz) => {
    const li = document.createElement('li');
    if (opz.lettera === caso.risposta_corretta) li.className = 'giusta';

    const lettera = document.createElement('span');
    lettera.className = 'opzione-lettera';
    lettera.textContent = opz.lettera.toUpperCase();
    li.appendChild(lettera);
    li.appendChild(document.createTextNode(opz.testo));

    ul.appendChild(li);
  });

  return ul;
}

function creaProposta(caso) {
  const card = document.createElement('article');
  card.className = 'card-caso';

  const materia = document.createElement('p');
  materia.className = 'caso-materia';
  const icona = document.createElement('i');
  icona.className = `ph ${iconaPerMateria(caso.materia)}`;
  icona.setAttribute('aria-hidden', 'true');
  materia.appendChild(icona);
  materia.appendChild(
    document.createTextNode(caso.argomento ? `${caso.materia} · ${caso.argomento}` : caso.materia)
  );
  card.appendChild(materia);

  const vignetta = document.createElement('p');
  vignetta.className = 'caso-vignetta';
  vignetta.textContent = caso.vignetta;
  card.appendChild(vignetta);

  const domanda = document.createElement('p');
  domanda.className = 'caso-domanda';
  domanda.textContent = caso.domanda;
  card.appendChild(domanda);

  card.appendChild(creaOpzioni(caso));

  const spiegazione = document.createElement('p');
  spiegazione.className = 'caso-spiegazione';
  spiegazione.textContent = caso.spiegazione;
  card.appendChild(spiegazione);

  const azioni = document.createElement('div');
  azioni.className = 'azioni-revisione';

  const approva = document.createElement('button');
  approva.type = 'button';
  approva.className = 'btn';
  approva.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i> Approva e pubblica';

  const rifiuta = document.createElement('button');
  rifiuta.type = 'button';
  rifiuta.className = 'btn btn-neutro';
  rifiuta.innerHTML = '<i class="ph ph-trash" aria-hidden="true"></i> Elimina';

  const esito = document.createElement('span');
  esito.className = 'esito-form';

  approva.addEventListener('click', async () => {
    approva.disabled = true;
    rifiuta.disabled = true;
    if (await approvaCaso(caso.id)) {
      card.remove();
      aggiornaConteggi();
    } else {
      esito.className = 'esito-form ko';
      esito.textContent = 'Non sono riuscita ad approvare il caso.';
      approva.disabled = false;
      rifiuta.disabled = false;
    }
  });

  rifiuta.addEventListener('click', async () => {
    if (!window.confirm('Eliminare definitivamente questa proposta?')) return;
    approva.disabled = true;
    rifiuta.disabled = true;
    if (await eliminaCaso(caso.id)) {
      card.remove();
      aggiornaConteggi();
    } else {
      esito.className = 'esito-form ko';
      esito.textContent = 'Non sono riuscita a eliminare il caso.';
      approva.disabled = false;
      rifiuta.disabled = false;
    }
  });

  azioni.appendChild(approva);
  azioni.appendChild(rifiuta);
  azioni.appendChild(esito);
  card.appendChild(azioni);

  return card;
}

function formattaPeso(byte) {
  if (!byte) return null;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function formattaData(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ---------- Materiali proposti ---------- */

function creaPropostaMateriale(materiale, indirizzo) {
  const card = document.createElement('article');
  card.className = 'card-caso';

  const materia = document.createElement('p');
  materia.className = 'caso-materia';
  const icona = document.createElement('i');
  icona.className = `ph ${iconaPerMateria(materiale.materia)}`;
  icona.setAttribute('aria-hidden', 'true');
  materia.appendChild(icona);
  materia.appendChild(
    document.createTextNode(
      materiale.argomento ? `${materiale.materia} \u00b7 ${materiale.argomento}` : materiale.materia
    )
  );
  card.appendChild(materia);

  const titolo = document.createElement('p');
  titolo.className = 'caso-domanda';
  if (materiale.ha_chiave) {
    const lucchetto = document.createElement('i');
    lucchetto.className = 'ph ph-lock-key';
    lucchetto.setAttribute('aria-hidden', 'true');
    titolo.appendChild(lucchetto);
    titolo.appendChild(document.createTextNode(' '));
  }
  titolo.appendChild(document.createTextNode(materiale.titolo));
  card.appendChild(titolo);

  const dettagli = document.createElement('p');
  dettagli.className = 'caso-spiegazione';
  const pezzi = [`caricato da ${materiale.autoreNome}`];
  const data = formattaData(materiale.created_at);
  if (data) pezzi.push(data);
  const peso = formattaPeso(materiale.dimensione);
  if (peso) pezzi.push(peso);
  if (materiale.ha_chiave) pezzi.push('protetto da chiave');
  dettagli.textContent = pezzi.join(' \u00b7 ');
  card.appendChild(dettagli);

  const azioni = document.createElement('div');
  azioni.className = 'azioni-revisione';

  const approva = document.createElement('button');
  approva.type = 'button';
  approva.className = 'btn';
  approva.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i> Approva e pubblica';

  const rifiuta = document.createElement('button');
  rifiuta.type = 'button';
  rifiuta.className = 'btn btn-neutro';
  rifiuta.innerHTML = '<i class="ph ph-trash" aria-hidden="true"></i> Elimina';

  const esito = document.createElement('span');
  esito.className = 'esito-form';

  // Prima di approvare si deve poter guardare cosa si sta approvando.
  if (indirizzo) {
    const apri = document.createElement('a');
    apri.href = indirizzo;
    apri.target = '_blank';
    apri.rel = 'noopener noreferrer';
    apri.className = 'link-testo';
    apri.innerHTML = 'Apri PDF <i class="ph ph-arrow-up-right" aria-hidden="true"></i>';
    azioni.appendChild(apri);
  }

  approva.addEventListener('click', async () => {
    approva.disabled = true;
    rifiuta.disabled = true;
    if (await approvaMateriale(materiale.id)) {
      card.remove();
      aggiornaConteggi();
    } else {
      esito.className = 'esito-form ko';
      esito.textContent = 'Non sono riuscita ad approvare il materiale.';
      approva.disabled = false;
      rifiuta.disabled = false;
    }
  });

  rifiuta.addEventListener('click', async () => {
    if (!window.confirm(`Eliminare definitivamente "${materiale.titolo}" e il suo file?`)) return;
    approva.disabled = true;
    rifiuta.disabled = true;
    if (await eliminaMateriale(materiale.id, materiale.percorso)) {
      card.remove();
      aggiornaConteggi();
    } else {
      esito.className = 'esito-form ko';
      esito.textContent = 'Non sono riuscita a eliminare il materiale.';
      approva.disabled = false;
      rifiuta.disabled = false;
    }
  });

  azioni.appendChild(approva);
  azioni.appendChild(rifiuta);
  azioni.appendChild(esito);
  card.appendChild(azioni);

  return card;
}

/* ---------- Conteggi e stato vuoto ---------- */

function aggiornaConteggi() {
  const casi = elProposte.querySelectorAll('.card-caso').length;
  const materiali = elProposteMateriali.querySelectorAll('.card-caso').length;

  elSezioneCasi.hidden = casi === 0;
  elSezioneMateriali.hidden = materiali === 0;
  elTuttoFatto.hidden = casi + materiali > 0;

  document.getElementById('conteggio-casi').textContent = casi || '';
  document.getElementById('conteggio-materiali').textContent = materiali || '';
}

async function avvia(profilo) {
  if (profilo.ruolo !== 'admin') {
    elScheletro.innerHTML =
      '<p class="messaggio-errore"><i class="ph ph-lock" aria-hidden="true"></i> Questa pagina è riservata all\'amministratrice.</p>';
    return;
  }

  try {
    const [casi, materiali] = await Promise.all([getCasiInAttesa(), getMaterialiInAttesa()]);
    const indirizzi = await linkMateriali(materiali.map((m) => m.percorso));

    elScheletro.remove();

    casi.forEach((caso) => elProposte.appendChild(creaProposta(caso)));
    materiali.forEach((materiale) =>
      elProposteMateriali.appendChild(
        creaPropostaMateriale(materiale, indirizzi.get(materiale.percorso))
      )
    );

    aggiornaConteggi();
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia(profilo);
});
