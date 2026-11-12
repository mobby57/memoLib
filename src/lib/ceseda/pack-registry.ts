import type { LegalPack } from './types';
import { vpfPack } from './packs/titres-sejour/vpf.pack';
import { salariePack } from './packs/titres-sejour/salarie.pack';
import { oqtf48hPack } from './packs/eloignement/oqtf-48h.pack';
import { irtfPack } from './packs/eloignement/irtf.pack';
import { cndaPack } from './packs/asile/cnda.pack';
import { regroupementFamilialPack } from './packs/regroupement-familial/ofii.pack';

export const ALL_PACKS: LegalPack[] = [
  vpfPack,
  salariePack,
  oqtf48hPack,
  irtfPack,
  cndaPack,
  regroupementFamilialPack,
];

export function getPackById(id: string): LegalPack | undefined {
  return ALL_PACKS.find((p) => p.id === id);
}

export function getPacksByCategory(category: LegalPack['category']): LegalPack[] {
  return ALL_PACKS.filter((p) => p.category === category);
}

export function getAvailableCategories(): LegalPack['category'][] {
  return Array.from(new Set(ALL_PACKS.map((p) => p.category)));
}