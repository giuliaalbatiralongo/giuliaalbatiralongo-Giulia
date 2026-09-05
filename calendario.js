import {
  getDateEsame,
  inserisciDataEsame,
  eliminaDataEsame,
  giorniMancanti,
  contoAllaRovescia,
  nomeTipoData,
  titoloData,
  tipoData,
  TIPI_DATA,
} from './db.js?v=21';
import { proteggiPagina } from './auth.js?v=10';

const elScheletro = document.getElementById('scheletro');
const elTutto = document.getElementById('calendario');
const elGriglia = document.getElementById('griglia-mese');
const elIntestazione = document.getElementById('intestazione-giorni');
const elMeseNome = document.getElementById('mese-nome');
const elProssime = document.getElementById('prossime');
const elPannelloGiorno = document.getElementById('pannello-giorno');
const elGiornoScelto = document.getElementById('giorno-scelto');
const elDettaglioGiorno = document.getElementById('dettaglio-giorno');

const finestra = document.getElementById('finestra-data');
const form = document.getElementById('form-data');
const esito = document.getElementById('data-esito');

const GIORNI_CORTI = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

let date = [];
let meseMostrato = new Date();
meseMostrato.setDate(1);
let giornoAperto = null;

function chiave(data) {
  // Niente toISOString: converte in UTC e a fine mese sposta il giorno.
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const g = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${m}-${g}`;
}

function iconaTipo(tipo) {
  return tipoData(tipo).icona;
}

/* Il colore di una categoria arriva da un token del foglio di stile,
   cosi' chiaro e scuro restano due tavolozze separate. */
function coloreTipo(tipo) {
  return `var(--tipo-${tipoData(tipo).chiave})`;
}

function disegnaLegenda() {
  const el = document.getElementById('legenda');
  el.innerHTML = '';

  TIPI_DATA.forEach((t) => {
    const voce = document.createElement('span');
    voce.className = 'legenda-voce';

    const segno = document.createElement('span');
    segno.className = 'legenda-segno';
    segno.style.background = `var(--tipo-${t.chiave})`;
    voce.appendChild(segno);

    voce.appendChild(document.createTextNode(t.nome));
    el.appendChild(voce);
  });
}

/* ---------- Griglia del mese ---------- */

function disegnaIntestazione() {
  elIntestazione.innerHTML = '';
  GIORNI_CORTI.forEach((g) => {
    const cella = document.createElement('span');
    cella.className = 'giorno-nome';
    cella.textContent = g;
    elIntestazione.appendChild(cella);
  });
}

function disegnaMese() {
  elMeseNome.textContent = meseMostrato.toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  });

  const primo = new Date(meseMostrato);
  // In Italia la settimana comincia di lunedi': getDay() da' 0 per domenica.
  const scarto = (primo.getDay() + 6) % 7;

  const inizio = new Date(primo);
  inizio.setDate(inizio.getDate() - scarto);

  const oggi = chiave(new Date());
  elGriglia.innerHTML = '';

  // Tante righe quante ne servono davvero. Con celle alte, una sesta
  // riga interamente del mese successivo e' una fascia di vuoto.
  const giorniNelMese = new Date(
    meseMostrato.getFullYear(),
    meseMostrato.getMonth() + 1,
    0
  ).getDate();
  const celle = Math.ceil((scarto + giorniNelMese) / 7) * 7;

  for (let i = 0; i < celle; i += 1) {
    const data = new Date(inizio);
    data.setDate(data.getDate() + i);
    const k = chiave(data);

    const voci = date.filter((d) => d.giorno === k);
    const fuoriMese = data.getMonth() !== meseMostrato.getMonth();

    const cella = document.createElement('button');
    cella.type = 'button';
    cella.className = 'cella-giorno';
    if (fuoriMese) cella.classList.add('fuori');
    if (k === oggi) cella.classList.add('oggi');
    if (voci.length > 0) cella.classList.add('con-date');
    if (k === giornoAperto) cella.classList.add('scelto');

    const numero = document.createElement('span');
    numero.className = 'cella-numero';
    numero.textContent = data.getDate();
    cella.appendChild(numero);

    if (voci.length > 0) {
      const eventi = document.createElement('span');
      eventi.className = 'cella-eventi';

      // Tre voci per cella: oltre, la riga finale dice quante restano.
      voci.slice(0, 3).forEach((v) => {
        const evento = document.createElement('span');
        evento.className = 'evento';
        evento.style.setProperty('--colore', coloreTipo(v.tipo));

        const icona = document.createElement('i');
        icona.className = `ph ${iconaTipo(v.tipo)}`;
        icona.setAttribute('aria-hidden', 'true');
        evento.appendChild(icona);

        const testo = document.createElement('span');
        testo.className = 'evento-testo';
        testo.textContent = v.ora ? `${v.ora.slice(0, 5)} ${titoloData(v)}` : titoloData(v);
        evento.appendChild(testo);

        eventi.appendChild(evento);
      });

      if (voci.length > 3) {
        const resto = document.createElement('span');
        resto.className = 'cella-resto';
        resto.textContent = `e altri ${voci.length - 3}`;
        eventi.appendChild(resto);
      }

      cella.appendChild(eventi);

      const etichetta = voci.map((v) => `${nomeTipoData(v.tipo)}: ${titoloData(v)}`).join('. ');
      cella.setAttribute(
        'aria-label',
        `${data.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}. ${etichetta}`
      );
    } else {
      cella.setAttribute(
        'aria-label',
        data.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
      );
    }

    cella.addEventListener('click', () => apriGiorno(k, data));
    elGriglia.appendChild(cella);
  }
}

/* ---------- Dettaglio di un giorno ---------- */

function creaVoce(voce, dentroPannello) {
  const riga = document.createElement('article');
  riga.className = 'data-voce';

  const testa = document.createElement('div');
  testa.className = 'data-voce-testa';

  const icona = document.createElement('i');
  icona.className = `ph ${iconaTipo(voce.tipo)}`;
  icona.style.color = coloreTipo(voce.tipo);
  icona.setAttribute('aria-hidden', 'true');
  testa.appendChild(icona);

  const materia = document.createElement('span');
  materia.className = 'data-voce-materia';
  materia.textContent = titoloData(voce);
  testa.appendChild(materia);

  riga.appendChild(testa);

  const meta = document.createElement('p');
  meta.className = 'data-voce-meta';
  const pezzi = [nomeTipoData(voce.tipo)];
  if (voce.ora) pezzi.push(voce.ora.slice(0, 5));
  if (voce.luogo) pezzi.push(voce.luogo);
  if (!voce.mia) pezzi.push(`da ${voce.autoreNome}`);
  meta.textContent = pezzi.join(' · ');
  riga.appendChild(meta);

  if (voce.note) {
    const note = document.createElement('p');
    note.className = 'data-voce-note';
    note.textContent = voce.note;
    riga.appendChild(note);
  }

  if (dentroPannello && voce.mia) {
    const togli = document.createElement('button');
    togli.type = 'button';
    togli.className = 'link-bottone';
    togli.textContent = 'Elimina';
    togli.addEventListener('click', async () => {
      if (!window.confirm(`Eliminare ${titoloData(voce)} del ${voce.giorno}?`)) return;
      togli.disabled = true;
      if (await eliminaDataEsame(voce.id)) {
        date = date.filter((d) => d.id !== voce.id);
        disegnaTutto();
      } else {
        togli.disabled = false;
      }
    });
    riga.appendChild(togli);
  }

  return riga;
}

function apriGiorno(k, data) {
  giornoAperto = k;
  const voci = date.filter((d) => d.giorno === k);

  elGiornoScelto.textContent = data.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  elDettaglioGiorno.innerHTML = '';

  if (voci.length === 0) {
    const vuoto = document.createElement('p');
    vuoto.className = 'blocco-vuoto';
    vuoto.textContent = 'Niente segnato in questo giorno.';
    elDettaglioGiorno.appendChild(vuoto);
  } else {
    voci.forEach((v) => elDettaglioGiorno.appendChild(creaVoce(v, true)));
  }

  const aggiungi = document.createElement('button');
  aggiungi.type = 'button';
  aggiungi.className = 'btn btn-neutro btn-piccolo';
  aggiungi.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i> Aggiungi qui';
  aggiungi.addEventListener('click', () => apriFinestra(k));
  elDettaglioGiorno.appendChild(aggiungi);

  elPannelloGiorno.hidden = false;
  disegnaMese();
}

document.getElementById('chiudi-giorno').addEventListener('click', () => {
  giornoAperto = null;
  elPannelloGiorno.hidden = true;
  disegnaMese();
});

/* ---------- Prossime date ---------- */

function disegnaProssime() {
  const future = date.filter((d) => giorniMancanti(d.giorno) >= 0).slice(0, 6);

  elProssime.innerHTML = '';

  if (future.length === 0) {
    elProssime.innerHTML =
      '<p class="blocco-vuoto">Nessuna data in programma. Aggiungi il prossimo appello.</p>';
    return;
  }

  future.forEach((voce) => {
    const riga = document.createElement('button');
    riga.type = 'button';
    riga.className = 'prossima';

    const quando = document.createElement('span');
    quando.className = 'prossima-quando';
    const g = giorniMancanti(voce.giorno);
    // Il numero grande e' quello che si cerca davvero guardando qui.
    quando.textContent = g === 0 ? 'oggi' : g;
    if (g > 0) quando.classList.add('numero');
    quando.style.color = coloreTipo(voce.tipo);
    riga.appendChild(quando);

    const testo = document.createElement('span');
    testo.className = 'prossima-testo';

    const materia = document.createElement('span');
    materia.className = 'prossima-materia';
    materia.textContent = titoloData(voce);
    testo.appendChild(materia);

    const meta = document.createElement('span');
    meta.className = 'prossima-meta';
    const data = new Date(voce.giorno + 'T00:00:00');
    meta.textContent = `${nomeTipoData(voce.tipo)} · ${data.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
    })}${voce.ora ? ` · ${voce.ora.slice(0, 5)}` : ''}`;
    testo.appendChild(meta);

    riga.appendChild(testo);

    riga.addEventListener('click', () => {
      meseMostrato = new Date(voce.giorno + 'T00:00:00');
      meseMostrato.setDate(1);
      apriGiorno(voce.giorno, new Date(voce.giorno + 'T00:00:00'));
    });

    elProssime.appendChild(riga);
  });

  const nota = document.createElement('p');
  nota.className = 'blocco-nota';
  nota.textContent =
    future.length === 1
      ? 'I numeri sono i giorni che mancano.'
      : `I numeri sono i giorni che mancano. La prima e ${contoAllaRovescia(future[0].giorno)}.`;
  elProssime.appendChild(nota);
}

function disegnaTutto() {
  disegnaMese();
  disegnaProssime();
  if (giornoAperto) {
    const voci = date.filter((d) => d.giorno === giornoAperto);
    if (voci.length === 0 && elDettaglioGiorno.querySelector('.data-voce')) {
      apriGiorno(giornoAperto, new Date(giornoAperto + 'T00:00:00'));
    }
  }
}

/* ---------- Finestra di inserimento ---------- */

function apriFinestra(giorno) {
  form.reset();
  esito.textContent = '';
  esito.className = 'esito-form';
  document.getElementById('data-giorno').value = giorno || chiave(new Date());
  finestra.showModal();
  document.getElementById('data-materia').focus();
}

document.getElementById('apri-aggiunta').addEventListener('click', () => apriFinestra(giornoAperto));
document.getElementById('chiudi-finestra').addEventListener('click', () => finestra.close());
finestra.addEventListener('click', (e) => {
  if (e.target === finestra) finestra.close();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dati = new FormData(form);

  esito.className = 'esito-form attesa';
  esito.textContent = 'Salvataggio';

  const pulisci = (v) => (v && v.trim() ? v.trim() : null);

  const salvata = await inserisciDataEsame({
    tipo: dati.get('tipo'),
    materia: pulisci(dati.get('materia')),
    giorno: dati.get('giorno'),
    ora: pulisci(dati.get('ora')),
    luogo: pulisci(dati.get('luogo')),
    note: pulisci(dati.get('note')),
    visibilita: dati.get('condivisa') ? 'condiviso' : 'privato',
  });

  if (!salvata) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Non sono riuscita a salvare la data.';
    return;
  }

  date.push({ ...salvata, mia: true, autoreNome: 'tu' });
  date.sort((a, b) => a.giorno.localeCompare(b.giorno));

  meseMostrato = new Date(salvata.giorno + 'T00:00:00');
  meseMostrato.setDate(1);

  finestra.close();
  apriGiorno(salvata.giorno, new Date(salvata.giorno + 'T00:00:00'));
  disegnaProssime();
});

/* ---------- Navigazione fra i mesi ---------- */

function cambiaMese(quanti) {
  meseMostrato = new Date(meseMostrato.getFullYear(), meseMostrato.getMonth() + quanti, 1);
  disegnaMese();
}

document.getElementById('mese-prima').addEventListener('click', () => cambiaMese(-1));
document.getElementById('mese-dopo').addEventListener('click', () => cambiaMese(1));
document.getElementById('torna-oggi').addEventListener('click', () => {
  meseMostrato = new Date();
  meseMostrato.setDate(1);
  disegnaMese();
});

/* ---------- Esportazione ---------- */

document.getElementById('esporta').addEventListener('click', () => {
  if (date.length === 0) {
    window.alert('Non c e ancora niente da esportare.');
    return;
  }

  const contenuto = creaIcs(date);
  const blob = new Blob([contenuto], { type: 'text/calendar;charset=utf-8' });
  const indirizzo = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = indirizzo;
  link.download = 'akesis.ics';
  document.body.appendChild(link);
  link.click();
  link.remove();

  // L'indirizzo temporaneo va liberato, altrimenti resta in memoria
  // finche' la pagina e' aperta.
  setTimeout(() => URL.revokeObjectURL(indirizzo), 1000);
});

/* ---------- Avvio ---------- */

async function avvia() {
  try {
    date = await getDateEsame();

    disegnaIntestazione();
    disegnaLegenda();
    disegnaMese();
    disegnaProssime();

    elScheletro.remove();
    elTutto.hidden = false;
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia();
});
