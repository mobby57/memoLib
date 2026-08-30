/**
 * Module Comptabilité - Inspiré Sage
 * 
 * Architecture :
 * - plan-comptable.service.ts : Gestion du plan comptable (CRUD comptes)
 * - ecritures.service.ts : Création/validation des écritures comptables
 * - auto-ecritures.service.ts : Génération automatique (facture→écriture, paiement→écriture)
 * - rapprochement.service.ts : Rapprochement bancaire (import + matching IA)
 * - tva.service.ts : Calcul et déclaration TVA
 * - carpa.service.ts : Gestion des fonds clients CARPA
 * - reporting.service.ts : Grand livre, balance, compte de résultat, export FEC
 */

export { PlanComptableService } from './plan-comptable.service';
export { EcrituresService } from './ecritures.service';
export { AutoEcrituresService } from './auto-ecritures.service';
export { RapprochementService } from './rapprochement.service';
export { TVAService } from './tva.service';
export { CARPAService } from './carpa.service';
export { ReportingService } from './reporting.service';
