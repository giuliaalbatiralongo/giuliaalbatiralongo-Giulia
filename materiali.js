import { getMateriali } from './db.js?v=7';
import { iconaPerMateria } from './materie.js?v=3';
import { TIPI_MATERIALE, tipoPerChiave } from './tipi.js?v=1';

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

function creaVoceMateriale(materiale) {
  const li = document.createElement('li');

  const blocco = document.createElement('div');
  blocco.className = 'elenco-blocco';

  const titolo = document.createElement('div');
  titolo.className = 'elenco-testo';
  titolo.textContent = materiale.titolo;
  blocco.appendChild(titolo);

  if (materiale.argomento) {
    const meta = document.createElement('div');
    meta.className = 'elenco-meta';
    meta.textContent = materiale.argomento;
    blocco.appendChild(meta);
  }

  li.appendChild(blocco);

  const link = document.createElement('a');
  link.href = materiale.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'link-testo';
  link.appendChild(document.createTextNode('Apri PDF'));

  const icona = document.createElement('i');
  icona.className = 'ph ph-arrow-up-right';
  icona.setAttribute('aria-hidden', 'true');
  link.appendChild(icona);

  li.appendChild(link);

  return li;
}

function creaGruppoMateria(nome, materialiMateria) {
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
  materialiMateria.forEach((m) => ul.appendChild(creaVoceMateriale(m)));
  div.appendChild(ul);

  return div;
}

function mostraCategoria(materiali) {
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
      creaGruppoMateria(nome, diQuestoTipo.filter((m) => m.materia === nome))
    );
  });
}

/* ---------- Avvio ---------- */

async function avvia() {
  try {
    const materiali = await getMateriali();
    elScheletro.remove();

    if (tipoScelto) {
      mostraCategoria(materiali);
    } else {
      mostraIndice(materiali);
    }
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

avvia();
