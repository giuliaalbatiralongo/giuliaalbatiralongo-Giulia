import {
  getEsami,
  creaEsameCompleto,
  aggiornaEsame,
  eliminaEsame,
  eliminaDataEsame,
  strutturaAnni,
  nomeAnno,
  nomeSemestre,
  nomeVoto,
  giorniMancanti,
  ultimoErroreDb,
  mieImpostazioni,
  salvaImpostazioni,
  annoIndovinato,
  contiLibretto,
  statoAnno,
  calcolaMedie,
  ANNI,
  MANIFESTI,
  manifestoDi,
  contiManifesto,
  caricaManifesto,
} from './db.js?v=47452201';
import { proteggiPagina } from './auth.js?v=16743465';
import { preparaGiro } from './giro.js';
import { offriAnnulla } from './annulla.js?v=20216566';

const elScheletro = document.getElementById('scheletro');
const elElenco = document.getElementById('elenco');
const elRiepilogo = document.getElementById('riepilogo');
const finestra = document.getElementById('finestra-esame');
const form = document.getElementById('form-esame');
const esito = document.getElementById('esame-esito');

let esami = [];
// null quando si crea, l'esame quando lo si corregge.
let inModifica = null;
// A che anno sei. Null finche' non si sa: allora lo indovina il libretto.
let annoCorso = null;
// Vero quando l'anno non l'ha scelto lei: allora lo si dice, invece di
// far finta di saperlo.
let indovinato = false;

function dataBreve(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
}

/* ---------- I due quadratini in cima ----------

   Quanto hai in tasca e quanto fa il corso intero. I crediti sono il
   numero grande, gli esami quello sotto: un esame da 15 crediti e uno
   da 2 non sono la stessa cosa, e il libretto vero va a crediti. */

function mostraRiepilogo() {
  elRiepilogo.innerHTML = '';
  if (esami.length === 0) {
    elRiepilogo.hidden = true;
    return;
  }

  const c = contiLibretto(esami);
  const caselle = [
    { cfu: c.cfuDati, che: 'CFU dati', quanti: c.esamiDati, forte: true },
    { cfu: c.cfuTotali, che: 'CFU totali', quanti: c.esamiTotali, forte: false },
  ];

  caselle.forEach((v) => {
    const box = document.createElement('div');
    box.className = 'quadratino' + (v.forte ? ' fatto' : '');

    const n = document.createElement('strong');
    n.className = 'quadratino-numero';
    n.textContent = v.cfu;
    box.appendChild(n);

    const cfu = document.createElement('span');
    cfu.className = 'quadratino-cfu';
    cfu.textContent = v.che;
    box.appendChild(cfu);

    const esa = document.createElement('span');
    esa.className = 'quadratino-esami';
    esa.textContent = `${v.quanti} ${v.quanti === 1 ? 'esame' : 'esami'}`;
    box.appendChild(esa);

    elRiepilogo.appendChild(box);
  });

  elRiepilogo.hidden = false;
}

/* ---------- A che anno sei ----------

   Serve a due cose: dire quanti esami mancano per chiudere l'anno, e
   sfocare gli anni che non sono ancora affar tuo. Se non l'hai mai
   scelto viene indovinato dagli esami che risultano dati, e lo dice. */

function mostraSceltaAnno() {
  const riga = document.getElementById('scelta-anno');
  riga.innerHTML = '';
  if (esami.length === 0) {
    riga.hidden = true;
    return;
  }

  const et = document.createElement('label');
  et.className = 'scelta-anno-testo';
  et.setAttribute('for', 'anno-corso');
  et.textContent = 'Sei al';
  riga.appendChild(et);

  const scelta = document.createElement('select');
  scelta.id = 'anno-corso';
  scelta.className = 'scelta-anno-menu';
  ANNI.forEach((a) => {
    const o = document.createElement('option');
    o.value = String(a);
    o.textContent = nomeAnno(a);
    o.selected = a === annoCorso;
    scelta.appendChild(o);
  });
  scelta.addEventListener('change', async () => {
    annoCorso = Number(scelta.value);
    indovinato = false;
    disegna();
    await salvaImpostazioni({ anno_corso: annoCorso });
  });
  riga.appendChild(scelta);

  if (indovinato) {
    const nota = document.createElement('span');
    nota.className = 'scelta-anno-nota';
    nota.textContent = 'indovinato dagli esami che hai dato, correggilo se sbaglio';
    riga.appendChild(nota);
  }

  riga.hidden = false;
}

