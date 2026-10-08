# Knight of the Bug

**A Pedagogical Exploration into Bug Hunting**

A small browser roguelike used as a teaching vehicle for bug finding and
exploratory testing in a JavaScript ecosystem. It is a game you can play,
a codebase you can read, and a system you can test.

The game is based on [Sleeping Beauty](https://github.com/ondras/sleeping-beauty),
a 7DRL game by Ondřej Žára, used and reframed with his written permission
(see `assets/permission.png`). The font is
[Metrickal](https://github.com/davelab6/metrickal-typeface) by Robey Pointer.
This version is
released under the MIT License; the original's ISC terms and the other
third-party notices are in [LICENSE](LICENSE).

## The story

A core feature has gone dormant. It lies on the top layer of a tower of
code, eight layers high, each deeper in abstraction and more dangerous than
the last. The tower is infested: typos and warnings near the bottom, off-by-one
errors, null pointers and race conditions further up, dead code, regressions,
infinite loops and stack overflows near the top. Guarding the feature is the
Bug itself, the one that put it to sleep. You are the tester sent to crush
it and wake the feature.

Every renamed thing, from the original's princess to the bugs and tools here,
is listed in [docs/theme.md](docs/theme.md), along with the one addition the
original did not have: the Bug as a boss.

## How to play

Start the game, press Enter on the title screen, and you are on layer 1.

| Key | Does |
|---|---|
| Arrow keys, numpad or vi keys (h j k l y u b n) | move |
| Space | wait a turn |
| Enter | pick up what you are standing on, or use a staircase |
| Modifier (Shift, Ctrl, Alt or Cmd) plus a direction | interact: open or close a door, or deal with whoever is there |
| 1 to 9, 0 or Escape | choose from a menu in the log |

Interacting with a being offers a choice: poke it, talk to it, or debug it.
Debugging starts a **Debug Session**, a puzzle on a six by six board of
symbols. Move the cursor onto a group of two or more matching symbols and
press Enter. The group vanishes, the symbols above fall into the gap, and the
group's kind decides what happens: `+` is you patching the bug, `x` is the
bug striking you, `*` is you refactoring (which costs focus) and `~` is the
bug corrupting you (costing it focus). The size of the group is the power of
the blow. The session ends when one side runs out of health.

Along the way you find tools (print statements, debuggers, profilers,
fuzzers, test harnesses) that improve your attack, safeguards (unit tests,
code reviews, type checkers) that improve your defense, coffee and energy
drinks that restore health and focus, the occasional all-nighter, and bug
reports to collect. Tangled code can be walked through but may cut you.

The game explains its own mechanics as you play: the first item, the first
door, the first being and the first fight each come with a hint in the log,
and nothing is explained before you meet it. That is deliberate. Learning
the rules of a system by using it, forming a model of how it works, and then
checking that model against what the system actually does is the core of
exploratory testing. Treat the first playthrough as a charter: what did the
game tell you, what did it leave you to work out, and where did your model
turn out to be wrong?

The game can be won, by crushing the Bug on layer 8, and lost, by running
out of health in any Debug Session. There is no saving. Reload to start a new
hunt.

## For testers

**Reproducing a run.** Everything random flows from one seed. The game logs
it when play starts; add it to the address to replay the same tower, the same
bugs and the same loot:

```
http://localhost:5173/?seed=1791370004974
```

A bug report that includes the seed and the keys pressed is a complete
reproduction.

**Looking inside.** In development builds the running game is exposed on the
browser console as `window.kotb`: the player, the actor queue, combat, the
log, the seed and every generated layer. It is there for inspecting state
while reproducing something, and for the kind of testing that cannot be done
from the keyboard alone.

**Reading the code.** The source is small and plain JavaScript with no
framework. `src/rules.js` holds every tunable number. `src/level/` generates
and furnishes the tower, `src/being/` has the player and the bugs,
`src/item/` the loot, `src/combat/` the Debug Session, and `src/ui/` the
panels. Each module has a test file under `tests/` with the same name; the
suite doubles as a worked example of what testing this kind of system looks
like.

**Seeded bugs.** The game can be loaded with deliberately planted bugs for a
bug-hunting exercise. None are active by default. Add `?bugs=all`, or a comma
separated list of ids, to the address:

```
http://localhost:5173/?bugs=all
http://localhost:5173/?seed=7&bugs=all
```

The log then says how many bugs are in play, but not which. Each one is tied
to a testing technique: equivalence classes, boundary values, invariants,
mutation, state and events, output cross-checking, calculation, and
seed-dependent data. The ids, what each breaks, how to reproduce it and
which test would have caught it are in `docs/answer-key.md`, which is meant to
be kept from the class.

## Development

```
npm install
npm run dev       # start the Vite dev server
npm run build     # production build into dist/
npm run preview   # serve the production build
npm test          # run the Vitest suite once
npm run test:watch
npm run lint      # ESLint + Stylelint
```

Plain JavaScript modules, plain CSS, [Vite](https://vite.dev/) for building,
[Vitest](https://vitest.dev/) for tests, and
[rot-js](https://ondras.github.io/rot.js/hp/) for the map display, field of
view, noise and random numbers.
