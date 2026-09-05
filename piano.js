import {
  getPiani,
  inserisciPiano,
  aggiornaPiano,
  aggiornaFatteFase,
  eliminaPiano,
  calcolaPiano,
  studioDiOggi,
  nomeUnita,
  FASI_PROPOSTE,
  getDateEsame,
  titoloData,
} from './db.js?v=25';
import { proteggiPagina } from './auth.js?v=10';

const elScheletro = document.getElementById('scheletro');
const elPiani = document.getElementById('piani');
const elOggi = document.getElementById('oggi');
const elOggiElenco = document.getElementById('oggi-elenco');
const finestra = document.getElementById('finestra-piano');
const form = document.getElementById('form-piano');
const esito = document.getElementById('piano-esito');
const elRighe = document.getElementById('righe-fasi');

const NOMI_GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

let piani = [];
let date = [];
// null quando si sta creando, il piano quando lo si sta correggendo.
let inModifica = null;

function oggiIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${g}`;
}

function dataBreve(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
}

function arrotonda(n) {
  // Mezza pagina non esiste: si arrotonda per eccesso, altrimenti
  // seguendo il piano alla lettera si resta sempre un po' indietro.
  return Math.ceil(n - 1e-9);
}

/* ---------- Cosa tocca oggi ---------- */

function mostraOggi() {
  const voci = studioDiOggi(piani, oggiIso());
  elOggiElenco.innerHTML = '';

  if (voci.length === 0) {
    elOggi.hidden = piani.length === 0;
    if (piani.length > 0) {
      elOggiElenco.innerHTML =
        '<p class="blocco-vuoto">Oggi non e in programma niente. Puo essere un giorno libero, o una finestra non ancora cominciata.</p>';
    }
    return;
  }

  voci.forEach((voce) => {
    const riga = document.createElement('div');
    riga.className = 'oggi-riga';

    const quanto = document.createElement('span');
    quanto.className = 'oggi-quanto';
    quanto.textContent =
      voce.quantita === null ? '-' : arrotonda(voce.quantita);
    riga.appendChild(quanto);

    const testo = document.createElement('span');
    testo.className = 'oggi-testo';

    const materia = document.createElement('span');
    materia.className = 'oggi-materia';
    materia.textContent = voce.materia;
    testo.appendChild(materia);

    const dettaglio = document.createElement('span');
    dettaglio.className = 'oggi-dettaglio';
    dettaglio.textContent =
      voce.quantita === null
        ? voce.fase
        : `${nomeUnita(voce.unita, arrotonda(voce.quantita))} · ${voce.fase}`;
    testo.appendChild(dettaglio);

    riga.appendChild(testo);
    elOggiElenco.appendChild(riga);
  });

  elOggi.hidden = false;
}

/* ---------- Scheda di una materia ---------- */

function creaScheda(piano) {
  const calcolo = calcolaPiano(piano, oggiIso());

  const card = document.createElement('article');
  card.className = 'piano-card';

  const testa = document.createElement('div');
  testa.className = 'piano-testa';

  const titolo = document.createElement('div');
  const nome = document.createElement('h2');
  nome.className = 'piano-nome';
  nome.textContent = piano.materia;
  titolo.appendChild(nome);

  const sotto = document.createElement('p');
  sotto.className = 'piano-quando';
  sotto.textContent =
    `${piano.quantita} ${nomeUnita(piano.unita, piano.quantita)} · ` +
    `${dataBreve(piano.inizio)} - ${dataBreve(piano.fine)} · ` +
    `${calcolo.giorniDisponibili} giorni utili`;
  titolo.appendChild(sotto);
  testa.appendChild(titolo);

  const azioniPiano = document.createElement('div');
  azioniPiano.className = 'piano-azioni';

  const modifica = document.createElement('button');
  modifica.type = 'button';
  modifica.className = 'link-bottone';
  modifica.textContent = 'Modifica';
  modifica.addEventListener('click', () => apriFinestra(piano));
  azioniPiano.appendChild(modifica);

  const togli = document.createElement('button');
  togli.type = 'button';
  togli.className = 'link-bottone';
  togli.textContent = 'Elimina';
  togli.addEventListener('click', async () => {
    if (!window.confirm(`Eliminare il piano di ${piano.materia}?`)) return;
    togli.disabled = true;
    if (await eliminaPiano(piano.id)) {
      piani = piani.filter((p) => p.id !== piano.id);
      disegna();
    } else {
      togli.disabled = false;
    }
  });
  azioniPiano.appendChild(togli);
  testa.appendChild(azioniPiano);
  card.appendChild(testa);

  /* Il riquadro di oggi per questa materia */
  const riquadro = document.createElement('div');
  riquadro.className = 'piano-oggi';

  if (!calcolo.fattibile) {
    riquadro.classList.add('allarme');
    riquadro.textContent =
      `Le passate chiedono ${calcolo.giorniRichiesti} giorni, ma nella finestra ce ne sono ` +
      `${calcolo.giorniDisponibili}. Accorcia una passata, allunga la finestra, o togli un giorno libero.`;
  } else if (calcolo.finito) {
    riquadro.classList.add('spento');
    riquadro.textContent = 'La finestra di questa materia e passata.';
  } else if (calcolo.faseOggi) {
    const t = document.createElement('p');
    t.className = 'piano-oggi-titolo';
    t.textContent =
      calcolo.quantitaOggi === null
        ? calcolo.faseOggi.nome
        : `${arrotonda(calcolo.quantitaOggi)} ${nomeUnita(piano.unita, arrotonda(calcolo.quantitaOggi))} oggi`;
    riquadro.appendChild(t);

    const q = document.createElement('p');
    q.className = 'piano-oggi-quali';
    q.textContent = calcolo.quantitaOggi === null ? 'Studia e basta.' : calcolo.faseOggi.nome;
    riquadro.appendChild(q);
  } else if (calcolo.oggiELibero) {
    riquadro.classList.add('spento');
    riquadro.textContent = 'Oggi e uno dei giorni che ti sei lasciata libera.';
  } else {
    riquadro.classList.add('spento');
    riquadro.textContent = 'Oggi e fuori dalla finestra di questa materia.';
  }

  card.appendChild(riquadro);

  /* Le passate */
  const elenco = document.createElement('div');
  elenco.className = 'fasi-elenco';

  calcolo.fasi.forEach((fase) => {
    const riga = document.createElement('div');
    riga.className = 'fase-riga' + (fase === calcolo.faseOggi ? ' corrente' : '');

    const info = document.createElement('div');
    const nomeFase = document.createElement('p');
    nomeFase.className = 'fase-nome';
    nomeFase.textContent = fase.nome;
    info.appendChild(nomeFase);

    const meta = document.createElement('p');
    meta.className = 'fase-meta';
    meta.textContent = fase.dal
      ? `${fase.giorni} giorni · ${dataBreve(fase.dal)} - ${dataBreve(fase.al)}`
      : `${fase.giorni} giorni · fuori dalla finestra`;
    info.appendChild(meta);
    riga.appendChild(info);

    const ritmo = document.createElement('span');
    ritmo.className = 'fase-ritmo';
    ritmo.textContent =
      fase.alGiorno === null
        ? '-'
        : `${arrotonda(fase.alGiorno)} ${nomeUnita(piano.unita, arrotonda(fase.alGiorno))}/giorno`;
    riga.appendChild(ritmo);

    /* Avanzamento della passata */
    const barra = document.createElement('span');
    barra.className = 'stato-barra';
    const pieno = document.createElement('span');
    pieno.className = 'stato-barra-pieno';
    const totale = piano.unita === 'giorni' ? fase.giorni : piano.quantita;
    pieno.style.width = `${Math.min((fase.fatte / totale) * 100, 100)}%`;
    barra.appendChild(pieno);
    riga.appendChild(barra);

    const conto = document.createElement('span');
    conto.className = 'fase-conto';
    conto.textContent = `${fase.fatte}/${totale}`;
    riga.appendChild(conto);

    const azioni = document.createElement('div');
    azioni.className = 'esame-azioni';

    const passo = fase.alGiorno === null ? 1 : Math.max(arrotonda(fase.alGiorno), 1);

    const meno = document.createElement('button');
    meno.type = 'button';
    meno.className = 'btn-piu';
    meno.innerHTML = '<i class="ph ph-minus" aria-hidden="true"></i>';
    meno.setAttribute('aria-label', `Togli da ${fase.nome}`);
    meno.disabled = fase.fatte === 0;

    const piu = document.createElement('button');
    piu.type = 'button';
    piu.className = 'btn-piu';
    piu.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i>';
    // Il piu' segna una giornata intera: e' l'unita' con cui si lavora.
    piu.title = `Segna ${passo} ${nomeUnita(piano.unita, passo)} fatte`;
    piu.setAttribute('aria-label', `Segna una giornata di ${fase.nome}`);
    piu.disabled = fase.fatte >= totale;

    async function cambia(delta) {
      const nuovo = Math.min(Math.max(fase.fatte + delta, 0), totale);
      if (nuovo === fase.fatte) return;
      meno.disabled = true;
      piu.disabled = true;
      if (await aggiornaFatteFase(fase.id, nuovo)) {
        const vera = piano.fasi.find((f) => f.id === fase.id);
        if (vera) vera.fatte = nuovo;
        disegna();
      } else {
        meno.disabled = false;
        piu.disabled = false;
      }
    }

    meno.addEventListener('click', () => cambia(-passo));
    piu.addEventListener('click', () => cambia(passo));

    azioni.appendChild(meno);
    azioni.appendChild(piu);
    riga.appendChild(azioni);

    elenco.appendChild(riga);
  });

  card.appendChild(elenco);

  if (calcolo.fattibile && calcolo.avanzano > 0) {
    const nota = document.createElement('p');
    nota.className = 'blocco-nota';
    nota.textContent =
      calcolo.avanzano === 1
        ? 'Avanza un giorno prima della fine della finestra.'
        : `Avanzano ${calcolo.avanzano} giorni prima della fine della finestra.`;
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
        <p>Nessuna materia organizzata. Comincia da quella che ti preoccupa di piu.</p>
      </div>
    `;
    mostraOggi();
    return;
  }

  piani.forEach((p) => elPiani.appendChild(creaScheda(p)));
  mostraOggi();
}

