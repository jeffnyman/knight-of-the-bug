// A tiny template formatter for game messages, modelled on the one the
// original rot.js build bolted onto String. Placeholders are consumed in
// order from the remaining arguments:
//
//   %s            the argument's toString()
//   %the / %The   "the typo"       via describeThe()
//   %a / %A       "a typo"         via describeA()
//   %it / %It     "it", "her"...   via describeIt()
//   %{verb,hit}   "hits"           via describeVerb("hit")
//
// A placeholder starting with a capital letter capitalises its result,
// which is how sentences can begin with "%The".
const METHODS = {
  s: "toString",
  the: "describeThe",
  a: "describeA",
  it: "describeIt",
  verb: "describeVerb",
};

const PLACEHOLDER = /%(?:([a-zA-Z]+)|{([^}]+)})/g;

export function format(template, ...args) {
  return template.replace(PLACEHOLDER, (match, word, braced, index) => {
    // A doubled percent sign escapes the placeholder.
    if (template.charAt(index - 1) == "%") {
      return match.substring(1);
    }

    if (!args.length) {
      return match;
    }

    let parts = (word || braced).split(",");
    let name = parts.shift();
    let method = METHODS[name.toLowerCase()];

    if (!method) {
      return match;
    }

    let target = args.shift();
    let replaced = String(target[method](...parts));

    let first = name.charAt(0);
    if (first != first.toLowerCase()) {
      replaced = replaced.charAt(0).toUpperCase() + replaced.substring(1);
    }

    return replaced;
  });
}