/* ---------- La media ----------

   Sta dietro un pulsante in fondo: e' una cosa che si guarda ogni tanto,
   non ogni volta che si apre il libretto.

   I voti li scrive lei qui dentro, uno dietro l'altro, senza aprire la
   scheda di ogni esame: e' l'unico posto dove serve farlo in fila. */

const finestraMedia = document.getElementById('finestra-media');
let lodeCome = 30;

function menuVoto(esame) {
  const menu = document.createElement('select');
  menu.className = 'media-voto';
  menu.setAttribute('aria-label', `Voto di ${esame.nome}`);

  const vuoto = document.createElement('option');
  vuoto.value = '';
  vuoto.textContent = '—';
  menu.appendChild(vuoto);

  for (let v = 18; v <= 31; v += 1) {
    const o = document.createElement('option');
    o.value = String(v);
    o.textContent = nomeVoto(v);
    o.selected = esame.voto === v;
    menu.appendChild(o);
  }

  menu.addEventListener('change', async () => {
    const voto = menu.value ? Number(menu.value) : null;
    const prima = esame.voto;
    esame.voto = voto;
    disegnaMedia();
    const salvato = await aggiornaEsame(esame.id, { ...esame, voto });
    if (!salvato) {
      // Se il salvataggio non passa, il numero a schermo deve tornare
      // quello vero: una media giusta su un voto che non c'e' e' peggio
      // di un errore visibile.
      esame.voto = prima;
      disegnaMedia();
      menu.classList.add('non-salvato');
      menu.title = ultimoErroreDb() || 'Non sono riuscita a salvare questo voto.';
    } else {
      menu.classList.remove('non-salvato');
      menu.title = '';
      esami = esami.map((e) => (e.id === salvato.id ? { ...e, ...salvato } : e));
      disegna();
    }
  });

  return menu;
}

