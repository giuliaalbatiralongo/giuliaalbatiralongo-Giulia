import {
  getDateEsame,
  ultimoErroreDb,
  inserisciDataEsame,
  eliminaDataEsame,
  aggiornaDataEsame,
  getEsami,
  creaEsame,
  eliminaEsame,
  aggiungiAppello,
  scegliAppello,
  giorniMancanti,
  nomeTipoData,
  titoloData,
  tipoData,
  TIPI_DATA,
  creaIcs,
} from './db.js?v=17747242';
import { proteggiPagina } from './auth.js?v=10812191';
import { offriAnnulla } from './annulla.js?v=23985364';

const elScheletro = document.getElementById('scheletro');
const elTutto = document.getElementById('calendario');
const elGriglia = document.getElementById('griglia-mese');
const elIntestazione = document.getElementById('intestazione-giorni');
const elMeseNome = document.getElementById('mese-nome');
const elProssime = document.getElementById('prossime');
const finestraGiorno = document.getElementById('finestra-giorno');
const elGiornoScelto = document.getElementById('giorno-scelto');
const elDettaglioGiorno = document.getElementById('dettaglio-giorno');

const finestra = document.getElementById('finestra-data');
const form = document.getElementById('form-data');
const esito = document.getElementById('data-esito');

const elSessione = document.getElementById('sessione-elenco');
const elSessioneConto = document.getElementById('sessione-conto');
const finestraEsame = document.getElementById('finestra-esame');
const formEsame = document.getElementById('form-esame');
const esitoEsame = document.getElementById('esame-esito');
const finestraScheda = document.getElementById('finestra-scheda');
const elSchedaAppelli = document.getElementById('scheda-appelli');
const formAppello = document.getElementById('form-appello');
const esitoAppello = document.getElementById('appello-esito');

const GIORNI_CORTI = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

let date = [];
let tuttiGliEsami = [];
let esameAperto = null;
let meseMostrato = new Date();
meseMostrato.setDate(1);
let giornoAperto = null;
// null quando si crea una data, la voce quando la si corregge.
let dataInModifica = null;

function dataBreve(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
}

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

    cella.addEventListener('click', () => apriGiorno(k));
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
    const azioni = document.createElement('div');
    azioni.className = 'data-voce-azioni';

    const modifica = document.createElement('button');
    modifica.type = 'button';
    modifica.className = 'link-bottone';
    modifica.textContent = 'Modifica';
    modifica.addEventListener('click', () => apriFinestra(voce.giorno, voce));
    azioni.appendChild(modifica);

    const togli = document.createElement('button');
    togli.type = 'button';
    togli.className = 'link-bottone';
    togli.textContent = 'Elimina';
    togli.addEventListener('click', async () => {
      if (!window.confirm(`Eliminare ${titoloData(voce)} del ${voce.giorno}?`)) return;
      togli.disabled = true;
      const gesto = await eliminaDataEsame(voce.id);
      if (gesto) {
        offriAnnulla(`${titoloData(voce)} del ${voce.giorno}`, gesto, ricarica);
        await ricarica();
        if (giornoAperto) apriGiorno(giornoAperto);
      } else {
        togli.disabled = false;
      }
    });
    azioni.appendChild(togli);

    riga.appendChild(azioni);
  }

  // Un appello appeso a un esame si corregge dalla scheda dell'esame,
  // non da qui: cosi' non ci sono due strade per la stessa cosa.
  if (dentroPannello && voce.esame_id) {
    const nota = document.createElement('p');
    nota.className = 'data-voce-nota';
    nota.textContent = 'Fa parte di un esame: si cambia dalla sua scheda, nella sessione.';
    riga.appendChild(nota);
  }

  return riga;
}

function apriGiorno(k) {
  giornoAperto = k;
  const voci = date.filter((d) => d.giorno === k);
  const data = new Date(k + 'T00:00:00');

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

  if (!finestraGiorno.open) finestraGiorno.showModal();
  disegnaMese();
}

document.getElementById('chiudi-giorno').addEventListener('click', () => finestraGiorno.close());
finestraGiorno.addEventListener('click', (e) => {
  if (e.target === finestraGiorno) finestraGiorno.close();
});
finestraGiorno.addEventListener('close', () => {
  // Se si sta passando all'altra finestra, il giorno resta segnato:
  // ci si torna appena salvata la data.
  if (!finestra.open) {
    giornoAperto = null;
    disegnaMese();
  }
});

