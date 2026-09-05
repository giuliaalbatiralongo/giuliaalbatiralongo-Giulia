import { getCasiInAttesa, approvaCaso, eliminaCaso } from './db.js?v=9';
import { proteggiPagina } from './auth.js?v=5';
import { iconaPerMateria } from './materie.js?v=3';

const elScheletro = document.getElementById('scheletro');
const elProposte = document.getElementById('proposte');

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
      controllaSeVuoto();
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
      controllaSeVuoto();
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

function mostraVuoto() {
  elProposte.innerHTML = `
    <div class="stato-vuoto">
      <i class="ph ph-seal-check" aria-hidden="true"></i>
      <p>Nessuna proposta in attesa. Tutto revisionato.</p>
    </div>
  `;
}

function controllaSeVuoto() {
  if (!elProposte.querySelector('.card-caso')) mostraVuoto();
}

async function avvia(profilo) {
  if (profilo.ruolo !== 'admin') {
    elScheletro.innerHTML =
      '<p class="messaggio-errore"><i class="ph ph-lock" aria-hidden="true"></i> Questa pagina è riservata all\'amministratrice.</p>';
    return;
  }

  try {
    const proposte = await getCasiInAttesa();
    elScheletro.remove();

    if (proposte.length === 0) {
      mostraVuoto();
      return;
    }

    proposte.forEach((caso) => elProposte.appendChild(creaProposta(caso)));
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia(profilo);
});