function disegnaMedia() {
  const elenco = document.getElementById('media-elenco');
  const conti = document.getElementById('media-conti');
  elenco.innerHTML = '';
  conti.innerHTML = '';

  const dati = esami
    .filter((e) => e.sostenuto)
    .sort((a, b) => (a.anno || 9) - (b.anno || 9) || a.nome.localeCompare(b.nome, 'it'));

  if (dati.length === 0) {
    const vuoto = document.createElement('p');
    vuoto.className = 'blocco-nota';
    vuoto.textContent =
      'Nessun esame ancora dato. Segnane uno come gi\u00e0 sostenuto dalla sua scheda e comparir\u00e0 qui.';
    elenco.appendChild(vuoto);
    return;
  }

  dati.forEach((esame) => {
    const riga = document.createElement('div');
    riga.className = 'media-riga';

    const testo = document.createElement('div');
    testo.className = 'media-riga-testo';

    const nome = document.createElement('span');
    nome.className = 'media-riga-nome';
    nome.textContent = esame.nome;
    testo.appendChild(nome);

    const dove = document.createElement('span');
    dove.className = 'media-riga-dove';
    dove.textContent = esame.anno ? nomeAnno(esame.anno) : 'anno non indicato';
    testo.appendChild(dove);

    riga.appendChild(testo);

    const cfu = document.createElement('span');
    cfu.className = 'media-riga-cfu' + (esame.cfu ? '' : ' manca');
    cfu.textContent = esame.cfu ? `${esame.cfu} CFU` : 'crediti?';
    riga.appendChild(cfu);

    riga.appendChild(menuVoto(esame));
    elenco.appendChild(riga);
  });

  const m = calcolaMedie(esami, lodeCome);

  const dueMedie = [
    { nome: 'Media aritmetica', valore: m.aritmetica, sotto: `su ${m.quanti} ${m.quanti === 1 ? 'esame' : 'esami'}` },
    { nome: 'Media pesata', valore: m.pesata, sotto: `sui crediti · ${m.cfu} CFU` },
  ];

  dueMedie.forEach((d) => {
    const box = document.createElement('div');
    box.className = 'media-conto';

    const n = document.createElement('strong');
    n.className = 'media-conto-numero';
    n.textContent = d.valore == null ? '—' : d.valore.toFixed(2).replace('.', ',');
    box.appendChild(n);

    const t = document.createElement('span');
    t.className = 'media-conto-nome';
    t.textContent = d.nome;
    box.appendChild(t);

    const s = document.createElement('span');
    s.className = 'media-conto-sotto';
    s.textContent = d.sotto;
    box.appendChild(s);

    conti.appendChild(box);
  });

  /* Come contare la lode. Sono due conti diversi, tutti e due usati:
     l'ateneo la conta 30 per la media di carriera, fra studenti si dice
     31. Si vedono tutte e due con un clic. */
  const scelta = document.createElement('div');
  scelta.className = 'media-lode';

  const et = document.createElement('span');
  et.className = 'media-lode-testo';
  et.textContent = 'La lode vale';
  scelta.appendChild(et);

  const gruppo = document.createElement('div');
  gruppo.className = 'media-lode-gruppo';
  [30, 31].forEach((v) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'media-lode-tasto' + (lodeCome === v ? ' scelto' : '');
    b.textContent = String(v);
    b.setAttribute('aria-pressed', String(lodeCome === v));
    b.addEventListener('click', async () => {
      lodeCome = v;
      disegnaMedia();
      await salvaImpostazioni({ lode_come: v });
    });
    gruppo.appendChild(b);
  });
  scelta.appendChild(gruppo);
  conti.appendChild(scelta);

  const nota = document.createElement('p');
  nota.className = 'media-nota';
  nota.textContent =
    lodeCome === 30
      ? 'Come la conta l\u2019universit\u00e0 per la media di carriera.'
      : 'Come se la contano fra studenti. L\u2019ateneo di solito usa 30.';
  conti.appendChild(nota);

  /* Quello che la media ha saltato va detto: un numero che tace i buchi
     e' un numero falso. */
  const buchi = [];
  if (m.senzaVoto > 0) {
    buchi.push(`${m.senzaVoto} ${m.senzaVoto === 1 ? 'esame \u00e8 senza voto' : 'esami sono senza voto'}`);
  }
  if (m.senzaCfu > 0) {
    buchi.push(`${m.senzaCfu} ${m.senzaCfu === 1 ? '\u00e8 senza crediti' : 'sono senza crediti'}, quindi fuori dalla pesata`);
  }
  if (buchi.length > 0) {
    const avviso = document.createElement('p');
    avviso.className = 'media-buchi';
    avviso.innerHTML = '<i class="ph ph-info" aria-hidden="true"></i> ';
    avviso.append(buchi.join('; ') + '.');
    conti.appendChild(avviso);
  }
}

function apriMedia() {
  disegnaMedia();
  finestraMedia.showModal();
}

/* ---------- Un esame nell'elenco ---------- */

