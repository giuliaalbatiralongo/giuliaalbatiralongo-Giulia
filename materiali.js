import { getMateriali } from './db.js?v=6';
import { iconaPerMateria } from './materie.js?v=3';

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

async function mostraMateriali() {
  const elScheletro = document.getElementById('scheletro');
  const contenitore = document.getElementById('materiali');

  try {
    const materiali = await getMateriali();

    if (materiali.length === 0) {
      elScheletro.innerHTML = `
        <div class="stato-vuoto">
          <i class="ph ph-file-dashed" aria-hidden="true"></i>
          <p>Nessun materiale caricato finora.</p>
          <a class="btn" href="carica-materiale.html"><i class="ph ph-upload-simple" aria-hidden="true"></i> Carica il primo PDF</a>
        </div>
      `;
      return;
    }

    elScheletro.remove();

    const materie = [...new Set(materiali.map((m) => m.materia))].sort();
    materie.forEach((nome) => {
      contenitore.appendChild(creaGruppoMateria(nome, materiali.filter((m) => m.materia === nome)));
    });
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

mostraMateriali();