/* ---------- Finestra ---------- */

function aggiungiRigaFase(preimpostata) {
  const riga = document.createElement('div');
  riga.className = 'riga-fase';
  // La riga si porta dietro l'id della passata gia' salvata e quanto e'
  // stato fatto, cosi' correggere il piano non azzera il lavoro.
  if (preimpostata?.id) riga.dataset.faseId = preimpostata.id;
  riga.dataset.fatte = preimpostata?.fatte ?? 0;

  const nome = document.createElement('input');
  nome.type = 'text';
  nome.placeholder = 'Es. Prima lettura';
  nome.required = true;
  nome.setAttribute('aria-label', 'Nome della passata');
  if (preimpostata?.nome) nome.value = preimpostata.nome;

  const giorni = document.createElement('input');
  giorni.type = 'number';
  giorni.min = '1';
  giorni.max = '365';
  giorni.required = true;
  giorni.placeholder = 'Giorni';
  giorni.setAttribute('aria-label', 'Quanti giorni');
  if (preimpostata?.giorni) giorni.value = preimpostata.giorni;
  giorni.addEventListener('input', aggiornaConto);

  const togli = document.createElement('button');
  togli.type = 'button';
  togli.className = 'btn-piu';
  togli.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
  togli.setAttribute('aria-label', 'Togli questa passata');
  togli.addEventListener('click', () => {
    riga.remove();
    if (!elRighe.querySelector('.riga-fase')) aggiungiRigaFase();
    aggiornaConto();
  });

  riga.append(nome, giorni, togli);
  elRighe.appendChild(riga);
  aggiornaConto();
}

