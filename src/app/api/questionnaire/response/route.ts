import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getTemplateForEvent, QUESTIONNAIRE_TEMPLATES } from '@/lib/questionnaire/templates';

const bodySchema = z.object({
  tenantId: z.string().min(1),
  questionnaireId: z.string().min(1),
  caseId: z.string().optional(),
  eventId: z.string().optional(),
  answers: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide', details: parsed.error.flatten() }, { status: 400 });
    }

    const payload = parsed.data;

    const template = QUESTIONNAIRE_TEMPLATES.find(item => item.id === payload.questionnaireId) ||
      getTemplateForEvent('email-client');

    const requiredQuestionIds = template.questions
      .filter(question => question.required)
      .map(question => question.id);

    const missingRequired = requiredQuestionIds.filter(questionId =>
      payload.answers[questionId] === undefined || payload.answers[questionId] === ''
    );

    if (missingRequired.length > 0) {
      return NextResponse.json(
        { error: 'Questions obligatoires non renseignées', missingRequired },
        { status: 400 }
      );
    }

    const execution = await prisma.workflowExecution.create({
      data: {
        tenantId: payload.tenantId,
        workflowId: `questionnaire-${template.id}`,
        workflowName: `Questionnaire ${template.title}`,
        emailId: payload.eventId,
        triggerType: 'questionnaire-response',
        status: 'completed',
        progress: 100,
        startedAt: new Date(),
        completedAt: new Date(),
        triggerData: JSON.stringify({
          caseId: payload.caseId,
          eventId: payload.eventId,
          questionnaireId: payload.questionnaireId,
          answers: payload.answers,
        }),
        result: JSON.stringify({
          valid: true,
          requiredCount: requiredQuestionIds.length,
          answeredCount: Object.keys(payload.answers).length,
        }),
      },
      select: {
        id: true,
        workflowId: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Réponses enregistrées',
      responseId: execution.id,
      workflow: execution,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
