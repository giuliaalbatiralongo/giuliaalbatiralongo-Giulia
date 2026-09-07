/* Il campo "Materia", uguale ovunque.

   Prima ogni pagina aveva il suo: un campo di testo libero con accanto
   un elenco di suggerimenti scritto a mano dentro l'HTML. Quell'elenco
   e' rimasto indietro -- conteneva ancora i nomi degli esami finti --
   e soprattutto nessuno garantiva che il nome scritto in un caso
   clinico fosse lo stesso scritto nel libretto.

   Adesso le materie arrivano dal libretto, cioe' dal manifesto. Si
   scelgono da un menu; se serve una materia che nel manifesto non c'e',
   si sceglie "Altro" e la si scrive.

   Il campo di testo resta nel modulo e continua a contenere il valore
   vero: cosi' il codice che legge il modulo non cambia, e se il menu
   non si carica (rete lenta, errore) si puo' comunque scrivere a mano. */

export function preparaSceltaMateria({ input, gruppi, etichettaAltro = 'Altro (la scrivo io)' }) {
  if (!input || !gruppi) return;

  const tutte = gruppi.flatMap((g) => g.materie);
  if (tutte.length === 0) return;

  const menu = document.createElement('select');
  menu.className = 'scelta-materia';
  menu.id = `${input.id}-scelta`;
  menu.setAttribute('aria-label', 'Scegli la materia');

  const vuoto = document.createElement('option');
  vuoto.value = '';
  vuoto.textContent = 'Scegli una materia';
  menu.appendChild(vuoto);

  gruppi.forEach((g) => {
    const box = document.createElement('optgroup');
    box.label = g.etichetta;
    g.materie.forEach((nome) => {
      const o = document.createElement('option');
      o.value = nome;
      o.textContent = nome;
      box.appendChild(o);
    });
    menu.appendChild(box);
  });

  const altro = document.createElement('option');
  altro.value = '__altro__';
  altro.textContent = etichettaAltro;
  menu.appendChild(altro);

  input.parentNode.insertBefore(menu, input);

  function applica() {
    const scritta = menu.value === '__altro__';
    input.hidden = !scritta;
    input.required = scritta;
    if (scritta) {
      input.value = '';
      input.focus();
    } else {
      input.value = menu.value;
    }
  }

  menu.addEventListener('change', applica);

  /* Se il modulo viene riaperto con una materia gia' dentro (una
     modifica), il menu si mette su quella; se e' una che nel libretto
     non c'e', va su "Altro" e la lascia scritta. */
  function allinea() {
    const dentro = input.value.trim();
    if (!dentro) {
      menu.value = '';
      input.hidden = true;
      input.required = false;
      return;
    }
    if (tutte.includes(dentro)) {
      menu.value = dentro;
      input.hidden = true;
      input.required = false;
    } else {
      menu.value = '__altro__';
      input.hidden = false;
      input.required = true;
    }
  }

  allinea();
  return { menu, allinea };
}
