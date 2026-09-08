import {
  getSuggerimenti,
  ultimoErroreDb,
  inserisciSuggerimento,
  cambiaStatoSuggerimento,
  eliminaSuggerimento,
  STATI_SUGGERIMENTO,
} from './db.js?v=12384483';
import { proteggiPagina } from './auth.js?v=18118483';
import { offriAnnulla } from './annulla.js?v=85184409';

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
      const gesto = await eliminaSuggerimento(voce.id);
      if (gesto) {
        offriAnnulla(`Il suggerimento "${voce.titolo}"`, gesto, () => window.location.reload());
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

function apriFinestra() {
  form.reset();
  esito.textContent = '';
  esito.className = 'esito-form';
  finestra.showModal();
  document.getElementById('sugg-titolo').focus();
}

document.getElementById('apri-nuovo').addEventListener('click', apriFinestra);

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
    esito.textContent = `Non sono riuscita a salvare il suggerimento. ${ultimoErroreDb() || ''}`.trim();
    return;
  }

  finestra.close();

  if (admin) {
    // L'amministratrice la lista ce l'ha: la si rilegge dal database,
    // che e' l'unico posto che sa com'e' venuta fuori la riga.
    suggerimenti = await getSuggerimenti();
    disegna();
    return;
  }

  ringrazia();
});

/* ---------- Quello che vede chi non e' l'amministratrice ----------
   Solo l'invito a proporre. Le proposte degli altri non si vedono, e
   non e' una scortesia: sono appunti di lavoro fra Giulia e chi tiene
   Akesis, non una bacheca pubblica. */

function pannelloProposta() {
  const scatola = document.createElement('div');
  scatola.className = 'sugg-invito';

  const icona = document.createElement('i');
  icona.className = 'ph ph-lightbulb';
  icona.setAttribute('aria-hidden', 'true');
  scatola.appendChild(icona);

  const titolo = document.createElement('p');
  titolo.className = 'sugg-invito-titolo';
  titolo.textContent = 'Ti manca qualcosa in Akesis?';
  scatola.appendChild(titolo);

  const testo = document.createElement('p');
  testo.className = 'sugg-invito-testo';
  testo.textContent =
    'Scrivilo qui. Le proposte le legge chi tiene Akesis, una per una. '
    + 'Non serve che sia un\'idea finita: basta dire cosa ti serviva e non hai trovato.';
  scatola.appendChild(testo);

  const tasto = document.createElement('button');
  tasto.type = 'button';
  tasto.className = 'btn btn-primario';
  tasto.textContent = 'Proponi qualcosa';
  tasto.addEventListener('click', () => apriFinestra());
  scatola.appendChild(tasto);

  return scatola;
}

function ringrazia() {
  elElenco.innerHTML = '';
  const scatola = document.createElement('div');
  scatola.className = 'sugg-invito';

  const icona = document.createElement('i');
  icona.className = 'ph ph-check-circle';
  icona.setAttribute('aria-hidden', 'true');
  scatola.appendChild(icona);

  const titolo = document.createElement('p');
  titolo.className = 'sugg-invito-titolo';
  titolo.textContent = 'Arrivata, grazie';
  scatola.appendChild(titolo);

  const testo = document.createElement('p');
  testo.className = 'sugg-invito-testo';
  testo.textContent = 'La tua proposta e stata registrata. Se te ne viene un altra, scrivi pure.';
  scatola.appendChild(testo);

  const tasto = document.createElement('button');
  tasto.type = 'button';
  tasto.className = 'btn btn-neutro';
  tasto.textContent = 'Proponine un altra';
  tasto.addEventListener('click', () => apriFinestra());
  scatola.appendChild(tasto);

  elElenco.appendChild(scatola);
}

/* ---------- Avvio ---------- */

async function avvia(profilo) {
  io = profilo.id;
  admin = profilo.ruolo === 'admin';

  try {
    /* Chi non e' amministratrice non vede le proposte degli altri: la
       pagina serve solo a mandarne una. La lista non si chiede nemmeno
       -- il database la rifiuterebbe comunque, ma chiedere una cosa
       che si sa gia' negata e' un errore in attesa di succedere. */
    if (!admin) {
      /* Il tasto in alto e quello nella scatola sono lo stesso tasto:
         due primari identici sullo stesso schermo non aiutano nessuno.
         Resta quello dentro, che ha accanto la spiegazione. */
      document.getElementById('apri-nuovo').hidden = true;
      document.querySelector('.page-sub').textContent =
        'Ti serviva qualcosa e non l\'hai trovato? Scrivilo qui: le proposte '
        + 'le legge chi tiene Akesis.';
      elElenco.appendChild(pannelloProposta());
      elScheletro.remove();
      elElenco.hidden = false;
      return;
    }

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
