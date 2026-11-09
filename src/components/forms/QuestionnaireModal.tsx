'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui';

interface QuestionnaireQuestion {
  id: string;
  label: string;
  type: 'text' | 'boolean' | 'date' | 'select';
  required: boolean;
  options?: string[];
}

interface QuestionnairePayload {
  id: string;
  title: string;
  description: string;
  questions: QuestionnaireQuestion[];
}

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  eventId: string | null;
  caseId?: string;
  onSubmitted?: () => void;
}

export default function QuestionnaireModal({
  isOpen,
  onClose,
  tenantId,
  eventId,
  caseId,
  onSubmitted,
}: QuestionnaireModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [questionnaire, setQuestionnaire] = useState<QuestionnairePayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | boolean | number>>({});

  useEffect(() => {
    if (!isOpen || !eventId) {
      return;
    }

    let cancelled = false;

    async function loadQuestionnaire() {
      setLoading(true);
      setError(null);
      setQuestionnaire(null);
      setAnswers({});

      try {
        const response = await fetch(`/api/questionnaire/for-event/${eventId}?tenantId=${tenantId}`);
        if (!response.ok) {
          throw new Error('Impossible de charger le questionnaire');
        }

        const payload = await response.json();
        if (cancelled) {
          return;
        }

        const nextQuestionnaire = payload?.questionnaire as QuestionnairePayload;
        setQuestionnaire(nextQuestionnaire);

        const initialAnswers: Record<string, string | boolean | number> = {};
        for (const question of nextQuestionnaire?.questions || []) {
          initialAnswers[question.id] = question.type === 'boolean' ? false : '';
        }
        setAnswers(initialAnswers);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Erreur de chargement');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuestionnaire();

    return () => {
      cancelled = true;
    };
  }, [isOpen, eventId, tenantId]);

  const requiredMissing = useMemo(() => {
    if (!questionnaire) {
      return [] as string[];
    }

    return questionnaire.questions
      .filter((question) => question.required)
      .filter((question) => {
        const value = answers[question.id];
        if (question.type === 'boolean') {
          return value === undefined;
        }
        return value === undefined || value === '';
      })
      .map((question) => question.label);
  }, [questionnaire, answers]);

  const updateAnswer = (questionId: string, value: string | boolean | number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const submit = async () => {
    if (!questionnaire || !eventId) {
      return;
    }

    if (requiredMissing.length > 0) {
      setError(`Questions obligatoires manquantes: ${requiredMissing.join(', ')}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/questionnaire/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          questionnaireId: questionnaire.id,
          caseId,
          eventId,
          answers,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Erreur de soumission');
      }

      onSubmitted?.();
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erreur de soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: QuestionnaireQuestion) => {
    const value = answers[question.id];

    if (question.type === 'text') {
      return (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(event) => updateAnswer(question.id, event.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      );
    }

    if (question.type === 'date') {
      return (
        <input
          type="date"
          value={String(value ?? '')}
          onChange={(event) => updateAnswer(question.id, event.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      );
    }

    if (question.type === 'boolean') {
      return (
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateAnswer(question.id, event.target.checked)}
          />
          Oui
        </label>
      );
    }

    return (
      <select
        value={String(value ?? '')}
        onChange={(event) => updateAnswer(question.id, event.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
      >
        <option value="">Sélectionner</option>
        {(question.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={questionnaire?.title || 'Questionnaire'} size="md">
      {loading ? <p className="text-sm text-gray-600">Chargement du questionnaire...</p> : null}
      {!loading && error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

      {!loading && questionnaire ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{questionnaire.description}</p>

          <div className="space-y-4">
            {questionnaire.questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {question.label}
                  {question.required ? ' *' : ''}
                </label>
                {renderQuestionInput(question)}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={submitting}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submit}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Envoi...' : 'Valider le questionnaire'}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
