import { getCasiClinici } from './db.js?v=6';
import { creaIconaMateria } from './materie.js?v=2';

const ETICHETTE_STATO = {
  nuovo: 'nuovo',
  da_ripassare: 'da ripassare',
  consolidato: 'consolidato',
};

function creaVoceCaso(caso) {
  const li = document.createElement('li');

  const testo = document.createElement('span');
  testo.className = 'vignetta-breve';
  testo.textContent = caso.vignetta;
  li.appendChild(testo);

  const pill = document.createElement('span');
  pill.className = `pill pill-${caso.stato}`;
  pill.textContent = ETICHETTE_STATO[caso.stato] || caso.stato;
  li.appendChild(pill);

  return li;
}

function creaGruppoArgomento(nome, casiArgomento) {
  const div = document.createElement('div');
  div.className = 'gruppo-argomento';

  const h4 = document.createElement('h4');
  h4.textContent = nome;
  div.appendChild(h4);

  const ul = document.createElement('ul');
  casiArgomento.forEach((caso) => ul.appendChild(creaVoceCaso(caso)));
  div.appendChild(ul);

  return div;
}

function creaGruppoMateria(nome, casiMateria) {
  const div = document.createElement('div');
  div.className = 'gruppo-materia';

  const header = document.createElement('div');
  header.className = 'gruppo-materia-header';
  header.appendChild(creaIconaMateria(nome, true));

  const h3 = document.createElement('h3');
  h3.textContent = nome;
  header.appendChild(h3);

  div.appendChild(header);

  const argomentiUnici = [...new Set(casiMateria.map((c) => c.argomento || 'Generale'))].sort();
  argomentiUnici.forEach((argomento) => {
    const casiArgomento = casiMateria.filter((c) => (c.argomento || 'Generale') === argomento);
    div.appendChild(creaGruppoArgomento(argomento, casiArgomento));
  });

  return div;
}

async function mostraCasi() {
  const elScheletro = document.getElementById('scheletro-casi');
  const contenitoreEl = document.getElementById('casi');

  try {
    const casi = await getCasiClinici();

    if (casi.length === 0) {
      elScheletro.innerHTML = `
        <div class="stato-vuoto">
          <i class="ph ph-folder-open stato-vuoto-icona" aria-hidden="true"></i>
          <p>Non hai ancora nessun caso salvato.</p>
          <a class="btn-primario" href="aggiungi.html">
            <i class="ph ph-plus" aria-hidden="true"></i> Aggiungi il primo caso
          </a>
        </div>
      `;
      return;
    }

    elScheletro.remove();

    const materieUniche = [...new Set(casi.map((c) => c.materia))].sort();
    materieUniche.forEach((nome) => {
      const casiMateria = casi.filter((c) => c.materia === nome);
      contenitoreEl.appendChild(creaGruppoMateria(nome, casiMateria));
    });
  } catch (errore) {
    elScheletro.innerHTML = `<p class="errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

mostraCasi();
