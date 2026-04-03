# DOTNET A-001 Diagnostic de Compilation

Date: 2026-04-03
Contexte: stabilisation .NET (A-001 du plan technique)

## Resume executif

Le projet .NET compile actuellement contre une arborescence incoherente:

- une partie des sources compile sans les classes de donnees essentielles
- une autre partie compile avec des doublons massifs de types/methodes

Resultat: `dotnet build` et `dotnet run` echouent.

## Commandes executees

1. Build depuis le dossier projet:

- `Set-Location MemoLib.Api; dotnet build`

2. Build explicite depuis la racine:

- `dotnet build MemoLib.Api.csproj`

## Constat principal

### Cas A - Sources data absentes dans le scope actif

Symptomes:

- erreurs CS0234 sur `MemoLib.Api.Data`
- erreurs CS0246 sur `MemoLibDbContext`

Interpretation:

- le scope compile actif ne voit pas la couche Data requise.

### Cas B - Doublons de compilation

Symptomes:

- erreurs CS0111 (membres definis en double)
- erreurs CS0101 (types deja definis)
- classes compilees simultanement depuis plusieurs arbres (ex. `Services` et `MemoLib.Api/Services`)

Interpretation:

- le projet inclut des sources dupliquees (racine + copie de repo imbriquee), ce qui casse la compilation.

## Cause racine probable

La racine de workspace contient des copies imbriquees du projet (dont un dossier `MemoLib.Api` qui ressemble a une copie quasi complete du repo). Le fichier csproj racine applique les includes par defaut et attrape des arbres non voulus.

## Impact

- API non demarrable localement
- tests backend non fiables
- risque de regressions masquees par conflit de sources

## Decision technique recommandee (A-002)

Choisir un seul arbre source canonique pour l'API, puis verrouiller le csproj.

Option recommandee:

1. Isoler un dossier source unique (ex: racine API canonique).
2. Desactiver les includes implicites de compilation.
3. Declarer explicitement les includes `Compile Include="..."`.
4. Exclure formellement les copies imbriquees (`MemoLib.Api/**`, `MemoLib.Api-cleanpush/**` si non canonique).

## Plan d'execution immediat

1. Inventaire des fichiers .cs par arbre.
2. Selection arbre canonique et validation equipe.
3. Patch csproj minimal pour verrouiller le scope.
4. Validation:
   - `dotnet clean`
   - `dotnet build`
   - `dotnet run`

## Critere de succes A-001

- diagnostic documente
- cause racine explicitee
- plan de correction A-002 pret a executer
