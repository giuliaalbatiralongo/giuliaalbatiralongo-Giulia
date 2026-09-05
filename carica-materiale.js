import { caricaMateriale } from './db.js?v=13';
import { proteggiPagina } from './auth.js?v=8';

const form = document.getElementById('form-materiale');
const elEsito = document.getElementById('esito');
const elNota = document.getElementById('nota-approvazione');
const bottone = form.querySelector('button[type="submit"]');

function messaggio(testo, tipo, icona) {
  elEsito.className = `esito-form ${tipo}`;
  if (icona) {
    elEsito.innerHTML = `<i class="ph-fill ${icona}" aria-hidden="true"></i> ${testo}`;
  } else {
    elEsito.textContent = testo;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dati = new FormData(form);
  const file = dati.get('file');
  const argomento = dati.get('argomento');

  bottone.disabled = true;
  messaggio('Caricamento in corso', 'attesa');

  const risultato = await caricaMateriale(file, {
    tipo: dati.get('tipo'),
    materia: dati.get('materia'),
    argomento: argomento ? argomento.trim() || null : null,
    titolo: dati.get('titolo'),
    chiave: (dati.get('chiave') || '').trim() || null,
  });

  bottone.disabled = false;

  if (!risultato.ok) {
    messaggio(risultato.errore, 'ko', 'ph-x-circle');
    return;
  }

  form.reset();

  if (risultato.pubblicazione === 'pubblicato') {
    messaggio('Materiale caricato. Lo trovi nella pagina Materiali.', 'ok', 'ph-check-circle');
  } else {
    messaggio(
      'Materiale inviato. Sara' + "'" + ' visibile agli altri dopo l' + "'" + 'approvazione.',
      'ok',
      'ph-paper-plane-tilt'
    );
  }
});

proteggiPagina().then((profilo) => {
  // Chi non e' amministratrice deve sapere in anticipo che il documento
  // passa da un'approvazione, non scoprirlo dopo aver caricato.
  if (profilo && profilo.ruolo !== 'admin') elNota.hidden = false;
});
