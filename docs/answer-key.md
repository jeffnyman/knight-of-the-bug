# Seeded bugs: the answer key

This file gives away every deliberately seeded bug. Hide it before handing
the game to a class.

## How the bugs are switched on

Nothing is broken by default. Add `?bugs=` to the address with a comma
separated list of ids, or `all`:

```
http://localhost:5173/?bugs=all
http://localhost:5173/?bugs=loot-lost,door-blind
http://localhost:5173/?seed=7&bugs=weak-is-strong
```

The game log then says "Bug hunt mode: this build has N deliberately
seeded bugs", without naming them. The browser console lists the ids.

Each bug is a single `hasBug("id")` check in the source. The registry is
`src/util/bugs.js`. The executable answer key is `tests/seeded-bugs.test.js`,
which switches each bug on in turn and asserts the broken behaviour; the
ordinary suite asserts the correct behaviour with every bug off, so for
each bug there is a named test that would have caught it.

## The bugs

### an-article — equivalence classes

| | |
|---|---|
| Where | `src/entity.js`, `describeA()` |
| What | The vowel class is `[aei]` instead of `[aeiou]`. Words starting with o or u get "a". |
| Symptom | "You pass through a open door." "You see a off-by-one error." "A unit test is lying here." |
| Reproduce | Any seed. Open and walk through a door on layer 1, or find an off-by-one error on layer 2. |
| Lesson | The vowels are one equivalence class. Testing with "edge case" and "infinite loop" passes; only a representative from each member of the class finds the hole. |
| Caught by | `tests/entity.test.js`, "chooses the indefinite article by the first letter" (add an o or u word to make it bite). |

### board-edge — boundary values

| | |
|---|---|
| Where | `src/combat/combat.js`, `handleKeyEvent()` |
| What | The cursor wraps with a plain `%` remainder instead of the sign-safe `mod()`. Negative values are not wrapped. |
| Symptom | In a Debug Session, press Left in the leftmost column or Down in the bottom row: the cursor vanishes off the board. Right and Up still wrap correctly. |
| Reproduce | Any seed. Start a fight (layer 1 has a tame typo: stand next to it, Shift+direction, choose Debug). The cursor starts bottom-left; press Left. |
| Lesson | Boundaries at both ends of a range, in every direction. Testing only one edge, or only the positive wrap, passes. |
| Caught by | `tests/combat/combat.test.js`, "moves the cursor with wrap-around, up being up". |

### health-overflow — properties and invariants

| | |
|---|---|
| Where | `src/being/being.js`, `adjustStat()` |
| What | The upper clamp is skipped. Health can exceed its maximum. The lower clamp still works. |
| Symptom | Drink coffee at or near full health: the status panel reads 30/20 health. |
| Reproduce | Any seed. Layer 1 always has a coffee in one of its rooms; walk onto it at full health and press Enter. |
| Lesson | "Health is never above its maximum" is an invariant. A property-based test that heals random amounts from random states finds this immediately; an example test that only heals from low health never does. |
| Caught by | `tests/being/being.test.js`, "clamps stats between zero and their maximum". |

### loot-lost — mutation testing

| | |
|---|---|
| Where | `src/being/being.js`, `die()` |
| What | `items.length > 0` became `items.length > 1`. A crushed being carrying exactly one item drops nothing. |
| Symptom | Crushing a typo, warning or edge case never leaves a bug report behind. Bigger bugs carrying a tool as well still drop something. |
| Reproduce | Any seed. Crush the tame typo on layer 1 and look at the floor where it stood. |
| Lesson | This is a classic relational-operator mutant. A test that only checks "something was dropped" for a being carrying two items survives the mutation; the boundary case of one item kills it. |
| Caught by | `tests/being/being.test.js`, "drops one carried item when dying on floor". |

### door-blind — state and events

| | |
|---|---|
| Where | `src/level/cells.js`, `Door.open()` |
| What | Opening a door no longer publishes `topology-change`, so the player's field of view is not recomputed. Closing still works. |
| Symptom | Open a closed door with a modifier and a direction: the corridor behind it stays dark until you take a step. |
| Reproduce | Any seed. The starting room on layer 1 always has closed doors. |
| Lesson | A state change and the event announcing it are two separate things. Test the observable consequence (what can be seen), not just the state (the door is open). |
| Caught by | `tests/being/pc.test.js`, "re-evaluates its view when a door changes". |

### layer-label — off by one in output

| | |
|---|---|
| Where | `src/level/level.js`, `activate()` |
| What | The welcome message prints the layer number plus one. |
| Symptom | The log says "Welcome to layer 2." while the status panel says "Layer 1." It repeats on every staircase: layer 2 is welcomed as 3, and so on. |
| Reproduce | Any seed. Visible the moment the game starts, if you compare the log with the status panel. |
| Lesson | Two displays of the same fact should agree. Cross-checking outputs against each other is cheap and finds inconsistencies a single assertion misses. |
| Caught by | `tests/level/level.test.js`, "activates by placing the player and queueing every being" (extend it to assert the welcome text). |

### defense-ignored — calculation mutant

| | |
|---|---|
| Where | `src/being/being.js`, `getDefense()` |
| What | Returns the base defense and ignores carried items. Attack items still work. |
| Symptom | A unit test, code review or type checker shows in the status panel with its bonus, but damage taken does not change. |
| Reproduce | Any seed, but it needs a defensive item (layer 2 and above) and a calculation. Damage taken is `attack + power - defense`, minimum 1. With a +2 item equipped, each enemy blow should do 2 less than it would otherwise. In development builds, `kotb.pc.getDefense()` in the console shows the number directly. |
| Lesson | A visible symptom (the item appears) is not proof of the behaviour (the item works). Numbers have to be checked against a model. |
| Caught by | `tests/being/being.test.js`, "adds item modifiers to attack and defense". |

### weak-is-strong — seed-dependent data

| | |
|---|---|
| Where | `src/item/item.js`, `Drinkable` constructor |
| What | The random adjustment is applied as an absolute value, so a drink named "weak" is as strong as a "strong" one. |
| Symptom | A weak coffee restores 15 health instead of 5. |
| Reproduce | Only when a weak drink is generated, which depends on the seed. With `?seed=7` (also 1, 3, 11, 12 and 17) the coffee on layer 1 is weak. Take some damage from tangled code first or compare against the message: a weak coffee from 10/20 health should leave you at 15/20, not 20/20. |
| Lesson | Some bugs live in data the random generator only sometimes produces. Without a reproducible seed the report "coffee healed too much once" cannot be confirmed; with one it is a one-line repro. |
| Caught by | `tests/item/items.test.js`, "varies the strength by half, and names the result". |

## Suggested order for a class

1. `an-article` and `layer-label`: visible in the first minute, teach reading the output carefully.
2. `door-blind` and `loot-lost`: need a hypothesis and a deliberate experiment.
3. `board-edge` and `health-overflow`: boundary and invariant thinking.
4. `defense-ignored` and `weak-is-strong`: need a model of the rules and a reproducible seed.