document.getElementById('aggiungi-in-giorno').addEventListener('click', () => {
  apriFinestra(giornoAperto);
});

/* ---------- Prossimamente ----------
   Il conto alla rovescia sta in una pastiglia a destra, gia' scritto
   per esteso: prima era un numero nudo che serviva una riga di
   spiegazione in fondo al riquadro. Meno da leggere, stessa cosa. */

function quantoManca(giorno) {
  const g = giorniMancanti(giorno);
  if (g === 0) return 'oggi';
  if (g === 1) return 'domani';
  return `tra ${g} giorni`;
}

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

    const filo = document.createElement('span');
    filo.className = 'prossima-filo';
    filo.style.background = coloreTipo(voce.tipo);
    riga.appendChild(filo);

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

    const quando = document.createElement('span');
    quando.className = 'prossima-quando';
    const g = giorniMancanti(voce.giorno);
    if (g <= 1) quando.classList.add('vicino');
    quando.textContent = quantoManca(voce.giorno);
    riga.appendChild(quando);

    riga.addEventListener('click', () => {
      meseMostrato = new Date(voce.giorno + 'T00:00:00');
      meseMostrato.setDate(1);
      apriGiorno(voce.giorno);
    });

    elProssime.appendChild(riga);
  });
}

function disegnaTutto() {
  disegnaMese();
  disegnaProssime();
}

/* ---------- Finestra di inserimento ---------- */

/* Una finestra sola per aggiungere e per correggere: cambiano il
   titolo e cosa c'e' scritto dentro. */
function apriFinestra(giorno, voce = null) {
  dataInModifica = voce;
  form.reset();
  esito.textContent = '';
  esito.className = 'esito-form';

  document.getElementById('titolo-finestra-data').textContent =
    voce ? 'Modifica' : 'Aggiungi una data';
  document.getElementById('salva-data').innerHTML = voce
    ? '<i class="ph ph-check" aria-hidden="true"></i> Salva le modifiche'
    : '<i class="ph ph-check" aria-hidden="true"></i> Salva';

  if (voce) {
    document.getElementById('data-tipo').value = voce.tipo;
    document.getElementById('data-materia').value = voce.materia || '';
    document.getElementById('data-giorno').value = voce.giorno;
    document.getElementById('data-ora').value = voce.ora ? voce.ora.slice(0, 5) : '';
    document.getElementById('data-luogo').value = voce.luogo || '';
    document.getElementById('data-note').value = voce.note || '';
    document.getElementById('data-condivisa').checked = voce.visibilita === 'condiviso';
  } else {
    document.getElementById('data-giorno').value = giorno || chiave(new Date());
  }

  // Due finestre aperte insieme si sovrappongono: quella del giorno si
  // chiude e torna da sola appena questa e' finita.
  if (finestraGiorno.open) finestraGiorno.close();

  finestra.showModal();
  document.getElementById('data-materia').focus();
}

function tornaAlGiorno() {
  if (giornoAperto && !finestraGiorno.open) apriGiorno(giornoAperto);
}

