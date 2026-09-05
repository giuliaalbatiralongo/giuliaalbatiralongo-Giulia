import { caricaMateriale } from './db.js?v=8';
import { proteggiPagina } from './auth.js?v=4';

const form = document.getElementById('form-materiale');
const elEsito = document.getElementById('esito');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dati = new FormData(form);
  const file = dati.get('file');
  const argomento = dati.get('argomento');

  const metadati = {
    tipo: dati.get('tipo'),
    materia: dati.get('materia'),
    argomento: argomento ? argomento.trim() || null : null,
    titolo: dati.get('titolo'),
  };

  elEsito.className = 'esito-form attesa';
  elEsito.textContent = 'Caricamento in corso';

  const salvato = await caricaMateriale(file, metadati);

  if (salvato) {
    elEsito.className = 'esito-form ok';
    elEsito.innerHTML =
      '<i class="ph-fill ph-check-circle" aria-hidden="true"></i> Materiale caricato. Lo trovi nella pagina Materiali.';
    form.reset();
  } else {
    elEsito.className = 'esito-form ko';
    elEsito.innerHTML =
      '<i class="ph-fill ph-x-circle" aria-hidden="true"></i> Non sono riuscita a caricare il materiale. Riprova.';
  }
});

proteggiPagina();
