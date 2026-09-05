// Associa ogni materia a un'icona Phosphor (https://phosphoricons.com).
// Le icone sono monocromatiche: il colore lo decide il contesto, non la materia.
// Per aggiungere una materia basta una riga qui sotto; quelle non elencate
// usano l'icona predefinita.
const ICONE = {
  'Farmacologia 2': 'ph-pill',
  Gastroenterologia: 'ph-fork-knife',
  'Malattie Infettive': 'ph-virus',
  'Anatomia Patologica': 'ph-microscope',
  'Organi di Senso': 'ph-eye',
};

const ICONA_PREDEFINITA = 'ph-books';
const ICONA_TUTTE = 'ph-squares-four';

export function iconaPerMateria(materia) {
  if (!materia) return ICONA_TUTTE;
  return ICONE[materia] || ICONA_PREDEFINITA;
}
