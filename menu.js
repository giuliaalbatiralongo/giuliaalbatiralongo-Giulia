/* I gruppi del menu di fianco.

   Sta qui e non dentro auth.js per un motivo pratico: nei collaudi
   auth.js viene sostituito da un finto, e una cosa che sta li' dentro
   non verrebbe mai eseguita davvero. Quello che si collauda deve essere
   il codice vero. */

/* ---------- I gruppi del menu su schermo stretto ----------

   Sotto gli 820px la barra laterale diventa una striscia di sole icone
   in orizzontale: li' i gruppi a tendina non hanno senso, e le voci
   devono stare tutte in fila.

   Si aprono da qui e non dal CSS perche' un <details> chiuso il foglio
   di stile non lo riapre: il browser nasconde il contenuto per conto
   suo, e nessuna regola ci arriva. Tornando largo, ognuno riprende lo
   stato che aveva. */
import { preparaAiuto } from './aiuto.js';

/* Il pulsante "Aiuto" in basso a destra. Si attacca da qui perche'
   questo e' l'unico posto che gira su OGNI pagina dopo l'accesso: cosi'
   non serve toccare venti file, e le pagine di accesso e conferma non
   lo prendono, che e' giusto. */
export function preparaGruppiDelMenu() {
  preparaAiuto();

  const stretto = window.matchMedia('(max-width: 820px)');
  const gruppi = [...document.querySelectorAll('.nav-apribile')];
  if (gruppi.length === 0) return;

  function applica() {
    gruppi.forEach((g) => {
      if (stretto.matches) {
        if (g.dataset.eraAperto === undefined) g.dataset.eraAperto = String(g.open);
        g.open = true;
      } else if (g.dataset.eraAperto !== undefined) {
        g.open = g.dataset.eraAperto === 'true';
        delete g.dataset.eraAperto;
      }
    });
  }

  applica();
  stretto.addEventListener('change', applica);
}
