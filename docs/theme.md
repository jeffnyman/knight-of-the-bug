# Theme: from Sleeping Beauty to Knight of the Bug

Knight of the Bug keeps the mechanics of Sleeping Beauty intact and swaps
the story. The tower is a codebase. Its floors are layers of abstraction,
each deeper and more dangerous than the last. The bugs that infest it are
the enemies. The sleeping princess is a core feature lying dormant on the
top layer, and the player is a tester fighting through the bugs to reach
and restore it.

This table records every mapping so the original can always be compared
with the port.

## World

| Original | Knight of the Bug | Notes |
|---|---|---|
| tower floor | layer | "Welcome to layer 3." |
| dense brambles `%` | tangled code `%` | still passable, still cuts you |
| princess `P` | dormant feature `F` | the goal, blocks movement |
| pillar, floor, wall, door, staircase | unchanged | |
| Game of Thorns | Debug Session | the combat board |
| mana | focus | internal stat name is still `mana` |
| health | health | |

## Bugs (formerly monsters)

| Original | Class | Name | Glyph | Danger |
|---|---|---|---|---|
| rat | `Typo` | typo | `t` | 1 |
| bat | `Warning` | warning | `w` | 1 |
| goblin | `OffByOne` | off-by-one error | `o` | 2 |
| orc | `NullPointer` | null pointer | `n` | 3 |
| spider | `EdgeCase` | edge case | `e` | 3 |
| orcish witch | `RaceCondition` | race condition | `R` | 4 |
| poisonous snake | `Heisenbug` | heisenbug | `h` | 4 |
| skeleton | `DeadCode` | dead code | `d` | 5 |
| ogre | `InfiniteLoop` | infinite loop | `O` | 6 |
| zombie | `Regression` | regression | `z` | 6 |
| minotaur warrior | `StackOverflow` | stack overflow | `S` | 8 |
| animated tree | `FlakyTest` | flaky test | `f` | 8, rooted |
| hero | `Colleague` | e.g. "senior tester" | first letter of role | friendly |

Hit points, attack, defense, focus and carried items are unchanged. All
bugs are referred to as "it". Colleagues are "them".

Colleague seniorities: junior, senior, staff, principal, freelance,
veteran. Roles: tester, developer, debugger, reviewer.

## Items

| Original | Class | Name | Slot | Modifies |
|---|---|---|---|---|
| dagger | `PrintStatement` | print statement | tool | attack +1 |
| sword | `Debugger` | debugger | tool | attack +2 |
| axe | `Profiler` | profiler | tool | attack +3 |
| mace | `Fuzzer` | fuzzer | tool | attack +3 |
| greatsword | `TestHarness` | test harness | tool | attack +4 |
| shield | `UnitTest` | unit test | test | defense +2 |
| helmet | `CodeReview` | code review | review | defense +1 |
| armor | `TypeChecker` | type checker | checker | defense +2 |
| health potion | `Coffee` | coffee | drink | restores health |
| mana potion | `EnergyDrink` | energy drink | drink | restores focus |
| lutefisk | `AllNighter` | all-nighter | drink | full health, no focus |
| golden coin | `BugReport` | bug report | report | stacks |

Prefixes:

| Slot | Original | Knight of the Bug |
|---|---|---|
| tool | sharp +1, blunt -1, epic +2 | handy +1, clunky -1, legendary +2 |
| test | small -1, large +1, tower +2 | flaky -1, thorough +1, exhaustive +2 |
| review, checker | leather +1, iron +2, tempered +3 | quick +1, careful +2, rigorous +3 |

Combat suffixes (an item that skews the board):

| Board kind | Original | Knight of the Bug |
|---|---|---|
| you attack | of power | of patching |
| enemy attacks | of treachery | of fragility |
| you attack (magic) | of magical domination | of refactoring |
| enemy attacks (magic) | of magical weakness | of corruption |

## Combat legend

| Original | Knight of the Bug |
|---|---|
| You attack | You patch |
| Enemy attacks | Bug strikes |
| You attack (magic) | You refactor (focus) |
| Enemy attacks (magic) | Bug corrupts (focus) |

