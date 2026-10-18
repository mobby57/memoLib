#!/usr/bin/env python3
"""
MemoLib - Lot 4 : jetons OAuth chiffres + controle de session des callbacks
===========================================================================

Deux phases, a deployer l'une APRES l'autre :

  --phase 1 : helper src/lib/security/oauth-tokens.ts + son test unitaire, et
              LECTURE tolerante des jetons dans le cron email-sync. Aucun
              changement pour les jetons deja en clair, aucune cle requise.

  --phase 2 : ECRITURE chiffree (callbacks Gmail et Outlook + renouvellement
              dans le cron) + controle de session dans les deux callbacks.

Ce script :
  - est en SIMULATION par defaut : il affiche le diff et n'ecrit RIEN ;
  - avec --apply : sauvegarde dans ~/backups_lot4/<date>/ (hors depot), puis
    ecrit, avec retour arriere automatique si une ecriture echoue ;
  - refuse de s'appliquer si l'empreinte SHA-256 d'un fichier n'est pas celle
    de la version lue pendant l'audit, si un motif n'est pas trouve exactement
    le nombre de fois attendu, ou (avec --apply) si tu es sur la branche main ;
  - ne lance NI test, NI npm, NI reseau ; il ne fait que des lectures Git
    (rev-parse) ;
  - ne fait AUCUN git add, commit, push ni switch.

Usage (bash, WSL) :
  python3 lot4_oauth_tokens.py --phase 1             # simulation
  python3 lot4_oauth_tokens.py --phase 1 --apply     # apres avoir cree une branche
"""

from __future__ import annotations

import argparse
import datetime
import difflib
import hashlib
import shutil
import subprocess
import sys
from pathlib import Path

REPO_PAR_DEFAUT = Path.home() / "projects" / "memolib"
HEAD_ATTENDU = "041dcf28"

CRON = "src/app/api/cron/email-sync/route.ts"
GMAIL = "src/app/api/email/connect/gmail/callback/route.ts"
OUTLOOK = "src/app/api/email/connect/outlook/callback/route.ts"
HELPER = "src/lib/security/oauth-tokens.ts"
TEST = "src/__tests__/lib/security/oauth-tokens.test.ts"

# Empreintes des fichiers tels qu'ils ont ete lus pendant l'audit (main, 041dcf28).
SHA_ORIGINE = {
    CRON: "6fd98b3b42be37e22799fd11fa04da848bb47c22d109852fbe64e3905943960c",
    GMAIL: "2a5100646a5745bdf3829908934971b77dca3c134ae39bb5ed5e89d237edb983",
    OUTLOOK: "b5ac2d4dd9ee29d53179e371816619280e7d2615d134f33add8ac58d3a7bb1cf",
}

# ---------------------------------------------------------------------------
# Contenu des fichiers crees
# ---------------------------------------------------------------------------

HELPER_TS = r"""import { EncryptionService } from '@/lib/security/encryption';

// Format produit par EncryptionService.encrypt : iv:authTag:chiffre (hexadecimal).
const CHIFFRE = /^[a-f\d]{32}:[a-f\d]{32}:[a-f\d]*$/i;

export function isEncryptedToken(valeur: string): boolean {
  return CHIFFRE.test(valeur);
}

/** Chiffre un jeton OAuth avant stockage (idempotent). */
export function encryptToken(valeur: string): string {
  return isEncryptedToken(valeur) ? valeur : EncryptionService.encrypt(valeur);
}

/**
 * Dechiffre un jeton OAuth. Un ancien jeton en clair est renvoye tel quel.
 * Un jeton au format chiffre qui ne se dechiffre pas (mauvaise cle) leve une
 * erreur : EncryptionService.decrypt, lui, renverrait le texte chiffre sans
 * rien signaler, et il partirait alors chez le fournisseur comme un jeton.
 */
export function decryptToken(valeur: string): string {
  if (!isEncryptedToken(valeur)) return valeur;
  const clair = EncryptionService.decrypt(valeur);
  if (clair === valeur) {
    throw new Error('Dechiffrement du jeton OAuth impossible');
  }
  return clair;
}
"""

