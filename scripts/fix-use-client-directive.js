#!/usr/bin/env node
/**
 * Detecte les fichiers ou la directive "use client" n'est pas la premiere
 * instruction (elle doit etre tout en haut, avant tout import/expression).
 * Cause: un script a insere des lignes (import / export const dynamic) AU-DESSUS
 * de la directive, ce que Turbopack refuse.
 *
 * Mode --fix : deplace la directive "use client" en tete (apres un eventuel BOM),
 * en conservant l'ordre relatif des autres lignes.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'src');
const fix = process.argv.includes('--fix');
const broken = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) inspect(full);
  }
}

const DIRECTIVE = /^\s*['"]use client['"]\s*;?\s*$/;

function inspect(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const hasBom = raw.charCodeAt(0) === 0xfeff;
  const content = hasBom ? raw.slice(1) : raw;
  const lines = content.split(/\r?\n/);

  // Index de la directive "use client"
  const dirIdx = lines.findIndex((l) => DIRECTIVE.test(l));
  if (dirIdx === -1) return; // pas de directive

  // Determiner le premier index "significatif" (hors lignes vides et commentaires)
  let firstSignificant = -1;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t === '') continue;
    if (t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || t.startsWith('*/')) continue;
    firstSignificant = i;
    break;
  }

  // OK si la directive est la premiere instruction significative.
  if (dirIdx === firstSignificant) return;

  broken.push(file);

  if (!fix) return;

  // Retirer TOUTES les occurrences de la directive, puis la remettre en tete.
  const withoutDirective = lines.filter((l) => !DIRECTIVE.test(l));
  // Retirer les lignes vides de tete pour un rendu propre.
  while (withoutDirective.length && withoutDirective[0].trim() === '') {
    withoutDirective.shift();
  }
  const rebuilt = ["'use client';", '', ...withoutDirective].join('\n');
  fs.writeFileSync(file, (hasBom ? '\ufeff' : '') + rebuilt, 'utf8');
}

walk(root);

if (fix) {
  console.log(`Corrige ${broken.length} fichier(s) (directive "use client" remontee en tete).`);
} else {
  console.log(`${broken.length} fichier(s) avec "use client" mal placee:`);
  broken.slice(0, 20).forEach((f) => console.log('  ' + path.relative(root, f)));
  if (broken.length > 20) console.log(`  ... (+${broken.length - 20})`);
}
