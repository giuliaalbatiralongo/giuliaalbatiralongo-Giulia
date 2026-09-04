---
name: emil-design-eng
description: Regole di design engineering e animazione basate sulla filosofia di Emil Kowalski (animations.dev). Usare quando si scrivono transizioni, stati interattivi o micro-animazioni nell'interfaccia.
source: https://github.com/emilkowalski/skills (skills/emil-design-eng)
---

# Emil Design Eng — regole operative

Estratto delle regole prescrittive dal repository `emilkowalski/skills`.
Contenuto di terze parti, salvato come riferimento di progetto.

## Durate

| Elemento | Durata |
|----------|--------|
| Feedback pressione pulsante | 100–160ms |
| Tooltip, popover piccoli | 125–200ms |
| Dropdown, select | 150–250ms |
| Modali, drawer | 200–500ms |
| **Regola generale UI** | **sotto 300ms** |

## Curve di easing

Consigliate:
- `ease-out` (ingresso/uscita): `cubic-bezier(0.23, 1, 0.32, 1)`
- `ease-in-out` (movimento sullo schermo): `cubic-bezier(0.77, 0, 0.175, 1)`
- `ease-drawer` (stile iOS): `cubic-bezier(0.32, 0.72, 0, 1)`
- `ease` per hover e cambi di colore
- `linear` per movimento costante (marquee, progress bar)

Vietate:
- **Mai `ease-in`** su elementi UI: parte lenta e fa sembrare l'interfaccia pigra.

## Proprieta' da animare

- Animare **solo** `transform` e `opacity` (accelerate in hardware).
- Evitare sempre `padding`, `margin`, `height`, `width`: causano layout/paint.

## Stati

- `:active` su pulsante: `transform: scale(0.97)`, transizione 160ms ease-out.
- Mai `scale(0)` in entrata: usare `scale(0.95)` + `opacity: 0`.
- `transform-origin`: popover dal trigger, modali dal centro.
- Hover sempre dietro `@media (hover: hover) and (pointer: fine)`.

## Altro

- Stagger tra elementi in lista: 30–80ms.
- Blur nelle transizioni: massimo 20px (costoso su Safari).
- Uscita piu' veloce dell'entrata.

## Errori comuni

| Errore | Correzione |
|--------|-----------|
| `transition: all` | Specificare la proprieta': `transition: transform 200ms ease-out` |
| `scale(0)` in entrata | `scale(0.95)` + `opacity: 0` |
| `ease-in` su UI | Passare a `ease-out` o curva custom |
| Animazione su azione da tastiera | Rimuovere l'animazione |
| Durata oltre 300ms | Ridurre a 150–250ms |
| Keyframes su trigger rapidi | Usare transizioni CSS |
| Entrata e uscita alla stessa velocita' | Uscita piu' rapida |
| Tutti gli elementi che appaiono insieme | Aggiungere stagger 30–80ms |
