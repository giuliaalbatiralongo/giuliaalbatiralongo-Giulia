import { getMateriali } from './db.js?v=6';
import { creaIconaMateria } from './materie.js?v=2';

function creaVoceMateriale(materiale) {
  const li = document.createElement('li');

  const testo = document.createElement('span');
  testo.className = 'vignetta-breve';
  testo.textContent = materiale.titolo + (materiale.argomento ? ` — ${materiale.argomento}` : '');
  li.appendChild(testo);

  const link = document.createElement('a');
  link.href = materiale.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'link-cambia';

  const icona = document.createElement('i');
  icona.className = 'ph ph-arrow-square-out';
  icona.setAttribute('aria-hidden', 'true');
  link.appendChild(document.createTextNode('Apri PDF'));
  link.appendChild(icona);

  li.appendChild(link);

  return li;
}

function creaGruppoMateria(nome, materialiMateria) {
  const div = document.createElement('div');
  div.className = 'gruppo-materia';

  const header = document.createElement('div');
  header.className = 'gruppo-materia-header';
  header.appendChild(creaIconaMateria(nome, true));

  const h3 = document.createElement('h3');
  h3.textContent = nome;
  header.appendChild(h3);

  div.appendChild(header);

  const ul = document.createElement('ul');
  materialiMateria.forEach((m) => ul.appendChild(creaVoceMateriale(m)));
  div.appendChild(ul);

  return div;
}

async function mostraMateriali() {
  const elScheletro = document.getElementById('scheletro-materiali');
  const contenitoreEl = document.getElementById('materiali');

  try {
    const materiali = await getMateriali();

    if (materiali.length === 0) {
      elScheletro.innerHTML = `
        <div class="stato-vuoto">
          <i class="ph ph-file-dashed stato-vuoto-icona" aria-hidden="true"></i>
          <p>Nessun materiale caricato finora.</p>
          <a class="btn-primario" href="carica-materiale.html">
            <i class="ph ph-upload-simple" aria-hidden="true"></i> Carica il primo PDF
          </a>
        </div>
      `;
      return;
    }

    elScheletro.remove();

    const materieUniche = [...new Set(materiali.map((m) => m.materia))].sort();
    materieUniche.forEach((nome) => {
      const materialiMateria = materiali.filter((m) => m.materia === nome);
      contenitoreEl.appendChild(creaGruppoMateria(nome, materialiMateria));
    });
  } catch (errore) {
    elScheletro.innerHTML = `<p class="errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

mostraMateriali();
