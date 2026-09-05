import {
  getSessioni,
  inserisciSessione,
  aggiornaFatteEsame,
  eliminaSessione,
  calcolaSessione,
  getDateEsame,
  titoloData,
  giorniMancanti,
} from './db.js?v=22';
import { proteggiPagina } from './auth.js?v=10';

const elScheletro = document.getElementById('scheletro');
const elSessioni = document.getElementById('sessioni');
const finestra = document.getElementById('finestra-sessione');
const form = document.getElementById('form-sessione');
const esito = document.getElementById('sessione-esito');
const elRighe = document.getElementById('righe-esami');

const NOMI_GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

let sessioni = [];
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

/* ---------- Scheda di una sessione ---------- */

function creaScheda(sessione) {
  const calcolo = calcolaSessione(sessione, oggiIso());

  const card = document.createElement('article');
  card.className = 'piano-card';

  /* Testata */
  const testa = document.createElement('div');
  testa.className = 'piano-testa';

  const titolo = document.createElement('div');
  const nome = document.createElement('h2');
  nome.className = 'piano-nome';
  nome.textContent = sessione.nome;
  titolo.appendChild(nome);

  const sotto = document.createElement('p');
  sotto.className = 'piano-quando';
  const liberi = (sessione.giorni_liberi || [])
    .map((n) => NOMI_GIORNI[n - 1])
    .join(', ');
  sotto.textContent =
    `${plurale(sessione.esami.length, 'esame', 'esami')}` +
    (liberi ? ` · liberi: ${liberi}` : ' · nessun giorno libero');
  titolo.appendChild(sotto);
  testa.appendChild(titolo);

  const togli = document.createElement('button');
  togli.type = 'button';
  togli.className = 'link-bottone';
  togli.textContent = 'Elimina';
  togli.addEventListener('click', async () => {
    if (!window.confirm(`Eliminare la sessione "${sessione.nome}"?`)) return;
    togli.disabled = true;
    if (await eliminaSessione(sessione.id)) {
      sessioni = sessioni.filter((s) => s.id !== sessione.id);
      disegna();
    } else {
      togli.disabled = false;
    }
  });
  testa.appendChild(togli);
  card.appendChild(testa);

  /* Il ritmo: la risposta alla domanda per cui si apre questa pagina */
  const riquadro = document.createElement('div');
  riquadro.className = 'piano-oggi';

  if (calcolo.ritmo === 0) {
    riquadro.classList.add('spento');
    riquadro.textContent = 'Non resta niente da studiare in questa sessione.';
  } else if (!Number.isFinite(calcolo.ritmo)) {
    riquadro.classList.add('allarme');
    riquadro.textContent =
      `Non restano giorni utili prima di ${calcolo.stretto.titolo}. ` +
      'Togli qualche giorno libero, o sposta la data.';
  } else {
    const numero = document.createElement('p');
    numero.className = 'piano-oggi-titolo';
    numero.textContent = `${calcolo.ritmo.toFixed(1)} lezioni al giorno`;
    riquadro.appendChild(numero);

    const spiega = document.createElement('p');
    spiega.className = 'piano-oggi-quali';
    spiega.textContent = calcolo.stretto
      ? `Lo impone ${calcolo.stretto.titolo}: ${calcolo.stretto.cumulate} lezioni in ${plurale(calcolo.stretto.disponibili, 'giorno', 'giorni')}.`
      : '';
    riquadro.appendChild(spiega);

    if (!calcolo.fattibile) {
      riquadro.classList.add('allarme');
      const avviso = document.createElement('p');
      avviso.className = 'piano-oggi-quali';
      avviso.textContent =
        'E un ritmo che non si tiene. Valuta se togliere un giorno libero, spostare un esame, o darne uno in meno.';
      riquadro.appendChild(avviso);
    }
  }

  card.appendChild(riquadro);

  /* Gli esami, uno per riga */
  const elenco = document.createElement('div');
  elenco.className = 'esami-elenco';

  calcolo.esami.forEach((esame) => {
    const riga = document.createElement('div');
    riga.className = 'esame-riga';

    const info = document.createElement('div');
    const nomeEsame = document.createElement('p');
    nomeEsame.className = 'esame-nome';
    nomeEsame.textContent = esame.titolo;
    info.appendChild(nomeEsame);

    const mancano = giorniMancanti(esame.giorno);
    const meta = document.createElement('p');
    meta.className = 'esame-meta';
    meta.textContent =
      mancano < 0
        ? `passato il ${dataBreve(esame.giorno)}`
        : mancano === 0
          ? 'oggi'
          : `${plurale(mancano, 'giorno', 'giorni')} · ${dataBreve(esame.giorno)}`;
    info.appendChild(meta);
    riga.appendChild(info);

    const barra = document.createElement('span');
    barra.className = 'stato-barra';
    const pieno = document.createElement('span');
    pieno.className = 'stato-barra-pieno';
    pieno.style.width = `${(esame.fatte / esame.totale_lezioni) * 100}%`;
    barra.appendChild(pieno);
    riga.appendChild(barra);

    const conto = document.createElement('span');
    conto.className = 'esame-conto';
    conto.textContent = `${esame.fatte}/${esame.totale_lezioni}`;
    riga.appendChild(conto);

    const azioni = document.createElement('div');
    azioni.className = 'esame-azioni';

    const meno = document.createElement('button');
    meno.type = 'button';
    meno.className = 'btn-piu';
    meno.innerHTML = '<i class="ph ph-minus" aria-hidden="true"></i>';
    meno.setAttribute('aria-label', `Togli una lezione da ${esame.titolo}`);
    meno.disabled = esame.fatte === 0;

    const piu = document.createElement('button');
    piu.type = 'button';
    piu.className = 'btn-piu';
    piu.innerHTML = '<i class="ph ph-plus" aria-hidden="true"></i>';
    piu.setAttribute('aria-label', `Segna una lezione fatta di ${esame.titolo}`);
    piu.disabled = esame.fatte >= esame.totale_lezioni;

    async function cambia(delta) {
      const nuovo = Math.min(Math.max(esame.fatte + delta, 0), esame.totale_lezioni);
      if (nuovo === esame.fatte) return;
      meno.disabled = true;
      piu.disabled = true;
      if (await aggiornaFatteEsame(esame.id, nuovo)) {
        const vero = sessione.esami.find((e) => e.id === esame.id);
        if (vero) vero.fatte = nuovo;
        disegna();
      } else {
        meno.disabled = false;
        piu.disabled = false;
      }
    }

    meno.addEventListener('click', () => cambia(-1));
    piu.addEventListener('click', () => cambia(1));

    azioni.appendChild(meno);
    azioni.appendChild(piu);
    riga.appendChild(azioni);

    elenco.appendChild(riga);
  });

  card.appendChild(elenco);

  /* I prossimi giorni: cosa studiare, non solo quanto */
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

      g.voci.forEach((v) => {
        const voce = document.createElement('span');
        voce.className = 'piano-giorno-voce';
        voce.textContent = v.titolo;
        voce.title = `${v.titolo}: ${v.da === v.a ? `lezione ${v.da}` : `lezioni ${v.da}-${v.a}`}`;
        riga.appendChild(voce);

        const numeri = document.createElement('span');
        numeri.className = 'piano-giorno-quante';
        numeri.textContent = v.da === v.a ? `${v.da}` : `${v.da}-${v.a}`;
        riga.appendChild(numeri);
      });

      prossimi.appendChild(riga);
    });

    card.appendChild(prossimi);

    const nota = document.createElement('p');
    nota.className = 'blocco-nota';
    nota.textContent =
      'I giorni si riempiono dando la precedenza all esame che scade prima. ' +
      'Se resti indietro, il piano si ricalcola da solo.';
    card.appendChild(nota);
  }

  return card;
}

