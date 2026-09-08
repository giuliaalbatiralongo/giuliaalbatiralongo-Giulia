/* Il cestino.

   Quello che cancelli non se ne va subito: resta qui trenta giorni, e
   finche' e' qui torna com'era. Le cose buttate nello stesso gesto
   stanno insieme -- un esame con le sue date -- e insieme si rimettono
   a posto, perche' un esame senza le sue date sarebbe tornato a meta'. */

import {
  getCestino,
  annullaEliminazione,
  svuotaCestino,
  giorniNelCestino,
  GIORNI_NEL_CESTINO,
} from './db.js?v=19138326';
import { proteggiPagina } from './auth.js?v=88595912';

const elScheletro = document.getElementById('scheletro');
const elElenco = document.getElementById('elenco');
const elSvuota = document.getElementById('svuota');

let gruppi = [];

function quando(iso) {
  const d = new Date(iso);
  const oggi = new Date();
  const stessoGiorno = d.toDateString() === oggi.toDateString();
  return stessoGiorno
    ? `oggi alle ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
    : d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
}

function creaGruppo(g) {
  const box = document.createElement('div');
  box.className = 'cestino-voce';

  const testo = document.createElement('div');
  testo.className = 'cestino-testo';

  g.voci.forEach((v) => {
    const riga = document.createElement('p');
    riga.className = 'cestino-riga';

    const tipo = document.createElement('span');
    tipo.className = 'cestino-tipo';
    tipo.textContent = v.tipo;
    riga.appendChild(tipo);

    const nome = document.createElement('span');
    nome.className = 'cestino-nome';
    nome.textContent = v.titolo;
    riga.appendChild(nome);

    testo.appendChild(riga);
  });

  const meta = document.createElement('p');
  meta.className = 'cestino-meta';
  const restano = giorniNelCestino(g.quando);
  meta.textContent =
    `Buttato ${quando(g.quando)} · `
    + (restano === 0
      ? 'sta per essere cancellato'
      : restano === 1
        ? 'resta ancora un giorno'
        : `restano ancora ${restano} giorni`);
  testo.appendChild(meta);

  box.appendChild(testo);

  const rimetti = document.createElement('button');
  rimetti.type = 'button';
  rimetti.className = 'btn btn-neutro btn-piccolo';
  rimetti.innerHTML = '<i class="ph ph-arrow-counter-clockwise" aria-hidden="true"></i> Ripristina';
  rimetti.addEventListener('click', async () => {
    rimetti.disabled = true;
    // Le cose senza gesto sono quelle buttate prima che il cestino
    // esistesse: si rimettono a posto una per una.
    const fatto = g.gesto
      ? await annullaEliminazione(g.gesto)
      : await annullaEliminazione(g.voci[0].gesto);
    if (fatto) await ricarica();
    else rimetti.disabled = false;
  });
  box.appendChild(rimetti);

  return box;
}

function disegna() {
  elElenco.innerHTML = '';
  elSvuota.hidden = gruppi.length === 0;

  if (gruppi.length === 0) {
    elElenco.innerHTML = `
      <div class="stato-vuoto">
        <i class="ph ph-trash" aria-hidden="true"></i>
        <p>Il cestino e vuoto.</p>
      </div>
    `;
    return;
  }

  const conto = document.createElement('p');
  conto.className = 'cestino-conto';
  conto.textContent =
    gruppi.length === 1
      ? 'Una cosa nel cestino'
      : `${gruppi.length} cose nel cestino`;
  elElenco.appendChild(conto);

  gruppi.forEach((g) => elElenco.appendChild(creaGruppo(g)));
}

async function ricarica() {
  gruppi = await getCestino();
  disegna();
}

elSvuota.addEventListener('click', async () => {
  const quante = gruppi.length;
  if (!window.confirm(
    `Svuotare il cestino? ${quante === 1 ? 'La cosa che c e dentro' : `Le ${quante} cose che ci sono dentro`} `
    + 'verranno cancellate davvero, e non si potranno piu recuperare.'
  )) return;
  elSvuota.disabled = true;
  if (await svuotaCestino()) await ricarica();
  elSvuota.disabled = false;
});

async function avvia() {
  try {
    await ricarica();
    elScheletro.remove();
    elElenco.hidden = false;
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia();
});
