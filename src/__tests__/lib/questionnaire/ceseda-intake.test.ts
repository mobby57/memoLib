import { describe, it, expect } from 'vitest';
import { ProcedureType } from '@/types/cesda';
import {
  CESEDA_INTAKE_SECTIONS,
  CESEDA_SECTION_BY_PROCEDURE,
  CESEDA_BLOCKING_POINTS,
  CESEDA_AGENT_SAFETY_RULES,
  CESEDA_CLIENT_NEEDS,
  CESEDA_CROSS_CUTTING_NEEDS,
  CESEDA_LAWYER_EXPECTATIONS,
  CESEDA_CLIENT_JOURNEY,
  CESEDA_PILOT_PARCOURS,
  buildCesedaIntake,
  getDeadlineTriggerQuestions,
  getBlockingPointsByPriority,
} from '@/lib/questionnaire/ceseda-intake';

describe('CESEDA intake question base', () => {
  it('exposes a common section plus the five main procedures', () => {
    const procedures = CESEDA_INTAKE_SECTIONS.map((s) => s.procedure);
    expect(procedures).toContain('COMMON');
    expect(procedures).toContain(ProcedureType.OQTF);
    expect(procedures).toContain(ProcedureType.REFUS_TITRE);
    expect(procedures).toContain(ProcedureType.ASILE);
    expect(procedures).toContain(ProcedureType.REGROUPEMENT_FAMILIAL);
    expect(procedures).toContain(ProcedureType.NATURALISATION);
  });

  it('has globally unique question ids', () => {
    const ids = CESEDA_INTAKE_SECTIONS.flatMap((s) => s.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every question has a non-empty label and valid type', () => {
    const validTypes = ['text', 'textarea', 'boolean', 'date', 'select'];
    for (const section of CESEDA_INTAKE_SECTIONS) {
      for (const q of section.questions) {
        expect(q.label.trim().length).toBeGreaterThan(0);
        expect(validTypes).toContain(q.type);
        if (q.type === 'select') {
          expect(Array.isArray(q.options) && q.options.length > 0).toBe(true);
        }
      }
    }
  });

  it('places the urgent OQTF section before the common section', () => {
    const sections = buildCesedaIntake(ProcedureType.OQTF);
    expect(sections[0].procedure).toBe(ProcedureType.OQTF);
    expect(sections[1].procedure).toBe('COMMON');
  });

  it('places non-urgent procedures after the common section', () => {
    const sections = buildCesedaIntake(ProcedureType.ASILE);
    expect(sections[0].procedure).toBe('COMMON');
    expect(sections[1].procedure).toBe(ProcedureType.ASILE);
  });

  it('always captures a notification/decision date as a deadline trigger', () => {
    // The core business requirement: detect a received administrative decision + date.
    const commonTriggers = getDeadlineTriggerQuestions();
    const ids = commonTriggers.map((q) => q.id);
    expect(ids).toContain('decisionRecue');
    expect(ids).toContain('dateNotificationDecision');
    // Every deadline-trigger question must be flagged accordingly.
    expect(commonTriggers.every((q) => q.deadlineTrigger === true)).toBe(true);
    expect(commonTriggers.length).toBeGreaterThan(0);
  });

  it('each main procedure resolves to a dedicated section', () => {
    for (const proc of [
      ProcedureType.OQTF,
      ProcedureType.REFUS_TITRE,
      ProcedureType.ASILE,
      ProcedureType.REGROUPEMENT_FAMILIAL,
      ProcedureType.NATURALISATION,
    ]) {
      expect(CESEDA_SECTION_BY_PROCEDURE[proc]).toBeDefined();
      expect(getDeadlineTriggerQuestions(proc).length).toBeGreaterThan(0);
    }
  });
});

describe('CESEDA blocking points & safety rules', () => {
  it('has unique blocking-point ids with valid priorities', () => {
    const ids = CESEDA_BLOCKING_POINTS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of CESEDA_BLOCKING_POINTS) {
      expect(['P0', 'P1', 'P2']).toContain(b.priority);
      expect(b.blockage.length).toBeGreaterThan(0);
      expect(b.feature.length).toBeGreaterThan(0);
      expect(b.validation.length).toBeGreaterThan(0);
    }
  });

  it('flags recours delays, multi-decision orientation and AI error as P0', () => {
    const p0 = getBlockingPointsByPriority('P0').map((b) => b.id);
    expect(p0).toContain('delais-recours');
    expect(p0).toContain('mauvaise-orientation');
    expect(p0).toContain('erreur-ia');
  });

  it('defines non-empty agent safety rules including the human-decision guardrail', () => {
    expect(CESEDA_AGENT_SAFETY_RULES.length).toBeGreaterThanOrEqual(5);
    const joined = CESEDA_AGENT_SAFETY_RULES.join(' ').toLowerCase();
    expect(joined).toContain('avocat');
    expect(joined).toContain('rgpd');
    // Core guardrail: a blockage is not a legal refusal.
    expect(joined).toContain("n'est pas");
  });

  it('OQTF notification question carries versioned legal metadata', () => {
    const oqtf = CESEDA_SECTION_BY_PROCEDURE[ProcedureType.OQTF]!;
    const notif = oqtf.questions.find((q) => q.id === 'oqtf_dateNotification')!;
    expect(notif.deadlineTrigger).toBe(true);
    expect(notif.legalReferences && notif.legalReferences.length).toBeGreaterThan(0);
    expect(notif.urgencyRule && notif.urgencyRule.length).toBeGreaterThan(0);
    expect(notif.legalVersionDate).toBeDefined();
  });
});