TEST_TS = r"""import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  decryptToken,
  encryptToken,
  isEncryptedToken,
} from '@/lib/security/oauth-tokens';

const CLE_A = 'a'.repeat(64);
const CLE_B = 'b'.repeat(64);

describe('oauth-tokens', () => {
  const avant = process.env.ENCRYPTION_MASTER_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_MASTER_KEY = CLE_A;
  });

  afterEach(() => {
    if (avant === undefined) delete process.env.ENCRYPTION_MASTER_KEY;
    else process.env.ENCRYPTION_MASTER_KEY = avant;
  });

  it('chiffre puis dechiffre un jeton', () => {
    const clair = 'ya29.jeton-de-test-1234567890';
    const chiffre = encryptToken(clair);
    expect(chiffre).not.toContain(clair);
    expect(isEncryptedToken(chiffre)).toBe(true);
    expect(decryptToken(chiffre)).toBe(clair);
  });

  it('accepte un ancien jeton en clair', () => {
    expect(decryptToken('ya29.ancien-jeton')).toBe('ya29.ancien-jeton');
  });

  it('ne rechiffre pas un jeton deja chiffre', () => {
    const chiffre = encryptToken('jeton');
    expect(encryptToken(chiffre)).toBe(chiffre);
  });

  it('echoue franchement avec une mauvaise cle', () => {
    const chiffre = encryptToken('jeton-secret');
    process.env.ENCRYPTION_MASTER_KEY = CLE_B;
    expect(() => decryptToken(chiffre)).toThrow();
  });

  it('echoue sans cle de chiffrement', () => {
    delete process.env.ENCRYPTION_MASTER_KEY;
    expect(() => encryptToken('jeton')).toThrow();
  });
});
"""

# ---------------------------------------------------------------------------
# Motifs et remplacements
# ---------------------------------------------------------------------------

IMPORT_CRON = "import { requireCronSecret } from '@/lib/security/cron-auth';"
IMPORT_CRON_LECTURE = "import { decryptToken } from '@/lib/security/oauth-tokens';"
IMPORT_CRON_ECRITURE = "import { decryptToken, encryptToken } from '@/lib/security/oauth-tokens';"

IMPORT_ENCRYPTION_ANCIEN = "import { EncryptionService } from '@/lib/security/encryption';"
IMPORT_ENCRYPTION_NOUVEAU = "import { isEncryptionMasterKeyUsable } from '@/lib/security/encryption';"
IMPORT_STATE = "import { verifyOAuthState } from '@/lib/security/oauth-state';"
IMPORTS_AJOUTES = (
    "\nimport { encryptToken } from '@/lib/security/oauth-tokens';"
    "\nimport { auth } from '@/lib/clerk-auth';"
)

INVALID_STATE_BLOCK = (
    "    return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=invalid_state`);\n"
    "  }"
)

SESSION_BLOCK = r"""

  // Le navigateur qui revient du fournisseur doit etre celui de l'utilisateur
  // qui a lance la connexion : le state signe ne suffit pas a le prouver.
  const session = await auth();
  if (
    !session.user ||
    session.user.id !== userId ||
    session.user.tenantId !== tenantId
  ) {
    logger.warn('[@@LABEL@@] Session differente de celle du state');
    return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=session_mismatch`);
  }

  // Les jetons sont chiffres avant stockage : sans cle, on n'echange pas le code.
  if (!isEncryptionMasterKeyUsable(process.env.ENCRYPTION_MASTER_KEY)) {
    logger.error('[@@LABEL@@] ENCRYPTION_MASTER_KEY manquante ou trop courte');
    return NextResponse.redirect(`${baseUrl}/fr/settings/emails?error=server_error`);
  }"""


class Abandon(Exception):
    pass


def sha256(octets: bytes) -> str:
    return hashlib.sha256(octets).hexdigest()


def git(repo: Path, *args: str) -> str:
    try:
        r = subprocess.run(["git", "-C", str(repo), *args],
                           capture_output=True, text=True)
    except OSError:
        return ""
    return r.stdout.strip() if r.returncode == 0 else ""


def lire(repo: Path, rel: str):
    chemin = repo / rel
    if not chemin.is_file():
        raise Abandon(f"fichier introuvable : {rel}")
    brut = chemin.read_bytes()
    try:
        texte = brut.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise Abandon(f"{rel} n'est pas de l'UTF-8 valide : {exc}")
    eol = "\r\n" if "\r\n" in texte else "\n"
    if eol == "\r\n" and texte.count("\n") != texte.count("\r\n"):
        raise Abandon(f"{rel} : fins de ligne melangees (CRLF et LF)")
    return brut, texte.replace("\r\n", "\n"), eol


