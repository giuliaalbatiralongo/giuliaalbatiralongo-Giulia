// Associa ogni materia a un'emoji e a una classe colore per le "icone" nell'interfaccia.
// Per aggiungere una nuova materia con la sua icona, aggiungi una riga qui sotto:
// le materie non presenti in questa lista usano l'icona predefinita.
const ICONE = {
  'Farmacologia 2': { emoji: '💊', classe: 'icona-rosa' },
  Gastroenterologia: { emoji: '🍽️', classe: 'icona-pesca' },
  'Malattie Infettive': { emoji: '🦠', classe: 'icona-verde' },
  'Anatomia Patologica': { emoji: '🔬', classe: 'icona-blu' },
  'Organi di Senso': { emoji: '👁️', classe: 'icona-lilla' },
};

const ICONA_PREDEFINITA = { emoji: '📚', classe: 'icona-neutra' };
const ICONA_TUTTE = { emoji: '🩺', classe: 'icona-primario' };

export function iconaPerMateria(materia) {
  if (!materia) return ICONA_TUTTE;
  return ICONE[materia] || ICONA_PREDEFINITA;
}
