/* Un controllo statico sui file del progetto, con poche regole ma
   quelle che contano.

   La prima e' `no-undef`: prende ogni nome usato e mai dichiarato ne'
   importato. E' esattamente il guasto del 7 settembre, quando avevo
   spostato una funzione in un file nuovo e sbagliato la riga
   dell'import: auth.js la chiamava senza averla, e ogni pagina moriva
   li'. I collaudi nel browser non potevano vederlo, perche' sostituiscono
   proprio auth.js con un finto.

   I nomi del browser sono elencati a mano invece di tirare dentro un
   pacchetto: sono pochi, e cosi' questo controllo non dipende da
   niente. */

const BROWSER = [
  'document', 'window', 'console', 'navigator', 'location', 'history',
  'localStorage', 'sessionStorage', 'fetch', 'alert', 'confirm', 'prompt',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame', 'queueMicrotask',
  'URL', 'URLSearchParams', 'Blob', 'File', 'FormData', 'FileReader',
  'Event', 'CustomEvent', 'AbortController', 'DOMParser',
  'HTMLElement', 'Node', 'Image', 'getComputedStyle', 'matchMedia',
  'crypto', 'atob', 'btoa', 'performance', 'structuredClone',
  'ResizeObserver', 'IntersectionObserver', 'MutationObserver',
  'TextEncoder', 'TextDecoder', 'CSS', 'screen', 'scrollTo',
].reduce((g, n) => ({ ...g, [n]: 'readonly' }), {});

export default [
  {
    files: ['*.js'],
    ignores: ['eslint.config.mjs'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: BROWSER },
    rules: {
      'no-undef': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-unreachable': 'error',
      'no-self-assign': 'error',
      'no-constant-condition': 'error',
    },
  },
];