def verifier_sha(rel: str, brut: bytes) -> None:
    attendu = SHA_ORIGINE[rel]
    reel = sha256(brut)
    if reel != attendu:
        raise Abandon(
            f"{rel} : empreinte differente de la version auditee.\n"
            f"    attendue : {attendu}\n    trouvee  : {reel}\n"
            "    Le fichier a change depuis l'audit : renvoie-moi son contenu.")


def remplacer(texte: str, ancien: str, nouveau: str, attendu: int, rel: str) -> str:
    n = texte.count(ancien)
    if n != attendu:
        raise Abandon(
            f"{rel} : motif trouve {n} fois (attendu {attendu}) :\n    {ancien[:90]!r}")
    return texte.replace(ancien, nouveau)


# ---------------------------------------------------------------------------
# Plans de modification
# ---------------------------------------------------------------------------

def modifier_cron_lecture(repo: Path):
    brut, t, eol = lire(repo, CRON)
    verifier_sha(CRON, brut)
    t = remplacer(t, IMPORT_CRON, IMPORT_CRON + "\n" + IMPORT_CRON_LECTURE, 1, CRON)
    t = remplacer(
        t, "let accessToken = account.accessToken;",
        "let accessToken = account.accessToken ? decryptToken(account.accessToken) : null;",
        1, CRON)
    t = remplacer(
        t, "refresh_token: account.refreshToken,",
        "refresh_token: decryptToken(account.refreshToken),", 2, CRON)
    return CRON, t, eol


def modifier_cron_ecriture(repo: Path):
    brut, t, eol = lire(repo, CRON)
    if t.count(IMPORT_CRON_LECTURE) != 1 or "decryptToken(account.refreshToken)" not in t:
        raise Abandon(f"{CRON} : la phase 1 n'est pas appliquee (lecture tolerante absente).")
    t = remplacer(t, IMPORT_CRON_LECTURE, IMPORT_CRON_ECRITURE, 1, CRON)
    t = remplacer(t, "accessToken: newAccessToken,",
                  "accessToken: encryptToken(newAccessToken),", 1, CRON)
    t = remplacer(t, "{ refreshToken: data.refresh_token }",
                  "{ refreshToken: encryptToken(data.refresh_token) }", 1, CRON)
    return CRON, t, eol


def modifier_callback(repo: Path, rel: str, etiquette: str):
    brut, t, eol = lire(repo, rel)
    verifier_sha(rel, brut)
    t = remplacer(t, IMPORT_ENCRYPTION_ANCIEN, IMPORT_ENCRYPTION_NOUVEAU, 1, rel)
    t = remplacer(t, IMPORT_STATE, IMPORT_STATE + IMPORTS_AJOUTES, 1, rel)
    t = remplacer(t, INVALID_STATE_BLOCK,
                  INVALID_STATE_BLOCK + SESSION_BLOCK.replace("@@LABEL@@", etiquette),
                  1, rel)
    t = remplacer(t, "accessToken: tokens.access_token,",
                  "accessToken: encryptToken(tokens.access_token),", 2, rel)
    t = remplacer(t, "refreshToken: tokens.refresh_token || undefined,",
                  "refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined,",
                  1, rel)
    t = remplacer(t, "refreshToken: tokens.refresh_token || null,",
                  "refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,",
                  1, rel)
    return rel, t, eol


def planifier(repo: Path, phase: int):
    modifs = {}   # rel -> (nouveau_texte, eol, ancien_texte)
    crees = {}    # rel -> texte

    def noter(resultat, ancien_lecteur):
        rel, nouveau, eol = resultat
        _, ancien, _ = ancien_lecteur
        modifs[rel] = (nouveau, eol, ancien)

    if phase == 1:
        for rel, contenu in ((HELPER, HELPER_TS), (TEST, TEST_TS)):
            existant = repo / rel
            if existant.exists():
                if existant.read_text(encoding="utf-8") != contenu:
                    raise Abandon(f"{rel} existe deja avec un contenu different.")
                continue
            crees[rel] = contenu
        noter(modifier_cron_lecture(repo), lire(repo, CRON))
    else:
        if not (repo / HELPER).is_file():
            raise Abandon(f"{HELPER} absent : applique d'abord la phase 1.")
        noter(modifier_cron_ecriture(repo), lire(repo, CRON))
        noter(modifier_callback(repo, GMAIL, "Gmail Connect"), lire(repo, GMAIL))
        noter(modifier_callback(repo, OUTLOOK, "Outlook Connect"), lire(repo, OUTLOOK))
    return modifs, crees


