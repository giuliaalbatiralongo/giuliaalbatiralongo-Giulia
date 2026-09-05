import {
  getSuggerimenti,
  inserisciSuggerimento,
  cambiaStatoSuggerimento,
  eliminaSuggerimento,
  STATI_SUGGERIMENTO,
} from './db.js?v=25';
import { proteggiPagina } from './auth.js?v=10';

const elScheletro = document.getElementById('scheletro');
const elElenco = document.getElementById('suggerimenti');
const finestra = document.getElementById('finestra-suggerimento');
const form = document.getElementById('form-suggerimento');
const esito = document.getElementById('sugg-esito');

let suggerimenti = [];
let io = null;
let admin = false;

function dataBreve(iso) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ---------- Una scheda ---------- */

function creaScheda(voce) {
  const stato = STATI_SUGGERIMENTO.find((s) => s.chiave === voce.stato) || STATI_SUGGERIMENTO[0];

  const card = document.createElement('article');
  card.className = 'sugg-card stato-' + stato.chiave.replace(' ', '-');

  // Lo stato non si ripete sulla scheda: lo dice gia' il titolo del
  // gruppo sopra. Sulla scheda resta solo la riga di colore a sinistra.
  const titolo = document.createElement('h3');
  titolo.className = 'sugg-titolo';
  titolo.textContent = voce.titolo;
  card.appendChild(titolo);

  if (voce.dettaglio) {
    const testo = document.createElement('p');
    testo.className = 'sugg-testo';
    testo.textContent = voce.dettaglio;
    card.appendChild(testo);
  }

  const piede = document.createElement('div');
  piede.className = 'sugg-piede';

  const quando = document.createElement('span');
  quando.className = 'sugg-quando';
  quando.textContent = voce.autore === io ? `Tuo, ${dataBreve(voce.created_at)}` : dataBreve(voce.created_at);
  piede.appendChild(quando);

  const azioni = document.createElement('div');
  azioni.className = 'sugg-azioni';

  // Lo stato lo cambia chi puo' davvero deciderlo: chi ha proposto
  // l'idea o l'amministratrice.
  if (admin || voce.autore === io) {
    const scelta = document.createElement('select');
    scelta.className = 'sugg-scelta';
    scelta.setAttribute('aria-label', `Stato di "${voce.titolo}"`);
    STATI_SUGGERIMENTO.forEach((s) => {
      const opzione = document.createElement('option');
      opzione.value = s.chiave;
      opzione.textContent = s.nome;
      if (s.chiave === voce.stato) opzione.selected = true;
      scelta.appendChild(opzione);
    });
    scelta.addEventListener('change', async () => {
      const nuovo = scelta.value;
      scelta.disabled = true;
      if (await cambiaStatoSuggerimento(voce.id, nuovo)) {
        voce.stato = nuovo;
        disegna();
      } else {
        scelta.value = voce.stato;
        scelta.disabled = false;
      }
    });
    azioni.appendChild(scelta);

    const togli = document.createElement('button');
    togli.type = 'button';
    togli.className = 'link-bottone';
    togli.textContent = 'Elimina';
    togli.addEventListener('click', async () => {
      if (!window.confirm(`Eliminare "${voce.titolo}"?`)) return;
      togli.disabled = true;
      if (await eliminaSuggerimento(voce.id)) {
        suggerimenti = suggerimenti.filter((s) => s.id !== voce.id);
        disegna();
      } else {
        togli.disabled = false;
      }
    });
    azioni.appendChild(togli);
  }

  piede.appendChild(azioni);
  card.appendChild(piede);
  return card;
}

/* ---------- L'elenco, diviso per stato ---------- */

function disegna() {
  elElenco.innerHTML = '';

  if (suggerimenti.length === 0) {
    elElenco.innerHTML = `
      <div class="stato-vuoto">
        <i class="ph ph-lightbulb" aria-hidden="true"></i>
        <p>Ancora nessun suggerimento. La prima idea che ti viene, scrivila qui.</p>
      </div>
    `;
    return;
  }

  STATI_SUGGERIMENTO.forEach((stato) => {
    const voci = suggerimenti.filter((s) => s.stato === stato.chiave);
    if (voci.length === 0) return;

    const testa = document.createElement('div');
    testa.className = 'sezione-testa';
    const titolo = document.createElement('h2');
    titolo.className = 'sezione-titolo sugg-gruppo';
    titolo.innerHTML = `<i class="ph ${stato.icona}" aria-hidden="true"></i>`;
    titolo.append(`${stato.nome} (${voci.length})`);
    testa.appendChild(titolo);
    elElenco.appendChild(testa);

    const griglia = document.createElement('div');
    griglia.className = 'sugg-griglia';
    voci.forEach((v) => griglia.appendChild(creaScheda(v)));
    elElenco.appendChild(griglia);
  });
}

/* ---------- Finestra ---------- */

document.getElementById('apri-nuovo').addEventListener('click', () => {
  form.reset();
  esito.textContent = '';
  esito.className = 'esito-form';
  finestra.showModal();
  document.getElementById('sugg-titolo').focus();
});

document.getElementById('chiudi-finestra').addEventListener('click', () => finestra.close());
finestra.addEventListener('click', (e) => {
  if (e.target === finestra) finestra.close();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const titolo = document.getElementById('sugg-titolo').value.trim();
  if (!titolo) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Serve almeno una riga.';
    return;
  }

  esito.className = 'esito-form attesa';
  esito.textContent = 'Salvataggio';

  const salvato = await inserisciSuggerimento(
    titolo,
    document.getElementById('sugg-dettaglio').value.trim()
  );

  if (!salvato) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Non sono riuscita a salvare il suggerimento.';
    return;
  }

  suggerimenti.unshift(salvato);
  finestra.close();
  disegna();
});

/* ---------- Avvio ---------- */

async function avvia(profilo) {
  io = profilo.id;
  admin = profilo.ruolo === 'admin';

  try {
    suggerimenti = await getSuggerimenti();
    disegna();
    elScheletro.remove();
    elElenco.hidden = false;
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia(profilo);
});