/* Dice subito se le passate stanno nella finestra, mentre si scrive:
   scoprirlo dopo aver salvato sarebbe inutile. */
function aggiornaConto() {
  const chiesti = [...elRighe.querySelectorAll('.riga-fase')].reduce((s, r) => {
    const v = Number(r.querySelectorAll('input')[1].value);
    return s + (Number.isFinite(v) ? v : 0);
  }, 0);

  const el = document.getElementById('conto-fasi');
  const modo = form.querySelector('input[name="modo"]:checked')?.value;

  let disponibili = null;
  const liberi = [...document.querySelectorAll('#giorni-liberi input:checked')].length;

  if (modo === 'durata') {
    const durata = Number(document.getElementById('piano-durata').value) || 0;
    disponibili = Math.round(durata * ((7 - liberi) / 7));
  } else {
    const data = document.getElementById('piano-data').value;
    if (data) {
      const giorni = Math.round(
        (new Date(data + 'T00:00:00') - new Date(oggiIso() + 'T00:00:00')) / 86400000
      );
      disponibili = Math.round(Math.max(giorni, 0) * ((7 - liberi) / 7));
    }
  }

  if (disponibili === null) {
    el.textContent = `Le passate chiedono ${chiesti} giorni.`;
    el.className = 'conto-fasi';
    return;
  }

  el.textContent = `Le passate chiedono ${chiesti} giorni di studio, nella finestra ce ne sono circa ${disponibili}.`;
  el.className = 'conto-fasi' + (chiesti > disponibili ? ' stretto' : '');
}

