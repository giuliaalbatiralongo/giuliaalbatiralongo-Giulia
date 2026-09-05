import { getMioInteresse, lasciaInteresse, ritiraInteresse } from './db.js?v=21';
import { proteggiPagina } from './auth.js?v=10';

const elScheletro = document.getElementById('scheletro');
const elServizi = document.getElementById('servizi');

const SERVIZI = [
  {
    chiave: 'piani_avanzati',
    nome: 'Piani di studio avanzati',
    icona: 'ph-path',
    descrizione:
      'Un piano costruito sul programma vero della materia, non solo sul numero di lezioni: ' +
      'quali argomenti pesano di piu, in che ordine affrontarli, cosa si puo saltare.',
    dettagli: [
      'Costruito sul programma del tuo corso',
      'Ordine degli argomenti, non solo la quantita',
      'Rivisto se resti indietro',
    ],
    azione: 'Mi interesserebbe',
  },
  {
    chiave: 'consulenza',
    nome: 'Consulenza privata',
    icona: 'ph-chats-circle',
    descrizione:
      'Un incontro con chi quell esame lo ha gia dato: come e andata, cosa ha chiesto la ' +
      'commissione, cosa avrebbe fatto diversamente. Uno a uno, non un corso.',
    dettagli: [
      'Con chi ha sostenuto quell esame',
      'Uno a uno, su appuntamento',
      'Un incontro, non un pacchetto',
    ],
    azione: 'Prenota quando sara attiva',
  },
];

let interessi = [];

function haInteresse(chiave) {
  return interessi.some((i) => i.servizio === chiave);
}

function creaCard(servizio) {
  const card = document.createElement('article');
  card.className = 'servizio-card';

  const testa = document.createElement('div');
  testa.className = 'servizio-testa';

  const badge = document.createElement('span');
  badge.className = 'materia-icona';
  const icona = document.createElement('i');
  icona.className = `ph ${servizio.icona}`;
  icona.setAttribute('aria-hidden', 'true');
  badge.appendChild(icona);
  testa.appendChild(badge);

  const nome = document.createElement('h2');
  nome.className = 'servizio-nome';
  nome.textContent = servizio.nome;
  testa.appendChild(nome);

  card.appendChild(testa);

  const stato = document.createElement('p');
  stato.className = 'servizio-stato';
  stato.textContent = 'Non ancora attivo';
  card.appendChild(stato);

  const descrizione = document.createElement('p');
  descrizione.className = 'servizio-descrizione';
  descrizione.textContent = servizio.descrizione;
  card.appendChild(descrizione);

  const elenco = document.createElement('ul');
  elenco.className = 'servizio-elenco';
  servizio.dettagli.forEach((d) => {
    const li = document.createElement('li');
    li.textContent = d;
    elenco.appendChild(li);
  });
  card.appendChild(elenco);

  const fondo = document.createElement('div');
  fondo.className = 'servizio-fondo';

  const esito = document.createElement('span');
  esito.className = 'esito-form';

  function disegnaFondo() {
    fondo.innerHTML = '';

    if (haInteresse(servizio.chiave)) {
      const segnato = document.createElement('p');
      segnato.className = 'servizio-segnato';
      segnato.innerHTML =
        '<i class="ph-fill ph-check-circle" aria-hidden="true"></i> Hai detto che ti interessa.';
      fondo.appendChild(segnato);

      const ritira = document.createElement('button');
      ritira.type = 'button';
      ritira.className = 'link-bottone';
      ritira.textContent = 'Ritira';
      ritira.addEventListener('click', async () => {
        ritira.disabled = true;
        if (await ritiraInteresse(servizio.chiave)) {
          interessi = interessi.filter((i) => i.servizio !== servizio.chiave);
          disegnaFondo();
        } else {
          ritira.disabled = false;
        }
      });
      fondo.appendChild(ritira);
      return;
    }

    const campo = document.createElement('textarea');
    campo.rows = 2;
    campo.className = 'servizio-nota';
    campo.placeholder = 'Cosa ti servirebbe, se vuoi dirlo (facoltativo)';
    fondo.appendChild(campo);

    const bottone = document.createElement('button');
    bottone.type = 'button';
    bottone.className = 'btn';
    bottone.innerHTML = `<i class="ph ph-hand-waving" aria-hidden="true"></i> ${servizio.azione}`;
    bottone.addEventListener('click', async () => {
      bottone.disabled = true;
      esito.className = 'esito-form attesa';
      esito.textContent = 'Salvataggio';

      if (await lasciaInteresse(servizio.chiave, campo.value.trim())) {
        interessi.push({ servizio: servizio.chiave, nota: campo.value.trim() || null });
        esito.textContent = '';
        disegnaFondo();
      } else {
        esito.className = 'esito-form ko';
        esito.textContent = 'Non sono riuscita a salvare.';
        bottone.disabled = false;
      }
    });

    fondo.appendChild(bottone);
    fondo.appendChild(esito);
  }

  disegnaFondo();
  card.appendChild(fondo);

  return card;
}

async function avvia() {
  try {
    interessi = await getMioInteresse();

    SERVIZI.forEach((s) => elServizi.appendChild(creaCard(s)));

    elScheletro.remove();
    elServizi.hidden = false;
  } catch (errore) {
    elScheletro.innerHTML = `<p class="messaggio-errore"><i class="ph ph-warning-circle" aria-hidden="true"></i> Errore nel caricamento: ${errore.message}</p>`;
    console.error(errore);
  }
}

proteggiPagina().then((profilo) => {
  if (profilo) avvia();
});
