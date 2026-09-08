import { proteggiPagina } from './auth.js?v=19355368';

/* La pagina e' ferma di proposito: non c'e' ancora nulla da caricare.
   Serve solo la protezione, cosi' quando avra' un contenuto sara' gia'
   dentro le stesse regole delle altre. */
proteggiPagina();