function preparaFinestra() {
  const scelta = document.getElementById('giorni-liberi');
  scelta.innerHTML = '';

  NOMI_GIORNI.forEach((nome, i) => {
    const n = i + 1;
    const etichetta = document.createElement('label');
    etichetta.className = 'giorno-scelta';

    const casella = document.createElement('input');
    casella.type = 'checkbox';
    casella.name = 'liberi';
    casella.value = n;
    if (n === 7) casella.checked = true;
    casella.addEventListener('change', aggiornaConto);
    etichetta.appendChild(casella);

    const testo = document.createElement('span');
    testo.textContent = nome;
    etichetta.appendChild(testo);

    scelta.appendChild(etichetta);
  });

  /* Unita': l'etichetta e l'aiuto cambiano di conseguenza */
  const unita = document.getElementById('piano-unita');
  unita.addEventListener('change', () => {
    document.getElementById('etichetta-unita').textContent = unita.value;
    document.getElementById('aiuto-unita').hidden = unita.value !== 'giorni';
  });
  document.getElementById('aiuto-unita').hidden = true;

  /* Durata oppure data */
  form.querySelectorAll('input[name="modo"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const perData = radio.value === 'data' && radio.checked;
      document.getElementById('campo-durata').hidden = perData;
      document.getElementById('campo-data').hidden = !perData;
      aggiornaConto();
    });
  });

  document.getElementById('piano-durata').addEventListener('input', aggiornaConto);
  document.getElementById('piano-data').addEventListener('input', aggiornaConto);

  /* Scrivendo una materia che e' gia' in calendario, la data arriva sola */
  document.getElementById('piano-materia').addEventListener('input', (e) => {
    const trovata = date.find(
      (d) => titoloData(d).toLowerCase() === e.target.value.trim().toLowerCase()
    );
    if (!trovata) return;
    const campo = document.getElementById('piano-data');
    if (!campo.value) campo.value = trovata.giorno;
    aggiornaConto();
  });
}

document.getElementById('aggiungi-fase').addEventListener('click', () => aggiungiRigaFase());

function scegliModo(quale) {
  form.querySelectorAll('input[name="modo"]').forEach((r) => {
    r.checked = r.value === quale;
  });
  document.getElementById('campo-durata').hidden = quale !== 'durata';
  document.getElementById('campo-data').hidden = quale !== 'data';
}

/* Una sola finestra per creare e per correggere: cambiano il titolo, il
   bottone e cosa c'e' scritto dentro. */
function apriFinestra(piano) {
  inModifica = piano || null;
  form.reset();
  esito.textContent = '';
  esito.className = 'esito-form';
  elRighe.innerHTML = '';

  const titolo = document.getElementById('finestra-titolo-piano');
  const bottone = document.getElementById('piano-salva');

  if (piano) {
    titolo.textContent = piano.materia;
    bottone.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i> Salva le modifiche';

    document.getElementById('piano-materia').value = piano.materia;
    document.getElementById('piano-unita').value = piano.unita;
    document.getElementById('piano-quantita').value = piano.quantita;
    document.getElementById('etichetta-unita').textContent = piano.unita;
    document.getElementById('aiuto-unita').hidden = piano.unita !== 'giorni';

    // Di una materia gia' avviata si mostra la data vera di fine: e' il
    // dato che lei riconosce. "Fra tot giorni" resta disponibile, ma li
    // conta da oggi e quindi fa ripartire la finestra.
    scegliModo('data');
    document.getElementById('piano-data').value = piano.fine;

    const liberi = piano.giorni_liberi || [];
    document.querySelectorAll('#giorni-liberi input').forEach((c) => {
      c.checked = liberi.includes(Number(c.value));
    });

    (piano.fasi || []).forEach((f) => aggiungiRigaFase(f));
    if (!elRighe.querySelector('.riga-fase')) aggiungiRigaFase();
  } else {
    titolo.textContent = 'Una materia';
    bottone.innerHTML = '<i class="ph ph-check" aria-hidden="true"></i> Crea';

    FASI_PROPOSTE.forEach((f) => aggiungiRigaFase(f));
    document.querySelectorAll('#giorni-liberi input').forEach((c) => {
      c.checked = Number(c.value) === 7;
    });
    document.getElementById('etichetta-unita').textContent = 'pagine';
    document.getElementById('aiuto-unita').hidden = true;
    scegliModo('durata');
  }

  document.getElementById('nota-modifica').hidden = !piano;

  aggiornaConto();
  finestra.showModal();
}

