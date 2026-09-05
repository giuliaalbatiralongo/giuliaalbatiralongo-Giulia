import { inserisciCaso } from './db.js?v=13';
import { proteggiPagina } from './auth.js?v=8';

let profiloCorrente = null;

const form = document.getElementById('form-caso');
const elEsito = document.getElementById('esito');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dati = new FormData(form);
  const argomento = dati.get('argomento');

  const nuovoCaso = {
    materia: dati.get('materia'),
    argomento: argomento ? argomento.trim() || null : null,
    vignetta: dati.get('vignetta'),
    domanda: dati.get('domanda'),
    opzione_a: dati.get('opzione_a'),
    opzione_b: dati.get('opzione_b'),
    opzione_c: dati.get('opzione_c'),
    opzione_d: dati.get('opzione_d'),
    risposta_corretta: dati.get('corretta'),
    spiegazione: dati.get('spiegazione'),
  };

  elEsito.className = 'esito-form attesa';
  elEsito.textContent = 'Salvataggio in corso';

  const salvato = await inserisciCaso(nuovoCaso);

  if (salvato) {
    elEsito.className = 'esito-form ok';
    elEsito.innerHTML =
      profiloCorrente && profiloCorrente.ruolo === 'admin'
        ? '<i class="ph-fill ph-check-circle" aria-hidden="true"></i> Caso pubblicato. Lo trovi nel quiz e nei casi.'
        : '<i class="ph-fill ph-check-circle" aria-hidden="true"></i> Proposta inviata. Comparirà nel quiz una volta approvata.';
    form.reset();
  } else {
    elEsito.className = 'esito-form ko';
    elEsito.innerHTML =
      '<i class="ph-fill ph-x-circle" aria-hidden="true"></i> Non sono riuscita a salvare il caso. Riprova.';
  }
});

proteggiPagina().then((profilo) => {
  profiloCorrente = profilo;
});
