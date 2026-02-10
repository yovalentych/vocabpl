export function getPolishConjugationUrl(verb: string) {
  const trimmed = verb.trim();
  return `https://pl.bab.la/koniugacja/polski/${encodeURIComponent(trimmed)}`;
}

export function getPolishAdjectiveDeclensionUrl(adjective: string) {
  const trimmed = adjective.trim();
  return `https://odmiana.net/odmiana-przez-przypadki-przymiotnika-${encodeURIComponent(trimmed)}`;
}
