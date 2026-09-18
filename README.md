# Battleship

**A browser Battleship game built with vanilla JavaScript, ES6 modules and factory functions, tested with Jest and bundled with Vite.** Part of [The Odin Project](https://www.theodinproject.com/lessons/node-path-javascript-battleship) curriculum.

> This README is written as much for future me as for anyone visiting. If I come back to this in six months, the goal is that I can read this file and be productive again in ten minutes, without having to re-read every module to remember why I did things a certain way.

**Status:** playable end to end — name entry → manual fleet placement → turn-based combat against a computer opponent. 22 unit tests passing across 4 suites.

---

## Quick start

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server, then open the printed localhost URL
npm test         # run Jest in watch mode
npx jest --watchAll=false   # run the suite once (e.g. before a commit)
```

No build step is needed to play locally — Vite serves the ES modules directly. `npm run build` produces the `dist/` bundle if I ever want to deploy it.

---

## How the game plays

1. **Setup screen** — enter a commander name and hit *Deploy Fleet*.
2. **Placement phase** — five ships are placed one at a time from a queue (Destroyer 2, Submarine 3, Cruiser 3, Battleship 4, Carrier 5). Hovering shows a live preview of where the ship would land, tinted green if the placement is legal and red if it runs off the board or overlaps something already placed. *Rotate axis* flips between horizontal and vertical.
3. **Battle phase** — once all five are down, *Engage Enemy* places the computer's fleet randomly and reveals both boards. I click cells on the enemy board to fire; the computer immediately fires back. My board shows my ships; the enemy board shows only hits, misses and sunk ships (fog of war).

---

## Architecture

The whole point of this project was separating game logic from the DOM, so the logic modules never touch the browser and can be tested in isolation.

```
index.html
   │
   └── src/index.js ............ entry point: wires the two halves together
          │
          ├── Controller.js ..... owns the match: two players, two boards, whose turn it is
          │      ├── Player.js ... identity, attack delegation, computer move generation
          │      └── Gameboard.js  10×10 grid, placement rules, attack tracking
          │             └── Ship.js  length, hit count, sunk state
          │
          └── displayController.js  the ONLY module that knows the DOM exists
```

**The data flow is one-directional.** A click lands in `displayController` → it calls `gameController.playTurn(row, col)` → the controller picks the defending board and calls `receiveAttack` → a result object bubbles back up → `displayController` re-renders from the board's current state.

Nothing below `displayController` imports anything browser-related, which is why all four logic modules are unit-testable with plain Jest and no jsdom fixtures.

### The convention I'm most glad I settled on

Every function that can fail returns the same shaped object instead of a bare boolean:

```js
{
  success: true,                    // did the operation happen at all?
  status: 'hit',                    // 'miss' | 'hit' | 'sunk' | 'placed' | 'valid' | 'invalid' | 'win' | 'played'
  message: 'Your attack hit the ship!',   // human-readable, ready for the UI
  data: { row, col }                // optional payload
}
```

This started as a small decision and ended up carrying the whole project. The UI never has to interpret raw booleans or re-derive what happened — it reads `status` to decide which CSS class to apply, and `message` is already a sentence I can show the player. It also made the placement-preview feature almost free: `isPlacementValid` returns the same shape, so the hover handler could reuse the real placement rules rather than duplicating the bounds maths in the view layer.

### Design decisions worth remembering

**Factory functions and closures, not classes.** `createShip`, `createPlayer`, `createGameboard` and `createGameController` all return an object literal of methods that close over private state. `hits`, `board`, `ships` and `trackedAttacks` are genuinely private — there is no way to reach in from outside and corrupt them. Where I needed controlled outside access I used getters (`get player1()`, `get hasWon()` / `set hasWon()`) rather than exposing the variable.

**A `Map` for attack history, not a `Set`.** Originally `trackedHits` was a `Set` of `"row,col"` strings, which could only answer *has this cell been fired at?* Once the UI needed to colour cells differently for hits and misses, that wasn't enough. Switching to a `Map` keyed the same way but storing `'hit'` or `'miss'` as the value, plus a `getAttackStatus(row, col)` accessor, gave the view exactly what it needed in O(1). Storing the status on the board rather than recomputing it in the renderer keeps the view dumb.

**Validation pulled out into a pure helper.** `isPlacementValid(row, col, shipLength, direction)` reads state but mutates nothing, so it can be called speculatively. That's what makes the hover preview honest: the green/red tint is produced by the exact same function that will later accept or reject the click, so the preview can never disagree with the outcome.

**O(1) computer moves.** Rather than guessing randomly and retrying when a cell had already been hit (unbounded worst case), the computer player pre-generates all 100 coordinates once. Each move picks a random index, swaps that element with the last element, and pops it — the Fisher-Yates partial-shuffle trick. Every move is constant time and the pool shrinks by exactly one, so moves are guaranteed mutually exclusive and exhaustive. There's a test asserting exactly that.

**Fog of war via a render flag.** `renderBoard(element, gameboard, isPlayerOne)` takes a boolean that decides whether unhit ship cells get the `placed` class. Same renderer, two boards, one flag — instead of writing two near-identical render functions.

---

## What I learned the hard way

These are the moments that actually cost me time. Recording them here because they're the things I'd otherwise repeat.

**Const declarations aren't hoisted the way function declarations are.** I had `SHIP_PRESETS` declared at the *bottom* of `Ship.js`, below `createShip`, and got a temporal dead zone error. Function declarations hoist; `const` bindings exist but can't be read before their line executes. Anything a factory reads at call time has to be declared above it.

**Git caches filenames case-insensitively on my machine.** A test imported `../src/modules/controller.js` (lowercase c) instead of `Controller.js`. It ran fine locally because the filesystem didn't care — but it's a real break waiting to happen on a case-sensitive system. Fixing the import wasn't enough; Git had the wrong casing cached and needed clearing. Lesson: match the actual filename exactly, every time.

**An object is always truthy.** The single worst bug of the project. `Controller.playTurn` had `if (!activeTurn)` when `receiveAttack` returns an object — including on failure. `{success: false}` is truthy, so the guard never fired, and the player could keep clicking an already-missed cell and burn the computer's turn each time. The fix was one character short of trivial (`if (!activeTurn.success)`), but it took a while to see, because the code *read* correctly. Once you return objects instead of booleans, every truthiness check has to be updated to test the actual field. I added a regression test for it.

**Import paths silently point at nothing.** `index.js` was importing `./Gameboard.js` rather than `./modules/Gameboard.js`, and importing things it no longer used while missing `createGameController` entirely — giving a `ReferenceError` on init. Worth deleting unused imports as I go rather than letting them rot.

**Migrating Webpack → Vite** partway through. Vite serves ES modules natively with no bundling in dev, so it needed far less configuration for what this project actually does. Jest still needs Babel (`babel.config.json` + `jest.config.js`) to transform ESM for the Node test environment — the two toolchains are separate concerns and both have to be configured.

### How the project actually progressed

Reading back through the commits, it fell into three clean phases:

- **Aug 28 – Sep 7 — logic first, test-driven.** `Gameboard` and `Ship` were built method by method, each one with its test written alongside. Not a single line of DOM code existed until the game was fully playable through the test suite. This was slower at the start and paid for itself completely later: when a UI bug appeared, I always knew the logic underneath was sound.
- **Sep 8 – Sep 13 — the UI, and a lot of refactoring.** Building the view exposed gaps in the model (the `Set` → `Map` change, extracting `isPlacementValid`). The interesting pattern is that the model kept getting *better* under pressure from the view, rather than the view growing workarounds for a model that didn't fit.
- **Sep 14 – Sep 18 — integration, then polish.** Wiring `gameController` into `displayController`, unifying turn management, then UX work on the setup and battle screens.

---

## Where I'd pick this up

Known gaps and rough edges, in roughly the order I'd tackle them:

- [ ] **Win state is an `alert()`.** Needs a proper end-of-game screen, and there's no way to play again without refreshing.
- [ ] **`automaticComputerMove` guards on `activePlayer.isHuman`, which the Player factory never exposes.** It's always `undefined`, so the guard never fires — the function works only because it's called at the right moment. Either expose `isHuman` from `createPlayer` or drop the guard; right now it's correct by accident.
- [ ] **`currentShipIndex` and `currentDirection` are module-level mutable state** in `displayController`. A second game in the same page load would start with the fleet queue already exhausted. They should live inside `init` or in a placement-state object.
- [ ] **No tests for `displayController`.** Everything below it is covered; the view isn't. Would need jsdom.
- [ ] **`npm test` runs Jest in `--watch` mode**, which hangs in CI. Worth splitting into `test` and `test:watch`.
- [ ] Unused imports in `displayController.js` (`createGameController`, `createGameboard`), and a stray file named `touch` in the repo root from a mistyped command.
- [ ] **Smarter AI** — upgrade from random targeting to hunt-and-target: once a hit lands, probe adjacent cells until the ship sinks.
- [ ] Drag-and-drop ship placement, and a sound/animation pass.

---

## Appendix: terminal and path notes

Kept from my original notes, because I looked these up more than once.

### File creation
```bash
touch src/modules/Gameboard.js                      # create a module
touch tests/gameboard.test.js tests/ship.test.js    # create several files
mkdir -p src/modules && touch src/modules/Gameboard.js   # nested directory + file
```

### Cleanup and safe deletion
```bash
ls -la path/to/folder     # check contents before deleting anything
rm -rf src/tests          # delete a folder and its contents
```

### Running tests
```bash
npx jest                          # all tests
npx jest tests/gameboard.test.js  # one file
npx jest --watchAll=false         # single run, no watch
```

### Import paths
Paths are relative to the file doing the importing. From `tests/gameboard.test.js` up to `src/modules/Gameboard.js`:

```js
import { createGameboard } from '../src/modules/Gameboard.js';
```

`../` goes up one directory from `tests/`, then down into `src/modules/`. Case must match the real filename exactly.

---

## Project structure

```
battleship/
├── index.html                  # both screens, hidden/revealed by class toggling
├── src/
│   ├── index.js                # entry point — creates controller, hands it to the view
│   ├── style.css               # CSS custom properties for the palette, responsive flex/grid
│   ├── assets/
│   └── modules/
│       ├── Ship.js             # SHIP_PRESETS, createShip
│       ├── Gameboard.js        # grid, placement, attacks, win condition
│       ├── Player.js           # createPlayer, computer move generation
│       ├── Controller.js       # createGameController — turn management
│       └── displayController.js # all DOM rendering and event handling
├── tests/                      # one suite per logic module
├── jest.config.js              # babel-jest transform
└── babel.config.json           # preset-env targeting current node
```
