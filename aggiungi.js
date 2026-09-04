import { inserisciCaso } from './db.js?v=3';

const form = document.getElementById('form-caso');
const elEsito = document.getElementById('esito-salvataggio');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datiForm = new FormData(form);
  const nuovoCaso = {
    materia: datiForm.get('materia'),
    vignetta: datiForm.get('vignetta'),
    domanda: datiForm.get('domanda'),
    opzione_a: datiForm.get('opzione_a'),
    opzione_b: datiForm.get('opzione_b'),
    opzione_c: datiForm.get('opzione_c'),
    opzione_d: datiForm.get('opzione_d'),
    risposta_corretta: datiForm.get('corretta'),
    spiegazione: datiForm.get('spiegazione'),
    stato: 'nuovo',
  };

  const salvato = await inserisciCaso(nuovoCaso);

  if (salvato) {
    elEsito.textContent = '✅ Caso salvato! Lo trovi nella vista "Ripassa" e in "I miei casi".';
    elEsito.className = 'successo';
    form.reset();
  } else {
    elEsito.textContent = '❌ Non sono riuscita a salvare il caso. Riprova.';
    elEsito.className = 'errore';
  }
});
