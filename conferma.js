import { getSessione, getProfilo, reinviaConferma, leggiErroreDaUrl } from './auth.js?v=10';

const viste = {
  attesa: document.getElementById('vista-attesa'),
  ok: document.getElementById('vista-ok'),
  errore: document.getElementById('vista-errore'),
};
const elEsito = document.getElementById('esito');

function mostraVista(nome) {
  Object.entries(viste).forEach(([chiave, elemento]) => {
    elemento.hidden = chiave !== nome;
  });
}

function messaggio(testo, tipo) {
  elEsito.className = `esito-form ${tipo}`;
  if (tipo === 'ok') {
    elEsito.innerHTML = `<i class="ph-fill ph-check-circle" aria-hidden="true"></i> ${testo}`;
  } else if (tipo === 'ko') {
    elEsito.innerHTML = `<i class="ph-fill ph-x-circle" aria-hidden="true"></i> ${testo}`;
  } else {
    elEsito.textContent = testo;
  }
}

document.getElementById('form-reinvia').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = new FormData(e.target).get('email');

  messaggio('Invio in corso', 'attesa');
  const risultato = await reinviaConferma(email);

  if (risultato.ok) {
    messaggio(
      'Ti ho mandato un nuovo link. Apri l ultima email ricevuta e clicca da lì.',
      'ok'
    );
  } else {
    messaggio(risultato.errore, 'ko');
  }
});

async function avvia() {
  // Supabase segnala i link scaduti mettendo l'errore nell'indirizzo.
  const errore = leggiErroreDaUrl();
  if (errore) {
    document.getElementById('testo-errore').textContent = errore;
    mostraVista('errore');
    return;
  }

  // Il client legge da solo i dati di sessione dall'indirizzo: gli diamo
  // un istante per farlo prima di controllare.
  await new Promise((risolvi) => setTimeout(risolvi, 400));

  const sessione = await getSessione();
  if (!sessione) {
    document.getElementById('testo-errore').textContent =
      'Non ho trovato un accesso valido. Riprova dalla schermata di accesso, oppure chiedi un nuovo link qui sotto.';
    mostraVista('errore');
    return;
  }

  // Ripuliamo l'indirizzo dai dati di sessione, che non devono restare
  // nella cronologia del browser.
  history.replaceState(null, '', window.location.pathname);

  const profilo = await getProfilo();
  const testo = document.getElementById('testo-ok');

  if (profilo) {
    testo.textContent = 'Il tuo profilo è già attivo. Ti porto dentro.';
    setTimeout(() => window.location.replace('index.html'), 1200);
  } else {
    testo.textContent = 'Manca solo il codice di invito per attivare il profilo.';
    setTimeout(() => window.location.replace('login.html?attiva=1'), 1200);
  }

  mostraVista('ok');
}

avvia();
