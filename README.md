# Battleship

**A browser Battleship game built with vanilla JavaScript, ES6 modules and factory functions, tested with Jest and bundled with Vite.** Part of [The Odin Project](https://www.theodinproject.com/lessons/node-path-javascript-battleship) curriculum.

**[▶ Play it live](https://marcusw9.github.io/battleship/)**

> This README is written as much for future me as for anyone visiting. If I come back to this in six months, the goal is that I can read this file and be productive again in ten minutes, without having to re-read every module to remember why I did things a certain way.

**Status:** playable end to end — name entry → manual fleet placement → turn-based combat against a hunt-and-target computer opponent → win message → play again without a page refresh. 26 tests passing across 4 suites, and ESLint clean.

---

## Quick start

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server, then open the printed localhost URL
npm test         # run the suite once (e.g. before a commit)
npm run test:watch   # run Jest in watch mode while developing
npm run lint     # run ESLint across src/ and tests/
npm run deploy   # build and publish dist/ to the gh-pages branch
```

Pushing to `main` does **not** update the live site. The order after a change is: commit → `git push` → `npm run deploy`. Deploy builds from the working folder, not the last commit, so commit first.

No build step is needed to play locally — Vite serves the ES modules directly. `npm run build` produces the `dist/` bundle.

## Deployment

The live version is hosted on GitHub Pages from the `gh-pages` branch, which holds only the built output — `main` stays the source branch and never contains `dist/`.

`npm run deploy` does the whole job: the `predeploy` script runs `npm run build`, then the [`gh-pages`](https://github.com/tschaub/gh-pages) package force-pushes the contents of `dist/` to the `gh-pages` branch.

The one thing that is easy to get wrong: Pages serves the site from `/battleship/`, not from the domain root, so `vite.config.mjs` sets `base: '/battleship/'`. Without it the built `index.html` asks for `/assets/index.js` and every asset 404s — the page loads blank with no obvious error. The config file uses the `.mjs` extension because this package is CommonJS by default, and Vite warns when it has to load ESM config syntax as CJS.

---

## How the game plays

1. **Setup screen** — enter a commander name and hit *Deploy Fleet*.
2. **Placement phase** — five ships are placed one at a time from a queue (Destroyer 2, Submarine 3, Cruiser 3, Battleship 4, Carrier 5). Hovering shows a live preview of where the ship would land, tinted green if the placement is legal and red if it runs off the board or overlaps something already placed. *Rotate axis* flips between horizontal and vertical.
3. **Battle phase** — once all five are down, *Engage Enemy* places the computer's fleet randomly and reveals both boards. I click cells on the enemy board to fire; the computer immediately fires back. It searches randomly until it lands a hit, then works the neighbouring cells, follows the line once it has two hits in a row, and carries on after a sink if it has hits on a touching ship. My board shows my ships; the enemy board shows only hits, misses and sunk ships (fog of war).
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
          ├── Controller.js ..... owns ALL game state: players, boards, whose turn it is,
          │      │                 the placement queue and direction, and whether the game is over
          │      ├── Player.js ... identity, attack delegation, hunt-and-target computer AI
          │      └── Gameboard.js  10×10 grid, placement rules, attack tracking
          │             └── Ship.js  length, hit count, sunk state
          │
          └── displayController.js  the ONLY module that knows the DOM exists
```

**The data flow is one-directional.** A click lands in `displayController` → it calls `gameController.playTurn(row, col)` → the controller picks the defending board and calls `receiveAttack` → a result object bubbles back up → `displayController` re-renders from the board's current state.

Nothing below `displayController` imports anything browser-related, which is why all four logic modules are unit-testable with plain Jest and no jsdom fixtures.

**`index.js` is the composition root and stays that way.** It's the only file allowed to know about both the logic modules and the view — at first startup and at reset alike. `displayController` never imports the controller factory; it receives a controller. That boundary is what made the reset feature a small change rather than a rewrite.

**The controller decides, the display shows.** `displayController` holds no game state at all — no placement index, no direction, no game-over flag. It asks the controller *questions* to decide what to draw, and calls *commands* when the user does something:

| Questions (read, never change) | Commands (change state) |
|---|---|
| `getCurrentShip()` | `placeCurrentShip(row, col)` |
| `isPlacementComplete()` | `rotateShip()` |
| `isGameOver()` | `playTurn(row, col)` |
| `shipDirection` (getter) | `automaticComputerMove()` |

The rule of thumb for my own API: anything named `is…` or `get…` is called with `()`; plain nouns like `shipDirection` and `activePlayer` are getters and aren't. Inside `Controller.js` I use the private variable (`currentShipIndex`); everywhere else only the public name exists. If I ever see `gameController.current…` in the display, that's a bug.

### The convention I'm most glad I settled on

Every function that can fail returns the same shaped object instead of a bare boolean:

```js
{
  success: true,                    // did the operation happen at all?
  status: 'hit',                    // 'miss' | 'hit' | 'sunk' | 'placed' | 'valid' | 'invalid' | 'win' | 'played' | 'gameOver'
  message: 'Your attack hit the ship!',   // human-readable, ready for the UI
  data: { row, col }                // optional payload
}
```

**Every exit returns the same shape — including guards.** `playTurn`'s game-over guard returns `{ success: false, status: 'gameOver', … }` rather than a bare `return`. A bare return is fine in an event listener (the browser discards the value), but `playTurn`'s callers read `.success`, and `undefined.success` throws.

**Results nest by layer rather than flattening.** `playTurn` wraps the gameboard's answer instead of replacing it:

```js
result                     // controller: did a turn happen?   'played' | 'win' | 'invalid' | 'gameOver'
└── data.attackResult      // gameboard:  what did the shot hit?  'miss' | 'hit' | 'sunk'
    └── data.sunkShipCells // only on 'sunk'
```

Two statuses at two levels answer two different questions. Winning turns carry no `attackResult`, so anything reading it uses `result.data?.attackResult`.

This started as a small decision and ended up carrying the whole project. The UI never has to interpret raw booleans or re-derive what happened — it reads `status` to decide which CSS class to apply, and `message` is already a sentence I can show the player. It also made the placement-preview feature almost free: `isPlacementValid` returns the same shape, so the hover handler could reuse the real placement rules rather than duplicating the bounds maths in the view layer.

### Design decisions worth remembering

**Factory functions and closures, not classes.** `createShip`, `createPlayer`, `createGameboard` and `createGameController` all return an object literal of methods that close over private state. `hits`, `board`, `ships` and `trackedAttacks` are genuinely private — there is no way to reach in from outside and corrupt them. Where I needed controlled outside access I used getters (`get player1()`, `get hasWon()` / `set hasWon()`) rather than exposing the variable.

**A `Map` for attack history, not a `Set`.** Originally `trackedHits` was a `Set` of `"row,col"` strings, which could only answer *has this cell been fired at?* Once the UI needed to colour cells differently for hits and misses, that wasn't enough. Switching to a `Map` keyed the same way but storing `'hit'` or `'miss'` as the value, plus a `getAttackStatus(row, col)` accessor, gave the view exactly what it needed in O(1). Storing the status on the board rather than recomputing it in the renderer keeps the view dumb.

**Validation pulled out into a pure helper.** `isPlacementValid(row, col, shipLength, direction)` reads state but mutates nothing, so it can be called speculatively. That's what makes the hover preview honest: the green/red tint is produced by the exact same function that will later accept or reject the click, so the preview can never disagree with the outcome.

**O(1) random computer moves.** Rather than guessing randomly and retrying when a cell had already been hit (unbounded worst case), the computer player pre-generates all 100 coordinates once. Each move picks a random index, swaps that element with the last element, and pops it — the swap-and-pop step that the Fisher-Yates shuffle is built from. (Strictly, Fisher-Yates is the name for shuffling a *whole* array; removing one item this way is "swap-and-pop". I've kept the Fisher-Yates name in the code comment as a memory hook.) Every move is constant time and the pool shrinks by exactly one, so moves are guaranteed mutually exclusive and exhaustive — `allMoves` is a deck of cards, and a dealt card is gone. There's a test asserting exactly that.

**Hunt and target: record facts, decide every turn.** The AI's first targeting version kept a *to-do list*: on each hit it queued the four neighbours, then worked through them, even after a second hit made the sideways cells pointless. The current version stores only *facts* — `activeHits`, the hits not yet explained by a sunk ship — and `getTargets()` recomputes the best shots from all of them every turn:

1. two or more hits in one row or column → only the two cells past the ends of the line (`findLineTargets`)
2. otherwise → the untried neighbours of every active hit (`findNeighbourTargets`); this also covers a single hit, an L-shape from two touching ships, and a line whose ends are both blocked
3. nothing to target → random swap-and-pop

Cells now leave `allMoves` when they're **fired at**, not when they're queued, and `isUntried` filters targets against `allMoves` — so it stays the single source of truth for "never fired here". A 200-game headless simulation produced zero invalid computer moves.

I deliberately skipped a general "find any line anywhere among the hits" search. Because random shots only happen when `activeHits` is empty, every new hit touches an existing one, so the hits always form one connected group — scattered diagonal leftovers can't arise. The cost is a few wasted shots on L-shapes.

**Forget only the sunk ship.** Clearing every hit on a sink let you trick the AI by clustering ships: it would sink one and walk away from the one touching it. Now `receiveAttack` reports `sunkShipCells` on a sink — found by scanning the board for that exact ship object, since every cell of a ship holds the same reference and `===` compares references — and `recordResult` removes only those cells from `activeHits`. Any leftover hits are picked up by `getTargets` on the next turn with no change to the targeting code. It's fair: the UI already shows sunk ships to the human.

**`recordResult` is named for what the controller knows, not what the AI does.** The controller just reports "here's what happened to your shot"; a public name like `generateHuntAttacks` would leak AI strategy into the controller. The strategy helpers (`getTargets`, `findLineTargets`, `findNeighbourTargets`, `takeFromAllMoves`, `isUntried`) stay private inside `createPlayer`. The controller saves `const computer = activePlayer` *before* calling `playTurn`, because `playTurn` switches turns — afterwards `activePlayer` is the human.

**Placement state lives in the controller.** `fleetQueue`, the current ship index and the current direction moved out of module-level `let`s in `displayController` into `createGameController`. Two wins: the display can't get the index wrong because it never touches it (`getCurrentShip()` / `isPlacementComplete()` replaced three hand-written copies of `shipIndex >= fleetQueue.length`, one of which had a typo), and reset needs no manual "set index back to 0" lines — a new controller starts fresh. `placeCurrentShip` is a thin wrapper around `Gameboard.placeShip`, the same way `playTurn` wraps `receiveAttack`: the board knows *where* a ship can go, the controller knows *which* ship is next.

**The start button's listener is attached once, with a guard inside.** It used to be added inside the board's click handler when the last ship was placed. Attaching a listener inside another listener is the pattern to avoid — if the condition is ever wrong, listeners multiply. Now it sits next to the rotate listener and checks `isPlacementComplete()` itself.

**Fog of war via a render flag.** `renderBoard(element, gameboard, isPlayerOne)` takes a boolean that decides whether unhit ship cells get the `placed` class. Same renderer, two boards, one flag — instead of writing two near-identical render functions.

**Recreate the controller, don't reset it.** On *Play again*, `index.js` simply calls `createGameController(name)` again rather than the factory growing an internal `reset()` method. Mutating in place would mean hand-writing a second description of "what does fresh game state look like", which can drift out of sync with the factory's own body over time. Two independent recipes for the same state are a bug waiting to happen, even when both start out correct. Recreating needed **zero** changes to `Controller.js`, and it resets the computer's depleted move pool for free as a side effect.

**`cloneNode(true)` + `replaceChild` to shed listeners.** The reset can't just re-run the setup functions, because `addEventListener` is additive — re-running them stacks a second listener on top of the first, each closing over a different, stale controller. Swapping the element for a listener-free clone of itself drops every listener on the node and all its descendants in one move. The alternative would have been to bind listeners once and read current state through a mutable holder, but this app fully controls its own DOM lifecycle (unlike a framework constantly tearing down and rebuilding), so cloning is the simpler fit.

**Cloning is scoped deliberately, not applied broadly.** `#placement-container` and `#player-two-board` get cloned because they carry listeners. `#player-one-board` and `#combat-container` do **not** — nothing attaches listeners to them more than once, and `#combat-container` houses the reset button and the winner message, which need a stable identity across resets. The reset button's own listener is bound once at startup and survives every game precisely because its container is never cloned.

**An inversion-of-control callback for the name.** `displayController.init({ onBeginGame })` takes a function from `index.js` and calls it with the typed name once the form is submitted. The view doesn't need to know what happens next. That one indirection let "start" and "restart" collapse into a single `beginGame(name)` in `index.js`, called both from the form callback and from the reset button.

**A plain message, not a modal.** The winner announcement is a non-blocking `<div id="winner-message">` toggled visible. A modal was considered and ruled out on UX grounds: the message should stay informational and leave the finished boards visible and inspectable underneath, rather than throwing a backdrop over them.

**A `gameOver` flag owned by the controller.** Nothing originally stopped clicks after a win. Two distinct failure modes existed: after a *computer* win, `playTurn` returns early without calling `switchTurn()`, so the computer stays the active player — a further click would resolve the attack against the human's own board and corrupt the finished game. After a *human* win, extra clicks just re-fired the win message. The first fix was a flag inside `handlePlayerAttack`; it has since moved into `createGameController`, where `playTurn` sets it on a win and refuses every later move itself. The display just checks `gameController.isGameOver()`. That way the rule protects itself even if some future caller forgets to check, and it still needs no reset logic — a new controller starts with `gameOver = false`. (`removeEventListener` was ruled out — the listener is an anonymous arrow function with no stored reference to pass back in.)

**`winGame` stays in the display.** Moving the flag tempted me to move `winGame` too, but every line of it is DOM work — show the reset button, hide the header, write the winner's name. It never calculates anything; the only win calculation is `allShipsSunk()` inside `playTurn`. The controller decides, the display shows.

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

**Most of the refactor's bugs were silent, and `node --check` passed every time.** Moving state into the controller and building the AI produced the same handful of mistakes over and over. None of them is a syntax error; each one either throws only when that line runs, or quietly does the wrong thing:

| Mistake | What actually happens |
|---|---|
| `isGameOver = () => gameOver` (no `const`) | ES modules are strict mode: `ReferenceError` the moment the factory runs, so the game won't start |
| `if (gameController.isPlacementComplete)` (no `()`) | checks that the *function exists* — always truthy. This one hid the rotate button after the first ship and stacked five start-battle listeners, so one click fired five shots |
| `gameController.currentShipIndex` from outside | that's the private name; the getter is `shipIndex`. Gives `undefined`, and `undefined >= 5` is `false`, so the guard never fires |
| `[row - 1][col]` | a bare `[` makes a *new* array `[row - 1]`, then indexes it → `undefined`. Indexing needs a name in front: `board[row][col]`; a pair is `[row, col]` |
| `targetQueue.push[r, c]` | reads a property, calls nothing, no error |
| `return [a, b], [c, d]` | the **comma operator** returns only the last expression → one pair, not a list. Needs `[[a, b], [c, d]]` |
| `activeHits.map([, c] => c)` | destructured arrow parameters need brackets: `([, c]) => c` |
| `data: { sunkShipCells }` read as `data.shipCells` | a missing property is just `undefined`; the default `= []` hid it completely. Caught only by a test of the controller–gameboard handover |
| `rotateBtn` after deleting its declaration | throws only when the last ship is placed, by which point the ship has already been placed |

The reverse bracket mistake — calling a getter with `()` — at least throws (`is not a function`), so it's the missing `()` on a method to watch for.

**So I added ESLint.** `no-undef` catches the missing `const` and undefined names, and `no-unused-expressions` catches `push[…]`. Its first run also found six bits of unused code, which I deleted rather than kept "for later" — git history keeps them, and a lint report full of ignored warnings stops being read. It can't catch the property-name mismatch or the comma operator; tests have to.

**Test the handover between layers, not just each layer.** The sunk-ship bug lived in neither the gameboard nor the AI — both were correct on their own — but in the controller passing data between them. `tests/controller.test.js` now scripts the computer's shots with `jest.spyOn(computer, 'computerMove').mockReturnValueOnce(...)` and asserts exactly what `recordResult` received. I checked it by putting the bug back: one test failed. It needs two ships on the board, because a winning shot returns no `attackResult` and `recordResult` is never called.

**Fail loudly on "can't happen", don't retry silently.** A review suggested retrying the computer's move if it was ever invalid. With the deal-from-a-deck move list it can't be, and a silent retry would *hide* the bug if a future change broke that guarantee. If anything, log it with `console.error`.

**Use the editor's Rename Symbol (F2), not find-and-replace.** It's scope-aware, so it would have renamed `currentShipDirection` everywhere at once. It can't follow `gameController.someGetter` across files, because the parameter is untyped — that's what project-wide search is for.

**Migrating Webpack → Vite** partway through. Vite serves ES modules natively with no bundling in dev, so it needed far less configuration for what this project actually does. Jest still needs Babel (`babel.config.json` + `jest.config.js`) to transform ESM for the Node test environment — the two toolchains are separate concerns and both have to be configured.

### How the project actually progressed

Reading back through the commits, it fell into five phases:

- **Aug 28 – Sep 7 — logic first, test-driven.** `Gameboard` and `Ship` were built method by method, each one with its test written alongside. Not a single line of DOM code existed until the game was fully playable through the test suite. This was slower at the start and paid for itself completely later: when a UI bug appeared, I always knew the logic underneath was sound.
- **Sep 8 – Sep 13 — the UI, and a lot of refactoring.** Building the view exposed gaps in the model (the `Set` → `Map` change, extracting `isPlacementValid`). The interesting pattern is that the model kept getting *better* under pressure from the view, rather than the view growing workarounds for a model that didn't fit.
- **Sep 14 – Sep 18 — integration, then polish.** Wiring `gameController` into `displayController`, unifying turn management, then UX work on the setup and battle screens.
- **Sep 19 – Sep 20 — lifecycle.** Play again, the end-of-game message, and locking the board after a win. The notable thing here is that **all three features live entirely in `displayController` and `index.js`** — `Controller.js`, `Player.js`, `Gameboard.js` and `Ship.js` were not touched once. That's the separation from phase one paying a dividend three weeks later.
- **Sep 30 – Oct 2 — moving state down, and a smarter opponent.** The mirror image of phase four: placement state and the game-over flag moved *out of* `displayController` and *into* `Controller.js`, so the display shrank while the logic grew. Then the computer went from random to hunt and target in three steps — neighbours after a hit, follow the line, forget only the sunk ship. Through all of that, the display was untouched: it calls `automaticComputerMove()` and renders, and never knows how the move was chosen. ESLint and four tests arrived in the same stretch, mostly because of how many of the bugs were silent.

---

## Where I'd pick this up

Known gaps and rough edges, in roughly the order I'd tackle them:

- [ ] **Reset and the win message still have no test coverage.** The AI's targeting and the controller–AI handover are now tested, but reset and the win message are verified by hand only. Given that the listener-duplication bug is invisible on a first playthrough, this is the gap most likely to bite. The controller-owned `gameOver` guard is now testable without the DOM and is an easy first test.
- [ ] **Parity hunting.** While searching randomly, only fire where `(row + col) % 2 === 0` — every ship is at least 2 long, so it must cover one of those cells. Roughly halves the search for a few lines of change.
- [ ] **Pick a random target instead of `targets[0]`.** After a first hit the AI always tries up, down, right, left in that order, which a human could learn. One line.
- [ ] **Track which ships are still afloat.** Lets the AI skip gaps too small for any remaining ship and widen the parity spacing. Needs the `'sunk'` result to say which ship sank.
- [ ] **Possible end goal: a probability density map.** For every remaining ship, count every position it could still occupy; fire at the cell covered by the most. It replaces `getTargets`, `findLineTargets` and the random picker in one go, and parity, line-following and gap-skipping all emerge from it.
- [ ] **`createShip` accepts an `undefined` length.** `createShip('Frigate')` (not a preset, no custom length) passes both guards, because `undefined <= 0` and `undefined > 5` are both `false`, and gives a ship that can never sink. `!Number.isInteger(length) || length < 1 || length > 5` covers it. Nothing triggers it today.
- [x] ~~`automaticComputerMove` guards on `activePlayer.isHuman`, which the Player factory never exposes.~~ `createPlayer` now exposes `get isHuman()`.
- [ ] **The hover preview looks up cells with a document-wide `querySelector`.** After a first game, `#player-one-board` and `#player-two-board` also contain cells carrying the same `data-x`/`data-y` attributes, so the lookup only finds the right cell because `#placement-container` happens to come first in the HTML. Scoping the query to the placement board would make it correct by design rather than by document order.
- [ ] **`displayController.resetGame` is also the *start* path**, called by `beginGame` on the very first game. It works, but the name now undersells what it does — something like `startGame` would read more honestly.
- [ ] **No tests for `displayController` at all.** Everything below it is covered; the view isn't. Would need jsdom.
- [ ] Drag-and-drop ship placement, and a sound/animation pass.
- [x] ~~`currentShipIndex` and `currentDirection` are module-level mutable state in the display.~~ Moved into the controller.
- [x] ~~`npm test` runs Jest in `--watch` mode.~~ Split into `test` and `test:watch`.
- [x] ~~Unused imports in `displayController.js`.~~ Removed after ESLint flagged them.
- [x] ~~Smarter AI.~~ Hunt and target, with line-following and sunk-ship handling.

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
│       ├── Player.js           # createPlayer, hunt-and-target computer AI
│       ├── Controller.js       # createGameController — turns, placement, game over
│       └── displayController.js # all DOM rendering, event handling and reset machinery
├── tests/                      # one suite per logic module
├── eslint.config.mjs           # recommended rules + no-unused-expressions; browser, Jest and Node globals
├── jest.config.js              # babel-jest transform
└── babel.config.json           # preset-env targeting current node
```
