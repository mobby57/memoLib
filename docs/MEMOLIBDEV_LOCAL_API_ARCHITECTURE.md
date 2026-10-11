# MemoLibDev - Architecture cible de l'API locale

> Statut : decision d'architecture ; implementation repoussee apres les benchmarks  
> Date : 7 octobre 2026

## Decision

Le moteur Python existant est la seule autorite d'execution. Les clients - CLI,
future application Tauri et eventuelle interface web - ne font qu'appeler une API
locale exposee par le moteur. Aucun client ne peut appeler un outil, lire un depot,
lancer un processus ou contourner les etapes D5.8/D5.9 par lui-meme.

```text
CLI / Tauri / Web
       |
       v
API locale MemoLibDev
       |
       v
MemoLibDev Core Python
run_from_mission()
       |
       +--> contexte, Evidence Gate, politiques, approbations
       +--> runner sandbox, Ollama local, verification
```

## Invariants de securite

1. `run_from_mission()` reste le point d'entree unique de toute execution.
2. L'API accepte une mission structuree, jamais une commande shell arbitraire.
3. D5.8/D5.9 restent obligatoires, y compris depuis la CLI et Tauri.
4. Une approbation est emise et verifiee par le Core ; l'UI ne peut pas la forger.
5. Les transitions et preuves sont produites par le Core puis exposees en lecture aux
   clients.
6. L'API ecoute uniquement sur loopback par defaut, avec authentification locale et
   permissions minimisees.
7. Les secrets et acces fichiers restent dans le Core ou dans un adaptateur
   explicitement autorise ; ils ne transitent pas vers la vue Tauri.

## Contrat d'API propose

Les chemins ci-dessous sont un contrat cible, pas des routes implementees.

| Operation | Methode et chemin | Autorite et effet |
| --- | --- | --- |
| Creer une mission | `POST /v1/missions` | Core ; cree une mission au niveau Observer |
| Lire une mission | `GET /v1/missions/{id}` | Lecture seule ; expose etat, preuves et blocages |
| Preparer | `POST /v1/missions/{id}/prepare` | Core ; exige les preuves minimales |
| Tester | `POST /v1/missions/{id}/test` | Core ; passe exclusivement par le runner sandbox |
| Demander une approbation | `POST /v1/missions/{id}/approval-requests` | Core ; produit une demande lisible et signee |
| Approuver ou refuser | `POST /v1/missions/{id}/approvals` | Core ; valide l'identite et trace la decision |
| Executer | `POST /v1/missions/{id}/execute` | Core ; seulement apres D5.8/D5.9 et approbation valide |

Les payloads doivent etre schemas et versionnes. Les reponses doivent inclure
`missionId`, `state`, `evidence`, `policyDecision`, `approvalStatus`, `auditRef` et
les erreurs explicites de blocage. Les logs ne doivent contenir ni contenu de depot,
ni identifiants, ni secret.

## Separation des responsabilites

| Composant | Responsabilite | Ne doit jamais faire |
| --- | --- | --- |
| Core Python | Mission, politiques, contexte, preuves, execution et audit | Faire confiance a une decision provenant uniquement de l'UI |
| API locale | Validation du contrat, authentification locale et mapping vers le Core | Executer une commande arbitraire |
| CLI | Saisie et affichage du resultat | Acceder directement au runner |
| Tauri futur | Experience desktop, notifications et presentation de l'approbation | Devenir une seconde autorite d'execution |
| Web futur | Consultation et delegation eventuelle | Recevoir secrets ou acces filesystem directs |

## Roadmap respectee

```text
Mesure 5A
  -> Benchmark 30
  -> 5.2
  -> 5.3
  -> Evidence Gate
  -> Benchmark 50/100
  -> API locale
  -> Tauri + React
```

L'API locale ne sera implementee qu'apres les benchmarks prevus. Cela preserve la
mesure du moteur actuel et evite de confondre progression produit et reecriture
technique.
