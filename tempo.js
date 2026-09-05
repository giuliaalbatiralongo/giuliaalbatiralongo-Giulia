import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './db.js?v=25';

/* Misura quanto tempo si passa davvero in una sezione.

   Il problema di questi contatori e' che contano anche le ore in cui la
   pagina e' rimasta aperta su una scrivania vuota. Qui il conteggio si
   ferma da solo in due casi: quando la scheda del browser non e' piu' in
   primo piano, e dopo due minuti senza che tu tocchi nulla.

   Il tempo viene mandato al database a pezzetti da mezzo minuto, non
   tutto alla fine: se chiudi il portatile di colpo, perdi al massimo
   trenta secondi invece dell'intera sessione. */

const INVIO_OGNI = 30_000;
const FERMO_DOPO = 120_000;

export function misuraTempo(sezione) {
  let accumulati = 0;
  let ultimoTic = Date.now();
  let ultimaAttivita = Date.now();
  let attivo = true;

  function fermati() {
    if (!attivo) return;
    accumula();
    attivo = false;
  }

  function riparti() {
    if (attivo) return;
    ultimoTic = Date.now();
    ultimaAttivita = Date.now();
    attivo = true;
  }

  function accumula() {
    if (!attivo) return;
    const adesso = Date.now();
    accumulati += adesso - ultimoTic;
    ultimoTic = adesso;
  }

  async function invia(conBeacon = false) {
    accumula();
    const secondi = Math.floor(accumulati / 1000);
    if (secondi < 5) return;

    accumulati -= secondi * 1000;

    if (conBeacon) {
      // Alla chiusura della pagina una richiesta normale verrebbe
      // interrotta a meta'. keepalive dice al browser di consegnarla
      // comunque. sendBeacon non andrebbe bene: non sa mandare
      // l'intestazione di autorizzazione, che qui serve.
      const { data } = await supabase.auth.getSession();
      const gettone = data.session?.access_token;
      if (!gettone) return;

      try {
        await fetch(`${SUPABASE_URL}/rest/v1/rpc/aggiungi_tempo`, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${gettone}`,
          },
          body: JSON.stringify({ p_sezione: sezione, p_secondi: secondi }),
        });
      } catch (errore) {
        /* la pagina sta chiudendo: non c'e' modo di riprovare */
      }
      return;
    }

    const { error } = await supabase.rpc('aggiungi_tempo', {
      p_sezione: sezione,
      p_secondi: secondi,
    });

    // Se non passa, il tempo torna nel salvadanaio e riparte col prossimo invio.
    if (error) {
      accumulati += secondi * 1000;
      console.error('Errore nel salvataggio del tempo:', error);
    }
  }

  function segnalaAttivita() {
    ultimaAttivita = Date.now();
    riparti();
  }

  ['pointerdown', 'keydown', 'wheel', 'scroll'].forEach((evento) => {
    window.addEventListener(evento, segnalaAttivita, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) fermati();
    else segnalaAttivita();
  });

  const battito = setInterval(() => {
    if (attivo && Date.now() - ultimaAttivita > FERMO_DOPO) fermati();
    invia();
  }, INVIO_OGNI);

  // pagehide copre anche il passaggio ad altre pagine su iOS, dove
  // beforeunload non arriva.
  window.addEventListener('pagehide', () => {
    clearInterval(battito);
    fermati();
    invia(true);
  });

  return { fermati, riparti };
}
