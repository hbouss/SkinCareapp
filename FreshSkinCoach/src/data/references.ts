// src/data/references.ts
export interface Reference {
  title: string;
  url:   string;
  desc?: string;
}

export const REFERENCES: Reference[] = [
  {
    title: "Société Française de Dermatologie – Exfoliation et régénération cutanée",
    url:   "https://www.sfdermato.org/fiches-procedures/exfoliation",
    desc:  "Recommandations sur les protocoles d’exfoliation en institut."
  },
  {
    title: "Haute Autorité de Santé – Peau sèche : prise en charge",
    url:   "https://www.has-sante.fr/jcms/c_2988275/fr/peau-seche-prise-en-charge",
  },
  {
    title: "Journal of Cosmetic Dermatology – Skin Hydration (2021)",
    url:   "https://doi.org/10.1111/jocd.14001",
    desc:  "Étude sur l’efficacité des soins hydratants."
  },
];