function creaRiga(esame) {
  const riga = document.createElement('button');
  riga.type = 'button';
  riga.className = 'esame-riga' + (esame.sostenuto ? ' fatto' : '');
  riga.addEventListener('click', () => apriFinestra(esame));

  const segno = document.createElement('span');
  segno.className = 'esame-riga-segno';
  segno.innerHTML = esame.sostenuto
    ? '<i class="ph-fill ph-check-circle" aria-hidden="true"></i>'
    : '<i class="ph ph-circle" aria-hidden="true"></i>';
  riga.appendChild(segno);

  const testo = document.createElement('span');
  testo.className = 'esame-riga-testo';

  const nome = document.createElement('span');
  nome.className = 'esame-riga-nome';
  nome.textContent = esame.nome;
  testo.appendChild(nome);

  const meta = document.createElement('span');
  meta.className = 'esame-riga-meta';
  const pezzi = [];
  if (esame.cfu) pezzi.push(`${esame.cfu} crediti`);
  if (esame.docente) pezzi.push(esame.docente);
  meta.textContent = pezzi.join(' · ');
  if (pezzi.length > 0) testo.appendChild(meta);

  riga.appendChild(testo);

  const stato = document.createElement('span');
  stato.className = 'esame-riga-stato';

  if (esame.sostenuto) {
    stato.classList.add('preso');
    stato.textContent = nomeVoto(esame.voto) || 'fatto';
  } else if (esame.scelto) {
    const g = giorniMancanti(esame.scelto.giorno);
    stato.classList.add('con-data');
    stato.textContent =
      g < 0 ? dataBreve(esame.scelto.giorno) : g === 0 ? 'oggi' : g === 1 ? 'domani' : `tra ${g} giorni`;
  } else if (esame.appelli.length > 0) {
    stato.classList.add('da-scegliere');
    stato.textContent = esame.appelli.length === 1 ? '1 appello' : `${esame.appelli.length} appelli`;
  } else {
    stato.classList.add('senza');
    stato.textContent = 'nessuna data';
  }

  riga.appendChild(stato);
  return riga;
}

/* Il libretto vuoto e' il muro di chi apre Akesis la prima volta: sei
   anni "da riempire" e 46 esami da digitare uno per uno. Qui invece si
   offre di caricarli tutti.

   Il corso c'e' scritto grosso di proposito. Non tutti quelli che
   useranno Akesis fanno Medicina a Genova, e uno che studia altrove
   deve capire in un secondo che quel tasto non e' per lui, senza
   provarlo e poi doversi disfare 46 esami sbagliati. */
