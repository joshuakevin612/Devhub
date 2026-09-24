// A subset of GitHub Linguist's language colors, for the language bars.
// Anything not in this table falls back to a deterministic hashed hue so
// the same language always renders the same color without needing the
// full ~500-entry Linguist palette.
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178C6",
  JavaScript: "#F1E05A",
  Python: "#3572A5",
  Java: "#B07219",
  Go: "#00ADD8",
  Rust: "#DEA584",
  C: "#555555",
  "C++": "#F34B7D",
  "C#": "#178600",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  HTML: "#E34C26",
  CSS: "#563D7C",
  Shell: "#89E051",
  Vue: "#41B883",
  Scala: "#C22D40",
  Elixir: "#6E4A7E",
  Haskell: "#5E5086",
  Lua: "#000080",
  R: "#198CE7",
  Dockerfile: "#384D54",
  MATLAB: "#E16737",
  Perl: "#0298C3",
  "Objective-C": "#438EFF",
};

function hashColor(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

export function languageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? hashColor(language);
}
