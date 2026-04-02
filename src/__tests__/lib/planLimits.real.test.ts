/**
 * Tests pour src/lib/planLimits.ts - Import réel
 * Coverage: Types et enums du système de limites
 */

// Import réel des types et enums
import { AIAction } from '@/lib/planLimits';

describe('Plan Limits - Real Imports', () => {
  describe('AIAction enum', () => {
    it('should have all action types defined', () => {
      expect(AIAction.SORT_MESSAGES).toBe('SORT_MESSAGES');
      expect(AIAction.PRIORITIZE).toBe('PRIORITIZE');
      expect(AIAction.REQUEST_DOCUMENTS).toBe('REQUEST_DOCUMENTS');
      expect(AIAction.GENERATE_DRAFT).toBe('GENERATE_DRAFT');
      expect(AIAction.AUTO_REMINDER).toBe('AUTO_REMINDER');
      expect(AIAction.ARCHIVE).toBe('ARCHIVE');
    });

    it('should have level 2+ actions', () => {
      expect(AIAction.ANALYZE_RISK).toBe('ANALYZE_RISK');
      expect(AIAction.SUGGEST_ACTIONS).toBe('SUGGEST_ACTIONS');
    });

    it('should have level 3+ actions', () => {
      expect(AIAction.AUTO_REPLY_CLIENT).toBe('AUTO_REPLY_CLIENT');
      expect(AIAction.GENERATE_FORM).toBe('GENERATE_FORM');
    });

    it('should have level 4 actions', () => {
      expect(AIAction.ADVANCED_ANALYTICS).toBe('ADVANCED_ANALYTICS');
      expect(AIAction.EXTERNAL_AI_CALL).toBe('EXTERNAL_AI_CALL');
    });

    it('should have forbidden actions', () => {
      expect(AIAction.VALIDATE_LEGAL_ACT).toBe('VALIDATE_LEGAL_ACT');
      expect(AIAction.SEND_OFFICIAL_DOCUMENT).toBe('SEND_OFFICIAL_DOCUMENT');
      expect(AIAction.CHOOSE_LEGAL_STRATEGY).toBe('CHOOSE_LEGAL_STRATEGY');
      expect(AIAction.COMMIT_CABINET).toBe('COMMIT_CABINET');
    });

    it('should have correct number of actions', () => {
      const allActions = Object.values(AIAction);
      expect(allActions.length).toBeGreaterThanOrEqual(14);
    });
  });
});