function disegna() {
  elSessioni.innerHTML = '';

  if (sessioni.length === 0) {
    elSessioni.innerHTML = `
      <div class="stato-vuoto">
        <i class="ph ph-path" aria-hidden="true"></i>
        <p>Nessuna sessione. Mettici dentro gli esami che hai davanti.</p>
      </div>
    `;
    return;
  }

  sessioni.forEach((s) => elSessioni.appendChild(creaScheda(s)));
}

/* ---------- Righe della finestra ---------- */

function aggiungiRiga(preimpostato) {
  const riga = document.createElement('div');
  riga.className = 'riga-esame';

  const titolo = document.createElement('input');
  titolo.type = 'text';
  titolo.placeholder = 'Materia';
  titolo.className = 'riga-titolo';
  titolo.required = true;
  titolo.setAttribute('list', 'date-suggerite');
  if (preimpostato?.titolo) titolo.value = preimpostato.titolo;

  const giorno = document.createElement('input');
  giorno.type = 'date';
  giorno.required = true;
  giorno.setAttribute('aria-label', "Giorno dell'esame");
  if (preimpostato?.giorno) giorno.value = preimpostato.giorno;

  const lezioni = document.createElement('input');
  lezioni.type = 'number';
  lezioni.min = '1';
  lezioni.max = '2000';
  lezioni.required = true;
  lezioni.placeholder = 'Lezioni';
  lezioni.setAttribute('aria-label', 'Quante lezioni');

  const togli = document.createElement('button');
  togli.type = 'button';
  togli.className = 'btn-piu';
  togli.innerHTML = '<i class="ph ph-x" aria-hidden="true"></i>';
  togli.setAttribute('aria-label', 'Togli questo esame');
  togli.addEventListener('click', () => {
    riga.remove();
    if (!elRighe.querySelector('.riga-esame')) aggiungiRiga();
  });

  riga.append(titolo, giorno, lezioni, togli);
  elRighe.appendChild(riga);
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
    etichetta.appendChild(casella);

    const testo = document.createElement('span');
    testo.textContent = nome;
    etichetta.appendChild(testo);

    scelta.appendChild(etichetta);
  });

  // Le date gia' in calendario si possono richiamare scrivendo il nome.
  const suggerimenti = document.createElement('datalist');
  suggerimenti.id = 'date-suggerite';
  date
    .filter((d) => giorniMancanti(d.giorno) >= 0)
    .forEach((d) => {
      const opzione = document.createElement('option');
      opzione.value = titoloData(d);
      opzione.dataset.giorno = d.giorno;
      suggerimenti.appendChild(opzione);
    });
  document.body.appendChild(suggerimenti);

  // Scrivendo un titolo che corrisponde a una data in calendario, il
  // giorno si compila da solo.
  elRighe.addEventListener('input', (e) => {
    if (!e.target.classList.contains('riga-titolo')) return;
    const trovata = date.find(
      (d) => titoloData(d).toLowerCase() === e.target.value.trim().toLowerCase()
    );
    if (!trovata) return;
    const campoGiorno = e.target.parentElement.querySelector('input[type="date"]');
    if (campoGiorno && !campoGiorno.value) campoGiorno.value = trovata.giorno;
  });
}