document.getElementById('apri-aggiunta').addEventListener('click', () => apriFinestra(giornoAperto));
document.getElementById('chiudi-finestra').addEventListener('click', () => finestra.close());
finestra.addEventListener('click', (e) => {
  if (e.target === finestra) finestra.close();
});
finestra.addEventListener('close', () => {
  dataInModifica = null;
  tornaAlGiorno();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dati = new FormData(form);

  esito.className = 'esito-form attesa';
  esito.textContent = 'Salvataggio';

  const pulisci = (v) => (v && v.trim() ? v.trim() : null);

  const voce = {
    tipo: dati.get('tipo'),
    materia: pulisci(dati.get('materia')),
    giorno: dati.get('giorno'),
    ora: pulisci(dati.get('ora')),
    luogo: pulisci(dati.get('luogo')),
    note: pulisci(dati.get('note')),
    visibilita: dati.get('condivisa') ? 'condiviso' : 'privato',
  };

  const salvata = dataInModifica
    ? await aggiornaDataEsame(dataInModifica.id, voce)
    : await inserisciDataEsame(voce);

  if (!salvata) {
    esito.className = 'esito-form ko';
    esito.textContent = `${
      dataInModifica ? 'Non sono riuscita a salvare le modifiche.' : 'Non sono riuscita a salvare la data.'
    } ${ultimoErroreDb() || ''}`.trim();
    return;
  }

  giornoAperto = salvata.giorno;
  meseMostrato = new Date(salvata.giorno + 'T00:00:00');
  meseMostrato.setDate(1);

  await ricarica();
  finestra.close();
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


/* ---------- La sessione: gli esami e i loro appelli ----------
   Un esame e' una cosa sola con piu' date possibili. Qui si vedono
   tutti insieme; il mese sotto mostra solo gli appelli scelti. */

function dataLunga(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function creaSchedaEsame(esame) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'esame-card' + (esame.scelto ? ' scelta' : '');
  card.addEventListener('click', () => apriScheda(esame));

  const nome = document.createElement('span');
  nome.className = 'esame-card-nome';
  nome.textContent = esame.nome;
  card.appendChild(nome);

  const stato = document.createElement('span');
  stato.className = 'esame-card-stato';

  if (esame.scelto) {
    const g = giorniMancanti(esame.scelto.giorno);
    const quando = document.createElement('strong');
    quando.textContent =
      g < 0 ? 'passato' : g === 0 ? 'oggi' : g === 1 ? 'domani' : `fra ${g} giorni`;
    stato.appendChild(quando);
    stato.append(` · ${dataBreve(esame.scelto.giorno)}`);
  } else if (esame.appelli.length === 0) {
    stato.classList.add('vuoto');
    stato.textContent = 'Nessuna data ancora';
  } else {
    stato.classList.add('da-scegliere');
    stato.textContent =
      esame.appelli.length === 1
        ? 'Un appello, da scegliere'
        : `${esame.appelli.length} appelli, da scegliere`;
  }

  card.appendChild(stato);
  return card;
}

function disegnaSessione() {
  elSessione.innerHTML = '';

  // Nel calendario stanno solo gli esami che hai gia' cominciato a
  // datare: l'elenco completo del corso e' nella pagina Esami, e qui
  // riempirebbe la sessione di roba che non ti riguarda adesso.
  const esami = tuttiGliEsami.filter((e) => e.appelli.length > 0);

  const scelti = esami.filter((e) => e.scelto).length;
  elSessioneConto.textContent =
    esami.length === 0
      ? ''
      : `${scelti} su ${esami.length} ${esami.length === 1 ? 'esame deciso' : 'esami decisi'}`;

  if (esami.length === 0) {
    const vuoto = document.createElement('p');
    vuoto.className = 'blocco-vuoto';
    vuoto.textContent =
      'Nessun esame ancora. Creane uno, mettici dentro tutte le date che l\'università propone, e poi scegli a quale ti presenti.';
    elSessione.appendChild(vuoto);
    return;
  }

  esami.forEach((e) => elSessione.appendChild(creaSchedaEsame(e)));
}

/* ---------- La scheda di un esame ---------- */

function rigaAppello(esame, appello) {
  const riga = document.createElement('div');
  const scelto = esame.appello_scelto === appello.id;
  riga.className = 'riga-appello' + (scelto ? ' scelto' : '');

  const testo = document.createElement('div');
  testo.className = 'riga-appello-testo';

  const quando = document.createElement('p');
  quando.className = 'riga-appello-quando';
  quando.textContent = dataLunga(appello.giorno);
  testo.appendChild(quando);

  const dettagli = [];
  if (appello.ora) dettagli.push(appello.ora.slice(0, 5));
  if (appello.luogo) dettagli.push(appello.luogo);
  const g = giorniMancanti(appello.giorno);
  dettagli.push(g < 0 ? 'già passato' : g === 0 ? 'oggi' : `fra ${g} giorni`);

  const meta = document.createElement('p');
  meta.className = 'riga-appello-meta';
  meta.textContent = dettagli.join(' · ');
  testo.appendChild(meta);

  riga.appendChild(testo);

  const azioni = document.createElement('div');
  azioni.className = 'riga-appello-azioni';

  const scegli = document.createElement('button');
  scegli.type = 'button';
  if (scelto) {
    scegli.className = 'segno-scelto';
    scegli.innerHTML = '<i class="ph-fill ph-seal-check" aria-hidden="true"></i> Ti presenti a questo';
    scegli.title = 'Premi per non presentarti piu a questo appello';
  } else {
    scegli.className = 'btn btn-neutro btn-piccolo';
    scegli.textContent = 'Mi presento a questo';
  }
  scegli.addEventListener('click', async () => {
    scegli.disabled = true;
    // Ripremere quello gia' scelto toglie la scelta: serve quando
    // l'appello salta e si torna indecisi.
    const nuovo = scelto ? null : appello.id;
    if (await scegliAppello(esame.id, nuovo, esame.appello_scelto)) {
      esame.appello_scelto = nuovo;
      esame.scelto = nuovo ? appello : null;
      await ricarica();
      apriScheda(tuttiGliEsami.find((e) => e.id === esame.id));
    } else {
      scegli.disabled = false;
      esitoAppello.className = 'esito-form ko';
      esitoAppello.textContent = 'Non sono riuscita a salvare la scelta.';
    }
  });
  azioni.appendChild(scegli);

  /* La X c'e' sempre, anche sull'appello a cui hai deciso di
     presentarti. Prima li' spariva, e per togliere una data messa per
     sbaglio bisognava prima togliere la scelta e poi aprire "Cambia
     appello": due passaggi che nessuno indovina. */
  const togli = document.createElement('button');
  togli.type = 'button';
  togli.className = 'btn-piu';
  togli.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
  togli.setAttribute('aria-label', `Togli la data del ${dataLunga(appello.giorno)}`);
  togli.title = 'Togli questa data';
  togli.addEventListener('click', async () => {
    if (!window.confirm(`Togliere la data del ${dataLunga(appello.giorno)}?`)) return;
    togli.disabled = true;
    const gesto = await eliminaDataEsame(appello.id);
    if (gesto) {
      offriAnnulla(`La data del ${dataLunga(appello.giorno)}`, gesto, ricarica);
      await ricarica();
      apriScheda(tuttiGliEsami.find((e) => e.id === esame.id));
    } else {
      togli.disabled = false;
      esitoAppello.className = 'esito-form ko';
      esitoAppello.textContent =
        `Non sono riuscita a togliere questa data. ${ultimoErroreDb() || ''}`.trim();
    }
  });
  azioni.appendChild(togli);

  riga.appendChild(azioni);
  return riga;
}

/* Deciso l'appello, gli altri spariscono: tenerli sotto gli occhi crea
   confusione. Restano dietro a "Cambia appello", per quando l'appello
   salta o si cambia idea. */
function apriScheda(esame, apriTutti = false) {
  if (!esame) return;
  esameAperto = esame;

  document.getElementById('scheda-nome').textContent = esame.nome;

  const note = document.getElementById('scheda-note');
  note.textContent = esame.note || '';
  note.hidden = !esame.note;

  esitoAppello.textContent = '';
  esitoAppello.className = 'esito-form';
  formAppello.reset();

  const deciso = !!esame.scelto;
  const stretta = deciso && !apriTutti;

  document.getElementById('scheda-aiuto').hidden = deciso;
  formAppello.hidden = stretta;
  esitoAppello.hidden = stretta;

  elSchedaAppelli.innerHTML = '';

  if (esame.appelli.length === 0) {
    const vuoto = document.createElement('p');
    vuoto.className = 'blocco-vuoto';
    vuoto.textContent = 'Ancora nessuna data. Aggiungi qui sotto quelle che ti propongono.';
    elSchedaAppelli.appendChild(vuoto);
  } else if (stretta) {
    elSchedaAppelli.appendChild(rigaAppello(esame, esame.scelto));

    const altri = esame.appelli.length - 1;
    if (altri > 0) {
      const cambia = document.createElement('button');
      cambia.type = 'button';
      cambia.className = 'btn btn-neutro btn-piccolo cambia-appello';
      cambia.innerHTML =
        '<i class="ph ph-arrows-clockwise" aria-hidden="true"></i> Cambia appello';
      cambia.addEventListener('click', () => apriScheda(esame, true));
      elSchedaAppelli.appendChild(cambia);
    } else {
      const aggiungi = document.createElement('button');
      aggiungi.type = 'button';
      aggiungi.className = 'btn btn-neutro btn-piccolo cambia-appello';
      aggiungi.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i> Aggiungi un altra data';
      aggiungi.addEventListener('click', () => apriScheda(esame, true));
      elSchedaAppelli.appendChild(aggiungi);
    }
  } else {
    esame.appelli.forEach((a) => elSchedaAppelli.appendChild(rigaAppello(esame, a)));
  }

  if (!finestraScheda.open) finestraScheda.showModal();
}

document.getElementById('chiudi-scheda').addEventListener('click', () => finestraScheda.close());
document.getElementById('chiudi-scheda-2').addEventListener('click', () => finestraScheda.close());
finestraScheda.addEventListener('click', (e) => {
  if (e.target === finestraScheda) finestraScheda.close();
});
finestraScheda.addEventListener('close', () => {
  esameAperto = null;
});

document.getElementById('elimina-esame').addEventListener('click', async () => {
  if (!esameAperto) return;
  const quanti = esameAperto.appelli.length;
  const avviso =
    quanti === 0
      ? `Eliminare ${esameAperto.nome}?`
      : `Eliminare ${esameAperto.nome}? Se ne vanno anche le sue ${quanti} date.`;
  if (!window.confirm(avviso)) return;

  const nomeEsame = esameAperto.nome;
  const gesto = await eliminaEsame(esameAperto.id);
  if (gesto) {
    offriAnnulla(`L esame ${nomeEsame}`, gesto, ricarica);
    finestraScheda.close();
    await ricarica();
  }
});

formAppello.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!esameAperto) return;

  const giorno = document.getElementById('appello-giorno').value;
  if (!giorno) {
    esitoAppello.className = 'esito-form ko';
    esitoAppello.textContent = 'Serve almeno il giorno.';
    return;
  }

  esitoAppello.className = 'esito-form attesa';
  esitoAppello.textContent = 'Salvataggio';

  const salvato = await aggiungiAppello(esameAperto, {
    tipo: 'appello',
    giorno,
    ora: document.getElementById('appello-ora').value || null,
    luogo: document.getElementById('appello-luogo').value.trim() || null,
    visibilita: 'privato',
  });

  if (!salvato) {
    esitoAppello.className = 'esito-form ko';
    esitoAppello.textContent = `Non sono riuscita a salvare l'appello. ${ultimoErroreDb() || ''}`.trim();
    return;
  }

  const id = esameAperto.id;
  await ricarica();
  apriScheda(tuttiGliEsami.find((x) => x.id === id));
});