describe('CESEDA client needs & pilot parcours', () => {
  it('covers the eight client demands with unique ids and mapped features', () => {
    expect(CESEDA_CLIENT_NEEDS.length).toBe(8);
    const ids = CESEDA_CLIENT_NEEDS.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const n of CESEDA_CLIENT_NEEDS) {
      expect(n.expressed.length).toBeGreaterThan(0);
      expect(n.realNeed.length).toBeGreaterThan(0);
      expect(n.feature.length).toBeGreaterThan(0);
      expect(n.procedures.length).toBeGreaterThan(0);
    }
  });

  it('every client-need procedure maps to a real section or COMMON', () => {
    const known = new Set<string>(['COMMON', ...Object.values(ProcedureType)]);
    for (const n of CESEDA_CLIENT_NEEDS) {
      for (const p of n.procedures) {
        expect(known.has(p as string)).toBe(true);
      }
    }
  });

  it('defines cross-cutting needs and lawyer expectations', () => {
    expect(CESEDA_CROSS_CUTTING_NEEDS.length).toBeGreaterThanOrEqual(6);
    expect(CESEDA_LAWYER_EXPECTATIONS.length).toBeGreaterThanOrEqual(8);
    for (const e of CESEDA_LAWYER_EXPECTATIONS) {
      expect(e.need.length).toBeGreaterThan(0);
      expect(e.response.length).toBeGreaterThan(0);
    }
  });

  it('defines a 5-step client journey where IA qualifies and avocat validates', () => {
    expect(CESEDA_CLIENT_JOURNEY.map((s) => s.step)).toEqual([1, 2, 3, 4, 5]);
    const actors = CESEDA_CLIENT_JOURNEY.map((s) => s.actor);
    expect(actors).toContain('ia');
    expect(actors).toContain('avocat');
  });

  it('defines three pilot parcours resolving to real procedures', () => {
    expect(CESEDA_PILOT_PARCOURS.length).toBe(3);
    const procs = Object.values(ProcedureType);
    for (const p of CESEDA_PILOT_PARCOURS) {
      expect(procs).toContain(p.procedure);
      expect(buildCesedaIntake(p.procedure).length).toBeGreaterThan(0);
    }
    // Pilot #1 must be the OQTF urgency parcours.
    expect(CESEDA_PILOT_PARCOURS[0].procedure).toBe(ProcedureType.OQTF);
  });
});
