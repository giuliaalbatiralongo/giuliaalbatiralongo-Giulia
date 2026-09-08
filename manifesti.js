/* I piani di studio ufficiali, per chi comincia da zero.

   Il Libretto vuoto era il muro: sei anni "da riempire" e 46 esami da
   digitare uno per uno. Nessuno lo fa. Chi apre Akesis la prima volta
   trova un tasto e in un colpo ha tutto il corso davanti.

   Sono dati del manifesto, non inventati e non miei: nomi, anno,
   semestre e crediti stanno scritti nel Manifesto degli Studi che
   l'universita' pubblica. Le note dicono da quali moduli e' composto
   un esame, e vengono da li' anche quelle. Quello che uno studente
   scopre da solo -- che il tal professore fa tre domande, che il tal
   orale e' lungo -- non sta qui: e' roba sua, non del corso.

   Il semestre `null` vuol dire annuale, o a cavallo dei due.

   Per aggiungere un altro corso: un'altra voce in MANIFESTI, con i
   dati presi dal suo manifesto ufficiale. Niente a memoria. */

export const MANIFESTI = [
  {
    chiave: 'medicina-unige',
    corso: 'Medicina e chirurgia',
    universita: 'Università di Genova',
    nome: 'Medicina e chirurgia, Università di Genova',
    fonte: 'Manifesto degli Studi 2026/2027',
    anni: 6,
    esami: [
      // ---- Primo anno ----
      { nome: 'Chimica e propedeutica biochimica', anno: 1, semestre: 1, cfu: 6,
        note: 'Due canali, A e B.' },
      { nome: 'Fisica medica, biofisica e informatica', anno: 1, semestre: 1, cfu: 6,
        note: 'Due canali, A e B.' },
      { nome: 'La cellula', anno: 1, semestre: 1, cfu: 7,
        note: 'Due canali, A e B.' },
      { nome: 'Anatomia umana', anno: 1, semestre: 2, cfu: 12,
        note: 'Anatomia sistematica (9), anatomia apparato locomotore (2), diagnostica per immagini (1).' },
      { nome: 'Biochimica', anno: 1, semestre: 2, cfu: 11,
        note: 'Biochimica (10), biochimica clinica (1).' },
      { nome: 'I tessuti (istologia ed embriologia)', anno: 1, semestre: 2, cfu: 9,
        note: 'Istologia e embriologia (8), laboratorio (1).' },
      { nome: 'Scienze umane', anno: 1, semestre: 2, cfu: 9,
        note: 'Antropologia, storia della medicina, informatica, inglese 1. Psicologia generale e psicologia clinica si fanno al secondo anno: e un esame solo, a cavallo dei due.' },

      // ---- Secondo anno ----
      { nome: 'Anatomia sistema nervoso e endocrino', anno: 2, semestre: 1, cfu: 8,
        note: 'Anatomia sistema nervoso e endocrino (6), anatomia apparato locomotore (2).' },
      { nome: 'Fisiologia umana 1', anno: 2, semestre: 1, cfu: 11, note: null },
      { nome: 'Primo soccorso', anno: 2, semestre: 1, cfu: 2,
        note: 'Anestesiologia (1), medicina interna (1). Idoneita: nessun voto.' },
      { nome: 'Fisiologia umana 2', anno: 2, semestre: 2, cfu: 12,
        note: 'Fisiologia (10), neurologia (1), informatica bioingegneria (1).' },
      { nome: 'Laboratorio per medico in formazione', anno: 2, semestre: 2, cfu: 1,
        note: 'Idoneita: nessun voto.' },
      { nome: 'Eziologia e patogenesi delle malattie', anno: 2, semestre: null, cfu: 17,
        note: 'A cavallo dei due semestri. Primo: biologia applicata (2), biologia molecolare (2), genetica medica (1). Secondo: patologia generale (9), microbiologia (3).' },

      // ---- Terzo anno ----
      { nome: 'Fisiopatologia generale', anno: 3, semestre: 1, cfu: 8, note: null },
      { nome: 'Semeiotica e metodologia clinica', anno: 3, semestre: 1, cfu: 25, note: null },
      { nome: 'Cardiologia e pneumologia', anno: 3, semestre: 2, cfu: 6, note: null },
      { nome: 'Dermatologia, immunologia clinica e reumatologia', anno: 3, semestre: 2, cfu: 8, note: null },
      { nome: 'Farmacologia I', anno: 3, semestre: 2, cfu: 4, note: null },
      { nome: 'Nefrologia e malattie endocrino metaboliche', anno: 3, semestre: 2, cfu: 5, note: null },

      // ---- Quarto anno ----
      { nome: 'Farmacologia II', anno: 4, semestre: 1, cfu: 6, note: null },
      { nome: 'Malattie infettive e microbiologia clinica', anno: 4, semestre: 1, cfu: 6, note: null },
      { nome: 'Patologia integrata apparato gastroenterico', anno: 4, semestre: 1, cfu: 4, note: null },
      { nome: 'Patologia integrata degli organi di senso', anno: 4, semestre: 1, cfu: 6, note: null },
      { nome: 'Igiene e medicina preventiva', anno: 4, semestre: 2, cfu: 5, note: null },
      { nome: 'Malattie del sangue e oncologia medica', anno: 4, semestre: 2, cfu: 4, note: null },
      { nome: 'Metodologie in medicina', anno: 4, semestre: 2, cfu: 8,
        note: 'Statistica medica, informatica, igiene generale, pedagogia, economia sanitaria.' },
      { nome: 'Radiologia medica', anno: 4, semestre: 2, cfu: 3, note: null },
      { nome: 'Anatomia patologica e correlazioni anatomo-cliniche', anno: 4, semestre: null, cfu: 5,
        note: 'Annuale.' },
      { nome: 'Preparazione tesi', anno: 4, semestre: null, cfu: 4,
        note: 'Prova finale, non un esame con voto.' },

      // ---- Quinto anno ----
      { nome: 'Chirurgia I', anno: 5, semestre: 1, cfu: 8,
        note: 'Urologia, chirurgia plastica.' },
      { nome: 'Medicina legale e medicina del lavoro', anno: 5, semestre: 1, cfu: 6, note: null },
      { nome: 'Neurologia', anno: 5, semestre: 1, cfu: 8, note: null },
      { nome: 'Psichiatria', anno: 5, semestre: 1, cfu: 5, note: null },
      { nome: 'Ginecologia e ostetricia', anno: 5, semestre: 2, cfu: 8, note: null },
      { nome: 'Medicina I', anno: 5, semestre: 2, cfu: 7,
        note: 'Medicina interna, patologia clinica.' },
      { nome: 'Pediatria', anno: 5, semestre: 2, cfu: 10,
        note: 'Pediatria generale, chirurgia pediatrica, genetica medica, neuropsichiatria infantile.' },
      { nome: 'Preparazione tesi (quinto anno)', anno: 5, semestre: null, cfu: 4,
        note: 'Prova finale, non un esame con voto.' },

      // ---- Sesto anno ----
      { nome: 'Chirurgia 2 e malattie apparato locomotore', anno: 6, semestre: 1, cfu: 11, note: null },
      { nome: 'Medicina II', anno: 6, semestre: 1, cfu: 9,
        note: 'Genetica medica, medicina interna (geriatria).' },
      { nome: 'Terapia medica applicata', anno: 6, semestre: 1, cfu: 11, note: null },
      { nome: 'A.P. terapia del dolore e cure palliative', anno: 6, semestre: 2, cfu: 2, note: null },
      { nome: 'Emergenze e traumatologia', anno: 6, semestre: 2, cfu: 8, note: null },
      { nome: 'ADE', anno: 6, semestre: null, cfu: 8,
        note: 'Attivita a scelta dello studente.' },
      { nome: 'Preparazione tesi (sesto anno)', anno: 6, semestre: null, cfu: 10,
        note: 'Prova finale, non un esame con voto.' },
      { nome: 'Tirocinio pratico valutativo esame di stato', anno: 6, semestre: null, cfu: 15,
        note: 'Annuale. Abilitante.' },
      { nome: 'Tirocinio professionalizzante medico-chirurgico', anno: 6, semestre: null, cfu: 15,
        note: 'Annuale.' },
    ],
  },
];

export function manifestoDi(chiave) {
  return MANIFESTI.find((m) => m.chiave === chiave) || null;
}

/* Quanti esami e quanti crediti porta un manifesto. Serve a scriverlo
   sul tasto: "46 esami, 363 crediti" dice cosa sta per succedere
   meglio di qualsiasi spiegazione. */
export function contiManifesto(manifesto) {
  return {
    esami: manifesto.esami.length,
    cfu: manifesto.esami.reduce((s, e) => s + (e.cfu || 0), 0),
  };
}
