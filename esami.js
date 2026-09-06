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
} from './db.js?v=38';
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

function dataBreve(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
  });
}

/* ---------- Il riepilogo in cima ----------
   Tre numeri, non di piu': quanti esami hai messo, quanti ne hai gia'
   dati, quanti hanno una data. E' il colpo d'occhio, il resto sta
   sotto. */

function mostraRiepilogo() {
  elRiepilogo.innerHTML = '';
  if (esami.length === 0) {
    elRiepilogo.hidden = true;
    return;
  }

  const dati = [
    { quanto: esami.length, nome: esami.length === 1 ? 'esame' : 'esami' },
    { quanto: esami.filter((e) => e.sostenuto).length, nome: 'gia dati' },
    { quanto: esami.filter((e) => !e.sostenuto && e.scelto).length, nome: 'con una data' },
  ];

  dati.forEach((d) => {
    const box = document.createElement('div');
    box.className = 'riepilogo-voce';

    const n = document.createElement('strong');
    n.textContent = d.quanto;
    box.appendChild(n);

    const t = document.createElement('span');
    t.textContent = d.nome;
    box.appendChild(t);

    elRiepilogo.appendChild(box);
  });

  elRiepilogo.hidden = false;
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

  if (esami.length === 0) {
    const invito = document.createElement('p');
    invito.className = 'blocco-nota';
    invito.textContent =
      'Nessun esame ancora. Scrivili una volta qui, e poi li ritrovi nel calendario e nell organizzazione studio.';
    elElenco.appendChild(invito);
  }

  strutturaAnni(esami).forEach((gruppo) => {
    const quanti = gruppo.semestri.reduce((s, x) => s + x.esami.length, 0);
    elElenco.appendChild(creaAnno(gruppo, quanti));
  });
}

/* Ogni anno e' una cartella che si apre. Chiusa, la pagina e' sei righe
   e si vede tutto il corso in un colpo; aperta, c'e' l'anno che stai
   guardando e basta. */
function creaAnno(gruppo, quanti) {
  const box = document.createElement('details');
  box.className = 'anno' + (quanti === 0 ? ' vuoto' : '');
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
  if (quanti === 0) {
    conto.classList.add('da-riempire');
    conto.textContent = 'da riempire';
  } else {
    const conData = gruppo.semestri
      .flatMap((s) => s.esami)
      .filter((e) => !e.sostenuto && e.scelto).length;
    conto.textContent =
      `${quanti} ${quanti === 1 ? 'esame' : 'esami'}` + (conData > 0 ? ` · ${conData} con una data` : '');
  }
  testa.appendChild(conto);

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