function propostaManifesto() {
  const scatola = document.createElement('div');
  scatola.className = 'primo-libretto';

  const titolo = document.createElement('p');
  titolo.className = 'primo-libretto-titolo';
  titolo.textContent = 'Il tuo libretto è vuoto';
  scatola.appendChild(titolo);

  const spiega = document.createElement('p');
  spiega.className = 'primo-libretto-testo';
  spiega.textContent =
    'Gli esami si scrivono una volta sola: poi li ritrovi nel calendario, '
    + 'nell\'organizzazione studio e nella media. Rispondi a due domande e '
    + 'te li carico io.';
  scatola.appendChild(spiega);

  /* Prima domanda: a che anno sei. Serve al libretto per sapere quale
     anno mettere in evidenza, e prima non si poteva nemmeno dire: il
     menu dell'anno compare solo quando gli esami ci sono gia'. */
  const rigaAnno = document.createElement('div');
  rigaAnno.className = 'primo-libretto-campo';

  const etAnno = document.createElement('label');
  etAnno.className = 'primo-libretto-etichetta';
  etAnno.setAttribute('for', 'primo-anno');
  etAnno.textContent = 'A che anno sei?';
  rigaAnno.appendChild(etAnno);

  const menuAnno = document.createElement('select');
  menuAnno.id = 'primo-anno';
  menuAnno.className = 'primo-libretto-menu';
  ANNI.forEach((a) => {
    const o = document.createElement('option');
    o.value = String(a);
    o.textContent = nomeAnno(a);
    o.selected = a === annoCorso;
    menuAnno.appendChild(o);
  });
  menuAnno.addEventListener('change', async () => {
    annoCorso = Number(menuAnno.value);
    indovinato = false;
    await salvaImpostazioni({ anno_corso: annoCorso });
  });
  rigaAnno.appendChild(menuAnno);
  scatola.appendChild(rigaAnno);

  /* Seconda domanda: che corso. L'elenco per adesso ha un ateneo solo,
     ma e' un elenco e non un tasto: aggiungerne un altro vuol dire una
     voce in piu' in MANIFESTI, non rifare questa schermata. */
  const rigaCorso = document.createElement('div');
  rigaCorso.className = 'primo-libretto-campo';

  const etCorso = document.createElement('label');
  etCorso.className = 'primo-libretto-etichetta';
  etCorso.setAttribute('for', 'primo-corso');
  etCorso.textContent = 'Che corso fai?';
  rigaCorso.appendChild(etCorso);

  const menuCorso = document.createElement('select');
  menuCorso.id = 'primo-corso';
  menuCorso.className = 'primo-libretto-menu';
  MANIFESTI.forEach((m) => {
    const o = document.createElement('option');
    o.value = m.chiave;
    o.textContent = m.nome;
    menuCorso.appendChild(o);
  });
  const altro = document.createElement('option');
  altro.value = '__altro__';
  altro.textContent = 'La mia università non è in elenco';
  menuCorso.appendChild(altro);
  rigaCorso.appendChild(menuCorso);
  scatola.appendChild(rigaCorso);

  const dettaglio = document.createElement('p');
  dettaglio.className = 'primo-libretto-dettaglio';
  scatola.appendChild(dettaglio);

  const suoEsito = document.createElement('p');
  suoEsito.className = 'esito-form';
  scatola.appendChild(suoEsito);

  const tasto = document.createElement('button');
  tasto.type = 'button';
  tasto.className = 'btn btn-primario primo-libretto-tasto';
  scatola.appendChild(tasto);

  function aggiorna() {
    const scelto = menuCorso.value;
    if (scelto === '__altro__') {
      dettaglio.textContent =
        'Degli altri atenei non ho il piano di studi, e inventarmelo sarebbe peggio '
        + 'che non averlo. Scrivi tu i tuoi esami con "Nuovo esame" qui sopra: '
        + 'è più lungo, ma sono i tuoi.';
      tasto.hidden = true;
      return;
    }
    const m = manifestoDi(scelto);
    const conti = contiManifesto(m);
    dettaglio.textContent =
      `${conti.esami} esami, ${conti.cfu} crediti, ${m.anni} anni \u00b7 ${m.fonte}`;
    tasto.hidden = false;
    tasto.textContent = 'Carica questi esami';
  }

  menuCorso.addEventListener('change', aggiorna);
  tasto.addEventListener('click', () => {
    const m = manifestoDi(menuCorso.value);
    if (m) caricaPiano(m, tasto, suoEsito);
  });
  aggiorna();

  return scatola;
}

async function caricaPiano(manifesto, tasto, dove) {
  // Il tasto si spegne subito: due clic facevano due piani doppi, ed e'
  // gia' successo con i piani di studio.
  tasto.disabled = true;
  tasto.textContent = 'Carico';
  dove.textContent = '';
  dove.className = 'esito-form';

  const fatto = await caricaManifesto(manifesto.chiave);

  if (!fatto.ok) {
    tasto.disabled = false;
    tasto.textContent = 'Carica questi esami';
    dove.className = 'esito-form ko';
    dove.textContent = fatto.errore;
    return;
  }

  // Nessun messaggio di riuscita: i 46 esami che compaiono al posto
  // della scatola dicono da soli com'e' andata. Serve `ricarica`, non
  // `disegna`: il secondo ridisegna la lista che gia' c'e' in memoria,
  // e quella e' ancora vuota.
  await ricarica();
}

/* ---------- L'elenco, per anno e semestre ---------- */

function disegna() {
  elElenco.innerHTML = '';
  mostraRiepilogo();
  mostraSceltaAnno();
  // Senza esami non c'e' niente di cui fare la media.
  document.getElementById('fondo-libretto').hidden = esami.length === 0;

  if (esami.length === 0) {
    elElenco.appendChild(propostaManifesto());
  }

  strutturaAnni(esami).forEach((gruppo) => {
    elElenco.appendChild(creaAnno(gruppo, statoAnno(gruppo, annoCorso)));
  });
}

/* Ogni anno e' una cartella che si apre. Chiusa, la pagina e' sei righe
   e si vede tutto il corso in un colpo; aperta, c'e' l'anno che stai
   guardando e basta. */
