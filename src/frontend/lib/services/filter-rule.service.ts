/**
 * FilterRuleService - Service de filtrage email automatique (Phase 3)
 *
 * Évalue des règles de filtrage pour router automatiquement les emails
 * vers dossiers, clients, catégories selon conditions (from, subject, etc.)
 *
 * @example
 * ```ts
 * const service = new FilterRuleService();
 * const matches = await service.evaluateAllRules(email, tenantId);
 * for (const match of matches) {
 *   await service.applyActions(email.id, match.rule);
 * }
 * ```
 */

import { PrismaClient, FilterRule, Email } from '@prisma/client';
import { eventLogService } from '../../../lib/services/event-log.service';

export type FilterCondition = {
  field: 'from' | 'to' | 'subject' | 'body' | 'category' | 'urgency' | 'sentiment';
  operator: 'EQUALS' | 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'REGEX' | 'IN' | 'NOT_IN';
  value: string | string[];
};

export type FilterAction = {
  type:
    | 'ASSIGN_DOSSIER'
    | 'ASSIGN_CLIENT'
    | 'SET_CATEGORY'
    | 'SET_URGENCY'
    | 'SET_TAGS'
    | 'MARK_STARRED'
    | 'ARCHIVE'
    | 'NOTIFY_USER'
    | 'TRIGGER_WORKFLOW';
  dossierId?: string;
  clientId?: string;
  value?: string;
  userId?: string;
  workflowId?: string;
};

export type RuleMatch = {
  rule: FilterRule;
  matchedConditions: string[]; // Liste des champs qui ont matché
  confidence: number; // 0-1 (% conditions matchées)
};

export class FilterRuleService {
  constructor(private prisma: PrismaClient = new PrismaClient()) {}

