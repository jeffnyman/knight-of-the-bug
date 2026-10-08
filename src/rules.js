// Tunable game balance. Everything here is a plain number so the whole
// feel of the game can be adjusted in one place.

// How close (in cells) a hostile being has to be before it starts
// chasing the player instead of wandering.
export const AI_RANGE = 7;

// The chance that a wandering being stays put for a turn.
export const AI_IDLE = 0.4;

// How far the player can see.
export const PC_SIGHT = 8;

// The layer where the game ends.
export const LAST_LEVEL = 8;

// The Bug that guards the dormant feature on the top layer.
export const BUG_HP = 60;
export const BUG_MANA = 30;
export const BUG_ATTACK = 15;
export const BUG_DEFENSE = 12;

// How much a drink restores before random strength adjustments.
export const POTION_HP = 10;
export const POTION_MANA = 10;

// The chance that a wearable item also skews the combat board.
export const COMBAT_MODIFIER = 0.4;

// The chance that a randomly generated being is hostile.
export const HOSTILE_CHANCE = 0.7;

// The chance of taking a point of damage when walking through tangled code.
export const TANGLED_CODE_CHANCE = 0.5;

// How much maximum health the player gains on reaching a new floor.
export const LEVEL_HP = 4;

// The per-turn chance of regenerating one point of health or mana.
export const REGEN_HP = 0.05;
export const REGEN_MANA = 0.1;
