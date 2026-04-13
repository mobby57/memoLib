import { classifyEmail, type EmailClassification } from '@/lib/classifiers/email-classifier';

export interface LegalCaseDraft {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  caseType?: string;
  deadline?: string;
  rawContent: string;
  confidence: Record<string, number>;
  classification: EmailClassification;
}

interface EmailInput {
  from: string;
  subject: string;
  body: string;
  receivedAt?: Date;
}

export function extractDraft(email: EmailInput): LegalCaseDraft {
  const emailMatch = email.from.match(/[\w.-]+@[\w.-]+/);
  const phoneMatch = email.body.match(/(?:\+33|0)[1-9]\d{8}/);
  const classification = classifyEmail(email.subject, email.body);

  return {
    clientEmail: emailMatch?.[0],
    clientPhone: phoneMatch?.[0],
    caseType: classification.caseType,
    rawContent: `${email.subject}\n${email.body}`,
    confidence: {
      clientEmail: emailMatch ? 0.9 : 0,
      clientPhone: phoneMatch ? 0.8 : 0,
      caseType: classification.confidence,
    },
    classification,
  };
}
