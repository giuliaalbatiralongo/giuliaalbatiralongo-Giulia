# Piano d'attacco

Le sette idee scelte da Giulia, messe in ordine di lavoro.
Le idee complete e la ricerca stanno in `IDEE.md`. Le decisioni
gia' prese stanno in `APPUNTI.md`.

Aggiornato il 5 settembre 2026.

---

## Come e' ordinato

Non per importanza: per **dipendenze e attrito**. Prima quello che non
richiede codice, poi quello che sblocca il resto, poi il resto.

Ogni voce dice quanto e' grande, non quando sara' pronta: le stime a
calendario su un progetto fatto a pezzi si rivelano sempre sbagliate.

---

## Passo 1. Perche' le risposte sbagliate sono sbagliate

**Nessun codice.** E' l'unica delle sette che non tocca il programma.

Oggi un caso ha una spiegazione sola, che dice perche' la risposta giusta
e' giusta. UWorld spiega anche perche' le altre tre non lo sono, ed e'
meta' del suo valore: e' li' che si capisce la differenza fra due cose
che sembravano uguali.

Serve decidere una cosa sola: se le spiegazioni delle risposte sbagliate
stanno in campi separati (uno per opzione) oppure dentro la spiegazione
unica, scritte a mano.

- **Campi separati:** l'interfaccia puo' mostrarle accanto all'opzione che
  hai scelto. Richiede una modifica al database e ai casi gia' scritti.
- **Dentro la spiegazione:** zero lavoro tecnico, ma la spiegazione
  diventa lunga e uguale per tutti.

Consiglio i campi separati, perche' lo scopo e' mostrare **la tua**
risposta sbagliata, non tutte.

**Grandezza:** piccola per il codice, grande per il contenuto. I casi
gia' scritti vanno ripassati uno per uno.

---

## Passo 2. Segnalare un caso con un errore

**Sblocca il passo 1.** Riscrivendo le spiegazioni di decine di casi
salteranno fuori errori, e serve un modo per segnalarli senza scrivere
in chat.

Un pulsante sul caso apre un campo, la segnalazione finisce nella coda di
Revisione insieme alle proposte. Chi ha scritto il caso lo corregge.

Da decidere: se la segnalazione nasconde il caso finche' non e' risolta
(prudente ma svuota il quiz) o se lo lascia in circolo con un avviso.

**Grandezza:** piccola. Una tabella, un pulsante, una sezione in Revisione.

---

## Passo 3. Rivedere gli errori

Una lista dei casi sbagliati piu' di recente, da cui si puo' far partire
una sessione mirata.

I dati ci sono gia' tutti: la tabella delle risposte tiene ogni singola
risposta con la data. Manca solo la pagina.

Attenzione a una cosa: il ripasso a intervalli **gia' ripropone** i casi
sbagliati. Questa lista serve a un bisogno diverso, cioe' "voglio
rivedere adesso quello che ho sbagliato ieri", non a sostituire la coda.
Se diventa una seconda coda che compete con la prima, peggiora le cose.

**Grandezza:** piccola.

---

## Passo 4. Cercare

Con dieci casi non serve. Con duecento, piu' le domande d'esame e i
materiali, serve una ricerca che attraversi tutto.

Va fatta **dopo** i passi 1 e 3, perche' le spiegazioni lunghe e la lista
degli errori cambiano cosa vale la pena cercare.

Due strade:
- **Filtro sul testo** che gia' arriva al browser: si scrive in un'ora,
  funziona finche' i casi stanno in memoria, cioe' fino a qualche
  centinaio.
- **Ricerca sul database**, con l'indice testuale di Postgres: regge
  qualunque numero, gestisce le parole troncate e gli accenti, ma e'
  mezza giornata di lavoro.

Consiglio di partire dal filtro e passare all'indice quando i casi
superano il migliaio. Non prima: sarebbe lavoro speso su un problema che
non esiste ancora.

**Grandezza:** piccola oggi, media dopo.

---

## Passo 5. Storico del tempo giorno per giorno

Le Statistiche mostrano gia' quattordici giorni e i totali. Manca la
vista lunga: mesi, e il confronto fra periodi.

Va anche completato il conteggio sui **Materiali**, che il database
prevede ma nessuna pagina registra ancora.

**Grandezza:** piccola.

---

## Passo 6. Esportare le domande d'esame in PDF

Per ripassare senza schermo il giorno prima.

Qui c'e' una scelta tecnica vera:

- **Stampa del browser**, con un foglio di stile pensato per la carta.
  Nessuna libreria, funziona ovunque, e chi vuole il PDF usa "Stampa su
  PDF". Poco appariscente, ma robusto.
- **Libreria di generazione PDF**, che da' controllo pieno sull'impaginato
  ma aggiunge parecchio peso da scaricare.

Consiglio la stampa del browser. Il risultato e' lo stesso e non
introduciamo una dipendenza per una funzione che si usa tre volte
all'anno.

**Grandezza:** piccola.

---

## Passo 7. Immagini nei casi clinici

Radiografie, elettrocardiogrammi, vetrini. E' l'unica delle sette che e'
davvero grande, ed e' l'ultima per questo.

Cosa serve, in ordine:

1. **Dove stanno.** L'archivio privato esiste gia' e sa fare i link
   firmati: le immagini possono starci dentro come i PDF.
2. **Quanto pesano.** Una radiografia esce dal reparto a diversi mega. Va
   ridimensionata nel browser prima di caricarla, altrimenti si consuma
   lo spazio gratuito in poche decine di immagini e ogni caso diventa
   lento da aprire. Sui piani gratuiti di Supabase lo spazio e' dell'ordine
   del gigabyte: da verificare al momento di partire.
3. **Dove si vedono.** Nella vignetta, prima della domanda. E vanno
   ingrandite: su un vetrino a dimensione di card non si vede niente.
4. **Il diritto di usarle.** Un'immagine presa da un libro o da una
   cartella clinica non si mette in un'app condivisa. Servono immagini
   proprie, o di banche a licenza libera, e va deciso prima di
   raccoglierne cento.

Il punto 4 non e' tecnico ed e' quello che puo' fermare tutto: conviene
scioglierlo prima di scrivere una riga.

**Grandezza:** grande.

---

## Fuori da queste sette, ma gia' fatto

- **Calendario** degli esami e degli appelli, con conto alla rovescia.
  Costruito il 5 settembre 2026, gia' predisposto per essere condiviso
  fra studenti dello stesso anno.

## Fuori da queste sette, e ancora da progettare

Le cose che Giulia ha descritto come visione futura:

- **"Hai bisogno di aiuto a organizzare la sessione? Chiedi a un collega
  che ci e' gia' passato."** Serve capire chi sono i colleghi, come si
  chiede, e cosa vede chi risponde.
- **Organizzare la sessione e lo studio**, anno per anno, per arrivare
  preparati alla sessione.

Il calendario e' il primo pezzo di entrambe: le date condivise sono la
base su cui si appoggia il resto.
