/**
 * Parser des fichiers des depots Legifrance
 *
 * Les depots GitHub contiennent des fichiers Markdown structurés
 * avec les articles de loi. Ce module les parse pour la recherche locale.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';
import { GIT_SOURCES } from './git-sources';

export interface ParsedArticle {
  id: string;
  code: string;
  numero: string;
  titre: string;
  contenu: string;
  section?: string;
  etat: 'VIGUEUR' | 'ABROGE' | 'INCONNU';
  filePath: string;
}

/**
 * Parcourt recursivement un repertoire et retourne les fichiers .md et .txt
 */
function walkDir(dir: string, exts = ['.md', '.txt']): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        results.push(...walkDir(full, exts));
      } else if (entry.isFile() && exts.some((e) => entry.name.endsWith(e))) {
        results.push(full);
      }
    }
  } catch { /* repertoire inaccessible */ }
  return results;
}

/**
 * Extrait le nom du code depuis le chemin du fichier
 * Ex: .../Les-codes-en-vigueur/Code civil/... → "Code civil"
 */
function extractCodeName(filePath: string): string {
  const codesRoot = GIT_SOURCES.find((s) => s.name === 'codes')?.localPath || '';
  const rel = path.relative(codesRoot, filePath);
  const parts = rel.split(path.sep);
  return parts[0] || 'Inconnu';
}

/**
 * Parse un fichier Markdown en articles
 * Detecte les patterns: # Article Lxxx-xx, ## Article Rxxx-xx, etc.
 */
function parseMarkdownFile(filePath: string, codeName: string): ParsedArticle[] {
  const content = readFileSync(filePath, 'utf-8');
  const articles: ParsedArticle[] = [];

  // Pattern: titres Markdown contenant "Article" suivi d'un numero
  const articleRegex = /^#{1,4}\s+(?:Article\s+)?([A-Z]?\d[\w.-]*)\s*$/gm;
  const matches = [...content.matchAll(articleRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const numero = match[1];
    const startIdx = match.index! + match[0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    const contenu = content.slice(startIdx, endIdx).trim();

    if (contenu.length < 5) continue; // skip vides

    articles.push({
      id: `${codeName}:${numero}`.replace(/\s+/g, '_'),
      code: codeName,
      numero,
      titre: `Article ${numero}`,
      contenu,
      etat: 'VIGUEUR',
      filePath,
    });
  }

  // Si aucun article detecte, indexer le fichier entier comme un bloc
  if (articles.length === 0 && content.length > 20) {
    const fileName = path.basename(filePath, path.extname(filePath));
    articles.push({
      id: `${codeName}:${fileName}`.replace(/\s+/g, '_'),
      code: codeName,
      numero: fileName,
      titre: fileName,
      contenu: content.slice(0, 10_000), // limiter la taille
      etat: 'VIGUEUR',
      filePath,
    });
  }

  return articles;
}

/**
 * Parse tous les articles de la Constitution
 */
export function parseConstitution(): ParsedArticle[] {
  const source = GIT_SOURCES.find((s) => s.name === 'constitution');
  if (!source) return [];

  const files = walkDir(source.localPath);
  return files.flatMap((f) => parseMarkdownFile(f, 'Constitution'));
}

/**
 * Parse les articles d'un code specifique
 * @param codeName ex: "Code civil", "CESEDA", "Code penal"
 */
export function parseCode(codeName: string): ParsedArticle[] {
  const source = GIT_SOURCES.find((s) => s.name === 'codes');
  if (!source) return [];

  const codeDir = path.join(source.localPath, codeName);
  try {
    statSync(codeDir);
  } catch {
    // Chercher par correspondance partielle
    const dirs = readdirSync(source.localPath, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.toLowerCase().includes(codeName.toLowerCase()));
    if (dirs.length === 0) return [];
    return walkDir(path.join(source.localPath, dirs[0].name))
      .flatMap((f) => parseMarkdownFile(f, dirs[0].name));
  }

  return walkDir(codeDir).flatMap((f) => parseMarkdownFile(f, codeName));
}

/**
 * Liste les codes disponibles dans le depot
 */
export function listAvailableCodes(): string[] {
  const source = GIT_SOURCES.find((s) => s.name === 'codes');
  if (!source) return [];

  try {
    return readdirSync(source.localPath, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

/**
 * Parse tous les codes disponibles (attention: peut etre volumineux)
 */
export function parseAllCodes(): ParsedArticle[] {
  return listAvailableCodes().flatMap(parseCode);
}
