import { getMateriali, linkMateriali, linkMateriale, sbloccaMateriale } from './db.js?v=15';
import { iconaPerMateria } from './materie.js?v=3';
import { TIPI_MATERIALE, tipoPerChiave } from './tipi.js?v=1';
import { proteggiPagina } from './auth.js?v=9';

const parametri = new URLSearchParams(window.location.search);
const tipoScelto = parametri.get('tipo');

const elScheletro = document.getElementById('scheletro');
const elContenuto = document.getElementById('contenuto-materiali');
const elTitolo = document.getElementById('titolo');
const elSottotitolo = document.getElementById('sottotitolo');
const elAzioni = document.getElementById('azioni-testata');

/* ---------- Indice delle categorie ---------- */

function creaCardTipo(tipo, quanti) {
  const a = document.createElement('a');
  a.className = 'materia-card';
  a.href = `materiali.html?tipo=${encodeURIComponent(tipo.chiave)}`;

  const testata = document.createElement('div');
  testata.className = 'materia-testata';

  const badge = document.createElement('span');
  badge.className = 'materia-icona';
  const icona = document.createElement('i');
  icona.className = `ph ${tipo.icona}`;
  icona.setAttribute('aria-hidden', 'true');
  badge.appendChild(icona);
  testata.appendChild(badge);

  const testo = document.createElement('div');
  const titolo = document.createElement('div');
  titolo.className = 'materia-nome';
  titolo.textContent = tipo.etichetta;
  testo.appendChild(titolo);

  const conteggio = document.createElement('div');
  conteggio.className = 'materia-conteggio';
  conteggio.textContent =
    quanti === 0 ? 'nessun documento' : `${quanti} ${quanti === 1 ? 'documento' : 'documenti'}`;
  testo.appendChild(conteggio);

  testata.appendChild(testo);
  a.appendChild(testata);

  const descrizione = document.createElement('p');
  descrizione.className = 'materia-descrizione';
  descrizione.textContent = tipo.descrizione;
  a.appendChild(descrizione);

  return a;
}

function mostraIndice(materiali) {
  elAzioni.innerHTML =
    '<a href="carica-materiale.html" class="btn"><i class="ph ph-upload-simple" aria-hidden="true"></i> Carica materiale</a>';

  const griglia = document.createElement('div');
  griglia.className = 'materie-grid';

  TIPI_MATERIALE.forEach((tipo) => {
    const quanti = materiali.filter((m) => (m.tipo || 'altro') === tipo.chiave).length;
    griglia.appendChild(creaCardTipo(tipo, quanti));
  });

  elContenuto.appendChild(griglia);
}

/* ---------- Dettaglio di una categoria ---------- */

function formattaPeso(byte) {
  if (!byte) return null;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function formattaData(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* Riga di dettaglio sotto al titolo: chi l'ha caricato, quando, quanto pesa. */
function creaMeta(materiale) {
  const pezzi = [];
  if (materiale.argomento) pezzi.push(materiale.argomento);
  pezzi.push(materiale.mio ? 'caricato da te' : `caricato da ${materiale.autoreNome}`);

  const data = formattaData(materiale.created_at);
  if (data) pezzi.push(data);

  const peso = formattaPeso(materiale.dimensione);
  if (peso) pezzi.push(peso);

  const meta = document.createElement('div');
  meta.className = 'elenco-meta';
  meta.textContent = pezzi.join(' \u00b7 ');
  return meta;
}

function creaLinkApri(indirizzo) {
  const link = document.createElement('a');
  link.href = indirizzo;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'link-testo';
  link.appendChild(document.createTextNode('Apri PDF'));

  const icona = document.createElement('i');
  icona.className = 'ph ph-arrow-up-right';
  icona.setAttribute('aria-hidden', 'true');
  link.appendChild(icona);

  return link;
}

/* Documento protetto: al posto del link c'e' un campo per la chiave.
   La verifica avviene sul server, qui non c'e' nulla da indovinare. */
function creaSblocco(materiale, alSblocco) {
  const blocco = document.createElement('div');
  blocco.className = 'sblocco';

  const campo = document.createElement('input');
  campo.type = 'text';
  campo.className = 'sblocco-campo';
  campo.setAttribute('aria-label', `Chiave di accesso per ${materiale.titolo}`);
  campo.autocomplete = 'off';
  campo.spellcheck = false;

  const bottone = document.createElement('button');
  bottone.type = 'button';
  bottone.className = 'btn btn-neutro btn-piccolo';
  bottone.innerHTML = '<i class="ph ph-lock-key-open" aria-hidden="true"></i> Sblocca';

  const esito = document.createElement('span');
  esito.className = 'esito-form';

  async function prova() {
    if (!campo.value.trim()) return;
    bottone.disabled = true;
    esito.className = 'esito-form attesa';
    esito.textContent = 'Verifica in corso';

    const risultato = await sbloccaMateriale(materiale.id, campo.value.trim());

    if (!risultato.ok) {
      esito.className = 'esito-form ko';
      esito.textContent = risultato.errore || 'Chiave non corretta.';
      bottone.disabled = false;
      campo.select();
      return;
    }

    const indirizzo = await linkMateriale(materiale.percorso);
    if (!indirizzo) {
      esito.className = 'esito-form ko';
      esito.textContent = 'Chiave giusta, ma non riesco ad aprire il file.';
      bottone.disabled = false;
      return;
    }
    alSblocco(indirizzo);
  }

  bottone.addEventListener('click', prova);
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      prova();
    }
  });

  blocco.appendChild(campo);
  blocco.appendChild(bottone);
  blocco.appendChild(esito);
  return blocco;
}

