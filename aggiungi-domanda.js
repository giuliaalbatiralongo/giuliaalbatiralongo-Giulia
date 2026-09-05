import { inserisciDomandaEsame } from './db.js?v=15';
import { proteggiPagina } from './auth.js?v=9';

const form = document.getElementById('form-domanda');
const elEsito = document.getElementById('esito');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dati = new FormData(form);
  const argomento = dati.get('argomento');
  const nota = dati.get('note');

  const nuovaDomanda = {
    materia: dati.get('materia'),
    argomento: argomento ? argomento.trim() || null : null,
    domanda: dati.get('domanda'),
    // La nota iniziale diventa la prima nota della domanda:
    // le note ora sono righe a se stanti, piu' di una per domanda.
    nota: nota ? nota.trim() || null : null,
    volte: 1,
  };

  elEsito.className = 'esito-form attesa';
  elEsito.textContent = 'Salvataggio in corso';

  const salvato = await inserisciDomandaEsame(nuovaDomanda);

  if (salvato) {
    elEsito.className = 'esito-form ok';
    elEsito.innerHTML =
      '<i class="ph-fill ph-check-circle" aria-hidden="true"></i> Domanda salvata. La trovi nell elenco per materia.';
    form.reset();
  } else {
    elEsito.className = 'esito-form ko';
    elEsito.innerHTML =
      '<i class="ph-fill ph-x-circle" aria-hidden="true"></i> Non sono riuscita a salvare la domanda. Riprova.';
  }
});

proteggiPagina();