function creaAnno(gruppo, stato) {
  const box = document.createElement('details');
  box.className = 'anno'
    + (stato.vuoto ? ' vuoto' : '')
    + (stato.quando === 'futuro' ? ' futuro' : '')
    + (stato.quando === 'corso' ? ' adesso' : '');
  box.open = anniAperti().includes(gruppo.anno);

  box.addEventListener('toggle', () => ricordaAnno(gruppo.anno, box.open));

  const testa = document.createElement('summary');
  testa.className = 'anno-testa';

  const freccia = document.createElement('i');
  freccia.className = 'ph ph-caret-right anno-freccia';
  freccia.setAttribute('aria-hidden', 'true');
  testa.appendChild(freccia);

  const nome = document.createElement('span');
  nome.className = 'anno-nome';
  nome.textContent = nomeAnno(gruppo.anno);
  testa.appendChild(nome);

  const conto = document.createElement('span');
  conto.className = 'anno-conto';
  if (stato.vuoto) conto.classList.add('da-riempire');
  else if (stato.mancano === 0) conto.classList.add('finito');
  else if (stato.quando === 'passato') conto.classList.add('indietro');
  conto.textContent = stato.testo;
  testa.appendChild(conto);

  // Un anno che deve ancora venire si vede sfocato: non e' chiuso, e'
  // solo che adesso non e' affar tuo. Basta passarci sopra o aprirlo e
  // torna a fuoco per intero.
  if (stato.quando === 'futuro') {
    testa.title = 'Non ci sei ancora arrivata. Aprilo pure: si legge tutto.';
  }

  box.appendChild(testa);

  const dentro = document.createElement('div');
  dentro.className = 'anno-dentro';

  gruppo.semestri.forEach((s) => {
    const blocco = document.createElement('div');
    blocco.className = 'semestre';

    const nomeSem = document.createElement('p');
    nomeSem.className = 'semestre-nome';
    nomeSem.textContent = nomeSemestre(s.semestre);
    blocco.appendChild(nomeSem);

    s.esami.forEach((e) => blocco.appendChild(creaRiga(e)));

    if (gruppo.anno > 0) {
      const aggiungi = document.createElement('button');
      aggiungi.type = 'button';
      aggiungi.className = 'aggiungi-qui';
      aggiungi.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i> Aggiungi un esame';
      aggiungi.addEventListener('click', () =>
        apriFinestra(null, { anno: gruppo.anno, semestre: s.semestre || null })
      );
      blocco.appendChild(aggiungi);
    }

    dentro.appendChild(blocco);
  });

  box.appendChild(dentro);
  return box;
}

/* Quali anni erano aperti l'ultima volta. Se il browser non lascia
   salvare (finestra anonima, dati bloccati) valgono solo per questa
   visita: e' un fastidio, non un errore. */
const CHIAVE_ANNI = 'akesis-anni-aperti';

function anniAperti() {
  try {
    return JSON.parse(localStorage.getItem(CHIAVE_ANNI) || '[]');
  } catch (e) {
    return [];
  }
}

function ricordaAnno(anno, aperto) {
  try {
    const adesso = new Set(anniAperti());
    if (aperto) adesso.add(anno);
    else adesso.delete(anno);
    localStorage.setItem(CHIAVE_ANNI, JSON.stringify([...adesso]));
  } catch (e) {
    /* niente da fare */
  }
}

/* ---------- La finestra ---------- */

function preparaVoti() {
  const menu = document.getElementById('esame-voto');
  menu.innerHTML = '';
  const vuoto = document.createElement('option');
  vuoto.value = '';
  vuoto.textContent = '—';
  menu.appendChild(vuoto);
  for (let v = 18; v <= 31; v += 1) {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = nomeVoto(v);
    menu.appendChild(o);
  }
}

// Il voto ha senso solo se l'esame e' stato dato: chiederlo prima e'
// solo una casella in piu' da saltare.
function aggiornaCampoVoto() {
  document.getElementById('campo-voto').hidden = !document.getElementById('esame-sostenuto').checked;
}