function creaVoceMateriale(materiale, indirizzi) {
  const li = document.createElement('li');

  const blocco = document.createElement('div');
  blocco.className = 'elenco-blocco';

  const titolo = document.createElement('div');
  titolo.className = 'elenco-testo';

  if (materiale.ha_chiave) {
    const lucchetto = document.createElement('i');
    lucchetto.className = materiale.sbloccato ? 'ph ph-lock-key-open' : 'ph ph-lock-key';
    lucchetto.setAttribute('aria-hidden', 'true');
    titolo.appendChild(lucchetto);
    titolo.appendChild(document.createTextNode(' '));
  }

  titolo.appendChild(document.createTextNode(materiale.titolo));
  blocco.appendChild(titolo);
  blocco.appendChild(creaMeta(materiale));

  li.appendChild(blocco);

  const indirizzo = indirizzi.get(materiale.percorso);

  if (materiale.sbloccato && indirizzo) {
    li.appendChild(creaLinkApri(indirizzo));
  } else if (materiale.sbloccato) {
    const avviso = document.createElement('span');
    avviso.className = 'elenco-meta';
    avviso.textContent = 'File non disponibile';
    li.appendChild(avviso);
  } else {
    li.appendChild(
      creaSblocco(materiale, (nuovoIndirizzo) => {
        li.lastChild.replaceWith(creaLinkApri(nuovoIndirizzo));
        const icona = titolo.querySelector('i');
        if (icona) icona.className = 'ph ph-lock-key-open';
      })
    );
  }

  return li;
}

function creaGruppoMateria(nome, materialiMateria, indirizzi) {
  const div = document.createElement('div');
  div.className = 'gruppo-materia';

  const testata = document.createElement('div');
  testata.className = 'gruppo-materia-testata';

  const icona = document.createElement('i');
  icona.className = `ph ${iconaPerMateria(nome)}`;
  icona.setAttribute('aria-hidden', 'true');
  testata.appendChild(icona);

  const h3 = document.createElement('h3');
  h3.textContent = nome;
  testata.appendChild(h3);

  div.appendChild(testata);

  const ul = document.createElement('ul');
  ul.className = 'elenco';
  materialiMateria.forEach((m) => ul.appendChild(creaVoceMateriale(m, indirizzi)));
  div.appendChild(ul);

  return div;
}

function mostraCategoria(materiali, indirizzi) {
  const tipo = tipoPerChiave(tipoScelto);
  const diQuestoTipo = materiali.filter((m) => (m.tipo || 'altro') === tipo.chiave);

  elTitolo.textContent = tipo.etichetta;
  elSottotitolo.textContent = tipo.descrizione;
  elAzioni.innerHTML =
    '<a href="materiali.html" class="link-testo"><i class="ph ph-arrow-left" aria-hidden="true"></i> Tutte le categorie</a>';

  if (diQuestoTipo.length === 0) {
    elContenuto.innerHTML = `
      <div class="stato-vuoto">
        <i class="ph ph-file-dashed" aria-hidden="true"></i>
        <p>Nessun documento in questa categoria.</p>
        <a class="btn" href="carica-materiale.html"><i class="ph ph-upload-simple" aria-hidden="true"></i> Carica un PDF</a>
      </div>
    `;
    return;
  }

  const materie = [...new Set(diQuestoTipo.map((m) => m.materia))].sort();
  materie.forEach((nome) => {
    elContenuto.appendChild(
      creaGruppoMateria(nome, diQuestoTipo.filter((m) => m.materia === nome), indirizzi)
    );
  });
}

/* ---------- Avvio ---------- */

async function avvia() {
  try {
    const materiali = await getMateriali();
    elScheletro.remove();

    if (!tipoScelto) {
      mostraIndice(materiali);
      return;
    }

    // Un link firmato solo per cio' che questa persona puo' gia' aprire:
    // per i documenti ancora chiusi il link arriva dopo la chiave.
    const indirizzi = await linkMateriali(
      materiali.filter((m) => m.sbloccato).map((m) => m.percorso)
    );

    mostraCategoria(materiali, indirizzi);
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia();
});
