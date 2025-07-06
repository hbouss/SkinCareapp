import fr from "./labels.fr.json";

export function translateLabel(key: string): string {
  // si la clé n'existe pas, on renvoie la clé brute (ou un fallback générique)
  return (fr as Record<string, string>)[key] || key;
}