/* ---------- Finestra: nuovo esame ---------- */

document.getElementById('apri-esame').addEventListener('click', () => {
  formEsame.reset();
  esitoEsame.textContent = '';
  esitoEsame.className = 'esito-form';
  finestraEsame.showModal();
  document.getElementById('esame-nome').focus();
});

document.getElementById('chiudi-esame').addEventListener('click', () => finestraEsame.close());
finestraEsame.addEventListener('click', (e) => {
  if (e.target === finestraEsame) finestraEsame.close();
});

formEsame.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('esame-nome').value.trim();
  if (!nome) {
    esitoEsame.className = 'esito-form ko';
    esitoEsame.textContent = 'Serve il nome dell\'esame.';
    return;
  }

  esitoEsame.className = 'esito-form attesa';
  esitoEsame.textContent = 'Creazione';

  const creato = await creaEsame(nome, document.getElementById('esame-note').value.trim());

  if (!creato) {
    esitoEsame.className = 'esito-form ko';
    esitoEsame.textContent = `Non sono riuscita a creare l'esame. ${ultimoErroreDb() || ''}`.trim();
    return;
  }

  finestraEsame.close();
  await ricarica();
  // Si apre subito la scheda: creato l'esame, la cosa successiva e'
  // sempre mettergli dentro le date.
  apriScheda(tuttiGliEsami.find((x) => x.id === creato.id));
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

async function ricarica() {
  const [tutte, elenco] = await Promise.all([getDateEsame(), getEsami()]);
  // Nel mese finiscono solo le date da mostrare: gli appelli scartati
  // restano nella scheda del loro esame e basta. La regola sta in
  // db.js, qui si applica in un punto solo.
  date = tutte.filter((d) => d.daMostrare);
  tuttiGliEsami = elenco;

  disegnaMese();
  disegnaProssime();
  disegnaSessione();
}

async function avvia() {
  try {
    disegnaIntestazione();
    disegnaLegenda();
    await ricarica();

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