document.getElementById('aggiungi-esame').addEventListener('click', () => aggiungiRiga());

document.getElementById('apri-nuovo').addEventListener('click', () => {
  form.reset();
  esito.textContent = '';
  esito.className = 'esito-form';
  elRighe.innerHTML = '';
  aggiungiRiga();
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

  const liberi = [...document.querySelectorAll('#giorni-liberi input:checked')].map((c) =>
    Number(c.value)
  );

  if (liberi.length === 7) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Se sono liberi tutti i giorni non resta niente su cui distribuire.';
    return;
  }

  const esami = [...elRighe.querySelectorAll('.riga-esame')].map((riga) => {
    const campi = riga.querySelectorAll('input');
    return {
      titolo: campi[0].value.trim(),
      giorno: campi[1].value,
      totale_lezioni: Number(campi[2].value),
    };
  });

  if (esami.some((e2) => !e2.titolo || !e2.giorno || !e2.totale_lezioni)) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Manca qualcosa in uno degli esami.';
    return;
  }

  if (esami.some((e2) => e2.giorno <= oggiIso())) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Gli esami devono essere nel futuro.';
    return;
  }

  esito.className = 'esito-form attesa';
  esito.textContent = 'Creazione';

  const salvata = await inserisciSessione(
    {
      nome: document.getElementById('sessione-nome').value.trim(),
      inizio: oggiIso(),
      giorni_liberi: liberi,
    },
    esami
  );

  if (!salvata) {
    esito.className = 'esito-form ko';
    esito.textContent = 'Non sono riuscita a creare la sessione.';
    return;
  }

  sessioni.unshift(salvata);
  finestra.close();
  disegna();
});

/* ---------- Avvio ---------- */

async function avvia() {
  try {
    [sessioni, date] = await Promise.all([getSessioni(), getDateEsame()]);

    preparaFinestra();
    disegna();

    elScheletro.remove();
    elSessioni.hidden = false;
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia();
});
