import {
  getPianiStudio,
  inserisciPiano,
  aggiornaFattePiano,
  eliminaPiano,
  calcolaPiano,
  getDateEsame,
  titoloData,
  nomeTipoData,
  giorniMancanti,
} from './db.js?v=21';
import { proteggiPagina } from './auth.js?v=10';

const elScheletro = document.getElementById('scheletro');
const elPiani = document.getElementById('piani');
const finestra = document.getElementById('finestra-piano');
const form = document.getElementById('form-piano');
const esito = document.getElementById('piano-esito');

const NOMI_GIORNI = [
  { n: 1, nome: 'Lun' },
  { n: 2, nome: 'Mar' },
  { n: 3, nome: 'Mer' },
  { n: 4, nome: 'Gio' },
  { n: 5, nome: 'Ven' },
  { n: 6, nome: 'Sab' },
  { n: 7, nome: 'Dom' },
];

let piani = [];
let date = [];

function oggiIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${g}`;
}

function dataBreve(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function plurale(n, uno, molti) {
  return `${n} ${n === 1 ? uno : molti}`;
}

/* ---------- Una scheda di piano ---------- */

function creaScheda(piano) {
  const calcolo = calcolaPiano(piano, oggiIso());
  const mancano = giorniMancanti(piano.fine);
  const finito = piano.fatte >= piano.totale_lezioni;

  const card = document.createElement('article');
  card.className = 'piano-card';

  /* Testata */
  const testa = document.createElement('div');
  testa.className = 'piano-testa';

  const titolo = document.createElement('div');
  const nome = document.createElement('h2');
  nome.className = 'piano-nome';
  nome.textContent = piano.titolo;
  titolo.appendChild(nome);

  const quando = document.createElement('p');
  quando.className = 'piano-quando';
  quando.textContent =
    mancano < 0
      ? `Esame passato il ${dataBreve(piano.fine)}`
      : mancano === 0
        ? "L'esame e oggi."
        : `${plurale(mancano, 'giorno', 'giorni')} all'esame del ${dataBreve(piano.fine)}`;
  titolo.appendChild(quando);
  testa.appendChild(titolo);

  const togli = document.createElement('button');
  togli.type = 'button';
  togli.className = 'link-bottone';
  togli.textContent = 'Elimina';
  togli.addEventListener('click', async () => {
    if (!window.confirm(`Eliminare il piano per ${piano.titolo}?`)) return;
    togli.disabled = true;
    if (await eliminaPiano(piano.id)) {
      piani = piani.filter((p) => p.id !== piano.id);
      disegna();
    } else {
      togli.disabled = false;
    }
  });
  testa.appendChild(togli);
  card.appendChild(testa);

  /* Avanzamento */
  const avanzamento = document.createElement('div');
  avanzamento.className = 'piano-avanzamento';

  const barra = document.createElement('span');
  barra.className = 'stato-barra';
  const pieno = document.createElement('span');
  pieno.className = 'stato-barra-pieno';
  pieno.style.width = `${(piano.fatte / piano.totale_lezioni) * 100}%`;
  barra.appendChild(pieno);
  avanzamento.appendChild(barra);

  const conto = document.createElement('span');
  conto.className = 'piano-conto';
  conto.textContent = `${piano.fatte} di ${piano.totale_lezioni}`;
  avanzamento.appendChild(conto);

  card.appendChild(avanzamento);

  /* Cosa fare oggi */
  const oggi = calcolo.giorni.find((g) => g.giorno === oggiIso());

  const riquadro = document.createElement('div');
  riquadro.className = 'piano-oggi';

  if (finito) {
    riquadro.classList.add('spento');
    riquadro.textContent = 'Hai finito tutte le lezioni di questo piano.';
  } else if (!calcolo.fattibile && calcolo.giorniUtili === 0) {
    riquadro.classList.add('allarme');
    riquadro.textContent =
      'Non restano giorni utili prima dell esame. Togli qualche giorno libero, o sposta la data.';
  } else if (!calcolo.fattibile) {
    riquadro.classList.add('allarme');
    riquadro.textContent =
      `Servirebbero ${calcolo.alGiorno.toFixed(1)} lezioni al giorno per arrivare in fondo. ` +
      'E tanto: valuta se togliere un giorno libero o ridurre il programma.';
  } else if (oggi) {
    const titoloOggi = document.createElement('p');
    titoloOggi.className = 'piano-oggi-titolo';
    titoloOggi.textContent = `Oggi: ${plurale(oggi.quante, 'lezione', 'lezioni')}`;
    riquadro.appendChild(titoloOggi);

    const quali = document.createElement('p');
    quali.className = 'piano-oggi-quali';
    quali.textContent = oggi.da === oggi.a ? `la numero ${oggi.da}` : `dalla ${oggi.da} alla ${oggi.a}`;
    riquadro.appendChild(quali);
  } else {
    riquadro.classList.add('spento');
    riquadro.textContent = 'Oggi e uno dei giorni che ti sei lasciata libera.';
  }

  card.appendChild(riquadro);

  /* Segnare le lezioni fatte */
  if (!finito) {
    const azioni = document.createElement('div');
    azioni.className = 'piano-azioni';

    const meno = document.createElement('button');
    meno.type = 'button';
    meno.className = 'btn btn-neutro btn-piccolo';
    meno.innerHTML = '<i class="ph ph-minus" aria-hidden="true"></i>';
    meno.setAttribute('aria-label', 'Togli una lezione fatta');
    meno.disabled = piano.fatte === 0;

    const piu = document.createElement('button');
    piu.type = 'button';
    piu.className = 'btn btn-piccolo';
    piu.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i> Ho fatto una lezione';

    async function cambia(delta) {
      const nuovo = Math.min(Math.max(piano.fatte + delta, 0), piano.totale_lezioni);
      if (nuovo === piano.fatte) return;
      meno.disabled = true;
      piu.disabled = true;
      if (await aggiornaFattePiano(piano.id, nuovo)) {
        piano.fatte = nuovo;
        disegna();
      } else {
        meno.disabled = false;
        piu.disabled = false;
      }
    }

    meno.addEventListener('click', () => cambia(-1));
    piu.addEventListener('click', () => cambia(1));

    azioni.appendChild(piu);
    azioni.appendChild(meno);
    card.appendChild(azioni);
  }

  /* I prossimi giorni */
  if (calcolo.giorni.length > 0) {
    const prossimi = document.createElement('div');
    prossimi.className = 'piano-giorni';

    calcolo.giorni.slice(0, 7).forEach((g) => {
      const riga = document.createElement('div');
      riga.className = 'piano-giorno' + (g.giorno === oggiIso() ? ' oggi' : '');

      const data = document.createElement('span');
      data.className = 'piano-giorno-data';
      data.textContent = dataBreve(g.giorno);
      riga.appendChild(data);

      const quante = document.createElement('span');
      quante.className = 'piano-giorno-quante';
      quante.textContent = g.da === g.a ? `${g.da}` : `${g.da}-${g.a}`;
      riga.appendChild(quante);

      prossimi.appendChild(riga);
    });

    card.appendChild(prossimi);

    const nota = document.createElement('p');
    nota.className = 'blocco-nota';
    nota.textContent =
      `${plurale(calcolo.giorniUtili, 'giorno utile', 'giorni utili')} prima dell esame, ` +
      `${calcolo.alGiorno.toFixed(1)} lezioni al giorno. ` +
      'Se salti un giorno, il piano si ridistribuisce da solo.';
    card.appendChild(nota);
  }

  return card;
}