document.getElementById('apri-nuovo').addEventListener('click', () => apriFinestra(null));

document.getElementById('chiudi-finestra').addEventListener('click', () => finestra.close());
finestra.addEventListener('click', (e) => {
  if (e.target === finestra) finestra.close();
});
// Chiudere senza salvare non deve lasciare la finestra "agganciata" al
// piano di prima: la volta dopo si tornerebbe a correggere quello.
finestra.addEventListener('close', () => {
  inModifica = null;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const liberi = [...document.querySelectorAll('#giorni-liberi input:checked')].map((c) =>
    Number(c.value)
  );

  if (liberi.length === 7) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Se sono liberi tutti i giorni non resta niente su cui distribuire.';
    return;
  }

  const modo = form.querySelector('input[name="modo"]:checked').value;
  let fine;

  if (modo === 'durata') {
    const durata = Number(document.getElementById('piano-durata').value);
    if (!durata || durata < 2) {
      esito.className = 'esito-form ko';
      esito.textContent = 'Dai almeno due giorni.';
      return;
    }
    const d = new Date(oggiIso() + 'T00:00:00');
    d.setDate(d.getDate() + durata);
    fine = d.toISOString().slice(0, 10);
  } else {
    fine = document.getElementById('piano-data').value;
    if (!fine || fine <= oggiIso()) {
      esito.className = 'esito-form ko';
      esito.textContent = 'La data deve essere nel futuro.';
      return;
    }
  }

  const fasi = [...elRighe.querySelectorAll('.riga-fase')].map((riga) => {
    const campi = riga.querySelectorAll('input');
    return {
      id: riga.dataset.faseId ? Number(riga.dataset.faseId) : null,
      nome: campi[0].value.trim(),
      giorni: Number(campi[1].value),
      fatte: Number(riga.dataset.fatte) || 0,
    };
  });

  if (fasi.some((f) => !f.nome || !f.giorni)) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Manca qualcosa in una delle passate.';
    return;
  }

  const dati = {
    materia: document.getElementById('piano-materia').value.trim(),
    unita: document.getElementById('piano-unita').value,
    quantita: Number(document.getElementById('piano-quantita').value),
    fine,
    giorni_liberi: liberi,
  };

  if (inModifica) {
    esito.className = 'esito-form attesa';
    esito.textContent = 'Salvataggio';

    // Con "fra tot giorni" la finestra riparte da oggi: i giorni te li
    // dai adesso, non a partire da quando avevi creato il piano.
    dati.inizio = modo === 'durata' ? oggiIso() : inModifica.inizio;

    const salvato = await aggiornaPiano(inModifica.id, dati, fasi);

    if (!salvato) {
      esito.className = 'esito-form ko';
      esito.textContent = 'Non sono riuscita a salvare le modifiche.';
      return;
    }

    piani = piani.map((p) => (p.id === salvato.id ? salvato : p));
    piani.sort((a, b) => a.fine.localeCompare(b.fine));
    inModifica = null;
    finestra.close();
    disegna();
    return;
  }

  esito.className = 'esito-form attesa';
  esito.textContent = 'Creazione';

  dati.inizio = oggiIso();
  const salvato = await inserisciPiano(dati, fasi);

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
    [piani, date] = await Promise.all([getPiani(), getDateEsame()]);

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
