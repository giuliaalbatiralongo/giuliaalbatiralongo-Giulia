import {
  getEsami,
  creaEsameCompleto,
  aggiornaEsame,
  eliminaEsame,
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
  ANNI,
} from './db.js?v=39';
import { proteggiPagina } from './auth.js?v=10';

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

/* ---------- L'elenco, per anno e semestre ---------- */

function disegna() {
  elElenco.innerHTML = '';
  mostraRiepilogo();
  mostraSceltaAnno();

  if (esami.length === 0) {
    const invito = document.createElement('p');
    invito.className = 'blocco-nota';
    invito.textContent =
      'Nessun esame ancora. Scrivili una volta qui, e poi li ritrovi nel calendario e nell organizzazione studio.';
    elElenco.appendChild(invito);
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
  finestra.showModal();
  document.getElementById('esame-nome').focus();
}

document.getElementById('apri-nuovo').addEventListener('click', () => apriFinestra(null));
document.getElementById('chiudi-finestra').addEventListener('click', () => finestra.close());
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

  if (await eliminaEsame(inModifica.id)) {
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
