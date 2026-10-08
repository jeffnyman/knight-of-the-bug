// The four kinds of block on the combat board, and the colour each is
// drawn in. Matching a run of one kind performs that action.
export const ATTACK_1 = "a1"; // the player attacks
export const ATTACK_2 = "a2"; // the enemy attacks
export const MAGIC_1 = "m1"; // the player casts
export const MAGIC_2 = "m2"; // the enemy casts

// Each kind also has its own glyph, so the board can be read without
// relying on colour alone.
export const GLYPHS = {
  [ATTACK_1]: "+",
  [ATTACK_2]: "x",
  [MAGIC_1]: "*",
  [MAGIC_2]: "~",
};

export const COLORS = {
  [ATTACK_1]: "#0f0",
  [ATTACK_2]: "#f00",
  [MAGIC_1]: "#00f",
  [MAGIC_2]: "#ff3",
};