document.getElementById('esame-sostenuto').addEventListener('change', aggiornaCampoVoto);

/* Le date di un esame, dentro la sua scheda.

   Qui si tolgono soltanto: e' qui che le cerchi quando ti accorgi che
   una data e' sbagliata. Aggiungerne una e decidere a quale appello ti
   presenti resta lavoro del calendario, perche' due strade per la stessa
   cosa finiscono sempre per non dire la stessa cosa. */
function mostraDate(esame) {
  const campo = document.getElementById('campo-date');
  const elenco = document.getElementById('esame-date');
  elenco.innerHTML = '';

  if (!esame || esame.appelli.length === 0) {
    campo.hidden = true;
    return;
  }

  esame.appelli.forEach((d) => {
    const riga = document.createElement('div');
    riga.className = 'data-esame-riga' + (esame.appello_scelto === d.id ? ' scelta' : '');

    const testo = document.createElement('span');
    testo.className = 'data-esame-quando';
    const quando = new Date(d.giorno + 'T00:00:00').toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    testo.textContent = d.ora ? `${quando}, ${d.ora.slice(0, 5)}` : quando;
    riga.appendChild(testo);

    const tipo = document.createElement('span');
    tipo.className = 'data-esame-tipo';
    tipo.textContent = esame.appello_scelto === d.id ? 'ti presenti a questa' : d.tipo;
    riga.appendChild(tipo);

    const togli = document.createElement('button');
    togli.type = 'button';
    togli.className = 'btn-piu';
    togli.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
    togli.setAttribute('aria-label', `Togli la data del ${quando}`);
    togli.title = 'Togli questa data';
    togli.addEventListener('click', async () => {
      if (!window.confirm(`Togliere la data del ${quando}?`)) return;
      togli.disabled = true;
      const gesto = await eliminaDataEsame(d.id);
      if (gesto) {
        offriAnnulla(`La data del ${quando}`, gesto, ricarica);
        await ricarica();
        const fresco = esami.find((e) => e.id === esame.id);
        inModifica = fresco || null;
        mostraDate(fresco);
      } else {
        togli.disabled = false;
        esito.className = 'esito-form ko';
        esito.textContent =
          `Non sono riuscita a togliere questa data. ${ultimoErroreDb() || ''}`.trim();
      }
    });
    riga.appendChild(togli);

    elenco.appendChild(riga);
  });

  campo.hidden = false;
}

function apriFinestra(esame, casella = null) {
  inModifica = esame || null;
  form.reset();
  esito.textContent = '';
  esito.className = 'esito-form';

  document.getElementById('titolo-finestra').textContent = esame ? esame.nome : 'Un esame';
  document.getElementById('salva-esame').innerHTML = esame
    ? '<i class="ph ph-check" aria-hidden="true"></i> Salva'
    : '<i class="ph ph-check" aria-hidden="true"></i> Crea';
  document.getElementById('elimina-esame').hidden = !esame;

  if (esame) {
    document.getElementById('esame-nome').value = esame.nome;
    document.getElementById('esame-corso').value = esame.corso || '';
    document.getElementById('esame-anno').value = esame.anno || '';
    document.getElementById('esame-semestre').value = esame.semestre || '';
    document.getElementById('esame-cfu').value = esame.cfu || '';
    document.getElementById('esame-docente').value = esame.docente || '';
    document.getElementById('esame-note').value = esame.note || '';
    document.getElementById('esame-sostenuto').checked = !!esame.sostenuto;
    document.getElementById('esame-voto').value = esame.voto || '';
  } else {
    // Il corso di laurea e' quasi sempre lo stesso: si ricopia
    // dall'ultimo, cosi' non si riscrive trenta volte.
    const ultimo = esami.find((e) => e.corso);
    if (ultimo) document.getElementById('esame-corso').value = ultimo.corso;

    // Aperta da un semestre preciso, la finestra ci nasce dentro
    if (casella) {
      document.getElementById('esame-anno').value = casella.anno || '';
      document.getElementById('esame-semestre').value = casella.semestre || '';
    }
  }

  aggiornaCampoVoto();
  mostraDate(esame);
  finestra.showModal();
  document.getElementById('esame-nome').focus();
}