function disegna() {
  elPiani.innerHTML = '';

  if (piani.length === 0) {
    elPiani.innerHTML = `
      <div class="stato-vuoto">
        <i class="ph ph-path" aria-hidden="true"></i>
        <p>Nessun piano. Comincia da un esame che hai davanti.</p>
      </div>
    `;
    return;
  }

  piani.forEach((p) => elPiani.appendChild(creaScheda(p)));
}

/* ---------- Finestra ---------- */

function preparaFinestra() {
  const scelta = document.getElementById('giorni-liberi');
  scelta.innerHTML = '';

  NOMI_GIORNI.forEach((g) => {
    const etichetta = document.createElement('label');
    etichetta.className = 'giorno-scelta';

    const casella = document.createElement('input');
    casella.type = 'checkbox';
    casella.name = 'liberi';
    casella.value = g.n;
    // La domenica libera e' solo una partenza, non una regola.
    if (g.n === 7) casella.checked = true;
    etichetta.appendChild(casella);

    const testo = document.createElement('span');
    testo.textContent = g.nome;
    etichetta.appendChild(testo);

    scelta.appendChild(etichetta);
  });

  const elenco = document.getElementById('piano-data');
  const future = date.filter((d) => giorniMancanti(d.giorno) >= 0);

  future.forEach((d) => {
    const opzione = document.createElement('option');
    opzione.value = d.id;
    opzione.dataset.giorno = d.giorno;
    opzione.dataset.titolo = titoloData(d);
    opzione.textContent = `${titoloData(d)} · ${nomeTipoData(d.tipo)} · ${dataBreve(d.giorno)}`;
    elenco.appendChild(opzione);
  });

  elenco.addEventListener('change', () => {
    const scelto = elenco.selectedOptions[0];
    if (!scelto || !scelto.dataset.giorno) return;
    document.getElementById('piano-fine').value = scelto.dataset.giorno;
    const titolo = document.getElementById('piano-titolo');
    if (!titolo.value) titolo.value = scelto.dataset.titolo;
  });
}

document.getElementById('apri-nuovo').addEventListener('click', () => {
  form.reset();
  esito.textContent = '';
  esito.className = 'esito-form';
  document.querySelectorAll('#giorni-liberi input').forEach((c) => {
    c.checked = Number(c.value) === 7;
  });
  finestra.showModal();
});

document.getElementById('chiudi-finestra').addEventListener('click', () => finestra.close());
finestra.addEventListener('click', (e) => {
  if (e.target === finestra) finestra.close();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dati = new FormData(form);

  const liberi = dati.getAll('liberi').map(Number);
  const fine = dati.get('fine');

  if (fine < oggiIso()) {
    esito.className = 'esito-form ko';
    esito.textContent = 'La data dell esame e gia passata.';
    return;
  }

  if (liberi.length === 7) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Se sono liberi tutti i giorni non resta niente su cui distribuire.';
    return;
  }

  esito.className = 'esito-form attesa';
  esito.textContent = 'Creazione';

  const idData = dati.get('data_esame_id');

  const salvato = await inserisciPiano({
    data_esame_id: idData ? Number(idData) : null,
    titolo: dati.get('titolo').trim(),
    totale_lezioni: Number(dati.get('totale_lezioni')),
    inizio: oggiIso(),
    fine,
    giorni_liberi: liberi,
  });

  if (!salvato) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Non sono riuscita a creare il piano.';
    return;
  }

  piani.push(salvato);
  piani.sort((a, b) => a.fine.localeCompare(b.fine));
  finestra.close();
  disegna();
});

/* ---------- Avvio ---------- */

async function avvia() {
  try {
    [piani, date] = await Promise.all([getPianiStudio(), getDateEsame()]);

    preparaFinestra();
    disegna();

    elScheletro.remove();
    elPiani.hidden = false;
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia();
});