Combat messages: "X hits Y" becomes "X strikes at Y", "casts a spell at"
becomes "casts a hotfix at", "damages" becomes "weakens", and "kills"
becomes "crushes".

## Interactions

| Original | Knight of the Bug |
|---|---|
| Kiss it gently to wake it up | Poke it to see what happens |
| Talk to it | Talk to it |
| Attack it | Debug it |
| "You attack the rat." | "You start debugging the typo." |

## Messages

| Original | Knight of the Bug |
|---|---|
| A truly beautiful day for a heroic action! | A truly beautiful day for a bug hunt! |
| This tower is surrounded by plains and trees and there might be a princess sleeping on the last floor. | This tower of code is surrounded by plains and trees, and somewhere on its top layer a core feature lies dormant. |
| Apparently the only way to get to her is to advance through all tower levels. | Apparently the only way to reach it is to work your way up through every layer. |
| Ouch! You injure yourself on a thorn. | Ouch! You cut yourself on a sharp edge. |
| You eat the lutefisk. You feel weird. | You pull the all-nighter. You feel wired. |
| You are completely healed. | You feel completely refreshed. |
| Your mana is completely refilled. | Your focus is completely restored. |
| Welcome to the last floor! | Welcome to the top layer! |
| You finally managed to reach the princess and finish the game. | You finally reached the dormant feature and finished the hunt. |
| ...accumulate a total of N golden coins. | ...filed a total of N bug reports. |
| Combat in Sleeping Beauty happens by playing the Game of Thorns... | Combat in Knight of the Bug happens by running a Debug Session... |

Colleague chatter and the top-layer warnings are rewritten in
`src/being/beings.js`. The splash screen tidbits are in
`src/screens/splash/tidbit.js`.

## Unchanged on purpose

Tutorial hints, door and staircase messages, "Game over!", the "does not
seem to be amused" rebuff, and every number: hit points, danger ratings,
regeneration, drop chances and the eight-layer tower.

## The Bug (an addition to the original)

Sleeping Beauty ends the moment you reach the princess. Knight of the Bug
adds a boss: the Bug itself, the one that put the feature to sleep.

| | |
|---|---|
| Class | `TheBug` in `src/being/beings.js` |
| Glyph | `B`, red |
| Where | the top layer, one cell west of the dormant feature |
| Behaviour | hostile and rooted: it never moves, but attacks whoever stands next to it |
| Stats | `BUG_HP`, `BUG_MANA`, `BUG_ATTACK`, `BUG_DEFENSE` in `src/rules.js` |
| Danger rating | none, so the factory never produces a second one |

Arriving on the top layer now says the feature is here and so is the Bug.
When the Bug dies it publishes `bug-defeated`. The decorator wakes the
feature (it becomes a green "restored feature") and, once the combat turn
has finished, plays the outro: "The Bug is crushed!", congratulations,
the count of bug reports filed, and Escape to continue wandering.

The colleagues standing around the hall now warn about the Bug instead of
warning against kissing.

## Fixes for issues reported against the original

The original's issue tracker had three open reports. All are addressed
here, along with one closed report whose fix was only half visible.

| Upstream issue | What was wrong | What Knight of the Bug does |
|---|---|---|
| #1 modifier + arrow navigates the browser | Cmd+Left (macOS) or Alt+Left (Windows, Linux) went back a page; arrows and Space scrolled | the keyboard module prevents the browser's default for every key the game handles, while a consumer is listening |
| #3 doors next to each other | a corridor along a room's outline became a wall of doors | a door is never placed next to an existing door |
| #4 colour-blind players cannot tell the combat blocks apart | all four kinds were `#` in four colours | each kind has its own glyph (`+` patch, `x` strike, `*` refactor, `~` corrupt) on the board, in the legend and in the status panel |
| #6 stuck behind another being with no way to wait | fixed upstream by adding Space, but nothing told the player | the intro and the first bump into a being both mention Space |
