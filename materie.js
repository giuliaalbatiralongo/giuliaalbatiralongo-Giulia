// Associa ogni materia a un'icona Phosphor e a una classe colore.
// Per aggiungere una nuova materia con la sua icona, aggiungi una riga qui sotto:
// le materie non presenti in questa lista usano l'icona predefinita.
// Nomi icone: https://phosphoricons.com
const ICONE = {
  'Farmacologia 2': { icona: 'ph-pill', classe: 'icona-rosa' },
  Gastroenterologia: { icona: 'ph-fork-knife', classe: 'icona-pesca' },
  'Malattie Infettive': { icona: 'ph-virus', classe: 'icona-verde' },
  'Anatomia Patologica': { icona: 'ph-microscope', classe: 'icona-blu' },
  'Organi di Senso': { icona: 'ph-eye', classe: 'icona-lilla' },
};

const ICONA_PREDEFINITA = { icona: 'ph-books', classe: 'icona-neutra' };
const ICONA_TUTTE = { icona: 'ph-squares-four', classe: 'icona-primario' };

export function iconaPerMateria(materia) {
  if (!materia) return ICONA_TUTTE;
  return ICONE[materia] || ICONA_PREDEFINITA;
}

// Crea l'elemento <i> dell'icona, con il badge colorato attorno.
export function creaIconaMateria(materia, piccola = false) {
  const { icona, classe } = iconaPerMateria(materia);
  const span = document.createElement('span');
  span.className = `materia-icona ${classe}${piccola ? ' piccola' : ''}`;
  const i = document.createElement('i');
  i.className = `ph ${icona}`;
  i.setAttribute('aria-hidden', 'true');
  span.appendChild(i);
  return span;
}