def afficher_diff(modifs, crees) -> None:
    for rel, texte in crees.items():
        print(f"\n+++ CREE : {rel} ({len(texte.splitlines())} lignes)")
    for rel, (nouveau, _eol, ancien) in modifs.items():
        print(f"\n=== MODIFIE : {rel}")
        for ligne in difflib.unified_diff(
                ancien.splitlines(), nouveau.splitlines(),
                f"{rel} (avant)", f"{rel} (apres)", lineterm="", n=2):
            print(ligne)


def ecrire(repo: Path, modifs, crees, sauvegarde: Path) -> None:
    faits = []
    try:
        for rel in modifs:
            dest = sauvegarde / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(repo / rel, dest)
        for rel, (nouveau, eol, _ancien) in modifs.items():
            (repo / rel).write_bytes(nouveau.replace("\n", eol).encode("utf-8"))
            faits.append(("m", rel))
        for rel, texte in crees.items():
            chemin = repo / rel
            chemin.parent.mkdir(parents=True, exist_ok=True)
            chemin.write_bytes(texte.encode("utf-8"))
            faits.append(("c", rel))
    except Exception as exc:  # retour arriere automatique
        for genre, rel in reversed(faits):
            if genre == "m":
                shutil.copy2(sauvegarde / rel, repo / rel)
            else:
                (repo / rel).unlink()
        raise Abandon(f"ecriture interrompue ({type(exc).__name__}: {exc}) ; "
                      "retour arriere effectue.")


def main(argv=None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    ap = argparse.ArgumentParser(description="MemoLib - lot 4 (jetons OAuth).")
    ap.add_argument("--phase", type=int, choices=(1, 2), required=True)
    ap.add_argument("--repo", default=str(REPO_PAR_DEFAUT))
    ap.add_argument("--apply", action="store_true",
                    help="ecrit les fichiers (sinon simulation)")
    ap.add_argument("--allow-main", action="store_true",
                    help="autorise --apply sur la branche main (deconseille)")
    args = ap.parse_args(argv)

    repo = Path(args.repo).expanduser().resolve()
    try:
        if not (repo / ".git").exists():
            raise Abandon(f"{repo} n'est pas un depot Git.")
        branche = git(repo, "rev-parse", "--abbrev-ref", "HEAD")
        head = git(repo, "rev-parse", "--short", "HEAD")
        print(f"Depot   : {repo}")
        print(f"Branche : {branche or '?'}   HEAD : {head or '?'}   phase : {args.phase}")
        if head and not head.startswith(HEAD_ATTENDU):
            print(f"[ATTENTION] HEAD attendu {HEAD_ATTENDU} (version auditee). "
                  "Seules les empreintes ci-dessous decident.")

        modifs, crees = planifier(repo, args.phase)
        afficher_diff(modifs, crees)

        if not args.apply:
            print("\nSIMULATION : rien n'a ete ecrit. Relance avec --apply pour appliquer.")
            return 0

        if branche in ("main", "master") and not args.allow_main:
            raise Abandon("tu es sur la branche main. Cree d'abord une branche "
                          "dediee (git switch -c <nom>) puis relance.")

        sauvegarde = (Path.home() / "backups_lot4"
                      / datetime.datetime.now().strftime("%Y%m%d_%H%M%S"))
        ecrire(repo, modifs, crees, sauvegarde)
        print(f"\nSauvegarde : {sauvegarde}")
        print("Ecrit      : " + ", ".join(list(crees) + list(modifs)))
        print("\nPour annuler les fichiers modifies : recopie-les depuis la sauvegarde ;")
        print("les fichiers crees se suppriment avec rm.")
        print("Le script n'a lance ni test, ni commit, ni push.")
        return 0
    except Abandon as exc:
        print(f"\n[ABANDON] {exc}")
        print("Aucun fichier n'a ete modifie.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
