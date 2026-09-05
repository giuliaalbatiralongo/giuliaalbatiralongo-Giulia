# Idee per Akesis

Spunti raccolti guardando cosa fanno gli altri, e cosa fanno male.
Non e' un piano di lavoro: e' un menu da cui scegliere.
Le cose gia' decise stanno in `APPUNTI.md`.

Ricerca fatta a settembre 2026.

---

## Cosa c'e' gia' la fuori

**Internazionali (preparazione USMLE).** UWorld e AMBOSS sono i due
riferimenti. UWorld ha piu' domande (3.600 per Step 1, 4.250 per Step 2)
e i confronti in percentile con gli altri studenti. AMBOSS ne ha meno ma
ogni spiegazione rimanda a schede di una libreria medica interna, quindi
dalla domanda si arriva alla teoria senza uscire dall'app. Entrambi si
appoggiano ad Anki per la ripetizione.

**Italiane (preparazione SSM).** TestBuddy dichiara oltre 30.000 quesiti
divisi in 700 microargomenti e simulazioni da 210 minuti come la prova
vera. Peer4Med, Secret SSM e Hypocampus vendono corsi piu' simulatore.
iatroX ha 7.000 domande in italiano con un sistema che ripropone le aree
deboli. CompitoinClasse e' gratuito e senza registrazione.

**Conclusione onesta:** sul numero di domande Akesis non puo' competere e
non deve provarci. Nessuna di queste piattaforme sa cosa chiede il tuo
professore al tuo orale. Akesis si'.

---

## Il vero punto di forza, che gia' esiste

La sezione **Domande esami** e' la cosa che nessuno dei prodotti sopra
ha, perche' nessuno di loro puo' averla: e' memoria collettiva di un
corso di laurea specifico. Chi ha appena fatto l'orale sa cosa e' stato
chiesto, come lo ha chiesto il professore, e cosa voleva sentirsi dire.

Quella e' la cosa da approfondire per prima, non il quiz.

Idee concrete, dalla piu' facile:

- **Chi ha sostenuto l'esame e quando.** Una nota di giugno 2026 vale
  piu' di una del 2023. Basta mostrare la data dell'appello, non quella
  della scrittura.
- **Il professore.** Molti corsi hanno piu' commissioni. Sapere chi
  chiede cosa cambia la preparazione.
- **Segnalare che una domanda non e' piu' attuale**, invece di
  cancellarla: il programma cambia, la memoria storica serve lo stesso.
- **Statistiche per esame:** quante domande raccolte, quante persone
  hanno contribuito, quanto e' aggiornato. Dice se ci si puo' fidare.

---

## La ripetizione: il pezzo tecnicamente piu' importante

Oggi Akesis ha tre stati: nuovo, da ripassare, consolidato. Chi risponde
bene consolida, chi sbaglia torna. E' semplice e funziona, ma non sa
**quando** riproporre un caso.

Lo standard oggi si chiama **FSRS**. Ha sostituito nel 2023 l'algoritmo
del 1987 che Anki usava prima, e produce dal 20 al 30 per cento di
ripassi in meno a parita' di quanto ti ricordi. Invece di un solo numero
per scheda ne tiene tre:

- **Difficolta'**: quanto e' intrinsecamente ostico quel caso. Torna
  gradualmente verso la media quando rispondi bene piu' volte, quindi un
  caso sbagliato una volta non resta marchiato per sempre.
- **Stabilita'**: quanti giorni passano prima che la probabilita' di
  ricordarlo scenda al 90 per cento.
- **Recuperabilita'**: quanto probabilmente te lo ricordi adesso.

Si imposta una **soglia di ritenzione** (per esempio 0,9: voglio
ricordare il 90 per cento di quello che mi viene riproposto) e il sistema
calcola gli intervalli di conseguenza.

**Non serve implementarlo tutto.** Una versione ridotta, che tenga solo
la data del prossimo ripasso e la allunghi ogni volta che rispondi bene
(1 giorno, 3, 7, 16, 35), darebbe gia' quasi tutto il beneficio con una
frazione del lavoro. Da li' si puo' crescere.

---

## Gli errori degli altri, da non ripetere

Questi vengono da studi su studenti di medicina che usano Anki, ed e' la
parte piu' utile della ricerca.

**Il 65,7 per cento si sente sopraffatto dal numero di schede.** Il 40
per cento parla di sovraccarico di informazioni. Il 37 dice di non avere
tempo.

**La crisi tipica:** salti qualche giorno, torni e trovi 600 ripassi
arretrati, ti senti in colpa e abbandoni.

Cosa puo' fare Akesis di diverso:

- **Non mostrare mai un arretrato spaventoso.** Se sono passati dieci
  giorni, proporre venti casi scelti bene, non duecento. Il numero grande
  non aiuta nessuno.
