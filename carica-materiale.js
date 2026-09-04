import { caricaMateriale } from './db.js?v=6';

const form = document.getElementById('form-materiale');
const elEsito = document.getElementById('esito-caricamento');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const datiForm = new FormData(form);
  const file = datiForm.get('file');
  const argomento = datiForm.get('argomento');

  const metadati = {
    materia: datiForm.get('materia'),
    argomento: argomento ? argomento.trim() || null : null,
    titolo: datiForm.get('titolo'),
  };

  elEsito.textContent = 'Caricamento in corso...';
  elEsito.className = 'muted';

  const salvato = await caricaMateriale(file, metadati);

  if (salvato) {
    elEsito.textContent = '✅ Materiale caricato! Lo trovi nella pagina "Materiali".';
    elEsito.className = 'successo';
    form.reset();
  } else {
    elEsito.textContent = '❌ Non sono riuscita a caricare il materiale. Riprova.';
    elEsito.className = 'errore';
  }
});