  /**
   * Évalue toutes les règles actives pour un email donné
   * Retourne les règles qui matchent, triées par priorité
   */
  async evaluateAllRules(email: Email, tenantId: string): Promise<RuleMatch[]> {
    const rules = await this.prisma.filterRule.findMany({
      where: {
        tenantId,
        enabled: true,
      },
      orderBy: {
        priority: 'asc', // Plus bas = plus prioritaire
      },
    });

    const matches: RuleMatch[] = [];

    for (const rule of rules) {
      const match = this.evaluateRule(email, rule);
      if (match) {
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * Évalue une règle contre un email
   * Retourne RuleMatch si toutes les conditions sont remplies, null sinon
   */
  private evaluateRule(email: Email, rule: FilterRule): RuleMatch | null {
    const conditions = rule.conditions as FilterCondition[];
    const matchedConditions: string[] = [];

    for (const condition of conditions) {
      if (this.evaluateCondition(email, condition)) {
        matchedConditions.push(condition.field);
      }
    }

    // Si toutes conditions matchent, c'est un succès
    if (matchedConditions.length === conditions.length) {
      return {
        rule,
        matchedConditions,
        confidence: 1.0,
      };
    }

    return null;
  }

  /**
   * Évalue une condition individuelle
   */
  private evaluateCondition(email: Email, condition: FilterCondition): boolean {
    const fieldValue = this.getFieldValue(email, condition.field);
    if (!fieldValue) return false;

    switch (condition.operator) {
      case 'EQUALS':
        return fieldValue.toLowerCase() === (condition.value as string).toLowerCase();

      case 'CONTAINS':
        return fieldValue.toLowerCase().includes((condition.value as string).toLowerCase());

      case 'STARTS_WITH':
        return fieldValue.toLowerCase().startsWith((condition.value as string).toLowerCase());

      case 'ENDS_WITH':
        return fieldValue.toLowerCase().endsWith((condition.value as string).toLowerCase());

      case 'REGEX':
        try {
          const regex = new RegExp(condition.value as string, 'i');
          return regex.test(fieldValue);
        } catch {
          return false;
        }

      case 'IN':
        return (condition.value as string[]).some(
          v => v.toLowerCase() === fieldValue.toLowerCase()
        );

      case 'NOT_IN':
        return !(condition.value as string[]).some(
          v => v.toLowerCase() === fieldValue.toLowerCase()
        );

      default:
        return false;
    }
  }

  /**
   * Récupère la valeur d'un champ email
   */
  private getFieldValue(email: Email, field: FilterCondition['field']): string | null {
    switch (field) {
      case 'from':
        return email.from;
      case 'to':
        return email.to;
      case 'subject':
        return email.subject;
      case 'body':
        return email.body;
      case 'category':
        return email.category;
      case 'urgency':
        return email.urgency;
      case 'sentiment':
        return email.sentiment;
      default:
        return null;
    }
  }

  /**
   * Applique les actions d'une règle à un email
   * Met à jour l'email en DB et trace avec EventLog
   */
  async applyActions(emailId: string, rule: FilterRule, tenantId: string): Promise<void> {
    const actions = rule.actions as FilterAction[];

    const updateData: any = {};

    for (const action of actions) {
      switch (action.type) {
        case 'ASSIGN_DOSSIER':
          if (action.dossierId) {
            updateData.dossierId = action.dossierId;
          }
          break;

        case 'ASSIGN_CLIENT':
          if (action.clientId) {
            updateData.clientId = action.clientId;
          }
          break;

        case 'SET_CATEGORY':
          if (action.value) {
            updateData.category = action.value;
          }
          break;

        case 'SET_URGENCY':
          if (action.value) {
            updateData.urgency = action.value;
          }
          break;

        case 'SET_TAGS':
          if (action.value) {
            updateData.tags = action.value;
          }
          break;

        case 'MARK_STARRED':
          updateData.isStarred = true;
          break;

        case 'ARCHIVE':
          updateData.isArchived = true;
          break;

        case 'NOTIFY_USER':
          // TODO: implémenter notification
          break;

        case 'TRIGGER_WORKFLOW':
          // TODO: implémenter trigger workflow
          break;
      }
    }

    // Mettre à jour email
    await this.prisma.email.update({
      where: { id: emailId },
      data: updateData,
    });

    // Mettre à jour stats de la règle
    await this.prisma.filterRule.update({
      where: { id: rule.id },
      data: {
        matchCount: { increment: 1 },
        lastMatchedAt: new Date(),
        lastMatchedBy: emailId,
      },
    });

    // Tracer avec EventLog
    await eventLogService.createEventLog({
      eventType: 'RULE_APPLIED',
      entityType: 'email',
      entityId: emailId,
      actorType: 'SYSTEM',
      tenantId,
      metadata: {
        ruleId: rule.id,
        ruleName: rule.name,
        actions: actions.map(a => a.type),
        appliedChanges: Object.keys(updateData),
      },
    });
  }

  /**
   * Trace une règle qui n'a pas matché (optionnel, pour debug)
   */
  async logSkippedRule(
    emailId: string,
    rule: FilterRule,
    reason: string,
    tenantId: string
  ): Promise<void> {
    await eventLogService.createEventLog({
      eventType: 'RULE_SKIPPED',
      entityType: 'email',
      entityId: emailId,
      actorType: 'SYSTEM',
      tenantId,
      metadata: {
        ruleId: rule.id,
        ruleName: rule.name,
        reason,
      },
    });
  }

  /**
   * Valide une règle avant création/update
   */
  validateRule(rule: Partial<FilterRule>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.name || rule.name.trim().length === 0) {
      errors.push('Le nom de la règle est requis');
    }

    if (!rule.conditions) {
      errors.push('Au moins une condition est requise');
    } else {
      const conditions = rule.conditions as FilterCondition[];
      if (!Array.isArray(conditions) || conditions.length === 0) {
        errors.push('Au moins une condition est requise');
      } else {
        conditions.forEach((c, i) => {
          if (!c.field) errors.push(`Condition ${i + 1}: champ manquant`);
          if (!c.operator) errors.push(`Condition ${i + 1}: opérateur manquant`);
          if (!c.value) errors.push(`Condition ${i + 1}: valeur manquante`);
        });
      }
    }

    if (!rule.actions) {
      errors.push('Au moins une action est requise');
    } else {
      const actions = rule.actions as FilterAction[];
      if (!Array.isArray(actions) || actions.length === 0) {
        errors.push('Au moins une action est requise');
      } else {
        actions.forEach((a, i) => {
          if (!a.type) errors.push(`Action ${i + 1}: type manquant`);
          if (a.type === 'ASSIGN_DOSSIER' && !a.dossierId) {
            errors.push(`Action ${i + 1}: dossierId requis`);
          }
          if (a.type === 'ASSIGN_CLIENT' && !a.clientId) {
            errors.push(`Action ${i + 1}: clientId requis`);
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const filterRuleService = new FilterRuleService();
