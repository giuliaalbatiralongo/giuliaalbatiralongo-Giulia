// Categorie del materiale di studio. La chiave e' il valore salvato nella
// colonna "tipo" della tabella materiali: cambiarla richiede una migrazione,
// mentre etichetta, icona e descrizione si possono modificare liberamente.
export const TIPI_MATERIALE = [
  {
    chiave: 'sbobine',
    etichetta: 'Sbobine',
    icona: 'ph-microphone',
    descrizione: 'Trascrizioni delle lezioni',
  },
  {
    chiave: 'dispense',
    etichetta: 'Dispense',
    icona: 'ph-book-open',
    descrizione: 'Materiale didattico dei corsi',
  },
  {
    chiave: 'letteratura',
    etichetta: 'Letteratura scientifica',
    icona: 'ph-flask',
    descrizione: 'Articoli, linee guida, revisioni',
  },
  {
    chiave: 'altro',
    etichetta: 'Altro materiale',
    icona: 'ph-paperclip',
    descrizione: 'Appunti, schemi, tutto il resto',
  },
];

export function tipoPerChiave(chiave) {
  return TIPI_MATERIALE.find((t) => t.chiave === chiave) || TIPI_MATERIALE[3];
}