document.getElementById('apri-nuovo').addEventListener('click', () => apriFinestra(null));
document.getElementById('chiudi-finestra').addEventListener('click', () => finestra.close());

document.getElementById('apri-media').addEventListener('click', apriMedia);
document.getElementById('chiudi-media').addEventListener('click', () => finestraMedia.close());
// La X in alto e' piccola e sul telefono si trova male: il modo per
// uscire deve stare anche in fondo, dove finisce di leggere.
document.getElementById('fatto-media').addEventListener('click', () => finestraMedia.close());
finestraMedia.addEventListener('click', (e) => {
  if (e.target === finestraMedia) finestraMedia.close();
});
finestra.addEventListener('click', (e) => {
  if (e.target === finestra) finestra.close();
});
finestra.addEventListener('close', () => {
  inModifica = null;
});

document.getElementById('elimina-esame').addEventListener('click', async () => {
  if (!inModifica) return;
  const quanti = inModifica.appelli.length;
  const avviso =
    quanti === 0
      ? `Eliminare ${inModifica.nome}?`
      : `Eliminare ${inModifica.nome}? Se ne vanno anche le sue ${quanti} date dal calendario.`;
  if (!window.confirm(avviso)) return;

  const nome = inModifica.nome;
  const gesto = await eliminaEsame(inModifica.id);
  if (gesto) {
    offriAnnulla(`L esame ${nome}`, gesto, ricarica);
    finestra.close();
    await ricarica();
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await salva();
  } catch (errore) {
    esito.className = 'esito-form ko';
    esito.textContent = `Qualcosa e andato storto: ${errore.message}`;
    console.error(errore);
  }
});

async function salva() {
  const numero = (id) => {
    const v = document.getElementById(id).value;
    return v === '' ? null : Number(v);
  };

  const nome = document.getElementById('esame-nome').value.trim();
  if (!nome) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Serve il nome dell esame.';
    return;
  }

  const sostenuto = document.getElementById('esame-sostenuto').checked;

  const dati = {
    nome,
    corso: document.getElementById('esame-corso').value.trim() || null,
    anno: numero('esame-anno'),
    semestre: numero('esame-semestre'),
    cfu: numero('esame-cfu'),
    docente: document.getElementById('esame-docente').value.trim() || null,
    note: document.getElementById('esame-note').value.trim() || null,
    sostenuto,
    // Il voto si tiene solo se l'esame risulta dato: altrimenti resta
    // appiccicato a un esame che non hai ancora fatto.
    voto: sostenuto ? numero('esame-voto') : null,
  };

  esito.className = 'esito-form attesa';
  esito.textContent = inModifica ? 'Salvataggio' : 'Creazione';

  const fatto = inModifica
    ? await aggiornaEsame(inModifica.id, dati)
    : await creaEsameCompleto(dati);

  if (!fatto) {
    esito.className = 'esito-form ko';
    esito.textContent = `${
      inModifica ? 'Non sono riuscita a salvare.' : 'Non sono riuscita a creare l\'esame.'
    } ${ultimoErroreDb() || ''}`.trim();
    return;
  }

  finestra.close();
  await ricarica();
}

/* ---------- Avvio ---------- */

async function ricarica() {
  esami = await getEsami();
  disegna();
}

async function avvia() {
  try {
    preparaVoti();

    // L'anno in corso e gli esami servono tutti e due prima di disegnare:
    // senza l'anno non si sa cosa sfocare ne' cosa manca per finirlo.
    const [impostazioni, elenco] = await Promise.all([mieImpostazioni(), getEsami()]);
    esami = elenco;
    indovinato = impostazioni.anno_corso == null;
    annoCorso = impostazioni.anno_corso ?? annoIndovinato(esami);
    lodeCome = impostazioni.lode_come ?? 30;
    disegna();
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

// Il giro guidato della prima volta: decide da se' se c'e' da fare qualcosa.
preparaGiro();