- **Un tetto giornaliero deciso da te**, non dall'algoritmo.
- **Nessuna serie di giorni consecutivi da difendere.** Le strisce
  funzionano finche' non le rompi, e poi diventano un motivo per
  smettere. Il contatore del tempo che abbiamo appena messo e' gia' piu'
  sano: dice quanto hai fatto, non quanto hai mancato.

**Il secondo errore** si chiama "vuoto di Anki": impari a memoria la
formulazione della scheda senza capire il concetto. Vedi venti volte che
il farmaco X da' l'effetto Y e lo ripeti senza sapere perche'. Qui Akesis
parte avvantaggiata, perche' usa vignette cliniche e non schede secche,
ma vale la pena tenerlo presente ogni volta che si scrive un caso.

---

## Collegare le sezioni fra loro

Oggi Quiz, Domande esami e Materiali sono tre stanze separate. AMBOSS
vince proprio su questo: dalla domanda arrivi alla teoria in un clic.

- **Dal caso al materiale.** Se sbagli un caso di anticoagulanti, sotto
  la spiegazione compare la dispensa sugli anticoagulanti. Il
  collegamento c'e' gia' a meta': la sessione di quiz mostra i materiali
  della materia, ma non dell'argomento.
- **Dalla domanda d'esame al caso.** Se una domanda d'esame torna spesso,
  proporre i casi di quell'argomento.
- **Argomenti come spina dorsale.** Materie e argomenti esistono gia' in
  tutte e tre le sezioni, ma sono testo libero: "Anticoagulanti" e
  "anticoagulanti orali" restano due cose diverse. Una lista condivisa di
  argomenti farebbe funzionare tutti i collegamenti.

---

## Cose piu' piccole, ognuna di poche ore

- **Cercare.** Con dieci casi non serve, con duecento si'.
- **Rivedere gli errori.** Una lista dei casi sbagliati piu' di recente.
- **Spiegare perche' le altre risposte sono sbagliate**, non solo perche'
  quella giusta e' giusta. E' quello che fa UWorld ed e' meta' del valore.
- **Segnalare un caso con un errore**, che finisce nella coda di revisione.
- **Storico del tempo giorno per giorno**, oltre al riepilogo di oggi.
- **Esportare** le proprie domande d'esame in PDF, per ripassare senza
  schermo il giorno prima.
- **Immagini nei casi clinici.** Radiografie, ECG, vetrini. Serve capire
  dove metterle e quanto pesano.

---

## Cosa NON fare

- **Inseguire il numero di domande.** Trentamila quesiti li hanno gia'.
  Akesis vale per quello che gli altri non hanno.
- **Aggiungere punti, medaglie, classifiche.** Detto esplicitamente fin
  dall'inizio: seria, non infantile.
- **Costruire il simulatore SSM prima di avere le domande.** Gia' deciso,
  la pagina e' ferma apposta.
- **Rifare la grafica adesso.** Giulia ha detto che quel momento arrivera'
  ma non e' questo.

---

## Se dovessi indicare un ordine

1. **Ripasso a intervalli, versione ridotta.** E' il cuore dello studio e
   oggi manca. Effetto grande, lavoro contenuto.
2. **Approfondire le domande d'esame** (data dell'appello, professore).
   E' il vantaggio vero e costa poco.
3. **Spiegare perche' le risposte sbagliate sono sbagliate.** Nessun
   codice, solo contenuto migliore.
4. **Lista condivisa degli argomenti.** Poco vistoso, ma senza quella i
   collegamenti fra sezioni non si possono fare.
5. **Collegamenti fra sezioni**, una volta che gli argomenti tengono.

---

## Fonti

- Lecturio, confronto banche dati USMLE 2026:
  https://www.lecturio.com/blog/best-usmle-qbanks-2026-uworld-vs-amboss-vs-lecturio/
- iatroX, AMBOSS contro UWorld:
  https://www.iatrox.com/blog/amboss-vs-uworld-for-step-2-ck-who-wins-for-different-learner-types
- iatroX, banche dati SSM 2026:
  https://www.iatrox.com/blog/miglior-banca-dati-quiz-ssm-2026
- TestBuddy, simulatore SSM: https://testbuddy.it/simulatore/ssm
- Peer4Med, simulatore SSM: https://peer4med.it/simulatore/specializzazione-medicina-ssm
- MedAnkiGen, come funziona FSRS: https://medankigen.com/blog/fsrs-anki
- StudyCardsAI, algoritmo FSRS spiegato:
  https://studycardsai.com/blog/anki-fsrs-algorithm
- NBME Score, guida onesta ad Anki per Step 1 (dati sulle difficolta'
  riportate dagli studenti): https://nbmescore.com/anki-for-step-1-complete-guide/
