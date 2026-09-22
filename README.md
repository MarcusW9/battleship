# Battleship

**A browser Battleship game built with vanilla JavaScript, ES6 modules and factory functions, tested with Jest and bundled with Vite.** Part of [The Odin Project](https://www.theodinproject.com/lessons/node-path-javascript-battleship) curriculum.

**[▶ Play it live](https://marcusw9.github.io/battleship/)**

> This README is written as much for future me as for anyone visiting. If I come back to this in six months, the goal is that I can read this file and be productive again in ten minutes, without having to re-read every module to remember why I did things a certain way.

**Status:** playable end to end — name entry → manual fleet placement → turn-based combat against a computer opponent → win message → play again without a page refresh. 22 unit tests passing across 4 suites.

---

## Quick start

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server, then open the printed localhost URL
npm test         # run the suite once (e.g. before a commit)
npm run test:watch   # run Jest in watch mode while developing
npm run deploy   # build and publish dist/ to the gh-pages branch
```

No build step is needed to play locally — Vite serves the ES modules directly. `npm run build` produces the `dist/` bundle.

## Deployment

The live version is hosted on GitHub Pages from the `gh-pages` branch, which holds only the built output — `main` stays the source branch and never contains `dist/`.

`npm run deploy` does the whole job: the `predeploy` script runs `npm run build`, then the [`gh-pages`](https://github.com/tschaub/gh-pages) package force-pushes the contents of `dist/` to the `gh-pages` branch.

The one thing that is easy to get wrong: Pages serves the site from `/battleship/`, not from the domain root, so `vite.config.mjs` sets `base: '/battleship/'`. Without it the built `index.html` asks for `/assets/index.js` and every asset 404s — the page loads blank with no obvious error. The config file uses the `.mjs` extension because this package is CommonJS by default, and Vite warns when it has to load ESM config syntax as CJS.

---

## How the game plays

1. **Setup screen** — enter a commander name and hit *Deploy Fleet*.
2. **Placement phase** — five ships are placed one at a time from a queue (Destroyer 2, Submarine 3, Cruiser 3, Battleship 4, Carrier 5). Hovering shows a live preview of where the ship would land, tinted green if the placement is legal and red if it runs off the board or overlaps something already placed. *Rotate axis* flips between horizontal and vertical.
3. **Battle phase** — once all five are down, *Engage Enemy* places the computer's fleet randomly and reveals both boards. I click cells on the enemy board to fire; the computer immediately fires back. My board shows my ships; the enemy board shows only hits, misses and sunk ships (fog of war).
4. **End of game** — when either fleet is wiped out, a message announces the winner and the board locks against further clicks. *Play again* restarts in place: fresh boards, fresh ships, same commander name, no page reload.

---

## Architecture

The whole point of this project was separating game logic from the DOM, so the logic modules never touch the browser and can be tested in isolation.

```
index.html
   │
   └── src/index.js ............ composition root: the only file that knows about BOTH halves
          │                       owns the admiral's name and the beginGame() lifecycle
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

**`index.js` is the composition root and stays that way.** It's the only file allowed to know about both the logic modules and the view — at first startup and at reset alike. `displayController` never imports the controller factory; it receives a controller. That boundary is what made the reset feature a small change rather than a rewrite.

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

**Recreate the controller, don't reset it.** On *Play again*, `index.js` simply calls `createGameController(name)` again rather than the factory growing an internal `reset()` method. Mutating in place would mean hand-writing a second description of "what does fresh game state look like", which can drift out of sync with the factory's own body over time. Two independent recipes for the same state are a bug waiting to happen, even when both start out correct. Recreating needed **zero** changes to `Controller.js`, and it resets the computer's depleted move pool for free as a side effect.

**`cloneNode(true)` + `replaceChild` to shed listeners.** The reset can't just re-run the setup functions, because `addEventListener` is additive — re-running them stacks a second listener on top of the first, each closing over a different, stale controller. Swapping the element for a listener-free clone of itself drops every listener on the node and all its descendants in one move. The alternative would have been to bind listeners once and read current state through a mutable holder, but this app fully controls its own DOM lifecycle (unlike a framework constantly tearing down and rebuilding), so cloning is the simpler fit.

**Cloning is scoped deliberately, not applied broadly.** `#placement-container` and `#player-two-board` get cloned because they carry listeners. `#player-one-board` and `#combat-container` do **not** — nothing attaches listeners to them more than once, and `#combat-container` houses the reset button and the winner message, which need a stable identity across resets. The reset button's own listener is bound once at startup and survives every game precisely because its container is never cloned.

**An inversion-of-control callback for the name.** `displayController.init({ onBeginGame })` takes a function from `index.js` and calls it with the typed name once the form is submitted. The view doesn't need to know what happens next. That one indirection let "start" and "restart" collapse into a single `beginGame(name)` in `index.js`, called both from the form callback and from the reset button.

**A plain message, not a modal.** The winner announcement is a non-blocking `<div id="winner-message">` toggled visible. A modal was considered and ruled out on UX grounds: the message should stay informational and leave the finished boards visible and inspectable underneath, rather than throwing a backdrop over them.

**A `gameOver` flag scoped inside `handlePlayerAttack`.** Nothing previously stopped clicks after a win. Two distinct failure modes existed: after a *computer* win, `playTurn` returns early without calling `switchTurn()`, so the computer stays the active player — a further click would resolve the attack against the human's own board and corrupt the finished game. After a *human* win, extra clicks just re-fired the win message. One flag, checked as the first line of the click handler, closes both. It needs no reset logic of its own: `handlePlayerAttack` only ever runs as a fresh call against a freshly cloned board, so the flag and the listener it guards are recreated together every game, for free. (`removeEventListener` was ruled out — the listener is an anonymous arrow function with no stored reference to pass back in.)

---

## What I learned the hard way

These are the moments that actually cost me time. Recording them here because they're the things I'd otherwise repeat.

**Const declarations aren't hoisted the way function declarations are.** I had `SHIP_PRESETS` declared at the *bottom* of `Ship.js`, below `createShip`, and got a temporal dead zone error. Function declarations hoist; `const` bindings exist but can't be read before their line executes. Anything a factory reads at call time has to be declared above it.

**…and I hit the exact same wall again, three weeks later.** `beginGame` was a `const` arrow function declared *below* the `displayController.init({ onBeginGame: beginGame })` call that referenced it, which crashed the app on load. Converting it to a `function` declaration — which *is* hoisted — fixed it. Same lesson, different file. Clearly it hadn't stuck the first time, so: **if A references B at module load, either B is declared above A, or B is a `function` declaration.**

**Git caches filenames case-insensitively on my machine.** A test imported `../src/modules/controller.js` (lowercase c) instead of `Controller.js`. It ran fine locally because the filesystem didn't care — but it's a real break waiting to happen on a case-sensitive system. Fixing the import wasn't enough; Git had the wrong casing cached and needed clearing. Lesson: match the actual filename exactly, every time.

**An object is always truthy.** The single worst bug of the project. `Controller.playTurn` had `if (!activeTurn)` when `receiveAttack` returns an object — including on failure. `{success: false}` is truthy, so the guard never fired, and the player could keep clicking an already-missed cell and burn the computer's turn each time. The fix was one character short of trivial (`if (!activeTurn.success)`), but it took a while to see, because the code *read* correctly. Once you return objects instead of booleans, every truthiness check has to be updated to test the actual field. I added a regression test for it.

**`addEventListener` is additive, not a replace.** Re-running a setup function doesn't rebind a listener — it adds a second one. Both then fire, and the old one is still closing over the previous game's controller. This is the bug that made the reset feature genuinely hard, and it has a nasty property: **it's invisible on the first playthrough.** Everything looks correct until you play a second game. The standing lesson is to test the full replay cycle, not just first-run behaviour.

**Function calls get a fresh scope; DOM nodes don't.** This is why "recreate" needed no cleanup anywhere. Calling `createGameController()` again produces genuinely new state with nothing left over — JavaScript guarantees it. A DOM element gets no such guarantee: it keeps its listeners until something explicitly removes them, which is why `cloneNode` exists as the manual way to manufacture the same freshness.

**Closures capture live bindings, not snapshots.** A function reading a shared `let` sees later reassignments automatically, without being redefined. That's why the reset button's handler, bound once at startup, correctly reads whatever `admiralName` currently holds.

**Default parameters only trigger on `undefined`.** Not on `""`, `0` or `null`. I had `let admiralName = ""`, which turned out to be dead code — the reset button stays hidden until a game has been won, which requires a name to already exist, so the initial value can never be read. But it was also the *worse* of the two options: had it ever been read, `""` would have silently produced a blank player name, where `undefined` would have fallen back gracefully to `'You'`. Changed to `let admiralName;`.

**`alert()` blocks the repaint.** The final sunk ship wasn't appearing on screen until after the win dialog was dismissed, even though the DOM update ran *first* in the code. The browser only recalculates layout and paints once the running synchronous JavaScript hands the thread back, and a blocking dialog never hands it back. The DOM had already been updated; the pixels just hadn't caught up. Removing `alert()` fixed it as a side effect — several synchronous DOM mutations in one block now batch into a single normal repaint.

**Import paths silently point at nothing.** `index.js` was importing `./Gameboard.js` rather than `./modules/Gameboard.js`, and importing things it no longer used while missing `createGameController` entirely — giving a `ReferenceError` on init. Worth deleting unused imports as I go rather than letting them rot.

**Migrating Webpack → Vite** partway through. Vite serves ES modules natively with no bundling in dev, so it needed far less configuration for what this project actually does. Jest still needs Babel (`babel.config.json` + `jest.config.js`) to transform ESM for the Node test environment — the two toolchains are separate concerns and both have to be configured.

### How the project actually progressed

Reading back through the commits, it fell into four phases:

- **Aug 28 – Sep 7 — logic first, test-driven.** `Gameboard` and `Ship` were built method by method, each one with its test written alongside. Not a single line of DOM code existed until the game was fully playable through the test suite. This was slower at the start and paid for itself completely later: when a UI bug appeared, I always knew the logic underneath was sound.
- **Sep 8 – Sep 13 — the UI, and a lot of refactoring.** Building the view exposed gaps in the model (the `Set` → `Map` change, extracting `isPlacementValid`). The interesting pattern is that the model kept getting *better* under pressure from the view, rather than the view growing workarounds for a model that didn't fit.
- **Sep 14 – Sep 18 — integration, then polish.** Wiring `gameController` into `displayController`, unifying turn management, then UX work on the setup and battle screens.
- **Sep 19 – Sep 20 — lifecycle.** Play again, the end-of-game message, and locking the board after a win. The notable thing here is that **all three features live entirely in `displayController` and `index.js`** — `Controller.js`, `Player.js`, `Gameboard.js` and `Ship.js` were not touched once. That's the separation from phase one paying a dividend three weeks later.

---

## Where I'd pick this up

Known gaps and rough edges, in roughly the order I'd tackle them:

- [ ] **The three newest features have no test coverage.** The suite is still the 22 logic tests from phase one; reset, the win message and the `gameOver` guard are all verified by hand only. Given that the listener-duplication bug is invisible on a first playthrough, this is the gap most likely to bite.
- [ ] **`automaticComputerMove` guards on `activePlayer.isHuman`, which the Player factory never exposes.** It's always `undefined`, so the guard never fires — the function works only because it's called at the right moment. Either expose `isHuman` from `createPlayer` or drop the guard; right now it's correct by accident.
- [ ] **The hover preview looks up cells with a document-wide `querySelector`.** After a first game, `#player-one-board` and `#player-two-board` also contain cells carrying the same `data-x`/`data-y` attributes, so the lookup only finds the right cell because `#placement-container` happens to come first in the HTML. Scoping the query to the placement board would make it correct by design rather than by document order.
- [ ] **`displayController.resetGame` is also the *start* path**, called by `beginGame` on the very first game. It works, but the name now undersells what it does — something like `startGame` would read more honestly.
- [ ] **`currentShipIndex` and `currentDirection` are still module-level mutable state.** They're now explicitly reset inside `resetGame`, so the replay bug is closed, but they'd be safer as part of a placement-state object owned by the placement phase.
- [ ] **No tests for `displayController` at all.** Everything below it is covered; the view isn't. Would need jsdom.
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

### Reading a diff without getting stuck
`git diff` opens in a pager. `q` quits it, space pages down, `b` pages up.
```bash
git --no-pager diff README.md     # print straight to the terminal instead
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
├── index.html                  # both screens, plus the winner message and reset button
├── src/
│   ├── index.js                # composition root — owns beginGame() and the admiral's name
│   ├── style.css               # CSS custom properties for the palette, responsive flex/grid
│   ├── assets/
│   └── modules/
│       ├── Ship.js             # SHIP_PRESETS, createShip
│       ├── Gameboard.js        # grid, placement, attacks, win condition
│       ├── Player.js           # createPlayer, computer move generation
│       ├── Controller.js       # createGameController — turn management
│       └── displayController.js # all DOM rendering, event handling and reset machinery
├── tests/                      # one suite per logic module
├── jest.config.js              # babel-jest transform
└── babel.config.json           # preset-env targeting current node
```
